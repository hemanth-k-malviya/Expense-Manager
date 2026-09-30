import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { APP_NAME } from '../../lib/constants'
import { usePublicMeta } from './usePublicMeta'

const SAMPLE_ROWS = [
  { name: 'Salary credit', amount: '+ ₹42,000', method: 'Bank', note: 'Monthly pay' },
  { name: 'House rent', amount: '₹12,000', method: 'UPI', note: 'Recurring' },
  { name: 'Groceries — kirana', amount: '₹1,860', method: 'Cash', note: 'Weekly stock' },
  { name: 'Petrol', amount: '₹1,200', method: 'Card', note: 'Commute' },
  { name: 'Client lunch', amount: '₹780', method: 'UPI', note: 'Billable later' },
  { name: 'Broadband', amount: '₹999', method: 'Bank', note: 'Subscription' },
]

const BUDGETS = [
  { name: 'Groceries', spent: 6200, limit: 8000 },
  { name: 'Transport', spent: 3100, limit: 4000 },
  { name: 'Food outside', spent: 4500, limit: 3500 },
]

export default function Demo() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: t('site.demo.title'),
    description: t('site.demo.lede'),
  })

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#e96d52]">{APP_NAME}</p>
      <h1 className="mt-3 font-['Space_Grotesk'] text-[34px] font-semibold leading-tight text-[#1d3434]">{t('site.demo.title')}</h1>
      <p className="mt-4 max-w-3xl text-[17px] leading-8 text-[#33403d]">{t('site.demo.lede')}</p>
      <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#5b6b67]">{t('site.demo.note')}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/register" className="inline-flex min-h-12 items-center rounded-[10px] bg-[#e96d52] px-6 text-[15px] font-semibold text-white">
          {t('site.landing.primary')}
        </Link>
        <Link to="/" className="inline-flex min-h-12 items-center rounded-[10px] border border-[#dfe6df] bg-white px-6 text-[15px] font-semibold text-[#1d3434]">
          {t('site.nav.home')}
        </Link>
      </div>

      <section className="mt-12 overflow-hidden rounded-[16px] border border-[#e4e8df] bg-white">
        <div className="border-b border-[#eef1ed] bg-[#1d3434] px-5 py-5 text-[#f6f7ef] sm:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#c9e75b]">{t('site.demo.sampleLabel')}</p>
          <h2 className="mt-1 font-['Space_Grotesk'] text-[24px] font-semibold">{t('site.demo.sampleMonth')}</h2>
          <p className="mt-2 text-[14px] text-[#adc0b9]">{t('site.demo.workspace')}</p>
        </div>

        <div className="grid sm:grid-cols-3">
          {[
            ['site.demo.income', '₹48,200'],
            ['site.demo.spending', '₹31,450'],
            ['site.demo.left', '₹16,750'],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-[#eef1ed] px-5 py-5 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8a948e]">{t(label)}</p>
              <p className="mt-2 font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{value}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-[#eef1ed] px-5 py-6 sm:px-6">
          <h3 className="font-['Space_Grotesk'] text-[18px] font-semibold text-[#1d3434]">{t('site.demo.budgetTitle')}</h3>
          <div className="mt-4 space-y-4">
            {BUDGETS.map((item) => {
              const pct = Math.min(100, Math.round((item.spent / item.limit) * 100))
              const over = item.spent > item.limit
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between gap-3 text-[14px]">
                    <span className="font-medium text-[#33403d]">{item.name}</span>
                    <span className={over ? 'font-semibold text-[#c45b45]' : 'text-[#5b6b67]'}>
                      ₹{item.spent.toLocaleString('en-IN')} / ₹{item.limit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0eb]">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-[#e96d52]' : 'bg-[#1d3434]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-[#eef1ed] px-5 py-6 sm:px-6">
          <h3 className="font-['Space_Grotesk'] text-[18px] font-semibold text-[#1d3434]">{t('site.demo.txTitle')}</h3>
          <ul className="mt-4 divide-y divide-[#eef1ed]">
            {SAMPLE_ROWS.map((row) => (
              <li key={row.name} className="flex items-start justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-[#263b39]">{row.name}</p>
                  <p className="mt-0.5 text-[13px] text-[#8a948e]">
                    {row.method} · {row.note}
                  </p>
                </div>
                <p className={`flex-shrink-0 font-semibold ${row.amount.startsWith('+') ? 'text-[#3d7a4a]' : 'text-[#1d3434]'}`}>
                  {row.amount}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-['Space_Grotesk'] text-[24px] font-semibold text-[#1d3434]">{t('site.demo.nextTitle')}</h2>
        <p className="mt-3 text-[15px] leading-7 text-[#5b6b67]">{t('site.demo.nextBody')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/register" className="inline-flex min-h-12 items-center rounded-[10px] bg-[#e96d52] px-6 text-[15px] font-semibold text-white">
            {t('site.landing.primary')}
          </Link>
          <Link to="/guides/track-daily-expenses" className="inline-flex min-h-12 items-center rounded-[10px] bg-[#c9e75b] px-6 text-[15px] font-semibold text-[#1d3434]">
            {t('site.cta.readGuides')}
          </Link>
        </div>
      </section>
    </article>
  )
}
