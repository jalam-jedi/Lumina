/**
 * discoveryService.js — Discovery API calls  (public — no auth needed)
 * GET /api/discover/platform  → { trending: [...] }   (OmniTrack platform data)
 * GET /api/discover/external  → { tmdbTrending, topAnime }
 */
import api from './api'

const getAdultMode = () => {
  try {
    const user = JSON.parse(localStorage.getItem('lumina_user'))
    return user?.settings?.adultMode ? true : undefined
  } catch { return undefined }
}

export const discoveryService = {
  /** Titles trending on the platform in the last 7 days. */
  getPlatformTrending: () =>
    api.get('/discover/platform', { params: { adult: getAdultMode() } }).then((r) => r.data),

  /** Trending from TMDB + top anime from AniList (cached 1 h). */
  getExternalTrending: () =>
    api.get('/discover/external', { params: { adult: getAdultMode() } }).then((r) => r.data),
}
