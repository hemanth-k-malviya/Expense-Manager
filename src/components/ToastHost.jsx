import { useExpenses } from '../context/ExpenseContext'

export default function ToastHost() {
  const { toasts, dismissToast } = useExpenses()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] flex w-[min(calc(100vw-1.5rem),320px)] flex-col gap-2 sm:right-4">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={`pointer-events-auto rounded-[10px] px-4 py-3 text-left text-[12px] font-medium text-white shadow-lg ${
            toast.tone === 'success' ? 'bg-[#2f6b4f]' : toast.tone === 'warn' ? 'bg-[#b5812c]' : toast.tone === 'danger' ? 'bg-[#c45b45]' : 'bg-[#1d3434]'
          }`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}
