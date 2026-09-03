import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import { useExpenses } from '../context/ExpenseContext'
import { categoryLabel } from '../i18n'
import { shopColor } from '../lib/business'
import { categorySeries, filterByShopIds, shopPeriodSeries, shopRangeTotals } from '../lib/calculations'
import { monthLabel } from '../lib/dates'
import { formatCompactMoney, formatMoney } from '../lib/format'

const METRIC_IDS = [
  { id: 'sales', color: '#4a8d61' },
  { id: 'costs', color: '#e96d52' },
  { id: 'profit', color: '#1d3434' },
]

export default function Analytics() {
  const { profile, shops, transactions, selectedYear, selectedMonth, t, locale } = useExpenses()
  const [range, setRange] = useState(6)
  const [mode, setMode] = useState('combined')
  const [metric, setMetric] = useState('sales')
  const [selectedShops, setSelectedShops] = useState(() => shops.map((shop) => shop.id))

  useEffect(() => {
    setSelectedShops((current) => {
      const ids = shops.map((shop) => shop.id)
      if (ids.length === 0) return []
      if (current.length === 0) return ids
      const kept = current.filter((id) => ids.includes(id))
      const added = ids.filter((id) => !current.includes(id))
      return [...kept, ...added]
    })
  }, [shops])

  const activeShopIds = shops.length === 0 ? [] : selectedShops.filter((id) => shops.some((shop) => shop.id === id))
  const visibleShops = shops.filter((shop) => activeShopIds.includes(shop.id))
  const scoped = shops.length === 0 ? transactions : filterByShopIds(transactions, activeShopIds.length ? activeShopIds : shops.map((shop) => shop.id))
  const series = useMemo(
    () => shopPeriodSeries(scoped, visibleShops, selectedYear, selectedMonth, range),
    [scoped, visibleShops, selectedYear, selectedMonth, range],
  )
  const labels = series.map((item) => new Date(selectedYear, item.month, 1).toLocaleDateString(locale, { month: 'short' }))
  const rangeTotals = shopRangeTotals(series, visibleShops)
  const combined = {
    sales: series.reduce((sum, item) => sum + item.sales, 0),
    costs: series.reduce((sum, item) => sum + item.costs, 0),
    profit: series.reduce((sum, item) => sum + item.profit, 0),
  }
  const bestShop = [...rangeTotals].sort((a, b) => b.profit - a.profit)[0]
  const categoryBars = categorySeries(scoped.filter((item) => item.type === 'expense'), 'expense', 8)
  const money = (value) => formatCompactMoney(value, profile.currency)

  const trendSeries =
    mode === 'shops' && visibleShops.length > 0
      ? visibleShops.map((shop, index) => ({
          id: shop.id,
          label: shop.name,
          color: shopColor(index),
          values: series.map((period) => period.byShop[shop.id]?.[metric] || 0),
        }))
      : METRIC_IDS.map((item) => ({
          ...item,
          label: t(`common.${item.id}`),
          values: series.map((period) => period[item.id] || 0),
        }))

  const shopCompareSeries = METRIC_IDS.map((item) => ({
    ...item,
    label: t(`common.${item.id}`),
    values: rangeTotals.map((shop) => shop[item.id] || 0),
  }))

  const categoryCompare = [
    {
      id: 'spend',
      label: t('common.spend'),
      color: '#e96d52',
      values: categoryBars.map((item) => item.total),
    },
  ]

  const toggleShop = (id) => {
    setSelectedShops((current) => {
      if (current.includes(id)) {
        return current.length === 1 ? current : current.filter((item) => item !== id)
      }
      return [...current, id]
    })
  }

  const metricName = t(`common.${metric}`)
  const trendTitle = mode === 'shops' ? t('analytics.trendShop', { metric: metricName }) : t('analytics.trendCombined')
  const barSeries = trendSeries
  const barLabels = labels
  const barTitle = trendTitle
  const barHint = t('analytics.sameRange')

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title m-0 font-semibold text-[#223535]">{t('analytics.title')}</h1>
          <p className="mt-2 text-[13px] text-[#88918b]">
            {t('analytics.subtitle', { month: monthLabel(selectedYear, selectedMonth, t) })}
          </p>
        </div>
        <Link to="/shops" className="text-[12px] font-semibold text-[#4d7772]">
          {t('analytics.manage')}
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-[9px] border border-[#e8ebe4] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {[6, 12].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setRange(count)}
              className={`min-h-10 rounded-full px-3 py-2 text-[12px] ${range === count ? 'bg-[#1d3434] text-white' : 'border border-[#dde3db] bg-white text-[#5b6b67]'}`}
            >
              {t('analytics.months', { count })}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMode('combined')}
            className={`min-h-10 rounded-full px-3 py-2 text-[12px] ${mode === 'combined' ? 'bg-[#1d3434] text-white' : 'border border-[#dde3db] bg-white text-[#5b6b67]'}`}
          >
            {t('analytics.salesVs')}
          </button>
          <button
            type="button"
            onClick={() => setMode('shops')}
            disabled={shops.length === 0}
            className={`min-h-10 rounded-full px-3 py-2 text-[12px] disabled:opacity-50 ${mode === 'shops' ? 'bg-[#1d3434] text-white' : 'border border-[#dde3db] bg-white text-[#5b6b67]'}`}
          >
            {t('analytics.compareShops')}
          </button>
        </div>

        {mode === 'shops' ? (
          <div className="flex flex-wrap gap-2">
            {METRIC_IDS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMetric(item.id)}
                className={`min-h-9 rounded-full px-3 py-1.5 text-[11px] ${metric === item.id ? 'bg-[#f3f6f1] font-semibold text-[#1d3434]' : 'text-[#5b6b67]'}`}
              >
                {t(`common.${item.id}`)}
              </button>
            ))}
          </div>
        ) : null}

        {shops.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {shops.map((shop, index) => {
              const on = activeShopIds.includes(shop.id)
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => toggleShop(shop.id)}
                  className={`min-h-9 rounded-full border px-3 py-1.5 text-[11px] ${on ? 'border-transparent text-white' : 'border-[#dde3db] bg-white text-[#5b6b67]'}`}
                  style={on ? { backgroundColor: shopColor(index) } : undefined}
                >
                  {shop.name}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-[12px] text-[#7d8782]">{t('analytics.noShops')}</p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t('analytics.sales'), combined.sales],
          [t('analytics.costs'), combined.costs],
          [t('analytics.profit'), combined.profit],
          [t('analytics.best'), bestShop ? bestShop.name : '—'],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-4">
            <p className="text-[10px] font-bold tracking-[1.2px] text-[#87918a]">{label}</p>
            <p className="mt-2 truncate font-['Space_Grotesk'] text-[22px] font-semibold">
              {typeof value === 'number' ? formatMoney(value, profile.currency) : value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-2">
        <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#263b39]">{t('analytics.line', { title: trendTitle })}</h2>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('analytics.range', { range, month: monthLabel(selectedYear, selectedMonth, t) })}</p>
          <div className="mt-4">
            <LineChart labels={labels} series={trendSeries} formatValue={money} />
          </div>
        </article>

        <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#263b39]">{t('analytics.bar', { title: barTitle })}</h2>
          <p className="mt-1 text-[12px] text-[#7d8782]">{barHint}</p>
          <div className="mt-4">
            <BarChart labels={barLabels} series={barSeries} formatValue={money} />
          </div>
        </article>
      </div>

      <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-2">
        <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#263b39]">{t('analytics.categories')}</h2>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('analytics.categoriesHint')}</p>
          {categoryBars.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#7d8782]">{t('analytics.noCosts')}</p>
          ) : (
            <div className="mt-4">
              <BarChart labels={categoryBars.map((item) => categoryLabel(t, item.category))} series={categoryCompare} formatValue={money} />
            </div>
          )}
        </article>

        {visibleShops.length > 0 ? (
          <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
            <h2 className="text-[17px] font-semibold text-[#263b39]">{t('analytics.shopTotals')}</h2>
            <p className="mt-1 text-[12px] text-[#7d8782]">{t('analytics.shopTotalsHint')}</p>
            <div className="mt-4">
              <BarChart labels={visibleShops.map((shop) => shop.name.split(' ')[0])} series={shopCompareSeries} formatValue={money} />
            </div>
            <div className="mt-4 divide-y divide-[#eff1ed]">
              {rangeTotals.map((shop) => (
                <div key={shop.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[13px]">
                  <b className="min-w-0 truncate">{shop.name}</b>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#7d8782]">
                    <span>{t('common.sales')} {formatMoney(shop.sales, profile.currency)}</span>
                    <span>{t('common.costs')} {formatMoney(shop.costs, profile.currency)}</span>
                    <strong className="text-[#263b39]">{t('common.profit')} {formatMoney(shop.profit, profile.currency)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : (
          <article className="min-w-0 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
            <h2 className="text-[17px] font-semibold text-[#263b39]">{t('analytics.shopTotals')}</h2>
            <p className="mt-1 text-[12px] text-[#7d8782]">{t('analytics.addShopsHint')}</p>
            <Link to="/shops" className="mt-4 inline-flex text-[12px] font-semibold text-[#4d7772]">
              {t('analytics.addShops')}
            </Link>
          </article>
        )}
      </div>
    </div>
  )
}
