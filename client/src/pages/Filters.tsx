import { useState } from 'react'
import { Plus, CheckCircle, XCircle, Sparkles, Tag, ChevronRight, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { filterRules, suggestedRules } from '@/lib/mock-data'

export function Filters() {
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* AI Suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: 'hsl(var(--primary))' }} />
          <h2 className="text-sm font-semibold">Suggested Rules</h2>
          <Badge variant="success">{suggestedRules.filter((s) => !dismissed.has(s.id) && !accepted.has(s.id)).length} new</Badge>
        </div>
        <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Based on your recent transactions, these rules would auto-classify{' '}
          <strong>{suggestedRules.reduce((s, r) => s + r.transactions, 0)}</strong> transactions.
        </p>
        <div className="space-y-3">
          {suggestedRules.filter((s) => !dismissed.has(s.id)).map((rule) => (
            <Card key={rule.id} className={accepted.has(rule.id) ? 'opacity-60' : ''}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'hsl(160,84%,39%,0.12)' }}>
                    <Zap size={14} style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{rule.suggestion}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {rule.transactions} transactions · {Math.round(rule.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {accepted.has(rule.id) ? (
                    <Badge variant="success">Accepted</Badge>
                  ) : (
                    <>
                      <button
                        onClick={() => setDismissed((d) => new Set([...d, rule.id]))}
                        className="p-1.5 rounded-lg transition-all hover:bg-red-50"
                        title="Dismiss"
                      >
                        <XCircle size={18} style={{ color: 'hsl(var(--negative))' }} />
                      </button>
                      <button
                        onClick={() => setAccepted((a) => new Set([...a, rule.id]))}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                        style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
                      >
                        <CheckCircle size={13} />
                        Accept
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {suggestedRules.every((s) => dismissed.has(s.id)) && (
            <div className="text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <p className="text-sm">All suggestions reviewed. Check back after new transactions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Rules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Active Rules</h2>
          <button
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
          >
            <Plus size={13} />
            New Rule
          </button>
        </div>

        <Card>
          <div className="space-y-0">
            {filterRules.map((rule, i) => (
              <div
                key={rule.id}
                className="flex items-center justify-between py-3 text-sm group cursor-pointer"
                style={{ borderBottom: i < filterRules.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    <Tag size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{rule.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-xs px-1.5 py-0.5 rounded" style={{
                        backgroundColor: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        fontFamily: 'monospace',
                      }}>
                        {rule.pattern}
                      </code>
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        → {rule.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {rule.matched} matches
                  </span>
                  <Badge variant={rule.active ? 'success' : 'neutral'}>
                    {rule.active ? 'Active' : 'Paused'}
                  </Badge>
                  <ChevronRight size={14} style={{ color: 'hsl(var(--muted-foreground))' }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Rule Types Info */}
      <Card>
        <h3 className="text-sm font-semibold mb-3">Rule Types</h3>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {[
            { type: 'Keyword Match', desc: 'Simple text match on merchant name. Fast and reliable.', example: '"netflix" → Subscriptions' },
            { type: 'Regex Pattern', desc: 'Powerful pattern matching. Great for multiple merchants.', example: '"shell|bp|chevron" → Transport' },
            { type: 'AI Agent Rule', desc: 'Describe it in plain English, AI builds the rule.', example: '"Coffee shops under $15" → Food' },
          ].map((rt) => (
            <div key={rt.type} className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <p className="text-xs font-semibold mb-1">{rt.type}</p>
              <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{rt.desc}</p>
              <code className="text-xs italic" style={{ color: 'hsl(var(--muted-foreground))' }}>{rt.example}</code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
