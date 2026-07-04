import { useEffect } from 'react'
import { Header } from './components/Header'
import { UploadZone } from './components/UploadZone'
import { ResultModal } from './components/ResultModal'
import { BatchDashboard } from './components/BatchDashboard'
import { ExportReport } from './components/ExportReport'
import { InspectionProvider, useInspection } from './store/inspectionStore'
import { AlertCircle, RefreshCw } from 'lucide-react'

function AppContent() {
  const { state, clearError, clearFailoverNotice } = useInspection()
  const { error, failoverNotice } = state
  
  // Auto-clear error toast after 5s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Auto-clear failover notice after 6s
  useEffect(() => {
    if (failoverNotice) {
      const timer = setTimeout(clearFailoverNotice, 6000)
      return () => clearTimeout(timer)
    }
  }, [failoverNotice, clearFailoverNotice])

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
            <AlertCircle size={18} color="var(--reject)" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--reject)', marginBottom: 2 }}>Error</div>
              <div style={{ color: 'var(--text-muted)' }}>{error}</div>
            </div>
          </div>
        )}
        {failoverNotice && (
          <div className="toast toast-warn">
            <RefreshCw size={18} color="var(--scan)" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--scan)', marginBottom: 2 }}>Provider Switched</div>
              <div style={{ color: 'var(--text-muted)' }}>{failoverNotice}</div>
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
