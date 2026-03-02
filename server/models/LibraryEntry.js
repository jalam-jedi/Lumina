const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
//  LibraryEntry — a user's personal tracking record for one piece of media
//
//  DESIGN PHILOSOPHY:
//  - Intentionally lean. Fields are added here as UI/feature decisions are made.
//  - `progress.unit` is an open string → supports any media type without changes.
//  - `log` is an array of timestamped text entries (like a reading/watch journal).
//  - `tags` is a free-form string array → user-defined organisation.
//  - `extra` (Mixed) is a free bucket for any feature-specific data added later
//    (e.g. re-watch count, favourite episodes, season tracking, etc.)
// ─────────────────────────────────────────────────────────────────────────────

const logEntrySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }  // gives each log entry its own createdAt / updatedAt
);

const libraryEntrySchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────────
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },

    // ── Tracking status ───────────────────────────────────────────────────────
    // Core statuses — can be extended by just adding new strings on the frontend
    status: {
      type: String,
      enum: ['planning', 'in-progress', 'completed', 'dropped', 'paused'],
      default: 'planning',
      required: true,
    },

    // ── Progress ──────────────────────────────────────────────────────────────
    // Generic enough for episodes, chapters, pages, volumes, or anything else.
    // `unit` is an open string — never needs a schema change for new media types.
    progress: {
      current: { type: Number, default: 0 },
      total:   { type: Number, default: null },   // null = unknown / ongoing
      unit:    { type: String, default: 'episodes', trim: true },
    },

    // ── User's personal take ──────────────────────────────────────────────────
    userRating: { type: Number, min: 0, max: 10, default: null },

    // ── Journal log ───────────────────────────────────────────────────────────
    // Ordered list of timestamped text notes — like a watch/read diary
    log: { type: [logEntrySchema], default: [] },

    // ── Organisation ──────────────────────────────────────────────────────────
    // Free-form user tags (e.g. 'favourite', 'school-assignment', 'with-friends')
    tags: { type: [String], default: [] },

    // ── Timeline ──────────────────────────────────────────────────────────────
    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // ── Future-proofing ───────────────────────────────────────────────────────
    // Anything that doesn't fit yet goes here — re-watch count, season data, etc.
    // Add proper fields later once UI decisions are made, then migrate this data.
    extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// One entry per (user + media) — can't add the same item twice
libraryEntrySchema.index({ user: 1, media: 1 }, { unique: true });

// Primary read pattern: "get all entries for user X, filtered by status"
libraryEntrySchema.index({ user: 1, status: 1 });

// Tag-based filtering: "show me everything I tagged 'favourite'"
libraryEntrySchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model('LibraryEntry', libraryEntrySchema);
