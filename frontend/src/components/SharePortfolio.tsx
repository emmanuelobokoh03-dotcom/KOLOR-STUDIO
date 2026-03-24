import { useState, useEffect } from 'react'
import { Copy, Check, ShareNetwork, Envelope, ChatCircle, DownloadSimple } from '@phosphor-icons/react'
import QRCode from 'qrcode'
import { authApi } from '../services/api'

export default function SharePortfolio() {
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    authApi.getMe().then(r => {
      if (r.data?.user) {
        setUserId(r.data.user.id)
        const url = `${window.location.origin}/portfolio/${r.data.user.id}`
        QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } })
          .then(setQrCodeUrl)
          .catch(() => {})
      }
    })
  }, [])

  if (!userId) return null

  const portfolioUrl = `${window.location.origin}/portfolio/${userId}`

  const copyLink = () => {
    navigator.clipboard.writeText(portfolioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Check out my portfolio')
    const body = encodeURIComponent(`Hi,\n\nI'd love to share my portfolio with you:\n${portfolioUrl}\n\nLet me know what you think!`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaSMS = () => {
    const text = encodeURIComponent(`Check out my portfolio: ${portfolioUrl}`)
    window.open(`sms:?body=${text}`)
  }

  const downloadQR = () => {
    if (!qrCodeUrl) return
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = 'portfolio-qr-code.png'
    link.click()
  }

  return (
    <div className="bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 border border-brand-primary/30 rounded-2xl p-5" data-testid="share-portfolio">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          <ShareNetwork className="w-4.5 h-4.5 text-brand-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Share Your Portfolio</h3>
          <p className="text-xs text-text-secondary">Share this link to potential clients</p>
        </div>
      </div>

      {/* URL + Copy */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={portfolioUrl}
          readOnly
          className="flex-1 px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-xs text-text-secondary font-mono"
          data-testid="portfolio-url-input"
        />
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-semibold bg-brand-primary hover:bg-brand-primary-dark transition-colors whitespace-nowrap"
          data-testid="copy-portfolio-link"
        >
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>

      {/* Quick Share */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={shareViaEmail}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-light-50 border border-light-200 text-xs text-text-secondary hover:text-text-primary hover:border-light-300 transition-colors"
          data-testid="share-email"
        >
          <Envelope className="w-3.5 h-3.5" /> Email
        </button>
        <button
          onClick={shareViaSMS}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-light-50 border border-light-200 text-xs text-text-secondary hover:text-text-primary hover:border-light-300 transition-colors"
          data-testid="share-sms"
        >
          <ChatCircle className="w-3.5 h-3.5" /> Text
        </button>
      </div>

      {/* QR Code */}
      {qrCodeUrl && (
        <div className="pt-4 border-t border-brand-primary/20">
          <p className="text-xs font-medium text-text-secondary mb-3">QR Code</p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <img src={qrCodeUrl} alt="Portfolio QR Code" className="w-24 h-24 bg-surface-base rounded-lg p-1.5" data-testid="qr-code-img" />
            <div className="flex-1">
              <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                Print on business cards, posters, or marketing materials. Clients scan to view your portfolio instantly.
              </p>
              <button
                onClick={downloadQR}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-light-50 border border-light-200 text-xs text-text-secondary hover:text-text-primary hover:border-light-300 transition-colors"
                data-testid="download-qr"
              >
                <DownloadSimple className="w-3.5 h-3.5" /> DownloadSimple QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
