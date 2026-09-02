export const SHOP_TYPES = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'retail', label: 'Retail' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other' },
]

export const SHOP_COLORS = ['#1d3434', '#e96d52', '#4aa3a0', '#8b80c9', '#e2b34d', '#4d6fe6', '#7dbb7d', '#5b91a7']

export function shopTypeLabel(type) {
  return SHOP_TYPES.find((item) => item.value === type)?.label || 'Shop'
}

export function shopColor(index) {
  return SHOP_COLORS[index % SHOP_COLORS.length]
}

export const EMPLOYEE_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
]

export const CLAIM_STATUSES = [
  { value: 'recorded', label: 'Recorded' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'reimbursed', label: 'Reimbursed' },
]

export function defaultCompany() {
  return {
    legalName: '',
    taxId: '',
    address: '',
    defaultTaxRate: 0,
  }
}

export function taxAmountFrom(amount, taxRate) {
  const value = Number(amount) || 0
  const rate = Number(taxRate) || 0
  if (value <= 0 || rate <= 0) return 0
  return Math.round(((value * rate) / 100) * 100) / 100
}

export function statusLabel(status) {
  return CLAIM_STATUSES.find((item) => item.value === status)?.label || 'Recorded'
}

export function nameById(items, id, fallback = 'Unassigned') {
  if (!id) return fallback
  return items.find((item) => item.id === id)?.name || fallback
}

export function businessFieldsFrom(payload, existing = {}) {
  const taxRate = payload.taxRate === undefined ? existing.taxRate || 0 : Number(payload.taxRate) || 0
  const amount = Number(payload.amount)

  return {
    employeeId: payload.employeeId ?? existing.employeeId ?? '',
    departmentId: payload.departmentId ?? existing.departmentId ?? '',
    clientId: payload.clientId ?? existing.clientId ?? '',
    projectId: payload.projectId ?? existing.projectId ?? '',
    vendorId: payload.vendorId ?? existing.vendorId ?? '',
    shopId: payload.shopId ?? existing.shopId ?? '',
    billable: Boolean(payload.billable),
    reimbursable: Boolean(payload.reimbursable),
    taxRate,
    taxAmount: taxAmountFrom(amount, taxRate),
    status:
      Boolean(payload.reimbursable) && (!payload.status || payload.status === 'recorded') && !existing.status
        ? 'submitted'
        : payload.status || existing.status || 'recorded',
  }
}
