const API_TOKEN_KEY = 'expense-so-api-token'
const API_USER_KEY = 'expense-so-api-user'

/** Ensure base ends with /api — production often sets host only and misses the prefix. */
export function normalizeApiBaseUrl(raw) {
  let base = String(raw || 'http://localhost:3000/api').trim().replace(/\/+$/, '')
  if (!base) base = 'http://localhost:3000/api'
  if (!/\/api$/i.test(base)) {
    base = `${base}/api`
  }
  return base
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export function getApiToken() {
  return localStorage.getItem(API_TOKEN_KEY)
}

export function getStoredApiUser() {
  try {
    const raw = localStorage.getItem(API_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setApiSession(token, user) {
  if (token) localStorage.setItem(API_TOKEN_KEY, token)
  if (user) localStorage.setItem(API_USER_KEY, JSON.stringify(user))
}

export function clearApiSession() {
  localStorage.removeItem(API_TOKEN_KEY)
  localStorage.removeItem(API_USER_KEY)
}

async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const authToken = token ?? getApiToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `API request failed (${response.status})`)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export async function syncFirebaseWithApi(idToken) {
  const result = await request('/auth/firebase', {
    method: 'POST',
    body: { idToken },
    token: null,
  })
  setApiSession(result.data.token, result.data.user)
  return result.data
}

export async function apiLogin({ email, password }) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    token: null,
  })
  setApiSession(result.data.token, result.data.user)
  return result.data
}

export async function apiRegister({ name, email, password, currency, language, workspace }) {
  const result = await request('/auth/register', {
    method: 'POST',
    body: { name, email, password, currency, language, workspace },
    token: null,
  })
  setApiSession(result.data.token, result.data.user)
  return result.data
}

export async function fetchWorkspace() {
  const result = await request('/workspace')
  return result.data
}

export async function saveWorkspace(payload) {
  const result = await request('/workspace', {
    method: 'PUT',
    body: payload,
  })
  return result.data
}

export { API_BASE_URL }
