import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, ArrowUpRight, Wallet, DollarSign, PiggyBank } from 'lucide-react'
import { Card, StatCard } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  netWorthHistory,
  recentTransactions,
  budgetBuckets,
  summaryStats,
  slushFund,
} from '@/lib/mock-data'
import { formatCurrency, formatPercent } from '@/lib/utils'

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
  const totalBudgeted = budgetBuckets.reduce((s, b) => s + b.allocated, 0)
  const totalSpent = budgetBuckets.reduce((s, b) => s + b.spent, 0)

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Net Worth"
          value={formatCurrency(summaryStats.netWorth)}
          subValue={`${formatPercent(summaryStats.netWorthChangePct)} this month`}
          subValuePositive={summaryStats.netWorthChange > 0}
          icon={<TrendingUp size={16} style={{ color: 'hsl(var(--primary))' }} />}
          accent
        />
        <StatCard
          label="Monthly Income"
          value={formatCurrency(summaryStats.monthlyIncome)}
          subValue="After tax"
          subValuePositive={true}
          icon={<DollarSign size={16} style={{ color: 'hsl(var(--primary))' }} />}
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(summaryStats.monthlyExpenses)}
          subValue={`${formatCurrency(summaryStats.monthlyIncome - summaryStats.monthlyExpenses)} remaining`}
          subValuePositive={true}
          icon={<Wallet size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />}
        />
        <StatCard
          label="Savings Rate"
          value={`${summaryStats.monthlySavingsRate}%`}
          subValue="Above avg for age 31"
          subValuePositive={true}
          icon={<PiggyBank size={16} style={{ color: 'hsl(var(--primary))' }} />}
        />
      </div>

      {/* Net Worth Chart + Budget Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Net Worth Chart */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Net Worth</h2>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>24-month history</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>
              <ArrowUpRight size={16} />
              {formatCurrency(summaryStats.netWorthChange)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={netWorthHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} axisLine={false}
                tickFormatter={(v) => formatCurrency(v, true)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="netWorth" stroke="hsl(160,84%,39%)"
                strokeWidth={2} fill="url(#netWorthGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Budget Snapshot */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Budget This Month</h2>
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
            </span>
          </div>
          <div className="space-y-3">
            {budgetBuckets.slice(0, 6).map((bucket) => {
              const pct = Math.round((bucket.spent / bucket.allocated) * 100)
              const isOver = bucket.spent > bucket.allocated
              return (
                <div key={bucket.id}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span>{bucket.emoji}</span>
                      <span style={{ color: 'hsl(var(--foreground))' }}>{bucket.name}</span>
                    </span>
                    <span className={isOver ? 'font-medium' : ''} style={{ color: isOver ? 'hsl(var(--negative))' : 'hsl(var(--muted-foreground))' }}>
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar value={bucket.spent} max={bucket.allocated} color={bucket.color} />
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Slush Fund</span>
              <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                {formatCurrency(slushFund.available)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <a href="/budget" className="text-xs font-medium transition-colors"
            style={{ color: 'hsl(var(--primary))' }}>
            View all →
          </a>
        </div>
        <div className="space-y-0">
          {recentTransactions.slice(0, 8).map((tx, i) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-2.5 text-sm"
              style={{ borderBottom: i < 7 ? '1px solid hsl(var(--border))' : 'none' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                  {tx.merchant.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs truncate">{tx.merchant}</p>
                  <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{tx.category} · {tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span
                  className="font-semibold text-xs"
                  style={{ color: tx.amount > 0 ? 'hsl(var(--positive))' : 'hsl(var(--foreground))' }}
                >
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
                {tx.amount < 0 ? (
                  <TrendingDown size={12} style={{ color: 'hsl(var(--muted-foreground))' }} />
                ) : (
                  <TrendingUp size={12} style={{ color: 'hsl(var(--positive))' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
