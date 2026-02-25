const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────
//  STEP 1:  GET /api/auth/google
//  Frontend "Sign in with Google" button links here.
//  Passport redirects the user to Google's login page.
// ─────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // we use JWT, not sessions
  })
);

// ─────────────────────────────────────────────
//  STEP 2:  GET /api/auth/google/callback
//  Google redirects the user here after they approve our app.
//  Passport runs the verify callback (finds/creates user),
//  then we sign a JWT and redirect to the frontend with it.
// ─────────────────────────────────────────────
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    // At this point, passport has attached req.user (from the verify callback)
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend — token goes as a URL query param
    // The React app reads it from the URL, saves to localStorage, then redirects home
    // WHY query param? We can't set localStorage from the server side.
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;
