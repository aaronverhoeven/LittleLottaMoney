import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0', name: 'Little Lotta Money' })
})

// ── Stub API routes (POC — will be replaced by full implementation) ───────────
app.get('/api/summary', (_req, res) => {
  res.json({
    netWorth: 95180,
    monthlyIncome: 7400,
    monthlyExpenses: 5233,
    savingsRate: 29.3,
  })
})

app.get('/api/accounts', (_req, res) => {
  res.json({ accounts: [], message: 'Connect via Plaid or add manually' })
})

app.get('/api/transactions', (_req, res) => {
  res.json({ transactions: [], cursor: null })
})

app.get('/api/budget', (_req, res) => {
  res.json({ buckets: [], slushFund: 0 })
})

// ── MCP endpoint stub ─────────────────────────────────────────────────────────
app.get('/mcp', (_req, res) => {
  res.json({
    name: 'little-lotta-money',
    version: '0.1.0',
    description: 'MCP server for Little Lotta Money financial data',
    tools: [
      { name: 'get_net_worth', description: 'Get current net worth and breakdown' },
      { name: 'get_budget_status', description: 'Get current month budget status per bucket' },
      { name: 'list_transactions', description: 'List recent transactions with optional filters' },
      { name: 'get_income_summary', description: 'Get income history and averages' },
      { name: 'get_goals', description: 'Get savings goals and progress' },
      { name: 'classify_transaction', description: 'Auto-classify a transaction using rules + AI' },
    ],
  })
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
  console.log(`  ➜  App:      http://localhost:3000 (dev) or http://localhost:${PORT} (prod)\n`)
})
