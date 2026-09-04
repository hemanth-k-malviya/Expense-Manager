import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isPasswordResetAction } from '../lib/authAction'
import { APP_HOME } from '../lib/site'
import AuthSplash from './AuthSplash'

export function ProtectedRoute({ children }) {
  const { user, loading, configured } = useAuth()
  const location = useLocation()

  if (loading) return <AuthSplash />
  if (!configured || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthSplash />
  if (isPasswordResetAction(location)) return children
  if (user) return <Navigate to={APP_HOME} replace />
  return children
}
