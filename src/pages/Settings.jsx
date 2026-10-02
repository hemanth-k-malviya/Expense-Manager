import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Field, { controlClass } from '../components/Field'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ConfirmDialog from '../components/ConfirmDialog'
import InstallAppPanel from '../components/InstallAppPanel'
import Modal from '../components/Modal'
import { useExpenses } from '../context/ExpenseContext'
import { useAuth } from '../context/AuthContext'
import { categoryLabel, paymentLabel } from '../i18n'
import { extractBackupState } from '../lib/backup'
import { CURRENCIES, PAYMENT_METHODS, RECURRING_FREQUENCIES } from '../lib/constants'
import { todayISO, formatDisplayDate } from '../lib/dates'
import { formatMoney } from '../lib/format'

export default function Settings() {
  const {
    profile,
    categories,
    recurring,
    updateProfile,
    addCategory,
    deleteCategory,
    addRecurring,
    deleteRecurring,
    exportJson,
    exportCsv,
    importJson,
    resetAll,
    addToast,
    t,
    locale,
  } = useExpenses()
  const { user, logout, sendPasswordReset, authErrorKey } = useAuth()
  const navigate = useNavigate()

  const fileRef = useRef(null)
  const [name, setName] = useState(profile.name)
  const [workspace, setWorkspace] = useState(profile.workspace)
  const [currency, setCurrency] = useState(profile.currency)
  const [aiEnabled, setAiEnabled] = useState(Boolean(profile.aiEnabled))
  const [geminiApiKey, setGeminiApiKey] = useState(profile.geminiApiKey || '')
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'expense' })
  const [recurringOpen, setRecurringOpen] = useState(false)
  const [recurringForm, setRecurringForm] = useState({
    name: '',
    amount: '',
    type: 'expense',
    category: categories.find((item) => item.type === 'expense')?.name || 'Other',
    frequency: 'monthly',
    nextDate: todayISO(),
    paymentMethod: 'Bank',
    note: '',
  })
  const [resetOpen, setResetOpen] = useState(false)
  const [pendingBackup, setPendingBackup] = useState(null)
  const [resetBusy, setResetBusy] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const [recurringError, setRecurringError] = useState('')

  useEffect(() => {
    setName(profile.name)
    setWorkspace(profile.workspace)
    setCurrency(profile.currency)
    setAiEnabled(Boolean(profile.aiEnabled))
    setGeminiApiKey(profile.geminiApiKey || '')
  }, [profile.name, profile.workspace, profile.currency, profile.aiEnabled, profile.geminiApiKey])

  const saveProfile = (event) => {
    event.preventDefault()
    if (!name.trim()) return
    updateProfile({ name: name.trim(), workspace: workspace.trim() || 'Personal workspace', currency })
    addToast(t('toast.profileSaved'), 'success')
  }

  const handleAddCategory = (event) => {
    event.preventDefault()
    if (!categoryForm.name.trim()) {
      setCategoryError(t('form.needCategory'))
      return
    }
    const ok = addCategory(categoryForm)
    if (ok) {
      setCategoryForm({ name: '', type: categoryForm.type })
      setCategoryError('')
    }
  }

  const handleRecurring = (event) => {
    event.preventDefault()
    const amount = Number.parseFloat(recurringForm.amount)
    if (!recurringForm.name.trim()) {
      setRecurringError(t('form.needItemName'))
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setRecurringError(t('form.needAmount'))
      return
    }
    addRecurring({ ...recurringForm, amount })
    setRecurringOpen(false)
    setRecurringError('')
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      extractBackupState(text)
      setPendingBackup(text)
    } catch {
      addToast(t('toast.importFail'), 'warn')
    }
  }

  return (
    <div className="space-y-5 sm:space-y-4">
      <div className="pr-1">
        <h1 className="page-title m-0 font-semibold text-[#223535]">{t('settings.title')}</h1>
        <p className="mt-2 text-[14px] leading-6 text-[#88918b] sm:text-[15px]">{t('settings.subtitle')}</p>
      </div>

      <section className="rounded-[12px] border border-[#e8ebe4] bg-white p-4 sm:rounded-[9px] sm:p-5">
        <h2 className="text-[18px] font-semibold text-[#263b39] sm:text-[20px]">{t('settings.language')}</h2>
        <p className="mt-1.5 text-[14px] leading-6 text-[#7d8782] sm:text-[15px]">{t('settings.languageHelp')}</p>
        <div className="mt-4 max-w-lg">
          <LanguageSwitcher />
        </div>
      </section>

      <section className="rounded-[12px] border border-[#e8ebe4] bg-white p-4 sm:rounded-[9px] sm:p-5">
        <h2 className="text-[18px] font-semibold text-[#263b39] sm:text-[20px]">{t('pwa.title')}</h2>
        <p className="mt-1.5 text-[14px] leading-6 text-[#7d8782] sm:text-[15px]">{t('pwa.help')}</p>
        <InstallAppPanel t={t} />
      </section>

      <section className="rounded-[12px] border border-[#e8ebe4] bg-white p-4 sm:rounded-[9px] sm:p-5">
        <h2 className="text-[18px] font-semibold text-[#263b39] sm:text-[20px]">{t('auth.account')}</h2>
        <p className="mt-1.5 break-all text-[14px] leading-6 text-[#7d8782] sm:text-[15px]">{t('auth.signedInAs', { email: user?.email || '—' })}</p>
        <p className="mt-2 text-[14px] leading-6 text-[#7d8782] sm:text-[15px]">{t('auth.resetHelp')}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={async () => {
              setResetBusy(true)
              try {
                await sendPasswordReset(user?.email)
                addToast(t('auth.resetSent', { email: user?.email || '' }), 'success')
              } catch (caught) {
                addToast(t(authErrorKey(caught)), 'warn')
              } finally {
                setResetBusy(false)
              }
            }}
            disabled={resetBusy || !user?.email}
            className="min-h-11 rounded-[8px] border border-[#dfe6df] px-4 py-2.5 text-[15px] font-semibold text-[#1d3434] disabled:opacity-50 sm:w-auto"
          >
            {resetBusy ? t('auth.working') : t('auth.resetPassword')}
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="min-h-11 rounded-[8px] bg-[#1d3434] px-4 py-2.5 text-[15px] font-semibold text-white sm:w-auto"
          >
            {t('auth.signOut')}
          </button>
        </div>
      </section>

      <section className="rounded-[12px] border border-[#e8ebe4] bg-white p-4 sm:rounded-[9px] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold text-[#263b39] sm:text-[20px]">{t('ai.settings')}</h2>
            <p className="mt-1.5 text-[14px] leading-6 text-[#7d8782] sm:text-[15px]">{t('ai.settingsHelp')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={aiEnabled}
            aria-label={t('ai.toggle')}
            onClick={() => {
              const next = !aiEnabled
              setAiEnabled(next)
              updateProfile({ aiEnabled: next, ...(next ? {} : { geminiApiKey: geminiApiKey.trim() }) })
              addToast(next ? t('ai.toastOn') : t('ai.toastOff'), next ? 'success' : 'info')
            }}
            className={`relative mt-0.5 h-8 w-14 flex-shrink-0 rounded-full transition ${aiEnabled ? 'bg-[#1d3434]' : 'bg-[#d5ddd6]'}`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${aiEnabled ? 'left-7' : 'left-1'}`}
            />
          </button>
        </div>

        {aiEnabled ? (
          <form
            className="mt-5 max-w-xl space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              const key = geminiApiKey.trim()
              if (!key) {
                addToast(t('ai.needKey'), 'warn')
                return
              }
              updateProfile({ aiEnabled: true, geminiApiKey: key })
              addToast(t('ai.toastKey'), 'success')
            }}
          >
            <label className="block text-[15px] font-medium text-[#4b5d5a]">
              {t('ai.apiKey')}
              <input
                type="password"
                autoComplete="off"
                value={geminiApiKey}
                onChange={(event) => setGeminiApiKey(event.target.value)}
                placeholder={t('ai.apiKeyPh')}
                className={`mt-1.5 ${controlClass}`}
              />
            </label>
            <p className="text-[13px] leading-5 text-[#88918b]">{t('ai.apiKeyHint')}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button type="submit" className="min-h-11 rounded-[8px] bg-[#1d3434] px-4 py-2.5 text-[15px] font-semibold text-white">
                {t('ai.saveKey')}
              </button>
              {profile.geminiApiKey ? (
                <button
                  type="button"
                  onClick={() => {
                    setGeminiApiKey('')
                    updateProfile({ geminiApiKey: '' })
                    addToast(t('ai.toastKeyRemoved'), 'info')
                  }}
                  className="min-h-11 rounded-[8px] border border-[#dfe6df] px-4 py-2.5 text-[15px]"
                >
                  {t('ai.clearKey')}
                </button>
              ) : null}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-[8px] px-4 py-2.5 text-[15px] font-medium text-[#4d7772]"
              >
                {t('ai.studio')} ↗
              </a>
            </div>
          </form>
        ) : null}
      </section>

      <section className="rounded-[12px] border border-[#e8ebe4] bg-white p-4 sm:rounded-[9px] sm:p-5">
        <h2 className="text-[18px] font-semibold text-[#263b39] sm:text-[20px]">{t('settings.profile')}</h2>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('settings.displayName')} explain={t('settings.displayNameHint')} placeholder={t('settings.displayNamePh')}>
            <input value={name} onChange={(event) => setName(event.target.value)} className={controlClass} />
          </Field>
          <Field label={t('settings.workspace')} explain={t('settings.workspaceHint')} placeholder={t('settings.workspacePh')}>
            <input value={workspace} onChange={(event) => setWorkspace(event.target.value)} className={controlClass} />
          </Field>
          <Field label={t('settings.currency')} explain={t('settings.currencyHint')} className="sm:col-span-2">
            <select value={currency} onChange={(event) => setCurrency(event.target.value)} className={controlClass}>
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} — {item.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className="min-h-11 w-full rounded-[8px] bg-[#1d3434] px-4 py-2.5 text-[15px] font-semibold text-white sm:w-auto">
              {t('settings.saveProfile')}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[12px] border border-[#e8ebe4] bg-white p-4 sm:rounded-[9px] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold text-[#263b39] sm:text-[20px]">{t('settings.categories')}</h2>
        </div>
        <form
          onSubmit={handleAddCategory}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]"
        >
          <Field label={t('settings.newCategory')} explain={t('settings.categoryHint')} placeholder={t('settings.categoryPh')}>
            <input
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              className={controlClass}
            />
          </Field>
          <Field label={t('form.type')} explain={t('settings.categoryTypeHint')}>
            <select
              value={categoryForm.type}
              onChange={(event) => setCategoryForm((current) => ({ ...current, type: event.target.value }))}
              className={controlClass}
            >
              <option value="expense">{t('type.expense')}</option>
              <option value="income">{t('type.income')}</option>
            </select>
          </Field>
          <button type="submit" className="min-h-11 w-full rounded-[8px] bg-[#e96d52] px-4 py-2.5 text-[15px] font-semibold text-white sm:w-auto sm:self-end">
            {t('settings.add')}
          </button>
        </form>
        {categoryError ? <p className="mt-2 text-[15px] text-[#c45b45]">{categoryError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category.id} className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#f3f6f1] px-3 py-1.5 text-[13px] text-[#46504c] sm:text-[14px]">
              <span className="truncate">{categoryLabel(t, category.name)}</span>
              <em className="flex-shrink-0 not-italic text-[#8a948e]">{t(`type.${category.type}`)}</em>
              <button type="button" onClick={() => deleteCategory(category.id)} className="flex-shrink-0 text-[#b45b4a]" aria-label={`${t('common.delete')} ${category.name}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] border border-[#e8ebe4] bg-white p-4 sm:rounded-[9px] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[18px] font-semibold text-[#263b39] sm:text-[20px]">{t('settings.recurring')}</h2>
          <button
            type="button"
            onClick={() => setRecurringOpen(true)}
            className="min-h-10 rounded-[8px] px-2 text-[14px] font-semibold text-[#4d7772] sm:text-[15px]"
          >
            {t('settings.addRecurring')}
          </button>
        </div>
        <div className="mt-4 divide-y divide-[#eff1ed]">
          {recurring.length === 0 ? (
            <p className="py-4 text-[14px] leading-6 text-[#7d8782] sm:text-[15px]">{t('settings.noRecurring')}</p>
          ) : (
            recurring.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3.5 text-[14px] sm:text-[15px]">
                <div className="min-w-0">
                  <b className="block truncate text-[#263b39]">{item.name}</b>
                  <span className="mt-1 block leading-5 text-[#7d8782]">
                    {formatMoney(item.amount, profile.currency)} · {t(`freq.${item.frequency}`)} · {t('settings.next', { date: formatDisplayDate(item.nextDate, new Date(), t, locale) })}
                  </span>
                </div>
                <button type="button" onClick={() => deleteRecurring(item.id)} className="min-h-10 flex-shrink-0 px-1 text-[#b45b4a]">
                  {t('common.remove')}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[12px] border border-[#e8ebe4] bg-white p-4 sm:rounded-[9px] sm:p-5">
        <h2 className="text-[18px] font-semibold text-[#263b39] sm:text-[20px]">{t('settings.data')}</h2>
        <p className="mt-2 text-[14px] leading-6 text-[#7d8782] sm:text-[15px]">{t('settings.dataHelp')}</p>
        <p className="mt-2 text-[14px] leading-6 text-[#7d8782] sm:text-[15px]">{t('settings.dataIncludes')}</p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={exportJson}
            className="min-h-11 rounded-[8px] bg-[#1d3434] px-4 py-2.5 text-[15px] font-semibold text-white"
          >
            {t('settings.downloadBackup')}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="min-h-11 rounded-[8px] border border-[#dfe6df] px-4 py-2.5 text-[15px] font-medium"
          >
            {t('common.export')}
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="min-h-11 rounded-[8px] border border-[#dfe6df] px-4 py-2.5 text-[15px] font-medium">
            {t('settings.restore')}
          </button>
          <button type="button" onClick={() => setResetOpen(true)} className="min-h-11 rounded-[8px] px-4 py-2.5 text-[15px] font-medium text-[#b45b4a]">
            {t('settings.reset')}
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        </div>
      </section>

      {recurringOpen ? (
        <Modal title={t('settings.recurringModal')} onClose={() => setRecurringOpen(false)}>
          <form onSubmit={handleRecurring} className="space-y-4">
            <Field label={t('goals.name')} explain={t('settings.recurringNameHint')} placeholder={t('settings.recurringNamePh')}>
              <input value={recurringForm.name} onChange={(event) => setRecurringForm((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.type')} explain={t('form.typeHint')}>
                <select
                  value={recurringForm.type}
                  onChange={(event) => {
                    const type = event.target.value
                    const category = categories.find((item) => item.type === type)?.name
                    setRecurringForm((current) => ({ ...current, type, category: category || current.category }))
                  }}
                  className={controlClass}
                >
                  <option value="expense">{t('type.expense')}</option>
                  <option value="income">{t('type.income')}</option>
                </select>
              </Field>
              <Field label={t('settings.category')} explain={t('form.categoryHint')}>
                <select value={recurringForm.category} onChange={(event) => setRecurringForm((current) => ({ ...current, category: event.target.value }))} className={controlClass}>
                  {categories
                    .filter((item) => item.type === recurringForm.type)
                    .map((item) => (
                      <option key={item.id} value={item.name}>
                        {categoryLabel(t, item.name)}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.amount')} explain={t('settings.amountHint')} placeholder={t('settings.amountPh')}>
                <input type="number" min="0.01" step="0.01" value={recurringForm.amount} onChange={(event) => setRecurringForm((current) => ({ ...current, amount: event.target.value }))} className={controlClass} />
              </Field>
              <Field label={t('settings.frequency')} explain={t('settings.frequencyHint')}>
                <select value={recurringForm.frequency} onChange={(event) => setRecurringForm((current) => ({ ...current, frequency: event.target.value }))} className={controlClass}>
                  {RECURRING_FREQUENCIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(`freq.${item.value}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.nextDate')} explain={t('settings.nextDateHint')}>
                <input type="date" value={recurringForm.nextDate} onChange={(event) => setRecurringForm((current) => ({ ...current, nextDate: event.target.value }))} className={controlClass} />
              </Field>
              <Field label={t('settings.payment')} explain={t('settings.paymentHint')}>
                <select value={recurringForm.paymentMethod} onChange={(event) => setRecurringForm((current) => ({ ...current, paymentMethod: event.target.value }))} className={controlClass}>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {paymentLabel(t, method)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {recurringError ? <p className="text-[15px] text-[#c45b45]">{recurringError}</p> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRecurringOpen(false)} className="min-h-11 rounded-[8px] border border-[#dfe6df] px-[14px] py-[10px] text-[15px]">
                {t('common.cancel')}
              </button>
              <button type="submit" className="min-h-11 rounded-[8px] bg-[#e96d52] px-[16px] py-[10px] text-[15px] font-semibold text-white">
                {t('settings.saveRecurring')}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {pendingBackup ? (
        <ConfirmDialog
          title={t('settings.restoreTitle')}
          message={t('settings.restoreBody')}
          confirmLabel={t('settings.restoreConfirm')}
          onClose={() => setPendingBackup(null)}
          onConfirm={() => {
            importJson(pendingBackup)
            setPendingBackup(null)
          }}
        />
      ) : null}

      {resetOpen ? (
        <ConfirmDialog
          title={t('settings.resetTitle')}
          message={t('settings.resetBody')}
          confirmLabel={t('settings.resetConfirm')}
          onClose={() => setResetOpen(false)}
          onConfirm={() => {
            resetAll()
            setResetOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
