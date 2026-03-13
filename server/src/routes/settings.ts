import { Router } from 'express'
import { sqlite } from '../db/index.js'
import { getAiConfig } from '../services/ai.js'
import { z } from 'zod'

export const settingsRouter = Router()

// ── GET /api/settings/ai ──────────────────────────────────────────────────────
settingsRouter.get('/ai', (_req, res) => {
  const config = getAiConfig(sqlite)
  res.json(config)
})

// ── PUT /api/settings/ai ──────────────────────────────────────────────────────
settingsRouter.put('/ai', (req, res) => {
  const schema = z.object({
    endpoint: z.string().optional(),
    model:    z.string().optional(),
    enabled:  z.boolean().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { endpoint, model, enabled } = parsed.data
  const now = new Date().toISOString()

  const upsert = sqlite.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)

  if (endpoint !== undefined) upsert.run('ai_endpoint', endpoint, now)
  if (model     !== undefined) upsert.run('ai_model', model, now)
  if (enabled   !== undefined) upsert.run('ai_enabled', enabled ? 'true' : 'false', now)

  res.json({ ok: true })
})

// ── POST /api/settings/ai/test ────────────────────────────────────────────────
settingsRouter.post('/ai/test', async (_req, res) => {
  const config = getAiConfig(sqlite)

  try {
    const response = await fetch(`${config.endpoint}/models`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return res.json({ ok: false, error: `HTTP ${response.status}` })
    }

    const data = await response.json()
    const models: string[] = (data.data ?? []).map((m: any) => m.id ?? m.name).filter(Boolean)
    res.json({ ok: true, models })
  } catch (e: any) {
    res.json({ ok: false, error: e.message ?? 'Connection failed' })
  }
})
