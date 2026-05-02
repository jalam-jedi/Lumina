const axios    = require('axios');
const NodeCache = require('node-cache');
const { normalizeGoogleBook } = require('./normalizer');

// Cache results for 5 minutes (free tier: 1000 req/day)
const cache = new NodeCache({ stdTTL: 300 });

const BASE_URL = 'https://www.googleapis.com/books/v1';

// ── Helper: GET with caching ────────────────────────────────────────────────
const get = async (path, params = {}) => {
  const key = path + JSON.stringify(params);
  const cached = cache.get(key);
  if (cached) return cached;

  // API key is optional for Google Books (lower rate limit without it)
  const finalParams = { ...params };
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    finalParams.key = process.env.GOOGLE_BOOKS_API_KEY;
  }

  const { data } = await axios.get(`${BASE_URL}${path}`, {
    params: finalParams,
    timeout: 8000,
  });
  cache.set(key, data);
  return data;
};

// ── Search ──────────────────────────────────────────────────────────────────
const search = async (q) => {
  const data = await get('/volumes', { q, maxResults: 10, printType: 'books', langRestrict: 'en' });
  return (data.items || []).map(normalizeGoogleBook);
};

module.exports = { search };
