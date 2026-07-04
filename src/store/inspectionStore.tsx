import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react'
import type { InspectionResult, BatchStats } from '../types'
import { computeBatchStats } from '../services/geminiService'

// ─── State ───────────────────────────────────────────────────────────────────

interface InspectionState {
  results: InspectionResult[]
  isAnalyzing: boolean
  analyzingFileName: string | null
  selectedResultId: string | null
  error: string | null
  /** Currently active AI provider name shown in badge (e.g. "Gemini Vision") */
  activeProvider: string | null
  /** Brief toast shown when provider fails over (auto-clears after 6s) */
  failoverNotice: string | null
}

const initialState: InspectionState = {
  results: [],
  isAnalyzing: false,
  analyzingFileName: null,
  selectedResultId: null,
  error: null,
  activeProvider: null,
  failoverNotice: null,
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_RESULT';        payload: InspectionResult }
  | { type: 'SELECT_RESULT';     payload: string | null }
  | { type: 'SET_ANALYZING';     payload: { isAnalyzing: boolean; fileName?: string } }
  | { type: 'SET_ERROR';         payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_ACTIVE_PROVIDER'; payload: string | null }
  | { type: 'SET_FAILOVER_NOTICE'; payload: string | null }

function reducer(state: InspectionState, action: Action): InspectionState {
  switch (action.type) {
    case 'ADD_RESULT':
      return {
        ...state,
        results: [...state.results, action.payload],
        isAnalyzing: false,
        analyzingFileName: null,
        error: null,
        // Track the provider that handled this inspection
        activeProvider: action.payload.providerName ?? state.activeProvider,
        failoverNotice: action.payload.failoverOccurred
          ? `Primary provider quota reached. Automatically switched to ${action.payload.providerName ?? 'fallback'}.`
          : null,
      }
    case 'SELECT_RESULT':
      return { ...state, selectedResultId: action.payload }
    case 'SET_ANALYZING':
      return {
        ...state,
        isAnalyzing: action.payload.isAnalyzing,
        analyzingFileName: action.payload.fileName ?? null,
        error: null,
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isAnalyzing: false, analyzingFileName: null }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'CLEAR_SESSION':
      return initialState
    case 'SET_ACTIVE_PROVIDER':
      return { ...state, activeProvider: action.payload }
    case 'SET_FAILOVER_NOTICE':
      return { ...state, failoverNotice: action.payload }
    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface InspectionContextValue {
  state: InspectionState
  batchStats: BatchStats
  addResult: (result: InspectionResult) => void
  selectResult: (id: string | null) => void
  setAnalyzing: (isAnalyzing: boolean, fileName?: string) => void
  setError: (message: string) => void
  clearError: () => void
  clearSession: () => void
  clearFailoverNotice: () => void
}

const InspectionContext = createContext<InspectionContextValue | null>(null)

export function InspectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const batchStats = computeBatchStats(state.results)

  const addResult    = useCallback((r: InspectionResult) => dispatch({ type: 'ADD_RESULT', payload: r }), [])
  const selectResult = useCallback((id: string | null)   => dispatch({ type: 'SELECT_RESULT', payload: id }), [])
  const setAnalyzing = useCallback((v: boolean, f?: string) =>
    dispatch({ type: 'SET_ANALYZING', payload: { isAnalyzing: v, fileName: f } }), [])
  const setError     = useCallback((msg: string)          => dispatch({ type: 'SET_ERROR', payload: msg }), [])
  const clearError   = useCallback(()                      => dispatch({ type: 'CLEAR_ERROR' }), [])
  const clearSession = useCallback(()                      => dispatch({ type: 'CLEAR_SESSION' }), [])
  const clearFailoverNotice = useCallback(()               => dispatch({ type: 'SET_FAILOVER_NOTICE', payload: null }), [])

  return (
    <InspectionContext.Provider
      value={{ state, batchStats, addResult, selectResult, setAnalyzing, setError, clearError, clearSession, clearFailoverNotice }}
    >
      {children}
    </InspectionContext.Provider>
  )
}

export function useInspection(): InspectionContextValue {
  const ctx = useContext(InspectionContext)
  if (!ctx) throw new Error('useInspection must be used inside InspectionProvider')
  return ctx
}
