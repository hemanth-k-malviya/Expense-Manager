export const APP_NAME = 'Expense So'
export const STORAGE_KEY = 'pennies-expense-manager-v1'

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'JPY', label: 'Japanese Yen' },
]

export const PAYMENT_METHODS = ['Card', 'Cash', 'Bank', 'UPI', 'Wallet']

export const RECURRING_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const CATEGORY_COLORS = {
  Groceries: '#7dbb7d',
  'Food & dining': '#e2b34d',
  Transport: '#5b91a7',
  Subscriptions: '#8b80c9',
  Home: '#e96d52',
  Health: '#e98069',
  Entertainment: '#7b73b7',
  Shopping: '#d4a574',
  Utilities: '#4aa3a0',
  Education: '#4d6fe6',
  Travel: '#3d8e64',
  Other: '#6d7d9d',
  Salary: '#4d6fe6',
  Freelance: '#4a8d61',
  Investments: '#7eb07b',
  Gifts: '#e6bd4d',
  'Shop sales': '#4a8d61',
  Inventory: '#d4a574',
}

export const CATEGORY_TONES = {
  Groceries: 'green',
  'Food & dining': 'orange',
  Transport: 'sky',
  Subscriptions: 'ink',
  Home: 'rose',
  Health: 'rose',
  Entertainment: 'ink',
  Shopping: 'orange',
  Utilities: 'sky',
  Education: 'blue',
  Travel: 'green',
  Other: 'ink',
  Salary: 'blue',
  Freelance: 'green',
  Investments: 'green',
  Gifts: 'orange',
  'Shop sales': 'green',
  Inventory: 'orange',
}

export const DEFAULT_CATEGORIES = [
  { id: 'cat-groceries', name: 'Groceries', type: 'expense' },
  { id: 'cat-dining', name: 'Food & dining', type: 'expense' },
  { id: 'cat-transport', name: 'Transport', type: 'expense' },
  { id: 'cat-subs', name: 'Subscriptions', type: 'expense' },
  { id: 'cat-home', name: 'Home', type: 'expense' },
  { id: 'cat-health', name: 'Health', type: 'expense' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense' },
  { id: 'cat-utilities', name: 'Utilities', type: 'expense' },
  { id: 'cat-education', name: 'Education', type: 'expense' },
  { id: 'cat-travel', name: 'Travel', type: 'expense' },
  { id: 'cat-other-expense', name: 'Other', type: 'expense' },
  { id: 'cat-salary', name: 'Salary', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income' },
  { id: 'cat-investments', name: 'Investments', type: 'income' },
  { id: 'cat-gifts', name: 'Gifts', type: 'income' },
  { id: 'cat-shop-sales', name: 'Shop sales', type: 'income' },
  { id: 'cat-inventory', name: 'Inventory', type: 'expense' },
]

export const NAV_ITEMS = [
  { to: '/app', labelKey: 'nav.overview', icon: '◫' },
  { to: '/transactions', labelKey: 'nav.transactions', icon: '↔' },
  { to: '/budgets', labelKey: 'nav.budgets', icon: '▤' },
  { to: '/goals', labelKey: 'nav.goals', icon: '◎', premium: true },
  { to: '/reports', labelKey: 'nav.reports', icon: '▧', premium: true },
  { to: '/books', labelKey: 'nav.books', icon: '◇' },
]

export const BUSINESS_NAV_ITEMS = [
  { to: '/business', labelKey: 'nav.company', icon: '▣', feature: 'company' },
  { to: '/team', labelKey: 'nav.team', icon: '☺', feature: 'team' },
  { to: '/clients', labelKey: 'nav.clients', icon: '◈', feature: 'clients' },
  { to: '/approvals', labelKey: 'nav.approvals', icon: '✓', feature: 'approvals' },
  { to: '/vendors', labelKey: 'nav.vendors', icon: '⬡', feature: 'vendors' },
  { to: '/shops', labelKey: 'nav.shops', icon: '⌂', feature: 'shops' },
  { to: '/analytics', labelKey: 'nav.analytics', icon: '▦', feature: 'analytics' },
]
