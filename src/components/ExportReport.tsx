import React, { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useInspection } from '../store/inspectionStore'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export function ExportReport() {
  const { state, batchStats } = useInspection()
  const [isExporting, setIsExporting] = useState(false)

  if (state.results.length === 0) return null

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Create a temporary hidden container for the report
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '800px'
      container.style.background = '#ffffff' // Force white background for PDF
      container.style.color = '#000000'
      container.style.padding = '40px'
      container.style.fontFamily = 'sans-serif'
      
      // Build HTML string for report
      let html = `
        <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">FabricScan AI — Garment Quality Inspection System</h1>
          <p style="margin: 8px 0 0; color: #555;">Report generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 40px;">
          <div style="flex: 1; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <h3 style="margin: 0 0 10px; font-size: 14px; color: #555; text-transform: uppercase;">Batch Summary</h3>
            <p style="margin: 0 0 5px;"><strong>Total Inspected:</strong> ${batchStats.total}</p>
            <p style="margin: 0 0 5px;"><strong>Pass Rate:</strong> ${batchStats.passRate}%</p>
            <p style="margin: 0 0 5px;"><strong>Total Defects:</strong> ${batchStats.totalDefects}</p>
            <p style="margin: 0;"><strong>Est. Rework Cost:</strong> ₹${batchStats.estimatedBatchCost.min}–${batchStats.estimatedBatchCost.max}</p>
          </div>
          <div style="flex: 1; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <h3 style="margin: 0 0 10px; font-size: 14px; color: #555; text-transform: uppercase;">Status Breakdown</h3>
            <p style="margin: 0 0 5px;"><strong style="color: #16a34a;">Passed:</strong> ${batchStats.passed}</p>
            <p style="margin: 0 0 5px;"><strong style="color: #d97706;">Rework:</strong> ${batchStats.rework}</p>
            <p style="margin: 0;"><strong style="color: #dc2626;">Rejected:</strong> ${batchStats.rejected}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left;">
              <th style="padding: 12px; font-size: 14px; color: #555;">Item</th>
              <th style="padding: 12px; font-size: 14px; color: #555;">Status</th>
              <th style="padding: 12px; font-size: 14px; color: #555;">Defects</th>
              <th style="padding: 12px; font-size: 14px; color: #555;">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
      `

      state.results.forEach((r, idx) => {
        html += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600;">${r.imageName}</td>
            <td style="padding: 12px; text-transform: uppercase; font-size: 12px; font-weight: bold;">
              <span style="color: ${r.overallStatus === 'pass' ? '#16a34a' : r.overallStatus === 'rework' ? '#d97706' : '#dc2626'}">
                ${r.overallStatus}
              </span>
            </td>
            <td style="padding: 12px; font-size: 13px;">
              ${r.defects.length === 0 ? 'None' : r.defects.map(d => `${d.label} (${d.severity})`).join('<br>')}
            </td>
            <td style="padding: 12px; font-size: 13px; color: #555;">
              ${r.totalEstimatedCost.max > 0 ? `₹${r.totalEstimatedCost.min}–${r.totalEstimatedCost.max}` : '-'}
            </td>
          </tr>
        `
      })

      html += `
          </tbody>
        </table>
      `

      container.innerHTML = html
      document.body.appendChild(container)

      // Convert to canvas then PDF
      const canvas = await html2canvas(container, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      pdf.save(`FabricScan_Report_${dateStr}.pdf`)

      // Cleanup
      document.body.removeChild(container)

    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Failed to generate PDF. Check console for details.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, paddingBottom: 60 }}>
      <button 
        className="btn btn-primary btn-lg" 
        onClick={handleExport}
        disabled={isExporting}
        style={{ width: '100%', maxWidth: 300, justifyContent: 'center' }}
      >
        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        {isExporting ? 'Generating PDF...' : 'Export PDF Report'}
      </button>
    </div>
  )
}
