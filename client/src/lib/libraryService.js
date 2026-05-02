/**
 * libraryService.js — Library CRUD calls  (all protected)
 * GET    /api/library          → { entries }
 * POST   /api/library          → { entry }
 * PATCH  /api/library/:id      → { entry }
 * DELETE /api/library/:id      → { message }
 */
import api from './api'

export const libraryService = {
  /**
   * Get the logged-in user's library.
   * @param {Object} params  Optional: { status, type }
   * @returns {Promise<{ entries: LibraryEntry[] }>}
   */
  getLibrary: (params = {}) =>
    api.get('/library', { params }).then((r) => r.data),

  /**
   * Add an item to the library via a mediaSnapshot.
   * @param {{ externalId, source, type, title, coverImage? }} snapshot
   * @param {string} [status='planning']
   */
  addEntry: (snapshot, status = 'planning', progress = null) => {
    const body = { mediaSnapshot: snapshot, status }
    if (progress) body.progress = progress
    return api.post('/library', body).then((r) => r.data)
  },

  /**
   * Update status, progress, rating, notes, tags, dates.
   * @param {string} id   LibraryEntry _id
   * @param {Object} data Subset of allowed fields
   */
  updateEntry: (id, data) =>
    api.patch(`/library/${id}`, data).then((r) => r.data),

  /**
   * Fetch season structure for a TV show from TMDB.
   * Returns { seasons: [{season, name, episodeCount}], totalEpisodes }.
   * Falls back gracefully to { seasons: [], totalEpisodes: null } on error.
   * @param {string} source  'tmdb' (only source supported for now)
   * @param {string} id      External ID
   */
  getSeasons: (source, id) =>
    api.get('/media/seasons', { params: { source, id } }).then((r) => r.data),

  /**
   * Remove an entry from the library.
   * @param {string} id  LibraryEntry _id
   */
  deleteEntry: (id) =>
    api.delete(`/library/${id}`).then((r) => r.data),
}
