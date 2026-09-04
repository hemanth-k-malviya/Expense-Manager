import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthSplash from '../components/AuthSplash'
import Field, { controlClass } from '../components/Field'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'
import { APP_HOME } from '../lib/site'
import AuthScreen, { useAuthPageI18n } from './AuthScreen'

export default function Register() {
  const { register, configured, authErrorKey, user, loading } = useAuth()
  const { language, setLanguage, t } = useAuthPageI18n()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const nextName = name.trim()
    const nextEmail = email.trim()
    if (!nextName) {
      setError(t('auth.needName'))
      return
    }
    if (!nextEmail) {
      setError(t('auth.needEmail'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.needPassword'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.mismatch'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await register({ name: nextName, email: nextEmail, password })
      navigate(APP_HOME, { replace: true })
    } catch (caught) {
      setError(t(authErrorKey(caught)))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <AuthSplash />
  if (user) return <Navigate to={APP_HOME} replace />

  return (
    <AuthScreen title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} t={t} language={language} setLanguage={setLanguage}>
      {!configured ? <p className="mb-4 rounded-[10px] bg-[#f7efe6] px-3 py-2 text-[12px] text-[#8a5a2b]">{t('auth.missingConfig')}</p> : null}
      <GoogleSignInButton t={t} />
      <p className="my-5 text-center text-[11px] font-semibold tracking-[0.12em] text-[#9aa39c]">{t('auth.orEmail')}</p>
      <form className="space-y-4" onSubmit={submit}>
        <Field label={t('auth.name')} placeholder={t('auth.namePh')}>
          <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={controlClass} />
        </Field>
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
              autoComplete="new-password"
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
        <Field label={t('auth.confirmPassword')} placeholder={t('auth.passwordPh')}>
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={controlClass}
          />
        </Field>
        {error ? <p className="text-[12px] text-[#c45b45]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !configured}
          className="min-h-11 w-full rounded-[8px] bg-[#e96d52] text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? t('auth.working') : t('auth.createAccount')}
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-[#7d8782]">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-[#1d3434]">
          {t('auth.goLogin')}
        </Link>
      </p>
    </AuthScreen>
  )
}
