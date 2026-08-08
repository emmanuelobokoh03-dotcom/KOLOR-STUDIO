import { useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple'
import { compressImage, detectMilestone, mapToPostIndustry } from '../../lib/imageCompress'
import { getIndustryLanguage } from '../../utils/industryLanguage'
import { Z } from '../../lib/z'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface ComposeModalProps {
  open: boolean
  onClose: () => void
  userIndustry?: string | null
  onPosted: (post: any) => void
}

// iter 287-v3a — Dribbble-style upload modal per Q56/Q72=A. Main image
// required, up to 4 additional images, title required (<=80 chars),
// description optional (<=500 chars). Milestone toggle retained per Q45=A.
// Industry auto-set from user.primaryIndustry (no picker per Q73).
export default function ComposeModal({
  open,
  onClose,
  userIndustry,
  onPosted,
}: ComposeModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [milestone, setMilestone] = useState(false)
  const [milestoneAuto, setMilestoneAuto] = useState(false)
  const [mainFile, setMainFile] = useState<File | null>(null)
  const [mainPreview, setMainPreview] = useState<string | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mainInputRef = useRef<HTMLInputElement>(null)
  const additionalInputRef = useRef<HTMLInputElement>(null)

  const postIndustry = mapToPostIndustry(userIndustry)
  const lang = getIndustryLanguage(postIndustry)
  const submitLabel = 'Post ' + lang.shot

  // Reset state on open
  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setMilestone(false)
      setMilestoneAuto(false)
      setMainFile(null)
      setMainPreview(null)
      setAdditionalFiles([])
      setAdditionalPreviews([])
      setError(null)
      setSubmitting(false)
    }
  }, [open])

  // Auto-detect milestone from title + description
  useEffect(() => {
    const combined = (title + ' ' + description).trim()
    const detected = combined.length > 0 && detectMilestone(combined)
    setMilestoneAuto(detected)
    if (detected && !milestone) setMilestone(true)
  }, [title, description]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMainSelect = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)')
      return
    }
    setError(null)
    const compressed = await compressImage(f)
    setMainFile(compressed)
    setMainPreview(URL.createObjectURL(compressed))
  }

  const handleAdditionalSelect = async (files: FileList | null) => {
    if (!files) return
    const remaining = 4 - additionalFiles.length
    const toAdd = Array.from(files).slice(0, remaining)
    for (const f of toAdd) {
      if (f.size > 10 * 1024 * 1024) continue
      const compressed = await compressImage(f)
      setAdditionalFiles((prev) => [...prev, compressed])
      setAdditionalPreviews((prev) => [...prev, URL.createObjectURL(compressed)])
    }
  }

  const removeAdditional = (idx: number) => {
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== idx))
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res = await fetch(`${API}/api/community/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const data = await res.json()
      return data.url || null
    } catch {
      return null
    }
  }

  const handleSubmit = async () => {
    if (submitting) return
    if (!mainFile) {
      setError('Add a main image')
      return
    }
    if (!title.trim()) {
      setError('Add a title')
      return
    }
    if (title.length > 80) {
      setError('Title too long (max 80 chars)')
      return
    }
    if (description.length > 500) {
      setError('Description too long (max 500 chars)')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const mainUrl = await uploadImage(mainFile)
      if (!mainUrl) {
        setError('Main image upload failed')
        setSubmitting(false)
        return
      }

      const additionalUrls: string[] = []
      for (const f of additionalFiles) {
        const url = await uploadImage(f)
        if (url) additionalUrls.push(url)
      }

      const content = description.trim() ? `${title.trim()}\n\n${description.trim()}` : title.trim()

      const res = await fetch(`${API}/api/community/posts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          industry: postIndustry,
          mainImage: mainUrl,
          additionalImages: additionalUrls,
        }),
      })
      const data = await res.json()
      if (data.post) {
        onPosted(data.post)
        onClose()
      } else {
        setError('Post failed')
      }
    } catch {
      setError('Post failed')
    }
    setSubmitting(false)
  }

  if (!open) return null

  return (
    <div
      data-testid="compose-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.MODAL,
        background: 'rgba(26, 22, 19, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'kolor-fade-in 200ms',
      }}
    >
      <div
        data-testid="compose-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--kolor-canvas)',
          border: '1px solid var(--kolor-hairline-strong)',
          borderRadius: '2px',
          padding: '32px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--kolor-terra)',
                margin: 0,
                marginBottom: '6px',
              }}
            >
              New {lang.shot}
            </p>
            <h2
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: '28px',
                fontWeight: 400,
                color: 'var(--kolor-ink)',
                margin: 0,
              }}
            >
              Share your work.
            </h2>
          </div>
          <button
            onClick={onClose}
            data-testid="compose-close"
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--kolor-hairline)',
              borderRadius: '2px',
              cursor: 'pointer',
              color: 'var(--kolor-ink-muted)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Main image */}
        {!mainPreview ? (
          <div
            data-testid="compose-main-dropzone"
            onClick={() => mainInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
            }}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files?.[0]
              if (f) handleMainSelect(f)
            }}
            style={{
              width: '100%',
              minHeight: '240px',
              background: 'var(--kolor-canvas-shade-1)',
              border: '1px dashed var(--kolor-hairline-strong)',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '32px',
              transition: 'border-color 200ms',
            }}
          >
            <UploadSimple size={28} color="var(--kolor-ink-subtle)" />
            <p
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: '18px',
                color: 'var(--kolor-ink)',
                margin: '12px 0 6px',
              }}
            >
              Drop your main image here
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle)',
                margin: 0,
              }}
            >
              or click to browse · max 10MB
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <img
              src={mainPreview}
              alt=""
              style={{
                display: 'block',
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                background: 'var(--kolor-canvas-shade-1)',
                border: '1px solid var(--kolor-hairline)',
                borderRadius: '2px',
              }}
            />
            <button
              onClick={() => {
                setMainFile(null)
                setMainPreview(null)
                if (mainInputRef.current) mainInputRef.current.value = ''
              }}
              data-testid="compose-main-remove"
              aria-label="Remove main image"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(247, 244, 238, 0.95)',
                border: '1px solid var(--kolor-hairline)',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}
        <input
          ref={mainInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleMainSelect(f)
          }}
          data-testid="compose-main-input"
        />

        {/* Additional images */}
        {mainPreview && (
          <div style={{ marginTop: '16px' }}>
            <p
              style={{
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle)',
                margin: 0,
                marginBottom: '8px',
              }}
            >
              Additional images ({additionalFiles.length}/4)
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {additionalPreviews.map((p, i) => (
                <div key={i} style={{ position: 'relative', width: '72px', height: '72px' }}>
                  <img
                    src={p}
                    alt=""
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      border: '1px solid var(--kolor-hairline)',
                      borderRadius: '2px',
                    }}
                  />
                  <button
                    onClick={() => removeAdditional(i)}
                    aria-label={`Remove additional image ${i + 1}`}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '20px',
                      height: '20px',
                      background: 'var(--kolor-ink)',
                      color: 'var(--kolor-canvas)',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {additionalFiles.length < 4 && (
                <button
                  onClick={() => additionalInputRef.current?.click()}
                  data-testid="compose-additional-add"
                  style={{
                    width: '72px',
                    height: '72px',
                    background: 'transparent',
                    border: '1px dashed var(--kolor-hairline-strong)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--kolor-ink-subtle)',
                  }}
                >
                  +
                </button>
              )}
            </div>
            <input
              ref={additionalInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleAdditionalSelect(e.target.files)}
              data-testid="compose-additional-input"
            />
          </div>
        )}

        {/* Title */}
        <div style={{ marginTop: '24px' }}>
          <label
            htmlFor="compose-title"
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle)',
              marginBottom: '8px',
            }}
          >
            Title (required)
          </label>
          <input
            id="compose-title"
            data-testid="compose-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="What is this?"
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--kolor-hairline)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 500,
              color: 'var(--kolor-ink)',
              outline: 'none',
            }}
            onFocus={(e) => {
              ;(e.currentTarget as HTMLInputElement).style.borderBottomColor =
                'var(--kolor-terra)'
            }}
            onBlur={(e) => {
              ;(e.currentTarget as HTMLInputElement).style.borderBottomColor =
                'var(--kolor-hairline)'
            }}
          />
          <div style={{ textAlign: 'right', marginTop: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '9px',
                color: 'var(--kolor-ink-subtle)',
              }}
            >
              {title.length}/80
            </span>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginTop: '16px' }}>
          <label
            htmlFor="compose-description"
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle)',
              marginBottom: '8px',
            }}
          >
            Description (optional)
          </label>
          <textarea
            id="compose-description"
            data-testid="compose-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Tell the community about it..."
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--kolor-hairline)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: 'var(--kolor-ink)',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.6,
            }}
            onFocus={(e) => {
              ;(e.currentTarget as HTMLTextAreaElement).style.borderBottomColor =
                'var(--kolor-terra)'
            }}
            onBlur={(e) => {
              ;(e.currentTarget as HTMLTextAreaElement).style.borderBottomColor =
                'var(--kolor-hairline)'
            }}
          />
          <div style={{ textAlign: 'right', marginTop: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '9px',
                color: 'var(--kolor-ink-subtle)',
              }}
            >
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Milestone toggle */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="compose-milestone"
            data-testid="compose-milestone"
            checked={milestone}
            onChange={(e) => setMilestone(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label
            htmlFor="compose-milestone"
            style={{
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: milestone ? 'var(--kolor-terra)' : 'var(--kolor-ink-muted)',
              cursor: 'pointer',
            }}
          >
            Milestone — client work delivered
            {milestoneAuto && <span style={{ marginLeft: 8 }}>· auto-detected</span>}
          </label>
        </div>

        {/* Error */}
        {error && (
          <p
            data-testid="compose-error"
            style={{
              marginTop: '16px',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#B84A2C',
            }}
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            data-testid="compose-cancel"
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: '1px solid var(--kolor-hairline)',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-muted)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !mainFile || !title.trim()}
            data-testid="compose-submit"
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid var(--kolor-terra)',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--kolor-terra)',
              cursor: submitting || !mainFile || !title.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !mainFile || !title.trim() ? 0.5 : 1,
              transition: 'background 200ms, color 200ms',
            }}
            onMouseEnter={(e) => {
              if (!submitting && mainFile && title.trim()) {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--kolor-terra)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--kolor-canvas)'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--kolor-terra)'
            }}
          >
            {submitting ? 'Posting…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
