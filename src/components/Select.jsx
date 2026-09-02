import { Children, isValidElement, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MENU_GAP = 6
const MENU_MAX = 280

function collectOptions(children) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return []
    return [
      {
        value: child.props.value == null ? '' : String(child.props.value),
        label: child.props.children,
        disabled: Boolean(child.props.disabled),
      },
    ]
  })
}

function Chevron() {
  return (
    <svg className="select-chevron" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M4.2 6.2 8 10l3.8-3.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Select({ id, name, value, onChange, className = '', disabled = false, children, 'aria-label': ariaLabel }) {
  const autoId = useId()
  const triggerId = id || autoId
  const listId = `${triggerId}-list`
  const triggerRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false)
  const [entered, setEntered] = useState(false)
  const [placement, setPlacement] = useState({ top: 0, bottom: 'auto', left: 0, width: 0, up: false })
  const [active, setActive] = useState(-1)

  const options = useMemo(() => collectOptions(children), [children])
  const current = String(value ?? '')
  const selectedIndex = options.findIndex((item) => item.value === current)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (open) {
      setShown(true)
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setEntered(true))
      })
      setActive(selectedIndex >= 0 ? selectedIndex : options.findIndex((item) => !item.disabled))
      return () => window.cancelAnimationFrame(frame)
    }
    setEntered(false)
    const timer = window.setTimeout(() => setShown(false), 180)
    return () => window.clearTimeout(timer)
  }, [open, options, selectedIndex])

  useLayoutEffect(() => {
    if (!shown) return undefined

    const update = () => {
      const node = triggerRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const up = window.innerHeight - rect.bottom < Math.min(MENU_MAX, options.length * 40 + 16) + MENU_GAP && rect.top > window.innerHeight - rect.bottom
      setPlacement({
        left: rect.left,
        width: rect.width,
        top: up ? 'auto' : rect.bottom + MENU_GAP,
        bottom: up ? window.innerHeight - rect.top + MENU_GAP : 'auto',
        up,
      })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [shown, options.length])

  useEffect(() => {
    if (!open) return undefined

    const onPointer = (event) => {
      if (triggerRef.current?.contains(event.target) || listRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector('[data-active="true"]')
    node?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const commit = (next) => {
    if (disabled) return
    onChange?.({ target: { value: next, name: name || '' } })
    setOpen(false)
    triggerRef.current?.focus()
  }

  const move = (direction) => {
    if (!options.length) return
    let index = active
    for (let step = 0; step < options.length; step += 1) {
      index = (index + direction + options.length) % options.length
      if (!options[index].disabled) {
        setActive(index)
        return
      }
    }
  }

  const onTriggerKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) setOpen(true)
      else move(event.key === 'ArrowDown' ? 1 : -1)
    }
    if (event.key === 'Enter' || event.key === ' ') {
      if (open) {
        event.preventDefault()
        if (active >= 0 && options[active] && !options[active].disabled) {
          commit(options[active].value)
        }
      }
    }
    if (event.key === 'Home' && open) {
      event.preventDefault()
      setActive(options.findIndex((item) => !item.disabled))
    }
    if (event.key === 'End' && open) {
      event.preventDefault()
      for (let index = options.length - 1; index >= 0; index -= 1) {
        if (!options[index].disabled) {
          setActive(index)
          return
        }
      }
    }
  }

  const menu = shown
    ? createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={`select-menu${entered ? ' is-open' : ''}${placement.up ? ' is-up' : ''}`}
          style={{
            top: placement.top,
            bottom: placement.bottom,
            left: placement.left,
            width: Math.max(placement.width, 140),
            maxHeight: MENU_MAX,
          }}
        >
          {options.map((item, index) => {
            const isSelected = item.value === current
            const isActive = index === active
            return (
              <li
                key={`${item.value}-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={item.disabled || undefined}
                data-active={isActive ? 'true' : undefined}
                className={`select-option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}`}
                onMouseEnter={() => {
                  if (!item.disabled) setActive(index)
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (!item.disabled) commit(item.value)
                }}
              >
                <span className="select-option-label">{item.label}</span>
                {isSelected ? <span className="select-check" aria-hidden="true" /> : null}
              </li>
            )
          })}
        </ul>,
        document.body,
      )
    : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        name={name}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={`select-trigger${open ? ' is-open' : ''} ${className}`.trim()}
        onClick={() => {
          if (!disabled) setOpen((currentOpen) => !currentOpen)
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="select-value">{selected?.label ?? ''}</span>
        <Chevron />
      </button>
      {menu}
    </>
  )
}
