/**
 * discoveryService.js — Discovery API calls  (public — no auth needed)
 * GET /api/discover/platform  → { trending: [...] }   (OmniTrack platform data)
 * GET /api/discover/external  → { tmdbTrending, topAnime }
 */
import api from './api'

export const discoveryService = {
  /** Titles trending on the platform in the last 7 days. */
  getPlatformTrending: () =>
    api.get('/discover/platform').then((r) => r.data),

  /** Trending from TMDB + top anime from Jikan (cached 1 h). */
  getExternalTrending: () =>
    api.get('/discover/external').then((r) => r.data),
}
