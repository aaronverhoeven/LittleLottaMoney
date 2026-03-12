import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ── Profile ───────────────────────────────────────────────────────────────────
export const profile = sqliteTable('profile', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  name:         text('name').notNull().default(''),
  age:          integer('age'),
  location:     text('location'),
  occupation:   text('occupation'),
  employer:     text('employer'),
  annualSalary: real('annual_salary'),
  currency:     text('currency').notNull().default('USD'),
  darkMode:     integer('dark_mode', { mode: 'boolean' }).notNull().default(false),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ── Plaid Items (one per linked institution) ──────────────────────────────────
export const plaidItems = sqliteTable('plaid_items', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  itemId:          text('item_id').notNull().unique(),
  accessToken:     text('access_token').notNull(),
  institutionId:   text('institution_id'),
  institutionName: text('institution_name'),
  status:          text('status').notNull().default('active'),  // active | error
  errorCode:       text('error_code'),
  lastSyncedAt:    text('last_synced_at'),
  createdAt:       text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ── Accounts ──────────────────────────────────────────────────────────────────
export const accounts = sqliteTable('accounts', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  plaidItemId:       integer('plaid_item_id').references(() => plaidItems.id),
  plaidAccountId:    text('plaid_account_id').unique(),
  name:              text('name').notNull(),
  officialName:      text('official_name'),
  // type: checking | savings | investment | retirement | credit | loan
  type:              text('type').notNull(),
  subtype:           text('subtype'),
  institutionName:   text('institution_name'),
  balanceCurrent:    real('balance_current').notNull().default(0),
  balanceAvailable:  real('balance_available'),
  balanceLimit:      real('balance_limit'),
  currencyCode:      text('currency_code').notNull().default('USD'),
  mask:              text('mask'),
  isManual:          integer('is_manual', { mode: 'boolean' }).notNull().default(false),
  isHidden:          integer('is_hidden', { mode: 'boolean' }).notNull().default(false),
  lastSyncedAt:      text('last_synced_at'),
  createdAt:         text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:         text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ── Categories ────────────────────────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  name:     text('name').notNull(),
  parentId: integer('parent_id'),
  color:    text('color'),
  emoji:    text('emoji'),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
})

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactions = sqliteTable('transactions', {
  id:                  integer('id').primaryKey({ autoIncrement: true }),
  accountId:           integer('account_id').notNull().references(() => accounts.id),
  plaidTransactionId:  text('plaid_transaction_id').unique(),
  amount:              real('amount').notNull(),               // negative = expense, positive = income
  date:                text('date').notNull(),                 // YYYY-MM-DD
  merchantName:        text('merchant_name'),
  originalDescription: text('original_description'),
  categoryId:          integer('category_id').references(() => categories.id),
  isPending:           integer('is_pending', { mode: 'boolean' }).notNull().default(false),
  isManual:            integer('is_manual', { mode: 'boolean' }).notNull().default(false),
  isTransfer:          integer('is_transfer', { mode: 'boolean' }).notNull().default(false),
  isOutlier:           integer('is_outlier', { mode: 'boolean' }).notNull().default(false),
  notes:               text('notes'),
  createdAt:           text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:           text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('tx_account_date').on(t.accountId, t.date),
  index('tx_date').on(t.date),
])

// ── Budget Buckets ────────────────────────────────────────────────────────────
export const budgetBuckets = sqliteTable('budget_buckets', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  name:         text('name').notNull(),
  categoryId:   integer('category_id').references(() => categories.id),
  monthlyLimit: real('monthly_limit').notNull().default(0),
  color:        text('color').notNull().default('#10b981'),
  emoji:        text('emoji').notNull().default('💰'),
  sortOrder:    integer('sort_order').notNull().default(0),
  isSlush:      integer('is_slush', { mode: 'boolean' }).notNull().default(false),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ── Budget Periods (monthly spending per bucket) ──────────────────────────────
export const budgetPeriods = sqliteTable('budget_periods', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  bucketId:  integer('bucket_id').notNull().references(() => budgetBuckets.id),
  year:      integer('year').notNull(),
  month:     integer('month').notNull(),  // 1–12
  allocated: real('allocated').notNull().default(0),
  spent:     real('spent').notNull().default(0),
}, (t) => [
  index('bp_bucket_period').on(t.bucketId, t.year, t.month),
])

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goals = sqliteTable('goals', {
  id:                  integer('id').primaryKey({ autoIncrement: true }),
  name:                text('name').notNull(),
  targetAmount:        real('target_amount').notNull(),
  currentAmount:       real('current_amount').notNull().default(0),
  monthlyContribution: real('monthly_contribution').notNull().default(0),
  deadline:            text('deadline'),   // YYYY-MM-DD
  linkedAccountId:     integer('linked_account_id').references(() => accounts.id),
  isCompleted:         integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  emoji:               text('emoji').default('🎯'),
  createdAt:           text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:           text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ── Income Records ────────────────────────────────────────────────────────────
export const incomeRecords = sqliteTable('income_records', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  amount:           real('amount').notNull(),
  source:           text('source'),
  date:             text('date').notNull(),   // YYYY-MM-DD (first of month for monthly records)
  isOutlier:        integer('is_outlier', { mode: 'boolean' }).notNull().default(false),
  outlierReason:    text('outlier_reason'),
  transactionId:    integer('transaction_id').references(() => transactions.id),
  notes:            text('notes'),
  createdAt:        text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ── Filter Rules ──────────────────────────────────────────────────────────────
export const filterRules = sqliteTable('filter_rules', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  name:         text('name').notNull(),
  pattern:      text('pattern').notNull(),
  // match_type: keyword | regex | ai
  matchType:    text('match_type').notNull().default('keyword'),
  categoryId:   integer('category_id').references(() => categories.id),
  bucketId:     integer('bucket_id').references(() => budgetBuckets.id),
  priority:     integer('priority').notNull().default(0),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  matchedCount: integer('matched_count').notNull().default(0),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ── Physical Assets ───────────────────────────────────────────────────────────
export const assets = sqliteTable('assets', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  name:             text('name').notNull(),
  // type: vehicle | real_estate | other
  type:             text('type').notNull(),
  purchaseValue:    real('purchase_value').notNull(),
  currentValue:     real('current_value').notNull(),
  purchaseDate:     text('purchase_date'),   // YYYY-MM-DD
  depreciationRate: real('depreciation_rate'),  // annual % (null = appreciating)
  valuationSource:  text('valuation_source'),
  lastValuatedAt:   text('last_valuated_at'),
  vin:              text('vin'),      // vehicles
  address:          text('address'),  // real estate
  notes:            text('notes'),
  createdAt:        text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:        text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ── Net Worth Snapshots (monthly) ─────────────────────────────────────────────
export const netWorthSnapshots = sqliteTable('net_worth_snapshots', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  date:            text('date').notNull().unique(),   // YYYY-MM-DD (first of month)
  totalAssets:     real('total_assets').notNull(),
  totalLiabilities:real('total_liabilities').notNull(),
  netWorth:        real('net_worth').notNull(),
  createdAt:       text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ── AI Settings ───────────────────────────────────────────────────────────────
export const aiSettings = sqliteTable('ai_settings', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider').notNull().default('none'),   // none | claude | lmstudio
  apiKey:   text('api_key'),
  model:    text('model'),
  endpoint: text('endpoint').default('http://localhost:1234/v1'),
  updatedAt:text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ── Type exports ──────────────────────────────────────────────────────────────
export type Profile           = typeof profile.$inferSelect
export type PlaidItem         = typeof plaidItems.$inferSelect
export type Account           = typeof accounts.$inferSelect
export type Category          = typeof categories.$inferSelect
export type Transaction       = typeof transactions.$inferSelect
export type BudgetBucket      = typeof budgetBuckets.$inferSelect
export type BudgetPeriod      = typeof budgetPeriods.$inferSelect
export type Goal              = typeof goals.$inferSelect
export type IncomeRecord      = typeof incomeRecords.$inferSelect
export type FilterRule        = typeof filterRules.$inferSelect
export type Asset             = typeof assets.$inferSelect
export type NetWorthSnapshot  = typeof netWorthSnapshots.$inferSelect
export type AiSettings        = typeof aiSettings.$inferSelect
