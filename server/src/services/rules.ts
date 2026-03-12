import { db } from '../db/index.js'
import { filterRules, transactions, categories } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

interface RuleMatch {
  categoryId: number | null
  bucketId:   number | null
  ruleId:     number | null
  confidence: number
}

/**
 * Apply active filter rules to a merchant name.
 * Rules are tested in priority order (desc). First match wins.
 */
export function applyRules(merchantName: string): RuleMatch {
  const rules = db.select().from(filterRules)
    .where(eq(filterRules.isActive, true))
    .all()
    .sort((a, b) => b.priority - a.priority)

  const name = merchantName.toLowerCase()

  for (const rule of rules) {
    let matched = false
    if (rule.matchType === 'keyword') {
      matched = name.includes(rule.pattern.toLowerCase())
    } else if (rule.matchType === 'regex') {
      try {
        matched = new RegExp(rule.pattern, 'i').test(merchantName)
      } catch {
        // Invalid regex — skip
      }
    }
    // 'ai' type rules need an external call; skipped here (handled via AI route)

    if (matched) {
      return {
        categoryId: rule.categoryId,
        bucketId:   rule.bucketId,
        ruleId:     rule.id,
        confidence: 1.0,
      }
    }
  }

  return { categoryId: null, bucketId: null, ruleId: null, confidence: 0 }
}

/**
 * Analyze recent transactions to suggest new filter rules.
 * Groups uncategorized merchants that appear 3+ times.
 */
export function suggestRules(): Array<{
  suggestion: string
  merchants:  string[]
  pattern:    string
  transactions: number
  confidence: number
}> {
  const recent = db.select().from(transactions)
    .orderBy(desc(transactions.date))
    .limit(500)
    .all()

  // Count uncategorized merchant occurrences
  const merchantCounts: Record<string, number> = {}
  for (const tx of recent) {
    if (tx.categoryId) continue  // already categorized
    const name = (tx.merchantName ?? tx.originalDescription ?? '').trim()
    if (!name) continue
    merchantCounts[name] = (merchantCounts[name] ?? 0) + 1
  }

  // Cluster similar merchants (simple prefix grouping)
  const clusters: Record<string, string[]> = {}
  for (const [name, count] of Object.entries(merchantCounts)) {
    if (count < 2) continue
    const key = name.split(' ')[0].toLowerCase()
    if (!clusters[key]) clusters[key] = []
    clusters[key].push(name)
  }

  return Object.entries(clusters)
    .filter(([, members]) => members.length > 0)
    .map(([key, members]) => {
      const total = members.reduce((s, m) => s + (merchantCounts[m] ?? 0), 0)
      const pattern = members.length > 1
        ? members.map((m) => m.split(' ')[0]).join('|').toLowerCase()
        : members[0].toLowerCase()
      return {
        suggestion:   `${members.slice(0, 3).join(', ')}${members.length > 3 ? ` +${members.length - 3} more` : ''} → ?`,
        merchants:    members,
        pattern,
        transactions: total,
        confidence:   Math.min(0.6 + total * 0.05, 0.98),
      }
    })
    .sort((a, b) => b.transactions - a.transactions)
    .slice(0, 10)
}
