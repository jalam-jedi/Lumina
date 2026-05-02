/**
 * api.js — Central Axios instance for Lumina frontend
 *
 * - Base URL from VITE_API_URL env var
 * - Auto-attaches Authorization: Bearer <token> from localStorage
 * - Globally handles 401 → clears token and redirects to /login
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — inject JWT ─────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lumina_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — global error handling ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → force logout
      localStorage.removeItem('lumina_token')
      localStorage.removeItem('lumina_user')
      // Only redirect if not already on login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
