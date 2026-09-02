import { CATEGORY_COLORS, CATEGORY_TONES } from './constants'

export function formatMoney(value, currency = 'USD') {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount)
}

export function formatCompactMoney(value, currency = 'USD') {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatSignedMoney(value, currency = 'USD') {
  const amount = Number(value) || 0
  const formatted = formatMoney(Math.abs(amount), currency)
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

export function percentChange(current, previous) {
  if (!previous) {
    return { value: null, label: current ? 'New' : '—' }
  }

  const change = ((current - previous) / previous) * 100
  return {
    value: change,
    label: `${Math.abs(change).toFixed(1)}%`,
  }
}

export function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'ME'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function firstName(name) {
  return String(name || 'there').trim().split(/\s+/)[0] || 'there'
}

export function categoryColor(name) {
  return CATEGORY_COLORS[name] || '#6d7d9d'
}

export function categoryTone(name, type) {
  if (type === 'income') return 'blue'
  return CATEGORY_TONES[name] || 'ink'
}

export function categoryInitials(name) {
  const parts = String(name || 'TX').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function clampPercent(value) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

