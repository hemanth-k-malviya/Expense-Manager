import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { categoryTotals, spentByCategory, sumByType, transactionsToCsv } from '../lib/calculations'
import { createId, isInMonth, shiftMonth, todayISO } from '../lib/dates'
import { downloadFile, initialsFromName } from '../lib/format'
import { materializeRecurring } from '../lib/recurring'
import { defaultCompany, businessFieldsFrom } from '../lib/business'
import { getEmptyState } from '../lib/seed'
import { clearState, loadState, mergeWithDefaults, parseImportedState, saveState } from '../lib/storage'
import { defaultSubscription } from '../lib/subscription'
import { collectReminders } from '../lib/books'
import { buildBackupFile } from '../lib/backup'
import { isPersonalEntry } from '../lib/ledger'
import { applyDocumentLanguage, DEFAULT_LANGUAGE, detectLanguage, languageMeta, translate } from '../i18n'
import { useAuth } from './AuthContext'

const ExpenseContext = createContext(null)

function initializeStore(uid, email) {
  const loaded = loadState(uid, email)
  const base = loaded ?? getEmptyState({ language: detectLanguage() })
  const { newTransactions, updatedRecurring } = materializeRecurring(base.recurring, todayISO())

  return {
    ...base,
    transactions: [...newTransactions, ...base.transactions],
    recurring: updatedRecurring,
  }
}

export function ExpenseProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid
  const email = user?.email || ''
  const now = new Date()
  const initial = useMemo(() => initializeStore(uid, email), [uid, email])
  const hydrated = useRef(false)

  const [profile, setProfile] = useState(initial.profile)
  const [subscription, setSubscription] = useState(initial.subscription ?? defaultSubscription())
  const [categories, setCategories] = useState(initial.categories)
  const [transactions, setTransactions] = useState(initial.transactions)
  const [budgets, setBudgets] = useState(initial.budgets)
  const [goals, setGoals] = useState(initial.goals)
  const [recurring, setRecurring] = useState(initial.recurring)
  const [company, setCompany] = useState(initial.company ?? defaultCompany())
  const [departments, setDepartments] = useState(initial.departments ?? [])
  const [employees, setEmployees] = useState(initial.employees ?? [])
  const [clients, setClients] = useState(initial.clients ?? [])
  const [projects, setProjects] = useState(initial.projects ?? [])
  const [vendors, setVendors] = useState(initial.vendors ?? [])
  const [shops, setShops] = useState(initial.shops ?? [])
  const [invoices, setInvoices] = useState(initial.invoices ?? [])
  const [inventory, setInventory] = useState(initial.inventory ?? [])
  const [bills, setBills] = useState(initial.bills ?? [])
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [toasts, setToasts] = useState([])
  const [upgradeRequest, setUpgradeRequest] = useState(null)

  const language = profile.language || DEFAULT_LANGUAGE
  const languageRef = useRef(language)
  languageRef.current = language
  const dir = languageMeta(language).dir
  const locale = languageMeta(language).locale
  const t = useCallback((key, vars) => translate(language, key, vars), [language])
  const tr = useCallback((key, vars) => translate(languageRef.current, key, vars), [])

  useEffect(() => {
    applyDocumentLanguage(language)
  }, [language])

  const persistPayload = useMemo(
    () => ({
      profile,
      subscription,
      company,
      departments,
      employees,
      clients,
      projects,
      vendors,
      shops,
      invoices,
      inventory,
      bills,
      categories,
      transactions,
      budgets,
      goals,
      recurring,
    }),
    [profile, subscription, company, departments, employees, clients, projects, vendors, shops, invoices, inventory, bills, categories, transactions, budgets, goals, recurring],
  )

  useEffect(() => {
    if (!uid) return
    if (!hydrated.current) {
      hydrated.current = true
      saveState(persistPayload, uid, email)
      return
    }
    saveState(persistPayload, uid, email)
  }, [persistPayload, uid, email])

  useEffect(() => {
    if (!user) return
    const nextName = user.displayName?.trim() || user.email?.split('@')[0] || ''
    if (!nextName) return
    setProfile((current) => (current.name ? current : { ...current, name: nextName }))
  }, [user])

  const addToast = useCallback((message, tone = 'info') => {
    const id = createId()
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const monthTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => isInMonth(transaction.date, selectedYear, selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt))),
    [transactions, selectedYear, selectedMonth],
  )

  const previousPeriod = shiftMonth(selectedYear, selectedMonth, -1)
  const previousTransactions = useMemo(
    () => transactions.filter((transaction) => isInMonth(transaction.date, previousPeriod.year, previousPeriod.month)),
    [transactions, previousPeriod.year, previousPeriod.month],
  )

  const personalTransactions = useMemo(() => transactions.filter(isPersonalEntry), [transactions])
  const personalMonthTransactions = useMemo(
    () => monthTransactions.filter(isPersonalEntry),
    [monthTransactions],
  )
  const personalPreviousTransactions = useMemo(
    () => previousTransactions.filter(isPersonalEntry),
    [previousTransactions],
  )

  const incomeTotal = sumByType(personalMonthTransactions, 'income')
  const spendingTotal = sumByType(personalMonthTransactions, 'expense')
  const previousIncome = sumByType(personalPreviousTransactions, 'income')
  const previousSpending = sumByType(personalPreviousTransactions, 'expense')
  const previousBalance = previousIncome - previousSpending
  const totalBalance = incomeTotal - spendingTotal

  const expenseBreakdown = useMemo(
    () => categoryTotals(personalMonthTransactions, 'expense'),
    [personalMonthTransactions],
  )

  const budgetStatus = useMemo(
    () =>
      budgets.map((budget) => {
        const spent = spentByCategory(personalMonthTransactions, budget.category)
        const remaining = budget.amount - spent
        const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        return { ...budget, spent, remaining, percent }
      }),
    [budgets, personalMonthTransactions],
  )

  const alerts = useMemo(() => {
    const items = []
    const today = todayISO()

    collectReminders({ invoices, bills, inventory, recurring, today, withinDays: 7 }).forEach((item) => {
      const key =
        item.kind === 'invoice'
          ? 'alert.invoice'
          : item.kind === 'bill'
            ? 'alert.bill'
            : item.kind === 'stock'
              ? 'alert.stock'
              : 'alert.recurring'
      items.push({
        id: item.id,
        tone: item.tone,
        message: t(key, { name: item.party, date: item.date, qty: item.amount }),
      })
    })

    budgetStatus.forEach((budget) => {
      if (budget.percent >= 100) {
        items.push({
          id: `budget-over-${budget.id}`,
          tone: 'danger',
          message: t('alert.budgetOver', { category: budget.category }),
        })
      } else if (budget.percent >= 85) {
        items.push({
          id: `budget-warn-${budget.id}`,
          tone: 'warn',
          message: t('alert.budgetWarn', { category: budget.category, percent: Math.round(budget.percent) }),
        })
      }
    })

    goals.forEach((goal) => {
      if (goal.currentAmount >= goal.targetAmount) return
      const remainingDays = Math.ceil((new Date(`${goal.deadline}T00:00:00`) - new Date()) / 86400000)
      if (remainingDays <= 30 && remainingDays >= 0) {
        items.push({
          id: `goal-${goal.id}`,
          tone: 'info',
          message: t('alert.goalDue', { name: goal.name, days: remainingDays }),
        })
      }
    })

    const pending = transactions.filter((transaction) => transaction.status === 'submitted').length
    if (pending > 0) {
      items.push({
        id: 'approvals-pending',
        tone: 'warn',
        message: t('alert.approvals', { count: pending }),
      })
    }

    return items
  }, [bills, budgetStatus, goals, inventory, invoices, recurring, t, transactions])

  const isPro = true
  const isBusiness = true
  const isFeatureEnabled = useCallback(() => true, [])

  const requestUpgrade = useCallback(() => {}, [])
  const closeUpgrade = useCallback(() => {}, [])

  const subscribe = useCallback(() => {}, [])
  const cancelSubscription = useCallback(() => {}, [])
  const resumeSubscription = useCallback(() => {}, [])

  const requirePremium = useCallback(() => true, [])
  const requireBusiness = useCallback(() => true, [])

  const updateProfile = useCallback((patch) => {
    setProfile((current) => ({ ...current, ...patch }))
  }, [])

  const setLanguage = useCallback(
    (code) => {
      setProfile((current) => ({ ...current, language: code }))
      addToast(translate(code, 'toast.language'), 'success')
    },
    [addToast],
  )

  const addTransaction = useCallback((payload) => {
    const next = {
      id: createId(),
      name: payload.name.trim(),
      amount: Number(payload.amount),
      type: payload.type,
      category: payload.category,
      date: payload.date,
      note: payload.note?.trim() || '',
      paymentMethod: payload.paymentMethod || 'Card',
      createdAt: new Date().toISOString(),
      ...businessFieldsFrom(payload),
    }
    setTransactions((current) => [next, ...current])
    addToast(payload.type === 'income' ? tr('toast.incomeAdded') : tr('toast.expenseAdded'), 'success')
    return next
  }, [addToast])

  const updateTransaction = useCallback((id, payload) => {
    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              name: payload.name.trim(),
              amount: Number(payload.amount),
              type: payload.type,
              category: payload.category,
              date: payload.date,
              note: payload.note?.trim() || '',
              paymentMethod: payload.paymentMethod || transaction.paymentMethod,
              ...businessFieldsFrom(payload, transaction),
            }
          : transaction,
      ),
    )
    addToast(tr('toast.txUpdated'), 'success')
  }, [addToast])

  const setTransactionStatus = useCallback((id, status) => {
    if (!requireBusiness('approvals')) return
    setTransactions((current) => current.map((transaction) => (transaction.id === id ? { ...transaction, status } : transaction)))
    addToast(tr('toast.claim', { status: tr(`status.${status}`) }), 'success')
  }, [addToast, requireBusiness])

  const deleteTransaction = useCallback((id) => {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id))
    addToast(tr('toast.txDeleted'), 'success')
  }, [addToast])

  const upsertBudget = useCallback((payload) => {
    setBudgets((current) => {
      const existing = current.find((budget) => budget.category === payload.category)
      if (existing) {
        return current.map((budget) =>
          budget.category === payload.category ? { ...budget, amount: Number(payload.amount) } : budget,
        )
      }
      return [...current, { id: createId(), category: payload.category, amount: Number(payload.amount) }]
    })
    addToast(tr('toast.budgetSaved'), 'success')
    return true
  }, [addToast])

  const deleteBudget = useCallback((id) => {
    setBudgets((current) => current.filter((budget) => budget.id !== id))
    addToast(tr('toast.budgetRemoved'), 'success')
  }, [addToast])

  const addGoal = useCallback((payload) => {
    if (!requirePremium('goals')) return
    const next = {
      id: createId(),
      name: payload.name.trim(),
      targetAmount: Number(payload.targetAmount),
      currentAmount: Number(payload.currentAmount) || 0,
      deadline: payload.deadline,
      note: payload.note?.trim() || '',
    }
    setGoals((current) => [next, ...current])
    addToast(tr('toast.goalCreated'), 'success')
  }, [addToast, requirePremium])

  const updateGoal = useCallback((id, payload) => {
    if (!requirePremium('goals')) return
    setGoals((current) =>
      current.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              name: payload.name.trim(),
              targetAmount: Number(payload.targetAmount),
              currentAmount: Number(payload.currentAmount),
              deadline: payload.deadline,
              note: payload.note?.trim() || '',
            }
          : goal,
      ),
    )
    addToast(tr('toast.goalUpdated'), 'success')
  }, [addToast, requirePremium])

  const contributeToGoal = useCallback((id, amount) => {
    if (!requirePremium('goals')) return
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return
    setGoals((current) =>
      current.map((goal) =>
        goal.id === id ? { ...goal, currentAmount: Number(goal.currentAmount) + value } : goal,
      ),
    )
    addToast(tr('toast.contribution'), 'success')
  }, [addToast, requirePremium])

  const deleteGoal = useCallback((id) => {
    setGoals((current) => current.filter((goal) => goal.id !== id))
    addToast(tr('toast.goalRemoved'), 'success')
  }, [addToast])

  const addCategory = useCallback((payload) => {
    if (!requirePremium('customCategories')) return false
    const name = payload.name.trim()
    const exists = categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase() && category.type === payload.type,
    )
    if (exists) {
      addToast(tr('toast.categoryExists'), 'warn')
      return false
    }
    setCategories((current) => [...current, { id: createId(), name, type: payload.type }])
    addToast(tr('toast.categoryAdded'), 'success')
    return true
  }, [addToast, categories, requirePremium])

  const deleteCategory = useCallback((id) => {
    const target = categories.find((category) => category.id === id)
    if (!target) return
    const inUse =
      transactions.some((transaction) => transaction.category === target.name) ||
      budgets.some((budget) => budget.category === target.name) ||
      recurring.some((item) => item.category === target.name)
    if (inUse) {
      addToast(tr('toast.categoryInUse'), 'warn')
      return
    }
    setCategories((current) => current.filter((category) => category.id !== id))
    addToast(tr('toast.categoryDeleted'), 'success')
  }, [addToast, budgets, categories, recurring, transactions])

  const addRecurring = useCallback((payload) => {
    if (!requirePremium('recurring')) return
    const next = {
      id: createId(),
      name: payload.name.trim(),
      amount: Number(payload.amount),
      type: payload.type,
      category: payload.category,
      frequency: payload.frequency,
      nextDate: payload.nextDate,
      paymentMethod: payload.paymentMethod || 'Bank',
      note: payload.note?.trim() || '',
    }
    setRecurring((current) => [next, ...current])
    addToast(tr('toast.recurringSaved'), 'success')
  }, [addToast, requirePremium])

  const deleteRecurring = useCallback((id) => {
    setRecurring((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.recurringRemoved'), 'success')
  }, [addToast])

  const updateCompany = useCallback((patch) => {
    if (!requireBusiness('company')) return
    setCompany((current) => ({ ...current, ...patch }))
    addToast(tr('toast.companySaved'), 'success')
  }, [addToast, requireBusiness])

  const addDepartment = useCallback((payload) => {
    if (!requireBusiness('team')) return
    const next = { id: createId(), name: payload.name.trim(), code: payload.code?.trim().toUpperCase() || '' }
    setDepartments((current) => [...current, next])
    addToast(tr('toast.deptAdded'), 'success')
    return next
  }, [addToast, requireBusiness])

  const deleteDepartment = useCallback((id) => {
    setDepartments((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.deptRemoved'), 'success')
  }, [addToast])

  const addEmployee = useCallback((payload) => {
    if (!requireBusiness('team')) return
    const next = {
      id: createId(),
      name: payload.name.trim(),
      email: payload.email?.trim() || '',
      role: payload.role || 'employee',
      departmentId: payload.departmentId || '',
    }
    setEmployees((current) => [...current, next])
    addToast(tr('toast.memberAdded'), 'success')
    return next
  }, [addToast, requireBusiness])

  const deleteEmployee = useCallback((id) => {
    setEmployees((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.memberRemoved'), 'success')
  }, [addToast])

  const addClient = useCallback((payload) => {
    if (!requireBusiness('clients')) return
    const next = { id: createId(), name: payload.name.trim(), contact: payload.contact?.trim() || '', email: payload.email?.trim() || '' }
    setClients((current) => [...current, next])
    addToast(tr('toast.clientAdded'), 'success')
    return next
  }, [addToast, requireBusiness])

  const deleteClient = useCallback((id) => {
    setClients((current) => current.filter((item) => item.id !== id))
    setProjects((current) => current.filter((item) => item.clientId !== id))
    addToast(tr('toast.clientRemoved'), 'success')
  }, [addToast])

  const addProject = useCallback((payload) => {
    if (!requireBusiness('clients')) return
    const next = { id: createId(), name: payload.name.trim(), clientId: payload.clientId || '', status: payload.status || 'active' }
    setProjects((current) => [...current, next])
    addToast(tr('toast.projectAdded'), 'success')
    return next
  }, [addToast, requireBusiness])

  const deleteProject = useCallback((id) => {
    setProjects((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.projectRemoved'), 'success')
  }, [addToast])

  const addVendor = useCallback((payload) => {
    if (!requireBusiness('vendors')) return
    const next = { id: createId(), name: payload.name.trim(), category: payload.category?.trim() || 'General' }
    setVendors((current) => [...current, next])
    addToast(tr('toast.vendorAdded'), 'success')
    return next
  }, [addToast, requireBusiness])

  const deleteVendor = useCallback((id) => {
    setVendors((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.vendorRemoved'), 'success')
  }, [addToast])

  const addShop = useCallback((payload) => {
    if (!requireBusiness('shops')) return
    const next = {
      id: createId(),
      name: payload.name.trim(),
      city: payload.city?.trim() || '',
      type: payload.type || 'retail',
    }
    setShops((current) => [...current, next])
    addToast(tr('toast.shopAdded'), 'success')
    return next
  }, [addToast, requireBusiness])

  const deleteShop = useCallback((id) => {
    setShops((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.shopRemoved'), 'success')
  }, [addToast])

  const addInvoice = useCallback((payload) => {
    const amount = Number(payload.amount) || 0
    if (!payload.party?.trim() || amount <= 0) return
    const next = {
      id: createId(),
      number: payload.number?.trim() || `INV-${Date.now().toString().slice(-4)}`,
      party: payload.party.trim(),
      clientId: payload.clientId || '',
      date: payload.date || todayISO(),
      dueDate: payload.dueDate || payload.date || todayISO(),
      amount,
      taxAmount: Number(payload.taxAmount) || 0,
      status: payload.status || 'sent',
      notes: payload.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    }
    setInvoices((current) => {
      if (!payload.number?.trim()) {
        next.number = `INV-${String(current.length + 1).padStart(4, '0')}`
      }
      return [next, ...current]
    })
    addToast(tr('toast.invoiceAdded'), 'success')
    return next
  }, [addToast])

  const updateInvoice = useCallback((id, payload) => {
    setInvoices((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...payload,
              party: payload.party?.trim() ?? item.party,
              amount: payload.amount === undefined ? item.amount : Number(payload.amount) || 0,
              taxAmount: payload.taxAmount === undefined ? item.taxAmount : Number(payload.taxAmount) || 0,
              notes: payload.notes === undefined ? item.notes : payload.notes.trim(),
            }
          : item,
      ),
    )
  }, [])

  const deleteInvoice = useCallback((id) => {
    setInvoices((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.invoiceRemoved'), 'success')
  }, [addToast])

  const addBill = useCallback((payload) => {
    const amount = Number(payload.amount) || 0
    if (!payload.party?.trim() || amount <= 0) return
    const next = {
      id: createId(),
      party: payload.party.trim(),
      vendorId: payload.vendorId || '',
      date: payload.date || todayISO(),
      dueDate: payload.dueDate || payload.date || todayISO(),
      amount,
      status: payload.status || 'unpaid',
      notes: payload.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    }
    setBills((current) => [next, ...current])
    addToast(tr('toast.billAdded'), 'success')
    return next
  }, [addToast])

  const updateBill = useCallback((id, payload) => {
    setBills((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...payload,
              party: payload.party?.trim() ?? item.party,
              amount: payload.amount === undefined ? item.amount : Number(payload.amount) || 0,
              notes: payload.notes === undefined ? item.notes : payload.notes.trim(),
            }
          : item,
      ),
    )
  }, [])

  const deleteBill = useCallback((id) => {
    setBills((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.billRemoved'), 'success')
  }, [addToast])

  const addInventoryItem = useCallback((payload) => {
    if (!payload.name?.trim()) return
    setInventory((current) => [
      ...current,
      {
        id: createId(),
        name: payload.name.trim(),
        sku: payload.sku?.trim() || '',
        qty: Number(payload.qty) || 0,
        unitCost: Number(payload.buyPrice ?? payload.unitCost) || 0,
        sellPrice: Number(payload.sellPrice) || 0,
        reorderAt: Number(payload.reorderAt) || 0,
        shopId: payload.shopId || '',
      },
    ])
    addToast(tr('toast.stockAdded'), 'success')
  }, [addToast])

  const updateInventoryItem = useCallback((id, payload) => {
    setInventory((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...payload,
              name: payload.name?.trim() ?? item.name,
              sku: payload.sku === undefined ? item.sku : payload.sku.trim(),
              qty: payload.qty === undefined ? item.qty : Number(payload.qty) || 0,
              unitCost: payload.buyPrice === undefined && payload.unitCost === undefined
                ? item.unitCost
                : Number(payload.buyPrice ?? payload.unitCost) || 0,
              sellPrice: payload.sellPrice === undefined ? item.sellPrice || 0 : Number(payload.sellPrice) || 0,
              reorderAt: payload.reorderAt === undefined ? item.reorderAt : Number(payload.reorderAt) || 0,
            }
          : item,
      ),
    )
  }, [])

  const adjustInventory = useCallback((id, delta) => {
    setInventory((current) =>
      current.map((item) => (item.id === id ? { ...item, qty: Math.max(0, (Number(item.qty) || 0) + delta) } : item)),
    )
  }, [])

  const deleteInventoryItem = useCallback((id) => {
    setInventory((current) => current.filter((item) => item.id !== id))
    addToast(tr('toast.stockRemoved'), 'success')
  }, [addToast])

  const goToToday = useCallback(() => {
    const date = new Date()
    setSelectedYear(date.getFullYear())
    setSelectedMonth(date.getMonth())
  }, [])

  const stepMonth = useCallback((delta) => {
    setSelectedYear((year) => {
      const next = shiftMonth(year, selectedMonth, delta)
      setSelectedMonth(next.month)
      return next.year
    })
  }, [selectedMonth])

  const exportCsv = useCallback(() => {
    if (!requirePremium('export')) return
    downloadFile(`expense-so-transactions-${todayISO()}.csv`, transactionsToCsv(transactions), 'text/csv')
    addToast(tr('toast.csv'), 'success')
  }, [addToast, requirePremium, transactions])

  const exportJson = useCallback(() => {
    downloadFile(`expense-so-backup-${todayISO()}.json`, buildBackupFile(persistPayload), 'application/json')
    addToast(tr('toast.backup'), 'success')
  }, [addToast, persistPayload])

  const importJson = useCallback((raw) => {
    const next = parseImportedState(raw)
    const materialized = materializeRecurring(next.recurring, todayISO())
    setProfile(next.profile)
    setCategories(next.categories)
    setTransactions([...materialized.newTransactions, ...next.transactions])
    setBudgets(next.budgets)
    setGoals(next.goals)
    setRecurring(materialized.updatedRecurring)
    setSubscription(next.subscription ?? defaultSubscription())
    setCompany(next.company ?? defaultCompany())
    setDepartments(next.departments ?? [])
    setEmployees(next.employees ?? [])
    setClients(next.clients ?? [])
    setProjects(next.projects ?? [])
    setVendors(next.vendors ?? [])
    setShops(next.shops ?? [])
    setInvoices(next.invoices ?? [])
    setInventory(next.inventory ?? [])
    setBills(next.bills ?? [])
    addToast(tr('toast.restored'), 'success')
  }, [addToast])

  const resetAll = useCallback(() => {
    clearState(uid, email)
    const empty = getEmptyState({
      name: profile.name,
      workspace: profile.workspace,
      currency: profile.currency,
      language: profile.language,
      geminiApiKey: profile.geminiApiKey || '',
    })
    setProfile(empty.profile)
    setCategories(empty.categories)
    setTransactions(empty.transactions)
    setBudgets(empty.budgets)
    setGoals(empty.goals)
    setRecurring(empty.recurring)
    setSubscription(empty.subscription)
    setCompany(empty.company)
    setDepartments(empty.departments)
    setEmployees(empty.employees)
    setClients(empty.clients)
    setProjects(empty.projects)
    setVendors(empty.vendors)
    setShops(empty.shops)
    setInvoices(empty.invoices)
    setInventory(empty.inventory)
    setBills(empty.bills)
    goToToday()
    addToast(tr('toast.reset'), 'success')
  }, [addToast, email, goToToday, profile.currency, profile.geminiApiKey, profile.language, profile.name, profile.workspace, uid])

  const value = useMemo(
    () => ({
      profile,
      language,
      dir,
      locale,
      t,
      setLanguage,
      initials: initialsFromName(profile.name),
      subscription,
      isPro,
      isBusiness,
      isFeatureEnabled,
      upgradeRequest,
      company,
      departments,
      employees,
      clients,
      projects,
      vendors,
      shops,
      invoices,
      inventory,
      bills,
      categories,
      transactions,
      budgets,
      goals,
      recurring,
      selectedYear,
      selectedMonth,
      monthTransactions,
      personalTransactions,
      personalMonthTransactions,
      incomeTotal,
      spendingTotal,
      totalBalance,
      previousIncome,
      previousSpending,
      previousBalance,
      expenseBreakdown,
      budgetStatus,
      alerts,
      toasts,
      updateProfile,
      requestUpgrade,
      closeUpgrade,
      subscribe,
      cancelSubscription,
      resumeSubscription,
      requirePremium,
      requireBusiness,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setTransactionStatus,
      upsertBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      contributeToGoal,
      deleteGoal,
      addCategory,
      deleteCategory,
      addRecurring,
      deleteRecurring,
      updateCompany,
      addDepartment,
      deleteDepartment,
      addEmployee,
      deleteEmployee,
      addClient,
      deleteClient,
      addProject,
      deleteProject,
      addVendor,
      deleteVendor,
      addShop,
      deleteShop,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addBill,
      updateBill,
      deleteBill,
      addInventoryItem,
      updateInventoryItem,
      adjustInventory,
      deleteInventoryItem,
      goToToday,
      stepMonth,
      exportCsv,
      exportJson,
      importJson,
      resetAll,
      dismissToast,
      addToast,
    }),
    [
      profile,
      language,
      dir,
      locale,
      t,
      setLanguage,
      subscription,
      isPro,
      isBusiness,
      isFeatureEnabled,
      upgradeRequest,
      company,
      departments,
      employees,
      clients,
      projects,
      vendors,
      shops,
      invoices,
      inventory,
      bills,
      categories,
      transactions,
      budgets,
      goals,
      recurring,
      selectedYear,
      selectedMonth,
      monthTransactions,
      personalTransactions,
      personalMonthTransactions,
      incomeTotal,
      spendingTotal,
      totalBalance,
      previousIncome,
      previousSpending,
      previousBalance,
      expenseBreakdown,
      budgetStatus,
      alerts,
      toasts,
      updateProfile,
      requestUpgrade,
      closeUpgrade,
      subscribe,
      cancelSubscription,
      resumeSubscription,
      requirePremium,
      requireBusiness,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setTransactionStatus,
      upsertBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      contributeToGoal,
      deleteGoal,
      addCategory,
      deleteCategory,
      addRecurring,
      deleteRecurring,
      updateCompany,
      addDepartment,
      deleteDepartment,
      addEmployee,
      deleteEmployee,
      addClient,
      deleteClient,
      addProject,
      deleteProject,
      addVendor,
      deleteVendor,
      addShop,
      deleteShop,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addBill,
      updateBill,
      deleteBill,
      addInventoryItem,
      updateInventoryItem,
      adjustInventory,
      deleteInventoryItem,
      goToToday,
      stepMonth,
      exportCsv,
      exportJson,
      importJson,
      resetAll,
      dismissToast,
      addToast,
    ],
  )

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
}

export function useExpenses() {
  const context = useContext(ExpenseContext)
  if (!context) {
    throw new Error('useExpenses must be used within ExpenseProvider')
  }
  return context
}
