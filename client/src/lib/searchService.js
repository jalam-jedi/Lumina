/**
 * searchService.js — Search API wrapper
 */
import api from './api'

const getAdultMode = () => {
  try {
    const user = JSON.parse(localStorage.getItem('lumina_user'))
    return user?.settings?.adultMode ? true : undefined
  } catch { return undefined }
}

export const searchService = {
  search: (query, type = 'all') =>
    api.get('/search', { params: { q: query, type, adult: getAdultMode() } }).then((r) => r.data),
}
