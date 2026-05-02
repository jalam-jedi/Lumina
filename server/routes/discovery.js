const express = require('express');
const router  = express.Router();
const { getPlatformTrending, getExternalTrending } = require('../controllers/discoveryController');

// Both discovery routes are public — no auth needed
router.get('/platform', getPlatformTrending);
router.get('/external', getExternalTrending);

module.exports = router;
