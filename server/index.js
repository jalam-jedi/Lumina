require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ── Middleware ─────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────
//  Each feature gets its own router, mounted under /api
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Health-check route (useful for testing the server is alive)
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