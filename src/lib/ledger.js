export function isBillableEntry(transaction) {
  return Boolean(transaction?.billable)
}

export function isReimbursementEntry(transaction) {
  return Boolean(transaction?.reimbursable)
}

export function isPayableReimbursement(transaction) {
  return isReimbursementEntry(transaction) && transaction.status === 'approved'
}

export function payableReimbursementTotal(transactions) {
  return (transactions || [])
    .filter(isPayableReimbursement)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
}

export function isCompanyOpsEntry(transaction) {
  if (isBillableEntry(transaction) || isReimbursementEntry(transaction)) return false
  return Boolean(
    transaction?.shopId ||
      transaction?.vendorId ||
      transaction?.employeeId ||
      transaction?.departmentId ||
      transaction?.clientId ||
      transaction?.projectId,
  )
}

export function isPersonalEntry(transaction) {
  return !isBillableEntry(transaction) && !isReimbursementEntry(transaction) && !isCompanyOpsEntry(transaction)
}

export function formVariantFor(transaction) {
  if (isBillableEntry(transaction)) return 'billable'
  if (isReimbursementEntry(transaction)) return 'reimburse'
  if (isCompanyOpsEntry(transaction)) return 'company'
  return 'personal'
}

export function matchesLedger(transaction, ledger) {
  if (ledger === 'personal') return isPersonalEntry(transaction)
  if (ledger === 'billable') return isBillableEntry(transaction)
  if (ledger === 'reimburse') return isReimbursementEntry(transaction) && !isBillableEntry(transaction)
  if (ledger === 'company') return isCompanyOpsEntry(transaction)
  return true
}
