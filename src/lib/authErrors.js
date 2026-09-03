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
  const code = String(error?.code || '').replace(/^auth\//, '')
  return KNOWN.has(code) ? `auth.error.${code}` : 'auth.error.generic'
}
