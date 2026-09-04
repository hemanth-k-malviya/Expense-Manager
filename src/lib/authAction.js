const RESET_PATH = '/reset-password'

function paramsFromHash(hash) {
  const raw = String(hash || '').replace(/^#/, '')
  if (!raw) return new URLSearchParams()
  const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw
  return new URLSearchParams(query)
}

function paramsFromNestedLink(value) {
  if (!value) return new URLSearchParams()
  try {
    return new URL(value).searchParams
  } catch {
    return new URLSearchParams()
  }
}

function firstValue(sources, keys) {
  for (const key of keys) {
    for (const params of sources) {
      const value = String(params.get(key) || '').trim()
      if (value) return value
    }
  }
  return ''
}

export function authActionFromLocation(location) {
  const search = new URLSearchParams(location.search)
  const hash = paramsFromHash(location.hash)
  const nested = paramsFromNestedLink(search.get('link') || hash.get('link'))
  const sources = [search, hash, nested]
  const oobCode = firstValue(sources, ['oobCode', 'oobcode'])
  const mode = firstValue(sources, ['mode'])
  return { oobCode, mode, search, hash, nested }
}

export function isPasswordResetAction(location) {
  const { oobCode, mode } = authActionFromLocation(location)
  if (!oobCode) return false
  return !mode || mode === 'resetPassword'
}

export function passwordResetPath(location) {
  const { oobCode, mode, search, hash, nested } = authActionFromLocation(location)
  const next = new URLSearchParams()
  for (const params of [search, hash, nested]) {
    params.forEach((value, key) => {
      if (!next.has(key)) next.set(key, value)
    })
  }
  if (oobCode) next.set('oobCode', oobCode)
  if (mode) next.set('mode', mode)
  const query = next.toString()
  return query ? `${RESET_PATH}?${query}` : RESET_PATH
}

export function resetContinueUrl() {
  if (typeof window === 'undefined') return `${RESET_PATH}`
  return `${window.location.origin}${RESET_PATH}`
}
