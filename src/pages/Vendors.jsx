import { useState } from 'react'
import Field, { controlClass } from '../components/Field'
import { useExpenses } from '../context/ExpenseContext'
import { formatMoney } from '../lib/format'

export default function Vendors() {
  const { profile, vendors, monthTransactions, addVendor, deleteVendor, t } = useExpenses()
  const [form, setForm] = useState({ name: '', category: '' })

  return (
    <div>
      <div>
        <h1 className="page-title m-0 font-semibold text-[#223535]">{t('vendors.title')}</h1>
        <p className="mt-2 text-[13px] text-[#88918b]">{t('vendors.subtitle')}</p>
      </div>

      <section className="mt-5 rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.name.trim()) return
            addVendor(form)
            setForm({ name: '', category: '' })
          }}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Field label={t('vendors.name')} explain={t('vendors.nameHint')} placeholder={t('vendors.namePh')}>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('vendors.category')} explain={t('vendors.categoryHint')} placeholder={t('vendors.categoryPh')}>
            <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={controlClass} />
          </Field>
          <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#1d3434] px-4 py-2 text-[12px] font-semibold text-white">
            {t('vendors.add')}
          </button>
        </form>

        <div className="mt-4 divide-y divide-[#eff1ed]">
          {vendors.map((item) => {
            const spend = monthTransactions.filter((transaction) => transaction.vendorId === item.id).reduce((sum, transaction) => sum + transaction.amount, 0)
            return (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <b className="block truncate">{item.name}</b>
                  <span className="text-[12px] text-[#7d8782]">{item.category ? item.category : t('vendors.general')}</span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3 sm:gap-4">
                  <strong className="whitespace-nowrap">{formatMoney(spend, profile.currency)}</strong>
                  <button type="button" onClick={() => deleteVendor(item.id)} className="text-[12px] text-[#b45b4a]">
                    {t('common.remove')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
