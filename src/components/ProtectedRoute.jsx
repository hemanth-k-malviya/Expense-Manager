import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isPasswordResetAction } from '../lib/authAction'
import { APP_HOME } from '../lib/site'
import AuthSplash from './AuthSplash'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthSplash />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

const GUEST_ALWAYS_PATHS = new Set(['/forgot-password', '/reset-password', '/__/auth/action'])

export function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthSplash />
  // Always allow password recovery — even with a stale session still in localStorage.
  if (
    GUEST_ALWAYS_PATHS.has(location.pathname) ||
    location.pathname.startsWith('/reset-password/') ||
    isPasswordResetAction(location)
  ) {
    return children
  }
  if (user) return <Navigate to={APP_HOME} replace />
  return children
}
