import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  X, 
  Link2, 
  Copy, 
  Check, 
  Mail, 
  ExternalLink, 
  Download,
  Lightbulb,
  Share2
} from 'lucide-react'
import { trackPortalLinkShared } from '../utils/analytics'

interface ShareFormModalProps {
  onClose: () => void;
}

export default function ShareFormModal({ onClose }: ShareFormModalProps) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl = window.location.origin;
  const inquiryUrl = `${baseUrl}/inquiry`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inquiryUrl);
      trackPortalLinkShared();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback: select the input text
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

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    // Set canvas size for high quality
    canvas.width = 512;
    canvas.height = 512;
    
    img.onload = () => {
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw QR code
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Download
        const link = document.createElement('a');
        link.download = 'kolor-studio-inquiry-qr.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-dark-border animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="share-form-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Share Your Inquiry Form</h2>
                <p className="text-violet-100 text-sm">Get potential clients to submit project requests</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              data-testid="close-share-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Section 1: The Link */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Link2 className="w-4 h-4 text-violet-400" />
              Your Inquiry Form URL
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inquiryUrl}
                readOnly
                onClick={handleInputClick}
                className="flex-1 px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg text-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
                data-testid="inquiry-url-input"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all min-w-[110px] justify-center ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                }`}
                data-testid="copy-link-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Quick Actions */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">Quick Actions</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleEmailLink}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg text-gray-300 hover:border-violet-500/50 hover:bg-dark-card-hover transition font-medium text-sm"
                data-testid="email-link-btn"
              >
                <Mail className="w-4 h-4 text-violet-400" />
                Email Link
              </button>
              <button
                onClick={handleOpenForm}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg text-gray-300 hover:border-violet-500/50 hover:bg-dark-card-hover transition font-medium text-sm"
                data-testid="open-form-btn"
              >
                <ExternalLink className="w-4 h-4 text-violet-400" />
                Open Form
              </button>
            </div>
          </div>

          {/* Section 3: QR Code */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">QR Code for Business Cards</label>
            <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6">
              <div className="flex flex-col items-center">
                <div 
                  ref={qrRef} 
                  className="bg-white p-4 rounded-lg mb-4"
                  data-testid="qr-code-container"
                >
                  <QRCodeSVG 
                    value={inquiryUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                    fgColor="#1f1f1f"
                    bgColor="#ffffff"
                  />
                </div>
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition font-medium text-sm"
                  data-testid="download-qr-btn"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Print this on your business cards so clients can scan and submit inquiries instantly
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Pro Tips */}
          <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-violet-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-200 mb-2">Pro Tips</h4>
                <ul className="text-sm text-gray-400 space-y-1.5">
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
