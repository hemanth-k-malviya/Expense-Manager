import { translate, detectLanguage } from '../i18n'
import { useInstallApp } from '../hooks/useInstallApp'
import { isDesktopInstallBrowser } from '../lib/pwa'

export default function InstallAppPanel({ t, compact = false }) {
  const say = t || ((key) => translate(detectLanguage(), key))
  const { canPromptInstall, installed, installing, iosManual, install } = useInstallApp()
  const muted = compact ? 'text-[#c5d4cf]' : 'text-[#7d8782]'
  const ok = compact ? 'text-[#b8d4c8]' : 'text-[#4d7772]'

  if (installed) {
    return (
      <p className={`text-[14px] leading-6 ${ok} ${compact ? '' : 'mt-4'}`}>{say('pwa.installed')}</p>
    )
  }

  if (canPromptInstall) {
    return (
      <div className={compact ? '' : 'mt-4'}>
        <button
          type="button"
          disabled={installing}
          onClick={async () => {
            const outcome = await install()
            if (outcome === 'accepted') return
            if (outcome === 'dismissed') return
          }}
          className="min-h-11 rounded-[8px] bg-[#1d3434] px-4 py-2.5 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {installing ? say('pwa.installing') : say('pwa.install')}
        </button>
      </div>
    )
  }

  if (iosManual) {
    return (
      <ol className={`list-decimal space-y-2 pl-5 text-[14px] leading-6 ${muted} ${compact ? '' : 'mt-4'}`}>
        <li>{say('pwa.iosStep1')}</li>
        <li>{say('pwa.iosStep2')}</li>
        <li>{say('pwa.iosStep3')}</li>
      </ol>
    )
  }

  if (isDesktopInstallBrowser()) {
    return <p className={`text-[14px] leading-6 ${muted} ${compact ? '' : 'mt-4'}`}>{say('pwa.desktopHelp')}</p>
  }

  return <p className={`text-[14px] leading-6 ${muted} ${compact ? '' : 'mt-4'}`}>{say('pwa.browserHelp')}</p>
}
