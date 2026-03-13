import { Router } from 'express'
import { db } from '../db/index.js'
import { filterRules, transactions, categories } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { applyRules, suggestRules } from '../services/rules.js'

export const filtersRouter = Router()

// ── List rules ────────────────────────────────────────────────────────────────
filtersRouter.get('/', (_req, res) => {
  const rules = db.select({
    id:           filterRules.id,
    name:         filterRules.name,
    pattern:      filterRules.pattern,
    matchType:    filterRules.matchType,
    categoryId:   filterRules.categoryId,
    categoryName: categories.name,
    bucketId:     filterRules.bucketId,
    priority:     filterRules.priority,
    isActive:     filterRules.isActive,
    matchedCount: filterRules.matchedCount,
    createdAt:    filterRules.createdAt,
  })
    .from(filterRules)
    .leftJoin(categories, eq(filterRules.categoryId, categories.id))
    .all()

  res.json({ rules })
})

// ── Rule CRUD ─────────────────────────────────────────────────────────────────
const RuleSchema = z.object({
  name:       z.string().min(1),
  pattern:    z.string().min(1),
  matchType:  z.enum(['keyword', 'regex', 'ai']).default('keyword'),
  categoryId: z.number().int().positive().optional(),
  bucketId:   z.number().int().positive().optional(),
  priority:   z.number().int().default(0),
})

filtersRouter.post('/', (req, res) => {
  const parsed = RuleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const row = db.insert(filterRules).values(parsed.data).returning().get()
  res.status(201).json(row)
})

filtersRouter.put('/:id', (req, res) => {
  const id     = Number(req.params.id)
  const parsed = RuleSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  db.update(filterRules).set(parsed.data).where(eq(filterRules.id, id)).run()
  res.json({ ok: true })
})

filtersRouter.patch('/:id/toggle', (req, res) => {
  const id   = Number(req.params.id)
  const rule = db.select().from(filterRules).where(eq(filterRules.id, id)).get()
  if (!rule) return res.status(404).json({ error: 'Not found' })

  db.update(filterRules).set({ isActive: !rule.isActive }).where(eq(filterRules.id, id)).run()
  res.json({ ok: true, isActive: !rule.isActive })
})

filtersRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  db.delete(filterRules).where(eq(filterRules.id, id)).run()
  res.json({ ok: true })
})

// ── Test a rule against recent transactions ───────────────────────────────────
filtersRouter.post('/test', (req, res) => {
  const schema = z.object({ pattern: z.string(), matchType: z.enum(['keyword', 'regex', 'ai']) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const recent = db.select().from(transactions)
    .orderBy(desc(transactions.date))
    .limit(100)
    .all()

  const matches = recent.filter((tx) => {
    const merchant = tx.merchantName ?? tx.originalDescription ?? ''
    if (parsed.data.matchType === 'keyword') {
      return merchant.toLowerCase().includes(parsed.data.pattern.toLowerCase())
    }
    try {
      return new RegExp(parsed.data.pattern, 'i').test(merchant)
    } catch {
      return false
    }
  })

  res.json({ matchCount: matches.length, sample: matches.slice(0, 5) })
})

// ── Apply all rules to uncategorized transactions ─────────────────────────────
filtersRouter.post('/apply', async (_req, res) => {
  const uncategorized = db.select().from(transactions)
    .where(eq(transactions.categoryId, null as any))
    .all()

  let applied = 0
  for (const tx of uncategorized) {
    const merchant = tx.merchantName ?? tx.originalDescription ?? ''
    const result   = await applyRules(merchant, tx.originalDescription ?? undefined)
    if (result.categoryId) {
      db.update(transactions)
        .set({ categoryId: result.categoryId, updatedAt: new Date().toISOString() })
        .where(eq(transactions.id, tx.id))
        .run()
      // Increment matched count
      if (result.ruleId) {
        const rule = db.select().from(filterRules).where(eq(filterRules.id, result.ruleId)).get()
        if (rule) db.update(filterRules).set({ matchedCount: rule.matchedCount + 1 }).where(eq(filterRules.id, result.ruleId)).run()
      }
      applied++
    }
  }

  res.json({ applied, total: uncategorized.length })
})

// ── Get rule suggestions based on transaction patterns ────────────────────────
filtersRouter.get('/suggestions', (_req, res) => {
  const suggestions = suggestRules()
  res.json({ suggestions })
})
