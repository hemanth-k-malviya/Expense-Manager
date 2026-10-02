import { APP_NAME } from './constants'

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone === true
  )
}

export function isIosInstallBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!ios) return false
  return !isStandaloneDisplay()
}

export function isDesktopInstallBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  const mobile = /android|iphone|ipad|ipod|mobile/.test(ua)
  return !mobile && !isStandaloneDisplay()
}

export function pwaAppName() {
  return APP_NAME
}
