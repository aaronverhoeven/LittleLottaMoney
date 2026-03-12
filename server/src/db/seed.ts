import { db } from './index.js'
import {
  profile, accounts, categories, transactions,
  budgetBuckets, budgetPeriods, goals, incomeRecords,
  filterRules, assets, netWorthSnapshots, aiSettings,
} from './schema.js'
import { subMonths, format, subDays } from 'date-fns'

export async function seed() {
  console.log('  ↳ Seeding sample data…')

  // ── Profile ────────────────────────────────────────────────────────────────
  const existingProfile = db.select().from(profile).get()
  if (existingProfile) {
    console.log('  ↳ Seed already applied, skipping.')
    return
  }

  db.insert(profile).values({
    name: 'Alex Johnson',
    age: 31,
    location: 'Austin, TX',
    occupation: 'Software Engineer',
    employer: 'Acme Corp',
    annualSalary: 88800,
    currency: 'USD',
  }).run()

  // ── AI Settings ───────────────────────────────────────────────────────────
  db.insert(aiSettings).values({ provider: 'none' }).run()

  // ── Categories ────────────────────────────────────────────────────────────
  const cats = db.insert(categories).values([
    { name: 'Income',         emoji: '💵', color: '#10b981', isSystem: true },
    { name: 'Housing',        emoji: '🏠', color: '#6366f1', isSystem: true },
    { name: 'Food & Dining',  emoji: '🍔', color: '#f59e0b', isSystem: true },
    { name: 'Transport',      emoji: '🚗', color: '#3b82f6', isSystem: true },
    { name: 'Subscriptions',  emoji: '📱', color: '#8b5cf6', isSystem: true },
    { name: 'Health',         emoji: '💪', color: '#10b981', isSystem: true },
    { name: 'Entertainment',  emoji: '🎬', color: '#ef4444', isSystem: true },
    { name: 'Shopping',       emoji: '🛍️', color: '#ec4899', isSystem: true },
    { name: 'Savings',        emoji: '💰', color: '#10b981', isSystem: true },
    { name: 'Transfer',       emoji: '↔️', color: '#94a3b8', isSystem: true },
    { name: 'Uncategorized',  emoji: '❓', color: '#94a3b8', isSystem: true },
  ]).returning().all()

  const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]))

  // ── Accounts ──────────────────────────────────────────────────────────────
  const accs = db.insert(accounts).values([
    { name: 'Chase Checking',      type: 'checking',   institutionName: 'Chase',   balanceCurrent: 4820,   mask: '4821', isManual: false },
    { name: 'Ally HYSA',           type: 'savings',    institutionName: 'Ally',    balanceCurrent: 18400,  mask: '9012', isManual: false },
    { name: 'Fidelity Brokerage',  type: 'investment', institutionName: 'Fidelity',balanceCurrent: 32100,  mask: '3301', isManual: false },
    { name: '401(k)',              type: 'retirement', institutionName: 'Fidelity',balanceCurrent: 41200,  mask: '7700', isManual: false },
    { name: 'Chase Sapphire',      type: 'credit',     institutionName: 'Chase',   balanceCurrent: -2340,  balanceLimit: 15000, mask: '1234', isManual: false },
    { name: 'Student Loan',        type: 'loan',       institutionName: 'Navient', balanceCurrent: -18200, mask: '5500', isManual: true },
  ]).returning().all()

  const [checking, savings, brokerage, retirement401k, credit, loan] = accs
  const checkingId = checking.id
  const creditId   = credit.id

  // ── Budget Buckets ────────────────────────────────────────────────────────
  const buckets = db.insert(budgetBuckets).values([
    { name: 'Housing',        monthlyLimit: 2200, color: '#6366f1', emoji: '🏠', sortOrder: 1, categoryId: catMap['Housing'] },
    { name: 'Food & Dining',  monthlyLimit: 600,  color: '#f59e0b', emoji: '🍔', sortOrder: 2, categoryId: catMap['Food & Dining'] },
    { name: 'Transport',      monthlyLimit: 400,  color: '#3b82f6', emoji: '🚗', sortOrder: 3, categoryId: catMap['Transport'] },
    { name: 'Subscriptions',  monthlyLimit: 150,  color: '#8b5cf6', emoji: '📱', sortOrder: 4, categoryId: catMap['Subscriptions'] },
    { name: 'Health',         monthlyLimit: 200,  color: '#10b981', emoji: '💪', sortOrder: 5, categoryId: catMap['Health'] },
    { name: 'Entertainment',  monthlyLimit: 200,  color: '#ef4444', emoji: '🎬', sortOrder: 6, categoryId: catMap['Entertainment'] },
    { name: 'Shopping',       monthlyLimit: 300,  color: '#ec4899', emoji: '🛍️', sortOrder: 7, categoryId: catMap['Shopping'] },
    { name: 'Savings',        monthlyLimit: 1500, color: '#10b981', emoji: '💰', sortOrder: 8, categoryId: catMap['Savings'] },
    { name: 'Slush Fund',     monthlyLimit: 0,    color: '#0ea5e9', emoji: '💧', sortOrder: 99, isSlush: true },
  ]).returning().all()

  const bucketMap = Object.fromEntries(buckets.map((b) => [b.name, b.id]))

  // ── Budget Periods (current month) ────────────────────────────────────────
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  db.insert(budgetPeriods).values([
    { bucketId: bucketMap['Housing'],       year, month, allocated: 2200, spent: 2200 },
    { bucketId: bucketMap['Food & Dining'], year, month, allocated: 600,  spent: 487  },
    { bucketId: bucketMap['Transport'],     year, month, allocated: 400,  spent: 310  },
    { bucketId: bucketMap['Subscriptions'], year, month, allocated: 150,  spent: 148  },
    { bucketId: bucketMap['Health'],        year, month, allocated: 200,  spent: 85   },
    { bucketId: bucketMap['Entertainment'], year, month, allocated: 200,  spent: 230  },
    { bucketId: bucketMap['Shopping'],      year, month, allocated: 300,  spent: 178  },
    { bucketId: bucketMap['Savings'],       year, month, allocated: 1500, spent: 1500 },
  ]).run()

  // ── Goals ─────────────────────────────────────────────────────────────────
  db.insert(goals).values([
    { name: 'Emergency Fund', targetAmount: 22000, currentAmount: 18400, monthlyContribution: 500,  deadline: '2025-09-01', emoji: '🛡️', linkedAccountId: savings.id },
    { name: 'Europe Trip',    targetAmount: 5000,  currentAmount: 1200,  monthlyContribution: 300,  deadline: '2025-12-01', emoji: '✈️' },
    { name: 'New MacBook',    targetAmount: 2500,  currentAmount: 800,   monthlyContribution: 200,  deadline: '2025-07-01', emoji: '💻' },
  ]).run()

  // ── Income Records (12 months) ────────────────────────────────────────────
  const incomeData = [
    { amount: 7200, isOutlier: false },
    { amount: 7200, isOutlier: false },
    { amount: 7200, isOutlier: false },
    { amount: 22500, isOutlier: true, outlierReason: 'Annual bonus' },
    { amount: 7200, isOutlier: false },
    { amount: 7200, isOutlier: false },
    { amount: 7400, isOutlier: false },
    { amount: 7400, isOutlier: false },
    { amount: 7400, isOutlier: false },
    { amount: 7400, isOutlier: false },
    { amount: 7400, isOutlier: false },
    { amount: 7400, isOutlier: false },
  ]

  db.insert(incomeRecords).values(
    incomeData.map((d, i) => ({
      amount: d.amount,
      source: 'Salary — Acme Corp',
      date: format(subMonths(now, 11 - i), 'yyyy-MM-01'),
      isOutlier: d.isOutlier,
      outlierReason: d.outlierReason ?? null,
    }))
  ).run()

  // ── Net Worth Snapshots (24 months) ───────────────────────────────────────
  db.insert(netWorthSnapshots).values(
    Array.from({ length: 24 }, (_, i) => {
      const base       = 48000 + i * 1200
      const variance   = (((i * 7) % 5) - 2) * 800
      const assets     = Math.round(base + variance + 22000)
      const liabilities= Math.round(22000 - i * 80)
      return {
        date:             format(subMonths(now, 23 - i), 'yyyy-MM-01'),
        totalAssets:      assets,
        totalLiabilities: liabilities,
        netWorth:         assets - liabilities,
      }
    })
  ).run()

  // ── Filter Rules ──────────────────────────────────────────────────────────
  db.insert(filterRules).values([
    { name: 'Netflix → Subscriptions', pattern: 'netflix',                      matchType: 'keyword', categoryId: catMap['Subscriptions'], bucketId: bucketMap['Subscriptions'], priority: 10, matchedCount: 12 },
    { name: 'Payroll → Income',        pattern: 'payroll|direct deposit',       matchType: 'regex',   categoryId: catMap['Income'],        priority: 10, matchedCount: 6  },
    { name: 'Gas stations → Transport',pattern: 'shell|bp|chevron|exxon|mobil', matchType: 'regex',   categoryId: catMap['Transport'],     bucketId: bucketMap['Transport'],  priority: 8, matchedCount: 18 },
    { name: 'Groceries → Food',        pattern: 'whole foods|trader joe|kroger|safeway|aldi', matchType: 'regex', categoryId: catMap['Food & Dining'], bucketId: bucketMap['Food & Dining'], priority: 8, matchedCount: 24 },
    { name: 'Spotify → Subscriptions', pattern: 'spotify',                      matchType: 'keyword', categoryId: catMap['Subscriptions'], bucketId: bucketMap['Subscriptions'], priority: 10, matchedCount: 12 },
  ]).run()

  // ── Assets ────────────────────────────────────────────────────────────────
  db.insert(assets).values([
    {
      name: '2021 Toyota Camry',
      type: 'vehicle',
      purchaseValue: 28000,
      currentValue: 19200,
      purchaseDate: '2021-03-15',
      depreciationRate: 15,
      valuationSource: 'KBB estimate',
    },
    {
      name: '123 Main St, Austin TX',
      type: 'real_estate',
      purchaseValue: 340000,
      currentValue: 412000,
      purchaseDate: '2020-06-01',
      depreciationRate: null,
      valuationSource: 'Zillow Zestimate',
      address: '123 Main St, Austin, TX 78701',
    },
  ]).run()

  // ── Transactions (last 30 days) ───────────────────────────────────────────
  const txData = [
    { daysAgo: 1,  merchant: 'Whole Foods',       amount: -82.40,   catName: 'Food & Dining',  accId: checkingId },
    { daysAgo: 1,  merchant: 'Netflix',            amount: -15.99,   catName: 'Subscriptions',  accId: creditId   },
    { daysAgo: 1,  merchant: 'Payroll - Acme Corp',amount: 3700.00,  catName: 'Income',         accId: checkingId },
    { daysAgo: 2,  merchant: 'Shell Gas Station',  amount: -54.20,   catName: 'Transport',      accId: creditId   },
    { daysAgo: 3,  merchant: 'Target',             amount: -134.67,  catName: 'Shopping',       accId: creditId   },
    { daysAgo: 3,  merchant: 'Spotify',            amount: -11.99,   catName: 'Subscriptions',  accId: creditId   },
    { daysAgo: 4,  merchant: 'Chipotle',           amount: -14.85,   catName: 'Food & Dining',  accId: checkingId },
    { daysAgo: 4,  merchant: 'Planet Fitness',     amount: -25.00,   catName: 'Health',         accId: checkingId },
    { daysAgo: 5,  merchant: 'Amazon',             amount: -67.34,   catName: 'Shopping',       accId: creditId   },
    { daysAgo: 5,  merchant: 'Rent - 123 Oak Ave', amount: -1950.00, catName: 'Housing',        accId: checkingId },
    { daysAgo: 7,  merchant: 'Trader Joe\'s',      amount: -61.20,   catName: 'Food & Dining',  accId: checkingId },
    { daysAgo: 8,  merchant: 'Chevron',            amount: -48.00,   catName: 'Transport',      accId: creditId   },
    { daysAgo: 9,  merchant: 'Apple',              amount: -9.99,    catName: 'Subscriptions',  accId: creditId   },
    { daysAgo: 10, merchant: 'Chick-fil-A',        amount: -12.45,   catName: 'Food & Dining',  accId: creditId   },
    { daysAgo: 12, merchant: 'Walgreens',          amount: -34.20,   catName: 'Health',         accId: creditId   },
    { daysAgo: 14, merchant: 'Electricity Bill',   amount: -142.00,  catName: 'Housing',        accId: checkingId },
    { daysAgo: 16, merchant: 'Payroll - Acme Corp',amount: 3700.00,  catName: 'Income',         accId: checkingId },
    { daysAgo: 18, merchant: 'Whole Foods',        amount: -94.50,   catName: 'Food & Dining',  accId: checkingId },
    { daysAgo: 20, merchant: 'AMC Theatres',       amount: -28.50,   catName: 'Entertainment',  accId: creditId   },
    { daysAgo: 21, merchant: 'Uber',               amount: -22.40,   catName: 'Transport',      accId: creditId   },
    { daysAgo: 22, merchant: 'H&M',                amount: -89.00,   catName: 'Shopping',       accId: creditId   },
    { daysAgo: 24, merchant: 'McDonald\'s',        amount: -8.75,    catName: 'Food & Dining',  accId: creditId   },
    { daysAgo: 25, merchant: 'YouTube Premium',    amount: -13.99,   catName: 'Subscriptions',  accId: creditId   },
    { daysAgo: 26, merchant: 'Costco',             amount: -187.34,  catName: 'Shopping',       accId: checkingId },
    { daysAgo: 28, merchant: 'Peloton',            amount: -44.00,   catName: 'Health',         accId: creditId   },
    { daysAgo: 29, merchant: 'Concert tickets',    amount: -180.00,  catName: 'Entertainment',  accId: creditId   },
    { daysAgo: 30, merchant: 'Starbucks',          amount: -6.85,    catName: 'Food & Dining',  accId: creditId   },
  ]

  db.insert(transactions).values(
    txData.map((t) => ({
      accountId:           t.accId,
      amount:              t.amount,
      date:                format(subDays(now, t.daysAgo), 'yyyy-MM-dd'),
      merchantName:        t.merchant,
      originalDescription: t.merchant,
      categoryId:          catMap[t.catName],
    }))
  ).run()

  console.log('  ✓ Sample data seeded successfully')
}
