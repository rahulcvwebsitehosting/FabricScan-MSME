import React, { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, ImagePlus, AlertCircle, RotateCcw, X, Sparkles } from 'lucide-react'
import { useInspection } from '../store/inspectionStore'
import { analyzeImage, GeminiTimeoutError } from '../services/geminiService'
import { compressImage, createPreviewUrl } from '../utils/imageUtils'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE  = 10 * 1024 * 1024 // 10 MB

interface QueueItem {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'analyzing' | 'done' | 'error' | 'timeout'
  errorMessage?: string
  retryFn?: () => void
}

export function UploadZone() {
  const { addResult, setError } = useInspection()
  const [isDragging, setIsDragging]   = useState(false)
  const [queue, setQueue]             = useState<QueueItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item))
  }, [])

  const processFile = useCallback(async (file: File, itemId: string) => {
    updateItem(itemId, { status: 'analyzing' })

    const previewUrl = createPreviewUrl(file)

    try {
      const base64 = await compressImage(file)
      const result = await analyzeImage(base64, file.name, previewUrl)
      addResult(result)
      updateItem(itemId, { status: 'done', previewUrl })
    } catch (err: unknown) {
      if (err instanceof GeminiTimeoutError) {
        updateItem(itemId, {
          status: 'timeout',
          errorMessage: 'Taking too long — Gemini is slow right now.',
          retryFn: () => processFile(file, itemId),
        })
      } else {
        const msg = err instanceof Error ? err.message : 'Analysis failed. Try again.'
        updateItem(itemId, { status: 'error', errorMessage: msg })
        setError(msg)
      }
    }
  }, [addResult, setError, updateItem])

  const enqueueFiles = useCallback((files: File[]) => {
    const valid = files.filter(f => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false
      if (f.size > MAX_FILE_SIZE) { setError(`${f.name} is too large (max 10 MB)`); return false }
      return true
    })

    const newItems: QueueItem[] = valid.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: createPreviewUrl(f),
      status: 'pending',
    }))

    setQueue(q => [...q, ...newItems])

    // Process sequentially — avoid hammering Gemini concurrently
    ;(async () => {
      for (const item of newItems) {
        await processFile(item.file, item.id)
      }
    })()
  }, [processFile, setError])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    enqueueFiles(Array.from(e.dataTransfer.files))
  }, [enqueueFiles])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const activeCount = queue.filter(i => i.status === 'analyzing').length

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Drop zone — a lens over fabric: woven texture, glass, scan-beam while analyzing */}
      <motion.div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        animate={{
          scale: isDragging ? 1.008 : 1,
          borderColor: isDragging ? 'var(--scan)' : activeCount > 0 ? 'var(--scan)' : 'var(--border-glass)',
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="glass-lamp"
        style={{
          border: `2px dashed ${isDragging || activeCount > 0 ? 'var(--scan)' : 'var(--border-glass)'}`,
          borderRadius: 'var(--radius-xl)',
          background: isDragging
            ? 'linear-gradient(155deg, rgba(58,214,240,0.1), rgba(58,214,240,0.02))'
            : undefined,
          backdropFilter: 'blur(22px) saturate(140%)',
          WebkitBackdropFilter: 'blur(22px) saturate(140%)',
          boxShadow: activeCount > 0 ? 'var(--shadow-scan)' : 'var(--shadow)',
          padding: '52px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scan-beam sweep while analyzing — the AI reading the cloth */}
        {activeCount > 0 && <div className="scan-beam" />}
        {activeCount > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--scan), transparent)',
            animation: 'scanLine 1.5s ease-in-out infinite',
            zIndex: 1,
          }} />
        )}

        <motion.div
          animate={activeCount > 0 ? { boxShadow: ['0 0 0 0 rgba(58,214,240,0.4)', '0 0 0 14px rgba(58,214,240,0)'] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 68, height: 68,
            background: activeCount > 0 ? 'var(--scan-dim)' : 'var(--accent-dim)',
            border: `2px solid ${activeCount > 0 ? 'rgba(58,214,240,0.3)' : 'rgba(240,160,32,0.25)'}`,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {activeCount > 0
            ? <div style={{ width: 24, height: 24, border: '2px solid var(--scan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <Upload size={28} color="var(--accent)" />
          }
        </motion.div>

        <div className="font-display" style={{ fontSize: 19, fontWeight: 600, marginBottom: 8, position: 'relative', zIndex: 1 }}>
          {activeCount > 0 ? `Analyzing ${activeCount} image${activeCount > 1 ? 's' : ''}…` : 'Drop fabric images here'}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 18, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {activeCount > 0
            ? <><Sparkles size={13} color="var(--scan)" /> Gemini Vision is reading the weave for defects</>
            : 'or click to browse — JPEG, PNG, WEBP up to 10 MB each'
          }
        </div>

        {activeCount === 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {['Tears', 'Loose threads', 'Stains', 'Seam defects', 'Print errors'].map(tag => (
              <span key={tag} style={{
                padding: '4px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                fontSize: 12, color: 'var(--text-muted)', backdropFilter: 'blur(6px)',
              }}>{tag}</span>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files) enqueueFiles(Array.from(e.target.files)) }}
        />
      </motion.div>

      {/* Sample images shortcut */}
      {queue.length === 0 && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Try a sample:</span>
          {[
            { label: 'Fabric tear', file: '/demo/sample_tear.jpg' },
            { label: 'Ink stain',   file: '/demo/sample_stain.jpg' },
            { label: 'Seam defect', file: '/demo/sample_seam.jpg' },
          ].map(({ label, file }) => (
            <button
              key={file}
              className="btn btn-ghost btn-sm"
              onClick={async (e) => {
                e.stopPropagation()
                const res  = await fetch(file)
                const blob = await res.blob()
                const f    = new File([blob], label + '.jpg', { type: 'image/jpeg' })
                enqueueFiles([f])
              }}
            >
              <ImagePlus size={13} /> {label}
            </button>
          ))}
        </div>
      )}

      {/* Queue items */}
      {queue.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence initial={false}>
            {queue.map(item => (
              <QueueItemRow key={item.id} item={item} onRemove={() => setQueue(q => q.filter(i => i.id !== item.id))} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function QueueItemRow({ item, onRemove }: { item: QueueItem; onRemove: () => void }) {
  const statusColor = {
    pending:   'var(--text-dim)',
    analyzing: 'var(--scan)',
    done:      'var(--ok)',
    error:     'var(--danger)',
    timeout:   'var(--warn)',
  }[item.status]

  const statusLabel = {
    pending:   'Queued',
    analyzing: 'Analyzing…',
    done:      'Complete',
    error:     item.errorMessage ?? 'Error',
    timeout:   'Timed out',
  }[item.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        borderRadius: 'var(--radius)', padding: '10px 14px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {item.status === 'analyzing' && <div className="scan-beam" style={{ opacity: 0.6 }} />}
      <img
        src={item.previewUrl}
        alt={item.file.name}
        style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border-glass)', position: 'relative', zIndex: 1 }}
      />
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.file.name}
        </div>
        <div style={{ fontSize: 12, color: statusColor, marginTop: 2 }}>
          {statusLabel}
        </div>
      </div>

      {(item.status === 'timeout' || item.status === 'error') && item.retryFn && (
        <button className="btn btn-ghost btn-sm" onClick={item.retryFn} style={{ position: 'relative', zIndex: 1 }}>
          <RotateCcw size={13} /> Retry
        </button>
      )}

      {item.status !== 'analyzing' && (
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4, position: 'relative', zIndex: 1 }}
        >
          <X size={16} />
        </button>
      )}

      {item.status === 'timeout' && (
        <AlertCircle size={16} color="var(--warn)" style={{ flexShrink: 0, position: 'relative', zIndex: 1 }} />
      )}
    </motion.div>
  )
}
