import { Link } from 'react-router-dom'
import Modal from './Modal'
import { useExpenses } from '../context/ExpenseContext'

const toneClass = {
  danger: 'bg-[#fdecea] text-[#b45b4a]',
  warn: 'bg-[#f8e7d0] text-[#a96a2d]',
  info: 'bg-[#eef4f2] text-[#3d6a66]',
}

export default function ReminderPopup({ alerts, onClose }) {
  const { t } = useExpenses()

  return (
    <Modal title={t('reminder.title')} onClose={onClose}>
      <p className="mt-[-8px] text-[12px] text-[#7d8782]">{t('reminder.subtitle', { count: alerts.length })}</p>
      <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
        {alerts.map((alert) => (
          <li key={alert.id} className={`rounded-[8px] px-3 py-2 text-[12px] ${toneClass[alert.tone] || toneClass.info}`}>
            {alert.message}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          to="/books?tab=reminders"
          onClick={onClose}
          className="min-h-11 rounded-[8px] border border-[#dfe6df] bg-white px-[14px] py-[10px] text-center text-[12px] font-medium text-[#485d5a] no-underline"
        >
          {t('reminder.viewAll')}
        </Link>
        <button type="button" onClick={onClose} className="min-h-11 rounded-[8px] bg-[#1d3434] px-[16px] py-[10px] text-[12px] font-semibold text-white">
          {t('reminder.gotIt')}
        </button>
      </div>
    </Modal>
  )
}
