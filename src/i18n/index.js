import { DEFAULT_LANGUAGE } from './languages'
import { MESSAGES } from './messages'

export { LANGUAGES, applyDocumentLanguage, detectLanguage, languageMeta, DEFAULT_LANGUAGE } from './languages'

export function translate(language, key, vars) {
  const table = MESSAGES[language] || MESSAGES[DEFAULT_LANGUAGE]
  let text = table[key] ?? MESSAGES[DEFAULT_LANGUAGE][key] ?? key
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] == null ? '' : String(vars[name])))
  }
  return text
}

export function categoryLabel(t, name) {
  const key = `cat.${name}`
  const translated = t(key)
  return translated === key ? name : translated
}

export function paymentLabel(t, method) {
  const key = `pay.${method}`
  const translated = t(key)
  return translated === key ? method : translated
}
