import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ClientPortalMessages from '../components/ClientPortalMessages';
import ClientFileUpload from '../components/ClientFileUpload';
import ProjectTimeline from '../components/ProjectTimeline';
import { toast } from 'sonner';
import {
  Sparkle,
  CheckCircle,
  Clock,
  Envelope,
  CalendarBlank,
  CurrencyDollar,
  FileText,
  ChatCircle,
  SpinnerGap,
  WarningCircle,
  Scroll,
  ShieldCheck,
  DownloadSimple,
  Paperclip,
  Star,
  ArrowRight,
  Confetti,
  Check,
} from '@phosphor-icons/react';
import { trackPortalViewed } from '../utils/analytics';

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
  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #065F46 0%, #047857 30%, #059669 60%, #10B981 100%)' }}
      data-testid="celebration-overlay"
    >
      {/* Confetti-style decorative dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${8 + Math.random() * 20}px`,
              height: `${8 + Math.random() * 20}px`,
              background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#ffffff' : '#6ee7b7',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
          <Confetti weight="fill" className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
          You're All Set!
        </h1>
        <p className="text-lg text-emerald-100 mb-3">
          Thank you, {clientName}!
        </p>
        <p className="text-emerald-200/80 text-sm leading-relaxed mb-10">
          Your agreement has been signed successfully. {studioName} has been notified and will be in touch shortly with next steps.
        </p>

        <button
          onClick={onDismiss}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-800 rounded-xl font-semibold text-sm shadow-xl hover:shadow-2xl transition-all duration-200"
          data-testid="celebration-continue-btn"
        >
          Continue to Portal
          <ArrowRight weight="bold" className="w-4 h-4" />
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
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
      className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 overflow-hidden"
      data-testid={`quote-accepted-${quote.id}`}
    >
      <div className="px-6 py-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle weight="fill" className="w-7 h-7 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-emerald-900">Quote Accepted</h3>
          <p className="text-sm text-emerald-700/80">
            {formatCurrency(quote.total, quote)} &middot; Quote #{quote.quoteNumber}
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex-shrink-0">
          Confirmed
        </span>
      </div>
      <div className="px-6 py-4 border-t border-emerald-200/60 bg-emerald-50/50">
        <div className="flex items-start gap-3">
          <Check weight="bold" className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-emerald-800/90">
            {studioName} has been notified and your contract is being prepared. You'll receive it shortly.
            {quote.acceptedAt && (
              <span className="block text-xs text-emerald-600/70 mt-1">
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

  useEffect(() => {
    fetchPortalData();
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
      const sessionId = params.get('session_id');
      if (sessionId) pollPaymentStatus(sessionId);
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

  const studioName = data?.contact?.studioName || 'KOLOR STUDIO';

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <SpinnerGap weight="duotone" className="w-10 h-10 text-[#6C2EDB] animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading your project portal...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full text-center border border-gray-100">
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
      <header className="relative bg-[#1a1625] text-white overflow-hidden" data-testid="portal-header">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2EDB]/30 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-5 pt-8 pb-7">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkle weight="fill" className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <span className="text-sm font-bold tracking-widest text-white/80 uppercase">{studioName}</span>
          </div>

          <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">Project Portal</p>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{data.project.title}</h1>

          <div className="flex items-center gap-2.5 mt-4">
            <span className={`w-2 h-2 rounded-full ${
              data.status.isBooked ? 'bg-emerald-400' :
              data.status.isLost ? 'bg-red-400' :
              'bg-amber-400 animate-pulse'
            }`} />
            <span className="text-xs font-semibold text-white/70">{data.status.label}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {/* Payment Success Banner */}
        {paymentSuccess && (
          <div className="rounded-xl p-5 bg-emerald-600 text-white flex items-center gap-4" data-testid="payment-success-banner">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle weight="fill" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Payment Successful!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">Thank you! Your payment has been received.</p>
            </div>
          </div>
        )}

        {/* Status Card */}
        {!data.status.isLost && (
          <div className={`rounded-xl p-5 ${
            data.status.isBooked
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-gray-200'
          }`} data-testid="portal-status-card">
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                data.status.isBooked ? 'bg-white/20' : 'bg-[#6C2EDB]/8'
              }`}>
                {data.status.isBooked ? <CheckCircle weight="fill" className="w-5 h-5" /> : <Clock className="w-5 h-5 text-[#6C2EDB]" />}
              </div>
              <div>
                <h2 className={`text-sm font-bold ${data.status.isBooked ? '' : 'text-gray-900'}`}>
                  {data.status.isBooked ? 'Project Confirmed!' : data.status.label}
                </h2>
                <p className={`text-xs mt-0.5 ${data.status.isBooked ? 'text-emerald-100' : 'text-gray-500'}`}>
                  {data.status.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {!data.status.isLost && (
          <div className="bg-white rounded-xl border border-gray-200 p-5" data-testid="portal-progress">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 mb-5">Project Progress</h3>

            {/* Desktop */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 rounded-full">
                  <div className="h-full bg-[#6C2EDB] rounded-full transition-all duration-500" style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }} />
                </div>
                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCompleted ? 'bg-[#6C2EDB] text-white' : 'bg-gray-50 text-gray-400 border border-gray-200'
                      } ${isCurrent ? 'ring-3 ring-[#6C2EDB]/20' : ''}`}>
                        <Icon weight={isCompleted ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
                      </div>
                      <span className={`mt-2 text-[10px] font-semibold ${isCompleted ? 'text-[#6C2EDB]' : 'text-gray-400'}`}>{step.label}</span>
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
                  <div key={step.key} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${isCurrent ? 'bg-[#6C2EDB]/5 border border-[#6C2EDB]/15' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-[#6C2EDB] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon weight={isCompleted ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                    {isCurrent && <span className="ml-auto text-[10px] text-[#6C2EDB] font-semibold">Current</span>}
                    {isCompleted && index < currentStepIndex && <CheckCircle weight="fill" className="ml-auto w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5" data-testid="portal-project-details">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 mb-4">Project Details</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#6C2EDB]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkle weight="fill" className="w-4 h-4 text-[#6C2EDB]" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Service Type</p>
                <p className="text-sm font-semibold text-gray-900">{data.project.serviceType}</p>
              </div>
            </div>

            {data.project.description && (
              <div className="p-3.5 bg-gray-50 rounded-lg">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{data.project.description}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {data.project.budget && (
                <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CurrencyDollar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Budget Range</p>
                    <p className="text-sm font-semibold text-gray-900">{data.project.budget}</p>
                  </div>
                </div>
              )}
              {data.project.timeline && (
                <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Timeline</p>
                    <p className="text-sm font-semibold text-gray-900">{data.project.timeline}</p>
                  </div>
                </div>
              )}
              {data.project.eventDate && (
                <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarBlank className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Event Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(data.project.eventDate)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-[#6C2EDB]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarBlank className="w-4 h-4 text-[#6C2EDB]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Submitted On</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(data.project.submittedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5" data-testid="portal-timeline-section">
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
                  className={`bg-white rounded-xl border overflow-hidden ${
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
                      isDeclined ? 'bg-red-100 text-red-600' : isExpired ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                          <><SpinnerGap className="w-4 h-4 animate-spin" /> Processing...</>
                        ) : (
                          <><CheckCircle weight="bold" className="w-4 h-4" /> Accept Quote</>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeclineQuote(quote.quoteToken)}
                        className="px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
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
                  className={`bg-white rounded-xl border overflow-hidden transition-all ${
                    isAgreed ? 'border-emerald-200' : 'border-[#6C2EDB]/20'
                  }`}
                  data-testid={`portal-contract-${contract.id}`}
                >
                  {/* Header */}
                  <div className={`px-5 py-4 flex items-center gap-3 ${
                    isAgreed ? 'bg-emerald-50' : 'bg-[#6C2EDB]/3'
                  }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isAgreed ? 'bg-emerald-100' : 'bg-[#6C2EDB]/10'
                    }`}>
                      {isAgreed ? (
                        <ShieldCheck weight="fill" className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Scroll className="w-4 h-4 text-[#6C2EDB]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900">{contract.title}</h3>
                      <p className="text-xs text-gray-500">
                        {isAgreed ? 'Agreement signed' : 'Please review and sign below'}
                      </p>
                    </div>
                    {isAgreed && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex-shrink-0">
                        <CheckCircle weight="fill" className="w-3 h-3" /> Signed
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-5 py-5 border-t border-gray-100">
                    <div
                      className="prose prose-sm max-w-none text-gray-700 [&_h2]:text-gray-900 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-gray-900 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_strong]:text-gray-900 [&_p]:leading-relaxed [&_p]:mb-2 [&_p]:text-xs"
                      dangerouslySetInnerHTML={{ __html: contract.content }}
                    />
                  </div>

                  {/* Sign / Signed */}
                  <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    {isAgreed ? (
                      <div className="flex items-center gap-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200" data-testid={`contract-agreed-${contract.id}`}>
                        <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle weight="fill" className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-800">Agreement Signed</p>
                          <p className="text-xs text-emerald-600">
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
                            <><SpinnerGap className="w-4 h-4 animate-spin" /> Signing...</>
                          ) : (
                            <><ShieldCheck weight="bold" className="w-4 h-4" /> Sign Agreement</>
                          )}
                        </button>
                        {/* AUDIT FIX [U8.3]: Security trust signal near contract signing */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 12px', background: 'rgba(29,158,117,0.08)', borderRadius: 8 }} data-testid="signing-trust-signal">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M7 1L9 5H13L10 8L11 12L7 10L3 12L4 8L1 5H5L7 1Z" fill="#1D9E75"/>
                          </svg>
                          <span style={{ fontSize: 11, color: '#1D9E75', fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em' }}>
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
          <div className="bg-white rounded-xl border border-gray-200 p-5" data-testid="portal-activity-timeline">
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
          <div className="bg-white rounded-xl border border-gray-200 p-5" data-testid="shared-files-section">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#6C2EDB]" />
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
                    <div className="w-8 h-8 bg-[#6C2EDB]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[#6C2EDB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                        {file.uploadedBy === 'client' && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-semibold rounded-full border border-blue-100 flex-shrink-0" data-testid={`client-badge-${file.id}`}>
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
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#6C2EDB] text-white rounded-lg text-[11px] font-semibold hover:bg-[#5B27B5] transition ml-2 whitespace-nowrap"
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

        {/* Contact */}
        <div className="bg-[#1a1625] rounded-xl p-5 text-white" data-testid="portal-contact-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold mb-0.5">Have Questions?</h3>
              <p className="text-xs text-white/50">{data.contact.name} is here to help.</p>
            </div>
            <a
              href={`mailto:${data.contact.email}?subject=Re: ${data.project.title}`}
              className="inline-flex items-center gap-2 bg-white text-[#1a1625] px-5 py-2.5 rounded-lg font-semibold text-xs hover:bg-gray-100 transition-colors"
            >
              <Envelope weight="bold" className="w-4 h-4" />
              Contact Us
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-400 text-xs py-8">
          <p>Thank you for choosing us for your creative project.</p>
          <p className="mt-2 text-[10px] text-gray-300" data-testid="powered-by-badge">
            Powered by{' '}
            <Link to="/" className="text-[#6C2EDB] hover:text-[#5B27B5] transition font-semibold">
              KOLOR STUDIO
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
