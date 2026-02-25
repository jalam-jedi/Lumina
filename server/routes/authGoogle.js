// ─────────────────────────────────────────────
//  Google OAuth Route — Phase 2 Note
//
//  WHAT THIS WILL DO (implemented in a dedicated step):
//
//  Flow:
//  1. User clicks "Sign in with Google" in the frontend
//  2. Browser redirects to → GET /api/auth/google
//  3. Google shows its login screen
//  4. Google redirects back to → GET /api/auth/google/callback
//  5. Passport finds or creates the user in MongoDB
//  6. We sign a JWT and redirect to the frontend with it
//
//  PACKAGES NEEDED (not installed yet):
//    npm install passport passport-google-oauth20
//
//  GOOGLE CLOUD SETUP NEEDED:
//  1. Go to: https://console.cloud.google.com/
//  2. Create a project → APIs & Services → Credentials
//  3. Create "OAuth 2.0 Client ID" (Web Application)
//  4. Add Authorized redirect URI:
//     http://localhost:5000/api/auth/google/callback
//  5. Copy Client ID and Client Secret to .env
//
//  .env variables needed:
//    GOOGLE_CLIENT_ID=...
//    GOOGLE_CLIENT_SECRET=...
//    FRONTEND_URL=http://localhost:5173
// ─────────────────────────────────────────────

// TODO: Implement in Phase 2b (Google OAuth step)
// This file is a placeholder stub — routes will be added here.

module.exports = {}; // placeholder
