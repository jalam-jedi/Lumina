/**
 * browseService.js — Browse API wrapper for paginated category browsing
 */
import api from './api'

const getAdultMode = () => {
  try {
    const user = JSON.parse(localStorage.getItem('lumina_user'))
    return user?.settings?.adultMode ? true : undefined
  } catch { return undefined }
}

export const browseService = {
  /** Browse media by type with filters and pagination */
  browse: (type, params = {}) =>
    api.get(`/browse/${type}`, { params: { ...params, adult: getAdultMode() } }).then((r) => r.data),

  /** Get available genres for a media type */
  getGenres: (type) =>
    api.get(`/browse/genres/${type}`).then((r) => r.data),
}
