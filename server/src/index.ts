import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { migrate } from './db/index.js'
import { seed } from './db/seed.js'
import { profileRouter }     from './routes/profile.js'
import { accountsRouter }    from './routes/accounts.js'
import { transactionsRouter }from './routes/transactions.js'
import { budgetRouter }      from './routes/budget.js'
import { goalsRouter }       from './routes/goals.js'
import { incomeRouter }      from './routes/income.js'
import { filtersRouter }     from './routes/filters.js'
import { settingsRouter }    from './routes/settings.js'
import { toolDefinitions, callTool } from './mcp/tools.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app       = express()
const PORT      = Number(process.env.PORT ?? 3001)

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }))
app.use(express.json())

// ── DB init ───────────────────────────────────────────────────────────────────
migrate()
await seed()

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/profile',      profileRouter)
app.use('/api/accounts',     accountsRouter)
app.use('/api/transactions',  transactionsRouter)
app.use('/api/budget',       budgetRouter)
app.use('/api/goals',        goalsRouter)
app.use('/api/income',       incomeRouter)
app.use('/api/filters',      filtersRouter)
app.use('/api/settings',     settingsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0', name: 'Little Lotta Money' })
})

// ── Summary (dashboard aggregate) ────────────────────────────────────────────
app.get('/api/summary', async (_req, res) => {
  try {
    const [netWorth, budget, income] = await Promise.all([
      fetch(`http://localhost:${PORT}/api/accounts/net-worth`).then((r) => r.json()),
      fetch(`http://localhost:${PORT}/api/budget`).then((r) => r.json()),
      fetch(`http://localhost:${PORT}/api/income`).then((r) => r.json()),
    ])
    res.json({
      netWorth:          (netWorth as any).netWorth,
      totalAssets:       (netWorth as any).totalAssets,
      totalLiabilities:  (netWorth as any).totalLiabilities,
      monthlyIncome:     (income as any).avgMonthlyFiltered,
      monthlyExpenses:   (budget as any).spent,
      savingsRate:       (income as any).avgMonthlyFiltered > 0
        ? Math.round(((income as any).avgMonthlyFiltered - (budget as any).spent) / (income as any).avgMonthlyFiltered * 100 * 10) / 10
        : 0,
    })
  } catch {
    res.status(500).json({ error: 'Failed to aggregate summary' })
  }
})

// ── MCP endpoint (HTTP transport for Claude Desktop / LM Studio) ──────────────
app.get('/mcp', (_req, res) => {
  res.json({
    name:        'little-lotta-money',
    version:     '0.1.0',
    description: 'MCP server exposing your Little Lotta Money financial data to AI assistants',
    tools:       toolDefinitions,
  })
})

app.post('/mcp/call', async (req, res) => {
  const { tool, args } = req.body as { tool: string; args: Record<string, unknown> }
  if (!tool) return res.status(400).json({ error: 'Missing tool name' })
  try {
    const result = await callTool(tool, args ?? {})
    res.json({ result })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// ── Serve built frontend in production ───────────────────────────────────────
const clientDist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`\n  🪙  Little Lotta Money`)
  console.log(`  ➜  API:      http://localhost:${PORT}/api`)
  console.log(`  ➜  MCP:      http://localhost:${PORT}/mcp`)
  console.log(`  ➜  App:      http://localhost:3000 (dev) | http://localhost:${PORT} (prod)\n`)
})
