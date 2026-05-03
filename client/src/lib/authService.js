/**
 * authService.js — Auth API calls
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 */
import api from './api'

export const authService = {
  /** Register a new user. Returns { token, user } */
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }).then((r) => r.data),

  /** Login with email + password. Returns { token, user } */
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  /** Fetch current user from token. Returns { user } */
  getMe: () => api.get('/auth/me').then((r) => r.data),

  /** Update user settings. Returns { user, message } */
  updateSettings: (settings) =>
    api.put('/auth/settings', { settings }).then((r) => r.data),
}
