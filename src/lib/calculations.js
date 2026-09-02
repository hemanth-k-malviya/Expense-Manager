export function sumByType(transactions, type) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
}

export function categoryTotals(transactions, type = 'expense') {
  const totals = new Map()

  transactions.forEach((transaction) => {
    if (transaction.type !== type) return
    const current = totals.get(transaction.category) || 0
    totals.set(transaction.category, current + Number(transaction.amount))
  })

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

export function spentByCategory(transactions, category) {
  return transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.category === category)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
}

export function donutStops(slices) {
  const total = slices.reduce((sum, slice) => sum + slice.total, 0)
  if (!total) {
    return 'conic-gradient(#edf0eb 0deg 360deg)'
  }

  let angle = 0
  const parts = slices.map((slice) => {
    const start = angle
    const span = (slice.total / total) * 360
    angle += span
    return `${slice.color} ${start}deg ${angle}deg`
  })

  return `conic-gradient(${parts.join(', ')})`
}

export function lastNMonths(year, monthIndex, count) {
  const months = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(year, monthIndex - offset, 1)
    months.push({ year: date.getFullYear(), month: date.getMonth() })
  }
  return months
}

export function monthlySeries(transactions, year, monthIndex, count = 6) {
  return lastNMonths(year, monthIndex, count).map((period) => {
    const items = transactionsInMonth(transactions, period.year, period.month)

    return {
      ...period,
      income: sumByType(items, 'income'),
      spending: sumByType(items, 'expense'),
    }
  })
}

export function transactionsInMonth(transactions, year, monthIndex) {
  return transactions.filter((transaction) => {
    const date = new Date(`${transaction.date}T00:00:00`)
    return date.getFullYear() === year && date.getMonth() === monthIndex
  })
}

export function filterByShopIds(transactions, shopIds) {
  if (!shopIds || shopIds.length === 0) return transactions
  const allowed = new Set(shopIds)
  return transactions.filter((transaction) => allowed.has(transaction.shopId || ''))
}

export function moneyTotals(transactions) {
  const sales = sumByType(transactions, 'income')
  const costs = sumByType(transactions, 'expense')
  return { sales, costs, profit: sales - costs }
}

export function shopPeriodSeries(transactions, shops, year, monthIndex, count = 6) {
  const months = lastNMonths(year, monthIndex, count)

  return months.map((period) => {
    const items = transactionsInMonth(transactions, period.year, period.month)
    const byShop = Object.fromEntries(
      shops.map((shop) => [shop.id, moneyTotals(items.filter((item) => item.shopId === shop.id))]),
    )

    return {
      ...period,
      ...moneyTotals(items),
      byShop,
      unassigned: moneyTotals(items.filter((item) => !item.shopId)),
    }
  })
}

export function shopRangeTotals(series, shops) {
  return shops.map((shop) => {
    const sales = series.reduce((sum, period) => sum + (period.byShop[shop.id]?.sales || 0), 0)
    const costs = series.reduce((sum, period) => sum + (period.byShop[shop.id]?.costs || 0), 0)
    return { ...shop, sales, costs, profit: sales - costs }
  })
}

export function categorySeries(transactions, type, limit = 8) {
  return categoryTotals(transactions, type).slice(0, limit)
}

export function transactionsToCsv(transactions) {
  const header = [
    'Date',
    'Type',
    'Category',
    'Name',
    'Amount',
    'Tax rate',
    'Tax amount',
    'Status',
    'Billable',
    'Reimbursable',
    'Payment method',
    'Shop',
    'Note',
  ]
  const rows = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.category,
      transaction.name,
      transaction.amount,
      transaction.taxRate || 0,
      transaction.taxAmount || 0,
      transaction.status || 'recorded',
      transaction.billable ? 'yes' : 'no',
      transaction.reimbursable ? 'yes' : 'no',
      transaction.paymentMethod || '',
      transaction.shopId || '',
      transaction.note || '',
    ])

  return [header, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? '')
          return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
        })
        .join(','),
    )
    .join('\n')
}
