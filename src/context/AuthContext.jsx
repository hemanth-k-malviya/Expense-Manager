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
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState(() => getFirebaseAuth()?.currentUser ?? null)
  const [loading, setLoading] = useState(() => configured && !getFirebaseAuth()?.currentUser)

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setUser(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    const unsub = onAuthStateChanged(auth, (next) => {
      if (!cancelled) setUser(next)
    })

    auth.authStateReady().finally(() => {
      if (cancelled) return
      setUser(auth.currentUser)
      setLoading(false)
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [configured])

  const register = useCallback(async ({ name, email, password }) => {
    const auth = getFirebaseAuth()
    if (!auth) {
      const error = new Error('Firebase is not configured')
      error.code = 'auth/operation-not-allowed'
      throw error
    }
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const displayName = name.trim()
    if (displayName) {
      await updateProfile(credential.user, { displayName })
    }
    return credential.user
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const auth = getFirebaseAuth()
    if (!auth) {
      const error = new Error('Firebase is not configured')
      error.code = 'auth/operation-not-allowed'
      throw error
    }
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  }, [])

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
    return credential.user
  }, [])

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
    const auth = getFirebaseAuth()
    if (!auth) return
    await firebaseSignOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      register,
      login,
      loginWithGoogle,
      sendPasswordReset,
      verifyResetCode,
      completePasswordReset,
      logout,
      authErrorKey,
    }),
    [user, loading, configured, register, login, loginWithGoogle, sendPasswordReset, verifyResetCode, completePasswordReset, logout],
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
