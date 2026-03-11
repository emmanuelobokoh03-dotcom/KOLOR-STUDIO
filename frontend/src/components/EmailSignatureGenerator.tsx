import { useState, useEffect } from 'react'
import { Copy, Check, Envelope } from '@phosphor-icons/react'
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

  const signatureHTML = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
  <tr>
    <td style="padding-right:16px;vertical-align:top;">
      ${logo ? `<img src="${logo}" alt="${user.studioName || user.firstName}" style="max-width:80px;height:auto;border-radius:8px;" />` : `<div style="width:48px;height:48px;border-radius:8px;background:${primary};display:flex;align-items:center;justify-content:center;"><span style="color:white;font-weight:bold;font-size:18px;">${(user.studioName || user.firstName || 'K')[0]}</span></div>`}
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
        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          <Envelope className="w-4.5 h-4.5 text-brand-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Email Signature</h3>
          <p className="text-xs text-text-tertiary">Professional signature with your portfolio link</p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl p-5 mb-4" dangerouslySetInnerHTML={{ __html: signatureHTML }} />

      {/* Copy Button */}
      <button
        onClick={copySignature}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all"
        style={{ background: primary }}
        data-testid="copy-signature-btn"
      >
        {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Signature</>}
      </button>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-white rounded-xl border border-light-200">
        <p className="text-xs font-medium text-text-secondary mb-2">How to add to your email:</p>
        <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
          <li>Click "Copy Signature" above</li>
          <li><strong className="text-text-secondary">Gmail:</strong> Settings → General → Signature → Paste</li>
          <li><strong className="text-text-secondary">Outlook:</strong> File → Options → Envelope → Signatures → Paste</li>
          <li><strong className="text-text-secondary">Apple Mail:</strong> Preferences → Signatures → Paste</li>
        </ol>
      </div>
    </div>
  )
}
