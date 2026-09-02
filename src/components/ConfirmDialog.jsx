import Modal from './Modal'
import { useExpenses } from '../context/ExpenseContext'

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }) {
  const { t } = useExpenses()
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-[13px] leading-6 text-[#5b6b67]">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-[8px] border border-[#dfe6df] bg-white px-[14px] py-[10px] text-[12px] font-medium text-[#485d5a]"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-11 rounded-[8px] bg-[#e96d52] px-[16px] py-[10px] text-[12px] font-semibold text-white"
        >
          {confirmLabel || t('confirm.delete')}
        </button>
      </div>
    </Modal>
  )
}
