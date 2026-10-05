import { useEffect } from 'react'

/**
 * Turns off browser autofill/suggestions on all inputs except inside
 * containers marked with data-allow-autocomplete (login form).
 */
export default function DisableInputSuggestions() {
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return undefined

    const apply = () => {
      root.querySelectorAll('input, textarea, select').forEach((el) => {
        if (el.closest('[data-allow-autocomplete]')) return
        // Some browsers ignore "off" on email/password; "new-password" suppresses better.
        const type = (el.getAttribute('type') || '').toLowerCase()
        const value =
          type === 'password' || type === 'email' || type === 'username' || type === 'tel'
            ? 'new-password'
            : 'off'
        if (el.getAttribute('autocomplete') !== value) {
          el.setAttribute('autocomplete', value)
        }
      })
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
