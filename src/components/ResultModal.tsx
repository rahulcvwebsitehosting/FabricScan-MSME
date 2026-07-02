import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, CheckCircle, AlertTriangle, XCircle,
  IndianRupee, Scissors, Layers, Droplets, AlignLeft, Printer, Palette,
} from 'lucide-react'
import type { Defect, DefectType, InspectionResult } from '../types'
import { DefectOverlay } from './DefectOverlay'
import { useInspection } from '../store/inspectionStore'

const DEFECT_ICONS: Record<DefectType, React.ReactNode> = {
  tear:               <Scissors size={15} />,
  loose_thread:       <Layers size={15} />,
  stain:              <Droplets size={15} />,
  seam_misalignment:  <AlignLeft size={15} />,
  print_defect:       <Printer size={15} />,
  color_inconsistency:<Palette size={15} />,
  none:               <CheckCircle size={15} />,
}

export function ResultModal() {
  const { state, selectResult } = useInspection()
  const { results, selectedResultId } = state
  const result = results.find(r => r.id === selectedResultId)

  const close = useCallback(() => selectResult(null), [selectResult])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  if (!result) return null

  return createPortal(
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusBadge result={result} />
            <span style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
              {result.imageName}
            </span>
          </div>
          <button
            onClick={close}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', overflow: 'hidden', flex: 1 }}>

          {/* Left — image */}
          <div style={{
            flex: '0 0 55%',
            borderRight: '1px solid var(--border)',
            padding: 24,
            overflowY: 'auto',
            background: 'var(--bg)',
          }}>
            <DefectOverlay imageUrl={result.imageUrl} defects={result.defects} interactive />

            {/* Summary strip */}
            <div style={{
              marginTop: 16, display: 'flex', gap: 12,
              padding: '12px 16px',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}>
              <SummaryStat label="Defects" value={result.defects.length} />
              <SummaryStat label="Severity" value={result.overallSeverity} />
              <SummaryStat
                label="Est. cost"
                value={result.totalEstimatedCost.max > 0
                  ? `₹${result.totalEstimatedCost.min}–${result.totalEstimatedCost.max}`
                  : '₹0'}
              />
              <SummaryStat label="Processed in" value={`${(result.processingTimeMs / 1000).toFixed(1)}s`} />
            </div>
          </div>

          {/* Right — defect details */}
          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Defect Report
            </h3>

            {result.defects.length === 0 ? (
              <div style={{
                padding: 32, textAlign: 'center',
                background: 'var(--ok-dim)', borderRadius: 'var(--radius)',
                border: '1px solid rgba(34,197,94,0.2)',
              }}>
                <CheckCircle size={32} color="var(--ok)" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, color: 'var(--ok)', marginBottom: 4 }}>No defects detected</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>This item passes quality inspection</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.defects.map((defect, i) => (
                  <DefectDetailCard key={i} defect={defect} index={i + 1} />
                ))}
              </div>
            )}

            {/* Recommendation */}
            <RecommendationBlock result={result} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function DefectDetailCard({ defect, index }: { defect: Defect; index: number }) {
  const severityWidth = { none: '0%', minor: '25%', moderate: '50%', major: '75%', reject: '100%' }[defect.severity]
  const severityColor = { none: 'var(--ok)', minor: 'var(--ok)', moderate: '#fb923c', major: 'var(--danger)', reject: 'var(--reject)' }[defect.severity]

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)', flexShrink: 0,
        }}>
          {DEFECT_ICONS[defect.type]}
        </div>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{defect.label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 2 }}>#{index}</span>
        <span className={`badge badge-${defect.severity}`} style={{ marginLeft: 'auto', fontSize: 11 }}>
          {defect.severity.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        {defect.description}
      </p>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <MetricRow label="Confidence">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${defect.confidence * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, width: 32, textAlign: 'right' }}>
              {Math.round(defect.confidence * 100)}%
            </span>
          </div>
        </MetricRow>
        <MetricRow label="Severity level">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: severityWidth, height: '100%', background: severityColor, borderRadius: 2 }} />
            </div>
          </div>
        </MetricRow>
      </div>

      {/* Cost + recommendation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 12px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warn)' }}>
          <IndianRupee size={13} />
          <span style={{ fontWeight: 600 }}>{defect.estimatedCostINR.min}–{defect.estimatedCostINR.max}</span>
          <span style={{ color: 'var(--text-muted)' }}>estimated</span>
        </div>
        <RecommendationChip rec={defect.recommendation} />
      </div>
    </div>
  )
}

function RecommendationChip({ rec }: { rec: 'pass' | 'rework' | 'reject' }) {
  const map = {
    pass:   { color: 'var(--ok)',     icon: <CheckCircle size={12} />,   label: 'PASS' },
    rework: { color: 'var(--warn)',   icon: <AlertTriangle size={12} />, label: 'REWORK' },
    reject: { color: 'var(--reject)', icon: <XCircle size={12} />,      label: 'REJECT' },
  }[rec]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: map.color, fontWeight: 600, fontSize: 12 }}>
      {map.icon} {map.label}
    </div>
  )
}

function MetricRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function StatusBadge({ result }: { result: InspectionResult }) {
  const map = {
    pass:   { cls: 'badge-pass',   icon: <CheckCircle size={13} />,   label: 'PASS' },
    rework: { cls: 'badge-rework', icon: <AlertTriangle size={13} />, label: 'REWORK' },
    reject: { cls: 'badge-reject', icon: <XCircle size={13} />,      label: 'REJECT' },
  }[result.overallStatus]

  return <span className={`badge ${map.cls}`}>{map.icon} {map.label}</span>
}

function RecommendationBlock({ result }: { result: InspectionResult }) {
  const map = {
    pass: {
      bg: 'var(--ok-dim)', border: 'rgba(34,197,94,0.2)', color: 'var(--ok)',
      icon: <CheckCircle size={20} />,
      title: 'Pass — No action required',
      body: 'This garment meets quality standards and is ready for shipment.',
    },
    rework: {
      bg: 'var(--warn-dim)', border: 'rgba(245,158,11,0.2)', color: 'var(--warn)',
      icon: <AlertTriangle size={20} />,
      title: 'Rework required before shipment',
      body: `Estimated rework cost: ₹${result.totalEstimatedCost.min}–${result.totalEstimatedCost.max}. Address the flagged defects before passing this item.`,
    },
    reject: {
      bg: 'var(--reject-dim)', border: 'rgba(220,38,38,0.2)', color: 'var(--reject)',
      icon: <XCircle size={20} />,
      title: 'Reject — Do not ship',
      body: `Defect severity exceeds rework threshold. Estimated waste cost: ₹${result.totalEstimatedCost.min}–${result.totalEstimatedCost.max}.`,
    },
  }[result.overallStatus]

  return (
    <div style={{
      marginTop: 20,
      padding: '16px 18px',
      background: map.bg,
      border: `1px solid ${map.border}`,
      borderRadius: 'var(--radius)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ color: map.color, flexShrink: 0, marginTop: 2 }}>{map.icon}</div>
      <div>
        <div style={{ fontWeight: 600, color: map.color, marginBottom: 4 }}>{map.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{map.body}</div>
      </div>
    </div>
  )
}
