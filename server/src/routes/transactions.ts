import { Router } from 'express'
import { db } from '../db/index.js'
import { transactions, categories, accounts, corrections, filterRules } from '../db/schema.js'
import { eq, desc, and, gte, lte, like, sql } from 'drizzle-orm'
import { z } from 'zod'
import { applyRules } from '../services/rules.js'

export const transactionsRouter = Router()

// ── List transactions ─────────────────────────────────────────────────────────
transactionsRouter.get('/', (req, res) => {
  const limit    = Number(req.query.limit ?? 50)
  const offset   = Number(req.query.offset ?? 0)
  const search   = req.query.search as string | undefined
  const from     = req.query.from as string | undefined
  const to       = req.query.to as string | undefined
  const catId    = req.query.categoryId ? Number(req.query.categoryId) : undefined
  const accountId = req.query.accountId ? Number(req.query.accountId) : undefined

  const conditions = []
  if (from)      conditions.push(gte(transactions.date, from))
  if (to)        conditions.push(lte(transactions.date, to))
  if (catId)     conditions.push(eq(transactions.categoryId, catId))
  if (accountId) conditions.push(eq(transactions.accountId, accountId))
  if (search)    conditions.push(like(transactions.merchantName, `%${search}%`))

  const rows = db
    .select({
      id:                  transactions.id,
      accountId:           transactions.accountId,
      amount:              transactions.amount,
      date:                transactions.date,
      merchantName:        transactions.merchantName,
      originalDescription: transactions.originalDescription,
      categoryId:          transactions.categoryId,
      categoryName:        categories.name,
      categoryEmoji:       categories.emoji,
      isPending:           transactions.isPending,
      isManual:            transactions.isManual,
      isTransfer:          transactions.isTransfer,
      isOutlier:           transactions.isOutlier,
      notes:               transactions.notes,
      accountName:         accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date))
    .limit(limit)
    .offset(offset)
    .all()

  res.json({ transactions: rows, limit, offset })
})

// ── Create manual transaction ─────────────────────────────────────────────────
const TransactionSchema = z.object({
  accountId:    z.number().int().positive(),
  amount:       z.number(),
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchantName: z.string().optional(),
  categoryId:   z.number().int().positive().optional(),
  notes:        z.string().optional(),
  isTransfer:   z.boolean().optional(),
})

transactionsRouter.post('/', async (req, res) => {
  const parsed = TransactionSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const data = parsed.data
  // Auto-classify if no category provided
  if (!data.categoryId && data.merchantName) {
    const classified = await applyRules(data.merchantName)
    if (classified.categoryId) data.categoryId = classified.categoryId
  }

  const row = db.insert(transactions)
    .values({ ...data, isManual: true, originalDescription: data.merchantName })
    .returning()
    .get()
  res.status(201).json(row)
})

// ── Update transaction (recategorize, notes, etc.) ────────────────────────────
transactionsRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id)
  const UpdateSchema = z.object({
    categoryId: z.number().int().positive().optional(),
    notes:      z.string().optional(),
    isTransfer: z.boolean().optional(),
    isOutlier:  z.boolean().optional(),
  })
  const parsed = UpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  db.update(transactions)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(transactions.id, id))
    .run()
  res.json({ ok: true })
})

// ── Correct transaction category + auto-promote to rule ───────────────────────
transactionsRouter.patch('/:id/correct', (req, res) => {
  const id     = Number(req.params.id)
  const schema = z.object({ categoryId: z.number().int().positive() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { categoryId } = parsed.data

  // Fetch the transaction
  const tx = db.select().from(transactions).where(eq(transactions.id, id)).get()
  if (!tx) return res.status(404).json({ error: 'Transaction not found' })

  // Update category
  db.update(transactions)
    .set({ categoryId, updatedAt: new Date().toISOString() })
    .where(eq(transactions.id, id))
    .run()

  // Record the correction
  db.insert(corrections).values({
    transactionId:  id,
    merchantName:   tx.merchantName,
    fromCategoryId: tx.categoryId,
    toCategoryId:   categoryId,
  }).run()

  // Count corrections for this merchant → category
  const merchantName = tx.merchantName
  if (!merchantName) return res.json({ promoted: false, correctionCount: 1 })

  const countRow = db
    .select({ count: sql<number>`count(*)` })
    .from(corrections)
    .where(and(
      eq(corrections.merchantName, merchantName),
      eq(corrections.toCategoryId, categoryId)
    ))
    .get()

  const correctionCount = countRow?.count ?? 0

  if (correctionCount >= 3) {
    // Check if an active keyword/regex rule already covers this merchant
    const existingRules = db.select().from(filterRules)
      .where(and(eq(filterRules.isActive, true), eq(filterRules.categoryId, categoryId)))
      .all()

    const alreadyCovered = existingRules.some((rule) => {
      if (rule.matchType === 'keyword') {
        return merchantName.toLowerCase().includes(rule.pattern.toLowerCase())
      } else if (rule.matchType === 'regex') {
        try { return new RegExp(rule.pattern, 'i').test(merchantName) } catch { return false }
      }
      return false
    })

    if (!alreadyCovered) {
      const category = db.select().from(categories).where(eq(categories.id, categoryId)).get()
      const categoryName = category?.name ?? String(categoryId)

      const rule = db.insert(filterRules).values({
        name:      `${merchantName} → ${categoryName}`,
        pattern:   merchantName.toLowerCase(),
        matchType: 'keyword',
        categoryId,
        priority:  5,
        isActive:  true,
      }).returning().get()

      return res.json({ promoted: true, rule, correctionCount })
    }
  }

  res.json({ promoted: false, correctionCount })
})

transactionsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  db.delete(transactions).where(eq(transactions.id, id)).run()
  res.json({ ok: true })
})

// ── Categories ────────────────────────────────────────────────────────────────
transactionsRouter.get('/categories', (_req, res) => {
  const rows = db.select().from(categories).all()
  res.json({ categories: rows })
})

// ── Spending summary (current month by category) ──────────────────────────────
transactionsRouter.get('/summary/monthly', (req, res) => {
  const year  = req.query.year  ? Number(req.query.year)  : new Date().getFullYear()
  const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1
  const from  = `${year}-${String(month).padStart(2, '0')}-01`
  const to    = `${year}-${String(month).padStart(2, '0')}-31`

  const rows = db
    .select({
      categoryId:    transactions.categoryId,
      categoryName:  categories.name,
      categoryEmoji: categories.emoji,
      amount:        transactions.amount,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(gte(transactions.date, from), lte(transactions.date, to)))
    .all()

  // Group and sum by category
  const byCat: Record<number, { name: string; emoji: string | null; total: number }> = {}
  for (const r of rows) {
    if (r.amount >= 0) continue  // exclude income
    const cid = r.categoryId ?? 0
    if (!byCat[cid]) byCat[cid] = { name: r.categoryName ?? 'Uncategorized', emoji: r.categoryEmoji, total: 0 }
    byCat[cid].total += Math.abs(r.amount)
  }

  const totalIncome   = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0)
  const totalExpenses = rows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0)

  res.json({
    year, month,
    totalIncome,
    totalExpenses,
    byCategory: Object.entries(byCat).map(([id, data]) => ({ categoryId: Number(id), ...data })),
  })
})
