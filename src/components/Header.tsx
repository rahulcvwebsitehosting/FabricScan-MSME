import { Scan, ShieldCheck } from 'lucide-react'
import { useInspection } from '../store/inspectionStore'

export function Header() {
  const { state, batchStats, clearSession } = useInspection()
  const { results } = state

  return (
    <header style={{
      background: 'linear-gradient(180deg, #0d0f12 0%, rgba(13,15,18,0.95) 100%)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, var(--accent) 0%, #d97706 100%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245,158,11,0.3)',
          }}>
            <Scan size={20} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>
              FabricScan <span style={{ color: 'var(--accent)' }}>AI</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              Quality Control for Garment MSMEs
            </div>
          </div>
        </div>

        {/* Session stats — shown after first result */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {results.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '6px 16px',
              fontSize: 13,
            }}>
              <Stat label="Inspected" value={batchStats.total} />
              <StatDivider />
              <Stat label="Pass rate" value={`${batchStats.passRate}%`} highlight={batchStats.passRate >= 80} />
              <StatDivider />
              <Stat label="Defects" value={batchStats.totalDefects} />
              <StatDivider />
              <Stat
                label="Rework cost"
                value={batchStats.estimatedBatchCost.max > 0
                  ? `₹${batchStats.estimatedBatchCost.min}–${batchStats.estimatedBatchCost.max}`
                  : '₹0'}
              />
            </div>
          )}

          {results.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearSession}>
              Clear session
            </button>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--ok-dim)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 999,
            padding: '5px 12px',
            fontSize: 12,
            color: 'var(--ok)',
            fontWeight: 500,
          }}>
            <ShieldCheck size={13} />
            Secure
          </div>
        </div>
      </div>
    </header>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: highlight ? 'var(--ok)' : 'var(--text)', fontWeight: 600 }}>{value}</div>
      <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{label}</div>
    </div>
  )
}

function StatDivider() {
  return <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
}
