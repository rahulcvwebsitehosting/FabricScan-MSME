import type { InspectionResult, ApiError, Defect, BatchStats, DefectType } from '../types'
import { ANALYZE_TIMEOUT_MS } from '../types'
import { v4 as uuidv4 } from 'uuid'

// ─── Errors ──────────────────────────────────────────────────────────────────

/** Thrown when the /api/analyze fetch times out after ANALYZE_TIMEOUT_MS */
export class GeminiTimeoutError extends Error {
  constructor() {
    super('timeout')
    this.name = 'GeminiTimeoutError'
  }
}

/** Thrown when the server returns a typed ApiError response */
export class GeminiApiError extends Error {
  public readonly code: ApiError['error']
  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'GeminiApiError'
    this.code = apiError.error
  }
}

// ─── Main analysis call ──────────────────────────────────────────────────────

/**
 * Sends a compressed base64 JPEG to /api/analyze and returns a parsed
 * InspectionResult. mimeType is NOT sent — api/analyze.ts hardcodes 'image/jpeg'.
 *
 * Throws GeminiTimeoutError on timeout, GeminiApiError on typed server errors,
 * or a plain Error for network failures.
 */
export async function analyzeImage(
  imageBase64: string,
  imageName: string,
  imageUrl: string,
): Promise<InspectionResult> {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS)
  const startTime  = Date.now()

  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // mimeType intentionally NOT sent — api/analyze.ts owns that decision
      body: JSON.stringify({ imageBase64 }),
      signal: controller.signal,
    })
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new GeminiTimeoutError()
    }
    throw new Error('Network error — check your connection and try again.')
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    let body: ApiError
    try {
      body = await response.json() as ApiError
    } catch {
      body = { error: 'analysis_failed', message: `Server error ${response.status}` }
    }
    throw new GeminiApiError(body)
  }

  const raw = await response.json()
  const processingTimeMs = Date.now() - startTime

  return parseRawResponse(raw, imageName, imageUrl, processingTimeMs)
}

// ─── Response parser ─────────────────────────────────────────────────────────

function parseRawResponse(
  raw: Record<string, unknown>,
  imageName: string,
  imageUrl: string,
  processingTimeMs: number,
): InspectionResult {
  const defects: Defect[] = Array.isArray(raw.defects)
    ? (raw.defects as Defect[])
    : []

  const totalCost = defects.reduce(
    (acc, d) => ({
      min: acc.min + (d.estimatedCostINR?.min ?? 0),
      max: acc.max + (d.estimatedCostINR?.max ?? 0),
    }),
    { min: 0, max: 0 },
  )

  return {
    id: uuidv4(),
    timestamp: new Date(),
    imageName,
    imageUrl,
    defects,
    overallStatus:   (raw.overallStatus   as InspectionResult['overallStatus'])   ?? 'pass',
    overallSeverity: (raw.overallSeverity as InspectionResult['overallSeverity']) ?? 'none',
    totalEstimatedCost: totalCost,
    processingTimeMs,
  }
}

// ─── Batch stats ─────────────────────────────────────────────────────────────

export function computeBatchStats(results: InspectionResult[]): BatchStats {
  if (results.length === 0) {
    return {
      total: 0, passed: 0, rework: 0, rejected: 0,
      passRate: 0, totalDefects: 0,
      defectBreakdown: {} as Record<DefectType, number>,
      estimatedBatchCost: { min: 0, max: 0 },
    }
  }

  const passed   = results.filter(r => r.overallStatus === 'pass').length
  const rework   = results.filter(r => r.overallStatus === 'rework').length
  const rejected = results.filter(r => r.overallStatus === 'reject').length

  const breakdown: Record<string, number> = {}
  let totalDefects = 0
  for (const result of results) {
    for (const defect of result.defects) {
      if (defect.type !== 'none') {
        breakdown[defect.type] = (breakdown[defect.type] ?? 0) + 1
        totalDefects++
      }
    }
  }

  const batchCost = results.reduce(
    (acc, r) => ({
      min: acc.min + r.totalEstimatedCost.min,
      max: acc.max + r.totalEstimatedCost.max,
    }),
    { min: 0, max: 0 },
  )

  return {
    total: results.length,
    passed,
    rework,
    rejected,
    passRate: Math.round((passed / results.length) * 100),
    totalDefects,
    defectBreakdown: breakdown as Record<DefectType, number>,
    estimatedBatchCost: batchCost,
  }
}
