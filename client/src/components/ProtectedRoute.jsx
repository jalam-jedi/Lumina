/**
 * ProtectedRoute.jsx
 * Redirects to /login if the user is not authenticated.
 * Shows a spinner while AuthContext restores the session.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-spinner">
        <div className="spinner" />
      </div>
    )
  }

  return isAuth ? children : <Navigate to="/login" replace />
}
