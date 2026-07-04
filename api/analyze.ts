import type { VercelRequest, VercelResponse } from '@vercel/node'
import { analyzeWithFallback } from './providers/providerManager.js'
import { ProviderError } from './providers/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'POST only.' })
  }

  const { imageBase64 } = req.body as { imageBase64?: string }
  if (!imageBase64) {
    return res.status(400).json({ error: 'missing_image', message: 'No image data received.' })
  }

  try {
    const result = await analyzeWithFallback(imageBase64)
    return res.status(200).json({
      ...result.raw,
      providerUsed: result.providerName,
      failoverOccurred: result.failoverOccurred,
      processingTimeMs: result.processingTimeMs,
    })
  } catch (err: unknown) {
    // ProviderError from providerManager has .code and .message
    const code = (err instanceof ProviderError ? (err as ProviderError).code : null) ?? 'analysis_failed'
    const msg  = err instanceof Error ? err.message : 'Analysis failed. Try again.'

    // Log the raw error so Vercel function logs show what actually failed
    console.error('[analyze] provider chain failed:', err)

    // Map provider error codes to API error codes the frontend understands
    const apiErrorCode = code === 'quota_exhausted' || code === 'rate_limited'
      ? 'quota_exhausted'
      : code === 'model_not_found'
        ? 'model_unavailable'
        : code === 'network_error'
          ? 'network_error'
          : 'analysis_failed'

    return res.status(502).json({
      error: apiErrorCode,
      message: msg,
    })
  }
}