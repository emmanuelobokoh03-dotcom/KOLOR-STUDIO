// iter Settings v3-v3a.2 — proactive sweep calibration.
// EmailSignatureGenerator framework calibration (Case B moderate refactor).
// Legacy palette migrated to framework tokens; typography hierarchy added.
// The GENERATED HTML signature preserves brandTheme.primaryColor because
// that content lives in the creator's external email client (Gmail/Outlook)
// — legitimate creator brand use per Path M2 scope (deprecation applies to
// public renders on the KOLOR platform, not creator-owned email surfaces).
// The internal Copy Signature button is calibrated to kolor-terra.

import { useState, useEffect } from 'react'
import { Copy } from '@phosphor-icons/react/dist/csr/Copy'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { Envelope } from '@phosphor-icons/react/dist/csr/Envelope'
import { useBrandTheme } from '../contexts/BrandThemeContext'
import { authApi } from '../services/api'

export default function EmailSignatureGenerator() {
  const brandTheme = useBrandTheme()
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    authApi.getMe().then(r => { if (r.data?.user) setUser(r.data.user) })
  }, [])

  if (!user) return null

  const portfolioUrl = `${window.location.origin}/portfolio/${user.id}`
  const primary = brandTheme.primaryColor
  const logo = brandTheme.logoUrl
  const initial = (user.studioName || user.firstName || 'S')[0]

  const signatureHTML = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
  <tr>
    <td style="padding-right:16px;vertical-align:top;">
      ${logo ? `<img src="${logo}" alt="${user.studioName || user.firstName}" style="max-width:80px;height:auto;border-radius:8px;" />` : `<div style="width:48px;height:48px;border-radius:8px;background:${primary};display:flex;align-items:center;justify-content:center;"><span style="color:white;font-weight:bold;font-size:18px;">${initial}</span></div>`}
    </td>
    <td style="vertical-align:top;">
      <div style="font-weight:bold;font-size:15px;color:#1a1a1a;margin-bottom:2px;">${user.firstName} ${user.lastName || ''}</div>
      ${user.studioName ? `<div style="color:#666;font-size:13px;margin-bottom:6px;">${user.studioName}</div>` : ''}
      <div style="margin-bottom:3px;"><a href="mailto:${user.email}" style="color:${primary};text-decoration:none;font-size:13px;">${user.email}</a></div>
      <div style="margin-top:8px;"><a href="${portfolioUrl}" style="color:${primary};text-decoration:none;font-weight:600;font-size:13px;">View Portfolio &rarr;</a></div>
    </td>
  </tr>
</table>`

  const copySignature = () => {
    const temp = document.createElement('div')
    temp.innerHTML = signatureHTML
    document.body.appendChild(temp)
    const range = document.createRange()
    range.selectNode(temp)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    document.execCommand('copy')
    window.getSelection()?.removeAllRanges()
    document.body.removeChild(temp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div data-testid="email-signature-generator">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
          }}
        >
          <Envelope
            className="w-4.5 h-4.5"
            style={{ color: 'var(--kolor-terra, #B84A2C)' }}
          />
        </div>
        <div>
          <p
            style={{
              margin: 0,
              marginBottom: 2,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-muted, #5F5751)',
            }}
          >
            External signature
          </p>
          <h3
            style={{
              margin: 0,
              marginBottom: 4,
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1.2,
              color: 'var(--kolor-ink, #1A1613)',
            }}
          >
            For Gmail, Outlook, or your personal client.
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              color: 'var(--kolor-ink-muted, #5F5751)',
            }}
          >
            Copy and paste this into your email client's signature settings.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
        dangerouslySetInnerHTML={{ __html: signatureHTML }}
      />

      {/* Copy Button — framework calibrated (kolor-terra, not brandTheme.primaryColor) */}
      <button
        onClick={copySignature}
        className="flex items-center gap-2 rounded-xl text-sm font-medium transition-all"
        style={{
          padding: '10px 18px',
          background: copied ? '#059669' : 'var(--kolor-terra, #B84A2C)',
          color: '#F7F4EE',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 11,
        }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = '#9A3E24' }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = 'var(--kolor-terra, #B84A2C)' }}
        data-testid="copy-signature-btn"
      >
        {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy signature</>}
      </button>

      {/* Instructions */}
      <div
        className="mt-4 p-3 rounded-xl"
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
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          How to add
        </p>
        <ol
          className="space-y-1 list-decimal list-inside"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          <li>Click "Copy signature" above</li>
          <li><strong style={{ color: 'var(--kolor-ink, #1A1613)' }}>Gmail:</strong> Settings → General → Signature → Paste</li>
          <li><strong style={{ color: 'var(--kolor-ink, #1A1613)' }}>Outlook:</strong> File → Options → Mail → Signatures → Paste</li>
          <li><strong style={{ color: 'var(--kolor-ink, #1A1613)' }}>Apple Mail:</strong> Preferences → Signatures → Paste</li>
        </ol>
      </div>
    </div>
  )
}
