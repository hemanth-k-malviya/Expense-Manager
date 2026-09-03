import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96L3.97 7.29C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}

export default function GoogleSignInButton({ t, showHint = false }) {
  const { loginWithGoogle, configured, authErrorKey } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onClick = async () => {
    setBusy(true)
    setError('')
    try {
      await loginWithGoogle()
      const from = location.state?.from
      navigate(typeof from === 'string' && from.startsWith('/') ? from : '/', { replace: true })
    } catch (caught) {
      if (caught?.code === 'auth/popup-closed-by-user' || caught?.code === 'auth/cancelled-popup-request') {
        setError('')
      } else {
        setError(t(authErrorKey(caught)))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {showHint && !configured ? <p className="mb-4 rounded-[10px] bg-[#f7efe6] px-3 py-2 text-[12px] text-[#8a5a2b]">{t('auth.missingConfig')}</p> : null}
      <button
        type="button"
        onClick={onClick}
        disabled={busy || !configured}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-[8px] border border-[#dfe6df] bg-white text-[13px] font-semibold text-[#213432] disabled:opacity-50"
      >
        <GoogleMark />
        {busy ? t('auth.working') : t('auth.google')}
      </button>
      {error ? <p className="mt-3 text-[12px] text-[#c45b45]">{error}</p> : null}
    </div>
  )
}
