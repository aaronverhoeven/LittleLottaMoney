import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, ChevronDown, Check, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Transaction {
  id: number
  accountId: number
  amount: number
  date: string
  merchantName: string | null
  originalDescription: string | null
  categoryId: number | null
  categoryName: string | null
  categoryEmoji: string | null
  isPending: boolean
  isManual: boolean
  isTransfer: boolean
  isOutlier: boolean
  notes: string | null
  accountName: string | null
}

interface Category {
  id: number
  name: string
  emoji: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDateGroup(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function groupByDate(txs: Transaction[]): Array<{ date: string; label: string; items: Transaction[] }> {
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const existing = map.get(tx.date)
    if (existing) existing.push(tx)
    else map.set(tx.date, [tx])
  }
  return Array.from(map.entries()).map(([date, items]) => ({
    date,
    label: formatDateGroup(date),
    items,
  }))
}

function MerchantAvatar({ name }: { name: string }) {
  const initials = (name ?? '??').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
    >
      {initials}
    </div>
  )
}

// ── Category Dropdown ─────────────────────────────────────────────────────────
interface CategoryDropdownProps {
  tx: Transaction
  categories: Category[]
  onCorrect: (txId: number, categoryId: number, categoryName: string) => void
}

function CategoryDropdown({ tx, categories, onCorrect }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const isUncategorized = !tx.categoryId

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors',
          isUncategorized
            ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25'
            : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
        )}
      >
        {isUncategorized ? (
          <>
            <AlertCircle size={11} />
            Uncategorized
          </>
        ) : (
          <>{tx.categoryEmoji && <span>{tx.categoryEmoji}</span>}{tx.categoryName}</>
        )}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-52 rounded-lg border shadow-lg"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none"
              style={{
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--foreground))',
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onCorrect(tx.id, cat.id, cat.name)
                  setOpen(false)
                  setSearch('')
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors hover:bg-white/5"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {cat.emoji && <span>{cat.emoji}</span>}
                <span className="flex-1">{cat.name}</span>
                {tx.categoryId === cat.id && (
                  <Check size={12} style={{ color: 'hsl(var(--primary))' }} />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No categories found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Transaction Card ──────────────────────────────────────────────────────────
interface TransactionCardProps {
  tx: Transaction
  categories: Category[]
  onCorrect: (txId: number, categoryId: number, categoryName: string) => void
}

function TransactionCard({ tx, categories, onCorrect }: TransactionCardProps) {
  const isUncategorized = !tx.categoryId
  const displayName = tx.merchantName ?? tx.originalDescription ?? 'Unknown'

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 flex items-center gap-3',
        isUncategorized && 'border-amber-500/30'
      )}
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: isUncategorized ? undefined : 'hsl(var(--border))',
      }}
    >
      <MerchantAvatar name={displayName} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          {tx.isPending && (
            <Badge variant="warning" className="shrink-0">Pending</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <CategoryDropdown tx={tx} categories={categories} onCorrect={onCorrect} />
          {tx.accountName && (
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {tx.accountName}
            </span>
          )}
          {!tx.isPending && (
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              ✓ cleared
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className="text-sm font-semibold"
          style={{ color: tx.amount > 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))' }}
        >
          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
        </p>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((g) => (
        <div key={g}>
          <div className="h-4 w-24 rounded mb-3 animate-pulse" style={{ backgroundColor: 'hsl(var(--muted))' }} />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border h-16 animate-pulse"
                style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function Transactions() {
  const [search, setSearch]             = useState('')
  const [debouncedSearch, setDebounced] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [accountFilter, setAccountFilter]   = useState<number | ''>('')
  const [dateRange, setDateRange]           = useState<'this-month' | 'last-month' | 'all'>('this-month')
  const [txList, setTxList]                 = useState<Transaction[]>([])
  const [offset, setOffset]                 = useState(0)
  const [hasMore, setHasMore]               = useState(true)
  const [loading, setLoading]               = useState(true)

  const { data: categoriesData } = useApi(() => api.transactions.categories())
  const { data: accountsData }   = useApi(() => api.accounts.list())

  const categories: Category[] = categoriesData?.categories ?? []
  const accountsList: any[]    = accountsData?.accounts ?? []

  const LIMIT = 30

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset + reload when filters change
  useEffect(() => {
    setTxList([])
    setOffset(0)
    setHasMore(true)
  }, [debouncedSearch, categoryFilter, accountFilter, dateRange])

  const buildParams = useCallback((off: number) => {
    const now = new Date()
    const params: Record<string, string | number> = { limit: LIMIT, offset: off }

    if (debouncedSearch) params.search = debouncedSearch
    if (categoryFilter)  params.categoryId = categoryFilter
    if (accountFilter)   params.accountId = accountFilter

    if (dateRange === 'this-month') {
      params.from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      params.to   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`
    } else if (dateRange === 'last-month') {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      params.from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      params.to   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-31`
    }
    return params
  }, [debouncedSearch, categoryFilter, accountFilter, dateRange])

  // Initial load
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.transactions.list(buildParams(0)).then((data) => {
      if (cancelled) return
      setTxList(data.transactions ?? [])
      setHasMore((data.transactions ?? []).length === LIMIT)
      setOffset(LIMIT)
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [buildParams])

  function loadMore() {
    api.transactions.list(buildParams(offset)).then((data) => {
      const newTxs = data.transactions ?? []
      setTxList((prev) => [...prev, ...newTxs])
      setHasMore(newTxs.length === LIMIT)
      setOffset((o) => o + LIMIT)
    })
  }

  // Optimistic category correction
  function handleCorrect(txId: number, categoryId: number, categoryName: string) {
    setTxList((prev) => prev.map((tx) =>
      tx.id === txId
        ? { ...tx, categoryId, categoryName, categoryEmoji: categories.find((c) => c.id === categoryId)?.emoji ?? null }
        : tx
    ))
    api.transactions.correct(txId, categoryId).catch(() => {
      // revert on error
      setTxList((prev) => prev.map((tx) =>
        tx.id === txId ? { ...tx, categoryId: null, categoryName: null, categoryEmoji: null } : tx
      ))
    })
  }

  const groups = groupByDate(txList)

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none"
            style={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-lg border outline-none"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.name}</option>
          ))}
        </select>

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value === '' ? '' : Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-lg border outline-none"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        >
          <option value="">All accounts</option>
          {accountsList.map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-3 py-2 text-sm rounded-lg border outline-none"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        >
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Transaction list */}
      {loading ? (
        <Skeleton />
      ) : groups.length === 0 ? (
        <Card>
          <p className="text-sm text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            No transactions found.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.map(({ date, label, items }) => (
            <div key={date}>
              <p className="text-xs font-semibold mb-2 px-1 uppercase tracking-wide"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                {label}
              </p>
              <div className="space-y-2">
                {items.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    tx={tx}
                    categories={categories}
                    onCorrect={handleCorrect}
                  />
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
