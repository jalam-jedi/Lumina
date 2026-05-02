/**
 * browseService.js — Browse API wrapper for paginated category browsing
 */
import api from './api'

export const browseService = {
  /** Browse media by type with filters and pagination */
  browse: (type, params = {}) =>
    api.get(`/browse/${type}`, { params }).then((r) => r.data),

  /** Get available genres for a media type */
  getGenres: (type) =>
    api.get(`/browse/genres/${type}`).then((r) => r.data),
}
