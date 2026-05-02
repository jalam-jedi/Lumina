import { memo } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/discover', icon: 'explore',       label: 'Discover' },
  { to: '/library',  icon: 'video_library', label: 'Library'  },
  { to: '/trending', icon: 'trending_up',   label: 'Trending' },
]

function SideNav() {
  return (
    <aside className="side-nav glass">
      {/* Logo */}
      <div className="side-nav-logo">
        <span className="gradient-text side-nav-brand">Lumina</span>
      </div>

      {/* Links */}
      <nav className="side-nav-links">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon side-nav-icon">{icon}</span>
            <span className="side-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default memo(SideNav)
