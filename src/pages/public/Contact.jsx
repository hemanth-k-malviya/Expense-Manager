import { useMemo, useState } from 'react'
import { usePublicSite } from '../../components/publicSiteContext'
import Field, { controlClass } from '../../components/Field'
import { OPERATOR_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../lib/site'
import { usePublicMeta } from './usePublicMeta'

function buildLetter(t, name, email, message) {
  return [t('site.contact.greeting'), '', message.trim(), '', t('site.contact.regards'), name.trim(), email.trim()].join('\n')
}

function mailHref(subject, body) {
  return `${SUPPORT_MAILTO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function Contact() {
  const { t } = usePublicSite()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  usePublicMeta({
    title: t('site.contact.title'),
    description: t('site.contact.lede'),
  })

  const ready = Boolean(name.trim() && email.trim() && message.trim())
  const href = useMemo(
    () => mailHref(t('site.contact.subject'), buildLetter(t, name, email, message)),
    [email, message, name, t],
  )

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(t('site.contact.copy'), SUPPORT_EMAIL)
    }
  }

  const onSend = (event) => {
    if (ready) {
      setError('')
      return
    }
    event.preventDefault()
    setError(t('site.contact.needAll'))
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-['Space_Grotesk'] text-[34px] font-semibold text-[#1d3434]">{t('site.contact.title')}</h1>
      <p className="mt-4 text-[17px] leading-7 text-[#33403d]">{t('site.contact.lede')}</p>

      <div className="mt-8 rounded-[14px] border border-[#e4e8df] bg-white px-5 py-6">
        <p className="text-[11px] font-bold tracking-[0.12em] text-[#7d8782]">{t('site.contact.direct')}</p>
        <p className="mt-1 text-[13px] text-[#5b6b67]">
          {t('site.contact.operator')}: {OPERATOR_NAME}
        </p>
        <a href={SUPPORT_MAILTO} className="mt-3 block break-all font-['Space_Grotesk'] text-[20px] font-semibold text-[#1d3434]">
          {SUPPORT_EMAIL}
        </a>
        <button
          type="button"
          onClick={copyEmail}
          className="mt-4 min-h-10 rounded-full border border-[#dfe6df] px-4 text-[12px] font-semibold text-[#1d3434]"
        >
          {copied ? t('site.contact.copied') : t('site.contact.copy')}
        </button>
      </div>

      <form className="mt-8 space-y-4" onSubmit={(event) => event.preventDefault()}>
        <Field label={t('site.contact.name')}>
          <input value={name} onChange={(event) => setName(event.target.value)} className={controlClass} autoComplete="name" />
        </Field>
        <Field label={t('site.contact.email')}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={controlClass}
            autoComplete="email"
          />
        </Field>
        <Field label={t('site.contact.message')}>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} className={controlClass} />
        </Field>
        {error ? <p className="text-[12px] font-medium text-[#c45b45]">{error}</p> : null}
        <a
          href={ready ? href : undefined}
          onClick={onSend}
          className="inline-flex min-h-11 items-center rounded-[8px] bg-[#1d3434] px-5 text-[13px] font-semibold text-white"
        >
          {t('site.contact.send')}
        </a>
      </form>
    </article>
  )
}
