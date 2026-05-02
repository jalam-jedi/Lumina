// ─────────────────────────────────────────────────────────────────────────────
//  normalizer.js
//  Maps each external API's raw response to the universal NormalizedMedia shape.
//
//  Universal shape:
//  {
//    externalId  : String,
//    source      : String,  // 'jikan' | 'tmdb' | 'googlebooks'
//    type        : String,  // 'anime' | 'manga' | 'movie' | 'tvshow' | 'book'
//    title       : String,
//    coverImage  : String,  // full URL
//    synopsis    : String,
//    genres      : [String],
//    year        : Number | null,
//    score       : Number | null,
//    metadata    : Object,  // raw extras for detail pages
//  }
// ─────────────────────────────────────────────────────────────────────────────

// ── Jikan (MyAnimeList) ────────────────────────────────────────────────────────
//  type param: 'anime' | 'manga'
const normalizeJikan = (item, type = 'anime') => ({
  externalId:  String(item.mal_id),
  source:      'jikan',
  type,
  title:       item.title || item.title_english || '',
  coverImage:  item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
  synopsis:    item.synopsis || '',
  genres:      (item.genres || []).map((g) => g.name),
  year:        item.year ?? item.published?.prop?.from?.year ?? null,
  score:       item.score ?? null,
  metadata: {
    episodes:  item.episodes ?? item.chapters ?? null,
    status:    item.status ?? '',
    studios:   (item.studios || item.authors || []).map((s) => s.name),
    aired:     item.aired ?? item.published ?? null,
    rating:    item.rating ?? '',
    rank:      item.rank ?? null,
    popularity:item.popularity ?? null,
  },
});

// ── TMDB ───────────────────────────────────────────────────────────────────────
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const normalizeTmdb = (item) => {
  const isMovie = item.media_type === 'movie' || !!item.title;
  const type    = isMovie ? 'movie' : 'tvshow';
  const title   = item.title || item.name || '';
  const rawDate = item.release_date || item.first_air_date || '';
  const year    = rawDate ? parseInt(rawDate.slice(0, 4), 10) : null;

  return {
    externalId:  String(item.id),
    source:      'tmdb',
    type,
    title,
    coverImage:  item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
    synopsis:    item.overview || '',
    genres:      [], // genre names require a separate TMDB lookup → skip for search
    year,
    score:       item.vote_average ?? null,
    metadata: {
      popularity:     item.popularity ?? null,
      voteCount:      item.vote_count ?? null,
      backdropPath:   item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : '',
      originalTitle:  item.original_title || item.original_name || '',
      language:       item.original_language || '',
    },
  };
};

// ── Google Books ────────────────────────────────────────────────────────────────
const normalizeGoogleBook = (item) => {
  const info     = item.volumeInfo || {};
  const rawDate  = info.publishedDate || '';
  const year     = rawDate ? parseInt(rawDate.slice(0, 4), 10) : null;
  const imageLinks = info.imageLinks || {};
  const coverImage = imageLinks.thumbnail
    || imageLinks.smallThumbnail
    || '';
  // Google often returns http:// — upgrade to https
  const secureCover = coverImage.replace(/^http:\/\//, 'https://');

  return {
    externalId:  item.id,
    source:      'googlebooks',
    type:        'book',
    title:       info.title || '',
    coverImage:  secureCover,
    synopsis:    info.description || '',
    genres:      info.categories || [],
    year,
    score:       info.averageRating ?? null,
    metadata: {
      authors:      info.authors    || [],
      publisher:    info.publisher  || '',
      pageCount:    info.pageCount  ?? null,
      isbn:         (info.industryIdentifiers || []).find((i) => i.type === 'ISBN_13')?.identifier || '',
      language:     info.language   || '',
      previewLink:  info.previewLink || '',
    },
  };
};

module.exports = { normalizeJikan, normalizeTmdb, normalizeGoogleBook };
