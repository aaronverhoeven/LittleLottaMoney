import { useState } from 'react'
import { Bot, Send, Sparkles, Key, ChevronRight, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const insights = [
  {
    type: 'positive',
    icon: TrendingUp,
    title: 'Strong savings rate',
    body: `Your 29.3% savings rate is well above the national average of 4.6% for your age group. Keep it up — you're on track to retire early if this continues.`,
  },
  {
    type: 'warning',
    icon: AlertCircle,
    title: 'Food spending crept up',
    body: 'You spent $487 on food this month, but your Entertainment bucket went $30 over. Consider meal prepping Sunday evenings — could cut food costs by 20–30%.',
  },
  {
    type: 'idea',
    icon: Lightbulb,
    title: 'Your emergency fund is 84% there',
    body: `At your current pace of $500/mo, you'll hit your $22k emergency fund goal by September 2025. After that, redirect that $500 to your brokerage for faster wealth building.`,
  },
]

const insightColors = {
  positive: { bg: 'hsl(160,84%,39%,0.08)', border: 'hsl(160,84%,39%,0.25)', icon: 'hsl(var(--positive))' },
  warning: { bg: 'hsl(38,92%,50%,0.08)', border: 'hsl(38,92%,50%,0.25)', icon: 'hsl(38,92%,50%)' },
  idea: { bg: 'hsl(220,84%,60%,0.08)', border: 'hsl(220,84%,60%,0.25)', icon: 'hsl(220,84%,60%)' },
}

const chatExamples = [
  'How am I doing compared to others my age?',
  'Where can I cut back this month?',
  'How long until I can retire?',
  'Review my budget allocation',
]

interface Message {
  role: 'user' | 'ai'
  content: string
}

export function AI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [connected, setConnected] = useState(false)

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages((m) => [
      ...m,
      { role: 'user', content: userMsg },
      {
        role: 'ai',
        content: connected
          ? '(AI response would appear here when connected to Claude or LM Studio)'
          : '⚠️ Connect an AI model to get real responses. Add your Claude API key or configure LM Studio in the settings below.',
      },
    ])
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Insights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} style={{ color: 'hsl(var(--primary))' }} />
          <h2 className="text-sm font-semibold">Financial Insights</h2>
          <Badge variant="neutral">On demand</Badge>
        </div>
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const colors = insightColors[insight.type as keyof typeof insightColors]
            const Icon = insight.icon
            return (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                <Icon size={16} style={{ color: colors.icon }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-1">{insight.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>
                    {insight.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot size={16} style={{ color: connected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
            <h2 className="text-sm font-semibold">Ask about your finances</h2>
          </div>
          <Badge variant={connected ? 'success' : 'neutral'}>
            {connected ? 'Claude connected' : 'No model connected'}
          </Badge>
        </div>

        {/* Messages */}
        <div className="min-h-32 mb-4 space-y-3">
          {messages.length === 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {chatExamples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="text-left text-xs p-3 rounded-lg border transition-all hover:border-emerald-400"
                  style={{
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--muted-foreground))',
                    backgroundColor: 'hsl(var(--muted))',
                  }}
                >
                  "{ex}"
                </button>
              ))}
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-xs xl:max-w-md text-xs p-3 rounded-xl leading-relaxed"
                  style={msg.role === 'user'
                    ? { backgroundColor: 'hsl(var(--primary))', color: 'white' }
                    : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything about your finances..."
            className="flex-1 text-xs px-3 py-2.5 rounded-lg border outline-none focus:border-emerald-400 transition-colors"
            style={{
              borderColor: 'hsl(var(--border))',
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
            }}
          />
          <button
            onClick={sendMessage}
            className="p-2.5 rounded-lg transition-all"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
          >
            <Send size={14} />
          </button>
        </div>
      </Card>

      {/* AI Settings */}
      <Card>
        <h2 className="text-sm font-semibold mb-4">AI Configuration</h2>
        <div className="space-y-4">
          {/* Claude */}
          <div className="flex items-center justify-between p-3 rounded-lg border"
            style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #cc785c, #d4956c)' }}>
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <div>
                <p className="text-xs font-semibold">Claude (Anthropic)</p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Cloud · Requires API key
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
            >
              <Key size={12} />
              {showKeyInput ? 'Cancel' : 'Add Key'}
            </button>
          </div>

          {showKeyInput && (
            <div className="flex gap-2">
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                type="password"
                className="flex-1 text-xs px-3 py-2 rounded-lg border outline-none"
                style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))' }}
              />
              <button
                onClick={() => { setConnected(true); setShowKeyInput(false) }}
                className="text-xs px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
              >
                Connect
              </button>
            </div>
          )}

          {/* LM Studio */}
          <div className="flex items-center justify-between p-3 rounded-lg border"
            style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#1a1a2e' }}>
                <span className="text-white text-xs font-bold">LM</span>
              </div>
              <div>
                <p className="text-xs font-semibold">LM Studio</p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Local · localhost:1234
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
            >
              Configure
              <ChevronRight size={12} />
            </button>
          </div>

          {/* MCP */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bot size={13} style={{ color: 'hsl(var(--primary))' }} />
              <p className="text-xs font-semibold">MCP Server</p>
              <Badge variant="success">Running</Badge>
            </div>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Exposes your financial data to any MCP-compatible AI (Claude Desktop, local LLMs).
            </p>
            <code className="text-xs mt-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
              ws://localhost:3001/mcp
            </code>
          </div>
        </div>
      </Card>
    </div>
  )
}
