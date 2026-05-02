/**
 * ProfilePage.jsx — User profile & settings
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }      from '../context/AuthContext'
import { useLibrary }   from '../hooks/useLibrary'
import { usePageTitle } from '../context/PageTitleContext'

export default function ProfilePage() {
  usePageTitle('Profile')
  const { user, logout } = useAuth()
  const { entries } = useLibrary()
  const navigate = useNavigate()

  const stats = useMemo(() => ({
    total:     entries.length,
    completed: entries.filter((e) => e.status === 'completed').length,
    watching:  entries.filter((e) => e.status === 'in-progress').length,
    planned:   entries.filter((e) => e.status === 'planning').length,
  }), [entries])

  const initial = user?.username?.[0]?.toUpperCase() || '?'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleClearRecent = () => {
    localStorage.removeItem('lumina_recent_searches')
  }

  return (
    <main className="page">
      {/* Profile hero */}
      <div className="profile-hero">
        <div className="profile-avatar-lg">{initial}</div>
        <h1 className="profile-username">{user?.username || 'User'}</h1>
        <p className="profile-email muted">{user?.email || ''}</p>
      </div>

      {/* Stats row */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.watching}</div>
          <div className="stat-label">Watching</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.planned}</div>
          <div className="stat-label">Planned</div>
        </div>
      </div>

      {/* Settings list */}
      <div className="profile-section">
        <h3 className="profile-section-title">Settings</h3>
        <div className="profile-option" onClick={handleClearRecent}>
          <span className="nav-icon" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>history</span>
          <span>Clear recent searches</span>
          <span className="nav-icon profile-chevron">chevron_right</span>
        </div>
      </div>

      {/* About */}
      <div className="profile-section">
        <h3 className="profile-section-title">About</h3>
        <div className="profile-option" style={{ cursor: 'default' }}>
          <span className="nav-icon" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>info</span>
          <span>Lumina v1.0</span>
          <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Your Media Universe</span>
        </div>
      </div>

      {/* Sign out */}
      <button className="profile-signout" onClick={handleLogout}>
        <span className="nav-icon" style={{ fontSize: '1.2rem' }}>logout</span>
        Sign Out
      </button>
    </main>
  )
}
