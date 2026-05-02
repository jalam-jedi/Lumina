const axios    = require('axios');
const NodeCache = require('node-cache');
const { normalizeJikan } = require('./normalizer');

// Cache results for 5 minutes to stay within Jikan's rate limits (60 req/min)
const cache = new NodeCache({ stdTTL: 300 });

const BASE_URL = 'https://api.jikan.moe/v4';

// ── Helper: GET with caching ────────────────────────────────────────────────
const get = async (url, params = {}) => {
  const key = url + JSON.stringify(params);
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await axios.get(url, { params, timeout: 8000 });
  cache.set(key, data);
  return data;
};

// ── Search ──────────────────────────────────────────────────────────────────
//  type: 'anime' | 'manga'
const search = async (q, type = 'anime') => {
  const endpoint = type === 'manga' ? `${BASE_URL}/manga` : `${BASE_URL}/anime`;
  const data = await get(endpoint, { q, limit: 10, sfw: true });
  return (data.data || []).map((item) => normalizeJikan(item, type));
};

// ── Top / Trending ──────────────────────────────────────────────────────────
const getTopAnime = async () => {
  const data = await get(`${BASE_URL}/top/anime`, { limit: 20 });
  return (data.data || []).map((item) => normalizeJikan(item, 'anime'));
};

const getTopManga = async () => {
  const data = await get(`${BASE_URL}/top/manga`, { limit: 20 });
  return (data.data || []).map((item) => normalizeJikan(item, 'manga'));
};

module.exports = { search, getTopAnime, getTopManga };
