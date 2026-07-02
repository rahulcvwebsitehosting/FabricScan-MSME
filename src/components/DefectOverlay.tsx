import React, { useRef, useEffect, useState } from 'react'
import type { Defect, BoundingBox } from '../types'
import { BBOX_CONFIDENCE_THRESHOLD } from '../types'
import { AlertTriangle } from 'lucide-react'

interface DefectOverlayProps {
  imageUrl: string
  defects: Defect[]
  interactive?: boolean  // show hover tooltips
}

const SEVERITY_COLORS: Record<string, string> = {
  none:     '#22c55e',
  minor:    '#f59e0b',
  moderate: '#fb923c',
  major:    '#ef4444',
  reject:   '#dc2626',
}

/**
 * Renders the fabric image with SVG bounding boxes overlaid for each defect.
 *
 * CONFIDENCE GATE: Boxes are only drawn when:
 *   defect.confidence >= BBOX_CONFIDENCE_THRESHOLD (0.65)
 *   AND defect.boundingBox != null
 *
 * Below the threshold, a text label is shown instead.
 * A visibly wrong box is worse than no box at all.
 */
export function DefectOverlay({ imageUrl, defects, interactive = true }: DefectOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredId, setHoveredId]       = useState<number | null>(null)
  const [tooltipPos, setTooltipPos]     = useState({ x: 0, y: 0 })
  const [imgDims, setImgDims]           = useState({ w: 0, h: 0 })

  // Defects that pass the confidence gate
  const boxDefects = defects.filter(
    d => d.confidence >= BBOX_CONFIDENCE_THRESHOLD && d.boundingBox !== null
  )

  // Defects that fall back to text labels
  const labelOnlyDefects = defects.filter(
    d => d.type !== 'none' && (d.confidence < BBOX_CONFIDENCE_THRESHOLD || d.boundingBox === null)
  )

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImgDims({ w: img.offsetWidth, h: img.offsetHeight })
  }

  return (
    <div>
      {/* Image + SVG overlay */}
      <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <img
          src={imageUrl}
          alt="Fabric inspection"
          onLoad={onImgLoad}
          style={{ display: 'block', width: '100%', borderRadius: 'var(--radius)', maxHeight: 480, objectFit: 'contain' }}
        />

        {imgDims.w > 0 && (
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: interactive ? 'all' : 'none' }}
            viewBox={`0 0 100 ${(imgDims.h / imgDims.w) * 100}`}
            preserveAspectRatio="none"
          >
            {boxDefects.map((defect, idx) => {
              const bb  = defect.boundingBox as BoundingBox
              const col = SEVERITY_COLORS[defect.severity] ?? '#f59e0b'

              return (
                <g key={idx}>
                  <rect
                    x={bb.x} y={bb.y * (imgDims.h / imgDims.w)}
                    width={bb.width} height={bb.height * (imgDims.h / imgDims.w)}
                    fill={`${col}22`}
                    stroke={col}
                    strokeWidth="0.6"
                    strokeDasharray="2 1"
                    rx="0.5"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      setHoveredId(idx)
                      setTooltipPos({ x: e.clientX, y: e.clientY })
                    }}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                  {/* Label badge in top-left of box */}
                  <rect
                    x={bb.x} y={bb.y * (imgDims.h / imgDims.w) - 4}
                    width={Math.min(bb.width, 30)} height={4}
                    fill={col} rx="0.3"
                  />
                </g>
              )
            })}
          </svg>
        )}

        {/* Hover tooltip */}
        {hoveredId !== null && interactive && boxDefects[hoveredId] && (
          <DefectTooltip defect={boxDefects[hoveredId]} pos={tooltipPos} containerRef={containerRef} />
        )}
      </div>

      {/* Text-only labels for low-confidence detections */}
      {labelOnlyDefects.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {labelOnlyDefects.map((d, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                background: 'var(--warn-dim)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
              }}
            >
              <AlertTriangle size={14} color="var(--warn)" style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--warn)', fontWeight: 500 }}>{d.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>detected — see report below</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 12 }}>
                {Math.round(d.confidence * 100)}% confidence
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DefectTooltip({
  defect,
  pos,
  containerRef,
}: {
  defect: Defect
  pos: { x: number; y: number }
  containerRef: React.RefObject<HTMLDivElement>
}) {
  const rect = containerRef.current?.getBoundingClientRect()
  if (!rect) return null

  const left = Math.min(pos.x - rect.left + 12, rect.width - 220)
  const top  = Math.max(pos.y - rect.top  - 80, 8)

  return (
    <div style={{
      position: 'absolute', left, top,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '10px 14px',
      pointerEvents: 'none',
      width: 210,
      boxShadow: 'var(--shadow-lg)',
      zIndex: 10,
    }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{defect.label}</div>
      <Row label="Severity"   value={defect.severity} />
      <Row label="Confidence" value={`${Math.round(defect.confidence * 100)}%`} />
      <Row label="Est. cost"  value={`₹${defect.estimatedCostINR.min}–${defect.estimatedCostINR.max}`} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}
