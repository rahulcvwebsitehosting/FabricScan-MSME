import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, ChevronRight, IndianRupee } from 'lucide-react'
import type { InspectionResult } from '../types'
import { DefectOverlay } from './DefectOverlay'
import { useInspection } from '../store/inspectionStore'

interface ResultCardProps {
  result: InspectionResult
}

const STATUS_ICON = {
  pass:   <CheckCircle  size={16} color="var(--ok)" />,
  rework: <AlertTriangle size={16} color="var(--warn)" />,
  reject: <XCircle      size={16} color="var(--reject)" />,
}

const STATUS_GLOW = {
  pass:   'var(--shadow)',
  rework: '0 0 0 1px rgba(240,160,32,0.18), 0 12px 32px rgba(240,160,32,0.1)',
  reject: '0 0 0 1px rgba(224,50,74,0.2), 0 12px 32px rgba(224,50,74,0.12)',
}

export function ResultCard({ result }: ResultCardProps) {
  const { selectResult } = useInspection()
  const cardRef = useRef<HTMLDivElement>(null)

  // Subtle mouse-tracked 3D tilt — the "4D" depth cue. Small range so it
  // reads as glass catching light, not a gimmick.
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const springCfg = { stiffness: 200, damping: 22, mass: 0.5 }
  const rx = useSpring(useTransform(my, [0, 1], [3.5, -3.5]), springCfg)
  const ry = useSpring(useTransform(mx, [0, 1], [-3.5, 3.5]), springCfg)

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width)
    my.set((e.clientY - rect.top) / rect.height)
  }
  const onMouseLeave = () => { mx.set(0.5); my.set(0.5) }

  return (
    <motion.div
      ref={cardRef}
      className="card animate-fade-in"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => selectResult(result.id)}
      style={{ cursor: 'pointer', rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      whileHover={{ y: -3, boxShadow: STATUS_GLOW[result.overallStatus] }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Thumbnail with mini overlay */}
        <div style={{ width: 120, flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
          <DefectOverlay imageUrl={result.imageUrl} defects={result.defects} interactive={false} />
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 14, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {result.imageName}
            </span>
            <span className={`badge badge-${result.overallStatus}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
              {STATUS_ICON[result.overallStatus]}
              {result.overallStatus.toUpperCase()}
            </span>
          </div>

          {/* Defect list */}
          {result.defects.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ok)', margin: 0 }}>✓ No defects detected</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {result.defects.map((d, i) => (
                <span key={i} className={`badge badge-${d.severity}`} style={{ fontSize: 11 }}>
                  {d.label}
                </span>
              ))}
            </div>
          )}

          {/* Cost + time */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
            {result.totalEstimatedCost.max > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warn)' }}>
                <IndianRupee size={13} />
                <span style={{ fontWeight: 600 }}>
                  {result.totalEstimatedCost.min}–{result.totalEstimatedCost.max}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>rework est.</span>
              </div>
            ) : (
              <span style={{ color: 'var(--ok)', fontWeight: 500 }}>No rework cost</span>
            )}
            <span style={{ color: 'var(--text-dim)', marginLeft: 'auto' }}>
              {(result.processingTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        <ChevronRight size={18} color="var(--text-dim)" style={{ flexShrink: 0, marginTop: 4 }} />
      </div>
    </motion.div>
  )
}
