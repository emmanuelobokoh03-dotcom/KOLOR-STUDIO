import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ClientPortalMessages from '../components/ClientPortalMessages';
import KolorSpinner from '../components/KolorSpinner';
import ClientFileUpload from '../components/ClientFileUpload';
import ProjectTimeline from '../components/ProjectTimeline';
import { toast } from 'sonner';

/**
 * AUDIT FIX [C2]: Lightweight HTML sanitiser — strips script tags and dangerous event handlers.
 * Not as comprehensive as DOMPurify but sufficient for creator-authored contract content.
 */
function sanitiseContractHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/\b(href|src|action)\s*=\s*["']?\s*javascript:/gi, '$1="#"')
    .replace(/\bsrc\s*=\s*["']?\s*data:/gi, 'src="about:blank"')
    .replace(/\bstyle\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '')
}
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Envelope } from '@phosphor-icons/react/dist/csr/Envelope'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { CurrencyDollar } from '@phosphor-icons/react/dist/csr/CurrencyDollar'
import { FileText } from '@phosphor-icons/react/dist/csr/FileText'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { WarningCircle } from '@phosphor-icons/react/dist/csr/WarningCircle'
import { Scroll } from '@phosphor-icons/react/dist/csr/Scroll'
import { ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck'
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple'
import { Paperclip } from '@phosphor-icons/react/dist/csr/Paperclip'
import { Star } from '@phosphor-icons/react/dist/csr/Star'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { trackPortalViewed } from '../utils/analytics';
import { useConfirm } from '../components/ConfirmProvider'

const API_URL = import.meta.env.VITE_API_URL || '';

interface PortalContract {
  id: string;
  title: string;
  content: string;
  status: string;
  clientAgreed: boolean;
  clientAgreedAt?: string;
  sentAt?: string;
}

interface PortalQuote {
  id: string;
  quoteNumber: string;
  lineItems: any[];
  subtotal: number;
  tax: number;
  taxAmount: number;
  total: number;
  paymentTerms: string;
  validUntil: string;
  terms?: string;
  status: string;
  quoteToken: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: string;
}

interface PortalData {
  project: {
    id: string;
    title: string;
    serviceType: string;
    description: string;
    budget?: string;
    timeline?: string;
    eventDate?: string;
    submittedAt: string;
  };
  status: {
    current: string;
    label: string;
    description: string;
    progress: number;
    isBooked: boolean;
    isLost: boolean;
  };
  client: {
    name: string;
    email: string;
  };
  timeline: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    sharedAt?: string;
    uploadedAt: string;
    uploadedBy?: 'client' | 'creative';
  }>;
  contracts: PortalContract[];
  quotes: PortalQuote[];
  contact: {
    email: string;
    name: string;
    studioName?: string;
    brandPrimaryColor?: string | null;
    brandLogoUrl?: string | null;
  };
  meta: {
    portalViews: number;
    lastUpdated: string;
  };
}

const STATUS_STEPS = [
  { key: 'NEW', label: 'Received', icon: Envelope },
  { key: 'CONTACTED', label: 'In Contact', icon: ChatCircle },
  { key: 'QUOTED', label: 'Quoted', icon: FileText },
  { key: 'NEGOTIATING', label: 'Finalizing', icon: Clock },
  { key: 'BOOKED', label: 'Confirmed', icon: CheckCircle },
];

const STATUS_TO_STEP: Record<string, number> = {
  NEW: 0, REVIEWING: 0, CONTACTED: 1, QUALIFIED: 1,
  QUOTED: 2, NEGOTIATING: 3, BOOKED: 4, LOST: -1,
};

// ── Full-screen Celebration Overlay ──
function CelebrationOverlay({ clientName, studioName, onDismiss }: {
  clientName: string;
  studioName: string;
  onDismiss: () => void;
}) {
  // iter 280d: framework-calibrated celebration moment
  // Editorial voice: quiet-confident, not bright-jubilant
  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center px-6"
      style={{
        background: 'var(--kolor-canvas-dark)',
        animation: 'kolor-fade-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
      data-testid="celebration-overlay"
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 900px 500px at 50% 30%, rgba(184, 74, 44, 0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div className="relative text-center max-w-lg">
        <p
          className="uppercase"
          style={{
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            color: 'rgba(247, 244, 238, 0.6)',
            marginBottom: '32px',
          }}
        >
          Agreement
        </p>

        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: 'clamp(64px, 8vw, 96px)',
            lineHeight: 0.98,
            letterSpacing: '-0.025em',
            color: '#F7F4EE',
            marginBottom: '32px',
          }}
        >
          Signed.
        </h1>

        <p
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: 'rgba(247, 244, 238, 0.75)',
            marginBottom: '48px',
            maxWidth: '440px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Thank you, {clientName}. Your agreement is on record. {studioName} has been notified and will be in touch shortly.
        </p>

        <button
          onClick={onDismiss}
          className="uppercase inline-flex items-center gap-3 py-3 px-6 transition-colors"
          style={{
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            color: '#F7F4EE',
            border: '1px solid rgba(247, 244, 238, 0.35)',
            background: 'transparent',
            borderRadius: '2px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(247, 244, 238, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(247, 244, 238, 0.35)';
          }}
          data-testid="celebration-continue-btn"
        >
          Continue
        </button>
      </div>

      <style>{`
        @keyframes kolor-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Quote Accepted Confirmation ──
function QuoteAcceptedConfirmation({ quote, studioName, formatCurrency }: {
  quote: PortalQuote;
  studioName: string;
  formatCurrency: (amount: number, quote?: PortalQuote) => string;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden border border-[color:var(--kolor-hairline)]" style={{ background: 'var(--kolor-canvas)' }}
      data-testid={`quote-accepted-${quote.id}`}
    >
      <div className="px-6 py-5 flex items-center gap-4">
        <div className="flex items-center justify-center flex-shrink-0">
          <CheckCircle weight="fill" className="w-6 h-6" style={{ color: 'var(--kolor-slate)' }} />
        </div>
        <div className="flex-1">
          <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: '22px', lineHeight: 1.2, color: 'var(--kolor-ink)' }}>Quote accepted.</h3>
          <p className="text-sm" style={{ color: 'var(--kolor-ink-muted)', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '12px', letterSpacing: '0.05em' }}>
            {formatCurrency(quote.total, quote)} &middot; Quote #{quote.quoteNumber}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full flex-shrink-0 uppercase" style={{ background: 'var(--kolor-slate-tint)', color: 'var(--kolor-slate)', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.18em' }}>
          Confirmed
        </span>
      </div>
      <div className="px-6 py-4 border-t border-[color:var(--kolor-hairline)]" style={{ background: 'var(--kolor-slate-tint)' }}>
        <div className="flex items-start gap-3">
          <Check weight="bold" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--kolor-slate)' }} />
          <p className="text-sm" style={{ color: 'var(--kolor-ink)', lineHeight: 1.6 }}>
            {studioName} has been notified and your contract is being prepared. You'll receive it shortly.
            {quote.acceptedAt && (
              <span className="block mt-2 uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '10px', fontWeight: 400, letterSpacing: '0.18em', color: 'var(--kolor-ink-subtle)' }}>
                Accepted on {new Date(quote.acceptedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}


export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreedChecked, setAgreedChecked] = useState<Record<string, boolean>>({});
  const [signing, setSigning] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [quoteAccepting, setQuoteAccepting] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { confirm } = useConfirm()

  // Set browser tab title to studio + project name
  useEffect(() => {
    if (data) {
      const name = data.contact?.studioName || data.contact?.name || 'KOLOR STUDIO'
      document.title = name + ' · ' + data.project.title
    }
  }, [data])

  useEffect(() => {
    fetchPortalData();
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
      const psp = params.get('psp');
      const ref = params.get('ref');
      const sessionId = params.get('session_id');
      if (psp === 'paystack' && ref) {
        // Paystack verification — server calls Paystack verify API, updates DB, sends emails
        fetch(`${API_URL}/api/payments/paystack/verify/${encodeURIComponent(ref)}`, { credentials: 'include' })
          .then(r => r.json())
          .then((data) => {
            if (data.payment_status === 'success' || data.status === 'success') {
              fetchPortalData();
            }
          })
          .catch(e => console.error('[Portal] Paystack verify failed:', e));
      } else if (sessionId) {
        pollPaymentStatus(sessionId);
      }
    }
  }, [token]);

  const fetchPortalData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/portal/${token}`);
      const result = await response.json();
      if (!response.ok) { setError(result.message || 'Unable to load portal'); setLoading(false); return; }
      setData(result);
      trackPortalViewed();
    } catch (err) {
      console.error('Portal fetch error:', err);
      setError('Unable to connect. Please try again later.');
    }
    setLoading(false);
  };

  const pollPaymentStatus = async (sessionId: string, attempts = 0) => {
    if (attempts >= 5) return;
    try {
      const res = await fetch(`${API_URL}/api/payments/session/${sessionId}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.payment_status === 'paid') return;
      }
    } catch {}
    setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleAgree = async (contractId: string) => {
    setSigning(contractId);
    setSignError(null);
    try {
      const response = await fetch(`${API_URL}/api/contracts/${contractId}/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalToken: token }),
      });
      const result = await response.json();
      if (!response.ok) { setSignError(result.error || 'Failed to sign agreement'); setSigning(null); return; }

      // Update local state
      if (data) {
        setData({
          ...data,
          contracts: data.contracts.map(c =>
            c.id === contractId
              ? { ...c, status: 'AGREED', clientAgreed: true, clientAgreedAt: result.contract.clientAgreedAt }
              : c
          ),
        });
      }
      // Show full-screen celebration
      if (result.celebration) {
        setShowCelebration(true);
      }
    } catch (err) {
      setSignError('Unable to connect. Please try again.');
    }
    setSigning(null);
  };

  const handleAcceptQuote = async (quoteToken: string) => {
    setQuoteAccepting(quoteToken);
    try {
      const response = await fetch(`${API_URL}/api/quotes/public/${quoteToken}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: data?.client?.name,
          clientEmail: data?.client?.email,
        }),
      });
      const result = await response.json();
      if (response.ok && data) {
        setData({
          ...data,
          quotes: data.quotes.map(q =>
            q.quoteToken === quoteToken
              ? { ...q, status: 'ACCEPTED', acceptedAt: new Date().toISOString() }
              : q
          ),
        });
        toast.success('Quote accepted! Your contract is on the way.', { duration: 5000 });
      } else {
        toast.error(result.message || 'Failed to accept quote');
      }
    } catch (err) {
      console.error('Quote accept error:', err);
      toast.error('Unable to connect. Please try again.');
    }
    setQuoteAccepting(null);
  };

  const handleDeclineQuote = async (quoteToken: string) => {
    const yes = await confirm({ title: 'Decline this quote?', message: 'This action cannot be undone. The studio will be notified.', confirmLabel: 'Decline', variant: 'danger' })
    if (!yes) return
    try {
      const response = await fetch(`${API_URL}/api/quotes/public/${quoteToken}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Declined via portal' }),
      });
      if (response.ok && data) {
        setData({
          ...data,
          quotes: data.quotes.map(q =>
            q.quoteToken === quoteToken
              ? { ...q, status: 'DECLINED' }
              : q
          ),
        });
      }
    } catch (err) {
      console.error('Quote decline error:', err);
    }
  };

  const formatCurrency = (amount: number, quote?: PortalQuote) => {
    const symbol = quote?.currencySymbol || '$';
    const position = quote?.currencyPosition || 'BEFORE';
    const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return position === 'BEFORE' ? `${symbol}${formatted}` : `${formatted}${symbol}`;
  };

  const studioName = data?.contact?.studioName || data?.contact?.name || 'KOLOR STUDIO';
  const brandColor = data?.contact?.brandPrimaryColor || '#6C2EDB';
  const brandLogo = data?.contact?.brandLogoUrl || null;

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <KolorSpinner size={48} className="mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading your project portal...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4">
        <div className="bg-surface-base rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <WarningCircle weight="duotone" className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">{error || 'This project portal could not be found.'}</p>
          <p className="text-xs text-gray-400">Please check your link or contact the studio that shared it with you.</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_TO_STEP[data.status.current] ?? 0;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Celebration Overlay */}
      {showCelebration && (
        <CelebrationOverlay
          clientName={data.client.name?.split(' ')[0] || 'there'}
          studioName={studioName}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {/* ── Header ── */}
      <header className="relative text-white" style={{ background: 'var(--kolor-canvas-dark)' }} data-testid="portal-header">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 800px 400px at 15% 20%, rgba(184, 74, 44, 0.12) 0%, transparent 60%)', pointerEvents: 'none' }} aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-6 pt-10 pb-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: brandLogo ? 'rgba(255,255,255,0.12)' : '#6C2EDB' }}>
              {brandLogo ? (
                <img src={brandLogo} alt={studioName} className="w-full h-full object-contain" />
              ) : (
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{studioName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-[11px] font-medium tracking-[0.22em] text-white/60 uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace" }}>{studioName}</span>
          </div>

          <p className="text-[10px] font-medium text-white/60 uppercase tracking-[0.24em] mb-3 relative z-20" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace" }}>{data.client?.name ? `For ${data.client.name}` : "Project Portal"}</p>
          <h1 className="relative z-20 break-words" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontStyle: 'italic', fontSize: 'clamp(48px, 6.5vw, 84px)', lineHeight: 0.98, letterSpacing: '-0.025em', color: '#F7F4EE', fontOpticalSizing: 'auto', fontVariationSettings: '"opsz" 144' }}>{data.project.title}</h1>

          <div className="flex items-center gap-2.5 mt-5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: data.status.isBooked
                  ? '#4C6B4E'
                  : data.status.isLost
                    ? '#8B2E2C'
                    : '#B84A2C',
              }}
              aria-hidden="true"
            />
            <span className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', color: 'rgba(247, 244, 238, 0.75)' }}>{data.status.label}</span>
          </div>
        </div>
      </header>

      {/* -- Money moment (framework Move 1: Fraunces + mono on money) -- */}
      {(() => {
        const acceptedQuotes = data.quotes?.filter(q => q.status === 'ACCEPTED') || [];
        if (acceptedQuotes.length === 0) return null;
        const totalAmount = acceptedQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
        const referenceQuote = acceptedQuotes[0];
        const acceptedDate = referenceQuote.acceptedAt
          ? new Date(referenceQuote.acceptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : null;
        return (
          <section
            className="relative"
            style={{ background: 'var(--kolor-canvas)' }}
            data-testid="portal-money-moment"
          >
            <div className="max-w-3xl mx-auto px-6 pt-12 pb-10">
              <p
                className="uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  color: 'var(--kolor-ink-muted)',
                  marginBottom: '20px',
                }}
              >
                Investment
              </p>
              <div
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 400,
                  fontSize: 'clamp(56px, 8vw, 88px)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--kolor-ink)',
                  marginBottom: '16px',
                }}
                data-testid="portal-money-total"
              >
                {formatCurrency(totalAmount, referenceQuote)}
              </div>
              <p
                className="uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 400,
                  letterSpacing: '0.18em',
                  color: 'var(--kolor-ink-subtle)',
                }}
              >
                {acceptedQuotes.length === 1 && acceptedDate ? (
                  <>Accepted {acceptedDate}</>
                ) : acceptedQuotes.length > 1 ? (
                  <>{acceptedQuotes.length} quotes accepted</>
                ) : (
                  <>Accepted</>
                )}
              </p>
            </div>
          </section>
        );
      })()}

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {/* Payment Success Banner */}
        {paymentSuccess && (
          <div
            className="rounded-xl p-6 border flex items-center gap-4"
            style={{
              background: 'var(--kolor-slate-tint)',
              borderColor: 'var(--kolor-slate)',
              borderStyle: 'solid',
              borderWidth: '1px',
            }}
            data-testid="payment-success-banner"
          >
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>
              <CheckCircle weight="fill" className="w-6 h-6" style={{ color: 'var(--kolor-slate)' }} />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 400,
                  fontStyle: 'italic',
                  fontSize: '18px',
                  lineHeight: 1.2,
                  color: 'var(--kolor-ink)',
                }}
              >
                Payment received.
              </h3>
              <p
                className="uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  color: 'var(--kolor-ink-subtle)',
                  marginTop: '6px',
                }}
              >
                Thank you.
              </p>
            </div>
          </div>
        )}

        {/* Status Card */}
        {!data.status.isLost && (
          <div
            className="rounded-xl p-6 border"
            style={{
              background: data.status.isBooked ? 'var(--kolor-slate-tint)' : 'var(--kolor-canvas)',
              borderColor: data.status.isBooked ? 'var(--kolor-slate)' : 'var(--kolor-hairline)',
              borderStyle: 'solid',
              borderWidth: '1px',
            }}
            data-testid="portal-status-card"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                {data.status.isBooked ? <CheckCircle weight="fill" className="w-5 h-5" style={{ color: 'var(--kolor-slate)' }} /> : <Clock className="w-5 h-5" style={{ color: 'var(--kolor-terra)' }} />}
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontWeight: 400,
                    fontStyle: 'italic',
                    fontSize: '20px',
                    lineHeight: 1.2,
                    color: 'var(--kolor-ink)',
                  }}
                >
                  {data.status.isBooked ? 'Project Confirmed.' : data.status.label}
                </h2>
                <p
                  className="uppercase"
                  style={{
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 500,
                    letterSpacing: '0.24em',
                    color: 'var(--kolor-ink-subtle)',
                    marginTop: '8px',
                  }}
                >
                  {data.status.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {!data.status.isLost && (
          <div className="border border-[color:var(--kolor-hairline)] rounded-xl p-6" style={{ background: 'var(--kolor-canvas)' }} data-testid="portal-progress">
            <h3 className="mb-6 uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)' }}>Project Progress</h3>

            {/* Desktop */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-0 right-0 h-px rounded-full" style={{ background: 'var(--kolor-hairline)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`, background: 'var(--kolor-terra)' }} />
                </div>
                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: isCurrent
                            ? 'var(--kolor-terra)'
                            : isCompleted
                              ? 'var(--kolor-slate)'
                              : 'transparent',
                          color: (isCurrent || isCompleted) ? 'var(--kolor-ivory)' : 'var(--kolor-ink-whisper)',
                          border: (isCurrent || isCompleted)
                            ? 'none'
                            : '1px solid var(--kolor-hairline)',
                          boxShadow: isCurrent ? '0 0 0 3px var(--kolor-terra-tint)' : 'none',
                        }}
                      >
                        <Icon weight={isCompleted ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
                      </div>
                      <span className="mt-3 uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.18em', color: isCurrent ? 'var(--kolor-terra)' : isCompleted ? 'var(--kolor-ink-muted)' : 'var(--kolor-ink-whisper)' }}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-2">
              {STATUS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step.key} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${isCurrent ? 'bg-[color:var(--kolor-terra-tint)] border border-[color:var(--kolor-terra)]/30' : ''}`}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isCurrent
                          ? 'var(--kolor-terra)'
                          : isCompleted
                            ? 'var(--kolor-slate)'
                            : 'transparent',
                        color: (isCurrent || isCompleted) ? 'var(--kolor-ivory)' : 'var(--kolor-ink-whisper)',
                        border: (isCurrent || isCompleted) ? 'none' : '1px solid var(--kolor-hairline)',
                      }}
                    >
                      <Icon weight={isCompleted ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
                    </div>
                    <span className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em', color: isCurrent ? 'var(--kolor-terra)' : isCompleted ? 'var(--kolor-ink-muted)' : 'var(--kolor-ink-whisper)' }}>{step.label}</span>
                    {isCurrent && <span className="ml-auto uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.22em', color: 'var(--kolor-terra)' }}>Current</span>}
                    {isCompleted && index < currentStepIndex && <CheckCircle weight="fill" className="ml-auto w-3.5 h-3.5" style={{ color: 'var(--kolor-slate)' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="border border-[color:var(--kolor-hairline)] rounded-xl p-6" style={{ background: 'var(--kolor-canvas)' }} data-testid="portal-project-details">
          <h3 className="mb-6 uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)' }}>Project Details</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-4 py-4 border-b border-[color:var(--kolor-hairline)]">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <Sparkle weight="fill" className="w-4 h-4 text-[color:var(--kolor-ink-muted)]" />
              </div>
              <div>
                <p className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)', marginBottom: '6px' }}>Service Type</p>
                <p className="text-sm" style={{ color: 'var(--kolor-ink)', fontWeight: 400 }}>{data.project.serviceType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (ch: string) => ch.toUpperCase()) || ''}</p>
              </div>
            </div>

            {data.project.description && (
              <div className="py-4 border-b border-[color:var(--kolor-hairline)]">
                <p className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)', marginBottom: '8px' }}>Description</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--kolor-ink)' }}>{data.project.description}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {data.project.budget && (
                <div className="flex items-start gap-4 py-4 border-b border-[color:var(--kolor-hairline)]">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <CurrencyDollar className="w-4 h-4 text-[color:var(--kolor-ink-muted)]" />
                  </div>
                  <div>
                    <p className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)', marginBottom: '6px' }}>Budget Range</p>
                    <p className="text-sm" style={{ color: 'var(--kolor-ink)', fontWeight: 400 }}>{data.project.budget}</p>
                  </div>
                </div>
              )}
              {data.project.timeline && (
                <div className="flex items-start gap-4 py-4 border-b border-[color:var(--kolor-hairline)]">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-[color:var(--kolor-ink-muted)]" />
                  </div>
                  <div>
                    <p className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)', marginBottom: '6px' }}>Timeline</p>
                    <p className="text-sm" style={{ color: 'var(--kolor-ink)', fontWeight: 400 }}>{data.project.timeline}</p>
                  </div>
                </div>
              )}
              {data.project.eventDate && (
                <div className="flex items-start gap-4 py-4 border-b border-[color:var(--kolor-hairline)]">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <CalendarBlank className="w-4 h-4 text-[color:var(--kolor-ink-muted)]" />
                  </div>
                  <div>
                    <p className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)', marginBottom: '6px' }}>Event Date</p>
                    <p className="text-sm" style={{ color: 'var(--kolor-ink)', fontWeight: 400 }}>{formatDate(data.project.eventDate)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4 py-4 border-b border-[color:var(--kolor-hairline)]">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <CalendarBlank className="w-4 h-4 text-[color:var(--kolor-ink-muted)]" />
                </div>
                <div>
                  <p className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)', marginBottom: '6px' }}>Submitted On</p>
                  <p className="text-sm" style={{ color: 'var(--kolor-ink)', fontWeight: 400 }}>{formatDate(data.project.submittedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Timeline */}
        <div className="bg-surface-base rounded-xl border border-gray-200 p-5" data-testid="portal-timeline-section">
          <ProjectTimeline token={token || ''} editable={false} />
        </div>

        {/* ── Quotes Section ── */}
        {data.quotes && data.quotes.length > 0 && (
          <div className="space-y-4" data-testid="quotes-section">
            {data.quotes.map((quote) => {
              const isAccepted = quote.status === 'ACCEPTED';
              const isDeclined = quote.status === 'DECLINED';
              const isExpired = new Date(quote.validUntil) < new Date() && !isAccepted;
              const items = Array.isArray(quote.lineItems) ? quote.lineItems : [];

              if (isAccepted) {
                return (
                  <QuoteAcceptedConfirmation
                    key={quote.id}
                    quote={quote}
                    studioName={studioName}
                    formatCurrency={formatCurrency}
                  />
                );
              }

              return (
                <div
                  key={quote.id}
                  className={`bg-surface-base rounded-xl border overflow-hidden ${
                    isDeclined ? 'border-red-200 opacity-70' : 'border-[#6C2EDB]/20'
                  }`}
                  data-testid={`portal-quote-${quote.id}`}
                >
                  {/* Header */}
                  <div className={`px-5 py-4 flex items-center gap-3 ${
                    isDeclined ? 'bg-red-50/60' : 'bg-[#6C2EDB]/3'
                  }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDeclined ? 'bg-red-100' : 'bg-[#6C2EDB]/10'
                    }`}>
                      <FileText weight="fill" className={`w-4 h-4 ${isDeclined ? 'text-red-500' : 'text-[#6C2EDB]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900">Quote #{quote.quoteNumber}</h3>
                      <p className="text-xs text-gray-500">
                        {isDeclined ? 'Quote declined' : isExpired ? 'Quote expired' : 'Please review the details below'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${
                      isDeclined ? 'bg-[color:var(--kolor-danger)]/10 text-[color:var(--kolor-danger)]' : isExpired ? 'bg-[color:var(--kolor-ink-subtle)]/10 text-[color:var(--kolor-ink-subtle)]' : 'bg-[color:var(--kolor-terra-tint)] text-[color:var(--kolor-terra)]'
                    }`}>
                      {isDeclined ? 'Declined' : isExpired ? 'Expired' : 'Pending Review'}
                    </span>
                  </div>

                  {/* Line Items Table */}
                  <div className="px-5 py-4 border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-[10px] font-bold uppercase text-gray-400">Description</th>
                          <th className="text-right py-2 text-[10px] font-bold uppercase text-gray-400 w-14">Qty</th>
                          <th className="text-right py-2 text-[10px] font-bold uppercase text-gray-400 w-20">Rate</th>
                          <th className="text-right py-2 text-[10px] font-bold uppercase text-gray-400 w-20">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-50">
                            <td className="py-2.5 text-xs text-gray-800">{item.description}</td>
                            <td className="py-2.5 text-right text-xs text-gray-500">{item.quantity}</td>
                            <td className="py-2.5 text-right text-xs text-gray-500">{formatCurrency(item.price || item.rate || 0, quote)}</td>
                            <td className="py-2.5 text-right text-xs font-medium text-gray-800">{formatCurrency((item.quantity || 1) * (item.price || item.rate || 0), quote)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(quote.subtotal, quote)}</span>
                      </div>
                      {quote.taxAmount > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Tax ({quote.tax}%)</span>
                          <span>{formatCurrency(quote.taxAmount, quote)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                        <span>Total</span>
                        <span>{formatCurrency(quote.total, quote)}</span>
                      </div>
                    </div>

                    {quote.terms && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                        <p className="font-semibold text-gray-700 mb-0.5">Terms</p>
                        <p>{quote.terms}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2">
                      Valid until {new Date(quote.validUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Actions */}
                  {!isDeclined && !isExpired && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-2.5">
                      <button
                        onClick={() => handleAcceptQuote(quote.quoteToken)}
                        disabled={quoteAccepting === quote.quoteToken}
                        className="flex-1 px-5 py-3 bg-[#6C2EDB] text-white rounded-lg font-semibold text-sm hover:bg-[#5B27B5] transition disabled:opacity-50 flex items-center justify-center gap-2"
                        data-testid={`accept-quote-${quote.id}`}
                      >
                        {quoteAccepting === quote.quoteToken ? (
                          <><KolorSpinner size={16} color="white" /> Processing...</>
                        ) : (
                          <><CheckCircle weight="bold" className="w-4 h-4" /> Accept Quote</>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeclineQuote(quote.quoteToken)}
                        className="px-5 py-3 bg-surface-base border border-gray-200 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
                        data-testid={`decline-quote-${quote.id}`}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Contracts Section ── */}
        {data.contracts && data.contracts.length > 0 && (
          <div className="space-y-4" data-testid="contracts-section">
            {data.contracts.map((contract) => {
              const isAgreed = contract.status === 'AGREED' || contract.clientAgreed;

              return (
                <div
                  key={contract.id}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isAgreed ? 'border-[color:var(--kolor-slate)]/40' : 'border-[color:var(--kolor-terra)]/30'
                  }`}
                  style={{ background: 'var(--kolor-canvas)' }}
                  data-testid={`portal-contract-${contract.id}`}
                >
                  {/* Header */}
                  <div className={`px-5 py-4 flex items-center gap-3 ${
                    isAgreed ? 'bg-[color:var(--kolor-slate-tint)]' : 'bg-[color:var(--kolor-terra-tint)]'
                  }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      'bg-transparent'
                    }`}>
                      {isAgreed ? (
                        <ShieldCheck weight="fill" className="w-4 h-4" style={{ color: 'var(--kolor-slate)' }} />
                      ) : (
                        <Scroll className="w-4 h-4" style={{ color: 'var(--kolor-terra)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: '20px', lineHeight: 1.2, color: 'var(--kolor-ink)' }}>{contract.title}</h3>
                      <p className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)', marginTop: '4px' }}>
                        {isAgreed ? 'Agreement signed' : 'Please review and sign'}
                      </p>
                    </div>
                    {isAgreed && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full flex-shrink-0 uppercase" style={{ background: 'var(--kolor-slate-tint)', color: 'var(--kolor-slate)', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.18em' }}>
                        <CheckCircle weight="fill" className="w-3 h-3" /> Signed
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6 border-t border-[color:var(--kolor-hairline)]">
                    {/* AUDIT FIX [C2]: Sandboxed iframe for contract HTML — browser-level XSS isolation */}
                    <iframe
                      title="Contract content"
                      srcDoc={sanitiseContractHtml(contract.content)}
                      sandbox="allow-same-origin"
                      style={{ width: '100%', height: '600px', border: 'none' }}
                      className="rounded"
                    />
                  </div>

                  {/* Sign / Signed */}
                  <div className="px-6 py-5 border-t border-[color:var(--kolor-hairline)]" style={{ background: 'var(--kolor-canvas)' }}>
                    {isAgreed ? (
                      <div className="flex items-center gap-4 p-4 rounded-lg border" style={{ background: 'var(--kolor-slate-tint)', borderColor: 'var(--kolor-slate)', borderStyle: 'solid', borderWidth: '1px' }} data-testid={`contract-agreed-${contract.id}`}>
                        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                          <CheckCircle weight="fill" className="w-5 h-5" style={{ color: 'var(--kolor-slate)' }} />
                        </div>
                        <div>
                          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: '18px', lineHeight: 1.2, color: 'var(--kolor-ink)' }}>Agreement signed.</p>
                          <p className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.22em', color: 'var(--kolor-ink-subtle)', marginTop: '6px' }}>
                            {contract.clientAgreedAt
                              ? `Signed on ${new Date(contract.clientAgreedAt).toLocaleDateString('en-US', {
                                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                })}`
                              : 'Thank you for signing this agreement'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {signError && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs" data-testid="sign-error">
                            <WarningCircle className="w-4 h-4 flex-shrink-0" />
                            {signError}
                          </div>
                        )}
                        <label className="flex items-start gap-2.5 cursor-pointer select-none group" data-testid={`agree-checkbox-label-${contract.id}`}>
                          <input
                            type="checkbox"
                            checked={agreedChecked[contract.id] || false}
                            onChange={(e) => setAgreedChecked({ ...agreedChecked, [contract.id]: e.target.checked })}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#6C2EDB] focus:ring-[#6C2EDB] cursor-pointer"
                            data-testid={`agree-checkbox-${contract.id}`}
                          />
                          <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors leading-relaxed">
                            I have read the terms above and I agree to the conditions outlined in this agreement.
                          </span>
                        </label>
                        <button
                          onClick={() => handleAgree(contract.id)}
                          disabled={!agreedChecked[contract.id] || signing === contract.id}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#6C2EDB] text-white rounded-lg font-semibold text-sm hover:bg-[#5B27B5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          data-testid={`sign-agreement-btn-${contract.id}`}
                        >
                          {signing === contract.id ? (
                            <><KolorSpinner size={16} color="white" /> Signing...</>
                          ) : (
                            <><ShieldCheck weight="bold" className="w-4 h-4" /> Sign Agreement</>
                          )}
                        </button>
                        {/* AUDIT FIX [U8.3]: Security trust signal near contract signing */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 12px', background: 'rgba(29,158,117,0.08)', borderRadius: 8 }} data-testid="signing-trust-signal">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M7 1L9 5H13L10 8L11 12L7 10L3 12L4 8L1 5H5L7 1Z" fill="#1D9E75"/>
                          </svg>
                          <span style={{ fontSize: 11, color: '#1D9E75', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600, letterSpacing: '0.06em' }}>
                            E-SIGNATURE · LEGALLY BINDING · TIMESTAMPED AUDIT TRAIL
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Activity Timeline */}
        {data.timeline.length > 0 && (
          <div className="bg-surface-base rounded-xl border border-gray-200 p-5" data-testid="portal-activity-timeline">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 mb-4">Recent Updates</h3>
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-3">
                {data.timeline.map((activity) => (
                  <div key={activity.id} className="relative flex gap-3 pl-1">
                    <div className="relative z-10 w-[7px] h-[7px] mt-1.5 rounded-full bg-[#6C2EDB] border-2 border-white flex-shrink-0" />
                    <div className="flex-1 pb-1">
                      <p className="text-xs text-gray-700">{activity.description}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatTimeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shared Files */}
        {data.files && data.files.length > 0 && (
          <div className="border border-[color:var(--kolor-hairline)] rounded-xl p-6" style={{ background: 'var(--kolor-canvas)' }} data-testid="shared-files-section">
            <h3 className="mb-6 flex items-center gap-3 uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink-subtle)' }}>
              <Paperclip className="w-4 h-4" style={{ color: 'var(--kolor-ink-muted)' }} />
              Project Files
            </h3>
            <div className="space-y-2">
              {data.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#6C2EDB]/30 transition-colors"
                  data-testid={`shared-file-${file.id}`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[#6C2EDB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                        {file.uploadedBy === 'client' && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-full border border-blue-100 flex-shrink-0" data-testid={`client-badge-${file.id}`}>
                            You uploaded
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {formatFileSize(file.size)}
                        {file.sharedAt && file.uploadedBy !== 'client' && ` \u00b7 Shared ${formatTimeAgo(file.sharedAt)}`}
                        {file.uploadedBy === 'client' && ` \u00b7 Uploaded ${formatTimeAgo(file.uploadedAt)}`}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`${API_URL}/api/portal/${token}/files/${file.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#6C2EDB] text-white rounded-lg text-xs font-semibold hover:bg-[#5B27B5] transition ml-2 whitespace-nowrap"
                    data-testid={`download-file-${file.id}`}
                  >
                    <DownloadSimple weight="bold" className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client File Upload */}
        <ClientFileUpload token={token || ''} onUploadComplete={() => fetchPortalData()} />

        {/* Messaging */}
        <ClientPortalMessages token={token || ''} studioName={studioName} />

        {/* Footer (Iter 178 — elevated branded panel) */}
        <footer className="mt-12 pb-10">
          <div className="max-w-3xl mx-auto px-5">
            <div
              className="rounded-2xl px-6 py-5 flex items-center gap-3"
              style={{ background: '#1a1625' }}
            >
              <div
                className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: brandLogo ? 'rgba(255,255,255,0.08)' : '#6C2EDB' }}
              >
                {brandLogo ? (
                  <img src={brandLogo} alt={studioName} className="w-full h-full object-contain" />
                ) : (
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{studioName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80">Questions about your project?</p>
                <p className="text-[10px] text-white/40 mt-0.5">Use the message box above or reach out directly.</p>
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-4" data-testid="powered-by-badge">
              Thank you for working with <span className="font-semibold">{studioName}</span>.
              {' '}Powered by{' '}
              <Link
                to="/"
                className="font-semibold hover:underline"
                style={{ color: '#6C2EDB' }}
              >
                KOLOR STUDIO
              </Link>
            </p>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              <a href="/privacy" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Privacy Policy</a>
              {' · '}
              <a href="/terms" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Terms of Service</a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
