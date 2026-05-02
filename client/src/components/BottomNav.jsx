import { memo } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/discover', icon: 'explore',       label: 'Discover' },
  { to: '/library',  icon: 'video_library', label: 'Library'  },
  { to: '/trending', icon: 'trending_up',   label: 'Trending' },
]

function BottomNav() {
  return (
    <nav className="bottom-nav glass">
      {navItems.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default memo(BottomNav)
