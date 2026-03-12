import { Router } from 'express'
import { db } from '../db/index.js'
import { goals } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const goalsRouter = Router()

goalsRouter.get('/', (_req, res) => {
  const rows = db.select().from(goals).all()
  const enriched = rows.map((g) => {
    const remaining   = g.targetAmount - g.currentAmount
    const monthsLeft  = g.monthlyContribution > 0 ? Math.ceil(remaining / g.monthlyContribution) : null
    const percentDone = Math.round((g.currentAmount / g.targetAmount) * 100)
    return { ...g, remaining, monthsLeft, percentDone }
  })
  res.json({ goals: enriched })
})

const GoalSchema = z.object({
  name:                z.string().min(1),
  targetAmount:        z.number().positive(),
  currentAmount:       z.number().min(0).default(0),
  monthlyContribution: z.number().min(0).default(0),
  deadline:            z.string().optional(),
  linkedAccountId:     z.number().int().positive().optional(),
  emoji:               z.string().optional(),
})

goalsRouter.post('/', (req, res) => {
  const parsed = GoalSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const row = db.insert(goals).values(parsed.data).returning().get()
  res.status(201).json(row)
})

goalsRouter.put('/:id', (req, res) => {
  const id     = Number(req.params.id)
  const parsed = GoalSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  db.update(goals)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(goals.id, id))
    .run()
  res.json({ ok: true })
})

// Allocate money to a goal
goalsRouter.post('/:id/allocate', (req, res) => {
  const id = Number(req.params.id)
  const schema = z.object({ amount: z.number().positive() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const goal = db.select().from(goals).where(eq(goals.id, id)).get()
  if (!goal) return res.status(404).json({ error: 'Goal not found' })

  const newAmount = Math.min(goal.currentAmount + parsed.data.amount, goal.targetAmount)
  db.update(goals)
    .set({
      currentAmount: newAmount,
      isCompleted:   newAmount >= goal.targetAmount,
      updatedAt:     new Date().toISOString(),
    })
    .where(eq(goals.id, id))
    .run()
  res.json({ ok: true, currentAmount: newAmount })
})

goalsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  db.delete(goals).where(eq(goals.id, id)).run()
  res.json({ ok: true })
})
