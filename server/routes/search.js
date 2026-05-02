const express = require('express');
const router  = express.Router();
const { search } = require('../controllers/searchController');

// GET /api/search?q=naruto&type=all
// No auth required — search is public
router.get('/', search);

module.exports = router;
