import { useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import TransactionForm from '../components/TransactionForm'
import TransactionRow from '../components/TransactionRow'
import Select from '../components/Select'
import { useExpenses } from '../context/ExpenseContext'
import { categoryLabel } from '../i18n'
import { formatMoney } from '../lib/format'
import { formVariantFor, matchesLedger } from '../lib/ledger'

const LEDGER_TABS = [
  { id: 'personal', labelKey: 'tx.ledgerPersonal' },
  { id: 'billable', labelKey: 'tx.ledgerBillable' },
  { id: 'reimburse', labelKey: 'tx.ledgerReimburse' },
  { id: 'company', labelKey: 'tx.ledgerCompany' },
  { id: 'all', labelKey: 'tx.ledgerAll' },
]

export default function Transactions() {
  const { profile, categories, transactions, addTransaction, updateTransaction, deleteTransaction, isBusiness, clients, addToast, t } =
    useExpenses()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState('newest')
  const [ledger, setLedger] = useState(isBusiness ? 'personal' : 'all')
  const [modal, setModal] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const createVariant = ledger === 'billable' || ledger === 'reimburse' || ledger === 'company' ? ledger : 'personal'
  const modalVariant = modal?.mode === 'edit' ? formVariantFor(modal.item) : createVariant

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const next = transactions.filter((transaction) => {
      if (isBusiness && !matchesLedger(transaction, ledger)) return false
      if (type !== 'all' && transaction.type !== type) return false
      if (category !== 'all' && transaction.category !== category) return false
      if (from && transaction.date < from) return false
      if (to && transaction.date > to) return false
      if (needle) {
        const haystack = `${transaction.name} ${transaction.category} ${transaction.note} ${transaction.paymentMethod}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

    next.sort((a, b) => {
      if (sort === 'oldest') return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
      if (sort === 'amount-desc') return b.amount - a.amount
      if (sort === 'amount-asc') return a.amount - b.amount
      return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    })

    return next
  }, [category, from, isBusiness, ledger, query, sort, to, transactions, type])

  const income = filtered.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const spending = filtered.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)

  const openCreate = () => {
    if (createVariant === 'billable' && clients.length === 0) {
      addToast(t('business.needClientFirst'), 'warn')
      return
    }
    setModal({ mode: 'create' })
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title m-0 font-semibold text-[#223535]">{t('tx.title')}</h1>
          <p className="mt-2 text-[13px] text-[#88918b]">{isBusiness ? t('tx.subtitleBiz') : t('tx.subtitle')}</p>
        </div>
        <button type="button" onClick={openCreate} className="hidden min-h-11 rounded-[7px] bg-[#e96d52] px-[17px] py-[12px] text-[12px] font-bold text-white md:inline-flex">
          {t('tx.add')}
        </button>
      </div>

      {isBusiness ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {LEDGER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLedger(tab.id)}
              className={`min-h-10 rounded-full px-3 py-2 text-[12px] ${ledger === tab.id ? 'bg-[#1d3434] text-white' : 'border border-[#dde3db] bg-white text-[#5b6b67]'}`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`${isBusiness ? 'mt-3' : 'mt-6'} grid gap-3 rounded-[9px] border border-[#e8ebe4] bg-white p-4 md:grid-cols-2 xl:grid-cols-6`}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('tx.search')}
          aria-label={t('common.search')}
          className="rounded-[8px] border border-[#dfe6df] bg-[#f9faf8] px-3 py-2 text-[13px] outline-none xl:col-span-2"
        />
        <Select value={type} onChange={(event) => setType(event.target.value)} className="rounded-[8px] border border-[#dfe6df] bg-white px-3 py-2 text-[13px] outline-none">
          <option value="all">{t('tx.allTypes')}</option>
          <option value="expense">{t('common.expenses')}</option>
          <option value="income">{t('common.income')}</option>
        </Select>
        <Select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-[8px] border border-[#dfe6df] bg-white px-3 py-2 text-[13px] outline-none">
          <option value="all">{t('tx.allCategories')}</option>
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {categoryLabel(t, item.name)}
            </option>
          ))}
        </Select>
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-[8px] border border-[#dfe6df] bg-[#f9faf8] px-3 py-2 text-[13px] outline-none" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-[8px] border border-[#dfe6df] bg-[#f9faf8] px-3 py-2 text-[13px] outline-none" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[#5b6b67]">
        <span>{t('tx.shown', { count: filtered.length })}</span>
        <span>{t('tx.in', { amount: formatMoney(income, profile.currency) })}</span>
        <span>{t('tx.out', { amount: formatMoney(spending, profile.currency) })}</span>
        <span>{t('tx.net', { amount: formatMoney(income - spending, profile.currency) })}</span>
        <Select value={sort} onChange={(event) => setSort(event.target.value)} className="w-full rounded-[8px] border border-[#dfe6df] bg-white px-3 py-2 text-[12px] outline-none sm:ml-auto sm:w-auto">
          <option value="newest">{t('tx.newest')}</option>
          <option value="oldest">{t('tx.oldest')}</option>
          <option value="amount-desc">{t('tx.amountDesc')}</option>
          <option value="amount-asc">{t('tx.amountAsc')}</option>
        </Select>
      </div>

      <div className="mt-4 rounded-[9px] border border-[#e8ebe4] bg-white px-3 py-2 sm:px-5">
        {filtered.length === 0 ? (
          <div className="py-6">
            <EmptyState
              title={t('tx.emptyTitle')}
              message={t('tx.emptyBody')}
              actionLabel={t('tx.add')}
              onAction={openCreate}
            />
          </div>
        ) : (
          filtered.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              currency={profile.currency}
              onEdit={(item) => setModal({ mode: 'edit', item })}
              onDelete={setPendingDelete}
            />
          ))
        )}
      </div>

      {modal ? (
        <Modal
          title={modal.mode === 'edit' ? t('tx.edit') : t('tx.addTitle')}
          onClose={() => setModal(null)}
          wide={modalVariant !== 'personal'}
        >
          <TransactionForm
            key={`${modal.mode}-${modal.item?.id || 'new'}-${modalVariant}`}
            categories={categories}
            variant={modalVariant}
            initialValue={modal.item}
            submitLabel={modal.mode === 'edit' ? t('tx.saveChanges') : t('tx.saveEntry')}
            onCancel={() => setModal(null)}
            onSubmit={(payload) => {
              if (modal.mode === 'edit') {
                updateTransaction(modal.item.id, payload)
              } else {
                addTransaction(payload)
              }
              setModal(null)
            }}
          />
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title={t('tx.deleteTitle')}
          message={t('tx.deleteBody', { name: pendingDelete.name })}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteTransaction(pendingDelete.id)
            setPendingDelete(null)
          }}
        />
      ) : null}
    </div>
  )
}
