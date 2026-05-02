const express      = require('express');
const router       = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createCustom, updateCustom, deleteCustom } = require('../controllers/mediaController');
const { getTvSeasons } = require('../services/tmdbService');

// ── GET /api/media/seasons?source=tmdb&id=<tmdbId> ────────────────────────────
// Public endpoint — returns season + episode-count data for a TV show.
// Used by the frontend SeasonTracker to render per-season steppers.
router.get('/seasons', async (req, res) => {
  const { source, id } = req.query;

  if (!source || !id) {
    return res.status(400).json({ error: 'Both "source" and "id" query params are required.' });
  }
  if (source !== 'tmdb') {
    // Only TMDB supports structured seasons; other sources return empty
    return res.json({ seasons: [], totalEpisodes: null });
  }

  try {
    const data = await getTvSeasons(id);
    res.json(data);
  } catch (err) {
    console.error('seasons fetch error:', err.message);
    res.status(502).json({ error: 'Could not fetch season data from TMDB.' });
  }
});

// ── Custom media routes (all protected) ──────────────────────────────────────
router.post('/custom',      authMiddleware, createCustom);
router.patch('/custom/:id', authMiddleware, updateCustom);
router.delete('/custom/:id', authMiddleware, deleteCustom);

module.exports = router;
