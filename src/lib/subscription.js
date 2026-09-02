import { todayISO, toISODate } from './dates'

export const FREE_BUDGET_LIMIT = 3

export const PRO_PLAN = {
  id: 'pro',
  name: 'Expense So Pro',
  monthlyPrice: 7,
  yearlyPrice: 59,
}

export const BUSINESS_PLAN = {
  id: 'business',
  name: 'Expense So Business',
  monthlyPrice: 29,
  yearlyPrice: 249,
}

export const PREMIUM_FEATURES = {
  reports: {
    title: 'Reports & analytics',
    description: 'Six-month trends, savings rate, category mix, and your largest expenses.',
    plan: 'pro',
  },
  goals: {
    title: 'Savings goals',
    description: 'Set targets, track progress, and contribute toward trips, funds, and purchases.',
    plan: 'pro',
  },
  recurring: {
    title: 'Recurring transactions',
    description: 'Automatically post rent, salary, and subscriptions on schedule.',
    plan: 'pro',
  },
  export: {
    title: 'CSV export',
    description: 'Download a spreadsheet of transactions. Full JSON backups are available on every plan.',
    plan: 'pro',
  },
  customCategories: {
    title: 'Custom categories',
    description: 'Add your own income and expense categories beyond the defaults.',
    plan: 'pro',
  },
  unlimitedBudgets: {
    title: 'Unlimited budgets',
    description: `Free plans include ${FREE_BUDGET_LIMIT} category budgets. Pro removes the cap.`,
    plan: 'pro',
  },
  alerts: {
    title: 'Smart alerts',
    description: 'Get notified when a budget is nearly spent or a goal deadline is close.',
    plan: 'pro',
  },
  company: {
    title: 'Company workspace',
    description: 'Business profile, tax tracking, billable spend, and department reporting.',
    plan: 'business',
  },
  team: {
    title: 'Team & departments',
    description: 'Employees, roles, and cost centers for a company expense workflow.',
    plan: 'business',
  },
  clients: {
    title: 'Clients & projects',
    description: 'Track billable work, project spend, and what can be invoiced back.',
    plan: 'business',
  },
  approvals: {
    title: 'Approvals & reimbursements',
    description: 'Submit claims, approve or reject spend, and mark reimbursements paid.',
    plan: 'business',
  },
  vendors: {
    title: 'Vendors & suppliers',
    description: 'Keep supplier records and see how much you spend with each one.',
    plan: 'business',
  },
  shops: {
    title: 'Shop locations',
    description: 'Track sales, inventory, and costs for every store, cafe, or retail counter.',
    plan: 'business',
  },
  analytics: {
    title: 'Shop analytics',
    description: 'Compare shops, months, and categories with line and bar charts.',
    plan: 'business',
  },
}

export const PRO_PERKS = [
  'Reports and six-month analytics',
  'Savings goals and contributions',
  'Recurring income and expenses',
  'CSV spreadsheet export',
  'Custom categories',
  'Unlimited monthly budgets',
  'Smart budget and goal alerts',
]

export const BUSINESS_PERKS = [
  'Everything in Pro',
  'Company profile and tax tracking',
  'Team members and departments',
  'Clients, projects, and billable spend',
  'Expense approvals and reimbursements',
  'Vendor and supplier records',
  'Shop locations for stores and cafes',
  'Line and bar charts to compare shop data',
  'Department and client reporting',
]

export function defaultSubscription() {
  return {
    plan: 'free',
    status: 'inactive',
    billing: 'monthly',
    startedAt: null,
    renewsAt: null,
    canceledAt: null,
  }
}

export function mergeSubscription(value) {
  return {
    ...defaultSubscription(),
    ...(value && typeof value === 'object' ? value : {}),
  }
}

export function nextRenewalDate(billing, from = new Date()) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  if (billing === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  } else {
    date.setMonth(date.getMonth() + 1)
  }
  return toISODate(date)
}

export function isActiveSubscription(subscription, today = todayISO()) {
  if (!subscription) return false
  if (subscription.status !== 'active' && subscription.status !== 'canceled') return false
  if (subscription.renewsAt && subscription.renewsAt < today) return false
  return true
}

export function isProMember(subscription, today = todayISO()) {
  return isActiveSubscription(subscription, today) && (subscription.plan === 'pro' || subscription.plan === 'business')
}

export function isBusinessMember(subscription, today = todayISO()) {
  return isActiveSubscription(subscription, today) && subscription.plan === 'business'
}

export function requiredPlanFor(feature) {
  return PREMIUM_FEATURES[feature]?.plan || 'pro'
}

export function planSpec(plan = 'pro') {
  return plan === 'business' ? BUSINESS_PLAN : PRO_PLAN
}

export function planPrice(billing, plan = 'pro') {
  const spec = planSpec(plan)
  return billing === 'yearly' ? spec.yearlyPrice : spec.monthlyPrice
}

export function billingLabel(billing) {
  return billing === 'yearly' ? 'year' : 'month'
}

export function planDisplayName(plan) {
  if (plan === 'business') return 'Business'
  if (plan === 'pro') return 'Pro'
  return 'Free'
}
