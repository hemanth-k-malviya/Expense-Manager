import { useMemo, useState } from 'react'
import LockedFeature from '../components/LockedFeature'
import Select from '../components/Select'
import { useExpenses } from '../context/ExpenseContext'
import { nameById } from '../lib/business'
import { formatDisplayDate } from '../lib/dates'
import { formatMoney } from '../lib/format'

export default function Approvals() {
  const { isFeatureEnabled, profile, transactions, employees, setTransactionStatus, t, locale } = useExpenses()
  const [filter, setFilter] = useState('submitted')

  const claims = useMemo(
    () => transactions.filter((item) => item.type === 'expense' && (item.reimbursable || (item.status && item.status !== 'recorded'))),
    [transactions],
  )
  const visible = claims.filter((item) => (filter === 'all' ? true : item.status === filter))

  if (!isFeatureEnabled('approvals')) return <LockedFeature feature="approvals" />

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title m-0 font-semibold text-[#223535]">{t('approvals.title')}</h1>
          <p className="mt-2 text-[13px] text-[#88918b]">{t('approvals.subtitle')}</p>
        </div>
        <Select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-11 w-full rounded-[8px] border border-[#dfe6df] bg-white px-3 py-2 text-[12px] sm:w-auto">
          <option value="submitted">{t('status.submitted')}</option>
          <option value="approved">{t('status.approved')}</option>
          <option value="rejected">{t('status.rejected')}</option>
          <option value="reimbursed">{t('status.reimbursed')}</option>
          <option value="all">{t('approvals.all')}</option>
        </Select>
      </div>

      <div className="mt-5 rounded-[9px] border border-[#e8ebe4] bg-white px-5 py-2">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-[#7d8782]">{t('approvals.empty')}</p>
        ) : (
          visible.map((item) => (
            <article key={item.id} className="flex flex-col gap-3 border-b border-[#eff1ed] py-4 last:border-0 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <b className="block text-[13px] text-[#263b39]">{item.name}</b>
                <p className="mt-1 text-[12px] text-[#7d8782]">
                  {nameById(employees, item.employeeId)} · {formatDisplayDate(item.date, new Date(), t, locale)} · {t(`status.${item.status}`)}
                  {item.billable ? ` · ${t('approvals.billable')}` : ''}
                  {item.reimbursable ? ` · ${t('approvals.reimbursable')}` : ''}
                </p>
              </div>
              <strong className="text-[13px]">{formatMoney(item.amount, profile.currency)}</strong>
              <div className="flex flex-wrap gap-2">
                {item.status === 'submitted' ? (
                  <>
                    <button type="button" onClick={() => setTransactionStatus(item.id, 'approved')} className="rounded-[7px] bg-[#1d3434] px-3 py-2 text-[11px] font-semibold text-white">
                      {t('approvals.approve')}
                    </button>
                    <button type="button" onClick={() => setTransactionStatus(item.id, 'rejected')} className="rounded-[7px] border border-[#dfe6df] px-3 py-2 text-[11px] text-[#b45b4a]">
                      {t('approvals.reject')}
                    </button>
                  </>
                ) : null}
                {item.status === 'approved' && item.reimbursable ? (
                  <button type="button" onClick={() => setTransactionStatus(item.id, 'reimbursed')} className="rounded-[7px] bg-[#e96d52] px-3 py-2 text-[11px] font-semibold text-white">
                    {t('approvals.reimburse')}
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
