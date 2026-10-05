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

/** Keep Mongo password in sync after Firebase password reset / email login. */
export async function syncPasswordWithApi({ idToken, password }) {
  const result = await request('/auth/sync-password', {
    method: 'POST',
    body: { idToken, password },
    token: null,
  })
  if (result?.data?.token && result?.data?.user) {
    setApiSession(result.data.token, result.data.user)
  }
  return result.data
}

export async function apiForgotPassword(email) {
  const result = await request('/auth/forgot-password', {
    method: 'POST',
    body: {
      email,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
    token: null,
  })
  return result.data
}

export async function apiResetPassword({ token, password }) {
  const result = await request('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
    token: null,
  })
  if (result?.data?.token && result?.data?.user) {
    setApiSession(result.data.token, result.data.user)
  } else if (result?.data?.token) {
    setApiSession(result.data.token, getStoredApiUser())
  }
  return result.data
}

export async function apiChangePassword({ currentPassword, newPassword }) {
  const result = await request('/auth/change-password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
  })
  return result
}

export async function fetchWorkspace() {
  const result = await request('/workspace')
  return result.data
}

const PAYMENT_METHODS = ['Card', 'Cash', 'Bank', 'UPI', 'Wallet', 'Credit']
const STATUSES = ['recorded', 'pending', 'submitted', 'approved', 'rejected', 'reimbursed']

/** Shape payload so Mongo validation won't reject the whole workspace save. */
export function sanitizeWorkspacePayload(payload = {}) {
  const categories = []
  const seenCategories = new Set()
  for (const item of payload.categories || []) {
    const name = String(item?.name || '').trim().slice(0, 60)
    const type = item?.type === 'income' ? 'income' : 'expense'
    if (!name) continue
    const key = `${type}:${name.toLowerCase()}`
    if (seenCategories.has(key)) continue
    seenCategories.add(key)
    categories.push({
      name,
      type,
      color: item.color || '#6d7d9d',
      isDefault: Boolean(item.isDefault),
    })
  }

  const today = new Date().toISOString().slice(0, 10)
  const transactions = (payload.transactions || []).map((item, index) => {
    const amount = Number(item?.amount)
    const onCredit = Boolean(item?.onCredit) || item?.paymentMethod === 'Credit'
    const paymentMethod = PAYMENT_METHODS.includes(item?.paymentMethod)
      ? item.paymentMethod
      : onCredit
        ? 'Credit'
        : 'Cash'
    const status = STATUSES.includes(item?.status) ? item.status : 'recorded'
    const rawDate = String(item?.date || '').slice(0, 10)
    const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : today
    const row = {
      id: item?.id,
      name: String(item?.name || 'Transaction').trim().slice(0, 120) || 'Transaction',
      amount: Number.isFinite(amount) && amount > 0 ? amount : 0.01,
      type: item?.type === 'income' ? 'income' : 'expense',
      category: String(item?.category || 'Other').trim().slice(0, 60) || 'Other',
      date,
      note: String(item?.note || '').slice(0, 500),
      paymentMethod,
      status,
      billable: Boolean(item?.billable),
      reimbursable: Boolean(item?.reimbursable),
      onCredit,
      creditSettlementFor: item?.creditSettlementFor || undefined,
      taxRate: Number(item?.taxRate) || 0,
      taxAmount: Number(item?.taxAmount) || 0,
      clientId: item?.clientId || undefined,
      shopId: item?.shopId || undefined,
      vendorId: item?.vendorId || undefined,
      employeeId: item?.employeeId || undefined,
      departmentId: item?.departmentId || undefined,
      projectId: item?.projectId || undefined,
      createdAt: item?.createdAt || new Date(Date.now() - index).toISOString(),
    }
    if (onCredit) row.creditStatus = item?.creditStatus === 'paid' ? 'paid' : 'open'
    return row
  })

  const seenBudgets = new Set()
  const budgets = []
  for (const item of payload.budgets || []) {
    const category = String(item?.category || '').trim()
    if (!category) continue
    const month = item?.month == null || item?.month === '' ? null : Number(item.month)
    const year = item?.year == null || item?.year === '' ? null : Number(item.year)
    const key = `${category.toLowerCase()}|${year}|${month}`
    if (seenBudgets.has(key)) continue
    seenBudgets.add(key)
    const amount = Number(item?.amount)
    budgets.push({
      category,
      amount: Number.isFinite(amount) && amount > 0 ? amount : 0.01,
      month: Number.isInteger(month) && month >= 0 && month <= 11 ? month : null,
      year: Number.isInteger(year) && year >= 2000 ? year : null,
    })
  }

  const goals = (payload.goals || [])
    .map((item) => {
      const targetAmount = Number(item?.targetAmount)
      const currentAmount = Number(item?.currentAmount)
      return {
        name: String(item?.name || 'Goal').trim().slice(0, 100) || 'Goal',
        targetAmount: Number.isFinite(targetAmount) && targetAmount > 0 ? targetAmount : 0.01,
        currentAmount: Number.isFinite(currentAmount) && currentAmount >= 0 ? currentAmount : 0,
        deadline: item?.deadline || null,
        note: String(item?.note || '').slice(0, 500),
      }
    })
    .filter((item) => item.name)

  const recurring = (payload.recurring || []).map((item) => {
    const amount = Number(item?.amount)
    const rawNext = String(item?.nextDate || '').slice(0, 10)
    return {
      name: String(item?.name || 'Recurring').trim().slice(0, 120) || 'Recurring',
      amount: Number.isFinite(amount) && amount > 0 ? amount : 0.01,
      type: item?.type === 'income' ? 'income' : 'expense',
      category: String(item?.category || 'Other').trim().slice(0, 60) || 'Other',
      frequency: ['weekly', 'monthly', 'yearly'].includes(item?.frequency) ? item.frequency : 'monthly',
      nextDate: /^\d{4}-\d{2}-\d{2}$/.test(rawNext) ? rawNext : today,
      paymentMethod: PAYMENT_METHODS.includes(item?.paymentMethod) ? item.paymentMethod : 'Bank',
      note: String(item?.note || '').slice(0, 500),
      isActive: item?.isActive !== false,
    }
  })

  return {
    profile: {
      name: payload.profile?.name,
      workspace: payload.profile?.workspace,
      currency: payload.profile?.currency,
      language: payload.profile?.language,
      aiEnabled: Boolean(payload.profile?.aiEnabled),
      geminiApiKey: String(payload.profile?.geminiApiKey || '').trim().slice(0, 256),
    },
    categories,
    transactions,
    budgets,
    goals,
    recurring,
  }
}

export async function saveWorkspace(payload) {
  const result = await request('/workspace', {
    method: 'PUT',
    body: sanitizeWorkspacePayload(payload),
  })
  return result.data
}

export { API_BASE_URL }
