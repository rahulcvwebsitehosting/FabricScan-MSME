import React, { useCallback, useRef, useState } from 'react'
import { Upload, ImagePlus, AlertCircle, RotateCcw, X } from 'lucide-react'
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
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-xl)',
          background: isDragging ? 'var(--accent-dim)' : 'var(--surface)',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scan line animation when analyzing */}
        {activeCount > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            animation: 'scanLine 1.5s ease-in-out infinite',
            zIndex: 1,
          }} />
        )}

        <div style={{
          width: 64, height: 64,
          background: 'var(--accent-dim)',
          border: '2px solid rgba(245,158,11,0.2)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          animation: activeCount > 0 ? 'pulse-ring 1.5s ease-in-out infinite' : 'none',
        }}>
          {activeCount > 0
            ? <div style={{ width: 24, height: 24, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <Upload size={28} color="var(--accent)" />
          }
        </div>

        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {activeCount > 0 ? `Analyzing ${activeCount} image${activeCount > 1 ? 's' : ''}…` : 'Drop fabric images here'}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
          {activeCount > 0
            ? 'Gemini Vision is inspecting for defects'
            : 'or click to browse — JPEG, PNG, WEBP up to 10 MB each'
          }
        </div>

        {activeCount === 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Tears', 'Loose threads', 'Stains', 'Seam defects', 'Print errors'].map(tag => (
              <span key={tag} style={{
                padding: '4px 12px', borderRadius: 999,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--text-muted)',
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
      </div>

      {/* Sample images shortcut */}
      {queue.length === 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
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
          {queue.map(item => (
            <QueueItemRow key={item.id} item={item} onRemove={() => setQueue(q => q.filter(i => i.id !== item.id))} />
          ))}
        </div>
      )}
    </div>
  )
}

function QueueItemRow({ item, onRemove }: { item: QueueItem; onRemove: () => void }) {
  const statusColor = {
    pending:   'var(--text-dim)',
    analyzing: 'var(--accent)',
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '10px 14px',
      animation: 'fadeIn 0.25s ease forwards',
    }}>
      <img
        src={item.previewUrl}
        alt={item.file.name}
        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.file.name}
        </div>
        <div style={{ fontSize: 12, color: statusColor, marginTop: 2 }}>
          {statusLabel}
        </div>
      </div>

      {(item.status === 'timeout' || item.status === 'error') && item.retryFn && (
        <button className="btn btn-ghost btn-sm" onClick={item.retryFn}>
          <RotateCcw size={13} /> Retry
        </button>
      )}

      {item.status !== 'analyzing' && (
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}
        >
          <X size={16} />
        </button>
      )}

      {item.status === 'timeout' && (
        <AlertCircle size={16} color="var(--warn)" style={{ flexShrink: 0 }} />
      )}
    </div>
  )
}
