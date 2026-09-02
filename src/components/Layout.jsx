import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import { APP_NAME, BUSINESS_NAV_ITEMS, NAV_ITEMS } from '../lib/constants'
import { firstName } from '../lib/format'
import LanguageSwitcher from './LanguageSwitcher'
import ToastHost from './ToastHost'
import Modal from './Modal'
import TransactionForm from './TransactionForm'
import AssistantPanel from './AssistantPanel'
import ReminderPopup from './ReminderPopup'
import { ASSISTANT_EVENT } from '../lib/assistant'

const pageTitleKeys = {
  '/': 'nav.overview',
  '/transactions': 'nav.transactions',
  '/budgets': 'nav.budgets',
  '/goals': 'nav.goals',
  '/reports': 'nav.reports',
  '/books': 'nav.books',
  '/settings': 'nav.settings',
  '/pricing': 'nav.plans',
  '/business': 'nav.company',
  '/team': 'nav.team',
  '/clients': 'nav.clients',
  '/approvals': 'nav.approvals',
  '/vendors': 'nav.vendors',
  '/shops': 'nav.shops',
  '/analytics': 'nav.analytics',
}

const mobileTabs = [
  { to: '/', labelKey: 'tabs.home', icon: '◫', end: true },
  { to: '/transactions', labelKey: 'tabs.activity', icon: '↔' },
  { to: '/budgets', labelKey: 'nav.budgets', icon: '▤' },
  { to: '/books', labelKey: 'nav.books', icon: '◇' },
]

export default function Layout() {
  const location = useLocation()
  const {
    profile,
    initials,
    categories,
    alerts,
    addTransaction,
    isPro,
    isBusiness,
    isFeatureEnabled,
    t,
    dir,
  } = useExpenses()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addDraft, setAddDraft] = useState(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantSeed, setAssistantSeed] = useState('')
  const [reminderOpen, setReminderOpen] = useState(false)
  const reminderShownRef = useRef(false)

  const title = t(pageTitleKeys[location.pathname] || 'nav.overview')
  const unread = alerts.length

  useEffect(() => {
    function onAssistant(event) {
      setAssistantSeed(event.detail?.prompt || '')
      setAssistantOpen(true)
    }
    window.addEventListener(ASSISTANT_EVENT, onAssistant)
    return () => window.removeEventListener(ASSISTANT_EVENT, onAssistant)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setNotifyOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (reminderShownRef.current || alerts.length === 0) return
    try {
      if (sessionStorage.getItem('expense-so-reminders-shown')) {
        reminderShownRef.current = true
        return
      }
      sessionStorage.setItem('expense-so-reminders-shown', '1')
    } catch {
      // Private mode still gets one popup this visit.
    }
    reminderShownRef.current = true
    setReminderOpen(true)
  }, [alerts.length])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const navButtonClass = ({ isActive }) =>
    `flex w-full items-center gap-[13px] rounded-[7px] px-[13px] py-[11px] text-left text-[13px] transition ${
      isActive ? 'bg-[#2e4947] text-white shadow-[inset_3px_0_0_#c9e75b]' : 'bg-transparent text-[#b6c7c0] hover:bg-[#2e4947] hover:text-white'
    }`

  const sidebar = useMemo(
    () => (
      <>
        <div className="flex items-center justify-between gap-3 px-[13px]">
          <div className="flex items-center gap-[9px] text-[21px] font-bold tracking-[-0.7px] text-[#f6f7ef]">
            <span className="grid h-[23px] w-[23px] place-items-center rounded-[7px] bg-[#c9e75b] text-[19px] text-[#213332]">+</span>
            <span className="font-['Space_Grotesk']">{APP_NAME.toLowerCase()}</span>
          </div>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-lg text-[#adc0b9] lg:hidden" onClick={() => setMobileOpen(false)} aria-label={t('layout.closeMenu')}>
            ×
          </button>
        </div>

        <div className="mt-8 flex items-center gap-[10px] rounded-[8px] border border-[#3b5250] bg-[#203d3d]/60 px-[8px] py-[10px] text-[12px] text-white">
          <span className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-full bg-[#e98069] text-[10px] font-bold">{initials}</span>
          <div className="min-w-0">
            <b className="block truncate">{profile.name}</b>
            <small className="mt-[3px] block truncate text-[10px] text-[#a8bbb2]">{profile.workspace}</small>
          </div>
        </div>

        <nav className="mt-[25px] grid gap-[4px]" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navButtonClass} onClick={() => setMobileOpen(false)}>
              <span className="w-[18px] text-center text-[17px] text-[#b3d0bf]">{item.icon}</span>
              <span className="flex-1">{t(item.labelKey)}</span>
              {item.premium && !isPro ? <span className="text-[9px] font-bold tracking-[0.6px] text-[#d7ef6b]">{t('common.pro')}</span> : null}
            </NavLink>
          ))}
          <p className="mt-3 px-[13px] text-[9px] font-bold tracking-[1px] text-[#768e87]">{t('business.kicker')}</p>
          {BUSINESS_NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navButtonClass} onClick={() => setMobileOpen(false)}>
              <span className="w-[18px] text-center text-[17px] text-[#b3d0bf]">{item.icon}</span>
              <span className="flex-1">{t(item.labelKey)}</span>
              {!isFeatureEnabled(item.feature) ? <span className="text-[9px] font-bold tracking-[0.6px] text-[#8aa39c]">{t('common.off')}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-[22px]">
          <NavLink to="/settings" className={navButtonClass} onClick={() => setMobileOpen(false)}>
            <span className="w-[18px] text-center text-[17px] text-[#b3d0bf]">⚙</span>
            {t('nav.settings')}
          </NavLink>

          <div className="mt-[22px] rounded-[8px] border border-[#47605a] bg-[#294542] p-[17px]">
            <span className="text-[#d7ef6b]">✦</span>
            {isBusiness ? (
              <>
                <b className="mt-[8px] block font-['Space_Grotesk'] text-[14px] text-white">{t('layout.onBusiness')}</b>
                <p className="mt-[7px] text-[11px] leading-[1.5] text-[#adc0b9]">{t('layout.onBusinessBody')}</p>
              </>
            ) : (
              <>
                <b className="mt-[8px] block font-['Space_Grotesk'] text-[14px] text-white">{t('layout.upgradeBusiness')}</b>
                <p className="mt-[7px] text-[11px] leading-[1.5] text-[#adc0b9]">{t('layout.upgradeBusinessBody')}</p>
                <NavLink
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="mt-[15px] inline-block border-0 bg-transparent p-0 text-[11px] font-medium text-[#d7ef6b] no-underline"
                >
                  {t('layout.unlockBusiness')}
                </NavLink>
              </>
            )}
          </div>

          <p className="mt-[28px] px-[13px] text-[10px] text-[#768e87]">© 2026 {APP_NAME} Inc.</p>
        </div>
      </>
    ),
    [initials, isBusiness, isFeatureEnabled, isPro, profile.name, profile.workspace, t],
  )

  return (
    <div className="min-h-dvh bg-[#f7f8f5] text-slate-800 antialiased">
      <ToastHost />
      <main className={`flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden ${dir === 'rtl' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
        <aside className="hidden h-full w-[248px] flex-shrink-0 flex-col overflow-y-auto bg-[#1d3434] px-[18px] py-[28px] text-[#e9f0e8] lg:flex">
          <div className="flex min-h-full flex-1 flex-col">{sidebar}</div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
            <aside
              className={`relative flex h-full w-[min(88vw,320px)] flex-col overflow-y-auto bg-[#1d3434] px-[18px] py-[22px] text-[#e9f0e8] ${dir === 'rtl' ? 'ml-auto' : ''}`}
              style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex min-h-full flex-1 flex-col">{sidebar}</div>
            </aside>
          </div>
        ) : null}

        <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-y-auto">
          <header
            className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between gap-3 border-b border-[#e4e8df] bg-[#fbfcf9]/95 px-4 backdrop-blur sm:min-h-[72px] sm:px-6 lg:px-[5.2%]"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingLeft: 'max(1rem, env(safe-area-inset-left))',
              paddingRight: 'max(1rem, env(safe-area-inset-right))',
            }}
          >
            <div className="flex min-w-0 items-center gap-3 text-[12px] text-[#8e9690]">
              <button type="button" className="hidden h-10 w-10 flex-shrink-0 place-items-center rounded-full text-[20px] text-[#46504c] hover:bg-[#eef1ed] md:grid lg:hidden" onClick={() => setMobileOpen(true)} aria-label={t('layout.openMenu')}>
                ☰
              </button>
              <span className="min-w-0 truncate">
                <span className="hidden sm:inline">{t('layout.workspace')} <span className="mx-[10px] text-[#c1c8c0]">/</span></span>
                <b className="text-[#313b38]">{title}</b>
              </span>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
              <LanguageSwitcher compact />
              <button
                type="button"
                onClick={() => {
                  setAssistantSeed('')
                  setAssistantOpen(true)
                }}
                className="hidden min-h-9 rounded-full border border-[#dfe6df] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1d3434] sm:inline-flex"
          >
            {t('ai.open')}
          </button>
          <button
            type="button"
            onClick={() => {
              setAssistantSeed('')
              setAssistantOpen(true)
            }}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#dfe6df] bg-white text-[11px] font-bold text-[#1d3434] sm:hidden"
            aria-label={t('ai.open')}
          >
            AI
          </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="hidden min-h-9 rounded-[7px] bg-[#e96d52] px-3 py-2 text-[12px] font-bold text-white md:inline-flex"
              >
                {t('layout.add')}
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="relative grid h-10 w-10 place-items-center rounded-full text-[21px] text-[#67726d] hover:bg-[#eef1ed]"
                  aria-label={t('layout.notifications')}
                  onClick={() => setNotifyOpen((open) => !open)}
                >
                  ♢
                  {unread > 0 ? <i className="absolute right-2 top-2 h-[5px] w-[5px] rounded-full bg-[#e96d52]" /> : null}
                </button>
                {notifyOpen ? (
                  <div className="absolute right-0 top-11 z-20 w-[min(calc(100vw-1.5rem),280px)] rounded-[12px] border border-[#e4e8df] bg-white p-3 shadow-lg">
                    <p className="mb-2 text-[11px] font-semibold text-[#263b39]">{t('layout.alerts')}</p>
                    {!isPro && alerts.length === 0 ? (
                      <div>
                        <p className="text-[12px] text-[#7d8782]">{t('layout.alertsLocked')}</p>
                      </div>
                    ) : alerts.length === 0 ? (
                      <p className="text-[12px] text-[#7d8782]">{t('layout.onTrack')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {alerts.map((alert) => (
                          <li key={alert.id} className="rounded-[8px] bg-[#f7f9f2] px-3 py-2 text-[11px] text-[#46504c]">
                            {alert.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>

              <NavLink to="/settings" className="flex items-center gap-2 text-[12px] text-[#46504c]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#7b73b7] text-[10px] font-bold text-white">{initials}</span>
                <span className="hidden lg:inline">{firstName(profile.name)}</span>
                {isBusiness ? (
                  <span className="hidden rounded-full bg-[#1d3434] px-2 py-0.5 text-[9px] font-bold text-[#d7ef6b] sm:inline">{t('common.biz')}</span>
                ) : null}
              </NavLink>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 pb-28 sm:px-6 sm:pt-8 md:pb-10 lg:px-[5.2%] lg:py-[43px]">
            <Outlet />
          </div>
        </section>
      </main>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className={`fixed z-30 grid h-14 w-14 place-items-center rounded-full bg-[#e96d52] text-2xl font-bold text-white shadow-[0_8px_20px_rgba(233,109,82,0.4)] md:hidden ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
        style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
        aria-label={t('layout.addTransaction')}
      >
        +
      </button>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#e4e8df] bg-[#fbfcf9]/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Mobile navigation"
      >
        {mobileTabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] ${isActive ? 'text-[#1d3434]' : 'text-[#7d8782]'}`
            }
          >
            <span className="text-[16px]">{item.icon}</span>
            {t(item.labelKey)}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] text-[#7d8782]">
          <span className="text-[16px]">☰</span>
          {t('tabs.menu')}
        </button>
      </nav>

      {assistantOpen ? (
        <AssistantPanel
          seedPrompt={assistantSeed}
          onClose={() => {
            setAssistantOpen(false)
            setAssistantSeed('')
          }}
          onEditDraft={(draft) => {
            setAssistantOpen(false)
            setAssistantSeed('')
            setAddDraft(draft)
            setAddOpen(true)
          }}
        />
      ) : null}

      {reminderOpen && alerts.length > 0 && !addOpen && !assistantOpen ? (
        <ReminderPopup alerts={alerts} onClose={() => setReminderOpen(false)} />
      ) : null}

      {addOpen ? (
        <Modal title={t('layout.addTransaction')} onClose={() => { setAddOpen(false); setAddDraft(null) }}>
          <TransactionForm
            key={addDraft ? `draft-${addDraft.name}-${addDraft.amount}` : 'blank'}
            categories={categories}
            variant="personal"
            initialValue={addDraft}
            submitLabel={t('tx.saveEntry')}
            onCancel={() => { setAddOpen(false); setAddDraft(null) }}
            onSubmit={(payload) => {
              addTransaction(payload)
              setAddOpen(false)
              setAddDraft(null)
            }}
          />
        </Modal>
      ) : null}
    </div>
  )
}
