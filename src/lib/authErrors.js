const KNOWN = new Set([
  'email-already-in-use',
  'invalid-email',
  'weak-password',
  'invalid-credential',
  'user-not-found',
  'wrong-password',
  'too-many-requests',
  'network-request-failed',
  'popup-closed-by-user',
  'cancelled-popup-request',
  'unauthorized-domain',
  'operation-not-allowed',
  'missing-email',
  'expired-action-code',
  'invalid-action-code',
  'unauthorized-continue-uri',
  'invalid-continue-uri',
])

export function authErrorKey(error) {
  if (error?.status === 503) return 'auth.error.smtp-not-configured'
  if (error?.status === 502) return 'auth.error.smtp-send-failed'
  const code = String(error?.code || '').replace(/^auth\//, '')
  return KNOWN.has(code) ? `auth.error.${code}` : 'auth.error.generic'
}
