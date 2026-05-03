/**
 * searchService.js — Search API wrapper
 */
import api from './api'

const getUserSettings = () => {
  try {
    const user = JSON.parse(localStorage.getItem('lumina_user'))
    return user?.settings || {}
  } catch { return {} }
}

export const searchService = {
  search: (query, type = 'all') => {
    const settings = getUserSettings();
    return api.get('/search', { 
      params: { 
        q: query, 
        type, 
        adult: settings.adultMode ? true : undefined,
        exclude: settings.excludeTypes?.length ? settings.excludeTypes.join(',') : undefined
      } 
    }).then((r) => r.data)
  }
}
