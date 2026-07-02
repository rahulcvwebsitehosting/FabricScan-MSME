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

export function ResultCard({ result }: ResultCardProps) {
  const { selectResult } = useInspection()

  return (
    <div
      className="card animate-fade-in"
      style={{ cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
      onClick={() => selectResult(result.id)}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Thumbnail with mini overlay */}
        <div style={{ width: 120, flexShrink: 0 }}>
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
    </div>
  )
}
