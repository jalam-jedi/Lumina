const axios    = require('axios');
const NodeCache = require('node-cache');
const { normalizeTmdb } = require('./normalizer');

// Search results: 5 min TTL.  Trending: 1 hour TTL.  Season detail: 12 hours TTL.
const cache        = new NodeCache({ stdTTL: 300 });
const trendCache   = new NodeCache({ stdTTL: 3600 });
const seasonCache  = new NodeCache({ stdTTL: 43200 }); // 12 hours — season data rarely changes

const BASE_URL = 'https://api.themoviedb.org/3';

// ── Helper: authenticated GET with caching ──────────────────────────────────
const get = async (path, params = {}, useCache = cache) => {
  const key = path + JSON.stringify(params);
  const cached = useCache.get(key);
  if (cached) return cached;

  const { data } = await axios.get(`${BASE_URL}${path}`, {
    params: { api_key: process.env.TMDB_API_KEY, ...params },
    timeout: 8000,
  });
  useCache.set(key, data);
  return data;
};

// ── Multi-search (movies + TV shows in one call) ────────────────────────────
const search = async (q, adult = false) => {
  const data = await get('/search/multi', { query: q, include_adult: adult });
  return (data.results || [])
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    // Filter out Japanese Anime from TMDB so we only rely on AniList for Anime
    .filter((r) => !(r.original_language === 'ja' && r.genre_ids && r.genre_ids.includes(16)))
    .map(normalizeTmdb);
};

// ── Trending (all media, weekly) ─────────────────────────────────────────────
const getTrending = async (adult = false) => {
  const data = await get('/trending/all/week', { include_adult: adult }, trendCache);
  return (data.results || [])
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .map(normalizeTmdb);
};

// ── TV Season details ───────────────────────────────────────────────────────
/**
 * Fetch seasons for a TMDB TV show.
 * Returns an array of { season: Number, name: String, episodeCount: Number }
 * Season 0 (Specials) is included only if it has episodes.
 */
const getTvSeasons = async (tmdbId) => {
  const data = await get(`/tv/${tmdbId}`, {}, seasonCache);

  const seasons = (data.seasons || [])
    .filter((s) => s.season_number > 0)       // always exclude Season 0 (Specials)
    .filter((s) => s.episode_count > 0)        // drop seasons with 0 episodes (upcoming, empty)
    .map((s) => ({
      season:       s.season_number,
      name:         s.name || `Season ${s.season_number}`,
      episodeCount: s.episode_count,
      airDate:      s.air_date || null,
    }));

  return {
    id:       String(data.id),
    title:    data.name || data.original_name || '',
    seasons,
    totalEpisodes: seasons.reduce((sum, s) => sum + s.episodeCount, 0),
  };
};

module.exports = { search, getTrending, getTvSeasons };
