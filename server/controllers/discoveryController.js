const LibraryEntry   = require('../models/LibraryEntry');
const anilistService = require('../services/anilistService'); // replaces jikan — images hotlink-safe
const tmdbService    = require('../services/tmdbService');
const NodeCache      = require('node-cache');

// Cache external trending for 1 hour to stay within API rate limits
const trendCache = new NodeCache({ stdTTL: 3600 });

// ─────────────────────────────────────────────
//  GET /api/discover/platform
//  "Trending on OmniTrack" — which titles have been
//  added the most by users in the last 7 days.
//  Uses MongoDB aggregation on LibraryEntry.
// ─────────────────────────────────────────────
const getPlatformTrending = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await LibraryEntry.aggregate([
      // Only entries created in the last 7 days that have a snapshot
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          mediaSnapshot: { $ne: null },
        },
      },
      // Group by externalId+source — count per unique media item
      {
        $group: {
          _id: {
            externalId: '$mediaSnapshot.externalId',
            source:     '$mediaSnapshot.source',
          },
          addCount:      { $sum: 1 },
          mediaSnapshot: { $first: '$mediaSnapshot' },
        },
      },
      { $sort: { addCount: -1 } },
      { $limit: 20 },
      // Reshape for frontend
      {
        $project: {
          _id: 0,
          addCount: 1,
          externalId:  '$mediaSnapshot.externalId',
          source:      '$mediaSnapshot.source',
          type:        '$mediaSnapshot.type',
          title:       '$mediaSnapshot.title',
          coverImage:  '$mediaSnapshot.coverImage',
        },
      },
    ]);

    res.status(200).json({ trending });
  } catch (error) {
    console.error('getPlatformTrending error:', error);
    res.status(500).json({ error: 'Server error fetching trending data.' });
  }
};

// ─────────────────────────────────────────────
//  GET /api/discover/external
//  Fetches trending from TMDB (movies + TV) and
//  top anime from Jikan — both cached 1 hour.
// ─────────────────────────────────────────────
const getExternalTrending = async (req, res) => {
  try {
    const cacheKey = 'external_trending';
    const cached = trendCache.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const [tmdbTrending, topAnime] = await Promise.all([
      tmdbService.getTrending().catch(() => []),
      anilistService.getTopAnime().catch(() => []),   // AniList — images hotlink-safe
    ]);

    const payload = { tmdbTrending, topAnime };
    trendCache.set(cacheKey, payload);
    res.status(200).json(payload);
  } catch (error) {
    console.error('getExternalTrending error:', error);
    res.status(500).json({ error: 'Server error fetching external trending.' });
  }
};

module.exports = { getPlatformTrending, getExternalTrending };
