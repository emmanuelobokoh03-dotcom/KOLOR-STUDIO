import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import { trackPortalViewed } from '../utils/analytics';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    uploadedAt: string;
  }>;
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

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  const fetchPortalData = async () => {
    try {
      const response = await fetch(`${API_URL}/portal/${token}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your project portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This project portal could not be found.'}</p>
          <p className="text-sm text-gray-500">
            Please check your link or contact us at{' '}
            <a href="mailto:emmanuelobokoh03@gmail.com" className="text-violet-600 hover:underline">
              emmanuelobokoh03@gmail.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_TO_STEP[data.status.current] ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">KOLOR STUDIO</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-violet-200 text-sm">Project Portal</p>
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
        {/* Status Message */}
        {!data.status.isLost && (
          <div className={`rounded-2xl p-6 ${
            data.status.isBooked 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
              : 'bg-white shadow-lg border border-gray-100'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                data.status.isBooked ? 'bg-white/20' : 'bg-violet-100'
              }`}>
                {data.status.isBooked ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Clock className={`w-6 h-6 ${data.status.isBooked ? '' : 'text-violet-600'}`} />
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
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
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
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-violet-200' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`mt-2 text-sm font-medium ${
                        isCompleted ? 'text-violet-600' : 'text-gray-400'
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
                    isCurrent ? 'bg-violet-50 border border-violet-200' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' 
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
                      <span className="ml-auto text-xs text-violet-600 font-medium">Current</span>
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
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-violet-600" />
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
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <p className="font-semibold text-gray-900">{formatDate(data.project.submittedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                    <div className="relative z-10 w-5 h-5 rounded-full bg-violet-500 border-4 border-white shadow flex-shrink-0" />
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

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Have Questions?</h3>
              <p className="text-violet-100">
                {data.contact.name} is here to help with your project.
              </p>
            </div>
            <a 
              href={`mailto:${data.contact.email}?subject=Re: ${data.project.title}`}
              className="inline-flex items-center gap-2 bg-white text-violet-600 px-6 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors"
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
            <Link to="/" className="text-violet-600 hover:underline">Visit our website</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
