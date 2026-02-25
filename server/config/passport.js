const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// ─────────────────────────────────────────────
//  HOW GoogleStrategy WORKS:
//
//  1. User visits /api/auth/google
//  2. Passport redirects them to Google's login page
//     (using GOOGLE_CLIENT_ID to identify our app)
//  3. User logs in to Google and approves our app
//  4. Google sends a "code" back to /api/auth/google/callback
//  5. Passport exchanges that code for an accessToken
//  6. Google sends back the user's profile (id, name, email, photo)
//  7. Our "verify callback" below runs — we find or create the user in MongoDB
//  8. done(null, user) tells Passport the user is authenticated
// ─────────────────────────────────────────────

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  '/api/auth/google/callback',
      // Ask Google for these data fields about the user:
      scope: ['profile', 'email'],
    },

    // Verify callback — runs after Google sends back the user's profile
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email    = profile.emails[0].value;
        const googleId = profile.id;
        const avatar   = profile.photos?.[0]?.value || '';
        const name     = profile.displayName;

        // ── CASE 1: User already exists with this googleId ──
        let user = await User.findOne({ googleId });
        if (user) {
          return done(null, user);
        }

        // ── CASE 2: User exists with same email (registered via email/password) ──
        //  Link their Google account to the existing account
        user = await User.findOne({ email });
        if (user) {
          user.googleId     = googleId;
          user.authProvider = 'both'; // now linked to both methods
          if (!user.avatar) user.avatar = avatar; // add Google photo if none set
          await user.save();
          return done(null, user);
        }

        // ── CASE 3: Brand new user — create their account ──
        //  Generate a unique username from their Google name
        //  (e.g. "John Doe" → "john_doe" + random suffix if taken)
        let username = name.toLowerCase().replace(/\s+/g, '_');
        const exists = await User.findOne({ username });
        if (exists) {
          username = `${username}_${Math.floor(Math.random() * 9000) + 1000}`;
        }

        user = await User.create({
          username,
          email,
          googleId,
          avatar,
          passwordHash: null,  // Google users don't have a password
          authProvider: 'google',
        });

        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// ─────────────────────────────────────────────
//  NOTE: We are NOT using passport sessions.
//  Passport usually requires serializeUser/deserializeUser
//  for session-based auth. Since we use JWT instead,
//  we skip that entirely. Passport is only used here
//  to handle the Google OAuth handshake.
// ─────────────────────────────────────────────

module.exports = passport;
