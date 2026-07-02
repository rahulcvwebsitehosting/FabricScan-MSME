import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { IndianRupee, Layers, AlertCircle } from 'lucide-react'
import { useInspection } from '../store/inspectionStore'
import { ResultCard } from './ResultCard'

const COLORS = {
  tear: '#ef4444',
  loose_thread: '#f59e0b',
  stain: '#8b5cf6',
  seam_misalignment: '#3b82f6',
  print_defect: '#ec4899',
  color_inconsistency: '#14b8a6',
}

const SEVERITY_COLORS = {
  minor: '#f59e0b',
  moderate: '#fb923c',
  major: '#ef4444',
  reject: '#dc2626',
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
    <div style={{ animation: 'slideUp 0.4s ease forwards' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Defect Breakdown</h3>
          {pieData.length > 0 ? (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    itemStyle={{ color: 'var(--text)' }}
                  />
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
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Severity Distribution</h3>
          {barData.length > 0 ? (
             <div style={{ height: 200 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} allowDecimals={false} />
                 <RechartsTooltip
                    cursor={{ fill: 'var(--surface-hover)' }}
                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                 />
                 <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Est. Batch Rework Cost</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: batchStats.estimatedBatchCost.max > 0 ? 'var(--warn)' : 'var(--ok)' }}>
            <IndianRupee size={32} />
            <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {batchStats.estimatedBatchCost.min}–{batchStats.estimatedBatchCost.max}
            </span>
          </div>
          {batchStats.rejected > 0 && (
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'var(--reject)', fontSize: 13, background: 'var(--reject-dim)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', alignSelf: 'flex-start' }}>
               <AlertCircle size={14} />
               {batchStats.rejected} item{batchStats.rejected === 1 ? '' : 's'} flagged for rejection
             </div>
          )}
        </div>
      </div>

      {/* Individual Results List */}
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        Recent Inspections
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map(result => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
