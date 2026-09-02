export const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English', locale: 'en-US', dir: 'ltr' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', locale: 'hi-IN', dir: 'ltr' },
  { code: 'es', native: 'Español', english: 'Spanish', locale: 'es-ES', dir: 'ltr' },
  { code: 'ar', native: 'العربية', english: 'Arabic', locale: 'ar', dir: 'rtl' },
  { code: 'fr', native: 'Français', english: 'French', locale: 'fr-FR', dir: 'ltr' },
  { code: 'zh', native: '中文', english: 'Chinese', locale: 'zh-CN', dir: 'ltr' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', locale: 'ta-IN', dir: 'ltr' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali', locale: 'bn-IN', dir: 'ltr' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', locale: 'te-IN', dir: 'ltr' },
  { code: 'pt', native: 'Português', english: 'Portuguese', locale: 'pt-BR', dir: 'ltr' },
  { code: 'de', native: 'Deutsch', english: 'German', locale: 'de-DE', dir: 'ltr' },
]

export const DEFAULT_LANGUAGE = 'en'

export function languageMeta(code) {
  return LANGUAGES.find((item) => item.code === code) || LANGUAGES[0]
}

export function detectLanguage() {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE
  const candidates = [navigator.language, ...(navigator.languages || [])]
    .filter(Boolean)
    .map((value) => value.slice(0, 2).toLowerCase())

  return candidates.find((code) => LANGUAGES.some((item) => item.code === code)) || DEFAULT_LANGUAGE
}

export function applyDocumentLanguage(code) {
  const meta = languageMeta(code)
  if (typeof document === 'undefined') return
  document.documentElement.lang = meta.locale
  document.documentElement.dir = meta.dir
}
