import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import Field, { controlClass } from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { authActionFromLocation } from '../lib/authAction'
import AuthScreen, { useAuthPageI18n } from './AuthScreen'

export default function ResetPassword() {
  const { verifyResetCode, completePasswordReset, completeApiPasswordReset, authErrorKey } = useAuth()
  const { language, setLanguage, t } = useAuthPageI18n()
  const location = useLocation()
  const { resetToken: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const code = authActionFromLocation(location).oobCode
  const apiToken = String(
    pathToken || searchParams.get('token') || searchParams.get('resetToken') || '',
  ).trim()
  const emailFromQuery = String(searchParams.get('email') || '').trim()
  const isApiReset = Boolean(apiToken) && !code

  const [email, setEmail] = useState(emailFromQuery)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checking, setChecking] = useState(Boolean(code))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const canSubmit = useMemo(() => {
    if (isApiReset) return Boolean(apiToken)
    return Boolean(code && email)
  }, [apiToken, code, email, isApiReset])

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery)
  }, [emailFromQuery])

  useEffect(() => {
    if (!code) {
      setChecking(false)
      return undefined
    }
    let cancelled = false
    verifyResetCode(code)
      .then((value) => {
        if (!cancelled) setEmail(value)
      })
      .catch((caught) => {
        if (!cancelled) setError(t(authErrorKey(caught)))
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [authErrorKey, code, t, verifyResetCode])

  const submit = async (event) => {
    event.preventDefault()
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
      if (isApiReset) {
        await completeApiPasswordReset(apiToken, password)
      } else {
        await completePasswordReset(code, password)
      }
      setDone(true)
    } catch (caught) {
      const key = authErrorKey(caught)
      setError(key === 'auth.error.generic' && caught?.message ? caught.message : t(key))
    } finally {
      setBusy(false)
    }
  }

  const showForm = !checking && !done && canSubmit
  const showMissing = !checking && !done && !canSubmit

  return (
    <AuthScreen
      title={t('auth.resetPageTitle')}
      subtitle={
        email
          ? t('auth.resetPageSubtitle', { email })
          : isApiReset
            ? t('auth.resetPageSubtitleGeneric')
            : t('auth.resetPageMissing')
      }
      t={t}
      language={language}
      setLanguage={setLanguage}
    >
      {checking ? <p className="text-[13px] text-[#7d8782]">{t('auth.working')}</p> : null}
      {done ? (
        <div className="rounded-[14px] border border-[#c9e75b] bg-[#f4fbe3] px-4 py-4">
          <p className="font-['Space_Grotesk'] text-[16px] font-semibold text-[#1d3434]">{t('auth.resetPageDone')}</p>
          <Link to="/login" className="mt-3 inline-flex min-h-11 items-center rounded-[8px] bg-[#e96d52] px-4 text-[13px] font-semibold text-white">
            {t('auth.goLogin')}
          </Link>
        </div>
      ) : null}
      {showForm ? (
        <form className="space-y-4" onSubmit={submit} data-allow-autocomplete>
          <p className="text-[13px] leading-6 text-[#5b6b67]">{t('auth.resetPageHelp')}</p>
          <Field label={t('auth.newPassword')} placeholder={t('auth.passwordPh')}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${controlClass} pr-16`}
                autoFocus
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
          {error ? <p className="rounded-[10px] bg-[#fdecea] px-3 py-2 text-[12px] font-medium text-[#c45b45]">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 w-full rounded-[8px] bg-[#e96d52] text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? t('auth.working') : t('auth.savePassword')}
          </button>
        </form>
      ) : null}
      {showMissing ? (
        <div>
          {error ? <p className="mb-4 rounded-[10px] bg-[#fdecea] px-3 py-2 text-[12px] font-medium text-[#c45b45]">{error}</p> : null}
          <p className="mb-4 text-[13px] leading-6 text-[#5b6b67]">{t('auth.resetPageMissing')}</p>
          <Link to="/forgot-password" className="inline-flex min-h-11 items-center rounded-[8px] bg-[#1d3434] px-4 text-[13px] font-semibold text-white">
            {t('auth.requestNewReset')}
          </Link>
        </div>
      ) : null}
    </AuthScreen>
  )
}
