import { useState, useEffect } from 'react'
import KolorSpinner from './KolorSpinner'
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple'
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { EyeSlash } from '@phosphor-icons/react/dist/csr/EyeSlash'
const API_URL = import.meta.env.VITE_API_URL || ''

export default function EmailSignatureSettings() {
  const [signature, setSignature] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/settings`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSignature(d.settings?.emailSignature || ''))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`${API_URL}/api/settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSignature: signature }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6" data-testid="email-signature-settings">
      <div>
        <p
          style={{
            margin: 0,
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Email signature
        </p>
        <h3
          style={{
            margin: 0,
            marginBottom: 6,
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 20,
            lineHeight: 1.2,
            color: 'var(--kolor-ink, #1A1613)',
          }}
        >
          Sign off, every time.
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Added to all emails sent to your clients (quotes, contracts, follow-ups).
        </p>
      </div>

      <div>
        <textarea
          value={signature}
          onChange={e => setSignature(e.target.value)}
          placeholder={`Best regards,\nYour Name\nYour Studio\nyou@email.com\nInstagram: @yourstudio`}
          rows={5}
          className="w-full px-4 py-3 rounded-lg text-sm outline-none font-mono resize-y"
          style={{
            background: 'var(--kolor-canvas, #F7F4EE)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            color: 'var(--kolor-ink, #1A1613)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)'
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--kolor-terra-tint, rgba(184, 74, 44, 0.12))'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          data-testid="signature-textarea"
        />
      </div>

      {showPreview && signature && (
        <div
          className="p-4 rounded-lg"
          style={{
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: 8,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle, #928B84)',
            }}
          >
            Preview in email
          </p>
          <div
            className="pt-3 whitespace-pre-line text-sm"
            style={{
              borderTop: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink-muted, #5F5751)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {signature}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setShowPreview(p => !p)}
          className="rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            color: 'var(--kolor-ink, #1A1613)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          data-testid="signature-preview-btn"
        >
          {showPreview ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide preview' : 'Preview'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          style={{
            background: 'var(--kolor-terra, #B84A2C)',
            color: 'var(--kolor-canvas, #F7F4EE)',
            border: '1px solid var(--kolor-terra, #B84A2C)',
          }}
          data-testid="signature-save-btn"
        >
          {saving ? <KolorSpinner size={16} /> : saved ? <FloppyDisk className="w-4 h-4" /> : <EnvelopeSimple className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Signature'}
        </button>
      </div>
    </div>
  )
}
