const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
//  Media — local cache of external API data (or custom user-added entries)
//
//  DESIGN PHILOSOPHY:
//  - `source` and `mediaType` are plain strings, NOT enums.
//    → New sources/types (e.g. 'spotify', 'podcast') never require a migration.
//  - Normalized fields (title, coverImage, etc.) are populated from any source.
//  - Everything source-specific lives in `metadata` (Mixed) — no schema changes
//    needed to add a new API.
//  - One document per unique (source + externalId) pair. The second user to add
//    the same movie hits the cache instead of calling the API again.
// ─────────────────────────────────────────────────────────────────────────────

const mediaSchema = new mongoose.Schema(
  {
    // ── Source identification ─────────────────────────────────────────────────
    // e.g. 'tmdb', 'jikan', 'googlebooks', 'custom', 'openlibrary', ...
    source:     { type: String, required: true, trim: true },
    // ID assigned by the source API (null for custom entries)
    externalId: { type: String, default: null, trim: true },

    // ── What kind of media is this? ───────────────────────────────────────────
    // Open string — 'movie', 'tvshow', 'anime', 'manga', 'book', 'manhwa',
    // 'lightnovel', 'podcast', etc. Add new types from the frontend, no migration.
    mediaType: { type: String, required: true, trim: true },

    // ── Universal normalized fields ───────────────────────────────────────────
    // Every source populates these the same way (via a service normalizer)
    title:      { type: String, required: true, trim: true },
    coverImage: { type: String, default: '' },   // full URL
    synopsis:   { type: String, default: '' },
    genres:     { type: [String], default: [] },
    year:       { type: Number, default: null },  // release year
    score:      { type: Number, default: null },  // community score from source

    // ── Flexible metadata bucket ──────────────────────────────────────────────
    // Anything source-specific or UI-optional lives here.
    // Never query deeply into this — it's a display payload, not a filter field.
    // Examples:
    //   tmdb   → { runtime: 120, language: 'en', trailerKey: 'abc', cast: [...] }
    //   jikan  → { episodes: 24, status: 'Finished', studios: [...], aired: {...} }
    //   books  → { pageCount: 350, authors: [...], isbn: '...', publisher: '...' }
    //   custom → { whatever the user wants }
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Custom entries ────────────────────────────────────────────────────────
    isCustom: { type: Boolean, default: false },
    addedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Primary deduplication: same external item from same source = one document
mediaSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });

// Filter by type (e.g. "show me all anime in cache")
mediaSchema.index({ mediaType: 1 });

// Full-text search on title (useful for custom entries not in any API)
mediaSchema.index({ title: 'text' });

module.exports = mongoose.model('Media', mediaSchema);
