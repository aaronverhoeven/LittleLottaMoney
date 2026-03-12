import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from 'recharts'
import { AlertCircle } from 'lucide-react'
import { Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { monthlyIncome, netWorthHistory } from '@/lib/mock-data'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function Income() {
  const [filterOutliers, setFilterOutliers] = useState(false)

  const filtered = filterOutliers ? monthlyIncome.filter((m) => !m.isOutlier) : monthlyIncome
  const avg = Math.round(filtered.reduce((s, m) => s + m.amount, 0) / filtered.length)
  const avgAll = Math.round(monthlyIncome.reduce((s, m) => s + m.amount, 0) / monthlyIncome.length)
  const outlierCount = monthlyIncome.filter((m) => m.isOutlier).length

  const chartData = monthlyIncome.map((m) => ({
    ...m,
    fill: m.isOutlier ? 'hsl(38,92%,50%)' : 'hsl(160,84%,39%)',
    dimmed: filterOutliers && m.isOutlier,
  }))

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Avg Monthly (filtered)"
          value={formatCurrency(avg)}
          subValue={filterOutliers ? `Excl. ${outlierCount} outlier${outlierCount > 1 ? 's' : ''}` : 'Including all'}
          subValuePositive={true}
          accent
        />
        <StatCard
          label="Avg Monthly (all)"
          value={formatCurrency(avgAll)}
          subValue={`${outlierCount} outlier${outlierCount > 1 ? 's' : ''} detected`}
          subValuePositive={false}
        />
        <StatCard
          label="Last Month"
          value={formatCurrency(monthlyIncome[monthlyIncome.length - 1].amount)}
          subValue={formatPercent(((monthlyIncome[monthlyIncome.length - 1].amount - avg) / avg) * 100) + ' vs avg'}
          subValuePositive={monthlyIncome[monthlyIncome.length - 1].amount >= avg}
        />
        <StatCard
          label="Annual Run Rate"
          value={formatCurrency(avg * 12)}
          subValue="Based on avg monthly"
          subValuePositive={true}
        />
      </div>

      {/* Chart */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold">Monthly Income</h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              12-month history · {outlierCount} outlier{outlierCount !== 1 ? 's' : ''} detected
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              className="relative w-9 h-5 rounded-full transition-colors duration-200"
              style={{ backgroundColor: filterOutliers ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
              onClick={() => setFilterOutliers(!filterOutliers)}
            >
              <div
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                style={{ transform: filterOutliers ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              Filter outliers
            </span>
          </label>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, true)} />
            <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), 'Income']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: '8px', fontSize: '12px',
              }} />
            <ReferenceLine y={avg} stroke="hsl(var(--primary))" strokeDasharray="4 4"
              label={{ value: 'Avg', position: 'right', fontSize: 11, fill: 'hsl(var(--primary))' }} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}
              fill="hsl(160,84%,39%)"
              opacity={1}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Outlier callout */}
        {outlierCount > 0 && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg"
            style={{ backgroundColor: 'hsl(38,92%,50%,0.1)', border: '1px solid hsl(38,92%,50%,0.3)' }}>
            <AlertCircle size={14} style={{ color: 'hsl(38,92%,50%)' }} className="mt-0.5 shrink-0" />
            <p className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
              <strong>Jul 24</strong> was flagged as an outlier ({formatCurrency(22500)}) — likely a bonus or one-time payment.
              Enable "Filter outliers" to exclude it from your average.
            </p>
          </div>
        )}
      </Card>

      {/* Net Worth Trend */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold">Net Worth Over Time</h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Assets vs liabilities · 24 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              Assets
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'hsl(var(--negative))' }} />
              Liabilities
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={netWorthHistory} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, true)} />
            <Tooltip formatter={(v: unknown, name: unknown) => [formatCurrency(Number(v)), String(name)]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: '8px', fontSize: '12px',
              }} />
            <Line type="monotone" dataKey="assets" stroke="hsl(160,84%,39%)" strokeWidth={2} dot={false} name="Assets" />
            <Line type="monotone" dataKey="liabilities" stroke="hsl(0,72%,51%)" strokeWidth={2} dot={false} name="Liabilities" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Income Sources */}
      <Card>
        <h2 className="text-sm font-semibold mb-4">Income Sources</h2>
        <div className="space-y-3">
          {[
            { name: 'Salary — Acme Corp', amount: 7400, type: 'Primary', recurring: true },
            { name: 'Freelance consulting', amount: 0, type: 'Variable', recurring: false },
            { name: 'Investment dividends', amount: 0, type: 'Passive', recurring: false },
          ].map((source, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-sm"
              style={{ borderBottom: i < 2 ? '1px solid hsl(var(--border))' : 'none' }}>
              <div>
                <p className="font-medium text-xs">{source.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{source.type}</p>
              </div>
              <div className="flex items-center gap-3">
                {source.recurring && <Badge variant="success">Recurring</Badge>}
                <span className="font-semibold text-sm" style={{ color: source.amount > 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                  {source.amount > 0 ? formatCurrency(source.amount) + '/mo' : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
