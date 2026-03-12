import { db } from '../db/index.js'
import {
  accounts, assets, transactions, categories,
  budgetBuckets, budgetPeriods, goals, incomeRecords, netWorthSnapshots,
} from '../db/schema.js'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { format, subMonths } from 'date-fns'

// ── Tool definitions (for MCP manifest) ──────────────────────────────────────
export const toolDefinitions = [
  {
    name: 'get_net_worth',
    description: 'Get current net worth including breakdown of assets, liabilities, and account balances',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_budget_status',
    description: 'Get current month budget status per envelope bucket including spent vs allocated',
    inputSchema: {
      type: 'object',
      properties: {
        year:  { type: 'number', description: 'Year (defaults to current)' },
        month: { type: 'number', description: 'Month 1-12 (defaults to current)' },
      },
    },
  },
  {
    name: 'list_transactions',
    description: 'List recent transactions with optional date range and category filters',
    inputSchema: {
      type: 'object',
      properties: {
        from:       { type: 'string', description: 'Start date YYYY-MM-DD' },
        to:         { type: 'string', description: 'End date YYYY-MM-DD' },
        limit:      { type: 'number', description: 'Max results (default 50)' },
        categoryId: { type: 'number', description: 'Filter by category ID' },
      },
    },
  },
  {
    name: 'get_income_summary',
    description: 'Get income history, monthly averages (with/without outliers), and annual run rate',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_goals',
    description: 'Get all savings goals with progress, months remaining, and completion status',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_spending_by_category',
    description: 'Get spending breakdown by category for a given month',
    inputSchema: {
      type: 'object',
      properties: {
        year:  { type: 'number' },
        month: { type: 'number' },
      },
    },
  },
  {
    name: 'get_net_worth_history',
    description: 'Get historical net worth snapshots for trend analysis',
    inputSchema: {
      type: 'object',
      properties: {
        months: { type: 'number', description: 'Number of months of history (default 24)' },
      },
    },
  },
  {
    name: 'get_profile',
    description: 'Get user profile including age, location, occupation, and income expectations',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
]

// ── Tool handlers ─────────────────────────────────────────────────────────────
export async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_net_worth': {
      const allAccounts = db.select().from(accounts).all()
      const allAssets   = db.select().from(assets).all()

      const liquid    = allAccounts.filter((a) => ['checking', 'savings'].includes(a.type)).reduce((s, a) => s + a.balanceCurrent, 0)
      const invest    = allAccounts.filter((a) => ['investment', 'retirement'].includes(a.type)).reduce((s, a) => s + a.balanceCurrent, 0)
      const liab      = allAccounts.filter((a) => a.balanceCurrent < 0).reduce((s, a) => s + a.balanceCurrent, 0)
      const physical  = allAssets.reduce((s, a) => s + a.currentValue, 0)
      const netWorth  = liquid + invest + physical + liab

      return {
        netWorth,
        breakdown: {
          liquidAssets:    liquid,
          investments:     invest,
          physicalAssets:  physical,
          totalLiabilities: Math.abs(liab),
        },
        accounts: allAccounts.map((a) => ({ name: a.name, type: a.type, balance: a.balanceCurrent })),
        assets:   allAssets.map((a) => ({ name: a.name, type: a.type, value: a.currentValue })),
      }
    }

    case 'get_budget_status': {
      const year  = (args.year  as number) || new Date().getFullYear()
      const month = (args.month as number) || new Date().getMonth() + 1

      const buckets = db.select().from(budgetBuckets).where(eq(budgetBuckets.isActive, true)).all()
      const periods = db.select().from(budgetPeriods)
        .where(and(eq(budgetPeriods.year, year), eq(budgetPeriods.month, month)))
        .all()
      const periodMap = Object.fromEntries(periods.map((p) => [p.bucketId, p]))

      return {
        year, month,
        buckets: buckets.map((b) => {
          const p = periodMap[b.id]
          const allocated = p?.allocated ?? b.monthlyLimit
          const spent     = p?.spent ?? 0
          return {
            name:      b.name,
            allocated,
            spent,
            remaining: allocated - spent,
            pct:       allocated > 0 ? Math.round((spent / allocated) * 100) : 0,
            isOver:    spent > allocated,
          }
        }),
      }
    }

    case 'list_transactions': {
      const limit  = (args.limit as number) || 50
      const from   = args.from as string | undefined
      const to     = args.to   as string | undefined
      const catId  = args.categoryId as number | undefined

      const conditions = []
      if (from)  conditions.push(gte(transactions.date, from))
      if (to)    conditions.push(lte(transactions.date, to))
      if (catId) conditions.push(eq(transactions.categoryId, catId))

      const rows = db.select({
        date:         transactions.date,
        merchant:     transactions.merchantName,
        amount:       transactions.amount,
        categoryName: categories.name,
      })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(transactions.date))
        .limit(limit)
        .all()

      return { transactions: rows }
    }

    case 'get_income_summary': {
      const records = db.select().from(incomeRecords).orderBy(desc(incomeRecords.date)).all()
      const all     = records.map((r) => r.amount)
      const noOut   = records.filter((r) => !r.isOutlier).map((r) => r.amount)
      const avg     = all.length   ? Math.round(all.reduce((s, v) => s + v, 0) / all.length) : 0
      const avgFlt  = noOut.length ? Math.round(noOut.reduce((s, v) => s + v, 0) / noOut.length) : avg

      return {
        avgMonthly:         avg,
        avgMonthlyFiltered: avgFlt,
        annualRunRate:      avg * 12,
        outlierCount:       records.filter((r) => r.isOutlier).length,
        recentMonths:       records.slice(0, 6).map((r) => ({ date: r.date, amount: r.amount, isOutlier: r.isOutlier })),
      }
    }

    case 'get_goals': {
      const rows = db.select().from(goals).all()
      return {
        goals: rows.map((g) => ({
          name:                g.name,
          targetAmount:        g.targetAmount,
          currentAmount:       g.currentAmount,
          percentDone:         Math.round((g.currentAmount / g.targetAmount) * 100),
          monthlyContribution: g.monthlyContribution,
          monthsLeft:          g.monthlyContribution > 0
            ? Math.ceil((g.targetAmount - g.currentAmount) / g.monthlyContribution)
            : null,
          deadline:    g.deadline,
          isCompleted: g.isCompleted,
        })),
      }
    }

    case 'get_spending_by_category': {
      const year  = (args.year  as number) || new Date().getFullYear()
      const month = (args.month as number) || new Date().getMonth() + 1
      const from  = `${year}-${String(month).padStart(2, '0')}-01`
      const to    = `${year}-${String(month).padStart(2, '0')}-31`

      const rows = db.select({
        categoryName:  categories.name,
        amount:        transactions.amount,
      })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(gte(transactions.date, from), lte(transactions.date, to)))
        .all()

      const byCat: Record<string, number> = {}
      for (const r of rows) {
        if (r.amount >= 0) continue
        const name = r.categoryName ?? 'Uncategorized'
        byCat[name] = (byCat[name] ?? 0) + Math.abs(r.amount)
      }

      return {
        year, month,
        totalExpenses: Object.values(byCat).reduce((s, v) => s + v, 0),
        byCategory:    Object.entries(byCat)
          .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
          .sort((a, b) => b.total - a.total),
      }
    }

    case 'get_net_worth_history': {
      const months = (args.months as number) || 24
      const rows   = db.select().from(netWorthSnapshots)
        .orderBy(desc(netWorthSnapshots.date))
        .limit(months)
        .all()
      return { snapshots: rows.reverse() }
    }

    case 'get_profile': {
      const { profile: profileTable } = await import('../db/schema.js')
      const p = db.select().from(profileTable).get()
      return p ?? {}
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
