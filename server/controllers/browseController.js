/**
 * browseController.js — Paginated browsing with filters
 *
 * GET /api/browse/:type?page=1&year=&rating_min=&rating_max=&genres=
 *
 * Supports: movie, tvshow, anime
 * Each page returns 25 items.
 */
const tmdbService    = require('../services/tmdbService');
const anilistService = require('../services/anilistService');
const NodeCache      = require('node-cache');

const browseCache = new NodeCache({ stdTTL: 600 }); // 10 min cache

// ── TMDB genre ID maps ─────────────────────────────────────────────────
const TMDB_MOVIE_GENRES = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
  'Documentary': 99, 'Drama': 18, 'Family': 10751, 'Fantasy': 14, 'History': 36,
  'Horror': 27, 'Music': 10402, 'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
  'Thriller': 53, 'War': 10752, 'Western': 37,
};
const TMDB_TV_GENRES = {
  'Action & Adventure': 10759, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
  'Documentary': 99, 'Drama': 18, 'Family': 10751, 'Kids': 10762,
  'Mystery': 9648, 'Reality': 10764, 'Sci-Fi & Fantasy': 10765,
  'War & Politics': 10768, 'Western': 37,
};
const ANILIST_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
];

// GET /api/browse/genres/:type — returns available genres for a type
const getGenres = (req, res) => {
  const { type } = req.params;
  if (type === 'movie') return res.json({ genres: Object.keys(TMDB_MOVIE_GENRES) });
  if (type === 'tvshow') return res.json({ genres: Object.keys(TMDB_TV_GENRES) });
  if (type === 'anime') return res.json({ genres: ANILIST_GENRES });
  return res.status(400).json({ error: 'Invalid type' });
};

// GET /api/browse/:type
const browse = async (req, res) => {
  const { type } = req.params;
  const page      = Math.max(1, parseInt(req.query.page) || 1);
  const year      = req.query.year ? parseInt(req.query.year) : null;
  const ratingMin = req.query.rating_min ? parseFloat(req.query.rating_min) : null;
  const ratingMax = req.query.rating_max ? parseFloat(req.query.rating_max) : null;
  const genres    = req.query.genres ? req.query.genres.split(',').map(g => g.trim()) : [];
  const adult     = req.query.adult === 'true';

  const cacheKey = `browse:${type}:${page}:${year}:${ratingMin}:${ratingMax}:${genres.join(',')}:${adult}`;
  const cached = browseCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    let result;
    if (type === 'movie' || type === 'tvshow') {
      result = await browseTmdb(type, page, year, ratingMin, ratingMax, genres, adult);
    } else if (type === 'anime') {
      result = await browseAnilist(page, year, ratingMin, ratingMax, genres, adult);
    } else {
      return res.status(400).json({ error: 'Invalid type. Use: movie, tvshow, anime' });
    }

    browseCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Browse error:', error.message);
    res.status(500).json({ error: 'Failed to browse. Please try again.' });
  }
};

// ── TMDB discover endpoint ──────────────────────────────────────────────────
async function browseTmdb(type, page, year, ratingMin, ratingMax, genres, adult) {
  const axios     = require('axios');
  const { normalizeTmdb } = require('../services/normalizer');
  const BASE_URL  = 'https://api.themoviedb.org/3';
  const endpoint  = type === 'movie' ? '/discover/movie' : '/discover/tv';
  const genreMap  = type === 'movie' ? TMDB_MOVIE_GENRES : TMDB_TV_GENRES;

  const params = {
    api_key: process.env.TMDB_API_KEY,
    sort_by: 'popularity.desc',
    page,
    'vote_count.gte': 50, // filter out obscure titles
    include_adult: adult,
  };

  if (year) {
    if (type === 'movie') params.primary_release_year = year;
    else params.first_air_date_year = year;
  }
  if (ratingMin !== null) params['vote_average.gte'] = ratingMin;
  if (ratingMax !== null) params['vote_average.lte'] = ratingMax;
  if (genres.length > 0) {
    const ids = genres.map(g => genreMap[g]).filter(Boolean);
    if (ids.length > 0) params.with_genres = ids.join(',');
  }

  const { data } = await axios.get(`${BASE_URL}${endpoint}`, { params, timeout: 10000 });

  // TMDB discover doesn't set media_type, so we need to set it
  const results = (data.results || []).map(item => {
    item.media_type = type === 'movie' ? 'movie' : 'tv';
    return normalizeTmdb(item);
  });

  return {
    results,
    page: data.page,
    totalPages: Math.min(data.total_pages || 1, 500), // TMDB caps at 500
    totalResults: data.total_results || 0,
  };
}

// ── AniList browse with filters ────────────────────────────────────────────
async function browseAnilist(page, year, ratingMin, ratingMax, genres, adult) {
  const axios = require('axios');
  const ENDPOINT = 'https://graphql.anilist.co';

  const MEDIA_FIELDS = `
    id type title { romaji english native }
    coverImage { extraLarge large medium }
    bannerImage description(asHtml: false) genres
    startDate { year } averageScore popularity
    rankings { rank type allTime }
    studios(isMain: true) { nodes { name } }
    status episodes chapters format
  `;

  // Build variable conditions
  const variables = { page, perPage: 25, type: 'ANIME', sort: 'TRENDING_DESC' };
  const conditions = ['$page: Int', '$perPage: Int', '$type: MediaType', '$sort: [MediaSort]'];
  const mediaArgs = ['page: $page, perPage: $perPage, type: $type, sort: $sort'];

  if (adult) {
    // If user wants adult content, omit isAdult to include it (or explicitly request it)
    // Actually we'll omit it to MIX both.
  } else {
    // If not adult, explicitly hide adult content
    variables.isAdult = false;
    conditions.push('$isAdult: Boolean');
    mediaArgs.push('isAdult: $isAdult');
  }

  if (year) {
    variables.seasonYear = year;
    conditions.push('$seasonYear: Int');
    mediaArgs.push('seasonYear: $seasonYear');
  }
  if (ratingMin !== null) {
    variables.averageScore_greater = Math.round(ratingMin * 10);
    conditions.push('$averageScore_greater: Int');
    mediaArgs.push('averageScore_greater: $averageScore_greater');
  }
  if (ratingMax !== null) {
    variables.averageScore_lesser = Math.round(ratingMax * 10);
    conditions.push('$averageScore_lesser: Int');
    mediaArgs.push('averageScore_lesser: $averageScore_lesser');
  }
  if (genres.length > 0) {
    variables.genre_in = genres;
    conditions.push('$genre_in: [String]');
    mediaArgs.push('genre_in: $genre_in');
  }

  const query = `
    query (${conditions.join(', ')}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(${mediaArgs.slice(2).join(', ')}, type: $type, sort: $sort) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const { data } = await axios.post(ENDPOINT, { query, variables }, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    timeout: 10000,
  });

  if (data.errors) throw new Error(data.errors[0].message);

  const pageInfo = data.data.Page.pageInfo;
  const items = (data.data.Page.media || []).map(item => {
    const normalize = require('../services/anilistService');
    // Re-use anilistService's normalizer pattern inline
    const titleStr = item.title?.english || item.title?.romaji || item.title?.native || '';
    const coverImage = item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || '';
    const score = item.averageScore ? item.averageScore / 10 : null;
    const allTimeRank = (item.rankings || []).find(r => r.allTime && r.type === 'RATED');
    return {
      externalId: String(item.id),
      source: 'anilist',
      type: item.type === 'MANGA' ? 'manga' : 'anime',
      title: titleStr,
      coverImage,
      synopsis: item.description || '',
      genres: item.genres || [],
      year: item.startDate?.year ?? null,
      score,
      metadata: {
        bannerImage: item.bannerImage || '',
        episodes: item.episodes ?? item.chapters ?? null,
        status: item.status ?? '',
        studios: (item.studios?.nodes || []).map(s => s.name),
        format: item.format ?? '',
        popularity: item.popularity ?? null,
        rank: allTimeRank?.rank ?? null,
      },
    };
  });

  return {
    results: items,
    page: pageInfo.currentPage,
    totalPages: pageInfo.lastPage || 1,
    totalResults: pageInfo.total || 0,
  };
}

module.exports = { browse, getGenres };
