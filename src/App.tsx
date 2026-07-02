import { useEffect } from 'react'
import { Header } from './components/Header'
import { UploadZone } from './components/UploadZone'
import { ResultModal } from './components/ResultModal'
import { BatchDashboard } from './components/BatchDashboard'
import { ExportReport } from './components/ExportReport'
import { InspectionProvider, useInspection } from './store/inspectionStore'
import { AlertCircle } from 'lucide-react'

function AppContent() {
  const { state, clearError } = useInspection()
  const { error } = state
  
  // Auto-clear toast after 5s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  return (
    <>
      <Header />
      
      <main className="container" style={{ paddingTop: 40 }}>
        <UploadZone />
        <BatchDashboard />
        <ExportReport />
      </main>

      {/* Selected Result Portal */}
      <ResultModal />

      {/* Global Error Toast */}
      <div className="toast-container">
        {error && (
          <div className="toast toast-error">
            <AlertCircle size={18} color="var(--danger)" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: 2 }}>Error</div>
              <div style={{ color: 'var(--text-muted)' }}>{error}</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function App() {
  return (
    <InspectionProvider>
      <AppContent />
    </InspectionProvider>
  )
}

export default App
