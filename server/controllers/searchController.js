const anilistService     = require('../services/anilistService');
const tmdbService        = require('../services/tmdbService');
const googleBooksService = require('../services/googleBooksService');

// ─────────────────────────────────────────────
//  Dedup helper — when TMDB and AniList both return the same anime,
//  keep the AniList version (richer metadata, hotlink-safe images).
// ─────────────────────────────────────────────
function deduplicateResults(results) {
  // Build a map of normalised titles → items, grouped by source
  const normalize = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');

  const anilistByTitle = new Map();
  const others = [];

  for (const item of results) {
    if (item.source === 'anilist') {
      const key = normalize(item.title);
      if (!anilistByTitle.has(key)) anilistByTitle.set(key, item);
    }
  }

  const seen = new Set();
  const deduped = [];

  // First pass: add all AniList items
  for (const [key, item] of anilistByTitle) {
    seen.add(key);
    deduped.push(item);
  }

  // Second pass: add non-AniList items only if no AniList match
  for (const item of results) {
    if (item.source === 'anilist') continue; // already added
    const key = normalize(item.title);
    // Skip TMDB anime duplicates that match an AniList title
    if (item.source === 'tmdb' && (item.type === 'tvshow' || item.type === 'movie')) {
      if (seen.has(key)) continue; // AniList already has this
    }
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    } else {
      // Allow non-anime TMDB dupes through (different type/source combo)
      deduped.push(item);
    }
  }

  return deduped;
}

// ─────────────────────────────────────────────
//  GET /api/search?q=<query>&type=<type>
// ─────────────────────────────────────────────
const search = async (req, res) => {
  const q    = (req.query.q || '').trim();
  const type = (req.query.type || 'all').toLowerCase();
  const adult = req.query.adult === 'true';

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }
  if (q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
  }

  try {
    let results = [];

    if (type === 'anime') {
      results = await anilistService.search(q, 'anime', adult);

    } else if (type === 'manga') {
      results = await anilistService.search(q, 'manga', adult);

    } else if (type === 'movie' || type === 'tvshow') {
      const all = await tmdbService.search(q, adult);
      results = type === 'all' ? all : all.filter((r) => r.type === type);

    } else if (type === 'book') {
      results = await googleBooksService.search(q);

    } else {
      // 'all' — fan out to all APIs simultaneously
      const [animeResults, mangaResults, tmdbResults, bookResults] = await Promise.all([
        anilistService.search(q, 'anime', adult).catch(() => []),
        anilistService.search(q, 'manga', adult).catch(() => []),
        tmdbService.search(q, adult).catch(() => []),
        googleBooksService.search(q).catch(() => []),
      ]);
      results = deduplicateResults([...animeResults, ...mangaResults, ...tmdbResults, ...bookResults]);
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error('Search error:', error.message);
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'External API rate limit hit. Try again shortly.' });
    }
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
};

module.exports = { search };
