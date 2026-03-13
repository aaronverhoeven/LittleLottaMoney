// Calls any OpenAI-compatible endpoint to categorize a transaction
// Falls back gracefully if model is unavailable

interface AiConfig {
  endpoint: string  // e.g. "http://localhost:11434/v1" (Ollama) or "http://localhost:1234/v1" (LM Studio)
  model: string     // e.g. "llama3.2:1b", "phi3:mini", "qwen2.5:0.5b"
  enabled: boolean
}

interface CategorizeResult {
  categoryId: number | null
  confidence: number
  reasoning: string
}

export function getAiConfig(db: any): AiConfig {
  const endpoint = db.prepare("SELECT value FROM settings WHERE key = 'ai_endpoint'").get()?.value ?? 'http://localhost:11434/v1'
  const model    = db.prepare("SELECT value FROM settings WHERE key = 'ai_model'").get()?.value ?? 'llama3.2:1b'
  const enabled  = db.prepare("SELECT value FROM settings WHERE key = 'ai_enabled'").get()?.value ?? 'false'
  return { endpoint, model, enabled: enabled === 'true' }
}

export async function categorizeMerchant(
  db: any,
  merchantName: string,
  description: string | undefined,
  categories: Array<{ id: number; name: string }>,
  plainEnglishRules: Array<{ name: string; naturalLanguage: string | null }>
): Promise<CategorizeResult> {
  const config = getAiConfig(db)
  if (!config.enabled) return { categoryId: null, confidence: 0, reasoning: 'AI disabled' }

  const categoryList = categories.map((c) => c.name).join(', ')
  const rulesList = plainEnglishRules
    .filter((r) => r.naturalLanguage)
    .map((r) => `- ${r.naturalLanguage}`)
    .join('\n')

  const prompt = `You are a personal finance transaction categorizer. Reply ONLY with valid JSON, no other text.

Available categories: ${categoryList}
${rulesList ? `\nUser rules (follow these carefully):\n${rulesList}\n` : ''}
Transaction:
Merchant: ${merchantName}${description ? `\nDescription: ${description}` : ''}

Reply with exactly this JSON shape: {"category": "<one of the available categories>", "confidence": <0.0-1.0>, "reasoning": "<one short sentence>"}`

  try {
    const response = await fetch(`${config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100,
      }),
      signal: AbortSignal.timeout(8000), // 8 second timeout
    })

    if (!response.ok) return { categoryId: null, confidence: 0, reasoning: `HTTP ${response.status}` }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''

    // Parse JSON from response (handle markdown code blocks too)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { categoryId: null, confidence: 0, reasoning: 'No JSON in response' }

    const parsed = JSON.parse(jsonMatch[0])
    const matched = categories.find((c) => c.name.toLowerCase() === parsed.category?.toLowerCase())

    return {
      categoryId: matched?.id ?? null,
      confidence: parsed.confidence ?? 0.5,
      reasoning:  parsed.reasoning ?? '',
    }
  } catch (e: any) {
    return { categoryId: null, confidence: 0, reasoning: e.message ?? 'AI error' }
  }
}
