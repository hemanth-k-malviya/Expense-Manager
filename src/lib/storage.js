import { DEFAULT_CATEGORIES, STORAGE_KEY } from './constants'
import { defaultCompany } from './business'
import { extractBackupState } from './backup'
import { getEmptyState } from './seed'
import { mergeSubscription } from './subscription'
import { detectLanguage } from '../i18n/languages'
import { BUSINESS_FEATURE_IDS } from './features'

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function mergeWithDefaults(loaded) {
  const empty = getEmptyState({ language: detectLanguage() })
  const profile = {
    ...empty.profile,
    ...(isObject(loaded.profile) ? loaded.profile : {}),
    language: (isObject(loaded.profile) && loaded.profile.language) || detectLanguage(),
  }
  profile.enabledBusinessFeatures = [...BUSINESS_FEATURE_IDS]

  return {
    profile,
    subscription: mergeSubscription(loaded.subscription),
    company: {
      ...defaultCompany(),
      ...(isObject(loaded.company) ? loaded.company : {}),
    },
    departments: Array.isArray(loaded.departments) ? loaded.departments : [],
    employees: Array.isArray(loaded.employees) ? loaded.employees : [],
    clients: Array.isArray(loaded.clients) ? loaded.clients : [],
    projects: Array.isArray(loaded.projects) ? loaded.projects : [],
    vendors: Array.isArray(loaded.vendors) ? loaded.vendors : [],
    shops: Array.isArray(loaded.shops) ? loaded.shops : [],
    invoices: Array.isArray(loaded.invoices) ? loaded.invoices : [],
    inventory: Array.isArray(loaded.inventory) ? loaded.inventory : [],
    bills: Array.isArray(loaded.bills) ? loaded.bills : [],
    categories: Array.isArray(loaded.categories) && loaded.categories.length > 0 ? loaded.categories : DEFAULT_CATEGORIES,
    transactions: Array.isArray(loaded.transactions) ? loaded.transactions : [],
    budgets: Array.isArray(loaded.budgets) ? loaded.budgets : [],
    goals: Array.isArray(loaded.goals) ? loaded.goals : [],
    recurring: Array.isArray(loaded.recurring) ? loaded.recurring : [],
  }
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function storageKeyFor(uid, email) {
  const normalized = normalizeEmail(email)
  if (normalized) return `${STORAGE_KEY}:email:${normalized}`
  if (uid) return `${STORAGE_KEY}:${uid}`
  return STORAGE_KEY
}

function uidKey(uid) {
  return uid ? `${STORAGE_KEY}:${uid}` : STORAGE_KEY
}

function emailKey(email) {
  const normalized = normalizeEmail(email)
  return normalized ? `${STORAGE_KEY}:email:${normalized}` : null
}

function indexKey() {
  return `${STORAGE_KEY}:index`
}

function readIndex() {
  try {
    const raw = localStorage.getItem(indexKey())
    const parsed = raw ? JSON.parse(raw) : null
    if (!isObject(parsed)) return { emails: {}, uids: {} }
    return {
      emails: isObject(parsed.emails) ? parsed.emails : {},
      uids: isObject(parsed.uids) ? parsed.uids : {},
    }
  } catch {
    return { emails: {}, uids: {} }
  }
}

function writeIndex(index) {
  localStorage.setItem(indexKey(), JSON.stringify(index))
}

function rememberIdentity(uid, email) {
  const normalized = normalizeEmail(email)
  if (!uid && !normalized) return
  const index = readIndex()
  if (normalized) {
    if (uid) index.emails[normalized] = uid
    if (uid) index.uids[uid] = normalized
  }
  writeIndex(index)
}

function writeStored(key, state) {
  localStorage.setItem(key, JSON.stringify(state))
}

function workspaceWeight(state) {
  if (!state) return 0
  return (
    (Array.isArray(state.transactions) ? state.transactions.length : 0) +
    (Array.isArray(state.clients) ? state.clients.length : 0) +
    (Array.isArray(state.bills) ? state.bills.length : 0) +
    (Array.isArray(state.budgets) ? state.budgets.length : 0)
  )
}

function recoverWorkspace() {
  const populated = orphanUidWorkspaces()
    .map((key) => ({ key, state: readStored(key) }))
    .filter((item) => workspaceWeight(item.state) > 0)
  return populated.length === 1 ? populated[0].state : null
}

function orphanUidWorkspaces() {
  const prefix = `${STORAGE_KEY}:`
  const skip = new Set([STORAGE_KEY, `${STORAGE_KEY}:owner`, indexKey()])
  const found = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || skip.has(key) || !key.startsWith(prefix)) continue
    if (key.startsWith(`${STORAGE_KEY}:email:`)) continue
    if (key.startsWith(`${STORAGE_KEY}:index`)) continue
    found.push(key)
  }
  return found
}

function readStored(key) {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const parsed = JSON.parse(raw)
  return isObject(parsed) ? mergeWithDefaults(parsed) : null
}

export function loadState(uid, email) {
  try {
    const byEmail = emailKey(email)
    if (byEmail) {
      const scoped = readStored(byEmail)
      if (scoped && workspaceWeight(scoped) > 0) {
        rememberIdentity(uid, email)
        return scoped
      }
    }

    if (uid) {
      const byUid = readStored(uidKey(uid))
      if (byUid && workspaceWeight(byUid) > 0) {
        if (byEmail) writeStored(byEmail, byUid)
        rememberIdentity(uid, email)
        return byUid
      }

      const previousUid = email ? readIndex().emails[normalizeEmail(email)] : null
      if (previousUid && previousUid !== uid) {
        const previous = readStored(uidKey(previousUid))
        if (previous && workspaceWeight(previous) > 0) {
          if (byEmail) writeStored(byEmail, previous)
          rememberIdentity(uid, email)
          return previous
        }
      }

      const ownerKey = `${STORAGE_KEY}:owner`
      const owner = localStorage.getItem(ownerKey)
      const legacy = !owner || owner === uid ? readStored(STORAGE_KEY) : null
      if (legacy && workspaceWeight(legacy) > 0) {
        localStorage.setItem(ownerKey, uid || owner || '')
        if (byEmail) writeStored(byEmail, legacy)
        else if (uid) writeStored(uidKey(uid), legacy)
        rememberIdentity(uid, email)
        return legacy
      }

      const recovered = recoverWorkspace()
      if (recovered) {
        if (byEmail) writeStored(byEmail, recovered)
        rememberIdentity(uid, email)
        return recovered
      }

      if (byUid) {
        rememberIdentity(uid, email)
        return byUid
      }
      return null
    }

    return readStored(STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveState(state, uid, email) {
  try {
    const key = storageKeyFor(uid, email)
    writeStored(key, state)
    if (uid && normalizeEmail(email)) writeStored(uidKey(uid), state)
    rememberIdentity(uid, email)
    return true
  } catch (error) {
    console.error('Failed to save expense data', error)
    return false
  }
}

export function clearState(uid, email) {
  const byEmail = emailKey(email)
  if (byEmail) localStorage.removeItem(byEmail)
  if (uid) localStorage.removeItem(uidKey(uid))
}

export function parseImportedState(raw) {
  return mergeWithDefaults(extractBackupState(raw))
}
