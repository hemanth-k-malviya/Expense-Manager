import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Field, { controlClass } from '../components/Field'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'
import { APP_HOME, isAppPath } from '../lib/site'
import AuthScreen, { useAuthPageI18n } from './AuthScreen'

export default function Login() {
  const { login, sendPasswordReset, configured, authErrorKey } = useAuth()
  const { language, setLanguage, t } = useAuthPageI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [error, setError] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const noticeRef = useRef(null)

  useEffect(() => {
    if (searchParams.get('oobCode') || searchParams.get('mode') === 'resetPassword') {
      navigate(`/reset-password?${searchParams.toString()}`, { replace: true })
    }
  }, [navigate, searchParams])

  useEffect(() => {
    if (!resetEmail) return
    noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [resetEmail])

  const goHome = () => {
    const from = location.state?.from
    navigate(isAppPath(from) ? from : APP_HOME, { replace: true })
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextEmail = email.trim()
    if (!nextEmail) {
      setError(t('auth.needEmail'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.needPassword'))
      return
    }
    setBusy(true)
    setError('')
    setResetEmail('')
    try {
      await login({ email: nextEmail, password })
      goHome()
    } catch (caught) {
      setError(t(authErrorKey(caught)))
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    const nextEmail = email.trim()
    if (!nextEmail) {
      setResetEmail('')
      setError(t('auth.needEmail'))
      return
    }
    setResetBusy(true)
    setError('')
    setResetEmail('')
    try {
      await sendPasswordReset(nextEmail)
      setResetEmail(nextEmail)
    } catch (caught) {
      setError(t(authErrorKey(caught)))
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <AuthScreen title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')} t={t} language={language} setLanguage={setLanguage}>
      {!configured ? <p className="mb-4 rounded-[10px] bg-[#f7efe6] px-3 py-2 text-[12px] text-[#8a5a2b]">{t('auth.missingConfig')}</p> : null}
      {resetEmail ? (
        <div
          ref={noticeRef}
          role="status"
          className="mb-5 rounded-[14px] border border-[#c9e75b] bg-[#f4fbe3] px-4 py-4 shadow-[0_8px_20px_rgba(29,52,52,0.08)]"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#1d3434] text-[16px] font-bold text-[#c9e75b]">✓</span>
            <div className="min-w-0">
              <p className="font-['Space_Grotesk'] text-[16px] font-semibold text-[#1d3434]">{t('auth.resetSentTitle')}</p>
              <p className="mt-1 text-[13px] text-[#5b6b67]">{t('auth.resetSentBody')}</p>
              <p className="mt-2 break-all rounded-[8px] bg-white px-3 py-2 text-[14px] font-semibold text-[#1d3434]">
                {resetEmail}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-[#5b6b67]">{t('auth.resetSentHint')}</p>
            </div>
          </div>
        </div>
      ) : null}
      <GoogleSignInButton t={t} />
      <p className="my-5 text-center text-[11px] font-semibold tracking-[0.12em] text-[#9aa39c]">{t('auth.orEmail')}</p>
      <form className="space-y-4" onSubmit={submit}>
        <Field label={t('auth.email')} placeholder={t('auth.emailPh')}>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={controlClass}
          />
        </Field>
        <Field label={t('auth.password')} placeholder={t('auth.passwordPh')}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${controlClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((open) => !open)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[11px] text-[#5b6b67]"
            >
              {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetPassword}
            disabled={resetBusy || !configured}
            className="text-[12px] font-semibold text-[#1d3434] disabled:opacity-50"
          >
            {resetBusy ? t('auth.working') : t('auth.forgotPassword')}
          </button>
        </div>
        {error ? (
          <p className="rounded-[10px] bg-[#fdecea] px-3 py-2 text-[12px] font-medium text-[#c45b45]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !configured}
          className="min-h-11 w-full rounded-[8px] bg-[#e96d52] text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? t('auth.working') : t('auth.signIn')}
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-[#7d8782]">
        {t('auth.needAccount')}{' '}
        <Link to="/register" className="font-semibold text-[#1d3434]">
          {t('auth.goRegister')}
        </Link>
      </p>
    </AuthScreen>
  )
}
