import { useMemo } from 'react'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import { useExpenses } from '../context/ExpenseContext'
import { donutStops, monthlySeries } from '../lib/calculations'
import { categoryLabel } from '../i18n'
import { monthLabel } from '../lib/dates'
import { categoryColor, clampPercent, formatCompactMoney, formatMoney } from '../lib/format'

export default function Reports() {
  const {
    profile,
    personalTransactions,
    selectedYear,
    selectedMonth,
    personalMonthTransactions,
    incomeTotal,
    spendingTotal,
    totalBalance,
    expenseBreakdown,
    exportCsv,
    stepMonth,
    goToToday,
    t,
    locale,
  } = useExpenses()

  const series = useMemo(
    () => monthlySeries(personalTransactions, selectedYear, selectedMonth, 6),
    [personalTransactions, selectedYear, selectedMonth],
  )
  const slices = expenseBreakdown.map((item) => ({ ...item, color: categoryColor(item.category) }))
  const labels = series.map((item) => new Date(selectedYear, item.month, 1).toLocaleDateString(locale, { month: 'short' }))
  const trendSeries = [
    { id: 'income', label: t('common.income'), color: '#4a8d61', values: series.map((item) => item.income) },
    { id: 'spending', label: t('common.spending'), color: '#e96d52', values: series.map((item) => item.spending) },
  ]
  const money = (value) => formatCompactMoney(value, profile.currency)
  const topExpenses = [...personalMonthTransactions]
    .filter((item) => item.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const savingsRate = incomeTotal > 0 ? clampPercent((totalBalance / incomeTotal) * 100) : 0

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title m-0 font-semibold text-[#223535]">{t('reports.title')}</h1>
          <p className="mt-2 text-[13px] text-[#88918b]">{t('reports.subtitle', { month: monthLabel(selectedYear, selectedMonth, t) })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => stepMonth(-1)} className="rounded-[7px] border border-[#dde3db] bg-white px-3 py-2 text-[12px]">
            {t('common.previous')}
          </button>
          <button type="button" onClick={goToToday} className="rounded-[7px] border border-[#dde3db] bg-white px-3 py-2 text-[12px]">
            {t('reports.thisMonth')}
          </button>
          <button type="button" onClick={() => stepMonth(1)} className="rounded-[7px] border border-[#dde3db] bg-white px-3 py-2 text-[12px]">
            {t('common.next')}
          </button>
          <button type="button" onClick={exportCsv} className="rounded-[7px] bg-[#1d3434] px-3 py-2 text-[12px] font-semibold text-white">
            {t('common.export')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t('reports.income'), incomeTotal],
          [t('reports.spending'), spendingTotal],
          [t('reports.net'), totalBalance],
          [t('reports.savings'), `${Math.round(savingsRate)}%`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
            <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{label}</p>
            <p className="mt-2 font-['Space_Grotesk'] text-[22px] font-semibold">{typeof value === 'number' ? formatMoney(value, profile.currency) : value}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-2">
        <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#263b39]">{t('reports.line')}</h2>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('reports.lineHint')}</p>
          <div className="mt-4">
            <LineChart labels={labels} series={trendSeries} formatValue={money} />
          </div>
        </article>
        <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#263b39]">{t('reports.bar')}</h2>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('reports.barHint')}</p>
          <div className="mt-4">
            <BarChart labels={labels} series={trendSeries} formatValue={money} />
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#263b39]">{t('reports.mix')}</h2>
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
                    <b className="flex-shrink-0">{formatMoney(slice.total, profile.currency)}</b>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>

        <article className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#263b39]">{t('reports.largest')}</h2>
          <div className="mt-4 space-y-3">
            {topExpenses.length === 0 ? (
              <p className="text-[12px] text-[#7d8782]">{t('reports.noneRank')}</p>
            ) : (
              topExpenses.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between border-b border-[#eff1ed] pb-3 text-[12px]">
                  <span className="text-[#7d8782]">{index + 1}.</span>
                  <div className="ml-3 min-w-0 flex-1">
                    <b className="block truncate text-[#263b39]">{item.name}</b>
                    <span className="text-[#7d8782]">{categoryLabel(t, item.category)}</span>
                  </div>
                  <strong>{formatMoney(item.amount, profile.currency)}</strong>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
