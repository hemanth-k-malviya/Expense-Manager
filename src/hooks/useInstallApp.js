import { useCallback, useEffect, useState } from 'react'
import { isIosInstallBrowser, isStandaloneDisplay } from '../lib/pwa'

export function useInstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => isStandaloneDisplay())
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setInstalling(false)
    }
    const onDisplayMode = () => {
      setInstalled(isStandaloneDisplay())
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    window.matchMedia('(display-mode: standalone)').addEventListener('change', onDisplayMode)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', onDisplayMode)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt || installing) return 'unavailable'
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (outcome === 'accepted') {
        setInstalled(true)
        return 'accepted'
      }
      return 'dismissed'
    } catch {
      return 'failed'
    } finally {
      setInstalling(false)
    }
  }, [deferredPrompt, installing])

  return {
    canPromptInstall: Boolean(deferredPrompt),
    installed,
    installing,
    iosManual: isIosInstallBrowser(),
    install,
  }
}
