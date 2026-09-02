import { cloneElement, isValidElement, useId } from 'react'
import Select from './Select'

export const controlClass =
  'w-full rounded-[8px] border border-[#dfe6df] bg-white px-[12px] py-[10px] text-[13px] text-[#213432] outline-none focus:border-[#1d3434]'

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="8" cy="4.75" r="0.95" fill="currentColor" />
      <path d="M8 7.15v4.35" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  )
}

function withControlProps(children, { id, placeholder }) {
  if (!isValidElement(children)) return children
  const tag = typeof children.type === 'string' ? children.type : ''
  if (tag === 'select') {
    return <Select {...children.props} id={children.props.id || id} />
  }
  const next = { id: children.props.id || id }
  if (placeholder && (tag === 'input' || tag === 'textarea') && children.props.placeholder == null) {
    next.placeholder = placeholder
  }
  return cloneElement(children, next)
}

export default function Field({ label, explain, placeholder, className = '', children }) {
  const id = useId()

  return (
    <div className={`block min-w-0 ${className}`}>
      <div className="flex items-center gap-1.5">
        {label ? (
          <label htmlFor={id} className="text-[12px] font-semibold text-[#223535]">
            {label}
          </label>
        ) : null}
        {explain ? (
          <button type="button" className="field-info" aria-label={explain}>
            <InfoIcon />
            <span className="field-tooltip" role="tooltip">
              {explain}
            </span>
          </button>
        ) : null}
      </div>
      <div className="mt-1.5">{withControlProps(children, { id, placeholder })}</div>
    </div>
  )
}
