require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const passport = require('./config/passport'); // loads GoogleStrategy

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://lumina-one-sage.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize()); // required for passport, even without sessions

// ── Routes ──────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const authGoogleRoutes = require('./routes/authGoogle');
const libraryRoutes    = require('./routes/library');
const searchRoutes     = require('./routes/search');
const discoveryRoutes  = require('./routes/discovery');
const mediaRoutes      = require('./routes/media');
const browseRoutes     = require('./routes/browse');

app.use('/api/auth',     authRoutes);        // email/password: register, login, me
app.use('/api/auth',     authGoogleRoutes);  // google OAuth: /google, /google/callback
app.use('/api/library',  libraryRoutes);     // library CRUD               (protected)
app.use('/api/search',   searchRoutes);      // multi-API media search     (public)
app.use('/api/discover', discoveryRoutes);   // platform + external trending (public)
app.use('/api/media',    mediaRoutes);       // custom media CRUD          (protected)
app.use('/api/browse',   browseRoutes);      // paginated category browse  (public)

// ── Health-check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OmniTrack server is running!' });
});

// ── 404 handler ─────────────────────────────────────────
// Catches any request that didn't match a defined route
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ─────────────────────────────────
// Catches any error passed via next(err) or thrown in async routes (Express 5)
// Prevents stack traces leaking to the client in production
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status  = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred.'
    : err.message;
  res.status(status).json({ error: message });
});


// ── MongoDB Connection ──────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas!');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });