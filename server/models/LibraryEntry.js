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

// ── Minimal inline snapshot of external media ─────────────────────────────
// Stored directly on the entry so we don't need a full Media DB document
// for every API-sourced item. Required when `media` ref is null.
const mediaSnapshotSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, trim: true },
    source:     { type: String, required: true, trim: true }, // 'jikan'|'tmdb'|'googlebooks'
    type:       { type: String, required: true, trim: true }, // 'anime'|'movie'|'book' etc.
    title:      { type: String, required: true, trim: true },
    coverImage: { type: String, default: '' },
  },
  { _id: false } // embedded doc, no separate _id needed
);

const libraryEntrySchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────────
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Optional: ref to a full Media doc (used for custom/cached entries)
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },

    // ── Inline snapshot (used for live API items — Jikan, TMDB, GoogleBooks) ──
    // At least one of `media` or `mediaSnapshot` must be present (enforced in controller).
    mediaSnapshot: { type: mediaSnapshotSchema },

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
    // ── Short plaintext notes ──────────────────────────────────────────────
    notes: { type: String, default: '' },

    // ── Journal log ───────────────────────────────────────────────────────────
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
// Prevent adding the same DB-backed Media item twice per user
libraryEntrySchema.index(
  { user: 1, media: 1 },
  { unique: true, partialFilterExpression: { media: { $exists: true } } }
);

// Prevent adding the same snapshot item (same externalId+source) twice per user
libraryEntrySchema.index(
  { user: 1, 'mediaSnapshot.externalId': 1, 'mediaSnapshot.source': 1 },
  { unique: true, partialFilterExpression: { 'mediaSnapshot.externalId': { $exists: true } } }
);

// Primary read pattern: "get all entries for user X, filtered by status"
libraryEntrySchema.index({ user: 1, status: 1 });

// Tag-based filtering: "show me everything I tagged 'favourite'"
libraryEntrySchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model('LibraryEntry', libraryEntrySchema);
