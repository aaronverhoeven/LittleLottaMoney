import { useState, useEffect } from 'react'
import { Bot, Wifi, WifiOff, Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'

export function Settings() {
  const { data: aiConfig, refetch } = useApi(() => api.settings.ai.get())

  const [endpoint, setEndpoint] = useState('')
  const [model, setModel]       = useState('')
  const [enabled, setEnabled]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [testing, setTesting]   = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; models?: string[]; error?: string } | null>(null)

  // Populate from fetched config
  useEffect(() => {
    if (!aiConfig) return
    setEndpoint(aiConfig.endpoint ?? 'http://localhost:11434/v1')
    setModel(aiConfig.model ?? 'llama3.2:1b')
    setEnabled(aiConfig.enabled ?? false)
  }, [aiConfig])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await api.settings.ai.set({ endpoint, model, enabled })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      refetch()
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    // Save current endpoint/model first so the test uses them
    await api.settings.ai.set({ endpoint, model })
    const result = await api.settings.ai.test()
    setTestResult(result)
    setTesting(false)
  }

  async function handleToggle() {
    const next = !enabled
    setEnabled(next)
    await api.settings.ai.set({ enabled: next })
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'hsl(160,84%,39%,0.12)' }}>
              <Bot size={16} style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AI Categorization</h2>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Auto-classify transactions using a local LLM
              </p>
            </div>
          </div>

          {/* Enable toggle */}
          <button
            onClick={handleToggle}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
            style={{ backgroundColor: enabled ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200"
              style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        <div className="space-y-4">
          {/* Endpoint */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
              Model Endpoint URL
            </label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:11434/v1"
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              style={{
                backgroundColor: 'hsl(var(--muted))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            />
          </div>

          {/* Model name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
              Model Name
            </label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="llama3.2:1b"
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              style={{
                backgroundColor: 'hsl(var(--muted))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            />
          </div>

          {/* Help text */}
          <p className="text-xs p-3 rounded-lg" style={{
            backgroundColor: 'hsl(var(--muted))',
            color: 'hsl(var(--muted-foreground))',
          }}>
            Point this at any OpenAI-compatible server.{' '}
            <strong style={{ color: 'hsl(var(--foreground))' }}>Ollama:</strong> http://localhost:11434/v1 &nbsp;·&nbsp;{' '}
            <strong style={{ color: 'hsl(var(--foreground))' }}>LM Studio:</strong> http://localhost:1234/v1
          </p>

          {/* Test result */}
          {testResult && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${testResult.ok ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {testResult.ok
                ? <Wifi size={14} className="mt-0.5 shrink-0" style={{ color: 'hsl(var(--positive))' }} />
                : <WifiOff size={14} className="mt-0.5 shrink-0" style={{ color: 'hsl(var(--negative))' }} />
              }
              <div>
                {testResult.ok ? (
                  <>
                    <p className="font-medium" style={{ color: 'hsl(var(--positive))' }}>Connected</p>
                    {testResult.models && testResult.models.length > 0 && (
                      <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Models: {testResult.models.slice(0, 5).join(', ')}
                        {testResult.models.length > 5 ? ` +${testResult.models.length - 5} more` : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium" style={{ color: 'hsl(var(--negative))' }}>Connection failed</p>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>{testResult.error}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50"
              style={{
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                backgroundColor: 'hsl(var(--muted))',
              }}
            >
              <Wifi size={13} />
              {testing ? 'Testing…' : 'Test Connection'}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
            >
              <Save size={13} />
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
            </button>

            {!enabled && (
              <Badge variant="neutral">AI disabled</Badge>
            )}
            {enabled && (
              <Badge variant="success">AI enabled</Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
