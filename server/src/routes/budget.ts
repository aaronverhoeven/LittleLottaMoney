import { Router } from 'express'
import { db } from '../db/index.js'
import { budgetBuckets, budgetPeriods, transactions, categories } from '../db/schema.js'
import { eq, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

export const budgetRouter = Router()

// ── Get current month budget ──────────────────────────────────────────────────
budgetRouter.get('/', (req, res) => {
  const year  = req.query.year  ? Number(req.query.year)  : new Date().getFullYear()
  const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1

  const buckets = db.select().from(budgetBuckets).where(eq(budgetBuckets.isActive, true)).all()
  const periods = db.select().from(budgetPeriods)
    .where(and(eq(budgetPeriods.year, year), eq(budgetPeriods.month, month)))
    .all()

  const periodMap = Object.fromEntries(periods.map((p) => [p.bucketId, p]))

  const result = buckets.map((b) => {
    const period = periodMap[b.id]
    return {
      ...b,
      allocated: period?.allocated ?? b.monthlyLimit,
      spent:     period?.spent ?? 0,
      periodId:  period?.id ?? null,
    }
  })

  const income   = 7400  // TODO: pull from latest income record
  const allocated = result.filter((b) => !b.isSlush).reduce((s, b) => s + b.allocated, 0)
  const spent     = result.filter((b) => !b.isSlush).reduce((s, b) => s + b.spent, 0)
  const slush     = Math.max(0, income - allocated)

  res.json({ year, month, buckets: result, income, allocated, spent, slush })
})

// ── Bucket CRUD ───────────────────────────────────────────────────────────────
const BucketSchema = z.object({
  name:         z.string().min(1),
  monthlyLimit: z.number().min(0),
  color:        z.string().default('#10b981'),
  emoji:        z.string().default('💰'),
  categoryId:   z.number().int().positive().optional(),
})

budgetRouter.post('/buckets', (req, res) => {
  const parsed = BucketSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const maxOrder = db.select().from(budgetBuckets).all()
    .reduce((max, b) => Math.max(max, b.sortOrder), 0)

  const row = db.insert(budgetBuckets)
    .values({ ...parsed.data, sortOrder: maxOrder + 1 })
    .returning()
    .get()
  res.status(201).json(row)
})

budgetRouter.put('/buckets/:id', (req, res) => {
  const id     = Number(req.params.id)
  const parsed = BucketSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  db.update(budgetBuckets).set(parsed.data).where(eq(budgetBuckets.id, id)).run()
  res.json({ ok: true })
})

budgetRouter.delete('/buckets/:id', (req, res) => {
  const id = Number(req.params.id)
  db.update(budgetBuckets).set({ isActive: false }).where(eq(budgetBuckets.id, id)).run()
  res.json({ ok: true })
})

// ── Update period spent/allocated (manual override) ───────────────────────────
budgetRouter.put('/periods/:bucketId', (req, res) => {
  const bucketId = Number(req.params.bucketId)
  const schema   = z.object({
    year:      z.number().int(),
    month:     z.number().int().min(1).max(12),
    allocated: z.number().min(0).optional(),
    spent:     z.number().min(0).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { year, month, ...rest } = parsed.data
  const existing = db.select().from(budgetPeriods)
    .where(and(eq(budgetPeriods.bucketId, bucketId), eq(budgetPeriods.year, year), eq(budgetPeriods.month, month)))
    .get()

  if (existing) {
    db.update(budgetPeriods).set(rest).where(eq(budgetPeriods.id, existing.id)).run()
  } else {
    db.insert(budgetPeriods).values({ bucketId, year, month, ...rest }).run()
  }
  res.json({ ok: true })
})
