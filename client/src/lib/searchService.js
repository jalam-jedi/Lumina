/**
 * searchService.js — Search API wrapper
 */
import api from './api'

export const searchService = {
  search: (query, type = 'all') =>
    api.get('/search', { params: { q: query, type } }).then((r) => r.data),
}
