import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  onClick?: () => void
}

export function Card({ className, style, children, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border p-5',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
        className
      )}
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  subValuePositive?: boolean
  icon?: React.ReactNode
  accent?: boolean
}

export function StatCard({ label, value, subValue, subValuePositive, icon, accent }: StatCardProps) {
  return (
    <Card className={accent ? 'border-emerald-500/30 bg-emerald-500/5' : ''}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium mb-1.5 uppercase tracking-wide"
            style={{ color: 'hsl(var(--muted-foreground))' }}>
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            {value}
          </p>
          {subValue && (
            <p className={cn('text-xs mt-1 font-medium')}
              style={{ color: subValuePositive ? 'hsl(var(--positive))' : 'hsl(var(--negative))' }}>
              {subValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg shrink-0"
            style={{ backgroundColor: 'hsl(var(--muted))' }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
