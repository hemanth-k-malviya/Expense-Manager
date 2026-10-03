import { categoryInitials, categoryTone, formatSignedMoney } from '../lib/format'
import { formatDisplayDate } from '../lib/dates'
import { isOpenPersonalCredit, isPayableReimbursement } from '../lib/ledger'
import { useExpenses } from '../context/ExpenseContext'
import { DeleteIconButton, EditIconButton } from './ActionIcons'

const toneClass = {
  green: 'bg-[#dfeecf] text-[#446a4d]',
  ink: 'bg-[#eef1f4] text-[#4d5d75]',
  orange: 'bg-[#f8e7d0] text-[#a96a2d]',
  blue: 'bg-[#dfe9ff] text-[#3c59ae]',
  sky: 'bg-[#dfeef7] text-[#42789a]',
  rose: 'bg-[#f9e0dd] text-[#a1514f]',
}

export default function TransactionRow({ transaction, currency, onEdit, onDelete, compact = false }) {
  const { t, locale, markCreditPaid } = useExpenses()
  const tone = categoryTone(transaction.category, transaction.type)
  const signed = transaction.type === 'income' ? transaction.amount : -transaction.amount
  const categoryName = t(`cat.${transaction.category}`) === `cat.${transaction.category}` ? transaction.category : t(`cat.${transaction.category}`)
  const pay = transaction.paymentMethod ? t(`pay.${transaction.paymentMethod}`) : ''
  const creditOpen = isOpenPersonalCredit(transaction)
  const creditPaid = Boolean(transaction.onCredit && transaction.creditStatus === 'paid')
  const creditSettlement = Boolean(transaction.creditSettlementFor)

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
        <span className="rounded-full bg-[#f8e7d0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.5px] text-[#a96a2d]">
          {isPayableReimbursement(transaction) ? t('tx.badgePayable') : t('tx.badgeReimburse')}
        </span>
      ) : null}
      {creditOpen ? (
        <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.5px] text-[#b45b4a]">{t('tx.badgeCredit')}</span>
      ) : null}
      {creditPaid ? (
        <span className="rounded-full bg-[#eaf4ea] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.5px] text-[#3d7a4c]">{t('tx.badgeCreditPaid')}</span>
      ) : null}
      {creditSettlement ? (
        <span className="rounded-full bg-[#eef4f2] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.5px] text-[#3d6a66]">{t('tx.badgeCreditPay')}</span>
      ) : null}

      {!compact && creditOpen ? (
        <button
          type="button"
          onClick={() => markCreditPaid(transaction.id)}
          className="rounded-[7px] bg-[#1d3434] px-2.5 py-1.5 text-[10px] font-semibold text-white"
        >
          {t('tx.markCreditPaid')}
        </button>
      ) : null}

      {!compact && (onEdit || onDelete) ? (
        <div className="flex w-full items-center justify-end gap-0.5 sm:w-auto">
          {onEdit ? <EditIconButton label={t('common.edit')} onClick={() => onEdit(transaction)} /> : null}
          {onDelete ? <DeleteIconButton label={t('common.delete')} onClick={() => onDelete(transaction)} /> : null}
        </div>
      ) : null}
    </div>
  )
}
