/**
 * ProfilePage.jsx — User profile & settings
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }      from '../context/AuthContext'
import { useState }     from 'react'
import { useLibrary }   from '../hooks/useLibrary'
import { usePageTitle } from '../context/PageTitleContext'

const MEDIA_TYPES = [
  { id: 'movie', label: 'Movies' },
  { id: 'tvshow', label: 'TV Shows' },
  { id: 'anime', label: 'Anime' },
  { id: 'manga', label: 'Manga' },
  { id: 'book', label: 'Books' }
];

export default function ProfilePage() {
  usePageTitle('Profile')
  const { user, logout, updateSettings } = useAuth()
  const { entries } = useLibrary()
  const navigate = useNavigate()

  const [updatingSettings, setUpdatingSettings] = useState(false)

  const handleAdultToggle = async () => {
    if (updatingSettings) return
    setUpdatingSettings(true)
    try {
      const newAdultMode = !(user?.settings?.adultMode || false)
      await updateSettings({ adultMode: newAdultMode })
    } catch (err) {
      console.error('Failed to update adult mode', err)
    } finally {
      setUpdatingSettings(false)
    }
  }

  const handleExcludeToggle = async (typeId) => {
    if (updatingSettings) return
    setUpdatingSettings(true)
    try {
      const current = user?.settings?.excludeTypes || []
      const isExcluded = current.includes(typeId)
      const newExclude = isExcluded
        ? current.filter(t => t !== typeId)
        : [...current, typeId]
      await updateSettings({ excludeTypes: newExclude })
    } catch (err) {
      console.error('Failed to update exclude types', err)
    } finally {
      setUpdatingSettings(false)
    }
  }

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
        <div className="profile-option" onClick={handleAdultToggle} style={{ opacity: updatingSettings ? 0.5 : 1, paddingRight: '1rem' }}>
          <span className="nav-icon" style={{ fontSize: '1.2rem', color: user?.settings?.adultMode ? 'var(--tertiary)' : 'var(--text-muted)' }}>18_up_rating</span>
          <span style={{ flex: 1 }}>Include 18+ Adult Content</span>
          <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={user?.settings?.adultMode || false} onChange={handleAdultToggle} disabled={updatingSettings} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="profile-option" onClick={handleClearRecent}>
          <span className="nav-icon" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>history</span>
          <span>Clear recent searches</span>
          <span className="nav-icon profile-chevron">chevron_right</span>
        </div>
      </div>

      {/* Excluded Types */}
      <div className="profile-section">
        <h3 className="profile-section-title">Filter Search Results</h3>
        <p className="muted" style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
          Select content types to <strong>hide</strong> from your search results.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {MEDIA_TYPES.map(type => {
            const isBlocked = (user?.settings?.excludeTypes || []).includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() => handleExcludeToggle(type.id)}
                className={`chip ${isBlocked ? 'chip-active' : 'chip-inactive'}`}
                style={{ opacity: updatingSettings ? 0.5 : 1 }}
              >
                {isBlocked && <span className="nav-icon" style={{ fontSize: '1rem', marginRight: '0.2rem' }}>block</span>}
                {type.label}
              </button>
            )
          })}
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
