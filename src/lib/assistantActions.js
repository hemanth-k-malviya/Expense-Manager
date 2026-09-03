import { SHOP_TYPES } from './business'
import { PAYMENT_METHODS } from './constants'
import { todayISO } from './dates'

function matchNamed(list, value) {
  if (!list?.length || !value) return null
  const lower = String(value).toLowerCase().trim()
  return (
    list.find((item) => String(item.name || item.party || '').toLowerCase() === lower) ||
    list.find((item) => String(item.name || item.party || '').toLowerCase().includes(lower) || lower.includes(String(item.name || item.party || '').toLowerCase())) ||
    null
  )
}

function shopTypeFrom(value) {
  const type = String(value || '').toLowerCase()
  return SHOP_TYPES.some((item) => item.value === type) ? type : 'retail'
}

function roleFrom(value) {
  const role = String(value || '').toLowerCase()
  return ['admin', 'manager', 'employee'].includes(role) ? role : 'employee'
}

export function normalizeDoPayload(action, raw, snapshot) {
  const payload = raw && typeof raw === 'object' ? raw : {}
  const name = String(payload.name || payload.party || '').trim()
  const amount = Number(payload.amount || payload.targetAmount)
  const client = matchNamed(snapshot.clients, payload.client || payload.clientName || name)
  const vendor = matchNamed(snapshot.vendors, payload.vendor || payload.vendorName || name)
  const employee = matchNamed(snapshot.employees, payload.employee || payload.employeeName || name)
  const department = matchNamed(snapshot.departments, payload.department || payload.departmentName)
  const claimList = (snapshot.transactions || snapshot.monthTransactions || []).filter(
    (item) => item.reimbursable || (item.status && item.status !== 'recorded'),
  )
  const claim = matchNamed(claimList, payload.name || payload.claim) || claimList.find((item) => item.id === payload.id)

  switch (action) {
    case 'client':
    case 'vendor':
    case 'department':
      return name ? { name } : null
    case 'shop':
      return name ? { name, city: String(payload.city || '').trim(), type: shopTypeFrom(payload.type) } : null
    case 'employee':
      return name ? { name, role: roleFrom(payload.role), departmentId: department?.id || '' } : null
    case 'project':
      return name ? { name, clientId: client?.id || payload.clientId || '' } : null
    case 'bill':
      if (!Number.isFinite(amount) || amount <= 0) return null
      return { party: vendor?.name || name, amount, vendorId: vendor?.id || '' }
    case 'invoice':
      if (!Number.isFinite(amount) || amount <= 0) return null
      return { party: client?.name || name, amount, clientId: client?.id || '' }
    case 'budget': {
      const category =
        (snapshot.categories || []).find((item) => item.name === payload.category)?.name ||
        matchNamed(snapshot.categories, payload.category || name)?.name
      if (!category || !Number.isFinite(amount) || amount <= 0) return null
      return { category, amount }
    }
    case 'goal':
      if (!name || !Number.isFinite(amount) || amount <= 0) return null
      return { name, targetAmount: amount, deadline: /^\d{4}-\d{2}-\d{2}$/.test(payload.deadline) ? payload.deadline : todayISO() }
    case 'approve':
    case 'reject':
    case 'reimburse':
      return claim ? { id: claim.id, name: claim.name } : null
    default:
      return payload
  }
}

export function applyAssistantResult(result, api) {
  if (result.intent === 'add' && result.transaction) {
    const tx = { ...result.transaction }
    if (tx.billable && !tx.clientId && tx.clientName) {
      const existing = matchNamed(api.clients, tx.clientName)
      if (existing) tx.clientId = existing.id
      else {
        const created = api.addClient({ name: tx.clientName })
        if (created?.id) tx.clientId = created.id
      }
    }
    if (tx.reimbursable && !tx.employeeId && tx.employeeName) {
      const existing = matchNamed(api.employees, tx.employeeName)
      if (existing) tx.employeeId = existing.id
    }
    api.addTransaction(tx)
    return { ok: true, key: 'ai.did.tx', params: { name: tx.name, amount: tx.amount } }
  }

  if (result.intent !== 'do') return { ok: false, key: 'ai.help' }

  const action = result.action
  const payload = normalizeDoPayload(action, result.payload, api) || result.payload || {}

  switch (action) {
    case 'client':
      if (!payload.name) return { ok: false, key: 'ai.needName' }
      api.addClient(payload)
      return { ok: true, key: 'ai.did.client', params: { name: payload.name } }
    case 'vendor':
      if (!payload.name) return { ok: false, key: 'ai.needName' }
      api.addVendor(payload)
      return { ok: true, key: 'ai.did.vendor', params: { name: payload.name } }
    case 'shop':
      if (!payload.name) return { ok: false, key: 'ai.needName' }
      api.addShop(payload)
      return { ok: true, key: 'ai.did.shop', params: { name: payload.name } }
    case 'employee':
      if (!payload.name) return { ok: false, key: 'ai.needName' }
      api.addEmployee(payload)
      return { ok: true, key: 'ai.did.employee', params: { name: payload.name } }
    case 'department':
      if (!payload.name) return { ok: false, key: 'ai.needName' }
      api.addDepartment(payload)
      return { ok: true, key: 'ai.did.department', params: { name: payload.name } }
    case 'project':
      if (!payload.name) return { ok: false, key: 'ai.needName' }
      api.addProject(payload)
      return { ok: true, key: 'ai.did.project', params: { name: payload.name } }
    case 'bill':
      if (!payload.party || !payload.amount) return { ok: false, key: 'ai.needAmount' }
      api.addBill(payload)
      return { ok: true, key: 'ai.did.bill', params: { name: payload.party, amount: payload.amount } }
    case 'invoice':
      if (!payload.party || !payload.amount) return { ok: false, key: 'ai.needAmount' }
      api.addInvoice(payload)
      return { ok: true, key: 'ai.did.invoice', params: { name: payload.party, amount: payload.amount } }
    case 'budget':
      if (!payload.category || !payload.amount) return { ok: false, key: 'ai.needAmount' }
      api.upsertBudget(payload)
      return { ok: true, key: 'ai.did.budget', params: { name: payload.category, amount: payload.amount } }
    case 'goal':
      if (!payload.name || !payload.targetAmount) return { ok: false, key: 'ai.needAmount' }
      api.addGoal(payload)
      return { ok: true, key: 'ai.did.goal', params: { name: payload.name, amount: payload.targetAmount } }
    case 'approve':
    case 'reject':
    case 'reimburse': {
      if (!payload.id) return { ok: false, key: 'ai.needMatch' }
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reimbursed'
      api.setTransactionStatus(payload.id, status)
      return { ok: true, key: `ai.did.${action}`, params: { name: payload.name } }
    }
    default:
      return { ok: false, key: 'ai.help' }
  }
}

export function hydrateTransaction(raw, snapshot) {
  if (!raw || typeof raw !== 'object') return null
  const amount = Number(raw.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null
  const type = raw.type === 'income' ? 'income' : 'expense'
  const categories = snapshot.categories || []
  const match = categories.find((item) => item.name === raw.category && item.type === type)
  const fallback = categories.find((item) => item.type === type) || categories[0]
  const client = matchNamed(snapshot.clients, raw.client || raw.clientName)
  const employee = matchNamed(snapshot.employees, raw.employee || raw.employeeName)
  const vendor = matchNamed(snapshot.vendors, raw.vendor || raw.vendorName)
  const shop = (snapshot.shops || []).find((item) => item.id === raw.shopId || item.name === raw.shop)
  const reimbursable = Boolean(raw.reimbursable)
  const billable = Boolean(raw.billable)
  return {
    name: String(raw.name || fallback?.name || 'Entry').trim(),
    amount,
    type,
    category: match?.name || fallback?.name || 'Other',
    date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : todayISO(),
    paymentMethod: PAYMENT_METHODS.includes(raw.paymentMethod) ? raw.paymentMethod : 'Card',
    note: String(raw.note || '').trim(),
    shopId: shop?.id || '',
    clientId: client?.id || '',
    clientName: client?.name || String(raw.client || raw.clientName || '').trim(),
    employeeId: employee?.id || '',
    employeeName: employee?.name || String(raw.employee || '').trim(),
    vendorId: vendor?.id || '',
    billable,
    reimbursable,
    taxRate: Number(raw.taxRate) || 0,
    status: reimbursable ? raw.status || 'submitted' : raw.status || 'recorded',
  }
}
