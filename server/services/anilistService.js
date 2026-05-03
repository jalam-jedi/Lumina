/**
 * anilistService.js
 *
 * AniList GraphQL API — replaces Jikan for anime/manga.
 *
 * WHY ANILIST OVER JIKAN:
 *  - Images hosted on s4.anilist.co → browser hotlinking ALLOWED (no CORS block)
 *  - No API key required
 *  - Rich data: banner images, colour palette, studios, trailer, relations
 *  - GraphQL lets us fetch EXACTLY the fields we need — no over-fetching
 *
 * ENDPOINTS:
 *  - POST https://graphql.anilist.co  (single endpoint for all queries)
 *
 * RATE LIMITS:
 *  - 90 requests / minute (per IP), 1000 / hour
 *  - We cache aggressively to stay well within limits
 *
 * NORMALISED SHAPE (same as jikan normalizer output):
 *  { externalId, source:'anilist', type, title, coverImage,
 *    synopsis, genres, year, score, metadata }
 */

const axios     = require('axios');
const NodeCache = require('node-cache');

const cache      = new NodeCache({ stdTTL: 300  });  // 5 min for search
const trendCache = new NodeCache({ stdTTL: 3600 });  // 1 hr  for trending

const ENDPOINT = 'https://graphql.anilist.co';

// ── GraphQL query builder ────────────────────────────────────────────────────
const MEDIA_FIELDS = `
  id
  type
  title { romaji english native }
  coverImage { extraLarge large medium }
  bannerImage
  description(asHtml: false)
  genres
  startDate { year }
  averageScore
  popularity
  rankings { rank type allTime season year }
  studios(isMain: true) { nodes { name } }
  status
  episodes
  chapters
  format
`;

// ── Helper: POST GraphQL query ───────────────────────────────────────────────
const gql = async (query, variables = {}, useCache = cache) => {
  const key = JSON.stringify({ query, variables });
  const hit = useCache.get(key);
  if (hit) return hit;

  const { data } = await axios.post(
    ENDPOINT,
    { query, variables },
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 10000 }
  );

  if (data.errors) throw new Error(data.errors[0].message);
  useCache.set(key, data.data);
  return data.data;
};

// ── Normalise AniList media → universal shape ─────────────────────────────────
const normalizeAniList = (item) => {
  const type  = item.type === 'MANGA' ? 'manga' : 'anime';
  const title = item.title?.english || item.title?.romaji || item.title?.native || '';
  const year  = item.startDate?.year ?? null;

  // AniList images — s4.anilist.co allows hotlinking ✅
  const coverImage = item.coverImage?.extraLarge
    || item.coverImage?.large
    || item.coverImage?.medium
    || '';

  // score is 0-100 on AniList; normalise to 0-10 to match TMDB/Jikan
  const score = item.averageScore ? item.averageScore / 10 : null;

  // Top-level rank from rankings array
  const allTimeRank = (item.rankings || []).find((r) => r.allTime && r.type === 'RATED');

  return {
    externalId:  String(item.id),
    source:      'anilist',
    type,
    title,
    coverImage,
    synopsis:    item.description || '',
    genres:      item.genres || [],
    year,
    score,
    metadata: {
      bannerImage: item.bannerImage || '',
      episodes:    item.episodes ?? item.chapters ?? null,
      status:      item.status ?? '',
      studios:     (item.studios?.nodes || []).map((s) => s.name),
      format:      item.format ?? '',
      popularity:  item.popularity ?? null,
      rank:        allTimeRank?.rank ?? null,
    },
  };
};

// ── Search anime or manga ─────────────────────────────────────────────────────
const search = async (q, type = 'anime', adult = false) => {
  const mediaType = type === 'manga' ? 'MANGA' : 'ANIME';
  const query = `
    query ($search: String, $type: MediaType, $isAdult: Boolean) {
      Page(page: 1, perPage: 12) {
        media(search: $search, type: $type, sort: SEARCH_MATCH, isAdult: $isAdult) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const vars = { search: q, type: mediaType };
  if (!adult) vars.isAdult = false;
  const data = await gql(query, vars);
  return (data.Page?.media || []).map(normalizeAniList);
};

// ── Top / Trending anime ──────────────────────────────────────────────────────
const getTopAnime = async (adult = false) => {
  const query = `
    query ($isAdult: Boolean) {
      Page(page: 1, perPage: 25) {
        media(type: ANIME, sort: SCORE_DESC, status_not: NOT_YET_RELEASED, isAdult: $isAdult) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const vars = {};
  if (!adult) vars.isAdult = false;
  const data = await gql(query, vars, trendCache);
  return (data.Page?.media || []).map(normalizeAniList);
};

// ── Trending RIGHT NOW (what people are actually watching) ────────────────────
const getTrendingAnime = async (adult = false) => {
  const query = `
    query ($isAdult: Boolean) {
      Page(page: 1, perPage: 25) {
        media(type: ANIME, sort: TRENDING_DESC, status: RELEASING, isAdult: $isAdult) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const vars = {};
  if (!adult) vars.isAdult = false;
  const data = await gql(query, vars, trendCache);
  return (data.Page?.media || []).map(normalizeAniList);
};

// ── Top manga ─────────────────────────────────────────────────────────────────
const getTopManga = async (adult = false) => {
  const query = `
    query ($isAdult: Boolean) {
      Page(page: 1, perPage: 25) {
        media(type: MANGA, sort: SCORE_DESC, status_not: NOT_YET_RELEASED, isAdult: $isAdult) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const vars = {};
  if (!adult) vars.isAdult = false;
  const data = await gql(query, vars, trendCache);
  return (data.Page?.media || []).map(normalizeAniList);
};

module.exports = { search, getTopAnime, getTrendingAnime, getTopManga };
