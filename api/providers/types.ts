// ── Shared provider interface ──
// Every AI provider (Gemini, Ollama, future ones) must implement this contract.

/** The raw AI response schema that every provider must produce */
export interface RawAnalysis {
  defects: Array<{
    type: string
    label: string
    severity: string
    confidence: number
    boundingBox: { x: number; y: number; width: number; height: number } | null
    description: string
    location: string
    why: string
    impact: string
    reworkInstructions: string
    estimatedCostINR: { min: number; max: number }
    recommendation: string
  }>
  overallStatus: string
  overallSeverity: string
}

export interface ProviderResult {
  raw: RawAnalysis
  providerName: string
  failoverOccurred: boolean
  processingTimeMs: number
}

/** Error classification for failover decisions */
export type ProviderErrorCode =
  | 'quota_exhausted'   // trigger failover to next provider
  | 'rate_limited'      // trigger failover to next provider
  | 'model_not_found'   // do NOT failover — config issue
  | 'safety_blocked'    // do NOT failover — content issue
  | 'invalid_response'  // do NOT failover — provider bug
  | 'network_error'     // do NOT failover — infrastructure issue
  | 'unknown'           // do NOT failover — investigate manually

export class ProviderError extends Error {
  public readonly code: ProviderErrorCode
  constructor(code: ProviderErrorCode, message: string) {
    super(message)
    this.name = 'ProviderError'
    this.code = code
  }
}

/** Returns true when this error means we should try another provider */
export function shouldFailover(code: ProviderErrorCode): boolean {
  return code === 'quota_exhausted' || code === 'rate_limited'
}

/** Each provider's public contract */
export interface AIProvider {
  readonly name: string
  analyze(imageBase64: string): Promise<RawAnalysis>
}