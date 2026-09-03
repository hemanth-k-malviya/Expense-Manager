import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCZgtL9LWopDYGAgeY-yWSCjSk9om22Rpk').trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'expense-manager-8eb96.firebaseapp.com').trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || 'expense-manager-8eb96').trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'expense-manager-8eb96.firebasestorage.app').trim(),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '33609184051').trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID || '1:33609184051:web:0d94d771f2dd7c4e3ac446').trim(),
}

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)
}

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export function getFirebaseAuth() {
  const app = getFirebaseApp()
  return app ? getAuth(app) : null
}
