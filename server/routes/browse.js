const express = require('express');
const router  = express.Router();
const { browse, getGenres } = require('../controllers/browseController');

// GET /api/browse/genres/:type  — available genres for a media type
router.get('/genres/:type', getGenres);

// GET /api/browse/:type?page=1&year=&rating_min=&rating_max=&genres=Action,Comedy
router.get('/:type', browse);

module.exports = router;
