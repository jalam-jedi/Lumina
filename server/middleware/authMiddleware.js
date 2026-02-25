const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─────────────────────────────────────────────
//  HOW JWT AUTH WORKS:
//  1. Client sends: Authorization: Bearer <token>
//  2. We split "Bearer <token>" and grab the token part
//  3. jwt.verify() decodes it using our JWT_SECRET
//     - If valid: returns the payload we signed (e.g. { id: '...' })
//     - If expired or tampered: throws an error → we send 401
//  4. We fetch the full user from DB and attach to req.user
//     so every controller can access the logged-in user
// ─────────────────────────────────────────────

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer abc123" → "abc123"

    // 2. Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: 'mongodb_user_id', iat: ..., exp: ... }

    // 3. Fetch the user from DB (ensures user still exists & wasn't deleted)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    // 4. Attach user to the request — controllers can now use req.user
    req.user = user;
    next(); // move on to the actual route handler

  } catch (error) {
    // jwt.verify throws when token is invalid, expired, or malformed
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in.' });
  }
};

module.exports = authMiddleware;
