import { RefreshCw, Plus, TrendingUp, TrendingDown, Link2, Car, Home } from 'lucide-react'
import { Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const accountTypeColors: Record<string, string> = {
  checking: '#6366f1',
  savings: '#10b981',
  investment: '#3b82f6',
  retirement: '#8b5cf6',
  credit: '#ef4444',
  loan: '#f59e0b',
}

const accountTypeLabel: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  investment: 'Investment',
  retirement: 'Retirement',
  credit: 'Credit Card',
  loan: 'Loan',
}

export function Accounts() {
  const { data: accountsData } = useApi(() => api.accounts.list())
  const { data: assetsData } = useApi(() => api.accounts.assets())
  const { data: netWorthData } = useApi(() => api.accounts.netWorth())

  const accounts: any[] = accountsData?.accounts ?? []
  const assets: any[] = assetsData?.assets ?? []

  const netWorth: number = netWorthData?.netWorth ?? 0
  const liquidAssets: number = netWorthData?.liquidAssets ?? 0
  const investments: number = netWorthData?.investments ?? 0
  const totalLiabilities: number = netWorthData?.totalLiabilities ?? 0

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Net Worth"
          value={formatCurrency(netWorth)}
          subValue="+$1,420 this month"
          subValuePositive
          accent
        />
        <StatCard
          label="Liquid Assets"
          value={formatCurrency(liquidAssets)}
          subValue="Checking + Savings"
          subValuePositive
        />
        <StatCard
          label="Investments"
          value={formatCurrency(investments)}
          subValue="Brokerage + 401k"
          subValuePositive
        />
        <StatCard
          label="Total Liabilities"
          value={formatCurrency(Math.abs(totalLiabilities))}
          subValue="Credit + Loans"
          subValuePositive={false}
        />
      </div>

      {/* Linked Accounts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Linked Accounts</h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Connected via Plaid
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-muted"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
            >
              <RefreshCw size={12} />
              Sync all
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
            >
              <Link2 size={12} />
              Link Account
            </button>
          </div>
        </div>

        <div className="space-y-0">
          {accounts.map((account: any, i: number) => (
            <div
              key={account.id}
              className="flex items-center justify-between py-3 text-sm"
              style={{ borderBottom: i < accounts.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: accountTypeColors[account.type] ?? '#6366f1' }}
                >
                  {(account.institutionName ?? account.institution ?? '??').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-xs">{account.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="neutral">{accountTypeLabel[account.type] ?? account.type}</Badge>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      · synced {account.lastSyncedAt ?? account.lastSync ?? 'recently'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-sm"
                  style={{ color: (account.balanceCurrent ?? account.balance) < 0 ? 'hsl(var(--negative))' : 'hsl(var(--foreground))' }}
                >
                  {formatCurrency(account.balanceCurrent ?? account.balance ?? 0)}
                </span>
                {(account.balanceCurrent ?? account.balance ?? 0) < 0
                  ? <TrendingDown size={14} style={{ color: 'hsl(var(--negative))' }} />
                  : <TrendingUp size={14} style={{ color: 'hsl(var(--positive))' }} />}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Physical Assets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Physical Assets</h2>
          <button
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
          >
            <Plus size={13} />
            Add Asset
          </button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {assets.map((asset: any) => {
            const gain = (asset.currentValue ?? 0) - (asset.purchaseValue ?? 0)
            const gainPct = asset.purchaseValue > 0 ? ((gain / asset.purchaseValue) * 100).toFixed(1) : '0.0'
            const isDepreciating = asset.type === 'vehicle'

            return (
              <Card key={asset.id}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    {asset.type === 'vehicle'
                      ? <Car size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
                      : <Home size={18} style={{ color: 'hsl(var(--primary))' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{asset.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Purchased {asset.purchaseDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(asset.currentValue ?? 0)}</p>
                        <p className="text-xs mt-0.5" style={{ color: gain >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))' }}>
                          {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gainPct}%)
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between"
                      style={{ borderColor: 'hsl(var(--border))' }}>
                      <div className="text-xs space-y-0.5">
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Purchase price: {formatCurrency(asset.purchaseValue ?? 0)}
                        </p>
                        {asset.depreciationRate && (
                          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Depreciation: ~{asset.depreciationRate}%/yr
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isDepreciating
                          ? <Badge variant="warning">Depreciating</Badge>
                          : <Badge variant="success">Appreciating</Badge>}
                        <Badge variant="neutral">{asset.valuationSource ?? asset.source}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
