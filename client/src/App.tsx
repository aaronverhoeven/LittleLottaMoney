import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { Dashboard } from '@/pages/Dashboard'
import { Income } from '@/pages/Income'
import { Budget } from '@/pages/Budget'
import { Accounts } from '@/pages/Accounts'
import { Filters } from '@/pages/Filters'
import { AI } from '@/pages/AI'
import { Profile } from '@/pages/Profile'
import { Transactions } from '@/pages/Transactions'
import { Settings } from '@/pages/Settings'

const pageMeta: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'March 2025' },
  '/income': { title: 'Income', subtitle: 'Earnings, trends & net worth' },
  '/budget': { title: 'Budget', subtitle: 'Envelopes & goals' },
  '/accounts': { title: 'Accounts', subtitle: 'Assets, liabilities & linked accounts' },
  '/transactions': { title: 'Transactions', subtitle: 'Browse & categorize transactions' },
  '/filters': { title: 'Filters', subtitle: 'Auto-classification rules' },
  '/ai': { title: 'AI', subtitle: 'Financial insights & chat' },
  '/settings': { title: 'Settings', subtitle: 'AI categorization & preferences' },
  '/profile': { title: 'Profile', subtitle: 'Settings & preferences' },
}

function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const location = useLocation()
  const meta = pageMeta[location.pathname] ?? { title: 'Little Lotta Money' }

  const toggleDark = () => {
    setDarkMode((d) => !d)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="flex w-full min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          darkMode={darkMode}
          onToggleDark={toggleDark}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income" element={<Income />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/filters" element={<Filters />} />
            <Route path="/ai" element={<AI />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile darkMode={darkMode} onToggleDark={toggleDark} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
