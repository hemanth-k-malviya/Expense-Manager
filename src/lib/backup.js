import { APP_NAME } from './constants'

export const BACKUP_KIND = 'expense-so-backup'
export const BACKUP_VERSION = 1

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function extractBackupState(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!isObject(parsed)) {
    throw new Error('Backup file is not valid JSON.')
  }
  if (parsed.kind && parsed.kind !== BACKUP_KIND) {
    throw new Error('Not an Expense So backup.')
  }
  if (!isObject(parsed.profile) && !Array.isArray(parsed.transactions)) {
    throw new Error('Not an Expense So backup.')
  }
  return parsed
}

export function buildBackupFile(state) {
  return JSON.stringify(
    {
      kind: BACKUP_KIND,
      version: BACKUP_VERSION,
      app: APP_NAME,
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      subscription: state.subscription,
      company: state.company,
      departments: state.departments,
      employees: state.employees,
      clients: state.clients,
      projects: state.projects,
      vendors: state.vendors,
      shops: state.shops,
      invoices: state.invoices,
      inventory: state.inventory,
      bills: state.bills,
      categories: state.categories,
      transactions: state.transactions,
      budgets: state.budgets,
      goals: state.goals,
      recurring: state.recurring,
    },
    null,
    2,
  )
}
