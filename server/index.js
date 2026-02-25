require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('./config/passport'); // loads GoogleStrategy

const app = express();

// ── Middleware ─────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(passport.initialize()); // required for passport, even without sessions

// ── Routes ─────────────────────────────────────
const authRoutes       = require('./routes/auth');
const authGoogleRoutes = require('./routes/authGoogle');

app.use('/api/auth', authRoutes);        // email/password: register, login, me
app.use('/api/auth', authGoogleRoutes);  // google OAuth: /google, /google/callback

// Health-check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OmniTrack server is running!' });
});


// ── MongoDB Connection ──────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas!');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // exit if we can't reach the DB
  });