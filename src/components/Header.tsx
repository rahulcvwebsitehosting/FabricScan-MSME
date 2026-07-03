import { motion } from 'framer-motion'
import { Scan, ShieldCheck } from 'lucide-react'
import { useInspection } from '../store/inspectionStore'

export function Header() {
  const { state, batchStats, clearSession } = useInspection()
  const { results } = state

  return (
    <header
      style={{
        background: 'linear-gradient(180deg, rgba(10,13,20,0.92) 0%, rgba(10,13,20,0.75) 100%)',
        borderBottom: '1px solid var(--border-glass)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div className="container header-row">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexShrink: 0 }}
        >
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-2) 100%)',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.25) inset, 0 0 22px rgba(240,160,32,0.4)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <Scan size={20} color="#1a1204" strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
            {/* mini scan sweep across the mark */}
            <div className="scan-beam" style={{ mixBlendMode: 'plus-lighter', opacity: 0.7 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              FabricScan <span style={{ color: 'var(--accent)' }}>AI</span>
            </div>
            <div className="header-tagline" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap' }}>
              Woven-fibre inspection, read by machine vision
            </div>
          </div>
        </motion.div>

        {/* Session stats — shown after first result */}
        <div className="header-actions">
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="glass header-stats"
            >
              <Stat label="Inspected" value={batchStats.total} />
              <StatDivider />
              <Stat label="Pass rate" value={`${batchStats.passRate}%`} highlight={batchStats.passRate >= 80} />
              <StatDivider />
              <Stat label="Defects" value={batchStats.totalDefects} accentScan />
              <span className="header-stat-optional">
                <StatDivider />
                <Stat
                  label="Rework cost"
                  value={batchStats.estimatedBatchCost.max > 0
                    ? `₹${batchStats.estimatedBatchCost.min}–${batchStats.estimatedBatchCost.max}`
                    : '₹0'}
                />
              </span>
            </motion.div>
          )}

          {results.length > 0 && (
            <button className="btn btn-ghost btn-sm header-stat-optional" onClick={clearSession}>
              Clear session
            </button>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--ok-dim)',
            border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: 999,
            padding: '6px 13px',
            fontSize: 12,
            color: 'var(--ok)',
            fontWeight: 500,
            backdropFilter: 'blur(8px)',
            flexShrink: 0,
          }}>
            <ShieldCheck size={13} />
            <span className="header-stat-optional">Secure</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function Stat({ label, value, highlight, accentScan }: { label: string; value: string | number; highlight?: boolean; accentScan?: boolean }) {
  const color = highlight ? 'var(--ok)' : accentScan ? 'var(--scan)' : 'var(--text)'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{label}</div>
    </div>
  )
}

function StatDivider() {
  return <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
}
