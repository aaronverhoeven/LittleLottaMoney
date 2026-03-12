import { Bell, Sun, Moon, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  subtitle?: string
  darkMode: boolean
  onToggleDark: () => void
}

export function TopBar({ title, subtitle, darkMode, onToggleDark }: TopBarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b shrink-0"
      style={{ borderColor: 'hsl(var(--border))' }}>
      <div>
        <h1 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{title}</h1>
        {subtitle && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all',
            'hover:bg-muted'
          )}
          style={{
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
            backgroundColor: 'transparent',
          }}
        >
          <RefreshCw size={13} />
          Sync
        </button>
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg border transition-all hover:bg-muted"
          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          className="p-2 rounded-lg border transition-all hover:bg-muted relative"
          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'hsl(var(--primary))' }} />
        </button>
      </div>
    </header>
  )
}
