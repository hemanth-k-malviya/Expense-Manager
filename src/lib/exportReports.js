import { formatMoney } from './format'
import { invoiceStatus, billStatus, inventoryValue, itemBuyPrice, itemSellPrice } from './books'

function csvCell(value) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function csvRows(rows) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`
}

export function booksWorkbookCsv({
  title,
  monthLabel,
  currency,
  income,
  spending,
  net,
  invoices,
  bills,
  inventory,
  transactions,
  today,
}) {
  const money = (value) => formatMoney(value, currency)
  const rows = [
    [title],
    [monthLabel],
    [],
    ['Summary'],
    ['Revenue / income', money(income)],
    ['Spending', money(spending)],
    ['Profit / loss', money(net)],
    ['Inventory value', money(inventoryValue(inventory))],
    [],
    ['Invoices'],
    ['Number', 'Party', 'Date', 'Due', 'Amount', 'Tax', 'Status'],
    ...invoices.map((item) => [
      item.number,
      item.party,
      item.date,
      item.dueDate,
      item.amount,
      item.taxAmount || 0,
      invoiceStatus(item, today),
    ]),
    [],
    ['Bills / payables'],
    ['Party', 'Date', 'Due', 'Amount', 'Status'],
    ...bills.map((item) => [item.party, item.date, item.dueDate, item.amount, billStatus(item, today)]),
    [],
    ['Inventory'],
    ['Name', 'SKU', 'Qty', 'Buy price', 'Sell price', 'Reorder at'],
    ...inventory.map((item) => [item.name, item.sku || '', item.qty, itemBuyPrice(item), itemSellPrice(item), item.reorderAt]),
    [],
    ['Transactions'],
    ['Date', 'Type', 'Category', 'Name', 'Amount'],
    ...transactions.map((item) => [item.date, item.type, item.category, item.name, item.amount]),
  ]
  return csvRows(rows)
}

export function openPrintReport({ title, bodyHtml }) {
  const frame = window.open('', '_blank', 'noopener,noreferrer,width=900,height=720')
  if (!frame) return false
  frame.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: DM Sans, Segoe UI, sans-serif; color: #223535; margin: 32px; }
      h1 { font-size: 22px; margin: 0 0 6px; }
      p, td, th { font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; }
      th, td { border-bottom: 1px solid #e4e8df; text-align: left; padding: 8px 6px; }
      th { color: #7d8782; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
      .muted { color: #7d8782; }
      .cards { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; }
      .card { border: 1px solid #e8ebe4; border-radius: 8px; padding: 12px 16px; min-width: 140px; }
      .card b { display: block; font-size: 16px; margin-top: 4px; }
    </style>
  </head>
  <body>
    ${bodyHtml}
    <script>window.onload = function () { window.print(); }<\/script>
  </body>
</html>`)
  frame.document.close()
  return true
}
