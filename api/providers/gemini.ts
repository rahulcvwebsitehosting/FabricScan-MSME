import { GoogleGenerativeAI } from '@google/generative-ai'
import type { RawAnalysis, AIProvider } from './types.js'
import { ProviderError } from './types.js'
import { FABRIC_INSPECTION_PROMPT } from './prompt.js'

// Pinned model versions — never use '-latest' aliases.
const MODEL_PRIMARY  = 'gemini-2.5-flash'
const MODEL_FALLBACK = 'gemini-2.5-flash-lite'

function classifyGeminiError(err: unknown): ProviderError {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  // 429 / quota / rate-limit → should trigger failover
  if (msg.includes('429') || lower.includes('resource_exhausted') ||
      lower.includes('quota') || lower.includes('rate limit') ||
      lower.includes('daily limit') || lower.includes('too many requests')) {
    return new ProviderError('quota_exhausted', msg)
  }

  // 404 / model not found → config issue, don't failover
  if (msg.includes('404') || lower.includes('not found') || lower.includes('deprecated')) {
    return new ProviderError('model_not_found', msg)
  }

  // Safety blocks → content, not quota
  if (lower.includes('safety') || lower.includes('blocked')) {
    return new ProviderError('safety_blocked', msg)
  }

  // All other errors → don't failover
  return new ProviderError('unknown', msg)
}

async function callGemini(modelName: string, imageBase64: string): Promise<RawAnalysis> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: modelName })

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { text: FABRIC_INSPECTION_PROMPT },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ],
    }],
    generationConfig: { responseMimeType: 'application/json' },
  })

  const candidate = result.response.candidates?.[0]
  if (!candidate || candidate.finishReason !== 'STOP') {
    throw new Error(`blocked: finishReason=${candidate?.finishReason ?? 'none'}`)
  }

  try {
    return JSON.parse(result.response.text()) as RawAnalysis
  } catch {
    throw new Error('Gemini returned malformed JSON')
  }
}

export const geminiProvider: AIProvider = {
  name: 'Gemini Vision',

  async analyze(imageBase64: string): Promise<RawAnalysis> {
    try {
      return await callGemini(MODEL_PRIMARY, imageBase64)
    } catch (primaryErr: unknown) {
      const primaryError = classifyGeminiError(primaryErr)

      // Only retry with fallback on model-gone errors
      if (primaryError.code === 'model_not_found') {
        try {
          return await callGemini(MODEL_FALLBACK, imageBase64)
        } catch (fallbackErr: unknown) {
          const fbError = classifyGeminiError(fallbackErr)
          // If both models gone, surface as model_not_found
          if (fbError.code === 'model_not_found') {
            throw fbError
          }
          // If fallback fails with quota, surface quota → triggers top-level failover
          throw fbError
        }
      }

      // Primary failure with quota/rate → surface that error for failover
      throw primaryError
    }
  },
}