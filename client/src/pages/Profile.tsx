import { useState, useEffect } from 'react'
import { Save, Sun, Moon, User, Briefcase, MapPin, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'

const defaultProfile = {
  name: '', age: 0, location: '', occupation: '', employer: '', annualSalary: 0, currency: 'USD',
}

export function Profile({ darkMode, onToggleDark }: { darkMode: boolean; onToggleDark: () => void }) {
  const { data } = useApi(() => api.profile.get())
  const [profile, setProfile] = useState(defaultProfile)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    if (data?.profile) setProfile({ ...defaultProfile, ...data.profile })
  }, [data])

  const handleSave = async () => {
    await api.profile.update(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Personal Info */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <User size={15} style={{ color: 'hsl(var(--primary))' }} />
          <h2 className="text-sm font-semibold">Personal Info</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Full Name
              </label>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border outline-none focus:border-emerald-400 transition-colors"
                style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Age
              </label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 rounded-lg border outline-none focus:border-emerald-400 transition-colors"
                style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <MapPin size={11} />
              Location
            </label>
            <input
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg border outline-none focus:border-emerald-400 transition-colors"
              style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
            />
          </div>
        </div>
      </Card>

      {/* Employment */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Briefcase size={15} style={{ color: 'hsl(var(--primary))' }} />
          <h2 className="text-sm font-semibold">Employment & Income</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Occupation
              </label>
              <input
                value={profile.occupation}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border outline-none focus:border-emerald-400 transition-colors"
                style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Employer
              </label>
              <input
                value={profile.employer}
                onChange={(e) => setProfile({ ...profile, employer: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border outline-none focus:border-emerald-400 transition-colors"
                style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <DollarSign size={11} />
              Expected Annual Salary
            </label>
            <input
              type="number"
              value={profile.annualSalary}
              onChange={(e) => setProfile({ ...profile, annualSalary: Number(e.target.value) })}
              className="w-full text-sm px-3 py-2 rounded-lg border outline-none focus:border-emerald-400 transition-colors"
              style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
            />
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Used to validate income and benchmark savings rate
            </p>
          </div>
        </div>
      </Card>

      {/* App Settings */}
      <Card>
        <h2 className="text-sm font-semibold mb-5">App Settings</h2>
        <div className="space-y-4">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon size={15} style={{ color: 'hsl(var(--muted-foreground))' }} /> : <Sun size={15} style={{ color: 'hsl(var(--muted-foreground))' }} />}
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Switch between light and dark theme</p>
              </div>
            </div>
            <div
              className="relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer"
              style={{ backgroundColor: darkMode ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
              onClick={onToggleDark}
            >
              <div
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                style={{ transform: darkMode ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <div>
              <p className="text-sm font-medium">Currency</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Display currency</p>
            </div>
            <select
              className="text-xs px-3 py-1.5 rounded-lg border outline-none"
              style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
            </select>
          </div>

          {/* Data */}
          <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <div>
              <p className="text-sm font-medium">Data Storage</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Local SQLite · All data stays on your machine</p>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'hsl(160,84%,39%,0.12)', color: 'hsl(var(--primary))' }}>
              Local
            </span>
          </div>
        </div>
      </Card>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{ backgroundColor: saved ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', color: 'white' }}
      >
        <Save size={14} />
        {saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}
