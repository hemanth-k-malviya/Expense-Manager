import { categoryInitials, categoryTone, formatSignedMoney } from '../lib/format'
import { formatDisplayDate } from '../lib/dates'
import { useExpenses } from '../context/ExpenseContext'

const toneClass = {
  green: 'bg-[#dfeecf] text-[#446a4d]',
  ink: 'bg-[#eef1f4] text-[#4d5d75]',
  orange: 'bg-[#f8e7d0] text-[#a96a2d]',
  blue: 'bg-[#dfe9ff] text-[#3c59ae]',
  sky: 'bg-[#dfeef7] text-[#42789a]',
  rose: 'bg-[#f9e0dd] text-[#a1514f]',
}

export default function TransactionRow({ transaction, currency, onEdit, onDelete, compact = false }) {
  const { t, locale } = useExpenses()
  const tone = categoryTone(transaction.category, transaction.type)
  const signed = transaction.type === 'income' ? transaction.amount : -transaction.amount
  const categoryName = t(`cat.${transaction.category}`) === `cat.${transaction.category}` ? transaction.category : t(`cat.${transaction.category}`)
  const pay = transaction.paymentMethod ? t(`pay.${transaction.paymentMethod}`) : ''

  return (
    <div className="flex flex-wrap items-center gap-x-[11px] gap-y-2 border-b border-[#eff1ed] py-[12px]">
      <span className={`grid h-[31px] w-[31px] flex-shrink-0 place-items-center rounded-[8px] text-[11px] font-bold ${toneClass[tone] || toneClass.ink}`}>
        {categoryInitials(transaction.name)}
      </span>

      <div className="min-w-0 flex-1">
        <b className="block truncate text-[12px] font-semibold text-[#2e3d3b]">{transaction.name}</b>
        <small className="block truncate text-[11px] text-[#7d8782]">
          {categoryName} · {formatDisplayDate(transaction.date, new Date(), t, locale)}
          {pay ? ` · ${pay}` : ''}
        </small>
      </div>

      <strong className={`ml-auto whitespace-nowrap text-[12px] font-semibold sm:ml-0 ${signed >= 0 ? 'text-[#3d8e64]' : 'text-[#2f3d3b]'}`}>
        {formatSignedMoney(signed, currency)}
      </strong>

      {transaction.billable ? (
        <span className="rounded-full bg-[#eef4f2] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.5px] text-[#3d6a66]">{t('tx.badgeBillable')}</span>
      ) : null}
      {transaction.reimbursable ? (
        <span className="rounded-full bg-[#f8e7d0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.5px] text-[#a96a2d]">{t('tx.badgeReimburse')}</span>
      ) : null}

      {!compact && (onEdit || onDelete) ? (
        <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
          {onEdit ? (
            <button type="button" onClick={() => onEdit(transaction)} className="min-h-9 rounded px-3 py-1 text-[11px] text-[#4d7772] hover:bg-[#f3f6f1]">
              {t('common.edit')}
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" onClick={() => onDelete(transaction)} className="min-h-9 rounded px-3 py-1 text-[11px] text-[#b45b4a] hover:bg-[#fdf3f0]">
              {t('common.delete')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
