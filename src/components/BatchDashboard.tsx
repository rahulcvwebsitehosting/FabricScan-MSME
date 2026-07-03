import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { IndianRupee, Layers, AlertCircle } from 'lucide-react'
import { useInspection } from '../store/inspectionStore'
import { ResultCard } from './ResultCard'

// Defect-type palette — kept distinct from the warm/cool accent pair on
// purpose, since a legend needs N separable hues, not a 2-tone system.
const COLORS = {
  tear: '#f0596b',
  loose_thread: '#f0a020',
  stain: '#a78bfa',
  seam_misalignment: '#3ad6f0',
  print_defect: '#f472b6',
  color_inconsistency: '#2dd4bf',
}

const SEVERITY_COLORS = {
  minor: '#f0a020',
  moderate: '#fb923c',
  major: '#f0596b',
  reject: '#e0324a',
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(16,20,29,0.92)',
  border: '1px solid var(--border-glass)',
  borderRadius: 'var(--radius)',
  backdropFilter: 'blur(16px)',
  boxShadow: 'var(--shadow-lg)',
}

export function BatchDashboard() {
  const { state, batchStats } = useInspection()
  const { results } = state

  if (results.length === 0) return null

  // Format data for Recharts
  const pieData = Object.entries(batchStats.defectBreakdown)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: COLORS[type as keyof typeof COLORS] || '#64748b',
    }))

  // Aggregate severity
  const severityCounts = { minor: 0, moderate: 0, major: 0, reject: 0 }
  results.forEach(r => {
    r.defects.forEach(d => {
      if (d.severity !== 'none') severityCounts[d.severity]++
    })
  })

  const barData = Object.entries(severityCounts)
    .filter(([_, count]) => count > 0)
    .map(([sev, count]) => ({
      name: sev.toUpperCase(),
      count,
      color: SEVERITY_COLORS[sev as keyof typeof SEVERITY_COLORS],
    }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="font-display" style={{ fontSize: 21, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 9 }}>
          <Layers size={22} color="var(--accent)" />
          Batch Dashboard
        </h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {results.length} item{results.length === 1 ? '' : 's'} inspected
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>

        {/* Defect Breakdown Chart */}
        <div className="card">
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Defect Breakdown</h3>
          {pieData.length > 0 ? (
            <div style={{ height: 200, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No defects to display
            </div>
          )}
        </div>

        {/* Severity Distribution Chart */}
        <div className="card">
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Severity Distribution</h3>
          {barData.length > 0 ? (
             <div style={{ height: 200, width: '100%' }}>
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
               <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} allowDecimals={false} />
                 <RechartsTooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={TOOLTIP_STYLE}
                 />
                 <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No defects to display
            </div>
          )}
        </div>

        {/* Cost Summary */}
        <div className="card glass-lamp" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. Batch Rework Cost</h3>
          <div className="font-display" style={{ display: 'flex', alignItems: 'center', gap: 8, color: batchStats.estimatedBatchCost.max > 0 ? 'var(--warn)' : 'var(--ok)' }}>
            <IndianRupee size={30} />
            <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {batchStats.estimatedBatchCost.min}–{batchStats.estimatedBatchCost.max}
            </span>
          </div>
          {batchStats.rejected > 0 && (
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'var(--reject)', fontSize: 13, background: 'var(--reject-dim)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', alignSelf: 'flex-start', border: '1px solid rgba(224,50,74,0.25)' }}>
               <AlertCircle size={14} />
               {batchStats.rejected} item{batchStats.rejected === 1 ? '' : 's'} flagged for rejection
             </div>
          )}
        </div>
      </div>

      {/* Individual Results List */}
      <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid var(--border-glass)', paddingBottom: 10 }}>
        Recent Inspections
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((result, i) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
          >
            <ResultCard result={result} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
