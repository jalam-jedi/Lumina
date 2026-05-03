const express   = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');
const { register, login, getMe, updateSettings } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// ── Rate limiter for auth endpoints ────────────────────────────────────────
// Max 10 attempts per 15 minutes per IP — prevents brute-force on login/register
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,
  standardHeaders:  true,   // return rate limit info in RateLimit-* headers
  legacyHeaders:    false,
  message:          { error: 'Too many attempts. Please try again in 15 minutes.' },
});

// Public routes — rate limited
router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);

// Protected route — authMiddleware runs first, attaches req.user
router.get('/me', authMiddleware, getMe);
router.put('/settings', authMiddleware, updateSettings);

module.exports = router;
