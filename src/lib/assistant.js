import { PAYMENT_METHODS } from './constants'
import { todayISO, toISODate, parseISODate } from './dates'

export const ASSISTANT_EVENT = 'expense-so-assistant'

export function openExpenseAssistant(prompt = '') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ASSISTANT_EVENT, { detail: { prompt } }))
}

const GREETING_RE =
  /^(?:hi+|h(?:el)+o+|hey+|heya|yo|sup|hola|namaste|namaskar|thanks|thank you|ok+|okay|help|नमस्ते|हेलो|हाय)[\s!.]*$/i

const QUESTION_RE =
  /\b(how much|how many|what('s| is|s)|whats|where|show|tell me|summarize|summary|over budget|this month|last month|kitna|kitne|kya|कुल)\b/i

const INCOME_RE =
  /\b(salary|income|earned|received|got paid|freelance|invoice|bonus|refund|sold|sales|paycheck|वेतन|सैलरी|आय|कमाई)\b/i

const EXPENSE_HINT_RE =
  /\b(spent|paid|bought|pay|expense|cost|bill|rent|grocer|lunch|dinner|coffee|uber|fuel|खर्च|दिया|खरीदा)\b/i

const DATE_WORDS = {
  today: 0,
  yesterday: -1,
  tomorrow: 1,
  आज: 0,
}

const PAYMENT_WORDS = [
  { needles: ['cash', 'नकद'], method: 'Cash' },
  { needles: ['bank', 'neft', 'imps', 'ach', 'बैंक'], method: 'Bank' },
  { needles: ['wallet', 'upi', 'gpay', 'paytm', 'phonepe', 'वॉलेट'], method: 'Wallet' },
  { needles: ['card', 'visa', 'mastercard', 'credit', 'debit', 'कार्ड'], method: 'Card' },
]

const CATEGORY_HINTS = [
  { needles: ['grocery', 'groceries', 'kirana', 'supermarket', 'vegetable', 'किराना'], category: 'Groceries', type: 'expense' },
  { needles: ['lunch', 'dinner', 'breakfast', 'coffee', 'cafe', 'restaurant', 'food', 'dining', 'swiggy', 'zomato', 'pizza', 'खाना'], category: 'Food & dining', type: 'expense' },
  { needles: ['uber', 'ola', 'taxi', 'fuel', 'petrol', 'diesel', 'metro', 'bus', 'parking', 'transport', 'यातायात'], category: 'Transport', type: 'expense' },
  { needles: ['netflix', 'spotify', 'subscription', 'prime', 'hotstar', 'सदस्यता'], category: 'Subscriptions', type: 'expense' },
  { needles: ['rent', 'electricity', 'wifi', 'internet', 'water bill', 'home', 'furniture', 'घर'], category: 'Home', type: 'expense' },
  { needles: ['doctor', 'pharmacy', 'medicine', 'hospital', 'gym', 'health', 'दवाई'], category: 'Health', type: 'expense' },
  { needles: ['movie', 'cinema', 'game', 'concert', 'entertainment', 'मनोरंजन'], category: 'Entertainment', type: 'expense' },
  { needles: ['amazon', 'shopping', 'clothes', 'shoes', 'mall', 'खरीदारी'], category: 'Shopping', type: 'expense' },
  { needles: ['utility', 'utilities', 'gas bill', 'phone bill'], category: 'Utilities', type: 'expense' },
  { needles: ['course', 'tuition', 'school', 'college', 'education', 'शिक्षा'], category: 'Education', type: 'expense' },
  { needles: ['flight', 'hotel', 'travel', 'trip', 'यात्रा'], category: 'Travel', type: 'expense' },
  { needles: ['salary', 'paycheck', 'payroll', 'वेतन', 'सैलरी'], category: 'Salary', type: 'income' },
  { needles: ['freelance', 'client payment', 'invoice', 'फ़्रीलांस'], category: 'Freelance', type: 'income' },
  { needles: ['dividend', 'interest', 'investment', 'निवेश'], category: 'Investments', type: 'income' },
  { needles: ['gift', 'उपहार'], category: 'Gifts', type: 'income' },
  { needles: ['inventory', 'stock', 'wholesale'], category: 'Inventory', type: 'expense' },
]

function shiftDays(iso, delta) {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + delta)
  return toISODate(date)
}

function parseAmount(text) {
  const compact = text.replace(/,/g, '')
  const match = compact.match(/(?:₹|rs\.?|inr|usd|\$|€|£)?\s*(\d+(?:\.\d+)?)\s*(k|thousand)?/i)
  if (!match) return null
  let amount = Number.parseFloat(match[1])
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (match[2]) amount *= 1000
  return { amount, raw: match[0] }
}

function parseDate(text, today) {
  const lower = text.toLowerCase()
  for (const [word, delta] of Object.entries(DATE_WORDS)) {
    if (lower.includes(word)) return shiftDays(today, delta)
  }
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (iso) return iso[1]
  return today
}

function parsePayment(text) {
  const lower = text.toLowerCase()
  const hit = PAYMENT_WORDS.find((item) => item.needles.some((needle) => lower.includes(needle)))
  return hit?.method || 'Card'
}

function guessCategory(text, categories, type) {
  const lower = text.toLowerCase()
  const hinted = CATEGORY_HINTS.find((item) => item.needles.some((needle) => lower.includes(needle)))
  if (hinted) {
    const match = categories.find((item) => item.name === hinted.category && item.type === hinted.type)
    if (match) return { category: match.name, type: match.type }
  }

  const named = categories.find((item) => lower.includes(item.name.toLowerCase()))
  if (named) return { category: named.name, type: named.type }

  const fallback = categories.find((item) => item.type === type) || categories[0]
  return { category: fallback?.name || 'Other', type: fallback?.type || type }
}

function cleanName(text, amountRaw) {
  let name = text
  if (amountRaw) name = name.replace(amountRaw, ' ')
  name = name
    .replace(/(?:₹|rs\.?|inr|usd|\$|€|£)/gi, ' ')
    .replace(/\b(today|yesterday|tomorrow|आज|कल|spent|paid|bought|pay|add|expense|income|received|earned|got|on|for|with|using|via|खर्च|दिया)\b/gi, ' ')
    .replace(/\b(cash|card|bank|wallet|upi|gpay|paytm|phonepe|नकद|कार्ड|बैंक)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return name
}

function matchShop(text, shops) {
  if (!shops?.length) return ''
  const lower = text.toLowerCase()
  const hit = shops.find((shop) => shop.name && lower.includes(shop.name.toLowerCase()))
  return hit?.id || ''
}

function matchNamed(list, text, extraKeys = []) {
  if (!list?.length || !text) return null
  const lower = String(text).toLowerCase().trim()
  if (!lower) return null
  const scored = list
    .map((item) => {
      const names = [item.name, item.party, ...extraKeys.map((key) => item[key])].filter(Boolean)
      const hit = names.find((name) => lower.includes(String(name).toLowerCase()) || String(name).toLowerCase().includes(lower))
      return hit ? { item, score: String(hit).length } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
  return scored[0]?.item || null
}

function extractNamed(text, kind) {
  const patterns = {
    client: /(?:add|create|new|make)\s+(?:a\s+)?client(?:\s+(?:called|named))?\s+(.+)/i,
    vendor: /(?:add|create|new|make)\s+(?:a\s+)?vendor(?:\s+(?:called|named))?\s+(.+)/i,
    shop: /(?:add|create|new|make)\s+(?:a\s+)?shop(?:\s+(?:called|named))?\s+(.+)/i,
    employee: /(?:add|create|new|make)\s+(?:an?\s+)?(?:employee|member|staff)(?:\s+(?:called|named))?\s+(.+)/i,
    department: /(?:add|create|new|make)\s+(?:a\s+)?(?:department|dept)(?:\s+(?:called|named))?\s+(.+)/i,
    project: /(?:add|create|new|make)\s+(?:a\s+)?project(?:\s+(?:called|named))?\s+(.+)/i,
    goal: /(?:add|create|new|make)\s+(?:a\s+)?goal(?:\s+(?:called|named|for))?\s+(.+)/i,
    budget: /(?:set|add|create|new)\s+(?:a\s+)?budget(?:\s+for)?\s+(.+)/i,
    bill: /(?:add|create|new|make)\s+(?:a\s+)?bill(?:\s+(?:to|for|of))?\s+(.+)/i,
    invoice: /(?:add|create|new|make|send)\s+(?:an?\s+)?invoice(?:\s+(?:to|for))?\s+(.+)/i,
  }
  const match = text.match(patterns[kind])
  return match?.[1]?.trim() || ''
}

function parseShopBits(rest) {
  const cityMatch = rest.match(/\bin\s+([a-z][a-z\s]+)$/i)
  let name = rest
  let city = ''
  if (cityMatch) {
    city = cityMatch[1].trim()
    name = rest.slice(0, cityMatch.index).trim()
  }
  const types = ['grocery', 'retail', 'cafe', 'pharmacy', 'electronics']
  const type = types.find((item) => name.toLowerCase().includes(item)) || 'retail'
  name = name.replace(/\b(grocery|retail|cafe|pharmacy|electronics|shop)\b/gi, ' ').replace(/\s+/g, ' ').trim() || rest
  return { name, city, type }
}

function parseRole(text) {
  if (/\badmin\b/i.test(text)) return 'admin'
  if (/\bmanager\b/i.test(text)) return 'manager'
  return 'employee'
}

export function parseWorkspaceCommand(text, snapshot = {}) {
  const trimmed = String(text || '').trim()
  if (!trimmed || QUESTION_RE.test(trimmed) || /[?？]$/.test(trimmed)) return null

  const clientRest = extractNamed(trimmed, 'client')
  if (clientRest) {
    const name = cleanName(clientRest)
    if (name) return { intent: 'do', action: 'client', payload: { name } }
  }

  const vendorRest = extractNamed(trimmed, 'vendor')
  if (vendorRest) {
    const name = cleanName(vendorRest)
    if (name) return { intent: 'do', action: 'vendor', payload: { name } }
  }

  const shopRest = extractNamed(trimmed, 'shop')
  if (shopRest) {
    const bits = parseShopBits(cleanName(shopRest) || shopRest)
    if (bits.name) return { intent: 'do', action: 'shop', payload: bits }
  }

  const employeeRest = extractNamed(trimmed, 'employee')
  if (employeeRest) {
    const name = cleanName(employeeRest.replace(/\bas\s+\w+\b/i, ' '))
    if (name) {
      return {
        intent: 'do',
        action: 'employee',
        payload: { name, role: parseRole(trimmed), departmentId: matchNamed(snapshot.departments, trimmed)?.id || '' },
      }
    }
  }

  const deptRest = extractNamed(trimmed, 'department')
  if (deptRest) {
    const name = cleanName(deptRest)
    if (name) return { intent: 'do', action: 'department', payload: { name } }
  }

  const projectRest = extractNamed(trimmed, 'project')
  if (projectRest) {
    const forClient = projectRest.split(/\s+for\s+/i)
    const name = cleanName(forClient[0])
    if (name) {
      const client = matchNamed(snapshot.clients, forClient[1] || trimmed)
      return { intent: 'do', action: 'project', payload: { name, clientId: client?.id || '', clientName: client?.name || '' } }
    }
  }

  const billRest = extractNamed(trimmed, 'bill')
  if (billRest) {
    const amountInfo = parseAmount(billRest) || parseAmount(trimmed)
    const vendor = matchNamed(snapshot.vendors, billRest) || matchNamed(snapshot.vendors, trimmed)
    const party = vendor?.name || cleanName(billRest, amountInfo?.raw)
    if (amountInfo && party) {
      return { intent: 'do', action: 'bill', payload: { party, amount: amountInfo.amount, vendorId: vendor?.id || '' } }
    }
  }

  const invoiceRest = extractNamed(trimmed, 'invoice')
  if (invoiceRest) {
    const amountInfo = parseAmount(invoiceRest) || parseAmount(trimmed)
    const client = matchNamed(snapshot.clients, invoiceRest) || matchNamed(snapshot.clients, trimmed)
    const party = client?.name || cleanName(invoiceRest, amountInfo?.raw)
    if (amountInfo && party) {
      return { intent: 'do', action: 'invoice', payload: { party, amount: amountInfo.amount, clientId: client?.id || '' } }
    }
  }

  const budgetRest = extractNamed(trimmed, 'budget')
  if (budgetRest) {
    const amountInfo = parseAmount(budgetRest) || parseAmount(trimmed)
    const guessed = guessCategory(budgetRest, snapshot.categories || [], 'expense')
    if (amountInfo) return { intent: 'do', action: 'budget', payload: { category: guessed.category, amount: amountInfo.amount } }
  }

  const goalRest = extractNamed(trimmed, 'goal')
  if (goalRest) {
    const amountInfo = parseAmount(goalRest) || parseAmount(trimmed)
    const name = cleanName(goalRest, amountInfo?.raw)
    if (amountInfo && name) return { intent: 'do', action: 'goal', payload: { name, targetAmount: amountInfo.amount, deadline: parseDate(trimmed, snapshot.today) } }
  }

  if (/^(approve|reject|reimburse|mark reimbursed)\b/i.test(trimmed)) {
    const action = /^\s*reject/i.test(trimmed) ? 'reject' : /^\s*(reimburse|mark reimbursed)/i.test(trimmed) ? 'reimburse' : 'approve'
    const rest = trimmed.replace(/^(approve|reject|reimburse|mark reimbursed)\b/i, '').trim()
    const claims = (snapshot.transactions || snapshot.monthTransactions || []).filter(
      (item) => item.reimbursable || (item.status && item.status !== 'recorded'),
    )
    const wanted =
      action === 'reimburse' ? 'approved' : action === 'approve' || action === 'reject' ? 'submitted' : null
    const named = matchNamed(claims, rest)
    const claim = named || claims.find((item) => !wanted || item.status === wanted) || claims[0]
    if (claim) return { intent: 'do', action, payload: { id: claim.id, name: claim.name } }
    return { intent: 'do', action, payload: {} }
  }

  return null
}

export function parseQuickAdd(text, { categories = [], shops = [], clients = [], employees = [], vendors = [], today = todayISO() } = {}) {
  const amountInfo = parseAmount(text)
  if (!amountInfo) return null

  const income = INCOME_RE.test(text)
  const expenseHint = EXPENSE_HINT_RE.test(text)
  const guessed = guessCategory(text, categories, income && !expenseHint ? 'income' : 'expense')
  const name = cleanName(text, amountInfo.raw) || guessed.category
  const client = matchNamed(clients, text)
  const employee = matchNamed(employees, text)
  const vendor = matchNamed(vendors, text)
  const billable = /\bbillable\b|\bbill to (?:client|customer)\b/i.test(text) || Boolean(client && /\bfor\b|\bto\b/.test(text) && /\bclient|invoice|billable\b/i.test(text))
  const reimbursable = /\breimburse|reimbursement|\bclaim\b/i.test(text)

  return {
    name,
    amount: amountInfo.amount,
    type: guessed.type,
    category: guessed.category,
    date: parseDate(text, today),
    paymentMethod: PAYMENT_METHODS.includes(parsePayment(text)) ? parsePayment(text) : 'Card',
    note: '',
    shopId: matchShop(text, shops),
    clientId: client?.id || '',
    employeeId: employee?.id || '',
    vendorId: vendor?.id || '',
    billable: Boolean(billable || (client && /\bbillable\b/i.test(text))),
    reimbursable,
    status: reimbursable ? 'submitted' : 'recorded',
  }
}

export function isGreeting(text) {
  return GREETING_RE.test(String(text || '').trim())
}

export function classifyIntent(text) {
  const trimmed = text.trim()
  if (!trimmed) return 'help'
  if (isGreeting(trimmed)) return 'greet'
  if (QUESTION_RE.test(trimmed) || /[?？]$/.test(trimmed)) return 'ask'
  if (parseAmount(trimmed)) return 'add'
  return 'ask'
}

export function answerFromBooks(text, snapshot) {
  const lower = text.toLowerCase()
  const { monthTransactions, incomeTotal, spendingTotal, totalBalance, expenseBreakdown, budgetStatus } = snapshot
  const tx = monthTransactions || []

  if (/\b(client|clients|क्लाइंट)\b/i.test(lower) && /\b(list|who|show|how many)\b/i.test(lower)) {
    const names = (snapshot.clients || []).map((item) => item.name).filter(Boolean)
    return { topic: 'list', label: 'clients', list: names }
  }
  if (/\b(vendor|vendors|विक्रेता)\b/i.test(lower) && /\b(list|who|show|how many)\b/i.test(lower)) {
    return { topic: 'list', label: 'vendors', list: (snapshot.vendors || []).map((item) => item.name).filter(Boolean) }
  }
  if (/\b(team|employee|staff|टीम)\b/i.test(lower) && /\b(list|who|show|how many)\b/i.test(lower)) {
    return { topic: 'list', label: 'team', list: (snapshot.employees || []).map((item) => item.name).filter(Boolean) }
  }
  if (/\b(shop|shops|दुकान)\b/i.test(lower) && /\b(list|who|show|how many)\b/i.test(lower)) {
    return { topic: 'list', label: 'shops', list: (snapshot.shops || []).map((item) => item.name).filter(Boolean) }
  }
  if (/\bbillable\b/i.test(lower)) {
    const amount = tx.filter((item) => item.billable).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    return { topic: 'billable', amount }
  }
  if (/\breimburse|payable|approval|claim\b/i.test(lower)) {
    const pending = tx.filter((item) => item.status === 'submitted').length
    const payable = tx.filter((item) => item.reimbursable && item.status === 'approved').reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    return { topic: 'claims', pending, payable }
  }

  if (/\b(over budget|overspend|budget)\b/i.test(lower) || /बजट/.test(text)) {
    const over = (budgetStatus || []).filter((item) => item.remaining < 0)
    return { topic: 'overBudget', over }
  }

  if (/\b(income|earned|salary|आय|सैलरी)\b/i.test(lower) && !/\bspend|spent|खर्च/.test(lower)) {
    return { topic: 'income', amount: incomeTotal }
  }

  if (/\b(net|saved|left|बचत)\b/i.test(lower)) {
    return { topic: 'net', amount: totalBalance }
  }

  if (/\b(top|biggest|most|सबसे)\b/i.test(lower)) {
    const top = expenseBreakdown?.[0]
    return { topic: 'topCategory', category: top?.category || '', amount: top?.total || 0 }
  }

  if (/\b(last|recent|latest|आखिरी)\b/i.test(lower)) {
    const last = monthTransactions?.[0]
    return { topic: 'lastTx', transaction: last || null }
  }

  if (/\b(summar|overview|pulse|सार)\b/i.test(lower) || /\bthis month\b/i.test(lower) && !parseAmount(text)) {
    const top = expenseBreakdown?.[0]
    return {
      topic: 'summary',
      income: incomeTotal,
      spending: spendingTotal,
      net: totalBalance,
      category: top?.category || '',
    }
  }

  if (/\b(spend|spent|expense|खर्च)\b/i.test(lower) || classifyIntent(text) === 'ask') {
    if (/\b(spend|spent|expense|खर्च|how much)\b/i.test(lower)) {
      return { topic: 'spending', amount: spendingTotal }
    }
  }

  return { topic: 'help' }
}

export function interpretLocal(text, snapshot) {
  if (isGreeting(text)) {
    return { intent: 'greet', source: 'local' }
  }

  const command = parseWorkspaceCommand(text, snapshot)
  if (command) return { ...command, source: 'local' }

  const intent = classifyIntent(text)

  if (intent === 'add') {
    const transaction = parseQuickAdd(text, snapshot)
    if (!transaction) return { intent: 'help', source: 'local' }
    return { intent: 'add', transaction, source: 'local' }
  }

  if (intent === 'ask') {
    const maybeAdd = parseQuickAdd(text, snapshot)
    if (maybeAdd && !QUESTION_RE.test(text)) {
      return { intent: 'add', transaction: maybeAdd, source: 'local' }
    }
    return { intent: 'ask', ...answerFromBooks(text, snapshot), source: 'local' }
  }

  return { intent: 'help', source: 'local' }
}

export function formatAssistantReply(result, { t, money, categoryLabel, monthLabel }) {
  if (result.intent === 'greet') return t('ai.greet')

  if (result.intent === 'do') {
    return result.answer || t('ai.help')
  }

  if (result.intent === 'add' && result.transaction) {
    return t('ai.did.tx', {
      name: result.transaction.name,
      amount: money(result.transaction.amount),
    })
  }

  if (result.intent === 'ask') {
    switch (result.topic) {
      case 'spending':
        return t('ai.answer.spending', { amount: money(result.amount) })
      case 'income':
        return t('ai.answer.income', { amount: money(result.amount) })
      case 'net':
        return t('ai.answer.net', { amount: money(result.amount) })
      case 'topCategory':
        return result.category
          ? t('ai.answer.top', { category: categoryLabel(result.category), amount: money(result.amount) })
          : t('ai.answer.none')
      case 'overBudget':
        if (!result.over?.length) return t('ai.answer.overNone')
        return t('ai.answer.over', {
          list: result.over.map((item) => `${categoryLabel(item.category)} (${money(Math.abs(item.remaining))})`).join(', '),
        })
      case 'lastTx':
        if (!result.transaction) return t('ai.answer.none')
        return t('ai.answer.last', {
          name: result.transaction.name,
          amount: money(result.transaction.amount),
          date: result.transaction.date,
        })
      case 'summary':
        return t('ai.answer.summary', {
          month: monthLabel,
          income: money(result.income),
          spending: money(result.spending),
          net: money(result.net),
          category: result.category ? categoryLabel(result.category) : t('common.expenses'),
        })
      case 'billable':
        return t('ai.answer.billable', { amount: money(result.amount) })
      case 'claims':
        return t('ai.answer.claims', { count: result.pending, amount: money(result.payable) })
      case 'list':
        return result.list?.length ? t('ai.answer.list', { label: result.label, list: result.list.join(', ') }) : t('ai.answer.none')
      case 'cloud':
        return result.answer || t('ai.help')
      default:
        return t('ai.help')
    }
  }

  return t('ai.help')
}

export function compactSnapshot(snapshot) {
  return {
    month: snapshot.monthLabel,
    currency: snapshot.currency,
    income: snapshot.incomeTotal,
    spending: snapshot.spendingTotal,
    net: snapshot.totalBalance,
    categories: (snapshot.categories || []).map((item) => item.name),
    shops: (snapshot.shops || []).map((item) => ({ name: item.name, city: item.city, type: item.type })),
    clients: (snapshot.clients || []).map((item) => item.name),
    vendors: (snapshot.vendors || []).map((item) => item.name),
    employees: (snapshot.employees || []).map((item) => ({ name: item.name, role: item.role })),
    departments: (snapshot.departments || []).map((item) => item.name),
    projects: (snapshot.projects || []).map((item) => item.name),
    pendingClaims: (snapshot.transactions || snapshot.monthTransactions || [])
      .filter((item) => item.status === 'submitted' || (item.reimbursable && item.status === 'approved'))
      .slice(0, 8)
      .map((item) => ({ name: item.name, amount: item.amount, status: item.status })),
    topExpenses: (snapshot.expenseBreakdown || []).slice(0, 5),
    budgets: (snapshot.budgetStatus || []).map((item) => ({
      category: item.category,
      amount: item.amount,
      spent: item.spent,
      remaining: item.remaining,
    })),
    recent: (snapshot.monthTransactions || []).slice(0, 8).map((item) => ({
      name: item.name,
      amount: item.amount,
      type: item.type,
      category: item.category,
      date: item.date,
    })),
  }
}
