import { useEffect } from 'react'
import { useExpenses } from '../context/ExpenseContext'

export default function Modal({ title, onClose, children, wide = false }) {
  const { t } = useExpenses()
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-[18px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:max-h-[90vh] sm:rounded-[18px] sm:p-6 ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'}`}
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#dfe6df] sm:hidden" />
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 id="modal-title" className="min-w-0 text-[18px] font-semibold leading-tight text-[#213432] sm:text-[22px]">
            {title}
          </h3>
          <button type="button" onClick={onClose} className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-[24px] leading-none text-[#71807b] hover:bg-[#f3f6f1]" aria-label={t('common.close')}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
