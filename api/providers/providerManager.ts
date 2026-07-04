import type { AIProvider, ProviderResult } from './types.js'
import { ProviderError, shouldFailover } from './types.js'
import { geminiProvider } from './gemini.js'
import { ollamaProvider } from './ollama.js'

/**
 * Ordered list of providers. First is primary, subsequent are fallbacks.
 * Adding a new provider (OpenRouter, Groq, etc.) means inserting it here.
 */
const providerChain: AIProvider[] = [geminiProvider, ollamaProvider]

/**
 * Attempts analysis with each provider in order.
 * On quota/rate-limit failures, falls through to the next provider.
 * On other errors (network, safety, invalid response), surfaces immediately.
 * Maximum 1 fallback attempt — no infinite retry loops.
 */
export async function analyzeWithFallback(imageBase64: string): Promise<ProviderResult> {
  const errors: string[] = []
  let failoverOccurred = false

  for (let i = 0; i < providerChain.length; i++) {
    const provider = providerChain[i]
    const startTime = Date.now()

    try {
      const raw = await provider.analyze(imageBase64)
      return {
        raw,
        providerName: provider.name,
        failoverOccurred,
        processingTimeMs: Date.now() - startTime,
      }
    } catch (err: unknown) {
      // If this IS the last provider or error does NOT warrant failover, surface it
      const isLast    = i === providerChain.length - 1
      const shouldTryNext = !isLast && err instanceof Error && 'code' in err &&
        shouldFailover((err as { code: string }).code as any)

      errors.push(`${provider.name}: ${err instanceof Error ? err.message : String(err)}`)

      console.error(`[providerManager] ${provider.name} failed:`, err)

      if (shouldTryNext) {
        failoverOccurred = true
        continue // try next provider
      }

      // Surface the error — no more providers to try or error doesn't warrant failover
      throw new ProviderError(
        err instanceof Error && 'code' in err
          ? (err as { code: string }).code as any
          : 'unknown',
        errors.join(' | '),
      )
    }
  }

  // Shouldn't reach here, but TypeScript needs it
  throw new Error('All providers exhausted')
}

/** For use when caller wants just the raw analysis (backwards compat) */
export { geminiProvider, ollamaProvider }