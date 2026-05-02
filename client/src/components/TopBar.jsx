/**
 * TopBar.jsx — Shared top bar rendered in the App shell.
 *
 * Structure:
 *   [Page Title]  [extras]  [🔍 search]  [avatar → profile]
 *
 * Search icon opens the SearchOverlay.
 * Avatar navigates to /profile.
 */
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePageTitleValue } from '../context/PageTitleContext'
import SearchOverlay from './SearchOverlay'

function TopBar() {
  const { user } = useAuth()
  const { title, extras } = usePageTitleValue()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  const initial = user?.username?.[0]?.toUpperCase() || '?'
  const isLumina = title === 'Lumina'

  return (
    <>
      <header className="top-bar glass">
        <span className={`top-bar-title ${isLumina ? 'gradient-text' : ''}`}>{title}</span>

        <div className="top-bar-actions">
          {/* Page-specific extras (e.g. 🔥 toggle on Discovery) */}
          {extras}

          {/* Search icon */}
          <button
            className="icon-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <span className="nav-icon">search</span>
          </button>

          {/* Profile avatar */}
          <button
            className="top-bar-avatar"
            onClick={() => navigate('/profile')}
            aria-label="Profile"
          >
            {initial}
          </button>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}

export default memo(TopBar)
