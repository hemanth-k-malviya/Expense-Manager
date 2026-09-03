import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { detectLanguage, translate } from '../i18n'

const STORAGE_KEY = 'expense-so-cookie-ok'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)
  const t = (key) => translate(detectLanguage(), key)

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== '1')
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Private mode still hides the bar this visit.
    }
    setVisible(false)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 sm:p-4">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-[12px] border border-[#dfe6df] bg-white px-4 py-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-[12px] leading-5 text-[#46504c]">{t('site.cookie.body')}</p>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link to="/privacy" className="rounded-full px-3 py-2 text-[12px] font-semibold text-[#1d3434]">
            {t('site.cookie.privacy')}
          </Link>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-[#1d3434] px-4 py-2 text-[12px] font-semibold text-white"
          >
            {t('site.cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
