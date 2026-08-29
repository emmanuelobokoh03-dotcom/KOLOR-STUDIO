import { useState, useRef } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'
import { QRCodeSVG } from 'qrcode.react'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Link } from '@phosphor-icons/react/dist/csr/Link'
import { Copy } from '@phosphor-icons/react/dist/csr/Copy'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { Envelope } from '@phosphor-icons/react/dist/csr/Envelope'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut'
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple'
import { Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb'
import { ShareNetwork } from '@phosphor-icons/react/dist/csr/ShareNetwork'
import { trackPortalLinkShared } from '../utils/analytics'

interface ShareFormModalProps {
  onClose: () => void;
  userId?: string;
}

export default function ShareFormModal({ onClose, userId }: ShareFormModalProps) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl = window.location.origin;
  const inquiryUrl = userId ? `${baseUrl}/inquiry?studio=${userId}` : `${baseUrl}/inquiry`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inquiryUrl);
      trackPortalLinkShared();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        trackPortalLinkShared();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleInputClick = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const handleEmailLink = () => {
    const subject = encodeURIComponent('Submit Your Project Request');
    const body = encodeURIComponent(
`Hi,

I'd love to learn more about your project!

Please submit your details through this form, and I'll get back to you within 24 hours:

${inquiryUrl}

Looking forward to working with you!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleOpenForm = () => {
    window.open(inquiryUrl, '_blank');
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const link = document.createElement('a');
        link.download = 'kolor-studio-inquiry-qr.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const modalRef = useModalA11y(true, onClose)

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(26, 22, 19, 0.55)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-hidden animate-in fade-in duration-200"
        style={{
          background: 'var(--kolor-canvas, #F7F4EE)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          boxShadow: '0 24px 60px rgba(26, 22, 19, 0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="share-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-form-title"
      >
        {/* Header — Q1a=b: kolor-canvas-shade-1 + hairline bottom */}
        <div
          className="p-6"
          style={{
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--kolor-canvas, #F7F4EE)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  color: 'var(--kolor-ink, #1A1613)',
                }}
              >
                <ShareNetwork className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div
                  className="text-[10px] font-mono uppercase tracking-[0.14em] mb-1"
                  style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
                >
                  Share
                </div>
                <h2
                  id="share-form-title"
                  className="text-xl italic"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontWeight: 500,
                    color: 'var(--kolor-ink, #1A1613)',
                    lineHeight: 1.15,
                  }}
                >
                  Your inquiry form
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--kolor-canvas, #F7F4EE)'
                e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
              }}
              data-testid="close-share-modal"
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6" style={{ maxHeight: 'calc(90dvh - 120px)' }}>
          {/* Section 1: The Link */}
          <div>
            <label
              className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] mb-2"
              style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
            >
              <Link className="w-3.5 h-3.5" style={{ color: 'var(--kolor-terra, #B84A2C)' }} />
              Your inquiry form URL
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inquiryUrl}
                readOnly
                onClick={handleInputClick}
                className="flex-1 px-4 py-3 rounded-lg text-sm cursor-pointer outline-none transition-all"
                style={{
                  background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  color: 'var(--kolor-ink, #1A1613)',
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  fontSize: 12,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--kolor-terra-tint, rgba(184, 74, 44, 0.12))'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                data-testid="inquiry-url-input"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all min-w-[110px] justify-center"
                style={{
                  background: copied ? '#3F7A5E' : 'var(--kolor-terra, #B84A2C)',
                  color: 'var(--kolor-canvas, #F7F4EE)',
                  border: `1px solid ${copied ? '#3F7A5E' : 'var(--kolor-terra, #B84A2C)'}`,
                }}
                onMouseEnter={(e) => {
                  if (!copied) e.currentTarget.style.background = 'var(--kolor-terra-hover, #A0402A)'
                }}
                onMouseLeave={(e) => {
                  if (!copied) e.currentTarget.style.background = 'var(--kolor-terra, #B84A2C)'
                }}
                data-testid="copy-link-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Quick Actions */}
          <div>
            <label
              className="text-[10px] font-mono uppercase tracking-[0.14em] mb-3 block"
              style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
            >
              Quick actions
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleEmailLink}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all"
                style={{
                  background: 'var(--kolor-canvas, #F7F4EE)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  color: 'var(--kolor-ink, #1A1613)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)'
                  e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)'
                  e.currentTarget.style.background = 'var(--kolor-canvas, #F7F4EE)'
                }}
                data-testid="email-link-btn"
              >
                <Envelope className="w-4 h-4" style={{ color: 'var(--kolor-terra, #B84A2C)' }} />
                Email link
              </button>
              <button
                onClick={handleOpenForm}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all"
                style={{
                  background: 'var(--kolor-canvas, #F7F4EE)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  color: 'var(--kolor-ink, #1A1613)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)'
                  e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)'
                  e.currentTarget.style.background = 'var(--kolor-canvas, #F7F4EE)'
                }}
                data-testid="open-form-btn"
              >
                <ArrowSquareOut className="w-4 h-4" style={{ color: 'var(--kolor-terra, #B84A2C)' }} />
                Open form
              </button>
            </div>
          </div>

          {/* Section 3: QR Code */}
          <div>
            <label
              className="text-[10px] font-mono uppercase tracking-[0.14em] mb-3 block"
              style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
            >
              QR code for business cards
            </label>
            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
              }}
            >
              <div className="flex flex-col items-center">
                <div
                  ref={qrRef}
                  className="p-4 rounded-lg mb-4"
                  style={{
                    background: 'var(--kolor-canvas, #F7F4EE)',
                    border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  }}
                  data-testid="qr-code-container"
                >
                  <QRCodeSVG
                    value={inquiryUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                    fgColor="#1A1613"
                    bgColor="#F7F4EE"
                  />
                </div>
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
                  style={{
                    background: 'var(--kolor-terra, #B84A2C)',
                    color: 'var(--kolor-canvas, #F7F4EE)',
                    border: '1px solid var(--kolor-terra, #B84A2C)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--kolor-terra-hover, #A0402A)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--kolor-terra, #B84A2C)' }}
                  data-testid="download-qr-btn"
                >
                  <DownloadSimple weight="bold" className="w-4 h-4" />
                  Download QR code
                </button>
                <p
                  className="text-xs mt-3 text-center"
                  style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
                >
                  Print this on your business cards so clients can scan and submit inquiries instantly
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Pro Tips */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--kolor-canvas, #F7F4EE)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                }}
              >
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--kolor-terra, #B84A2C)' }} />
              </div>
              <div>
                <h4
                  className="italic text-sm mb-2"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontWeight: 500,
                    color: 'var(--kolor-ink, #1A1613)',
                  }}
                >
                  Pro tips
                </h4>
                <ul
                  className="text-sm space-y-1.5"
                  style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
                >
                  <li>• Add this link to your Instagram bio</li>
                  <li>• Include it in your email signature</li>
                  <li>• Share it on your website's contact page</li>
                  <li>• Print the QR code on your business cards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
