function EditGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="block overflow-visible"
    >
      <path
        d="M11.5 4.5L15.5 8.5M4 16l1.1-4.2a1 1 0 0 1 .26-.45L13.1 3.6a1.2 1.2 0 0 1 1.7 0l1.6 1.6a1.2 1.2 0 0 1 0 1.7L8.65 14.65a1 1 0 0 1-.45.26L4 16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="block overflow-visible"
    >
      <path
        d="M4.5 6h11M8 6V4.8A1.3 1.3 0 0 1 9.3 3.5h1.4A1.3 1.3 0 0 1 12 4.8V6m2 0v9.2A1.3 1.3 0 0 1 12.7 16.5H7.3A1.3 1.3 0 0 1 6 15.2V6h8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const baseClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-[8px] transition disabled:opacity-50'

export function EditIconButton({ label, onClick, className = '', disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${baseClass} text-[#4d7772] hover:bg-[#f3f6f1] ${className}`.trim()}
    >
      <EditGlyph />
    </button>
  )
}

export function DeleteIconButton({ label, onClick, className = '', disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${baseClass} text-[#b45b4a] hover:bg-[#fdf3f0] ${className}`.trim()}
    >
      <TrashGlyph />
    </button>
  )
}
