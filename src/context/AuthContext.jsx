import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { authErrorKey } from '../lib/authErrors'
import {
  apiLogin,
  apiRegister,
  clearApiSession,
  getApiToken,
  getStoredApiUser,
  setApiSession,
  syncFirebaseWithApi,
} from '../lib/api'
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase'

const AuthContext = createContext(null)

function toSessionUser(apiUser, firebaseUser = null) {
  if (!apiUser && !firebaseUser) return null

  return {
    uid: firebaseUser?.uid || apiUser?.firebaseUid || apiUser?.id,
    apiId: apiUser?.id || null,
    email: firebaseUser?.email || apiUser?.email || '',
    displayName: firebaseUser?.displayName || apiUser?.name || '',
    photoURL: firebaseUser?.photoURL || null,
    firebaseUser: firebaseUser || null,
    apiUser: apiUser || null,
  }
}

export function AuthProvider({ children }) {
  const configured = isFirebaseConfigured()
  const [firebaseUser, setFirebaseUser] = useState(() => getFirebaseAuth()?.currentUser ?? null)
  const [apiUser, setApiUser] = useState(() => getStoredApiUser())
  const [apiToken, setApiToken] = useState(() => getApiToken())
  const [loading, setLoading] = useState(true)
  const [apiReady, setApiReady] = useState(Boolean(getApiToken() && getStoredApiUser()))

  const user = useMemo(() => toSessionUser(apiUser, firebaseUser), [apiUser, firebaseUser])

  const applyApiSession = useCallback((data) => {
    setApiSession(data.token, data.user)
    setApiToken(data.token)
    setApiUser(data.user)
    setApiReady(true)
  }, [])

  const clearSession = useCallback(() => {
    clearApiSession()
    setApiToken(null)
    setApiUser(null)
    setApiReady(false)
  }, [])

  const syncFirebaseSession = useCallback(
    async (nextFirebaseUser) => {
      if (!nextFirebaseUser) {
        clearSession()
        return null
      }

      const idToken = await nextFirebaseUser.getIdToken()

      try {
        const data = await syncFirebaseWithApi(idToken)
        applyApiSession(data)
        return data
      } catch (error) {
        // API protect() already accepts Firebase ID tokens — keep the user signed in.
        const fallbackUser = {
          id: nextFirebaseUser.uid,
          firebaseUid: nextFirebaseUser.uid,
          email: nextFirebaseUser.email || '',
          name: nextFirebaseUser.displayName || nextFirebaseUser.email?.split('@')[0] || '',
        }
        applyApiSession({ token: idToken, user: fallbackUser })
        if (import.meta.env.DEV) {
          console.warn('API /auth/firebase unavailable; using Firebase token for API calls', error?.message || error)
        }
        return { token: idToken, user: fallbackUser, fallback: true }
      }
    },
    [applyApiSession, clearSession],
  )

  useEffect(() => {
    const auth = getFirebaseAuth()

    if (!auth) {
      setFirebaseUser(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false

    const unsub = onAuthStateChanged(auth, async (next) => {
      if (cancelled) return
      setFirebaseUser(next)

      try {
        if (next) {
          await syncFirebaseSession(next)
        } else if (!getApiToken()) {
          clearSession()
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to sync Firebase user with API', error)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })

    auth.authStateReady().finally(() => {
      if (cancelled) return
      if (!auth.currentUser) setLoading(false)
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [configured, syncFirebaseSession, clearSession])

  const register = useCallback(
    async ({ name, email, password }) => {
      const auth = getFirebaseAuth()
      if (!auth) {
        // API-only register when Firebase is unavailable
        const data = await apiRegister({ name, email, password })
        applyApiSession(data)
        return toSessionUser(data.user)
      }

      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const displayName = name.trim()
      if (displayName) {
        await updateProfile(credential.user, { displayName })
      }

      // Also set password on API user so API login works for the same account
      try {
        const data = await apiRegister({ name: displayName || name, email, password })
        applyApiSession(data)
      } catch {
        await syncFirebaseSession(credential.user)
      }

      return credential.user
    },
    [applyApiSession, syncFirebaseSession],
  )

  const login = useCallback(
    async ({ email, password }) => {
      const auth = getFirebaseAuth()

      if (auth) {
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password)
          const synced = await syncFirebaseSession(credential.user)

          // Link API password login only when we still lack a real API JWT
          if (synced?.fallback) {
            try {
              const data = await apiLogin({ email, password })
              applyApiSession(data)
            } catch {
              // Firebase token fallback already applied
            }
          }

          return credential.user
        } catch (firebaseError) {
          // Fall through to API login if Firebase rejects (e.g. user only on API)
          try {
            const data = await apiLogin({ email, password })
            applyApiSession(data)
            return toSessionUser(data.user)
          } catch {
            throw firebaseError
          }
        }
      }

      const data = await apiLogin({ email, password })
      applyApiSession(data)
      return toSessionUser(data.user)
    },
    [applyApiSession, syncFirebaseSession],
  )

  const loginWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (!auth) {
      const error = new Error('Firebase is not configured')
      error.code = 'auth/operation-not-allowed'
      throw error
    }
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(auth, provider)
    await syncFirebaseSession(credential.user)
    return credential.user
  }, [syncFirebaseSession])

  const sendPasswordReset = useCallback(async (email) => {
    const auth = getFirebaseAuth()
    if (!auth) {
      const error = new Error('Firebase is not configured')
      error.code = 'auth/operation-not-allowed'
      throw error
    }
    const nextEmail = String(email || '').trim()
    if (!nextEmail) {
      const error = new Error('Missing email')
      error.code = 'auth/missing-email'
      throw error
    }
    auth.useDeviceLanguage()
    try {
      await sendPasswordResetEmail(auth, nextEmail, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      })
    } catch (caught) {
      const code = String(caught?.code || '')
      if (code.includes('unauthorized-continue-uri') || code.includes('invalid-continue-uri')) {
        await sendPasswordResetEmail(auth, nextEmail)
        return
      }
      throw caught
    }
  }, [])

  const verifyResetCode = useCallback(async (code) => {
    const auth = getFirebaseAuth()
    if (!auth) {
      const error = new Error('Firebase is not configured')
      error.code = 'auth/operation-not-allowed'
      throw error
    }
    return verifyPasswordResetCode(auth, code)
  }, [])

  const completePasswordReset = useCallback(async (code, password) => {
    const auth = getFirebaseAuth()
    if (!auth) {
      const error = new Error('Firebase is not configured')
      error.code = 'auth/operation-not-allowed'
      throw error
    }
    await confirmPasswordReset(auth, code, password)
  }, [])

  const logout = useCallback(async () => {
    clearSession()
    const auth = getFirebaseAuth()
    if (auth) await firebaseSignOut(auth)
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      apiUser,
      apiToken,
      apiReady,
      loading,
      configured: configured || Boolean(apiToken),
      register,
      login,
      loginWithGoogle,
      sendPasswordReset,
      verifyResetCode,
      completePasswordReset,
      logout,
      authErrorKey,
    }),
    [
      user,
      firebaseUser,
      apiUser,
      apiToken,
      apiReady,
      loading,
      configured,
      register,
      login,
      loginWithGoogle,
      sendPasswordReset,
      verifyResetCode,
      completePasswordReset,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
