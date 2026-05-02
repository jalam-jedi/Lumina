/**
 * LoginPage.jsx — Login & Register form
 * Toggles between two modes via a tab.
 * On success, navigates to /discover.
 */
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register, isAuth, loading } = useAuth()
  const navigate = useNavigate()

  const [mode,     setMode]     = useState('login')  // 'login' | 'register'
  const [form,     setForm]     = useState({ username: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error,    setError]    = useState(null)

  // Already logged in → skip login page
  if (!loading && isAuth) return <Navigate to="/discover" replace />

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.username, form.email, form.password)
      }
      navigate('/discover', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700 }}>
            Lumina
          </span>
          <p className="muted" style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Your universe of media
          </p>
        </div>

        {/* Mode tabs */}
        <div className="tab-row" style={{ marginBottom: '1.5rem' }}>
          <button
            className={`chip ${mode === 'login' ? 'chip-active' : 'chip-inactive'}`}
            onClick={() => { setMode('login'); setError(null) }}
          >
            Sign In
          </button>
          <button
            className={`chip ${mode === 'register' ? 'chip-active' : 'chip-inactive'}`}
            onClick={() => { setMode('register'); setError(null) }}
          >
            Create Account
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="auth-error">
            <span className="nav-icon" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>error</span>
            {' '}{error}
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="form-input"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="coolwatcher99"
                value={form.username}
                onChange={update}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              value={form.password}
              onChange={update}
              required
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {submitting
              ? <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
              : mode === 'login' ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>

        {/* Google OAuth link */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>or</span>
          <br />
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', marginTop: '0.75rem', textDecoration: 'none' }}
          >
            <span className="nav-icon" style={{ fontSize: '1rem' }}>account_circle</span>
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  )
}
