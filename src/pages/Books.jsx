import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import Field, { controlClass } from '../components/Field'
import { useExpenses } from '../context/ExpenseContext'
import { billStatus, collectReminders, inventoryRetailValue, inventoryValue, invoiceStatus, isLowStock, itemBuyPrice, itemSellPrice, nextInvoiceNumber, openPayables, openReceivables } from '../lib/books'
import { categoryLabel } from '../i18n'
import { donutStops, monthlySeries, categoryTotals, sumByType } from '../lib/calculations'
import { monthLabel, todayISO } from '../lib/dates'
import { booksWorkbookCsv, openPrintReport } from '../lib/exportReports'
import { categoryColor, downloadFile, formatCompactMoney, formatMoney } from '../lib/format'
import { isPersonalEntry, isPayableReimbursement } from '../lib/ledger'

const TABS = ['charts', 'invoices', 'inventory', 'ledger', 'reminders']

function StatusPill({ value }) {
  const tone =
    value === 'paid'
      ? 'bg-[#eaf4ea] text-[#3d7a4c]'
      : value === 'overdue'
        ? 'bg-[#fdecea] text-[#b45b4a]'
        : value === 'draft'
          ? 'bg-[#f3f4f1] text-[#6d7873]'
          : 'bg-[#eef4f2] text-[#3d6a66]'
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.6px] ${tone}`}>{value}</span>
}

export default function Books() {
  const {
    profile,
    company,
    clients,
    vendors,
    shops,
    invoices,
    inventory,
    bills,
    transactions,
    monthTransactions,
    recurring,
    selectedYear,
    selectedMonth,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addBill,
    updateBill,
    deleteBill,
    addInventoryItem,
    adjustInventory,
    deleteInventoryItem,
    addTransaction,
    t,
    locale,
  } = useExpenses()

  const [params, setParams] = useSearchParams()
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'charts'
  const setTab = (next) => setParams({ tab: next }, { replace: true })
  const today = todayISO()
  const money = (value) => formatMoney(value, profile.currency)
  const compact = (value) => formatCompactMoney(value, profile.currency)

  const booksTransactions = useMemo(() => transactions.filter((item) => !isPersonalEntry(item)), [transactions])
  const booksMonth = useMemo(() => monthTransactions.filter((item) => !isPersonalEntry(item)), [monthTransactions])
  const booksIncome = sumByType(booksMonth, 'income')
  const booksSpending = sumByType(booksMonth, 'expense')
  const booksNet = booksIncome - booksSpending
  const series = useMemo(
    () => monthlySeries(booksTransactions, selectedYear, selectedMonth, 6),
    [booksTransactions, selectedYear, selectedMonth],
  )
  const labels = series.map((item) => new Date(selectedYear, item.month, 1).toLocaleDateString(locale, { month: 'short' }))
  const slices = categoryTotals(booksMonth, 'expense').map((item) => ({ ...item, color: categoryColor(item.category) }))
  const reminders = collectReminders({ invoices, bills, inventory, recurring, today, withinDays: 14 })
  const receivable = openReceivables(invoices, today)
  const payable = openPayables(bills, today, booksTransactions)
  const reimbursementPayables = useMemo(
    () => booksTransactions.filter(isPayableReimbursement),
    [booksTransactions],
  )
  const stockValue = inventoryValue(inventory)
  const expenseCategory = 'Other'

  const exportExcel = () => {
    downloadFile(
      `expense-so-books-${today}.csv`,
      booksWorkbookCsv({
        title: t('books.title'),
        monthLabel: monthLabel(selectedYear, selectedMonth, t),
        currency: profile.currency,
        income: booksIncome,
        spending: booksSpending,
        net: booksNet,
        invoices,
        bills,
        inventory,
        transactions: booksMonth,
        reimbursements: reimbursementPayables,
        today,
      }),
      'text/csv;charset=utf-8',
    )
  }

  const exportPdf = () => {
    const ok = openPrintReport({
      title: t('books.title'),
      bodyHtml: `<h1>${t('books.title')}</h1>
        <p class="muted">${company.legalName || profile.workspace} · ${monthLabel(selectedYear, selectedMonth, t)}</p>
        <div class="cards">
          <div class="card">${t('books.revenue')}<b>${money(booksIncome)}</b></div>
          <div class="card">${t('books.profit')}<b>${money(booksNet)}</b></div>
          <div class="card">${t('books.receivable')}<b>${money(receivable)}</b></div>
          <div class="card">${t('books.payable')}<b>${money(payable)}</b></div>
        </div>
        <h2>${t('books.invoices')}</h2>
        <table><tr><th>${t('books.number')}</th><th>${t('books.party')}</th><th>${t('books.due')}</th><th>${t('books.amount')}</th><th>${t('books.status')}</th></tr>
        ${invoices.map((item) => `<tr><td>${item.number}</td><td>${item.party}</td><td>${item.dueDate}</td><td>${money((Number(item.amount) || 0) + (Number(item.taxAmount) || 0))}</td><td>${invoiceStatus(item, today)}</td></tr>`).join('')}</table>
        <h2>${t('books.bills')}</h2>
        <table><tr><th>${t('books.party')}</th><th>${t('books.due')}</th><th>${t('books.amount')}</th><th>${t('books.status')}</th></tr>
        ${bills.map((item) => `<tr><td>${item.party}</td><td>${item.dueDate}</td><td>${money(item.amount)}</td><td>${billStatus(item, today)}</td></tr>`).join('')}</table>
        <h2>${t('books.reimbursePayables')}</h2>
        <table><tr><th>${t('books.party')}</th><th>${t('books.date')}</th><th>${t('books.amount')}</th><th>${t('books.status')}</th></tr>
        ${reimbursementPayables.map((item) => `<tr><td>${item.name}</td><td>${item.date}</td><td>${money(item.amount)}</td><td>${t('tx.badgePayable')}</td></tr>`).join('')}</table>`,
    })
    if (!ok) window.alert(t('books.popup'))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('books.kicker')}</p>
          <h1 className="page-title m-0 font-semibold text-[#223535]">{t('books.title')}</h1>
          <p className="mt-2 text-[13px] text-[#88918b]">{t('books.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportExcel} className="rounded-[7px] border border-[#dde3db] bg-white px-3 py-2 text-[12px] font-semibold">
            {t('books.excel')}
          </button>
          <button type="button" onClick={exportPdf} className="rounded-[7px] bg-[#1d3434] px-3 py-2 text-[12px] font-semibold text-white">
            {t('books.pdf')}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t('books.revenue'), money(booksIncome)],
          [t('books.profit'), money(booksNet)],
          [t('books.receivable'), money(receivable)],
          [t('books.stockValue'), money(stockValue)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
            <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{label}</p>
            <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{value}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-[9px] border border-[#e8ebe4] bg-white p-2">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-10 rounded-full px-3 py-2 text-[12px] ${tab === id ? 'bg-[#1d3434] text-white' : 'text-[#5b6b67]'}`}
          >
            {t(`books.tab.${id}`)}
          </button>
        ))}
      </div>

      {tab === 'charts' ? (
        <ChartsPanel
          labels={labels}
          series={series}
          slices={slices}
          money={compact}
          format={money}
          t={t}
        />
      ) : null}
      {tab === 'invoices' ? (
        <InvoicesPanel
          invoices={invoices}
          clients={clients}
          today={today}
          money={money}
          t={t}
          nextNumber={nextInvoiceNumber(invoices)}
          onAdd={addInvoice}
          onPaid={(item) => {
            updateInvoice(item.id, { status: 'paid' })
            addTransaction({
              name: `${item.number} · ${item.party}`,
              amount: (Number(item.amount) || 0) + (Number(item.taxAmount) || 0),
              type: 'income',
              category: 'Freelance',
              date: today,
              paymentMethod: 'Bank',
              note: item.number,
              clientId: item.clientId,
            })
          }}
          onDelete={deleteInvoice}
        />
      ) : null}
      {tab === 'inventory' ? (
        <InventoryPanel
          inventory={inventory}
          shops={shops}
          money={money}
          t={t}
          onAdd={addInventoryItem}
          onAdjust={adjustInventory}
          onDelete={deleteInventoryItem}
        />
      ) : null}
      {tab === 'ledger' ? (
        <LedgerPanel
          bills={bills}
          vendors={vendors}
          invoices={invoices}
          today={today}
          money={money}
          payable={payable}
          receivable={receivable}
          reimbursements={reimbursementPayables}
          t={t}
          onAdd={addBill}
          onPaid={(item) => {
            updateBill(item.id, { status: 'paid' })
            addTransaction({
              name: item.party,
              amount: Number(item.amount) || 0,
              type: 'expense',
              category: expenseCategory,
              date: today,
              paymentMethod: 'Bank',
              note: t('books.billPaid'),
              vendorId: item.vendorId,
            })
          }}
          onDelete={deleteBill}
        />
      ) : null}
      {tab === 'reminders' ? <RemindersPanel reminders={reminders} money={money} t={t} /> : null}
    </div>
  )
}

function ChartsPanel({ labels, series, slices, money, format, t }) {
  const revenue = [{ id: 'revenue', label: t('books.revenue'), color: '#4a8d61', values: series.map((item) => item.income) }]
  const profit = [
    { id: 'income', label: t('common.income'), color: '#4a8d61', values: series.map((item) => item.income) },
    { id: 'spend', label: t('common.spending'), color: '#e96d52', values: series.map((item) => item.spending) },
    { id: 'net', label: t('books.profit'), color: '#1d3434', values: series.map((item) => item.income - item.spending) },
  ]
  const compare = [
    { id: 'income', label: t('common.income'), color: '#4a8d61', values: series.map((item) => item.income) },
    { id: 'spend', label: t('common.spending'), color: '#e96d52', values: series.map((item) => item.spending) },
  ]

  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-2">
      <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.revenueChart')}</h2>
        <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.revenueHint')}</p>
        <div className="mt-4">
          <LineChart labels={labels} series={revenue} formatValue={money} />
        </div>
      </article>
      <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.profitChart')}</h2>
        <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.profitHint')}</p>
        <div className="mt-4">
          <BarChart labels={labels} series={profit} formatValue={money} />
        </div>
      </article>
      <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.donut')}</h2>
        <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.donutHint')}</p>
        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
          <div className="grid h-[160px] w-[160px] place-items-center rounded-full" style={{ background: donutStops(slices) }}>
            <div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-white text-center text-[11px] text-[#7d8782]">
              {t('reports.categories')}
            </div>
          </div>
          <div className="w-full flex-1 space-y-3">
            {slices.length === 0 ? (
              <p className="text-[12px] text-[#7d8782]">{t('reports.noExpenses')}</p>
            ) : (
              slices.map((slice) => (
                <div key={slice.category} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <i className="h-2 w-2 flex-shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
                    <span className="truncate">{categoryLabel(t, slice.category)}</span>
                  </span>
                  <b>{format(slice.total)}</b>
                </div>
              ))
            )}
          </div>
        </div>
      </article>
      <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.compare')}</h2>
        <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.compareHint')}</p>
        <div className="mt-4">
          <BarChart labels={labels} series={compare} formatValue={money} />
        </div>
      </article>
    </div>
  )
}

function InvoicesPanel({ invoices, clients, today, money, t, nextNumber, onAdd, onPaid, onDelete }) {
  const [form, setForm] = useState({
    party: '',
    clientId: '',
    amount: '',
    taxAmount: '',
    date: today,
    dueDate: today,
    notes: '',
  })

  return (
    <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
      <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.invoices')}</h2>
      <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.invoiceHint')}</p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault()
          onAdd({ ...form, number: nextNumber, amount: form.amount, taxAmount: form.taxAmount })
          setForm({ party: '', clientId: form.clientId, amount: '', taxAmount: '', date: today, dueDate: today, notes: '' })
        }}
      >
        <Field label={t('books.party')} explain={t('books.partyHint')} placeholder={t('books.partyPh')}>
          <input value={form.party} onChange={(event) => setForm((current) => ({ ...current, party: event.target.value }))} className={controlClass} />
        </Field>
        {clients.length > 0 ? (
          <Field label={t('form.client')} explain={t('books.clientPickHint')}>
            <select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value, party: clients.find((item) => item.id === event.target.value)?.name || current.party }))} className={controlClass}>
              <option value="">{t('books.optionalClient')}</option>
              {clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label={t('books.amount')} explain={t('books.amountHint')} placeholder={t('books.amountPh')}>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className={controlClass} />
        </Field>
        <Field label={t('books.tax')} explain={t('books.taxHint')} placeholder={t('books.taxPh')}>
          <input type="number" min="0" step="0.01" value={form.taxAmount} onChange={(event) => setForm((current) => ({ ...current, taxAmount: event.target.value }))} className={controlClass} />
        </Field>
        <Field label={t('books.date')} explain={t('books.dateHint')}>
          <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className={controlClass} />
        </Field>
        <Field label={t('books.due')} explain={t('books.dueHint')}>
          <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className={controlClass} />
        </Field>
        <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#1d3434] px-4 text-[12px] font-semibold text-white">
          {t('books.addInvoice')}
        </button>
      </form>
      <div className="mt-4 divide-y divide-[#eff1ed]">
        {invoices.length === 0 ? (
          <p className="py-3 text-[12px] text-[#7d8782]">{t('books.noInvoices')}</p>
        ) : (
          invoices.map((item) => {
            const status = invoiceStatus(item, today)
            const total = (Number(item.amount) || 0) + (Number(item.taxAmount) || 0)
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <b className="block truncate">{item.number} · {item.party}</b>
                  <span className="text-[12px] text-[#7d8782]">{t('books.dueOn', { date: item.dueDate })}</span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <StatusPill value={status} />
                  <strong>{money(total)}</strong>
                  {status !== 'paid' ? (
                    <button type="button" onClick={() => onPaid(item)} className="text-[12px] font-semibold text-[#4d7772]">
                      {t('books.markPaid')}
                    </button>
                  ) : null}
                  <button type="button" onClick={() => onDelete(item.id)} className="text-[12px] text-[#b45b4a]">
                    {t('common.remove')}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function InventoryPanel({ inventory, shops, money, t, onAdd, onAdjust, onDelete }) {
  const [form, setForm] = useState({ name: '', sku: '', qty: '', buyPrice: '', sellPrice: '', reorderAt: '', shopId: '' })
  const costValue = inventoryValue(inventory)
  const retailValue = inventoryRetailValue(inventory)

  return (
    <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
      <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.inventory')}</h2>
      <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.inventoryHint')}</p>
      <p className="mt-2 text-[12px] text-[#5b6b67]">
        {t('books.stockAtCost')}: <b>{money(costValue)}</b>
        <span className="mx-2 text-[#cfd4cc]">·</span>
        {t('books.stockAtSell')}: <b>{money(retailValue)}</b>
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault()
          onAdd(form)
          setForm({ name: '', sku: '', qty: '', buyPrice: '', sellPrice: '', reorderAt: '', shopId: form.shopId })
        }}
      >
        <Field label={t('books.item')} explain={t('books.itemHint')} placeholder={t('books.itemPh')}>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
        </Field>
        <Field label={t('books.sku')} explain={t('books.skuHint')} placeholder={t('books.skuPh')}>
          <input value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} className={controlClass} />
        </Field>
        <Field label={t('books.qty')} explain={t('books.qtyHint')} placeholder={t('books.qtyPh')}>
          <input type="number" min="0" value={form.qty} onChange={(event) => setForm((current) => ({ ...current, qty: event.target.value }))} className={controlClass} />
        </Field>
        <Field label={t('books.buyPrice')} explain={t('books.buyHint')} placeholder={t('books.buyPricePh')}>
          <input type="number" min="0" step="0.01" value={form.buyPrice} onChange={(event) => setForm((current) => ({ ...current, buyPrice: event.target.value }))} className={controlClass} />
        </Field>
        <Field label={t('books.sellPrice')} explain={t('books.sellHint')} placeholder={t('books.sellPricePh')}>
          <input type="number" min="0" step="0.01" value={form.sellPrice} onChange={(event) => setForm((current) => ({ ...current, sellPrice: event.target.value }))} className={controlClass} />
        </Field>
        <Field label={t('books.reorder')} explain={t('books.reorderHint')} placeholder={t('books.reorderPh')}>
          <input type="number" min="0" value={form.reorderAt} onChange={(event) => setForm((current) => ({ ...current, reorderAt: event.target.value }))} className={controlClass} />
        </Field>
        {shops.length > 0 ? (
          <Field label={t('form.shop')} explain={t('books.shopPickHint')}>
            <select value={form.shopId} onChange={(event) => setForm((current) => ({ ...current, shopId: event.target.value }))} className={controlClass}>
              <option value="">{t('books.anyPlace')}</option>
              {shops.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#1d3434] px-4 text-[12px] font-semibold text-white">
          {t('books.addStock')}
        </button>
      </form>
      <div className="mt-4 divide-y divide-[#eff1ed]">
        {inventory.length === 0 ? (
          <p className="py-3 text-[12px] text-[#7d8782]">{t('books.noStock')}</p>
        ) : (
          inventory.map((item) => {
            const buy = itemBuyPrice(item)
            const sell = itemSellPrice(item)
            const qty = Number(item.qty) || 0
            const margin = sell > 0 && buy > 0 ? sell - buy : 0
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <b className="block truncate">{item.name}</b>
                  <span className="text-[12px] text-[#7d8782]">
                    {item.sku || t('books.noSku')}
                    {buy > 0 ? ` · ${t('books.buyShort')} ${money(buy)}` : ''}
                    {sell > 0 ? ` · ${t('books.sellShort')} ${money(sell)}` : ''}
                    {margin !== 0 ? ` · ${t('books.margin', { amount: money(margin) })}` : ''}
                    {` · ${money(qty * buy)}`}
                    {isLowStock(item) ? ` · ${t('books.lowStock')}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onAdjust(item.id, -1)} className="grid h-8 w-8 place-items-center rounded-full border border-[#dde3db]">
                    −
                  </button>
                  <strong className="min-w-8 text-center">{item.qty}</strong>
                  <button type="button" onClick={() => onAdjust(item.id, 1)} className="grid h-8 w-8 place-items-center rounded-full border border-[#dde3db]">
                    +
                  </button>
                  <button type="button" onClick={() => onDelete(item.id)} className="ml-2 text-[12px] text-[#b45b4a]">
                    {t('common.remove')}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function LedgerPanel({ bills, vendors, invoices, today, money, payable, receivable, reimbursements = [], t, onAdd, onPaid, onDelete }) {
  const [form, setForm] = useState({ party: '', vendorId: '', amount: '', date: today, dueDate: today, notes: '' })
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('books.receivable')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{money(receivable)}</p>
        </article>
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('books.payable')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{money(payable)}</p>
        </article>
      </div>
      <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.bills')}</h2>
        <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.billHint')}</p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault()
            onAdd(form)
            setForm({ party: '', vendorId: form.vendorId, amount: '', date: today, dueDate: today, notes: '' })
          }}
        >
          <Field label={t('books.party')} explain={t('books.billPartyHint')} placeholder={t('books.billPartyPh')}>
            <input value={form.party} onChange={(event) => setForm((current) => ({ ...current, party: event.target.value }))} className={controlClass} />
          </Field>
          {vendors.length > 0 ? (
            <Field label={t('form.vendor')} explain={t('books.vendorPickHint')}>
              <select value={form.vendorId} onChange={(event) => setForm((current) => ({ ...current, vendorId: event.target.value, party: vendors.find((item) => item.id === event.target.value)?.name || current.party }))} className={controlClass}>
                <option value="">{t('books.optionalVendor')}</option>
                {vendors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label={t('books.amount')} explain={t('books.amountHint')} placeholder={t('books.amountPh')}>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('books.due')} explain={t('books.dueHint')}>
            <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className={controlClass} />
          </Field>
          <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#e96d52] px-4 text-[12px] font-semibold text-white">
            {t('books.addBill')}
          </button>
        </form>
        <div className="mt-4 divide-y divide-[#eff1ed]">
          {bills.length === 0 ? (
            <p className="py-3 text-[12px] text-[#7d8782]">{t('books.noBills')}</p>
          ) : (
            bills.map((item) => {
              const status = billStatus(item, today)
              return (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
                  <div className="min-w-0">
                    <b className="block truncate">{item.party}</b>
                    <span className="text-[12px] text-[#7d8782]">{t('books.dueOn', { date: item.dueDate })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill value={status} />
                    <strong>{money(item.amount)}</strong>
                    {status !== 'paid' ? (
                      <button type="button" onClick={() => onPaid(item)} className="text-[12px] font-semibold text-[#4d7772]">
                        {t('books.markPaid')}
                      </button>
                    ) : null}
                    <button type="button" onClick={() => onDelete(item.id)} className="text-[12px] text-[#b45b4a]">
                      {t('common.remove')}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
      {reimbursements.length > 0 ? (
        <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.reimbursePayables')}</h2>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.reimbursePayablesHint')}</p>
          <div className="mt-4 divide-y divide-[#eff1ed]">
            {reimbursements.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <b className="block truncate">{item.name}</b>
                  <span className="text-[12px] text-[#7d8782]">{item.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#f8e7d0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.6px] text-[#a96a2d]">{t('tx.badgePayable')}</span>
                  <strong>{money(item.amount)}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <p className="text-[12px] text-[#7d8782]">{t('books.ledgerHint', { count: invoices.filter((item) => invoiceStatus(item, today) !== 'paid' && invoiceStatus(item, today) !== 'draft').length })}</p>
    </div>
  )
}

function RemindersPanel({ reminders, money, t }) {
  return (
    <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
      <h2 className="text-[17px] font-semibold text-[#263b39]">{t('books.reminders')}</h2>
      <p className="mt-1 text-[12px] text-[#7d8782]">{t('books.reminderHint')}</p>
      <div className="mt-4 divide-y divide-[#eff1ed]">
        {reminders.length === 0 ? (
          <p className="py-3 text-[12px] text-[#7d8782]">{t('books.noReminders')}</p>
        ) : (
          reminders.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
              <div className="min-w-0">
                <b className="block truncate">{item.party}</b>
                <span className="text-[12px] text-[#7d8782]">{t(`books.kind.${item.kind}`)} · {item.date}</span>
              </div>
              <strong>{item.kind === 'stock' ? t('books.qtyLeft', { qty: item.amount }) : money(item.amount)}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
