import { useEffect, useMemo, useState } from 'react'
import { LANGUAGES, applyDocumentLanguage, detectLanguage, languageMeta, translate } from '../i18n'
import { APP_NAME } from '../lib/constants'
import Select from '../components/Select'

export function useAuthPageI18n() {
  const [language, setLanguage] = useState(() => detectLanguage())
  const t = useMemo(() => (key, vars) => translate(language, key, vars), [language])
  const dir = languageMeta(language).dir

  useEffect(() => {
    applyDocumentLanguage(language)
  }, [language])

  return { language, setLanguage, t, dir }
}

export default function AuthScreen({ title, subtitle, children, t, language, setLanguage }) {
  return (
    <div className="min-h-dvh bg-[#f7f8f5] lg:grid lg:grid-cols-[minmax(280px,42%)_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#1d3434] px-10 py-12 text-[#f6f7ef] lg:flex lg:flex-col">
        <div className="flex items-center gap-3 text-[22px] font-bold tracking-[-0.6px]">
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#c9e75b] text-[22px] text-[#213332]">+</span>
          <span className="font-['Space_Grotesk']">{APP_NAME.toLowerCase()}</span>
        </div>
        <div className="mt-auto max-w-sm">
          <p className="text-[11px] font-bold tracking-[1.4px] text-[#c9e75b]">{t('auth.kicker')}</p>
          <h1 className="mt-3 font-['Space_Grotesk'] text-[36px] font-semibold leading-tight">{t('auth.panelTitle')}</h1>
          <p className="mt-4 text-[15px] leading-7 text-[#adc0b9]">{t('auth.panelBody')}</p>
        </div>
        <span className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-[#c9e75b]/15" />
        <span className="pointer-events-none absolute right-20 top-24 h-24 w-24 rounded-full bg-[#e96d52]/20" />
      </aside>

      <section className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:px-16 lg:py-10">
        <div className="mb-8 flex items-center justify-between gap-3 lg:mb-10">
          <div className="flex items-center gap-2 text-[18px] font-bold text-[#1d3434] lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-[#c9e75b] text-[18px] text-[#213332]">+</span>
            <span className="font-['Space_Grotesk']">{APP_NAME.toLowerCase()}</span>
          </div>
          <div className="ml-auto w-[11rem]">
            <Select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label={t('settings.language')}
              className="w-full rounded-full border border-[#dfe6df] bg-white px-3 py-1.5 text-[11px] text-[#46504c] outline-none"
            >
              {LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.native}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[420px] flex-1">
          <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#223535]">{title}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#7d8782]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  )
}
