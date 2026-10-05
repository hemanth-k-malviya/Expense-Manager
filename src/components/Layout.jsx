import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import { useAuth } from '../context/AuthContext'
import { APP_NAME, BUSINESS_NAV_ITEMS, NAV_ITEMS } from '../lib/constants'
import { firstName } from '../lib/format'
import LanguageSwitcher from './LanguageSwitcher'
import ToastHost from './ToastHost'
import Modal from './Modal'
import TransactionForm from './TransactionForm'
import AssistantPanel from './AssistantPanel'
import ReminderPopup from './ReminderPopup'
import { ASSISTANT_EVENT } from '../lib/assistant'
import { isAiAssistantEnabled } from '../lib/gemini'
import { formVariantFor } from '../lib/ledger'
import NavIcon from './NavIcons'

const pageTitleKeys = {
  '/app': 'nav.overview',
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
  { to: '/app', labelKey: 'tabs.home', icon: 'overview', end: true },
  { to: '/transactions', labelKey: 'tabs.activity', icon: 'transactions' },
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
    t,
    dir,
  } = useExpenses()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addDraft, setAddDraft] = useState(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantSeed, setAssistantSeed] = useState('')
  const [reminderOpen, setReminderOpen] = useState(false)
  const reminderShownRef = useRef(false)

  const title = t(pageTitleKeys[location.pathname] || 'nav.overview')
  const unread = alerts.length
  const aiAvailable = isAiAssistantEnabled(profile)

  useEffect(() => {
    function onAssistant(event) {
      if (!isAiAssistantEnabled(profile)) return
      setAssistantSeed(event.detail?.prompt || '')
      setAssistantOpen(true)
    }
    window.addEventListener(ASSISTANT_EVENT, onAssistant)
    return () => window.removeEventListener(ASSISTANT_EVENT, onAssistant)
  }, [profile])

  useEffect(() => {
    if (!aiAvailable && assistantOpen) {
      setAssistantOpen(false)
      setAssistantSeed('')
    }
  }, [aiAvailable, assistantOpen])

  useEffect(() => {
    setMobileOpen(false)
    setNotifyOpen(false)
    setAccountOpen(false)
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

  const closeAssistant = () => {
    setAssistantOpen(false)
    setAssistantSeed('')
  }

  const handleLogout = async () => {
    setAccountOpen(false)
    setMobileOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const navButtonClass = ({ isActive }) =>
    `flex w-full items-center gap-[13px] rounded-[7px] px-[13px] py-[11px] text-left text-[15px] transition ${
      isActive ? 'bg-[#2e4947] text-white shadow-[inset_3px_0_0_#c9e75b]' : 'bg-transparent text-[#b6c7c0] hover:bg-[#2e4947] hover:text-white'
    }`

  const sidebar = useMemo(
    () => (
      <>
        <div className="flex items-center justify-between gap-3 px-[13px]">
          <div className="flex items-center gap-[9px] text-[24px] font-bold tracking-[-0.7px] text-[#f6f7ef]">
            <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-[#c9e75b] text-[20px] text-[#213332]">+</span>
            <span className="font-['Space_Grotesk']">{APP_NAME.toLowerCase()}</span>
          </div>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-lg text-[#adc0b9] lg:hidden" onClick={() => setMobileOpen(false)} aria-label={t('layout.closeMenu')}>
            ×
          </button>
        </div>

        <div className="mt-8 flex items-center gap-[10px] rounded-[8px] border border-[#3b5250] bg-[#203d3d]/60 px-[8px] py-[10px] text-[15px] text-white">
          <span className="grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-full bg-[#e98069] text-[12px] font-bold">{initials}</span>
          <div className="min-w-0">
            <b className="block truncate">{profile.name}</b>
            <small className="mt-[3px] block truncate text-[12px] text-[#a8bbb2]">{profile.workspace}</small>
          </div>
        </div>

        <nav className="mt-[25px] grid gap-[4px]" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/app'} className={navButtonClass} onClick={() => setMobileOpen(false)}>
              <span className="inline-flex w-[18px] items-center justify-center text-[#b3d0bf]">
                <NavIcon name={item.icon} />
              </span>
              <span className="flex-1">{t(item.labelKey)}</span>
              {item.premium && !isPro ? <span className="text-[11px] font-bold tracking-[0.6px] text-[#d7ef6b]">{t('common.pro')}</span> : null}
            </NavLink>
          ))}
          <p className="mt-3 px-[13px] text-[11px] font-bold tracking-[1px] text-[#768e87]">{t('business.kicker')}</p>
          {BUSINESS_NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navButtonClass} onClick={() => setMobileOpen(false)}>
              <span className="inline-flex w-[18px] items-center justify-center text-[#b3d0bf]">
                <NavIcon name={item.icon} />
              </span>
              <span className="flex-1">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-[22px]">
          <NavLink to="/settings" className={navButtonClass} onClick={() => setMobileOpen(false)}>
            <span className="inline-flex w-[18px] items-center justify-center text-[#b3d0bf]">
              <NavIcon name="settings" />
            </span>
            {t('nav.settings')}
          </NavLink>
          <button
            type="button"
            onClick={() => {
              handleLogout()
            }}
            className="mt-1 flex w-full items-center gap-[13px] rounded-[7px] px-[13px] py-[11px] text-left text-[15px] text-[#b6c7c0] hover:bg-[#2e4947] hover:text-white"
          >
            <span className="inline-flex w-[18px] items-center justify-center text-[#b3d0bf]">
              <NavIcon name="logout" />
            </span>
            {t('auth.signOut')}
          </button>

          <p className="mt-[28px] px-[13px] text-[12px] text-[#768e87]">
            © 2026 {APP_NAME}
          </p>
          <NavLink to="/privacy" className="mt-2 block px-[13px] text-[12px] text-[#c9e75b]">
            {t('site.nav.privacy')}
          </NavLink>
        </div>
      </>
    ),
    [handleLogout, initials, isPro, profile.name, profile.workspace, t],
  )

  return (
    <div className="min-h-dvh bg-[#f7f8f5] text-slate-800 antialiased">
      <ToastHost />
      <main className={`flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden ${dir === 'rtl' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
        <aside className="no-scrollbar hidden h-full w-[272px] flex-shrink-0 flex-col overflow-y-auto bg-[#1d3434] px-[18px] py-[28px] text-[#e9f0e8] lg:flex">
          <div className="flex min-h-full flex-1 flex-col">{sidebar}</div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
            <aside
              className={`no-scrollbar relative flex h-full w-[min(88vw,320px)] flex-col overflow-y-auto bg-[#1d3434] px-[18px] py-[22px] text-[#e9f0e8] ${dir === 'rtl' ? 'ml-auto' : ''}`}
              style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex min-h-full flex-1 flex-col">{sidebar}</div>
            </aside>
          </div>
        ) : null}

        <section className="no-scrollbar flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-y-auto">
          <header
            className="sticky top-0 z-30 border-b border-[#e7ebe3] bg-[#fbfcf9]/92 backdrop-blur-md"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div
              className="mx-auto flex min-h-[56px] w-full max-w-[1360px] items-center justify-between gap-3 px-4 py-2 sm:min-h-[64px] sm:px-6 lg:px-8"
              style={{
                paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                paddingRight: 'max(1rem, env(safe-area-inset-right))',
              }}
            >
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[#46504c] hover:bg-[#eef1ed] md:inline-flex lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label={t('layout.openMenu')}
                >
                  <NavIcon name="menu" />
                </button>
                <div className="min-w-0">
                  <p className="hidden text-[11px] font-medium tracking-[0.04em] text-[#8e9690] sm:block">
                    {t('layout.workspace')}
                  </p>
                  <h1 className="truncate font-['Space_Grotesk'] text-[17px] font-semibold leading-tight tracking-[-0.02em] text-[#1d3434] sm:mt-0.5 sm:text-[18px]">
                    {title}
                  </h1>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[#e4e8df] bg-white/90 p-1 shadow-[0_1px_2px_rgba(29,52,52,0.04)] sm:gap-1.5 sm:px-1.5">
                <div className="hidden sm:block">
                  <LanguageSwitcher compact />
                </div>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="hidden h-9 items-center rounded-full bg-[#e96d52] px-3.5 text-[13px] font-semibold text-white md:inline-flex"
                >
                  {t('layout.add')}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5f6b66] transition hover:bg-[#f3f6f1]"
                    aria-label={t('layout.notifications')}
                    onClick={() => {
                      setAccountOpen(false)
                      setNotifyOpen((open) => !open)
                    }}
                  >
                    <NavIcon name="notifications" />
                    {unread > 0 ? (
                      <i className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e96d52] ring-2 ring-white" />
                    ) : null}
                  </button>
                  {notifyOpen ? (
                    <div className="absolute right-0 top-11 z-20 w-[min(calc(100vw-1.5rem),280px)] rounded-[14px] border border-[#e4e8df] bg-white p-3 shadow-[0_12px_32px_rgba(29,52,52,0.14)]">
                      <p className="mb-2 text-[13px] font-semibold text-[#263b39]">{t('layout.alerts')}</p>
                      {!isPro && alerts.length === 0 ? (
                        <p className="text-[13px] leading-5 text-[#7d8782]">{t('layout.alertsLocked')}</p>
                      ) : alerts.length === 0 ? (
                        <p className="text-[13px] leading-5 text-[#7d8782]">{t('layout.onTrack')}</p>
                      ) : (
                        <ul className="space-y-2">
                          {alerts.map((alert) => (
                            <li key={alert.id} className="rounded-[10px] bg-[#f7f9f2] px-3 py-2 text-[13px] leading-5 text-[#46504c]">
                              {alert.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="flex h-9 items-center gap-2 rounded-full pl-0.5 pr-1 text-[13px] text-[#46504c] transition hover:bg-[#f3f6f1] sm:pr-2"
                    aria-label={t('auth.account')}
                    aria-expanded={accountOpen}
                    onClick={() => {
                      setNotifyOpen(false)
                      setAccountOpen((open) => !open)
                    }}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1d3434] text-[11px] font-bold text-[#d7ef6b]">
                      {initials}
                    </span>
                    <span className="hidden max-w-[7rem] truncate font-medium lg:inline">{firstName(profile.name)}</span>
                  </button>
                  {accountOpen ? (
                    <div
                      className={`absolute top-11 z-20 w-[min(calc(100vw-1.5rem),220px)] rounded-[14px] border border-[#e4e8df] bg-white p-2 shadow-[0_12px_32px_rgba(29,52,52,0.14)] ${
                        dir === 'rtl' ? 'left-0' : 'right-0'
                      }`}
                    >
                      <p className="truncate px-2.5 py-2 text-[12px] text-[#7d8782]">{user?.email || profile.name}</p>
                      <NavLink
                        to="/settings"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-[10px] px-2.5 py-2.5 text-[14px] font-medium text-[#46504c] hover:bg-[#f7f9f2]"
                      >
                        {t('nav.settings')}
                      </NavLink>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full rounded-[10px] px-2.5 py-2.5 text-left text-[14px] font-semibold text-[#c45b45] hover:bg-[#f7f9f2]"
                      >
                        {t('auth.signOut')}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 sm:pb-28 md:pb-10 lg:px-8 lg:py-[43px]">
            <Outlet />
          </div>
        </section>
      </main>

      {aiAvailable && assistantOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-[#1d3434]/30 md:bg-[#1d3434]/20"
          aria-label={t('common.close')}
          onClick={closeAssistant}
        />
      ) : null}

      {aiAvailable && assistantOpen ? (
        <div
          className={`fixed z-40 flex justify-center px-3 md:justify-end ${dir === 'rtl' ? 'left-0 right-0 md:left-4 md:right-auto lg:left-[calc(272px+1rem)]' : 'left-0 right-0 md:right-4 md:left-auto'}`}
          style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}
        >
          <div className="md:hidden">
            <AssistantPanel seedPrompt={assistantSeed} onClose={closeAssistant} />
          </div>
        </div>
      ) : null}

      {aiAvailable ? (
        <div
          className={`fixed z-40 hidden flex-col md:flex ${dir === 'rtl' ? 'items-start left-4 lg:left-[calc(272px+1.5rem)]' : 'items-end right-4'} bottom-6`}
        >
          {assistantOpen ? <AssistantPanel seedPrompt={assistantSeed} onClose={closeAssistant} /> : null}
          <button
            type="button"
            onClick={() => {
              if (assistantOpen) {
                closeAssistant()
                return
              }
              setAssistantSeed('')
              setAssistantOpen(true)
            }}
            className={`mt-3 grid h-12 w-12 place-items-center rounded-full shadow-[0_10px_24px_rgba(29,52,52,0.22)] transition ${
              assistantOpen ? 'bg-[#e96d52] text-white' : 'bg-[#1d3434] text-[#d7ef6b]'
            }`}
            aria-label={assistantOpen ? t('common.close') : t('ai.open')}
            aria-expanded={assistantOpen}
          >
            {assistantOpen ? (
              <span className="text-2xl leading-none">×</span>
            ) : (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#c9e75b] text-[#1d3434]">
                <NavIcon name="ai" />
              </span>
            )}
          </button>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 overflow-visible border-t border-[#e4e8df] bg-[#fbfcf9]/96 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5 items-end overflow-visible px-1 pt-2">
          {mobileTabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight ${isActive ? 'text-[#1d3434]' : 'text-[#7d8782]'}`
              }
            >
              <NavIcon name={item.icon} />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </NavLink>
          ))}

          <div className="relative flex min-h-[3.5rem] flex-col items-center justify-end pb-1">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="absolute -top-5 inline-flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-[#e96d52] text-white shadow-[0_8px_18px_rgba(233,109,82,0.38)]"
              aria-label={t('layout.addTransaction')}
            >
              <NavIcon name="add" />
            </button>
            <span className="mt-7 text-[11px] font-medium leading-tight text-[#7d8782]">{t('tabs.add')}</span>
          </div>

          {aiAvailable ? (
            <button
              type="button"
              onClick={() => {
                if (assistantOpen) {
                  closeAssistant()
                  return
                }
                setAssistantSeed('')
                setAssistantOpen(true)
              }}
              className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight ${
                assistantOpen ? 'text-[#1d3434]' : 'text-[#7d8782]'
              }`}
              aria-label={t('ai.open')}
              aria-expanded={assistantOpen}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1d3434] text-[#c9e75b]">
                <NavIcon name="ai" />
              </span>
              <span className="max-w-full truncate">{t('tabs.ai')}</span>
            </button>
          ) : (
            <NavLink
              to="/budgets"
              className={({ isActive }) =>
                `flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight ${isActive ? 'text-[#1d3434]' : 'text-[#7d8782]'}`
              }
            >
              <NavIcon name="budgets" />
              <span className="max-w-full truncate">{t('nav.budgets')}</span>
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight text-[#7d8782]"
          >
            <NavIcon name="menu" />
            <span className="max-w-full truncate">{t('tabs.menu')}</span>
          </button>
        </div>
      </nav>

      {reminderOpen && alerts.length > 0 && !addOpen && !(aiAvailable && assistantOpen) ? (
        <ReminderPopup alerts={alerts} onClose={() => setReminderOpen(false)} />
      ) : null}

      {addOpen ? (
        <Modal title={t('layout.addTransaction')} onClose={() => { setAddOpen(false); setAddDraft(null) }} wide={addDraft ? formVariantFor(addDraft) !== 'personal' : false}>
          <TransactionForm
            key={addDraft ? `draft-${addDraft.name}-${addDraft.amount}` : 'blank'}
            categories={categories}
            variant={addDraft ? formVariantFor(addDraft) : 'personal'}
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
