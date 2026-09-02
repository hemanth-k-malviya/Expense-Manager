import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import { categoryLabel } from '../i18n'
import Modal from '../components/Modal'
import TransactionForm from '../components/TransactionForm'
import TransactionRow from '../components/TransactionRow'
import { donutStops } from '../lib/calculations'
import { formatLongDate, greetingKey, monthLabel } from '../lib/dates'
import { openExpenseAssistant } from '../lib/assistant'
import { categoryColor, clampPercent, firstName, formatCompactMoney, formatMoney, percentChange } from '../lib/format'

function ChangeHint({ current, previous, invert = false, t }) {
  const change = percentChange(current, previous)
  if (change.value === null) {
    return (
      <div className="mt-[12px] text-[11px] font-bold text-[#69746e]">
        {change.label === 'New' ? t('overview.new') : change.label} <em className="ml-[4px] font-normal not-italic text-[#909991]">{t('overview.vsLast')}</em>
      </div>
    )
  }

  const up = change.value >= 0
  const good = invert ? !up : up

  return (
    <div className={`mt-[12px] text-[11px] font-bold ${good ? 'text-[#4a8d61]' : 'text-[#d46d54]'}`}>
      {up ? '↗' : '↘'} {change.label} <em className="ml-[4px] font-normal not-italic text-[#909991]">{t('overview.vsLast')}</em>
    </div>
  )
}

export default function Overview() {
  const {
    profile,
    categories,
    selectedYear,
    selectedMonth,
    personalMonthTransactions,
    incomeTotal,
    spendingTotal,
    totalBalance,
    previousIncome,
    previousSpending,
    previousBalance,
    expenseBreakdown,
    budgetStatus,
    addTransaction,
    stepMonth,
    goToToday,
    isBusiness,
    t,
    locale,
  } = useExpenses()

  const [showAll, setShowAll] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currency = profile.currency
  const recent = showAll ? personalMonthTransactions : personalMonthTransactions.slice(0, 5)
  const slices = expenseBreakdown.map((item) => ({ ...item, color: categoryColor(item.category) }))
  const visibleCategories = showBreakdown ? slices : slices.slice(0, 4)
  const maxCategory = Math.max(...slices.map((item) => item.total), 1)

  const insight = useMemo(() => {
    const dining = budgetStatus.find((budget) => budget.category === 'Food & dining')
    if (dining && dining.remaining > 0) {
      return t('overview.underDining', { amount: formatMoney(dining.remaining, currency) })
    }
    const over = budgetStatus.find((budget) => budget.remaining < 0)
    if (over) {
      return t('overview.overBudget', { category: categoryLabel(t, over.category), amount: formatMoney(Math.abs(over.remaining), currency) })
    }
    if (totalBalance >= 0) {
      return t('overview.kept', { amount: formatMoney(totalBalance, currency) })
    }
    return t('overview.aboveIncome', { amount: formatMoney(Math.abs(totalBalance), currency) })
  }, [budgetStatus, currency, t, totalBalance])

  return (
    <div>
      <div className="flex flex-col gap-[20px] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-[10px] text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{formatLongDate(new Date(), locale)}</p>
          <h1 className="page-title m-0 font-semibold text-[#223535]">
            {t(greetingKey())}, {firstName(profile.name)} <span className="text-[#e6bd4d]">✳</span>
          </h1>
          <p className="mt-[9px] text-[13px] leading-5 text-[#88918b]">{t(isBusiness ? 'overview.pulseBiz' : 'overview.pulse', { month: monthLabel(selectedYear, selectedMonth, t) })}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="hidden min-h-11 rounded-[7px] border-0 bg-[#e96d52] px-[17px] py-[12px] text-[12px] font-bold text-white shadow-[0_4px_10px_rgba(233,109,82,0.3)] md:inline-flex"
        >
          <span className="mr-[8px] text-[19px] align-[-2px]">+</span>
          {t('layout.addExpense')}
        </button>
      </div>

      {/* <form
        className="mt-5 flex flex-col gap-2 rounded-[9px] border border-[#e8ebe4] bg-white p-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault()
          const prompt = event.currentTarget.elements.prompt.value.trim()
          if (!prompt) {
            openExpenseAssistant()
            return
          }
          openExpenseAssistant(prompt)
          event.currentTarget.reset()
        }}
      >
        <input
          name="prompt"
          placeholder={t('ai.placeholder')}
          className="min-h-11 flex-1 rounded-[8px] border-0 bg-[#f9faf8] px-3 text-[13px] outline-none"
        />
        <button type="submit" className="min-h-11 rounded-[8px] bg-[#1d3434] px-4 text-[12px] font-semibold text-white">
          {t('ai.open')}
        </button>
      </form> */}

      <div className="mt-6 flex flex-wrap items-center gap-x-[12px] gap-y-3 text-[13px] text-[#34433e] sm:mt-[28px]">
        <button type="button" onClick={() => stepMonth(-1)} className="grid h-10 w-10 place-items-center rounded-full text-[22px] text-[#8c9690] hover:bg-white" aria-label="Previous month">
          ‹
        </button>
        <strong className="min-w-0">{monthLabel(selectedYear, selectedMonth, t)}</strong>
        <button type="button" onClick={() => stepMonth(1)} className="grid h-10 w-10 place-items-center rounded-full text-[22px] text-[#8c9690] hover:bg-white" aria-label="Next month">
          ›
        </button>
        <button type="button" onClick={goToToday} className="rounded-[5px] border border-[#dde3db] bg-white px-[10px] py-[6px] text-[11px] text-[#69746e]">
          {t('common.today')}
        </button>
        <span className="w-full text-[10px] text-[#9ca59f] sm:ml-auto sm:w-auto">
          <span className="mr-[4px] inline-block h-[6px] w-[6px] rounded-full bg-[#7eb07b]" />
          {t('overview.savedDevice')}
        </span>
      </div>

      <div className="mt-[15px] grid gap-[13px] sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <article className="relative overflow-hidden rounded-[9px] border border-[#dbe899] bg-[#dbe899] px-4 py-4 sm:min-h-[170px] sm:px-[23px] sm:py-[22px] sm:col-span-2 lg:col-span-1">
          <div className="mb-[10px] text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('overview.net')}</div>
          <div className="font-['Space_Grotesk'] text-[24px] font-semibold tracking-[-1px] text-[#193634] sm:text-[29px]">{formatMoney(totalBalance, currency)}</div>
          <ChangeHint current={totalBalance} previous={previousBalance} t={t} />
        </article>

        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-4 py-4 sm:min-h-[170px] sm:px-[23px] sm:py-[22px]">
          <div className="mb-[10px] text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('overview.income')}</div>
          <div className="mt-[8px] font-['Space_Grotesk'] text-[22px] font-semibold text-[#283735] sm:text-[25px]">{formatMoney(incomeTotal, currency)}</div>
          <ChangeHint current={incomeTotal} previous={previousIncome} t={t} />
        </article>

        <article className="rounded-[9px] border border-[#e8ebe4] bg-white px-4 py-4 sm:min-h-[170px] sm:px-[23px] sm:py-[22px]">
          <div className="mb-[10px] text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{t('overview.spending')}</div>
          <div className="mt-[8px] font-['Space_Grotesk'] text-[22px] font-semibold text-[#283735] sm:text-[25px]">{formatMoney(spendingTotal, currency)}</div>
          <ChangeHint current={spendingTotal} previous={previousSpending} invert t={t} />
        </article>
      </div>

      <div className="mt-[13px] grid gap-[13px] lg:grid-cols-2">
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white p-4 sm:p-[24px]">
          <div className="flex items-start justify-between gap-[12px]">
            <div className="min-w-0">
              <h2 className="m-0 text-[17px] font-semibold text-[#263b39]">{t('overview.spendingOverview')}</h2>
              <p className="mt-[6px] text-[11px] text-[#9aa19c]">{t('overview.byCategory')}</p>
            </div>
            <Link to="/reports" className="flex-shrink-0 whitespace-nowrap text-[11px] text-[#4d7772]">
              {t('overview.fullReport')}
            </Link>
          </div>

          <div className="mt-[20px] flex min-h-0 flex-col items-center gap-6 sm:min-h-[235px] sm:flex-row sm:gap-[37px]">
            <div className="grid h-[140px] w-[140px] flex-shrink-0 place-items-center rounded-full sm:h-[174px] sm:w-[174px]" style={{ background: donutStops(slices) }}>
              <div className="grid h-[96px] w-[96px] place-items-center rounded-full bg-white text-center sm:h-[119px] sm:w-[119px]">
                <div>
                  <strong className="block font-['Space_Grotesk'] text-[20px] font-semibold text-[#273a38]">{formatCompactMoney(spendingTotal, currency)}</strong>
                  <small className="mt-[5px] block text-[10px] text-[#9ca39e]">{t('overview.spentMonth')}</small>
                </div>
              </div>
            </div>

            <div className="w-full flex-1 space-y-[17px]">
              {visibleCategories.length === 0 ? (
                <p className="text-[12px] text-[#71817b]">{t('overview.noExpenses')}</p>
              ) : (
                visibleCategories.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between gap-3 text-[11px] text-[#66716b]">
                      <span className="flex min-w-0 items-center gap-[8px]">
                        <i className="h-[7px] w-[7px] flex-shrink-0 rounded-[2px]" style={{ backgroundColor: category.color }} />
                        <span className="truncate">{categoryLabel(t, category.category)}</span>
                      </span>
                      <b className="flex-shrink-0 text-[#33433f]">{formatCompactMoney(category.total, currency)}</b>
                    </div>
                    <div className="mt-[8px] h-[4px] rounded-[4px] bg-[#edf0eb]">
                      <span className="block h-full rounded-[inherit]" style={{ width: `${Math.max(clampPercent((category.total / maxCategory) * 100), 8)}%`, backgroundColor: category.color }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {slices.length > 4 ? (
            <button type="button" onClick={() => setShowBreakdown((current) => !current)} className="mt-[10px] border-0 bg-transparent p-0 text-[11px] text-[#4d7772]">
              {showBreakdown ? t('overview.hideBreakdown') : t('overview.viewBreakdown')} <span aria-hidden="true" className="ml-[5px] text-[17px] align-[-2px]">→</span>
            </button>
          ) : null}
        </article>

        <article className="rounded-[9px] border border-[#e8ebe4] bg-white p-4 sm:p-[24px]">
          <div className="flex items-start justify-between gap-[12px]">
            <div>
              <h2 className="m-0 text-[17px] font-semibold text-[#263b39]">{t('overview.recent')}</h2>
              <p className="mt-[6px] text-[11px] text-[#9aa19c]">{t('overview.activityIn', { month: monthLabel(selectedYear, selectedMonth, t) })}</p>
            </div>
            <Link to="/transactions" className="text-[11px] text-[#4d7772]">
              {t('overview.viewAll')}
            </Link>
          </div>

          <div className="mt-[17px]">
            {recent.length > 0 ? (
              recent.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} currency={currency} compact />)
            ) : (
              <p className="py-[18px] text-[12px] text-[#71817b]">{t('overview.noTx')}</p>
            )}
          </div>

          {personalMonthTransactions.length > 5 ? (
            <button type="button" onClick={() => setShowAll((current) => !current)} className="mt-[18px] flex items-center gap-[6px] border-0 bg-transparent p-0 text-[11px] text-[#4d7772]">
              {showAll ? t('overview.showLess') : t('overview.loadMore')} <span>{showAll ? '↑' : '↓'}</span>
            </button>
          ) : null}
        </article>
      </div>

      {isBusiness ? null : (
        <div className="mt-[13px] flex flex-col gap-[12px] rounded-[9px] border border-[#dbe899] bg-[#f7f9f2] px-[20px] py-[18px] text-[12px] text-[#2b3d3c] sm:flex-row sm:items-center">
          <span className="grid h-[28px] w-[28px] place-items-center rounded-full bg-[#1d3434] text-[#d7ef6b]">✦</span>
          <span>
            {t('overview.bizBanner')}
          </span>
          <Link to="/settings" className="text-[11px] font-semibold text-[#4d7772] sm:ml-auto">
            {t('overview.seeBusiness')}
          </Link>
        </div>
      )}

      <div className="mt-[13px] flex flex-col gap-[12px] rounded-[9px] border border-[#e8ebe4] bg-[#f7f9f2] px-[20px] py-[18px] text-[12px] text-[#2b3d3c] sm:flex-row sm:items-center">
        <span className="grid h-[28px] w-[28px] place-items-center rounded-full bg-[#ebefc8] text-[#6f7a31]">✦</span>
        <span>
          <b className="font-semibold">{t('overview.smallSteps')}</b> {insight}
        </span>
        <Link to="/budgets" className="text-[11px] font-semibold text-[#4d7772] sm:ml-auto">
          {t('overview.seeBudgets')}
        </Link>
      </div>

      {isModalOpen ? (
        <Modal title={t('tx.addTitle')} onClose={() => setIsModalOpen(false)}>
          <TransactionForm
            categories={categories}
            variant="personal"
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(payload) => {
              addTransaction(payload)
              setIsModalOpen(false)
            }}
          />
        </Modal>
      ) : null}
    </div>
  )
}
