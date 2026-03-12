import { useState } from 'react'
import { Plus, Target, Droplets } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function Budget() {
  const [activeTab, setActiveTab] = useState<'envelopes' | 'goals'>('envelopes')

  const { data: budgetData } = useApi(() => api.budget.get())
  const { data: goalsData } = useApi(() => api.goals.list())

  const budgetBuckets: any[] = budgetData?.buckets ?? []
  const income: number = budgetData?.income ?? 0
  const allocated: number = budgetData?.allocated ?? 0
  const spent: number = budgetData?.spent ?? 0
  const slush: number = budgetData?.slush ?? 0

  const goals: any[] = goalsData?.goals ?? []

  const totalAllocated = allocated || budgetBuckets.reduce((s: number, b: any) => s + b.allocated, 0)
  const totalSpent = spent || budgetBuckets.reduce((s: number, b: any) => s + b.spent, 0)
  const unallocated = income - totalAllocated

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3 xl:col-span-1">
          <Card className="h-full">
            <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Monthly Budget
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Income</span>
                <span className="font-semibold">{formatCurrency(income)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Allocated</span>
                <span className="font-semibold">{formatCurrency(totalAllocated)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Spent</span>
                <span className="font-semibold">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium">Slush Fund</span>
                  <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>
                    {formatCurrency(slush)}
                  </span>
                </div>
                <ProgressBar
                  value={totalAllocated}
                  max={income}
                  size="md"
                />
                <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {formatCurrency(unallocated)} unallocated → slush
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Slush Fund */}
        <div className="col-span-3 xl:col-span-2">
          <Card className="h-full border-dashed" style={{ borderColor: 'hsl(160,84%,39%,0.4)' }}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg shrink-0" style={{ backgroundColor: 'hsl(160,84%,39%,0.12)' }}>
                <Droplets size={18} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Slush Fund</h3>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Your unallocated income lives here. Pull from it when a bucket runs dry, or let it roll into savings at month end.
                </p>
                <div className="flex items-center gap-6 mt-3">
                  <div>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Available</p>
                    <p className="text-xl font-bold mt-0.5" style={{ color: 'hsl(var(--primary))' }}>
                      {formatCurrency(slush)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Monthly income</p>
                    <p className="text-xl font-bold mt-0.5">{formatCurrency(income)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'hsl(var(--muted))' }}>
        {(['envelopes', 'goals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
            style={activeTab === tab
              ? { backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: 'hsl(var(--muted-foreground))' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'envelopes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Envelope Buckets</h2>
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
            >
              <Plus size={13} />
              New Bucket
            </button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {budgetBuckets.map((bucket: any) => {
              const pct = bucket.allocated > 0 ? Math.round((bucket.spent / bucket.allocated) * 100) : 0
              const remaining = bucket.allocated - bucket.spent
              const isOver = bucket.spent > bucket.allocated

              return (
                <Card key={bucket.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{bucket.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{bucket.name}</p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {formatCurrency(bucket.spent)} of {formatCurrency(bucket.allocated)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: isOver ? 'hsl(var(--negative))' : 'hsl(var(--foreground))' }}>
                        {pct}%
                      </p>
                      {isOver ? (
                        <Badge variant="danger">{formatCurrency(Math.abs(remaining))} over</Badge>
                      ) : (
                        <Badge variant="neutral">{formatCurrency(remaining)} left</Badge>
                      )}
                    </div>
                  </div>
                  <ProgressBar value={bucket.spent} max={bucket.allocated} color={bucket.color} size="md" />
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Savings Goals</h2>
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
            >
              <Plus size={13} />
              New Goal
            </button>
          </div>
          <div className="space-y-4">
            {goals.map((goal: any) => {
              const pct = goal.percentDone ?? (goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0)
              const remaining = goal.targetAmount - goal.currentAmount
              const monthsLeft = goal.monthsLeft ?? (goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : 0)

              return (
                <Card key={goal.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        {goal.emoji
                          ? <span className="text-lg">{goal.emoji}</span>
                          : <Target size={16} style={{ color: 'hsl(var(--primary))' }} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{goal.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {formatCurrency(goal.monthlyContribution)}/mo · ~{monthsLeft} months to go
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(goal.currentAmount)}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>of {formatCurrency(goal.targetAmount)}</p>
                    </div>
                  </div>
                  <ProgressBar value={goal.currentAmount} max={goal.targetAmount} size="md" />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {pct}% saved
                    </p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Deadline: {goal.deadline}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
