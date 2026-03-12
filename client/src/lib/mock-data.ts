import { subMonths, format } from 'date-fns'

// --- Net Worth History ---
export const netWorthHistory = Array.from({ length: 24 }, (_, i) => {
  const date = subMonths(new Date(), 23 - i)
  const base = 48000 + i * 1200
  const variance = (Math.random() - 0.4) * 2000
  return {
    month: format(date, 'MMM yy'),
    netWorth: Math.round(base + variance),
    assets: Math.round(base + variance + 22000),
    liabilities: 22000 - i * 80,
  }
})

// --- Monthly Income ---
export const monthlyIncome = [
  { month: 'Apr 24', amount: 7200, isOutlier: false },
  { month: 'May 24', amount: 7200, isOutlier: false },
  { month: 'Jun 24', amount: 7200, isOutlier: false },
  { month: 'Jul 24', amount: 22500, isOutlier: true },  // bonus
  { month: 'Aug 24', amount: 7200, isOutlier: false },
  { month: 'Sep 24', amount: 7200, isOutlier: false },
  { month: 'Oct 24', amount: 7400, isOutlier: false },
  { month: 'Nov 24', amount: 7400, isOutlier: false },
  { month: 'Dec 24', amount: 7400, isOutlier: false },
  { month: 'Jan 25', amount: 7400, isOutlier: false },
  { month: 'Feb 25', amount: 7400, isOutlier: false },
  { month: 'Mar 25', amount: 7400, isOutlier: false },
]

// --- Accounts ---
export const accounts = [
  { id: '1', name: 'Chase Checking', type: 'checking', institution: 'Chase', balance: 4820, lastSync: '2 min ago' },
  { id: '2', name: 'Ally HYSA', type: 'savings', institution: 'Ally', balance: 18400, lastSync: '2 min ago' },
  { id: '3', name: 'Fidelity Brokerage', type: 'investment', institution: 'Fidelity', balance: 32100, lastSync: '5 min ago' },
  { id: '4', name: '401(k)', type: 'retirement', institution: 'Fidelity', balance: 41200, lastSync: '5 min ago' },
  { id: '5', name: 'Chase Sapphire', type: 'credit', institution: 'Chase', balance: -2340, lastSync: '2 min ago' },
  { id: '6', name: 'Student Loan', type: 'loan', institution: 'Navient', balance: -18200, lastSync: '1 day ago' },
]

export const assets = [
  {
    id: 'a1',
    name: '2021 Toyota Camry',
    type: 'vehicle',
    purchaseValue: 28000,
    currentValue: 19200,
    purchaseDate: '2021-03-15',
    depreciationRate: 15,
    source: 'KBB estimate',
  },
  {
    id: 'a2',
    name: '123 Main St, Austin TX',
    type: 'real_estate',
    purchaseValue: 340000,
    currentValue: 412000,
    purchaseDate: '2020-06-01',
    depreciationRate: null,
    source: 'Zillow Zestimate',
  },
]

// --- Budget Buckets ---
export const budgetBuckets = [
  { id: 'b1', name: 'Housing', allocated: 2200, spent: 2200, color: '#6366f1', emoji: '🏠' },
  { id: 'b2', name: 'Food & Dining', allocated: 600, spent: 487, color: '#f59e0b', emoji: '🍔' },
  { id: 'b3', name: 'Transport', allocated: 400, spent: 310, color: '#3b82f6', emoji: '🚗' },
  { id: 'b4', name: 'Subscriptions', allocated: 150, spent: 148, color: '#8b5cf6', emoji: '📱' },
  { id: 'b5', name: 'Health & Fitness', allocated: 200, spent: 85, color: '#10b981', emoji: '💪' },
  { id: 'b6', name: 'Entertainment', allocated: 200, spent: 230, color: '#ef4444', emoji: '🎬' },
  { id: 'b7', name: 'Shopping', allocated: 300, spent: 178, color: '#ec4899', emoji: '🛍️' },
  { id: 'b8', name: 'Savings', allocated: 1500, spent: 1500, color: '#10b981', emoji: '💰' },
]

export const slushFund = { available: 850, total: 7400 }

// --- Goals ---
export const goals = [
  { id: 'g1', name: 'Emergency Fund', target: 22000, saved: 18400, monthly: 500, deadline: '2025-09-01' },
  { id: 'g2', name: 'Europe Trip', target: 5000, saved: 1200, monthly: 300, deadline: '2025-12-01' },
  { id: 'g3', name: 'New MacBook', target: 2500, saved: 800, monthly: 200, deadline: '2025-07-01' },
]

// --- Transactions ---
export const recentTransactions = [
  { id: 't1', date: '2025-03-11', merchant: 'Whole Foods', amount: -82.40, category: 'Food & Dining', account: 'Chase Checking', status: 'cleared' },
  { id: 't2', date: '2025-03-11', merchant: 'Netflix', amount: -15.99, category: 'Subscriptions', account: 'Chase Sapphire', status: 'cleared' },
  { id: 't3', date: '2025-03-10', merchant: 'Payroll - Acme Corp', amount: 3700.00, category: 'Income', account: 'Chase Checking', status: 'cleared' },
  { id: 't4', date: '2025-03-10', merchant: 'Shell Gas Station', amount: -54.20, category: 'Transport', account: 'Chase Sapphire', status: 'cleared' },
  { id: 't5', date: '2025-03-09', merchant: 'Target', amount: -134.67, category: 'Shopping', account: 'Chase Sapphire', status: 'cleared' },
  { id: 't6', date: '2025-03-09', merchant: 'Spotify', amount: -11.99, category: 'Subscriptions', account: 'Chase Sapphire', status: 'cleared' },
  { id: 't7', date: '2025-03-08', merchant: 'Chipotle', amount: -14.85, category: 'Food & Dining', account: 'Chase Checking', status: 'cleared' },
  { id: 't8', date: '2025-03-08', merchant: 'Planet Fitness', amount: -25.00, category: 'Health & Fitness', account: 'Chase Checking', status: 'cleared' },
  { id: 't9', date: '2025-03-07', merchant: 'Amazon', amount: -67.34, category: 'Shopping', account: 'Chase Sapphire', status: 'cleared' },
  { id: 't10', date: '2025-03-07', merchant: 'Rent - 123 Oak Ave', amount: -1950.00, category: 'Housing', account: 'Chase Checking', status: 'cleared' },
]

// --- Filters / Rules ---
export const filterRules = [
  { id: 'r1', name: 'Netflix → Subscriptions', pattern: 'netflix', matchType: 'merchant', category: 'Subscriptions', active: true, matched: 12 },
  { id: 'r2', name: 'Payroll → Income', pattern: 'payroll', matchType: 'merchant', category: 'Income', active: true, matched: 6 },
  { id: 'r3', name: 'Shell / BP / Chevron → Transport', pattern: 'shell|bp|chevron|exxon', matchType: 'merchant_regex', category: 'Transport', active: true, matched: 18 },
  { id: 'r4', name: 'Whole Foods / Trader Joe\'s → Groceries', pattern: 'whole foods|trader joe', matchType: 'merchant_regex', category: 'Food & Dining', active: true, matched: 24 },
]

export const suggestedRules = [
  { id: 's1', suggestion: 'Chipotle, Chick-fil-A, and 3 others → Food & Dining', confidence: 0.94, transactions: 8 },
  { id: 's2', suggestion: 'Amazon purchases over $50 → Shopping (Large)', confidence: 0.88, transactions: 5 },
  { id: 's3', suggestion: 'Planet Fitness → Health & Fitness', confidence: 0.99, transactions: 3 },
]

// --- Profile ---
export const userProfile = {
  name: 'Alex Johnson',
  age: 31,
  location: 'Austin, TX',
  occupation: 'Software Engineer',
  employer: 'Acme Corp',
  annualSalary: 88800,
  currency: 'USD',
  darkMode: false,
  connectedAI: 'none',
}

// --- Summary Stats ---
export const summaryStats = {
  netWorth: 95180,
  netWorthChange: 1420,
  netWorthChangePct: 1.51,
  monthlyIncome: 7400,
  monthlyExpenses: 5233,
  monthlySavingsRate: 29.3,
  avgMonthlyIncome: 7300,
  avgWithOutliers: 9117,
}
