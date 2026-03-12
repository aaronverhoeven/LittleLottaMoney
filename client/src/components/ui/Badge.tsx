import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-emerald-500/15 text-emerald-600',
  success: 'bg-emerald-500/15 text-emerald-600',
  warning: 'bg-amber-500/15 text-amber-600',
  danger: 'bg-red-500/15 text-red-600',
  neutral: 'bg-slate-200/60 text-slate-600',
  outline: 'border border-current bg-transparent',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
