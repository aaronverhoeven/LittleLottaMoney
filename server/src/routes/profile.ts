import { Router } from 'express'
import { db } from '../db/index.js'
import { profile, aiSettings } from '../db/schema.js'
import { z } from 'zod'

export const profileRouter = Router()

profileRouter.get('/', (_req, res) => {
  const p  = db.select().from(profile).get()
  const ai = db.select().from(aiSettings).get()
  res.json({ profile: p ?? null, aiSettings: ai ?? null })
})

const ProfileSchema = z.object({
  name:         z.string().optional(),
  age:          z.number().int().positive().optional(),
  location:     z.string().optional(),
  occupation:   z.string().optional(),
  employer:     z.string().optional(),
  annualSalary: z.number().positive().optional(),
  currency:     z.string().length(3).optional(),
  darkMode:     z.boolean().optional(),
})

profileRouter.put('/', (req, res) => {
  const parsed = ProfileSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const existing = db.select().from(profile).get()
  if (existing) {
    db.update(profile).set({ ...parsed.data, updatedAt: new Date().toISOString() }).run()
  } else {
    db.insert(profile).values(parsed.data as any).run()
  }
  res.json({ ok: true })
})

const AiSettingsSchema = z.object({
  provider: z.enum(['none', 'claude', 'lmstudio']),
  apiKey:   z.string().optional(),
  model:    z.string().optional(),
  endpoint: z.string().url().optional(),
})

profileRouter.put('/ai-settings', (req, res) => {
  const parsed = AiSettingsSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const existing = db.select().from(aiSettings).get()
  const data = { ...parsed.data, updatedAt: new Date().toISOString() }
  if (existing) {
    db.update(aiSettings).set(data).run()
  } else {
    db.insert(aiSettings).values(data as any).run()
  }
  res.json({ ok: true })
})
