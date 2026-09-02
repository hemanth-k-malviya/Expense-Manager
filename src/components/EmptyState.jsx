export default function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className="rounded-[9px] border border-dashed border-[#dbe3d7] bg-[#fbfcf9] px-6 py-10 text-center">
      <p className="text-[15px] font-semibold text-[#263b39]">{title}</p>
      <p className="mt-2 text-[12px] text-[#7d8782]">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-[7px] bg-[#e96d52] px-4 py-2 text-[12px] font-semibold text-white"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
