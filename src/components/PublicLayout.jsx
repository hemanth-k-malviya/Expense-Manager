import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../lib/constants'
import { APP_HOME, FOOTER_NAV, PUBLIC_NAV, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../lib/site'
import { usePageI18n } from '../i18n/usePageI18n'
import CookieNotice from './CookieNotice'
import { PublicSiteContext } from './publicSiteContext'
import Select from './Select'
import { LANGUAGES } from '../i18n'

const linkClass = ({ isActive }) =>
  `rounded-full px-3 py-2 text-[13px] ${isActive ? 'bg-[#eef3e4] font-semibold text-[#1d3434]' : 'text-[#46504c] hover:text-[#1d3434]'}`

export default function PublicLayout() {
  const i18n = usePageI18n()
  const { user } = useAuth()
  const { t, language, setLanguage, dir } = i18n

  return (
    <PublicSiteContext.Provider value={i18n}>
      <div className="min-h-dvh bg-[#f7f8f5] text-[#213432]" dir={dir}>
        <header className="sticky top-0 z-30 border-b border-[#e4e8df] bg-[#fbfcf9]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link to="/" className="flex items-center gap-2 text-[18px] font-bold tracking-[-0.5px] text-[#1d3434]">
              <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-[#c9e75b] text-[18px] text-[#213332]">+</span>
              <span className="font-['Space_Grotesk']">{APP_NAME.toLowerCase()}</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1" aria-label="Public">
              {PUBLIC_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <div className="w-[9.5rem]">
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
              {user ? (
                <Link to={APP_HOME} className="rounded-full bg-[#1d3434] px-3 py-2 text-[12px] font-semibold text-white">
                  {t('site.cta.openApp')}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hidden rounded-full px-3 py-2 text-[12px] font-semibold text-[#1d3434] sm:inline">
                    {t('site.cta.signIn')}
                  </Link>
                  <Link to="/register" className="rounded-full bg-[#e96d52] px-3 py-2 text-[12px] font-semibold text-white">
                    {t('site.cta.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>

        <footer className="border-t border-[#e4e8df] bg-[#1d3434] text-[#d7e0db]">
          <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
            <p className="font-['Space_Grotesk'] text-[18px] font-semibold text-white">{APP_NAME.toLowerCase()}</p>
            <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-[#adc0b9]">{t('site.footer.blurb')}</p>
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]" aria-label={t('site.footer.legal')}>
              {FOOTER_NAV.map((item) => (
                <Link key={item.to} to={item.to} className="hover:text-white">
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>
            <p className="mt-6 text-[13px]">
                <a className="break-all hover:text-white" href={SUPPORT_MAILTO}>
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
          <div className="border-t border-[#2e4947] px-4 py-4 text-center text-[11px] text-[#8aa39b] sm:px-6">
            © 2026 {APP_NAME}
          </div>
        </footer>
        <CookieNotice />
      </div>
    </PublicSiteContext.Provider>
  )
}
