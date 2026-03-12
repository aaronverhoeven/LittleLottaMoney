import { Router } from 'express'
import { db } from '../db/index.js'
import { accounts, assets } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const accountsRouter = Router()

// ── Accounts ──────────────────────────────────────────────────────────────────
accountsRouter.get('/', (_req, res) => {
  const rows = db.select().from(accounts).all()
  res.json({ accounts: rows })
})

const AccountSchema = z.object({
  name:            z.string().min(1),
  type:            z.enum(['checking', 'savings', 'investment', 'retirement', 'credit', 'loan']),
  subtype:         z.string().optional(),
  institutionName: z.string().optional(),
  balanceCurrent:  z.number(),
  balanceLimit:    z.number().optional(),
  currencyCode:    z.string().default('USD'),
  mask:            z.string().optional(),
})

accountsRouter.post('/', (req, res) => {
  const parsed = AccountSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const row = db.insert(accounts)
    .values({ ...parsed.data, isManual: true })
    .returning()
    .get()
  res.status(201).json(row)
})

accountsRouter.put('/:id', (req, res) => {
  const id     = Number(req.params.id)
  const parsed = AccountSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  db.update(accounts)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(accounts.id, id))
    .run()
  res.json({ ok: true })
})

accountsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  db.update(accounts).set({ isHidden: true }).where(eq(accounts.id, id)).run()
  res.json({ ok: true })
})

// ── Assets ────────────────────────────────────────────────────────────────────
accountsRouter.get('/assets', (_req, res) => {
  const rows = db.select().from(assets).all()
  res.json({ assets: rows })
})

const AssetSchema = z.object({
  name:             z.string().min(1),
  type:             z.enum(['vehicle', 'real_estate', 'other']),
  purchaseValue:    z.number().positive(),
  currentValue:     z.number().positive(),
  purchaseDate:     z.string().optional(),
  depreciationRate: z.number().optional(),
  valuationSource:  z.string().optional(),
  vin:              z.string().optional(),
  address:          z.string().optional(),
  notes:            z.string().optional(),
})

accountsRouter.post('/assets', (req, res) => {
  const parsed = AssetSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const row = db.insert(assets).values(parsed.data).returning().get()
  res.status(201).json(row)
})

accountsRouter.put('/assets/:id', (req, res) => {
  const id     = Number(req.params.id)
  const parsed = AssetSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  db.update(assets)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(assets.id, id))
    .run()
  res.json({ ok: true })
})

accountsRouter.delete('/assets/:id', (req, res) => {
  const id = Number(req.params.id)
  db.delete(assets).where(eq(assets.id, id)).run()
  res.json({ ok: true })
})

// ── Net worth summary ─────────────────────────────────────────────────────────
accountsRouter.get('/net-worth', (_req, res) => {
  const allAccounts = db.select().from(accounts).all()
  const allAssets   = db.select().from(assets).all()

  const liquidAssets   = allAccounts.filter((a) => ['checking', 'savings'].includes(a.type))
    .reduce((s, a) => s + a.balanceCurrent, 0)
  const investments    = allAccounts.filter((a) => ['investment', 'retirement'].includes(a.type))
    .reduce((s, a) => s + a.balanceCurrent, 0)
  const liabilities    = allAccounts.filter((a) => a.balanceCurrent < 0)
    .reduce((s, a) => s + a.balanceCurrent, 0)
  const physicalAssets = allAssets.reduce((s, a) => s + a.currentValue, 0)

  const totalAssets      = liquidAssets + investments + physicalAssets
  const totalLiabilities = Math.abs(liabilities)
  const netWorth         = totalAssets - totalLiabilities

  res.json({ netWorth, totalAssets, totalLiabilities, liquidAssets, investments, physicalAssets })
})
