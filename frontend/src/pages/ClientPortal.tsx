import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ClientPortalMessages from '../components/ClientPortalMessages';
import ClientFileUpload from '../components/ClientFileUpload';
import ProjectTimeline from '../components/ProjectTimeline';
import { 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Mail, 
  Calendar, 
  DollarSign, 
  FileText, 
  MessageCircle,
  Loader2,
  AlertCircle,
  ScrollText,
  ShieldCheck,
  Download,
  Paperclip
} from 'lucide-react';
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
  contact: {
    email: string;
    name: string;
  };
  meta: {
    portalViews: number;
    lastUpdated: string;
  };
}

// Status steps for progress bar
const STATUS_STEPS = [
  { key: 'NEW', label: 'Received', icon: Mail },
  { key: 'CONTACTED', label: 'In Contact', icon: MessageCircle },
  { key: 'QUOTED', label: 'Quoted', icon: FileText },
  { key: 'NEGOTIATING', label: 'Finalizing', icon: Clock },
  { key: 'BOOKED', label: 'Confirmed', icon: CheckCircle },
];

// Map actual status to step index
const STATUS_TO_STEP: Record<string, number> = {
  NEW: 0,
  REVIEWING: 0,
  CONTACTED: 1,
  QUALIFIED: 1,
  QUOTED: 2,
  NEGOTIATING: 3,
  BOOKED: 4,
  LOST: -1,
};

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreedChecked, setAgreedChecked] = useState<Record<string, boolean>>({});
  const [signing, setSigning] = useState<string | null>(null);
  const [signSuccess, setSignSuccess] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchPortalData();
    // Check for payment success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Poll session status if available
      const sessionId = params.get('session_id');
      if (sessionId) {
        pollPaymentStatus(sessionId);
      }
    }
  }, [token]);

  const fetchPortalData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/portal/${token}`);
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.message || 'Unable to load portal');
        setLoading(false);
        return;
      }

      setData(result);
      // Track portal viewed
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
        if (data.payment_status === 'paid') return; // Done
      }
    } catch {}
    setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      if (!response.ok) {
        setSignError(result.error || 'Failed to sign agreement');
        setSigning(null);
        return;
      }
      // Update the contract in local state
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
      setSignSuccess(contractId);
    } catch (err) {
      setSignError('Unable to connect. Please try again.');
    }
    setSigning(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your project portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-primary/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This project portal could not be found.'}</p>
          <p className="text-sm text-gray-500">
            Please check your link or contact us at{' '}
            <a href="mailto:emmanuelobokoh03@gmail.com" className="text-brand-primary hover:underline">
              emmanuelobokoh03@gmail.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_TO_STEP[data.status.current] ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-primary/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-primary to-brand-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">KOLOR STUDIO</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-brand-primary-light text-sm">Project Portal</p>
              <h1 className="text-2xl md:text-3xl font-bold">{data.project.title}</h1>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <span className={`w-3 h-3 rounded-full ${
                data.status.isBooked ? 'bg-green-400' : 
                data.status.isLost ? 'bg-red-400' : 
                'bg-yellow-400 animate-pulse'
              }`} />
              <span className="font-medium">{data.status.label}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Payment Success Banner */}
        {paymentSuccess && (
          <div className="rounded-2xl p-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white" data-testid="payment-success-banner">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Payment Successful!</h3>
                <p className="text-sm opacity-90">Thank you! Your payment has been received. You'll receive a confirmation shortly.</p>
              </div>
            </div>
          </div>
        )}
        {/* Status Message */}
        {!data.status.isLost && (
          <div className={`rounded-2xl p-6 ${
            data.status.isBooked 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
              : 'bg-white shadow-lg border border-gray-100'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                data.status.isBooked ? 'bg-white/20' : 'bg-brand-primary/10'
              }`}>
                {data.status.isBooked ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Clock className={`w-6 h-6 ${data.status.isBooked ? '' : 'text-brand-primary'}`} />
                )}
              </div>
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${data.status.isBooked ? '' : 'text-gray-900'}`}>
                  {data.status.isBooked ? 'Project Confirmed!' : data.status.label}
                </h2>
                <p className={data.status.isBooked ? 'text-white/90' : 'text-gray-600'}>
                  {data.status.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {!data.status.isLost && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
              Project Progress
            </h3>
            
            {/* Desktop Progress */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-primary rounded-full transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                  />
                </div>

                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-brand-primary to-brand-primary text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-brand-primary/20' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`mt-2 text-sm font-medium ${
                        isCompleted ? 'text-brand-primary' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Progress */}
            <div className="md:hidden space-y-3">
              {STATUS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.key} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isCurrent ? 'bg-brand-primary/5 border border-brand-primary/20' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-brand-primary to-brand-primary text-white' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-xs text-brand-primary font-medium">Current</span>
                    )}
                    {isCompleted && index < currentStepIndex && (
                      <CheckCircle className="ml-auto w-4 h-4 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Project Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-semibold text-gray-900">{data.project.serviceType}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">Project Description</p>
              <p className="text-gray-700 whitespace-pre-wrap">{data.project.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {data.project.budget && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget Range</p>
                    <p className="font-semibold text-gray-900">{data.project.budget}</p>
                  </div>
                </div>
              )}

              {data.project.timeline && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Timeline</p>
                    <p className="font-semibold text-gray-900">{data.project.timeline}</p>
                  </div>
                </div>
              )}

              {data.project.eventDate && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(data.project.eventDate)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <p className="font-semibold text-gray-900">{formatDate(data.project.submittedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Timeline */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6" data-testid="portal-timeline-section">
          <ProjectTimeline token={token || ''} editable={false} />
        </div>

        {/* Contracts Section */}
        {data.contracts && data.contracts.length > 0 && (
          <div className="space-y-6" data-testid="contracts-section">
            {data.contracts.map((contract) => {
              const isAgreed = contract.status === 'AGREED' || contract.clientAgreed;
              const justSigned = signSuccess === contract.id;

              return (
                <div
                  key={contract.id}
                  className={`bg-white rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 ${
                    isAgreed ? 'border-green-200' : 'border-brand-primary/20'
                  }`}
                  data-testid={`portal-contract-${contract.id}`}
                >
                  {/* Contract Header */}
                  <div className={`px-6 py-4 flex items-center gap-3 ${
                    isAgreed
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                      : 'bg-gradient-to-r from-brand-primary/5 to-brand-primary/5'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isAgreed ? 'bg-green-100' : 'bg-brand-primary/10'
                    }`}>
                      {isAgreed ? (
                        <ShieldCheck className={`w-5 h-5 text-green-600`} />
                      ) : (
                        <ScrollText className={`w-5 h-5 text-brand-primary`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900">{contract.title}</h3>
                      <p className="text-sm text-gray-500">
                        {isAgreed ? 'Agreement signed' : 'Please review and sign below'}
                      </p>
                    </div>
                    {isAgreed && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> Signed
                      </span>
                    )}
                  </div>

                  {/* Contract Content */}
                  <div className="px-6 py-6 border-t border-gray-100">
                    <div
                      className="prose prose-sm max-w-none text-gray-700 [&_h2]:text-gray-900 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-gray-900 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_strong]:text-gray-900 [&_p]:leading-relaxed [&_p]:mb-3"
                      dangerouslySetInnerHTML={{ __html: contract.content }}
                    />
                  </div>

                  {/* Agreement / Signed Section */}
                  <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
                    {isAgreed ? (
                      <div className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-500 ${
                        justSigned
                          ? 'bg-green-100 border border-green-300 animate-pulse'
                          : 'bg-green-50 border border-green-200'
                      }`} data-testid={`contract-agreed-${contract.id}`}>
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">
                            {justSigned ? 'Agreement Successfully Signed!' : 'Agreement Signed'}
                          </p>
                          <p className="text-sm text-green-600">
                            {contract.clientAgreedAt
                              ? `Signed on ${new Date(contract.clientAgreedAt).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}`
                              : 'Thank you for signing this agreement'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {signError && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm" data-testid="sign-error">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {signError}
                          </div>
                        )}

                        <label className="flex items-start gap-3 cursor-pointer select-none group" data-testid={`agree-checkbox-label-${contract.id}`}>
                          <input
                            type="checkbox"
                            checked={agreedChecked[contract.id] || false}
                            onChange={(e) => setAgreedChecked({ ...agreedChecked, [contract.id]: e.target.checked })}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                            data-testid={`agree-checkbox-${contract.id}`}
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                            I have read the terms above and I agree to the conditions outlined in this agreement.
                          </span>
                        </label>

                        <button
                          onClick={() => handleAgree(contract.id)}
                          disabled={!agreedChecked[contract.id] || signing === contract.id}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-primary to-brand-primary text-white rounded-xl font-semibold text-base hover:from-brand-primary-dark hover:to-brand-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-brand-primary/20"
                          data-testid={`sign-agreement-btn-${contract.id}`}
                        >
                          {signing === contract.id ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Signing Agreement...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-5 h-5" />
                              Sign Agreement
                            </>
                          )}
                        </button>
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Recent Updates
            </h3>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              <div className="space-y-4">
                {data.timeline.map((activity) => (
                  <div key={activity.id} className="relative flex gap-4 pl-2">
                    <div className="relative z-10 w-5 h-5 rounded-full bg-brand-primary border-4 border-white shadow flex-shrink-0" />
                    <div className="flex-1 pb-4">
                      <p className="text-gray-700">{activity.description}</p>
                      <p className="text-sm text-gray-400 mt-1">{formatTimeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shared Files Section */}
        {data.files && data.files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100" data-testid="shared-files-section">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-brand-primary" />
              Project Files
            </h3>
            <div className="space-y-3">
              {data.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-primary/30 transition-colors"
                  data-testid={`shared-file-${file.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        {file.uploadedBy === 'client' && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-full border border-blue-100 flex-shrink-0" data-testid={`client-badge-${file.id}`}>
                            You uploaded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
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
                    className="flex items-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition ml-3 whitespace-nowrap"
                    data-testid={`download-file-${file.id}`}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client File Upload */}
        <ClientFileUpload 
          token={token || ''} 
          onUploadComplete={() => fetchPortalData()} 
        />

        {/* Messaging */}
        <ClientPortalMessages 
          token={token || ''} 
          studioName={data.contact?.name || 'Studio'} 
        />

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Have Questions?</h3>
              <p className="text-brand-primary-light">
                {data.contact.name} is here to help with your project.
              </p>
            </div>
            <a 
              href={`mailto:${data.contact.email}?subject=Re: ${data.project.title}`}
              className="inline-flex items-center gap-2 bg-white text-brand-primary px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/5 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Us
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-400 text-sm py-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-gray-500">KOLOR STUDIO</span>
          </div>
          <p>Thank you for choosing us for your creative project.</p>
          <p className="mt-2">
            <Link to="/" className="text-brand-primary hover:underline">Visit our website</Link>
          </p>
          <p className="mt-3 text-xs text-gray-500" data-testid="powered-by-badge">
            Powered by{' '}
            <Link to="/" className="text-brand-primary hover:text-brand-primary-light transition">
              KOLOR STUDIO
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
