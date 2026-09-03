import { payableReimbursementTotal } from './ledger'

export const INVOICE_STATUSES = ['draft', 'sent', 'paid']
export const BILL_STATUSES = ['unpaid', 'paid']

export function daysUntil(dateStr, today) {
  const due = new Date(`${dateStr}T00:00:00`)
  const now = new Date(`${today}T00:00:00`)
  return Math.round((due - now) / 86400000)
}

export function invoiceStatus(invoice, today) {
  if (invoice.status === 'paid' || invoice.status === 'draft') return invoice.status
  if (invoice.dueDate && daysUntil(invoice.dueDate, today) < 0) return 'overdue'
  return invoice.status || 'sent'
}

export function billStatus(bill, today) {
  if (bill.status === 'paid') return 'paid'
  if (bill.dueDate && daysUntil(bill.dueDate, today) < 0) return 'overdue'
  return 'unpaid'
}

export function nextInvoiceNumber(invoices) {
  const max = invoices.reduce((highest, item) => {
    const match = String(item.number || '').match(/(\d+)\s*$/)
    const value = match ? Number.parseInt(match[1], 10) : 0
    return value > highest ? value : highest
  }, 0)
  return `INV-${String(max + 1).padStart(4, '0')}`
}

export function itemBuyPrice(item) {
  const buy = Number(item.buyPrice ?? item.unitCost)
  return Number.isFinite(buy) && buy > 0 ? buy : 0
}

export function itemSellPrice(item) {
  const sell = Number(item.sellPrice)
  return Number.isFinite(sell) && sell > 0 ? sell : 0
}

export function inventoryValue(items) {
  return items.reduce((sum, item) => sum + (Number(item.qty) || 0) * itemBuyPrice(item), 0)
}

export function inventoryRetailValue(items) {
  return items.reduce((sum, item) => sum + (Number(item.qty) || 0) * itemSellPrice(item), 0)
}

export function isLowStock(item) {
  const qty = Number(item.qty) || 0
  const reorder = Number(item.reorderAt)
  return Number.isFinite(reorder) && qty <= reorder
}

export function openReceivables(invoices, today) {
  return invoices
    .filter((item) => invoiceStatus(item, today) !== 'paid' && invoiceStatus(item, today) !== 'draft')
    .reduce((sum, item) => sum + (Number(item.amount) || 0) + (Number(item.taxAmount) || 0), 0)
}

export function openPayables(bills, today, transactions = []) {
  const fromBills = bills.filter((item) => billStatus(item, today) !== 'paid').reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return fromBills + payableReimbursementTotal(transactions)
}

export function collectReminders({ invoices = [], bills = [], inventory = [], recurring = [], today, withinDays = 7 }) {
  const items = []

  invoices.forEach((invoice) => {
    const status = invoiceStatus(invoice, today)
    if (status === 'paid' || status === 'draft') return
    const days = daysUntil(invoice.dueDate, today)
    if (status === 'overdue' || days <= withinDays) {
      items.push({
        id: `invoice-${invoice.id}`,
        kind: 'invoice',
        tone: status === 'overdue' ? 'danger' : 'warn',
        party: invoice.party,
        amount: (Number(invoice.amount) || 0) + (Number(invoice.taxAmount) || 0),
        date: invoice.dueDate,
        days,
        ref: invoice.number,
      })
    }
  })

  bills.forEach((bill) => {
    const status = billStatus(bill, today)
    if (status === 'paid') return
    const days = daysUntil(bill.dueDate, today)
    if (status === 'overdue' || days <= withinDays) {
      items.push({
        id: `bill-${bill.id}`,
        kind: 'bill',
        tone: status === 'overdue' ? 'danger' : 'warn',
        party: bill.party,
        amount: Number(bill.amount) || 0,
        date: bill.dueDate,
        days,
        ref: bill.party,
      })
    }
  })

  inventory.forEach((item) => {
    if (!isLowStock(item)) return
    items.push({
      id: `stock-${item.id}`,
      kind: 'stock',
      tone: 'warn',
      party: item.name,
      amount: Number(item.qty) || 0,
      date: today,
      days: 0,
      ref: item.sku || item.name,
    })
  })

  recurring.forEach((item) => {
    const days = daysUntil(item.nextDate, today)
    if (days < 0 || days > withinDays) return
    items.push({
      id: `recurring-${item.id}`,
      kind: 'recurring',
      tone: days === 0 ? 'warn' : 'info',
      party: item.name,
      amount: Number(item.amount) || 0,
      date: item.nextDate,
      days,
      ref: item.name,
    })
  })

  return items.sort((a, b) => a.days - b.days || a.party.localeCompare(b.party))
}
