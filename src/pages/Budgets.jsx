import { useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Field, { controlClass } from '../components/Field'
import Modal from '../components/Modal'
import { useExpenses } from '../context/ExpenseContext'
import { categoryLabel } from '../i18n'
import { monthLabel } from '../lib/dates'
import { categoryColor, clampPercent, formatMoney } from '../lib/format'

export default function Budgets() {
  const { profile, categories, budgetStatus, selectedYear, selectedMonth, upsertBudget, deleteBudget, personalMonthTransactions, t } = useExpenses()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ category: 'Groceries', amount: '' })
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState('')

  const expenseCategories = categories.filter((category) => category.type === 'expense')
  const budgeted = budgetStatus.reduce((sum, budget) => sum + budget.amount, 0)
  const spent = budgetStatus.reduce((sum, budget) => sum + budget.spent, 0)
  const unbudgeted = useMemo(() => {
    const covered = new Set(budgetStatus.map((budget) => budget.category))
    return personalMonthTransactions
      .filter((transaction) => transaction.type === 'expense' && !covered.has(transaction.category))
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  }, [budgetStatus, personalMonthTransactions])

  const openCreate = (category) => {
    const existing = budgetStatus.find((budget) => budget.category === category)
    setForm({ category: category || expenseCategories[0]?.name || 'Other', amount: existing ? String(existing.amount) : '' })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const amount = Number.parseFloat(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t('form.needBudget'))
      return
    }
    upsertBudget({ category: form.category, amount })
    setModalOpen(false)
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title m-0 font-semibold text-[#223535]">{t('budgets.title')}</h1>
          <p className="mt-2 text-[13px] text-[#88918b]">
            {t('budgets.subtitle', { month: monthLabel(selectedYear, selectedMonth, t) })}
          </p>
        </div>
        <button type="button" onClick={() => openCreate()} className="min-h-11 w-full rounded-[7px] bg-[#e96d52] px-[17px] py-[12px] text-[12px] font-bold text-white sm:w-auto">
          {t('budgets.set')}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('budgets.budgeted')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{formatMoney(budgeted, profile.currency)}</p>
        </article>
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('budgets.spent')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{formatMoney(spent, profile.currency)}</p>
        </article>
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
          <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('budgets.unbudgeted')}</p>
          <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{formatMoney(unbudgeted, profile.currency)}</p>
        </article>
      </div>

      <div className="mt-4 space-y-3">
        {budgetStatus.length === 0 ? (
          <EmptyState title={t('budgets.emptyTitle')} message={t('budgets.emptyBody')} actionLabel={t('budgets.set')} onAction={() => openCreate()} />
        ) : (
          budgetStatus.map((budget) => {
            const over = budget.remaining < 0
            return (
              <article key={budget.id} className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#263b39]">{categoryLabel(t, budget.category)}</h2>
                    <p className="mt-1 text-[12px] text-[#7d8782]">
                      {t('budgets.of', { spent: formatMoney(budget.spent, profile.currency), amount: formatMoney(budget.amount, profile.currency) })} ·{' '}
                      {over
                        ? t('budgets.over', { amount: formatMoney(Math.abs(budget.remaining), profile.currency) })
                        : t('budgets.remaining', { amount: formatMoney(budget.remaining, profile.currency) })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openCreate(budget.category)} className="text-[11px] text-[#4d7772]">
                      {t('common.edit')}
                    </button>
                    <button type="button" onClick={() => setPendingDelete(budget)} className="text-[11px] text-[#b45b4a]">
                      {t('common.remove')}
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf0eb]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(clampPercent(budget.percent), 100)}%`,
                      backgroundColor: over ? '#e96d52' : categoryColor(budget.category),
                    }}
                  />
                </div>
              </article>
            )
          })
        )}
      </div>

      {modalOpen ? (
        <Modal title={t('budgets.modal')} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label={t('budgets.category')} explain={t('budgets.categoryHint')}>
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={controlClass}>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {categoryLabel(t, category.name)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('budgets.limit')} explain={t('budgets.limitHint')} placeholder={t('budgets.limitPh')}>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className={controlClass} />
            </Field>
            {error ? <p className="text-[12px] text-[#c45b45]">{error}</p> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 rounded-[8px] border border-[#dfe6df] px-[14px] py-[10px] text-[12px]">
                {t('common.cancel')}
              </button>
              <button type="submit" className="min-h-11 rounded-[8px] bg-[#e96d52] px-[16px] py-[10px] text-[12px] font-semibold text-white">
                {t('budgets.save')}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title={t('budgets.removeTitle')}
          message={t('budgets.removeBody', { category: categoryLabel(t, pendingDelete.category) })}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteBudget(pendingDelete.id)
            setPendingDelete(null)
          }}
        />
      ) : null}
    </div>
  )
}
