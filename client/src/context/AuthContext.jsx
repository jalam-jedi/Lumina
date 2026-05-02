/**
 * AuthContext.jsx
 *
 * Provides:
 *   - user        : current User object | null
 *   - token       : JWT string | null
 *   - loading     : true while restoring session on mount
 *   - login()     : (email, password) → saves token, sets user
 *   - register()  : (username, email, password) → saves token, sets user
 *   - logout()    : clears storage + user state
 *   - isAuth      : boolean shorthand
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../lib/authService'

const AuthContext = createContext(null)

const TOKEN_KEY = 'lumina_token'
const USER_KEY  = 'lumina_user'

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null }
    catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // On mount, verify stored token is still valid
  useEffect(() => {
    if (!token) { setLoading(false); return }
    authService.getMe()
      .then(({ user: me }) => setUser(me))
      .catch(() => {
        // Token invalid / expired — clear everything
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((tok, usr) => {
    localStorage.setItem(TOKEN_KEY, tok)
    localStorage.setItem(USER_KEY, JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
  }, [])

  const login = useCallback(async (email, password) => {
    const { token: tok, user: usr } = await authService.login(email, password)
    persist(tok, usr)
    return usr
  }, [persist])

  const register = useCallback(async (username, email, password) => {
    const { token: tok, user: usr } = await authService.register(username, email, password)
    persist(tok, usr)
    return usr
  }, [persist])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuth: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** useAuth — consume auth state anywhere in the tree */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
