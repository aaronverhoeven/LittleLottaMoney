import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Building2,
  Filter,
  Bot,
  ChevronLeft,
  ChevronRight,
  Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/income', label: 'Income', icon: TrendingUp },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/accounts', label: 'Accounts', icon: Building2 },
  { to: '/filters', label: 'Filters', icon: Filter },
  { to: '/ai', label: 'AI', icon: Bot },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 transition-all duration-200 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
      style={{ backgroundColor: 'hsl(var(--sidebar-bg))' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b', collapsed ? 'justify-center' : 'gap-3')}
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ backgroundColor: 'hsl(var(--primary))' }}>
          <Coins size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Little Lotta</div>
            <div className="text-xs leading-tight" style={{ color: 'hsl(var(--primary))' }}>Money</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'text-white'
                      : 'hover:text-white hover:bg-white/5',
                  )
                }
                style={({ isActive }) => isActive ? {
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  color: 'hsl(var(--primary))',
                } : { color: 'hsl(var(--sidebar-fg))' }}
                title={collapsed ? label : undefined}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && location.pathname === to && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: 'hsl(var(--primary))' }} />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom: Profile + Toggle */}
      <div className="py-3 px-2 space-y-0.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <NavLink
          to="/profile"
          className={() =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              collapsed ? 'justify-center' : '',
            )
          }
          style={({ isActive }) => isActive ? {
            backgroundColor: 'rgba(16,185,129,0.15)',
            color: 'hsl(var(--primary))',
          } : { color: 'hsl(var(--sidebar-fg))' }}
          title={collapsed ? 'Profile' : undefined}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(160,84%,39%), hsl(160,84%,28%))' }}>
            AJ
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white text-xs font-medium truncate">Alex Johnson</div>
              <div className="text-xs truncate" style={{ color: 'hsl(var(--sidebar-fg))' }}>Profile & Settings</div>
            </div>
          )}
        </NavLink>

        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all hover:bg-white/5"
          style={{ color: 'hsl(var(--sidebar-fg))', justifyContent: collapsed ? 'center' : 'flex-end' }}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <span>Collapse</span>
              <ChevronLeft size={14} />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
