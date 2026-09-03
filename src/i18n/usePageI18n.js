import { useEffect, useMemo, useState } from 'react'
import { applyDocumentLanguage, detectLanguage, languageMeta, translate } from './index'

export function usePageI18n() {
  const [language, setLanguage] = useState(() => detectLanguage())
  const t = useMemo(() => (key, vars) => translate(language, key, vars), [language])
  const dir = languageMeta(language).dir

  useEffect(() => {
    applyDocumentLanguage(language)
  }, [language])

  return { language, setLanguage, t, dir }
}
