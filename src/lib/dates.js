import { MONTH_NAMES } from './constants'

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayISO() {
  return toISODate(new Date())
}

export function isInMonth(dateStr, year, monthIndex) {
  const date = parseISODate(dateStr)
  return date.getFullYear() === year && date.getMonth() === monthIndex
}

export function shiftMonth(year, monthIndex, delta) {
  const date = new Date(year, monthIndex + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function addFrequency(dateStr, frequency) {
  const date = parseISODate(dateStr)

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7)
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  } else {
    date.setMonth(date.getMonth() + 1)
  }

  return toISODate(date)
}

export function formatLongDate(date = new Date(), locale = 'en-US') {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()
}

export function formatDisplayDate(dateStr, now = new Date(), t, locale = 'en-US') {
  const date = parseISODate(dateStr)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today - target) / 86400000)

  if (diffDays === 0) return t ? t('date.today') : 'Today'
  if (diffDays === 1) return t ? t('date.yesterday') : 'Yesterday'
  if (diffDays === -1) return t ? t('date.tomorrow') : 'Tomorrow'

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
}

export function greetingKey(hour = new Date().getHours()) {
  if (hour < 12) return 'greet.morning'
  if (hour < 17) return 'greet.afternoon'
  return 'greet.evening'
}

export function monthLabel(year, monthIndex, t) {
  if (t) return `${t(`month.${monthIndex}`)} ${year}`
  return `${MONTH_NAMES[monthIndex]} ${year}`
}

export function daysUntil(dateStr, now = new Date()) {
  const target = parseISODate(dateStr)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((target - today) / 86400000)
}
