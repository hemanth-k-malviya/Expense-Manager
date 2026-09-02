import { DEFAULT_CATEGORIES, STORAGE_KEY } from './constants'
import { defaultCompany } from './business'
import { extractBackupState } from './backup'
import { getEmptyState } from './seed'
import { mergeSubscription, isBusinessMember } from './subscription'
import { detectLanguage } from '../i18n/languages'
import { BUSINESS_FEATURE_IDS, normalizeFeatures } from './features'

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
  const storedFeatures = isObject(loaded.profile) ? loaded.profile.enabledBusinessFeatures : null
  profile.enabledBusinessFeatures = Array.isArray(storedFeatures)
    ? normalizeFeatures(storedFeatures)
    : isBusinessMember(loaded.subscription)
      ? [...BUSINESS_FEATURE_IDS]
      : []

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

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isObject(parsed)) return null
    return mergeWithDefaults(parsed)
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.error('Failed to save expense data', error)
    return false
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}

export function parseImportedState(raw) {
  return mergeWithDefaults(extractBackupState(raw))
}
