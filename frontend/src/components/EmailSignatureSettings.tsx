import { useState, useEffect } from 'react'
import { EnvelopeSimple, FloppyDisk, Eye, EyeSlash, SpinnerGap } from '@phosphor-icons/react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function EmailSignatureSettings() {
  const [signature, setSignature] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setSignature(d.settings?.emailSignature || ''))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        <h3 className="text-lg font-semibold text-text-primary mb-1">Email Signature</h3>
        <p className="text-sm text-text-secondary">
          Added to all emails sent to your clients (quotes, contracts, follow-ups).
        </p>
      </div>

      <div>
        <textarea
          value={signature}
          onChange={e => setSignature(e.target.value)}
          placeholder={`Best regards,\nYour Name\nYour Studio\nyou@email.com\nInstagram: @yourstudio`}
          rows={5}
          className="w-full px-4 py-3 border border-light-200 rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono resize-y"
          data-testid="signature-textarea"
        />
      </div>

      {showPreview && signature && (
        <div className="p-4 bg-light-50 border border-light-200 rounded-lg">
          <p className="text-xs font-medium text-text-tertiary mb-2">Preview in email:</p>
          <div className="border-t border-light-200 pt-3 whitespace-pre-line text-sm text-text-secondary">
            {signature}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setShowPreview(p => !p)}
          className="px-4 py-2.5 border border-light-200 rounded-lg text-sm font-medium text-text-primary hover:bg-light-50 transition-colors flex items-center gap-2"
          data-testid="signature-preview-btn"
        >
          {showPreview ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="signature-save-btn"
        >
          {saving ? <SpinnerGap className="w-4 h-4 animate-spin" /> : saved ? <FloppyDisk className="w-4 h-4" /> : <EnvelopeSimple className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Signature'}
        </button>
      </div>
    </div>
  )
}
