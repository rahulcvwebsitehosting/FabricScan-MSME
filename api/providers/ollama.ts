import type { RawAnalysis, AIProvider } from './types.js'
import { ProviderError } from './types.js'
import { FABRIC_INSPECTION_PROMPT } from './prompt.js'

const BASE_URL  = (process.env.OLLAMA_BASE_URL  ?? 'https://api.ollama.com/v1').replace(/\/+$/, '')
const API_KEY   = process.env.OLLAMA_API_KEY
const MODEL     = process.env.OLLAMA_MODEL     ?? 'qwen2.5-vl:7b'

function classifyOllamaError(err: unknown): ProviderError {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (msg.includes('429') || lower.includes('too many requests') ||
      lower.includes('rate_limit') || lower.includes('quota')) {
    return new ProviderError('rate_limited', msg)
  }

  if (msg.includes('404') || lower.includes('not found') ||
      lower.includes('model') || lower.includes('unauthorized')) {
    return new ProviderError('model_not_found', msg)
  }

  // Timeout / fetch failures → network, not quota
  if (msg.includes('timeout') || msg.includes('fetch') ||
      msg.includes('network') || msg.includes('abort')) {
    return new ProviderError('network_error', msg)
  }

  return new ProviderError('unknown', msg)
}

export const ollamaProvider: AIProvider = {
  name: 'Ollama Cloud',

  async analyze(imageBase64: string): Promise<RawAnalysis> {
    const url = `${BASE_URL}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      // Ollama built-in 120s timeout
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              { type: 'text', text: FABRIC_INSPECTION_PROMPT },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      let errBody = ''
      try { errBody = await response.text() } catch {}
      throw classifyOllamaError(new Error(`${response.status} ${response.statusText} - ${errBody.slice(0, 300)}`))
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new ProviderError('invalid_response', 'Ollama returned empty content')
    }

    // Extract JSON from possibly markdown-wrapped response
    let jsonStr = content.trim()
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) jsonStr = fenceMatch[1].trim()

    const bracketStart = jsonStr.indexOf('{')
    if (bracketStart > 0) jsonStr = jsonStr.slice(bracketStart)

    try {
      return JSON.parse(jsonStr) as RawAnalysis
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      throw new ProviderError('invalid_response', `Ollama returned invalid JSON: ${msg}`)
    }
  },
}