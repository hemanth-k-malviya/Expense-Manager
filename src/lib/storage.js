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
    ownerUid: typeof loaded.ownerUid === 'string' ? loaded.ownerUid : '',
    ownerEmail: normalizeEmail(loaded.ownerEmail),
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

function ownerKey() {
  return `${STORAGE_KEY}:owner`
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
  if (normalized && uid) {
    index.emails[normalized] = uid
    index.uids[uid] = normalized
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
    (Array.isArray(state.budgets) ? state.budgets.length : 0) +
    (Array.isArray(state.goals) ? state.goals.length : 0) +
    (Array.isArray(state.vendors) ? state.vendors.length : 0)
  )
}

function readStored(key) {
  if (!key) return null
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const parsed = JSON.parse(raw)
  return isObject(parsed) ? mergeWithDefaults(parsed) : null
}

function belongsToUser(state, uid, email) {
  if (!state) return false
  const normalized = normalizeEmail(email)
  const ownerEmail = normalizeEmail(state.ownerEmail)
  const ownerUid = String(state.ownerUid || '')
  if (!ownerEmail && !ownerUid) return true
  if (normalized && ownerEmail === normalized) return true
  if (uid && ownerUid === uid) return true
  return false
}

function pickWorkspace(candidates, uid, email) {
  const owned = candidates.filter((state) => belongsToUser(state, uid, email))
  if (!owned.length) return null
  return owned.reduce((best, next) => (workspaceWeight(next) > workspaceWeight(best) ? next : best))
}

function stampWorkspace(state, uid, email) {
  return {
    ...state,
    ownerUid: uid || state.ownerUid || '',
    ownerEmail: normalizeEmail(email) || normalizeEmail(state.ownerEmail),
  }
}

function persistIdentityKeys(state, uid, email) {
  const stamped = stampWorkspace(state, uid, email)
  const byEmail = emailKey(email)
  if (byEmail) writeStored(byEmail, stamped)
  if (uid) writeStored(uidKey(uid), stamped)
  rememberIdentity(uid, email)
  return stamped
}

export function loadState(uid, email) {
  try {
    const normalized = normalizeEmail(email)
    if (!uid && !normalized) return null

    const candidates = []
    const byEmail = emailKey(email)
    const fromEmail = readStored(byEmail)
    if (fromEmail) candidates.push(fromEmail)

    if (uid) {
      const fromUid = readStored(uidKey(uid))
      if (fromUid) candidates.push(fromUid)
    }

    if (normalized) {
      const previousUid = readIndex().emails[normalized]
      if (previousUid && previousUid !== uid) {
        const previous = readStored(uidKey(previousUid))
        if (previous) candidates.push(previous)
      }
    }

    const matched = pickWorkspace(candidates, uid, email)
    if (matched && workspaceWeight(matched) > 0) {
      persistIdentityKeys(matched, uid, email)
      return matched
    }

    const owner = localStorage.getItem(ownerKey())
    const legacy = readStored(STORAGE_KEY)
    if (legacy && workspaceWeight(legacy) > 0) {
      const index = readIndex()
      const ownerEmail = normalizeEmail(owner)
      const ownedByUid = Boolean(owner && owner === uid)
      const ownedByEmail = Boolean(ownerEmail && ownerEmail === normalized)
      const ownerMapsToEmail = Boolean(owner && normalized && index.uids[owner] === normalized)
      const unclaimed = !owner
      if (ownedByUid || ownedByEmail || ownerMapsToEmail || (unclaimed && uid && normalized && !fromEmail)) {
        localStorage.setItem(ownerKey(), uid || owner || normalized)
        persistIdentityKeys(legacy, uid, email)
        return stampWorkspace(legacy, uid, email)
      }
    }

    if (matched) {
      rememberIdentity(uid, email)
      return matched
    }
    return null
  } catch {
    return null
  }
}

export function saveState(state, uid, email) {
  try {
    persistIdentityKeys(stampWorkspace(state, uid, email), uid, email)
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
