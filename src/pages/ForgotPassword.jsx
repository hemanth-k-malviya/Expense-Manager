import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Field, { controlClass } from '../components/Field'
import { useAuth } from '../context/AuthContext'
import AuthScreen, { useAuthPageI18n } from './AuthScreen'

export default function ForgotPassword() {
  const { sendPasswordReset, authErrorKey } = useAuth()
  const { language, setLanguage, t } = useAuthPageI18n()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(() => String(searchParams.get('email') || '').trim())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [sender, setSender] = useState('')

  const loginHref = useMemo(() => (email.trim() ? `/login?email=${encodeURIComponent(email.trim())}` : '/login'), [email])

  const submit = async (event) => {
    event.preventDefault()
    const nextEmail = email.trim()
    if (!nextEmail) {
      setError(t('auth.needEmail'))
      return
    }
    setBusy(true)
    setError('')
    setSentTo('')
    setSender('')
    try {
      const result = await sendPasswordReset(nextEmail)
      setSender(result?.sender || '')
      setSentTo(nextEmail)
    } catch (caught) {
      const key = authErrorKey(caught)
      setError(key === 'auth.error.generic' && caught?.message ? caught.message : t(key))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthScreen title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')} t={t} language={language} setLanguage={setLanguage}>
      {sentTo ? (
        <div role="status" className="mb-5 rounded-[14px] border border-[#c9e75b] bg-[#f4fbe3] px-4 py-4">
          <p className="font-['Space_Grotesk'] text-[16px] font-semibold text-[#1d3434]">{t('auth.resetSentTitle')}</p>
          <p className="mt-1 text-[13px] text-[#5b6b67]">{t('auth.resetSentBody')}</p>
          <p className="mt-2 break-all rounded-[8px] bg-white px-3 py-2 text-[14px] font-semibold text-[#1d3434]">{sentTo}</p>
          <p className="mt-2 text-[12px] leading-5 text-[#5b6b67]">
            {t('auth.resetSentHint', { sender: sender || t('auth.resetSenderFallback') })}
          </p>
          <Link to={loginHref} className="mt-4 inline-flex min-h-11 items-center rounded-[8px] bg-[#1d3434] px-4 text-[13px] font-semibold text-white">
            {t('auth.goLogin')}
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit} data-allow-autocomplete>
          <p className="text-[13px] leading-6 text-[#5b6b67]">{t('auth.forgotHelp')}</p>
          <Field label={t('auth.email')} placeholder={t('auth.emailPh')}>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={controlClass}
            />
          </Field>
          {error ? <p className="rounded-[10px] bg-[#fdecea] px-3 py-2 text-[12px] font-medium text-[#c45b45]">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 w-full rounded-[8px] bg-[#e96d52] text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? t('auth.working') : t('auth.resetPassword')}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-[13px] text-[#7d8782]">
        {t('auth.forgotGoogleHint')}{' '}
        <Link to={loginHref} className="font-semibold text-[#1d3434]">
          {t('auth.goLogin')}
        </Link>
      </p>
    </AuthScreen>
  )
}
