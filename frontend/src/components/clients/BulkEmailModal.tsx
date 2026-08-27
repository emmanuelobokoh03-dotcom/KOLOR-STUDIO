// iter 293-v3a — Clients v3.1 simple bulk email modal.
// iter 293-v3a.1 — Extended for:
//   • Take Action single-recipient reuse (initialSubject/initialBody props, N=1 UX)
//   • File attachment support (direct multipart to /api/leads/bulk/email;
//     multer.memoryStorage() → Resend attachments; 25MB cap client + server)

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/csr/PaperPlaneTilt'
import { Paperclip } from '@phosphor-icons/react/dist/csr/Paperclip'
import { FileText } from '@phosphor-icons/react/dist/csr/FileText'
import type { Lead } from '../../services/api'

const API_URL: string = (import.meta as any).env?.VITE_API_URL || ''
const MAX_TOTAL_BYTES = 25 * 1024 * 1024 // 25MB
const MAX_FILES = 10

interface BulkEmailModalProps {
  selectedIds: string[]
  clients: Lead[]
  onClose: () => void
  onSent?: () => void
  // iter 293-v3a.1 — Take Action pre-fill for single-recipient mode
  initialSubject?: string
  initialBody?: string
  // Header override for context ("Compose email" vs "Compose bulk email")
  titleOverride?: string
}

export function BulkEmailModal({
  selectedIds,
  clients,
  onClose,
  onSent,
  initialSubject = '',
  initialBody = '',
  titleOverride,
}: BulkEmailModalProps) {
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const recipientClients = clients.filter((c) => selectedIds.includes(c.id))
  const withEmailCount = recipientClients.filter((c) => c.clientEmail).length
  const withoutEmailCount = recipientClients.length - withEmailCount
  const isSingle = selectedIds.length === 1

  const attachmentsTotalBytes = attachments.reduce((sum, f) => sum + f.size, 0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    if (picked.length === 0) return
    const next = [...attachments, ...picked]
    if (next.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} attachments`)
      return
    }
    const totalBytes = next.reduce((sum, f) => sum + f.size, 0)
    if (totalBytes > MAX_TOTAL_BYTES) {
      toast.error(`Attachments exceed 25MB total`)
      return
    }
    setAttachments(next)
    // Reset input so re-selecting same file works
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || sending) return
    setSending(true)
    try {
      const formData = new FormData()
      formData.append('leadIds', JSON.stringify(selectedIds))
      formData.append('subject', subject.trim())
      formData.append('body', body.trim())
      for (const file of attachments) {
        formData.append('files', file, file.name)
      }
      const res = await fetch(`${API_URL}/api/leads/bulk/email`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Bulk email failed')
        setSending(false)
        return
      }
      const successCount = data?.successCount ?? 0
      const failures = Array.isArray(data?.failures) ? data.failures.length : 0
      if (failures === 0) {
        toast.success(`Sent to ${successCount} client${successCount === 1 ? '' : 's'}.`)
      } else {
        toast.warning(`Sent to ${successCount} — ${failures} failed.`)
      }
      onSent?.()
      onClose()
    } catch {
      toast.error('Bulk email failed')
    } finally {
      setSending(false)
    }
  }

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(26, 22, 19, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !sending) onClose()
      }}
      data-testid="bulk-email-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          background: 'var(--kolor-canvas, #F7F4EE)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)' }}
        >
          <div>
            <p
              className="font-mono-kolor"
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--kolor-terra, #B84A2C)',
                marginBottom: 2,
              }}
            >
              Sending to {selectedIds.length} client{selectedIds.length === 1 ? '' : 's'}
            </p>
            <h2
              className="fraunces-italic"
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: 22,
                fontWeight: 500,
                color: 'var(--kolor-ink, #1A1613)',
                lineHeight: 1.2,
              }}
            >
              {titleOverride || (isSingle ? 'Compose email' : 'Compose bulk email')}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: sending ? 'not-allowed' : 'pointer',
              color: 'var(--kolor-ink-muted, #5F5751)',
            }}
            aria-label="Close"
            data-testid="bulk-email-close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-5">
          {/* Recipient preview */}
          <div>
            <p
              className="font-mono-kolor mb-2"
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle, #928B84)',
              }}
            >
              Recipients
            </p>
            <div className="flex flex-wrap gap-1.5" data-testid="bulk-email-recipients">
              {recipientClients.slice(0, 8).map((c) => (
                <span
                  key={c.id}
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                    border: '1px solid var(--kolor-hairline, #E5E0D8)',
                    fontFamily: '"Fraunces", serif',
                    fontStyle: 'italic',
                    fontSize: 12,
                    color: c.clientEmail ? 'var(--kolor-ink, #1A1613)' : 'var(--kolor-ink-subtle, #928B84)',
                  }}
                  title={c.clientEmail || 'No email on file'}
                >
                  {c.clientName}
                  {!c.clientEmail && ' ⚠'}
                </span>
              ))}
              {recipientClients.length > 8 && (
                <span
                  className="px-2.5 py-1 rounded-full font-mono-kolor"
                  style={{
                    background: 'transparent',
                    border: '1px dashed var(--kolor-hairline, #E5E0D8)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                  }}
                >
                  +{recipientClients.length - 8} more
                </span>
              )}
            </div>
            {withoutEmailCount > 0 && (
              <p
                className="mt-2 font-mono-kolor"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-terra, #B84A2C)',
                }}
                data-testid="bulk-email-missing-warning"
              >
                {withoutEmailCount} client{withoutEmailCount === 1 ? '' : 's'} without email on file will be skipped
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label
              className="block font-mono-kolor mb-2"
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle, #928B84)',
              }}
              htmlFor="bulk-email-subject"
            >
              Subject
            </label>
            <input
              id="bulk-email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line…"
              disabled={sending}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
              style={{
                background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                color: 'var(--kolor-ink, #1A1613)',
                fontSize: 14,
                fontFamily: '"Inter", sans-serif',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)' }}
              data-testid="bulk-email-subject"
            />
          </div>

          {/* Body */}
          <div>
            <label
              className="block font-mono-kolor mb-2"
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle, #928B84)',
              }}
              htmlFor="bulk-email-body"
            >
              Message
            </label>
            <textarea
              id="bulk-email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your message… (each client will see it addressed to them by name)"
              rows={8}
              disabled={sending}
              className="w-full px-3 py-2.5 rounded-lg resize-none focus:outline-none"
              style={{
                background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                color: 'var(--kolor-ink, #1A1613)',
                fontSize: 14,
                fontFamily: '"Inter", sans-serif',
                lineHeight: 1.6,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)' }}
              data-testid="bulk-email-body"
            />
            <p
              className="mt-1 font-mono-kolor"
              style={{
                fontSize: 10,
                letterSpacing: '0.08em',
                color: 'var(--kolor-ink-subtle, #928B84)',
              }}
            >
              Each email opens with "Hi [client name]," and signs off with your name.
            </p>
          </div>

          {/* ─── Attachments (iter 293-v3a.1) ─── */}
          <div data-testid="bulk-email-attachments-section">
            <div className="flex items-baseline justify-between mb-2">
              <label
                className="font-mono-kolor"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-subtle, #928B84)',
                }}
              >
                Attachments
              </label>
              <span
                className="font-mono-kolor"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: attachmentsTotalBytes > MAX_TOTAL_BYTES * 0.9
                    ? 'var(--kolor-terra, #B84A2C)'
                    : 'var(--kolor-ink-subtle, #928B84)',
                }}
              >
                {formatBytes(attachmentsTotalBytes)} / 25 MB
              </span>
            </div>

            {attachments.length > 0 && (
              <ul className="space-y-2 mb-2" data-testid="bulk-email-attachment-list">
                {attachments.map((f, idx) => (
                  <li
                    key={`${f.name}-${idx}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{
                      background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                      border: '1px solid var(--kolor-hairline, #E5E0D8)',
                    }}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--kolor-ink-subtle, #928B84)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 13, color: 'var(--kolor-ink, #1A1613)' }}>
                        {f.name}
                      </p>
                      <p className="font-mono-kolor" style={{ fontSize: 10, color: 'var(--kolor-ink-subtle, #928B84)' }}>
                        {formatBytes(f.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      disabled={sending}
                      className="p-1 rounded hover:opacity-70"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--kolor-ink-muted, #5F5751)',
                        cursor: sending ? 'not-allowed' : 'pointer',
                      }}
                      aria-label={`Remove ${f.name}`}
                      data-testid={`bulk-email-attachment-remove-${idx}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || attachments.length >= MAX_FILES}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold"
              style={{
                background: 'transparent',
                border: '1px dashed var(--kolor-hairline, #E5E0D8)',
                color: 'var(--kolor-ink-muted, #5F5751)',
                fontSize: 12,
                cursor: sending || attachments.length >= MAX_FILES ? 'not-allowed' : 'pointer',
              }}
              data-testid="bulk-email-attach-button"
            >
              <Paperclip className="w-3.5 h-3.5" />
              {attachments.length === 0 ? 'Attach files' : 'Add more'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              data-testid="bulk-email-attach-input"
            />
          </div>
        </div>

        {/* Footer */}
        <footer
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--kolor-hairline, #E5E0D8)' }}
        >
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 rounded-lg font-semibold"
            style={{
              background: 'transparent',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink, #1A1613)',
              fontSize: 13,
              cursor: sending ? 'not-allowed' : 'pointer',
            }}
            data-testid="bulk-email-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim() || withEmailCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold"
            style={{
              background: sending || !subject.trim() || !body.trim() || withEmailCount === 0
                ? 'var(--kolor-canvas-shade-1, #F1EDE5)'
                : 'var(--kolor-terra, #B84A2C)',
              color: sending || !subject.trim() || !body.trim() || withEmailCount === 0
                ? 'var(--kolor-ink-subtle, #928B84)'
                : 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-terra, #B84A2C)',
              fontSize: 13,
              cursor: sending || !subject.trim() || !body.trim() || withEmailCount === 0 ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.7 : 1,
            }}
            data-testid="bulk-email-send"
          >
            <PaperPlaneTilt className="w-3.5 h-3.5" />
            {sending
              ? 'Sending…'
              : `Send to ${withEmailCount} client${withEmailCount === 1 ? '' : 's'}`}
          </button>
        </footer>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default BulkEmailModal
