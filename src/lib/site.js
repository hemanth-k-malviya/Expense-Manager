export const APP_HOME = '/app'
export const SUPPORT_EMAIL = 'hemanthmalviya6@gmail.com'
export const OPERATOR_NAME = 'Hemant Maviya'
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`

export function openSupportMail({ subject = '', body = '' } = {}) {
  const parts = []
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`)
  if (body) parts.push(`body=${encodeURIComponent(body)}`)
  window.location.href = `${SUPPORT_MAILTO}${parts.length ? `?${parts.join('&')}` : ''}`
}
export const MIN_USER_AGE = 14
export const ADSENSE_PUBLISHER_ID = 'ca-pub-9387062363004258'
export const GOOGLE_ADS_TXT_LINE = 'google.com, pub-9387062363004258, DIRECT, f08c47fec0942fa0'
export const GOOGLE_HOW_DATA_IS_USED = 'https://policies.google.com/technologies/partner-sites'
export const GOOGLE_AD_SETTINGS = 'https://adssettings.google.com'

const fallbackOrigin = 'https://expenseso.vercel.app'

export const SITE_URL = String(import.meta.env.VITE_SITE_URL || fallbackOrigin).replace(/\/$/, '')

export const APP_PATHS = [
  APP_HOME,
  '/transactions',
  '/budgets',
  '/goals',
  '/reports',
  '/books',
  '/settings',
  '/pricing',
  '/business',
  '/team',
  '/clients',
  '/approvals',
  '/vendors',
  '/shops',
  '/analytics',
]

export function isAppPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return false
  return APP_PATHS.some((item) => path === item || path.startsWith(`${item}/`))
}

export const PUBLIC_NAV = [
  { to: '/guides', labelKey: 'site.nav.guides' },
  { to: '/about', labelKey: 'site.nav.about' },
  { to: '/contact', labelKey: 'site.nav.contact' },
]

export const LEGAL_NAV = [
  { to: '/privacy', labelKey: 'site.nav.privacy' },
  { to: '/terms', labelKey: 'site.nav.terms' },
  { to: '/disclaimer', labelKey: 'site.nav.disclaimer' },
]

export const FOOTER_NAV = [
  { to: '/', labelKey: 'site.nav.home' },
  ...LEGAL_NAV,
  { to: '/contact', labelKey: 'site.nav.contact' },
]
