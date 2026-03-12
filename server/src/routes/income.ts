import { Router } from 'express'
import { db } from '../db/index.js'
import { incomeRecords, netWorthSnapshots } from '../db/schema.js'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

export const incomeRouter = Router()

// ── Income history ────────────────────────────────────────────────────────────
incomeRouter.get('/', (_req, res) => {
  const records = db.select().from(incomeRecords).orderBy(desc(incomeRecords.date)).all()

  const all    = records.map((r) => r.amount)
  const noOut  = records.filter((r) => !r.isOutlier).map((r) => r.amount)

  const avg    = all.length    ? Math.round(all.reduce((s, v) => s + v, 0)   / all.length)   : 0
  const avgFlt = noOut.length  ? Math.round(noOut.reduce((s, v) => s + v, 0) / noOut.length) : avg

  const latest        = records[0]?.amount ?? 0
  const outlierCount  = records.filter((r) => r.isOutlier).length

  res.json({
    records,
    avgMonthly:          avg,
    avgMonthlyFiltered:  avgFlt,
    annualRunRate:       avg * 12,
    latestMonth:         latest,
    outlierCount,
  })
})

// ── Add income record ─────────────────────────────────────────────────────────
const IncomeSchema = z.object({
  amount:        z.number().positive(),
  source:        z.string().optional(),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isOutlier:     z.boolean().default(false),
  outlierReason: z.string().optional(),
  notes:         z.string().optional(),
})

incomeRouter.post('/', (req, res) => {
  const parsed = IncomeSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const row = db.insert(incomeRecords).values(parsed.data).returning().get()
  res.status(201).json(row)
})

incomeRouter.patch('/:id', (req, res) => {
  const id     = Number(req.params.id)
  const parsed = IncomeSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  db.update(incomeRecords).set(parsed.data).where(eq(incomeRecords.id, id)).run()
  res.json({ ok: true })
})

// ── Toggle outlier flag ───────────────────────────────────────────────────────
incomeRouter.post('/:id/toggle-outlier', (req, res) => {
  const id     = Number(req.params.id)
  const record = db.select().from(incomeRecords).where(eq(incomeRecords.id, id)).get()
  if (!record) return res.status(404).json({ error: 'Not found' })

  db.update(incomeRecords)
    .set({ isOutlier: !record.isOutlier })
    .where(eq(incomeRecords.id, id))
    .run()
  res.json({ ok: true, isOutlier: !record.isOutlier })
})

// ── Net worth history ─────────────────────────────────────────────────────────
incomeRouter.get('/net-worth-history', (_req, res) => {
  const rows = db.select().from(netWorthSnapshots)
    .orderBy(desc(netWorthSnapshots.date))
    .all()
  res.json({ snapshots: rows.reverse() })
})
