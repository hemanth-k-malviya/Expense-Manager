import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isPasswordResetAction, passwordResetPath } from '../lib/authAction'

export default function AuthActionRedirect({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPasswordResetAction(location)) return
    if (location.pathname === '/reset-password') return
    navigate(passwordResetPath(location), { replace: true })
  }, [location, navigate])

  return children
}
