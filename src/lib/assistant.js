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

export function parseQuickAdd(text, { categories = [], shops = [], today = todayISO() } = {}) {
  const amountInfo = parseAmount(text)
  if (!amountInfo) return null

  const income = INCOME_RE.test(text)
  const expenseHint = EXPENSE_HINT_RE.test(text)
  const guessed = guessCategory(text, categories, income && !expenseHint ? 'income' : 'expense')
  const name = cleanName(text, amountInfo.raw) || guessed.category

  return {
    name,
    amount: amountInfo.amount,
    type: guessed.type,
    category: guessed.category,
    date: parseDate(text, today),
    paymentMethod: PAYMENT_METHODS.includes(parsePayment(text)) ? parsePayment(text) : 'Card',
    note: '',
    shopId: matchShop(text, shops),
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
  const intent = classifyIntent(text)

  if (intent === 'greet') {
    return { intent: 'greet', source: 'local' }
  }

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

  if (result.intent === 'add' && result.transaction) {
    return t('ai.draft', {
      name: result.transaction.name,
      amount: money(result.transaction.amount),
      category: categoryLabel(result.transaction.category),
      date: result.transaction.date,
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
    shops: (snapshot.shops || []).map((item) => item.name),
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
