import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, ArrowUpRight, Wallet, DollarSign, PiggyBank } from 'lucide-react'
import { Card, StatCard } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border p-3 text-sm shadow-lg"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <p className="font-medium mb-1">{label}</p>
        <p style={{ color: 'hsl(var(--primary))' }}>{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function Dashboard() {
  const { data: summary }   = useApi(() => api.summary())
  const { data: budget }    = useApi(() => api.budget.get())
  const { data: txData }    = useApi(() => api.transactions.list({ limit: 8 }))
  const { data: nwHistory } = useApi(() => api.income.netWorthHistory())

  const buckets   = budget?.buckets?.filter((b: any) => !b.isSlush) ?? []
  const txList    = txData?.transactions ?? []
  const snapshots = (nwHistory?.snapshots ?? []).map((s: any) => ({
    month:    s.date?.slice(0, 7),
    netWorth: s.netWorth,
  }))

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Net Worth" value={formatCurrency(summary?.netWorth ?? 0)}
          subValue="Updated now" subValuePositive
          icon={<TrendingUp size={16} style={{ color: 'hsl(var(--primary))' }} />} accent />
        <StatCard label="Monthly Income" value={formatCurrency(summary?.monthlyIncome ?? 0)}
          subValue="Average (filtered)" subValuePositive
          icon={<DollarSign size={16} style={{ color: 'hsl(var(--primary))' }} />} />
        <StatCard label="Monthly Expenses" value={formatCurrency(summary?.monthlyExpenses ?? 0)}
          subValue={summary ? `${formatCurrency((summary.monthlyIncome ?? 0) - (summary.monthlyExpenses ?? 0))} remaining` : '—'}
          subValuePositive
          icon={<Wallet size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />} />
        <StatCard label="Savings Rate" value={summary ? `${summary.savingsRate}%` : '—'}
          subValue="Based on avg income" subValuePositive
          icon={<PiggyBank size={16} style={{ color: 'hsl(var(--primary))' }} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Net Worth</h2>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>24-month history</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>
              <ArrowUpRight size={16} />{formatCurrency(summary?.netWorth ?? 0)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={snapshots} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, true)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="netWorth" stroke="hsl(160,84%,39%)"
                strokeWidth={2} fill="url(#nwGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Budget This Month</h2>
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {formatCurrency(budget?.spent ?? 0)} / {formatCurrency(budget?.allocated ?? 0)}
            </span>
          </div>
          <div className="space-y-3">
            {buckets.slice(0, 6).map((b: any) => {
              const pct    = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0
              const isOver = b.spent > b.allocated
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span>{b.emoji}</span><span>{b.name}</span>
                    </span>
                    <span style={{ color: isOver ? 'hsl(var(--negative))' : 'hsl(var(--muted-foreground))' }}>{pct}%</span>
                  </div>
                  <ProgressBar value={b.spent} max={b.allocated} color={b.color} />
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Slush Fund</span>
              <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                {formatCurrency(budget?.slush ?? 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <a href="/budget" className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>View all →</a>
        </div>
        <div>
          {txList.length === 0 && (
            <p className="text-xs py-4 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Loading transactions…
            </p>
          )}
          {txList.map((tx: any, i: number) => (
            <div key={tx.id} className="flex items-center justify-between py-2.5 text-sm"
              style={{ borderBottom: i < txList.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                  {(tx.merchantName ?? '??').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs truncate">{tx.merchantName ?? 'Unknown'}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {tx.categoryName ?? 'Uncategorized'} · {tx.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className="font-semibold text-xs"
                  style={{ color: tx.amount > 0 ? 'hsl(var(--positive))' : 'hsl(var(--foreground))' }}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
                {tx.amount < 0
                  ? <TrendingDown size={12} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  : <TrendingUp size={12} style={{ color: 'hsl(var(--positive))' }} />}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
