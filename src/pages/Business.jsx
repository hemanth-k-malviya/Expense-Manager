import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Field, { controlClass } from '../components/Field'
import Modal from '../components/Modal'
import TransactionForm from '../components/TransactionForm'
import { useExpenses } from '../context/ExpenseContext'
import { nameById } from '../lib/business'
import { formatMoney } from '../lib/format'
import { isPersonalEntry, payableReimbursementTotal } from '../lib/ledger'

export default function Business() {
  const {
    profile,
    company,
    departments,
    clients,
    monthTransactions,
    transactions,
    updateCompany,
    addTransaction,
    categories,
    addToast,
    t,
  } = useExpenses()
  const [form, setForm] = useState({
    legalName: company.legalName || '',
    taxId: company.taxId || '',
    address: company.address || '',
    defaultTaxRate: String(company.defaultTaxRate || 0),
  })
  const [addKind, setAddKind] = useState(null)

  const expenses = monthTransactions.filter((item) => item.type === 'expense')
  const businessExpenses = expenses.filter((item) => !isPersonalEntry(item))
  const billable = businessExpenses.filter((item) => item.billable).reduce((sum, item) => sum + item.amount, 0)
  const reimbursablePayable = payableReimbursementTotal(transactions)
  const reimbursablePending = transactions
    .filter((item) => item.reimbursable && item.status === 'submitted')
    .reduce((sum, item) => sum + item.amount, 0)
  const tax = businessExpenses.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0)
  const pending = businessExpenses.filter((item) => item.status === 'submitted').length

  const departmentTotals = useMemo(
    () =>
      departments.map((department) => ({
        ...department,
        total: businessExpenses.filter((item) => item.departmentId === department.id).reduce((sum, item) => sum + item.amount, 0),
      })),
    [departments, businessExpenses],
  )

  const save = (event) => {
    event.preventDefault()
    updateCompany({
      legalName: form.legalName.trim(),
      taxId: form.taxId.trim(),
      address: form.address.trim(),
      defaultTaxRate: Number.parseFloat(form.defaultTaxRate) || 0,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('business.kicker')}</p>
        <h1 className="page-title m-0 font-semibold text-[#223535]">{t('business.title')}</h1>
        <p className="mt-2 text-[13px] text-[#88918b]">{t('business.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('business.billable')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{formatMoney(billable, profile.currency)}</p>
          <p className="field-hint">{t('business.billableHint')}</p>
          <button
            type="button"
            onClick={() => {
              if (clients.length === 0) {
                addToast(t('business.needClientFirst'), 'warn')
                return
              }
              setAddKind('billable')
            }}
            className="mt-3 rounded-[7px] bg-[#1d3434] px-3 py-2 text-[11px] font-semibold text-white"
          >
            {t('business.addBillable')}
          </button>
        </article>
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('business.reimburse')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{formatMoney(reimbursablePayable, profile.currency)}</p>
          <p className="field-hint">{t('business.reimburseHint')}</p>
          {reimbursablePending > 0 ? (
            <p className="mt-1 text-[12px] text-[#7d8782]">{t('business.reimbursePending', { amount: formatMoney(reimbursablePending, profile.currency) })}</p>
          ) : null}
          <button type="button" onClick={() => setAddKind('reimburse')} className="mt-3 rounded-[7px] bg-[#e96d52] px-3 py-2 text-[11px] font-semibold text-white">
            {t('business.addReimburse')}
          </button>
        </article>
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('business.tax')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{formatMoney(tax, profile.currency)}</p>
        </article>
        <Link to="/approvals" className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4 no-underline">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('business.pending')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold text-[#223535]">{pending}</p>
          <p className="field-hint">{t('business.pendingHint')}</p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/books?tab=charts" className="rounded-[9px] border border-[#dbe899] bg-[#f7f9f2] px-5 py-4 no-underline">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('books.kicker')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[18px] font-semibold text-[#223535]">{t('business.booksTitle')}</p>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('business.booksBody')}</p>
        </Link>
        <Link to="/books?tab=invoices" className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4 no-underline">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('books.tab.invoices')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[18px] font-semibold text-[#223535]">{t('business.invoiceTitle')}</p>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('business.invoiceBody')}</p>
        </Link>
        <Link to="/books?tab=inventory" className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4 no-underline">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('books.tab.inventory')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[18px] font-semibold text-[#223535]">{t('business.stockTitle')}</p>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('business.stockBody')}</p>
        </Link>
        <Link to="/books?tab=ledger" className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4 no-underline">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('books.tab.ledger')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[18px] font-semibold text-[#223535]">{t('business.ledgerTitle')}</p>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('business.ledgerBody')}</p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/shops" className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4 no-underline">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('business.shops')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold text-[#223535]">{t('business.shopTitle')}</p>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('business.shopBody')}</p>
        </Link>
        <Link to="/analytics" className="rounded-[9px] border border-[#dbe899] bg-[#f7f9f2] px-5 py-4 no-underline">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('business.analytics')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold text-[#223535]">{t('business.analyticsTitle')}</p>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('business.analyticsBody')}</p>
        </Link>
      </div>

      <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('business.profile')}</h2>
        <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('business.legal')} explain={t('business.legalHint')} placeholder={t('business.legalPh')}>
            <input value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('business.taxId')} explain={t('business.taxIdHint')} placeholder={t('business.taxIdPh')}>
            <input value={form.taxId} onChange={(event) => setForm((current) => ({ ...current, taxId: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('business.address')} explain={t('business.addressHint')} placeholder={t('business.addressPh')} className="sm:col-span-2">
            <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('business.taxRate')} explain={t('business.taxRateHint')} placeholder={t('business.taxRatePh')}>
            <input type="number" min="0" step="0.01" value={form.defaultTaxRate} onChange={(event) => setForm((current) => ({ ...current, defaultTaxRate: event.target.value }))} className={controlClass} />
          </Field>
          <div className="flex items-end">
            <button type="submit" className="min-h-11 w-full rounded-[8px] bg-[#1d3434] px-4 py-2 text-[12px] font-semibold text-white sm:w-auto">
              {t('business.save')}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('business.deptSpend')}</h2>
        <div className="mt-4 divide-y divide-[#eff1ed]">
          {departmentTotals.length === 0 ? (
            <p className="py-3 text-[12px] text-[#7d8782]">{t('business.noDept')}</p>
          ) : (
            departmentTotals.map((department) => (
              <div key={department.id} className="flex items-center justify-between py-3 text-[13px]">
                <span>
                  {department.name} <em className="not-italic text-[#8a948e]">{department.code}</em>
                </span>
                <b>{formatMoney(department.total, profile.currency)}</b>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('business.clientBill')}</h2>
        <div className="mt-4 divide-y divide-[#eff1ed]">
          {clients.map((client) => {
            const total = expenses.filter((item) => item.clientId === client.id && item.billable).reduce((sum, item) => sum + item.amount, 0)
            return (
              <div key={client.id} className="flex items-center justify-between py-3 text-[13px]">
                <span>{nameById(clients, client.id)}</span>
                <b>{formatMoney(total, profile.currency)}</b>
              </div>
            )
          })}
        </div>
      </section>

      {addKind ? (
        <Modal
          title={addKind === 'billable' ? t('business.addBillable') : t('business.addReimburse')}
          onClose={() => setAddKind(null)}
          wide
        >
          <TransactionForm
            key={addKind}
            categories={categories}
            variant={addKind === 'billable' ? 'billable' : 'reimburse'}
            initialValue={{
              type: 'expense',
              billable: addKind === 'billable',
              reimbursable: addKind === 'reimburse',
              status: addKind === 'reimburse' ? 'submitted' : 'recorded',
            }}
            submitLabel={t('tx.saveEntry')}
            onCancel={() => setAddKind(null)}
            onSubmit={(payload) => {
              addTransaction(payload)
              setAddKind(null)
            }}
          />
        </Modal>
      ) : null}
    </div>
  )
}
