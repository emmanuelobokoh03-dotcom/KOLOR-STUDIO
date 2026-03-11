import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Lead, 
  LeadStatus,
  Activity,
  LeadFile,
  LEAD_STATUS_LABELS, 
  SERVICE_TYPE_LABELS,
  leadsApi 
} from '../services/api'
import {
  X,
  User,
  Envelope,
  Phone,
  Building,
  CalendarBlank,
  CurrencyDollar,
  Clock,
  FileText,
  FloppyDisk,
  SpinnerGap,
  ChatText,
  ArrowsLeftRight,
  PaperPlaneTilt,
  CheckCircle,
  Note,
  ClockCounterClockwise,
  UploadSimple,
  File,
  Image,
  Table,
  Trash,
  DownloadSimple,
  Paperclip,
  Link,
  Copy,
  ArrowSquareOut,
  Eye,
  EyeSlash,
  ChatCircle,
  ChartBar,
  Receipt,
  EnvelopeSimple,
  Package,
  Scroll,
  Flag,
  Star as StarIcon
} from '@phosphor-icons/react'
import QuotesTab from './QuotesTab'
import EmailComposerModal from './EmailComposerModal'
import BookingModal from './BookingModal'
import DeliverablesTab from './DeliverablesTab'
import ContractsTab from './ContractsTab'
import ProjectTimeline from './ProjectTimeline'
import MarkAsDeliveredButton from './MarkAsDeliveredButton'
import { 
  trackFileUploaded, 
  trackFileDownloaded, 
  trackFileDeleted,
  trackPortalLinkShared,
  trackPortalLinkEmailSent
} from '../utils/analytics'

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
  onCelebrate?: (key: string, achievementKey: string) => void;
}

const STATUS_OPTIONS: LeadStatus[] = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED', 'LOST'];

const DARK_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-purple-50 text-purple-600 border border-purple-200',
  REVIEWING: 'bg-purple-50 text-purple-600 border border-purple-200',
  CONTACTED: 'bg-purple-50 text-purple-600 border border-purple-200',
  QUALIFIED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  QUOTED: 'bg-pink-50 text-pink-600 border border-pink-200',
  NEGOTIATING: 'bg-blue-50 text-blue-700 border border-blue-200',
  BOOKED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  LOST: 'bg-slate-900/30 text-text-secondary border border-light-200/50',
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  NOTE_ADDED: Note,
  STATUS_CHANGED: ArrowsLeftRight,
  EMAIL_SENT: PaperPlaneTilt,
  EMAIL_RECEIVED: Envelope,
  CALL_MADE: Phone,
  CALL_RECEIVED: Phone,
  MEETING_SCHEDULED: CalendarBlank,
  MEETING_COMPLETED: CheckCircle,
  FILE_UPLOADED: UploadSimple,
  QUOTE_SENT: CurrencyDollar,
  PAYMENT_RECEIVED: CurrencyDollar,
  CONTRACT_SIGNED: FileText,
};

const ACTIVITY_COLORS: Record<string, string> = {
  NOTE_ADDED: 'bg-blue-50 text-blue-600',
  STATUS_CHANGED: 'bg-purple-100 text-purple-600',
  EMAIL_SENT: 'bg-green-900/50 text-green-400',
  EMAIL_RECEIVED: 'bg-teal-900/50 text-teal-400',
  CALL_MADE: 'bg-orange-900/50 text-orange-400',
  CALL_RECEIVED: 'bg-yellow-900/50 text-yellow-400',
  MEETING_SCHEDULED: 'bg-indigo-900/50 text-indigo-400',
  MEETING_COMPLETED: 'bg-emerald-50 text-emerald-600',
  FILE_UPLOADED: 'bg-pink-900/50 text-pink-400',
  QUOTE_SENT: 'bg-amber-900/50 text-amber-700',
  PAYMENT_RECEIVED: 'bg-lime-900/50 text-lime-400',
  CONTRACT_SIGNED: 'bg-cyan-900/50 text-cyan-400',
};

const FILE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  pdf: FileText,
  document: FileText,
  spreadsheet: Table,
  text: FileText,
  file: File,
};

const FILE_COLORS: Record<string, string> = {
  image: 'bg-green-900/50 text-green-400',
  pdf: 'bg-red-900/50 text-red-400',
  document: 'bg-blue-50 text-blue-600',
  spreadsheet: 'bg-emerald-50 text-emerald-600',
  text: 'bg-light-100 text-text-secondary',
  file: 'bg-purple-100 text-purple-600',
};

// Activity Skeleton
const ActivitySkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex gap-4 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-light-200 flex-shrink-0" />
        <div className="flex-1 bg-light-50 rounded-xl p-4 border border-light-200 space-y-2">
          <div className="h-3 w-24 bg-light-200 rounded" />
          <div className="h-4 w-3/4 bg-light-100 rounded" />
        </div>
      </div>
    ))}
  </div>
);

// File Grid Skeleton
const FileGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="aspect-square bg-light-50 rounded-xl border border-light-200 animate-pulse">
        <div className="w-full h-full bg-light-100 rounded-xl" />
      </div>
    ))}
  </div>
);

export default function LeadDetailModal({ lead, onClose, onUpdate, onCelebrate }: LeadDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'quotes' | 'files' | 'details' | 'deliverables' | 'contracts' | 'messages' | 'timeline'>('activity');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [formData, setFormData] = useState({
    status: lead.status,
    priority: lead.priority,
    estimatedValue: lead.estimatedValue?.toString() || '',
    timeline: lead.timeline || '',
    budget: lead.budget || '',
  });

  const [files, setFiles] = useState<LeadFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<Array<{ id: string; content: string; from: 'CLIENT' | 'CREATIVE'; read: boolean; createdAt: string }>>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleRequestTestimonial = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || ''
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/testimonials/request/${lead.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        const link = `${window.location.origin}/testimonial/${data.testimonial.publicToken}`
        await navigator.clipboard.writeText(link)
        alert('Testimonial requested! Submission link copied to clipboard.')
      } else {
        alert(data.error || 'Failed to request testimonial')
      }
    } catch { alert('Failed to request testimonial') }
  }
  const [dragOver, setDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingPortalLink, setSendingPortalLink] = useState(false);
  const [portalLinkSent, setPortalLinkSent] = useState(false);

  const baseUrl = window.location.origin;
  const portalUrl = lead.portalToken ? `${baseUrl}/portal/${lead.portalToken}` : null;

  useEffect(() => {
    fetchActivities();
    fetchFiles();
    fetchMessages();
  }, [lead.id]);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const result = await leadsApi.getMessages(lead.id);
      if (result.data?.messages) setMessages(result.data.messages);
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
    setLoadingMessages(false);
  };

  const handleSendMessage = async () => {
    if (!newMsg.trim() || sendingMsg) return;
    setSendingMsg(true);
    const result = await leadsApi.sendMessage(lead.id, newMsg.trim());
    if (result.data?.message) {
      setNewMsg('');
      fetchMessages();
    }
    setSendingMsg(false);
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const result = await leadsApi.getActivities(lead.id);
      if (result.data?.activities) {
        setActivities(result.data.activities);
      }
    } catch (error) {
      console.error('Exception fetching activities:', error);
    }
    setLoadingActivities(false);
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const result = await leadsApi.getFiles(lead.id);
      if (result.data?.files) {
        setFiles(result.data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
    setLoadingFiles(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await leadsApi.update(lead.id, {
      status: formData.status,
      priority: formData.priority as any,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
      timeline: formData.timeline,
      budget: formData.budget,
    });
    setSaving(false);

    if (result.data?.lead) {
      onUpdate(result.data.lead);
      setEditing(false);
      fetchActivities();
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const result = await leadsApi.addNote(lead.id, newNote);
      if (result.error) {
        alert(`Failed to add note: ${result.message || result.error}`);
        setAddingNote(false);
        return;
      }

      if (result.data?.activity) {
        setActivities([result.data.activity, ...activities]);
        setNewNote('');
      } else {
        await fetchActivities();
        setNewNote('');
      }
    } catch (error) {
      console.error('Exception adding note:', error);
      alert('Failed to add note. Please try again.');
    }
    setAddingNote(false);
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    setUploading(true);
    setUploadProgress(`Uploading ${fileArray.length} file(s)...`);

    try {
      const result = await leadsApi.uploadFiles(lead.id, fileArray);
      
      if (result.error) {
        alert(`Upload failed: ${result.message || result.error}`);
      } else if (result.data) {
        setUploadProgress('Upload complete!');
        fileArray.forEach(file => {
          const fileType = file.type || 'unknown';
          const sizeKB = file.size / 1024;
          trackFileUploaded(fileType, sizeKB);
        });
        await Promise.all([fetchFiles(), fetchActivities()]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    }

    setUploading(false);
    setUploadProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [lead.id]);

  const handleDeleteFile = async (fileId: string) => {
    try {
      const result = await leadsApi.deleteFile(fileId);
      if (result.error) {
        alert(`Failed to delete: ${result.message || result.error}`);
      } else {
        trackFileDeleted();
        setFiles(files.filter(f => f.id !== fileId));
        fetchActivities();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
    setDeleteConfirm(null);
  };

  const handleToggleShare = async (fileId: string, currentShared: boolean) => {
    const result = await leadsApi.toggleFileShare(fileId, !currentShared);
    if (result.data?.file) {
      setFiles(files.map(f => f.id === fileId ? { ...f, sharedWithClient: result.data!.file.sharedWithClient, sharedAt: result.data!.file.sharedAt || undefined } : f));
    }
  };

  const handleCopyPortalLink = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      trackPortalLinkShared();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleEmailPortalLink = () => {
    if (!portalUrl) return;
    trackPortalLinkShared();
    const subject = encodeURIComponent(`Your Project Portal: ${lead.projectTitle}`);
    const body = encodeURIComponent(
      `Hi ${lead.clientName.split(' ')[0]},\n\n` +
      `You can track the progress of your project "${lead.projectTitle}" anytime using this link:\n\n` +
      `${portalUrl}\n\n` +
      `Best regards,\n` +
      `KOLOR STUDIO Team`
    );
    window.open(`mailto:${lead.clientEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSendPortalLink = async () => {
    setSendingPortalLink(true);
    try {
      const result = await leadsApi.sendPortalLink(lead.id);
      if (result.error) {
        alert(`Failed to send: ${result.message || result.error}`);
      } else {
        trackPortalLinkEmailSent();
        setPortalLinkSent(true);
        setTimeout(() => setPortalLinkSent(false), 3000);
        fetchActivities();
      }
    } catch (error) {
      console.error('Send portal link error:', error);
    }
    setSendingPortalLink(false);
  };

  const handleDownload = async (file: LeadFile) => {
    try {
      trackFileDownloaded();
      const result = await leadsApi.getFileDownloadUrl(file.id);
      if (result.data?.url) {
        window.open(result.data.url, '_blank');
      } else {
        window.open(file.url, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      window.open(file.url, '_blank');
    }
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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isImageFile = (file: LeadFile) => file.category === 'image' || file.mimeType?.startsWith('image/');

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 md:p-4" onClick={onClose}>
        <div 
          className="bg-light-50 w-full md:rounded-2xl md:shadow-2xl md:max-w-3xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col border-t md:border border-light-200 animate-slide-up-full md:animate-fade-in rounded-t-2xl md:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
          data-testid="lead-detail-modal"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-primary text-white p-4 md:p-6 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <span className="text-xs px-2.5 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                  {SERVICE_TYPE_LABELS[lead.serviceType]}
                </span>
                <h2 className="text-xl md:text-2xl font-bold mt-2 truncate">{lead.projectTitle}</h2>
                <p className="text-purple-600 mt-0.5 md:mt-1 text-xs md:text-sm">Submitted {formatDate(lead.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                <button 
                  onClick={() => setShowBookingModal(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-sm font-medium backdrop-blur-sm touch-target"
                  data-testid="create-booking-btn"
                  title="Create Booking"
                >
                  <CalendarBlank className="w-4 h-4" />
                  <span className="hidden md:inline">Book</span>
                </button>
                <button 
                  onClick={() => setShowEmailComposer(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-sm font-medium backdrop-blur-sm touch-target"
                  data-testid="email-client-btn"
                  title="Email Client"
                >
                  <EnvelopeSimple className="w-4 h-4" />
                  <span className="hidden md:inline">Email</span>
                </button>
                <button 
                  onClick={handleRequestTestimonial}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-sm font-medium backdrop-blur-sm touch-target"
                  data-testid="request-testimonial-btn"
                  title="Request Testimonial"
                >
                  <StarIcon className="w-4 h-4" />
                  <span className="hidden lg:inline">Review</span>
                </button>
                <button 
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 touch-target"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Mobile action buttons */}
            <div className="flex gap-2 mt-3 sm:hidden">
              <button 
                onClick={() => setShowBookingModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/20 rounded-xl text-sm font-medium touch-target"
              >
                <CalendarBlank className="w-4 h-4" /> Book
              </button>
              <button 
                onClick={() => setShowEmailComposer(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/20 rounded-xl text-sm font-medium touch-target"
              >
                <EnvelopeSimple className="w-4 h-4" /> Email
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-light-200 flex-shrink-0 overflow-x-auto scrollbar-hide">
            {([
              { key: 'activity' as const, icon: ClockCounterClockwise, label: 'Activity' },
              { key: 'timeline' as const, icon: Flag, label: 'Timeline' },
              { key: 'contracts' as const, icon: Scroll, label: 'Contracts' },
              { key: 'quotes' as const, icon: Receipt, label: 'Quotes' },
              { key: 'files' as const, icon: Paperclip, label: 'Files', badge: files.length },
              { key: 'messages' as const, icon: ChatCircle, label: 'Messages', badge: messages.filter(m => m.from === 'CLIENT' && !m.read).length },
              { key: 'details' as const, icon: User, label: 'Details' },
              { key: 'deliverables' as const, icon: Package, label: 'Deliver.' },
            ]).map(({ key, icon: Icon, label, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-shrink-0 flex-1 min-w-0 px-2 md:px-4 py-3 md:py-3.5 text-xs md:text-sm font-medium transition-all duration-200 touch-target ${
                  activeTab === key 
                    ? 'text-purple-600 border-b-2 border-brand-primary bg-purple-50' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-light-100'
                }`}
                data-testid={`tab-${key}`}
              >
                <div className="flex items-center justify-center gap-1 md:gap-2">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="bg-purple-100 text-purple-600 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0">
                      {badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'activity' ? (
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Add Note */}
                <div className="bg-white rounded-xl p-4 md:p-5 border border-light-200">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                    <ChatText className="w-4 h-4" />
                    Add Note
                  </h3>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a note about this lead..."
                    className="w-full px-4 py-3 bg-light-50 border border-light-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm text-text-primary placeholder-gray-400 transition-all duration-200"
                    rows={3}
                    data-testid="note-input"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                      className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
                      data-testid="save-note-button"
                    >
                      {addingNote ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
                      Save Note
                    </button>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
                    <ClockCounterClockwise className="w-4 h-4" />
                    Activity ClockCounterClockwise
                  </h3>

                  {loadingActivities ? (
                    <ActivitySkeleton />
                  ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center" data-testid="activities-empty-state">
                      <div className="text-5xl md:text-6xl mb-5 md:mb-6 opacity-40 select-none">&#x1F4CA;</div>
                      <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-2">Project activity appears here</h3>
                      <p className="text-sm text-text-secondary max-w-md leading-relaxed">
                        See a timeline of all communications, file uploads, and status changes for this project.
                      </p>
                      <p className="text-xs text-text-tertiary mt-4 max-w-sm">
                        <strong>Pro tip:</strong> Every action you take is automatically logged here.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-light-200" />
                      <div className="space-y-4">
                        {activities.map((activity) => {
                          const Icon = ACTIVITY_ICONS[activity.type] || Note;
                          const colorClass = ACTIVITY_COLORS[activity.type] || 'bg-light-100 text-text-secondary';

                          return (
                            <div key={activity.id} className="relative flex gap-4 group" data-testid={`activity-${activity.id}`}>
                              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass} transition-transform duration-200 group-hover:scale-110`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="bg-white border border-light-200 rounded-xl p-4 hover:border-light-300 transition-all duration-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                                      {activity.type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-text-tertiary" title={formatDate(activity.createdAt)}>
                                      {formatTimeAgo(activity.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                                    {activity.description}
                                  </p>
                                  {activity.user && (
                                    <p className="text-xs text-gray-600 mt-2">
                                      by {activity.user.firstName} {activity.user.lastName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'files' ? (
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Mark as Delivered */}
                <MarkAsDeliveredButton
                  leadId={lead.id}
                  leadStatus={lead.status}
                  pipelineStatus={lead.pipelineStatus}
                  onSuccess={async () => {
                    const res = await leadsApi.getOne(lead.id);
                    if (res.data?.lead) onUpdate(res.data.lead);
                    fetchFiles();
                    fetchActivities();
                  }}
                />

                {/* Upload Section */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all duration-200 ${
                    dragOver 
                      ? 'border-brand-primary bg-purple-50' 
                      : 'border-light-200 hover:border-purple-300 hover:bg-white'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="file-dropzone"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                    data-testid="file-input"
                  />
                  
                  {uploading ? (
                    <div className="py-4">
                      <SpinnerGap weight="duotone" className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">{uploadProgress}</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-light-50 rounded-xl inline-block mb-3 border border-light-200">
                        <UploadSimple weight="duotone" className="w-8 h-8 text-text-secondary" />
                      </div>
                      <p className="text-text-secondary mb-2">
                        Drag and drop files here, or{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-purple-600 font-medium hover:underline"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-xs text-gray-600">
                        PDF, Word, Excel, Images up to 50MB
                      </p>
                    </>
                  )}
                </div>

                {/* Visual File Gallery */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Uploaded Files ({files.length})
                  </h3>

                  {loadingFiles ? (
                    <FileGridSkeleton />
                  ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center" data-testid="files-empty-state">
                      <div className="text-5xl md:text-6xl mb-5 md:mb-6 opacity-40 select-none">&#x1F4CE;</div>
                      <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-2">No files uploaded yet</h3>
                      <p className="text-sm text-text-secondary max-w-md mb-1 leading-relaxed">
                        UploadSimple contracts, references, or deliverables to keep everything organized with your client.
                      </p>
                      <p className="text-xs text-text-tertiary mt-3 max-w-sm">
                        <strong>Pro tip:</strong> Share files with your client by toggling "Share with client" on each file.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" data-testid="file-gallery">
                      {files.map((file) => {
                        const isImage = isImageFile(file);
                        const FileIcon = FILE_ICONS[file.category] || File;
                        const colorClass = FILE_COLORS[file.category] || 'bg-light-100 text-text-secondary';

                        return (
                          <div 
                            key={file.id} 
                            className="group relative aspect-square rounded-xl overflow-hidden border border-light-200 bg-white hover:border-purple-300 transition-all duration-200"
                            data-testid={`file-${file.id}`}
                          >
                            {/* Client upload badge */}
                            {file.uploadedBy === 'client' && (
                              <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-blue-600/80 text-white text-[10px] font-medium rounded-md flex items-center gap-1" data-testid={`client-upload-badge-${file.id}`}>
                                <UploadSimple className="w-3 h-3" /> Client
                              </div>
                            )}
                            {/* Shared badge */}
                            {file.sharedWithClient && (
                              <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-green-600/80 text-white text-[10px] font-medium rounded-md flex items-center gap-1" data-testid={`shared-badge-${file.id}`}>
                                <Eye className="w-3 h-3" /> Shared
                              </div>
                            )}

                            {/* File Content */}
                            {isImage ? (
                              <img 
                                src={file.url} 
                                alt={file.originalName}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${colorClass}`}>
                                  <FileIcon className="w-8 h-8" />
                                </div>
                                <span className="text-xs text-text-tertiary uppercase font-medium tracking-wide">
                                  {file.mimeType?.split('/').pop()?.toUpperCase() || 'FILE'}
                                </span>
                              </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center p-3">
                              <p className="text-white text-xs font-medium text-center truncate w-full mb-1" title={file.originalName}>
                                {file.originalName}
                              </p>
                              <p className="text-text-secondary text-xs mb-2">
                                {file.formattedSize}
                                {file.uploadedBy === 'client' && (
                                  <span className="ml-1 text-blue-600">&middot; Client Upload</span>
                                )}
                              </p>
                              {/* Share toggle */}
                              <button
                                onClick={() => handleToggleShare(file.id, !!file.sharedWithClient)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium mb-2 transition-all ${
                                  file.sharedWithClient
                                    ? 'bg-green-600/30 text-green-400 hover:bg-green-600/50'
                                    : 'bg-light-200 text-text-secondary hover:bg-light-200'
                                }`}
                                data-testid={`share-toggle-${file.id}`}
                              >
                                {file.sharedWithClient ? <><Eye className="w-3 h-3" /> Shared</> : <><EyeSlash className="w-3 h-3" /> Private</>}
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownload(file)}
                                  className="p-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary transition-all duration-200"
                                  title="Download"
                                  data-testid={`download-${file.id}`}
                                >
                                  <DownloadSimple weight="bold" className="w-4 h-4" />
                                </button>
                                
                                {deleteConfirm === file.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDeleteFile(file.id)}
                                      className="px-3 py-2 bg-red-600 text-white text-xs rounded-xl hover:bg-red-500 transition-all duration-200"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="px-3 py-2 bg-light-200 text-text-secondary text-xs rounded-xl hover:bg-light-200 transition-all duration-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(file.id)}
                                    className="p-2.5 bg-red-600/30 text-red-400 rounded-xl hover:bg-red-600/50 transition-all duration-200"
                                    title="Delete"
                                    data-testid={`delete-${file.id}`}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'timeline' ? (
              <div className="p-4 md:p-6">
                <ProjectTimeline leadId={lead.id} editable={true} authToken={localStorage.getItem('token') || undefined} />
              </div>
            ) : activeTab === 'quotes' ? (
              <QuotesTab 
                lead={lead} 
                onQuoteUpdate={() => {
                  fetchActivities();
                }}
                onQuoteSent={() => onCelebrate?.('first_quote', 'firstQuote')}
              />
            ) : activeTab === 'deliverables' ? (
              <div className="p-4 md:p-6">
                <DeliverablesTab leadId={lead.id} />
              </div>
            ) : activeTab === 'contracts' ? (
              <ContractsTab leadId={lead.id} lead={lead} onContractSigned={() => onCelebrate?.('first_contract', 'firstContract')} />
            ) : activeTab === 'messages' ? (
              <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[400px]" data-testid="messages-thread">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8"><SpinnerGap className="w-5 h-5 animate-spin text-text-tertiary" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <ChatCircle weight="duotone" className="w-10 h-10 mx-auto mb-3 text-text-primary" />
                      <p className="text-text-secondary text-sm mb-1">No messages yet</p>
                      <p className="text-text-tertiary text-xs">Send a message to your client via the portal</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.from === 'CREATIVE' ? 'justify-end' : 'justify-start'}`} data-testid={`msg-${msg.id}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          msg.from === 'CREATIVE'
                            ? 'bg-brand-primary text-white rounded-br-md'
                            : 'bg-light-50 text-text-primary rounded-bl-md border border-light-200'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.from === 'CREATIVE' ? 'text-white/60' : 'text-text-tertiary'}`}>
                            {msg.from === 'CREATIVE' ? 'You' : lead.clientName} &middot; {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 pt-3 border-t border-light-200">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-white border border-light-200 rounded-xl text-text-primary placeholder-gray-400 text-sm focus:outline-none focus:border-brand-primary"
                    disabled={sendingMsg}
                    data-testid="creative-message-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMsg || !newMsg.trim()}
                    className="px-4 py-2.5 bg-brand-primary text-white rounded-xl font-medium text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                    data-testid="creative-send-message-btn"
                  >
                    <PaperPlaneTilt weight="bold" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Status & Actions */}
                <div className="flex items-center justify-between pb-6 border-b border-light-200">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary">Status:</span>
                    {editing ? (
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                        className="px-3 py-1.5 bg-white border border-light-200 rounded-xl text-sm text-text-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${DARK_STATUS_COLORS[lead.status]}`}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    )}
                  </div>
                  {editing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 text-text-secondary hover:bg-light-100 rounded-xl text-sm transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm hover:bg-brand-primary flex items-center gap-2 transition-all duration-200"
                      >
                        {saving ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                      Edit Lead
                    </button>
                  )}
                </div>

                {/* Client Information */}
                <div>
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-text-primary">
                    <User className="w-5 h-5 text-purple-600" />
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-xl border border-light-200 hover:border-light-300 transition-all duration-200">
                      <User className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-text-tertiary">Name</p>
                        <p className="font-medium text-text-primary">{lead.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-xl border border-light-200 hover:border-light-300 transition-all duration-200">
                      <Envelope className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-text-tertiary">Email</p>
                        <a href={`mailto:${lead.clientEmail}`} className="font-medium text-purple-600 hover:underline">
                          {lead.clientEmail}
                        </a>
                      </div>
                    </div>
                    {lead.clientPhone && (
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-light-200 hover:border-light-300 transition-all duration-200">
                        <Phone className="w-5 h-5 text-text-tertiary" />
                        <div>
                          <p className="text-xs text-text-tertiary">Phone</p>
                          <a href={`tel:${lead.clientPhone}`} className="font-medium text-text-primary">{lead.clientPhone}</a>
                        </div>
                      </div>
                    )}
                    {lead.clientCompany && (
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-light-200 hover:border-light-300 transition-all duration-200">
                        <Building className="w-5 h-5 text-text-tertiary" />
                        <div>
                          <p className="text-xs text-text-tertiary">Company</p>
                          <p className="font-medium text-text-primary">{lead.clientCompany}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Details */}
                <div>
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-text-primary">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Project Details
                  </h3>
                  <div className="bg-white rounded-xl p-4 md:p-5 mb-3 md:mb-4 border border-light-200">
                    <p className="text-text-secondary whitespace-pre-wrap text-sm leading-relaxed">{lead.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {(editing || lead.budget) && (
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-light-200">
                        <CurrencyDollar className="w-5 h-5 text-text-tertiary" />
                        <div className="flex-1">
                          <p className="text-xs text-text-tertiary">Budget</p>
                          {editing ? (
                            <input
                              type="text"
                              value={formData.budget}
                              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                              className="w-full px-2 py-1 bg-light-50 border border-light-200 rounded-lg text-sm text-text-primary"
                              placeholder="e.g., $5,000-$10,000"
                            />
                          ) : (
                            <p className="font-medium text-text-primary">{lead.budget}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {(editing || lead.timeline) && (
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-light-200">
                        <Clock className="w-5 h-5 text-text-tertiary" />
                        <div className="flex-1">
                          <p className="text-xs text-text-tertiary">Timeline</p>
                          {editing ? (
                            <input
                              type="text"
                              value={formData.timeline}
                              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                              className="w-full px-2 py-1 bg-light-50 border border-light-200 rounded-lg text-sm text-text-primary"
                              placeholder="e.g., March 2026"
                            />
                          ) : (
                            <p className="font-medium text-text-primary">{lead.timeline}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {lead.eventDate && (
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-light-200">
                        <CalendarBlank className="w-5 h-5 text-text-tertiary" />
                        <div>
                          <p className="text-xs text-text-tertiary">Event Date</p>
                          <p className="font-medium text-text-primary">{formatDate(lead.eventDate)}</p>
                        </div>
                      </div>
                    )}
                    {(editing || lead.estimatedValue) && (
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-light-200">
                        <CurrencyDollar className="w-5 h-5 text-green-500" />
                        <div className="flex-1">
                          <p className="text-xs text-text-tertiary">Estimated Value</p>
                          {editing ? (
                            <input
                              type="number"
                              value={formData.estimatedValue}
                              onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                              className="w-full px-2 py-1 bg-light-50 border border-light-200 rounded-lg text-sm text-text-primary"
                              placeholder="5000"
                            />
                          ) : (
                            <p className="font-medium text-green-400">
                              ${lead.estimatedValue?.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Portal Section */}
                {portalUrl && (
                  <div>
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-text-primary">
                      <ChartBar className="w-5 h-5 text-purple-600" />
                      Client Portal
                    </h3>
                    <div className="rounded-xl border border-light-200 bg-white p-3 mb-4">
                      <p className="text-xs text-text-secondary leading-relaxed">
                        <strong className="text-purple-600">Pro tip:</strong> Your client can view quotes, sign contracts, and track progress — all without logging in!
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-brand-primary-dark/30 to-brand-primary-dark/30 border border-purple-200 rounded-xl p-5 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Link className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-text-secondary">Portal URL</span>
                      </div>
                      <div className="flex items-center gap-2 bg-light-50 rounded-xl p-2 border border-light-200">
                        <input
                          type="text"
                          value={portalUrl}
                          readOnly
                          className="flex-1 text-sm text-text-secondary bg-transparent border-none focus:outline-none truncate"
                          data-testid="portal-url-input"
                        />
                        <button
                          onClick={handleCopyPortalLink}
                          className={`px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all duration-200 ${
                            copiedLink 
                              ? 'bg-green-900/50 text-green-400' 
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-100'
                          }`}
                          data-testid="copy-portal-link-btn"
                        >
                          {copiedLink ? (
                            <><CheckCircle className="w-4 h-4" /> Copied!</>
                          ) : (
                            <><Copy className="w-4 h-4" /> Copy</>
                          )}
                        </button>
                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-brand-primary text-white rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-brand-primary transition-all duration-200"
                          data-testid="open-portal-btn"
                        >
                          <ArrowSquareOut className="w-4 h-4" />
                          Open
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-light-200">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-200">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary">Portal Views</p>
                          <p className="font-semibold text-lg text-text-primary">{lead.portalViews || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-light-200">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center border border-purple-200">
                          <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary">Last Viewed</p>
                          <p className="font-medium text-text-primary">
                            {lead.lastPortalView ? formatTimeAgo(lead.lastPortalView) : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <button
                          onClick={handleCopyPortalLink}
                          className="flex-1 px-4 py-2.5 border border-light-200 rounded-xl text-sm font-medium text-text-secondary hover:bg-light-100 flex items-center justify-center gap-2 transition-all duration-200"
                          data-testid="copy-link-btn"
                        >
                          <Copy className="w-4 h-4" /> Copy Link
                        </button>
                        <button
                          onClick={handleEmailPortalLink}
                          className="flex-1 px-4 py-2.5 border border-light-200 rounded-xl text-sm font-medium text-text-secondary hover:bg-light-100 flex items-center justify-center gap-2 transition-all duration-200"
                          data-testid="email-portal-link-btn"
                        >
                          <Envelope className="w-4 h-4" /> Email via App
                        </button>
                      </div>
                      <button
                        onClick={handleSendPortalLink}
                        disabled={sendingPortalLink}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                          portalLinkSent
                            ? 'bg-green-600 text-white'
                            : 'bg-brand-primary text-white hover:bg-brand-primary hover:shadow-lg hover:shadow-brand-primary/20'
                        } disabled:opacity-50`}
                        data-testid="send-portal-link-btn"
                      >
                        {sendingPortalLink ? (
                          <><SpinnerGap className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : portalLinkSent ? (
                          <><CheckCircle className="w-4 h-4" /> Sent to {lead.clientEmail}</>
                        ) : (
                          <><PaperPlaneTilt weight="bold" className="w-4 h-4" /> Send Portal Link to Client</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEmailComposer && (
        <EmailComposerModal
          lead={lead}
          onClose={() => setShowEmailComposer(false)}
          onSent={() => { fetchActivities(); }}
        />
      )}

      {showBookingModal && (
        <BookingModal
          lead={lead}
          onClose={() => setShowBookingModal(false)}
          onSaved={() => {
            setShowBookingModal(false);
            fetchActivities();
          }}
        />
      )}
    </>
  );
}
