import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  color?: string
  size?: 'sm' | 'md'
}

export function ProgressBar({ value, max = 100, className, color, size = 'sm' }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  const isOver = value > max

  return (
    <div
      className={cn('w-full rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
      style={{ backgroundColor: 'hsl(var(--muted))' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: isOver ? 'hsl(var(--negative))' : (color || 'hsl(var(--primary))'),
        }}
      />
    </div>
  )
}
