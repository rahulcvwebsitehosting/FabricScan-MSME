// ─── Defect taxonomy ─────────────────────────────────────────────────────────

export type DefectType =
  | 'tear'
  | 'loose_thread'
  | 'stain'
  | 'seam_misalignment'
  | 'print_defect'
  | 'color_inconsistency'
  | 'none'

export type Severity = 'none' | 'minor' | 'moderate' | 'major' | 'reject'

export type Recommendation = 'pass' | 'rework' | 'reject'

export type OverallStatus = 'pass' | 'rework' | 'reject'

// ─── Bounding box ────────────────────────────────────────────────────────────

export interface BoundingBox {
  /** Top-left X as percentage of image width (0–100) */
  x: number
  /** Top-left Y as percentage of image height (0–100) */
  y: number
  /** Width as percentage of image width (0–100) */
  width: number
  /** Height as percentage of image height (0–100) */
  height: number
}

// ─── Core domain types ───────────────────────────────────────────────────────

export interface Defect {
  type: DefectType
  label: string
  severity: Severity
  /** 0.0 – 1.0. Boxes are only drawn when confidence >= BBOX_CONFIDENCE_THRESHOLD */
  confidence: number
  /** null when confidence < BBOX_CONFIDENCE_THRESHOLD or location is ambiguous */
  boundingBox: BoundingBox | null
  /** Detailed multi-sentence description of the defect, its visual appearance and location */
  description: string
  /** Precise physical location on the garment. e.g. "Left shoulder, 3cm from collar seam" */
  location: string
  /** Why this is a defect — standard violated, expected quality, process failure */
  why: string
  /** Consequence if not fixed — customer complaints, structural weakness, brand damage */
  impact: string
  /** Specific actionable steps a factory worker can follow to repair this defect */
  reworkInstructions: string
  estimatedCostINR: { min: number; max: number }
  recommendation: Recommendation
}

export interface InspectionResult {
  id: string
  timestamp: Date
  /** Object URL — local only, never uploaded anywhere */
  imageUrl: string
  imageName: string
  defects: Defect[]
  overallStatus: OverallStatus
  overallSeverity: Severity
  totalEstimatedCost: { min: number; max: number }
  processingTimeMs: number
  /** The AI provider that generated this result (e.g. "Gemini Vision", "Ollama Cloud") */
  providerName?: string
  /** True when the primary provider failed and a fallback provider was used */
  failoverOccurred?: boolean
}

export interface BatchStats {
  total: number
  passed: number
  rework: number
  rejected: number
  passRate: number
  totalDefects: number
  defectBreakdown: Record<DefectType, number>
  estimatedBatchCost: { min: number; max: number }
}

// ─── Error shape returned by /api/analyze ───────────────────────────────────
// Every failure path in api/analyze.ts returns this shape.
// geminiService.ts and toast logic key off the `error` discriminant.

export interface ApiError {
  error:
    | 'missing_image'
    | 'analysis_failed'
    | 'model_unavailable'
    | 'method_not_allowed'
    | 'timeout'
    | 'quota_exhausted'
    | 'network_error'
  message: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Bounding boxes are only rendered at or above this confidence level.
 * Below it, DefectOverlay shows a text label only.
 * A visibly wrong box is worse than no box — tune this after Phase 0.5 testing.
 */
export const BBOX_CONFIDENCE_THRESHOLD = 0.65

/** Fetch timeout for /api/analyze calls. Shows retry UI on abort. */
export const ANALYZE_TIMEOUT_MS = 20_000
