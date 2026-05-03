const anilistService     = require('../services/anilistService');
const tmdbService        = require('../services/tmdbService');
const googleBooksService = require('../services/googleBooksService');

// ─────────────────────────────────────────────
//  Interleave helper — ensures top results from each
//  source appear at the top of the combined list
// ─────────────────────────────────────────────
function interleaveResults(arrays) {
  const result = [];
  let maxLen = 0;
  for (const arr of arrays) {
    if (arr.length > maxLen) maxLen = arr.length;
  }
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
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
        tmdbService.search(q, adult).catch(() => []),
        anilistService.search(q, 'manga', adult).catch(() => []),
        googleBooksService.search(q).catch(() => []),
      ]);
      // Interleave so the #1 TMDB, #1 Anime, #1 Manga all show up at the very top
      results = interleaveResults([tmdbResults, animeResults, mangaResults, bookResults]);
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
