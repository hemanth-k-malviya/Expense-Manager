import { useState } from 'react'
import Field, { controlClass } from '../components/Field'
import LockedFeature from '../components/LockedFeature'
import { useExpenses } from '../context/ExpenseContext'
import { SHOP_TYPES } from '../lib/business'
import { formatMoney } from '../lib/format'
import { moneyTotals } from '../lib/calculations'

export default function Shops() {
  const { isFeatureEnabled, profile, shops, monthTransactions, addShop, deleteShop, t } = useExpenses()
  const [form, setForm] = useState({ name: '', city: '', type: 'retail' })

  if (!isFeatureEnabled('shops')) return <LockedFeature feature="shops" />

  return (
    <div>
      <div>
          <h1 className="page-title m-0 font-semibold text-[#223535]">{t('shops.title')}</h1>
          <p className="mt-2 text-[13px] text-[#88918b]">{t('shops.subtitle')}</p>
      </div>

      <section className="mt-5 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.name.trim()) return
            addShop(form)
            setForm({ name: '', city: '', type: form.type })
          }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label={t('shops.name')} explain={t('shops.nameHint')} placeholder={t('shops.namePh')}>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('shops.city')} explain={t('shops.cityHint')} placeholder={t('shops.cityPh')}>
            <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('shops.type')} explain={t('shops.typeHint')}>
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className={controlClass}>
              {SHOP_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(`shopType.${item.value}`)}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#1d3434] px-4 py-2 text-[12px] font-semibold text-white">
            {t('shops.add')}
          </button>
        </form>

        <div className="mt-4 divide-y divide-[#eff1ed]">
          {shops.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#7d8782]">{t('shops.empty')}</p>
          ) : (
            shops.map((item) => {
              const totals = moneyTotals(monthTransactions.filter((transaction) => transaction.shopId === item.id))
              return (
                <div key={item.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
                  <div className="min-w-0">
                    <b className="block truncate">{item.name}</b>
                    <span className="text-[12px] text-[#7d8782]">
                      {t(`shopType.${item.type}`)}
                      {item.city ? ` · ${item.city}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-[12px] text-[#7d8782]">{t('shops.sales', { amount: formatMoney(totals.sales, profile.currency) })}</span>
                    <strong className="whitespace-nowrap">{formatMoney(totals.profit, profile.currency)}</strong>
                    <button type="button" onClick={() => deleteShop(item.id)} className="text-[12px] text-[#b45b4a]">
                      {t('common.remove')}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
