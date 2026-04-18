import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'
import { 
  Lead, 
  LeadStatus,
  Activity,
  LeadFile,
  LEAD_STATUS_LABELS, 
  leadsApi 
} from '../services/api'
import { getIndustryLanguage, IndustryType } from '../utils/industryLanguage'
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
  Star as StarIcon,
  PhoneCall,
  Checks,
  Megaphone,
  PencilSimple
} from '@phosphor-icons/react'
import QuotesTab from './QuotesTab'
import EmailComposerModal from './EmailComposerModal'
import BookingModal from './BookingModal'
import DeliverablesTab from './DeliverablesTab'
import ContractsTab from './ContractsTab'
import ProjectTimeline from './ProjectTimeline'
import MarkAsDeliveredButton from './MarkAsDeliveredButton'
import FileCategoryBadge from './FileCategoryBadge'
import FileComments from './FileComments'
import { StatusBadge } from './StatusBadge'
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
  initialTab?: string;
  userIndustry?: IndustryType;
  currencySymbol?: string;
}

const STATUS_OPTIONS: LeadStatus[] = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED', 'LOST'];

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
  DISCOVERY_CALL_SCHEDULED: PhoneCall,
  DISCOVERY_CALL_COMPLETED: Checks,
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
  DISCOVERY_CALL_SCHEDULED: 'bg-purple-50 text-purple-600',
  DISCOVERY_CALL_COMPLETED: 'bg-emerald-50 text-emerald-600',
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

export default function LeadDetailModal({ lead, onClose, onUpdate, onCelebrate, initialTab, userIndustry, currencySymbol = '$' }: LeadDetailModalProps) {
  const lang = getIndustryLanguage(userIndustry)
  const modalRef = useModalA11y(true, onClose)
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'files' | 'details' | 'deliverables' | 'contracts' | 'messages' | 'timeline' | 'activity' | 'notes'>(
    (initialTab === 'details' ? 'overview' : initialTab === 'activity' ? 'activity' : initialTab as any) || 'overview'
  );
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
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Messages state
  const [messages, setMessages] = useState<Array<{ id: string; content: string; from: 'CLIENT' | 'CREATIVE'; read: boolean; createdAt: string }>>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // ── Inline edit state ──
  const [inlineEdit, setInlineEdit] = useState<string | null>(null)
  const [inlineValue, setInlineValue] = useState('')

  const handleRequestTestimonial = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_URL}/api/testimonials/request/${lead.id}`, {
        method: 'POST',
        credentials: 'include',
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

  const handleReviewFile = async (fileId: string, status: 'APPROVED' | 'NEEDS_CHANGES') => {
    const res = await leadsApi.updateFileReview(fileId, status);
    if (res.data?.file) {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, reviewStatus: res.data!.file.reviewStatus, reviewedAt: res.data!.file.reviewedAt } : f));
    }
  };

  const handleUpdateCategory = async (fileId: string, category: string) => {
    const res = await leadsApi.updateFileCategory(fileId, category);
    if (res.data?.file) {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, category: res.data!.file.category } : f));
    }
  };

  // ── Inline edit helpers ──
  const startInlineEdit = (field: string, currentValue: string) => {
    setInlineEdit(field)
    setInlineValue(currentValue)
  }

  const cancelInlineEdit = () => {
    setInlineEdit(null)
    setInlineValue('')
  }

  const saveInlineEdit = async (field: string) => {
    const patch: Record<string, any> = {}
    if (field === 'estimatedValue') {
      patch.estimatedValue = inlineValue ? parseFloat(inlineValue) : undefined
    } else if (field === 'status') {
      patch.status = inlineValue
    } else {
      patch[field] = inlineValue
    }

    const result = await leadsApi.update(lead.id, patch)
    if (result.data?.lead) {
      onUpdate(result.data.lead)
      fetchActivities()
    }
    cancelInlineEdit()
  }

  const filteredFiles = categoryFilter
    ? files.filter(f => f.category === categoryFilter)
    : files;

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

  const isImageFile = (file: LeadFile) => file.mimeType?.startsWith('image/');

  // Discovery Call handlers
  const handleScheduleDiscoveryCall = async () => {
    try {
      const result = await leadsApi.updateDiscoveryCall(lead.id, {
        discoveryCallScheduled: true,
      });
      if (result.data?.lead) {
        onUpdate(result.data.lead);
        fetchActivities();
      }
    } catch (error) {
      console.error('Schedule discovery call error:', error);
    }
  };

  const handleCompleteDiscoveryCall = async () => {
    const notes = prompt('Add any notes from the discovery call (optional):');
    try {
      const result = await leadsApi.updateDiscoveryCall(lead.id, {
        discoveryCallCompletedAt: new Date().toISOString(),
        discoveryCallNotes: notes || null,
      });
      if (result.data?.lead) {
        onUpdate(result.data.lead);
        fetchActivities();
      }
    } catch (error) {
      console.error('Complete discovery call error:', error);
    }
  };

  // ── Status gradient helpers ──
  const getStatusGradient = (status: LeadStatus) => {
    if (['NEW', 'REVIEWING'].includes(status)) return { bg: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.02) 100%)', glow: 'radial-gradient(circle at 85% 20%, rgba(251,191,36,0.08), transparent 60%)', avatarBg: '#D97706' }
    if (['CONTACTED', 'QUALIFIED'].includes(status)) return { bg: 'linear-gradient(135deg, rgba(108,46,219,0.06) 0%, rgba(108,46,219,0.02) 100%)', glow: 'radial-gradient(circle at 85% 20%, rgba(108,46,219,0.08), transparent 60%)', avatarBg: '#6C2EDB' }
    if (['QUOTED', 'NEGOTIATING'].includes(status)) return { bg: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.02) 100%)', glow: 'radial-gradient(circle at 85% 20%, rgba(251,191,36,0.08), transparent 60%)', avatarBg: '#D97706' }
    if (status === 'BOOKED') return { bg: 'linear-gradient(135deg, rgba(5,150,105,0.06) 0%, rgba(5,150,105,0.02) 100%)', glow: 'radial-gradient(circle at 85% 20%, rgba(5,150,105,0.08), transparent 60%)', avatarBg: '#059669' }
    return { bg: 'linear-gradient(135deg, rgba(156,163,175,0.06) 0%, rgba(156,163,175,0.02) 100%)', glow: 'radial-gradient(circle at 85% 20%, rgba(156,163,175,0.08), transparent 60%)', avatarBg: '#9CA3AF' }
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getTimelineDotColor = (type: string) => {
    if (['STATUS_CHANGED', 'CONTRACT_SIGNED'].includes(type)) return '#6C2EDB'
    if (['CALL_MADE', 'CALL_RECEIVED', 'MEETING_SCHEDULED', 'DISCOVERY_CALL_SCHEDULED'].includes(type)) return '#3B82F6'
    if (['MEETING_COMPLETED', 'DISCOVERY_CALL_COMPLETED', 'PAYMENT_RECEIVED'].includes(type)) return '#059669'
    if (['QUOTE_SENT', 'EMAIL_SENT', 'FILE_UPLOADED'].includes(type)) return '#D97706'
    if (['NOTE_ADDED'].includes(type)) return '#9CA3AF'
    return '#9CA3AF'
  }

  const getTimelineTitle = (activity: Activity) => {
    const type = activity.type as string
    if (type === 'STATUS_CHANGED') return 'Status updated'
    if (type === 'NOTE_ADDED') return 'Note added'
    if (type === 'EMAIL_SENT') return 'Email sent'
    if (type === 'EMAIL_RECEIVED') return 'Email received'
    if (type === 'CALL_MADE' || type === 'CALL_RECEIVED') return `${lang.discoveryCall}`
    if (type === 'MEETING_SCHEDULED') return 'Meeting scheduled'
    if (type === 'MEETING_COMPLETED') return 'Meeting completed'
    if (type === 'QUOTE_SENT') return `${lang.quote} sent`
    if (type === 'PAYMENT_RECEIVED') return 'Payment received'
    if (type === 'CONTRACT_SIGNED') return `${lang.contract} signed`
    if (type === 'DISCOVERY_CALL_SCHEDULED') return `${lang.discoveryCall} scheduled`
    if (type === 'DISCOVERY_CALL_COMPLETED') return `${lang.discoveryCall} completed`
    if (type === 'FILE_UPLOADED') return 'File uploaded'
    if (type === 'BOOKING_CREATED') return `${lang.booking} created`
    return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
  }

  const getNextStep = (status: LeadStatus) => {
    if (['NEW', 'REVIEWING'].includes(status)) return `Schedule ${lang.discoveryCall.toLowerCase()}`
    if (['CONTACTED', 'QUALIFIED'].includes(status)) return `Send ${lang.quote.toLowerCase()}`
    if (['QUOTED', 'NEGOTIATING'].includes(status)) return `Send ${lang.contract.toLowerCase()}`
    if (status === 'BOOKED') return `${lang.bookingConfirmed}`
    return 'Next step'
  }

  const getPrimaryActionLabel = (status: LeadStatus) => {
    if (['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED'].includes(status)) return `Send ${lang.quote}`
    if (['QUOTED', 'NEGOTIATING'].includes(status)) return `Send ${lang.contract}`
    return 'View signed'
  }

  const getPrimaryActionTab = (status: LeadStatus) => {
    if (['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED'].includes(status)) return 'quotes'
    return 'contracts'
  }

  const statusGradient = getStatusGradient(lead.status)
  const clientInitials = getInitials(lead.clientName)

  // Derive industry-specific client fields
  const getClientFields = () => {
    const base = [
      { label: 'Email', value: lead.clientEmail, isLink: true },
      { label: 'Phone', value: lead.clientPhone },
    ]
    const industry = userIndustry || 'PHOTOGRAPHY'
    if (industry === 'PHOTOGRAPHY') {
      return [...base,
        { label: 'Project type', value: lead.projectType?.replace(/_/g, ' ') },
        { label: lang.keyDate, value: lead.keyDate ? new Date(lead.keyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined },
        { label: 'Location', value: lead.timeline },
        { label: 'Source', value: lead.source?.replace(/_/g, ' ') },
      ]
    }
    if (industry === 'FINE_ART') {
      return [...base,
        { label: 'Work type', value: lead.projectType?.replace(/_/g, ' ') },
        { label: lang.keyDate, value: lead.keyDate ? new Date(lead.keyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined },
        { label: 'Medium', value: lead.medium },
        { label: 'Dimensions', value: lead.dimensions },
        { label: 'Edition', value: lead.edition },
      ]
    }
    // DESIGN default
    return [...base,
      { label: 'Project type', value: lead.projectType?.replace(/_/g, ' ') },
      { label: lang.keyDate, value: lead.keyDate ? new Date(lead.keyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined },
      { label: 'Company', value: lead.clientCompany },
      { label: 'Source', value: lead.source?.replace(/_/g, ' ') },
    ]
  }
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4" onClick={onClose} role="presentation">
        <div 
          ref={modalRef}
          className="bg-[var(--surface-base)] w-screen h-screen md:w-auto md:h-auto md:rounded-2xl overflow-hidden flex flex-col animate-modal-enter motion-reduce:animate-none"
          style={{ maxWidth: 'min(760px, 95vw)', maxHeight: 'min(600px, 90vh)', width: '100%', height: '100%', border: '0.5px solid var(--border-dark, var(--border))', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
          onClick={(e) => e.stopPropagation()}
          data-testid="lead-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-detail-title"
        >
          {/* ═══ Header — status-colored gradient ═══ */}
          <div className="relative flex-shrink-0 px-5 pt-5 pb-4" style={{ background: statusGradient.bg }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: statusGradient.glow }} />
            <div className="relative flex items-start gap-3.5">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, ${statusGradient.avatarBg}, ${statusGradient.avatarBg}dd)` }} data-testid="lead-avatar">
                {clientInitials}
              </div>
              {/* Client info */}
              <div className="flex-1 min-w-0">
                <h2 id="lead-detail-title" className="text-lg font-extrabold text-text-primary truncate" style={{ letterSpacing: '-0.02em' }}>{lead.clientName}</h2>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-secondary)]">
                  <span className="truncate">{lead.projectTitle}</span>
                  <span className="opacity-40">·</span>
                  <span data-testid="lead-project-type-label">
                    {lead.projectType
                      ? lead.projectType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
                      : lang.booking}
                  </span>
                  <span className="opacity-40">·</span>
                  <span>{formatTimeAgo(lead.createdAt)}</span>
                </div>
              </div>
              {/* Value chip + Close */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {lead.estimatedValue && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums" style={{ background: `${statusGradient.avatarBg}18`, color: statusGradient.avatarBg }} data-testid="lead-value-chip">
                    {currencySymbol}{lead.estimatedValue.toLocaleString()}
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors text-[var(--text-secondary)]"
                  aria-label="Close lead details" title="Close (Esc)"
                  data-testid="close-modal-btn"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Action row */}
            <div className="relative flex items-center gap-2 mt-3.5" data-testid="modal-action-row">
              <button
                onClick={() => setActiveTab(getPrimaryActionTab(lead.status) as any)}
                className="min-h-[44px] px-3.5 rounded-lg text-[11px] font-semibold text-white transition-colors flex items-center"
                style={{ background: '#6C2EDB' }}
                data-testid="modal-primary-action"
              >
                {getPrimaryActionLabel(lead.status)}
              </button>
              <button
                onClick={() => {
                  if (!lead.discoveryCallScheduled) setShowBookingModal(true)
                  else if (!lead.discoveryCallCompletedAt) handleCompleteDiscoveryCall()
                }}
                className="min-h-[44px] px-3 rounded-lg text-[11px] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-background)] transition-colors flex items-center gap-1"
                data-testid="modal-schedule-call"
              >
                <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                {!lead.discoveryCallScheduled ? `Schedule ${lang.discoveryCall.toLowerCase()}` : !lead.discoveryCallCompletedAt ? `Complete ${lang.discoveryCall.toLowerCase()}` : `${lang.discoveryCall} done`}
              </button>
              <button
                onClick={() => setShowEmailComposer(true)}
                className="min-h-[44px] px-3 rounded-lg text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-background)] transition-colors flex items-center"
                data-testid="modal-email-action"
              >
                Email
              </button>
              <button
                onClick={handleRequestTestimonial}
                className="min-h-[44px] px-3 rounded-lg text-[11px] font-medium text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 transition-colors ml-auto flex items-center"
                data-testid="modal-archive-action"
              >
                Archive
              </button>
            </div>
          </div>

          {/* ═══ Tab Navigation — underline style ═══ */}
          <div className="flex-shrink-0 flex items-center gap-0 overflow-x-auto scrollbar-hide px-5" style={{ borderBottom: '0.5px solid var(--border)' }}>
            {([
              { key: 'overview' as const, label: 'Overview' },
              { key: 'quotes' as const, label: lang.quotes },
              { key: 'contracts' as const, label: lang.contracts },
              { key: 'notes' as const, label: 'Notes' },
              { key: 'activity' as const, label: 'Activity' },
              { key: 'files' as const, label: 'Files', badge: files.length },
              { key: 'messages' as const, label: 'Messages', badge: messages.filter(m => m.from === 'CLIENT' && !m.read).length },
              { key: 'deliverables' as const, label: 'Deliver.' },
            ]).map(({ key, label, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? 'text-[#6C2EDB] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-text-primary'
                }`}
                data-testid={`tab-${key}`}
              >
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">{badge}</span>
                )}
                {activeTab === key && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#6C2EDB] rounded-full" />}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'overview' ? (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] h-full" data-testid="overview-split-panel">
                {/* ═══ Left Panel ═══ */}
                <div className="p-5 overflow-y-auto space-y-5 border-r-0 md:border-r" style={{ borderColor: 'var(--border)' }}>

                  {/* Client Details — 2-col field grid */}
                  <div data-testid="client-details-section">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-3">{lang.client} Details</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {getClientFields().map(field => field.value ? (
                        <div key={field.label}>
                          <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">{field.label}</p>
                          {field.isLink ? (
                            <a href={`mailto:${field.value}`} className="text-xs font-medium text-[#6C2EDB] hover:underline truncate block">{field.value}</a>
                          ) : (
                            <p className="text-xs font-medium text-text-primary truncate">{field.value}</p>
                          )}
                        </div>
                      ) : null)}
                    </div>
                  </div>

                  {/* ── Project Details — inline editable ── */}
                  <div data-testid="project-details-section">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-3">Project Details</h4>

                    {/* Project Title */}
                    <div className="group mb-3" data-testid="inline-field-projectTitle">
                      <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">Project Title</p>
                      {inlineEdit === 'projectTitle' ? (
                        <div className="flex items-center gap-1.5">
                          <input type="text" value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit('projectTitle'); if (e.key === 'Escape') cancelInlineEdit() }} className="flex-1 px-2 py-1 text-xs font-medium rounded-md bg-[var(--surface-background)] text-text-primary border border-[#6C2EDB] outline-none" autoFocus data-testid="inline-input-projectTitle" />
                          <button onClick={() => saveInlineEdit('projectTitle')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition" data-testid="inline-save-projectTitle"><CheckCircle weight="fill" className="w-4 h-4" /></button>
                          <button onClick={cancelInlineEdit} className="p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-background)] rounded transition" data-testid="inline-cancel-projectTitle"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => startInlineEdit('projectTitle', lead.projectTitle || '')}>
                          <p className="text-xs font-medium text-text-primary">{lead.projectTitle || '\u2014'}</p>
                          <PencilSimple className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="group mb-3" data-testid="inline-field-description">
                      <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">Description</p>
                      {inlineEdit === 'description' ? (
                        <div>
                          <textarea value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') cancelInlineEdit() }} className="w-full px-2 py-1.5 text-xs rounded-md bg-[var(--surface-background)] text-text-primary border border-[#6C2EDB] outline-none resize-none" rows={3} autoFocus data-testid="inline-input-description" />
                          <div className="flex justify-end gap-1.5 mt-1">
                            <button onClick={cancelInlineEdit} className="px-2 py-0.5 text-[10px] text-[var(--text-tertiary)] hover:bg-[var(--surface-background)] rounded transition" data-testid="inline-cancel-description">Cancel</button>
                            <button onClick={() => saveInlineEdit('description')} className="px-2 py-0.5 text-[10px] font-semibold text-white bg-[#6C2EDB] rounded transition" data-testid="inline-save-description">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 cursor-pointer" onClick={() => startInlineEdit('description', lead.description || '')}>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1 line-clamp-3">{lead.description || '\u2014'}</p>
                          <PencilSimple className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
                        </div>
                      )}
                    </div>

                    {/* 2-col grid: Status, Value, Budget, Timeline */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {/* Status */}
                      <div className="group" data-testid="inline-field-status">
                        <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">Status</p>
                        {inlineEdit === 'status' ? (
                          <div className="flex items-center gap-1.5">
                            <select value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} className="flex-1 px-2 py-1 text-xs font-medium rounded-md bg-[var(--surface-background)] text-text-primary border border-[#6C2EDB] outline-none" autoFocus data-testid="inline-input-status">
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
                            </select>
                            <button onClick={() => saveInlineEdit('status')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition" data-testid="inline-save-status"><CheckCircle weight="fill" className="w-4 h-4" /></button>
                            <button onClick={cancelInlineEdit} className="p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-background)] rounded transition" data-testid="inline-cancel-status"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => startInlineEdit('status', lead.status)}>
                            <StatusBadge status={lead.status} />
                            <PencilSimple className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>

                      {/* Estimated Value */}
                      <div className="group" data-testid="inline-field-estimatedValue">
                        <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">Estimated Value</p>
                        {inlineEdit === 'estimatedValue' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 flex items-center border border-[#6C2EDB] rounded-md bg-[var(--surface-background)] overflow-hidden">
                              <span className="pl-2 text-xs text-[var(--text-tertiary)]">{currencySymbol}</span>
                              <input type="number" value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit('estimatedValue'); if (e.key === 'Escape') cancelInlineEdit() }} className="flex-1 px-1 py-1 text-xs font-medium bg-transparent text-text-primary outline-none" autoFocus data-testid="inline-input-estimatedValue" />
                            </div>
                            <button onClick={() => saveInlineEdit('estimatedValue')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition" data-testid="inline-save-estimatedValue"><CheckCircle weight="fill" className="w-4 h-4" /></button>
                            <button onClick={cancelInlineEdit} className="p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-background)] rounded transition" data-testid="inline-cancel-estimatedValue"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => startInlineEdit('estimatedValue', lead.estimatedValue?.toString() || '')}>
                            <p className="text-xs font-medium text-text-primary">{lead.estimatedValue ? `${currencySymbol}${lead.estimatedValue.toLocaleString()}` : '\u2014'}</p>
                            <PencilSimple className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>

                      {/* Budget */}
                      <div className="group" data-testid="inline-field-budget">
                        <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">Budget</p>
                        {inlineEdit === 'budget' ? (
                          <div className="flex items-center gap-1.5">
                            <input type="text" value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit('budget'); if (e.key === 'Escape') cancelInlineEdit() }} className="flex-1 px-2 py-1 text-xs font-medium rounded-md bg-[var(--surface-background)] text-text-primary border border-[#6C2EDB] outline-none" placeholder="e.g., $5,000-$10,000" autoFocus data-testid="inline-input-budget" />
                            <button onClick={() => saveInlineEdit('budget')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition" data-testid="inline-save-budget"><CheckCircle weight="fill" className="w-4 h-4" /></button>
                            <button onClick={cancelInlineEdit} className="p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-background)] rounded transition" data-testid="inline-cancel-budget"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => startInlineEdit('budget', lead.budget || '')}>
                            <p className="text-xs font-medium text-text-primary">{lead.budget || '\u2014'}</p>
                            <PencilSimple className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      <div className="group" data-testid="inline-field-timeline">
                        <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">Timeline</p>
                        {inlineEdit === 'timeline' ? (
                          <div className="flex items-center gap-1.5">
                            <input type="text" value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit('timeline'); if (e.key === 'Escape') cancelInlineEdit() }} className="flex-1 px-2 py-1 text-xs font-medium rounded-md bg-[var(--surface-background)] text-text-primary border border-[#6C2EDB] outline-none" placeholder="e.g., March 2026" autoFocus data-testid="inline-input-timeline" />
                            <button onClick={() => saveInlineEdit('timeline')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition" data-testid="inline-save-timeline"><CheckCircle weight="fill" className="w-4 h-4" /></button>
                            <button onClick={cancelInlineEdit} className="p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-background)] rounded transition" data-testid="inline-cancel-timeline"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => startInlineEdit('timeline', lead.timeline || '')}>
                            <p className="text-xs font-medium text-text-primary">{lead.timeline || '\u2014'}</p>
                            <PencilSimple className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discovery Call — 3-step vertical timeline */}
                  {['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED'].includes(lead.status) && (
                    <div data-testid="discovery-call-section">
                      <h4 className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-3">{lang.discoveryCall}</h4>
                      <div className="space-y-0">
                        {/* Step 1: Schedule */}
                        <div className="flex gap-3 relative">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${lead.discoveryCallScheduled ? 'bg-emerald-100' : !lead.discoveryCallScheduled && !lead.discoveryCallCompletedAt ? 'bg-purple-100' : 'border-2 border-[var(--border)]'}`}>
                              {lead.discoveryCallScheduled ? (
                                <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-[#6C2EDB]" />
                              )}
                            </div>
                            <div className="w-px flex-1 bg-[var(--border)] min-h-[16px]" />
                          </div>
                          <div className="flex-1 pb-4 flex items-start justify-between min-w-0">
                            <div>
                              <p className={`text-xs font-semibold ${lead.discoveryCallScheduled ? 'text-text-primary opacity-70' : 'text-text-primary'}`}>Schedule {lang.discoveryCall.toLowerCase()}</p>
                              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{lead.discoveryCallScheduled ? 'Scheduled' : 'Book a call to discuss project details'}</p>
                            </div>
                            {!lead.discoveryCallScheduled && !lead.discoveryCallCompletedAt && (
                              <button onClick={handleScheduleDiscoveryCall} className="h-7 px-2.5 rounded-md text-[10px] font-semibold text-white bg-[#6C2EDB] hover:brightness-110 transition flex-shrink-0" data-testid="schedule-discovery-btn">Schedule</button>
                            )}
                          </div>
                        </div>
                        {/* Step 2: Complete */}
                        <div className="flex gap-3 relative">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${lead.discoveryCallCompletedAt ? 'bg-emerald-100' : lead.discoveryCallScheduled ? 'bg-purple-100' : 'border-2 border-[var(--border)]'}`}>
                              {lead.discoveryCallCompletedAt ? (
                                <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
                              ) : lead.discoveryCallScheduled ? (
                                <div className="w-2 h-2 rounded-full bg-[#6C2EDB]" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-[var(--border)]" />
                              )}
                            </div>
                            <div className="w-px flex-1 bg-[var(--border)] min-h-[16px]" />
                          </div>
                          <div className="flex-1 pb-4 flex items-start justify-between min-w-0">
                            <div>
                              <p className={`text-xs font-semibold ${lead.discoveryCallCompletedAt ? 'text-text-primary opacity-70' : lead.discoveryCallScheduled ? 'text-text-primary' : 'text-[var(--text-tertiary)]'}`}>Complete {lang.discoveryCall.toLowerCase()}</p>
                              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                                {lead.discoveryCallCompletedAt
                                  ? `${new Date(lead.discoveryCallCompletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${lead.discoveryCallNotes ? ` — ${lead.discoveryCallNotes}` : ''}`
                                  : 'Mark as done after the call'}
                              </p>
                            </div>
                            {lead.discoveryCallScheduled && !lead.discoveryCallCompletedAt && (
                              <button onClick={handleCompleteDiscoveryCall} className="h-7 px-2.5 rounded-md text-[10px] font-semibold text-white bg-[#6C2EDB] hover:brightness-110 transition flex-shrink-0" data-testid="complete-discovery-btn">Mark done</button>
                            )}
                          </div>
                        </div>
                        {/* Step 3: Send quote */}
                        <div className="flex gap-3 relative">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${lead.discoveryCallCompletedAt ? 'bg-purple-100' : 'border-2 border-[var(--border)]'}`}>
                              {lead.discoveryCallCompletedAt ? (
                                <div className="w-2 h-2 rounded-full bg-[#6C2EDB]" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-[var(--border)]" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 flex items-start justify-between min-w-0">
                            <div>
                              <p className={`text-xs font-semibold ${lead.discoveryCallCompletedAt ? 'text-text-primary' : 'text-[var(--text-tertiary)]'}`}>Send {lang.quote.toLowerCase()}</p>
                              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Create and send a {lang.quote.toLowerCase()} to {lead.clientName.split(' ')[0]}</p>
                            </div>
                            {lead.discoveryCallCompletedAt && (
                              <button onClick={() => setActiveTab('quotes')} className="h-7 px-2.5 rounded-md text-[10px] font-semibold text-white bg-[#6C2EDB] hover:brightness-110 transition flex-shrink-0" data-testid="send-quote-after-discovery-btn">Send {lang.quote}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes — quick add */}
                  <div data-testid="overview-notes-section">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-2">Notes</h4>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={`Add a note about ${lead.clientName.split(' ')[0]}...`}
                      className="w-full bg-[var(--surface-background)] text-text-primary text-xs placeholder:text-[var(--text-tertiary)] resize-none rounded-lg px-3 py-2.5"
                      style={{ border: '0.5px solid var(--border-dark, var(--border))', minHeight: '80px' }}
                      rows={3}
                      data-testid="note-input"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddNote}
                        disabled={addingNote || !newNote.trim()}
                        className="h-7 px-3 rounded-md text-[10px] font-semibold text-white bg-[#6C2EDB] transition disabled:opacity-40 flex items-center gap-1.5"
                        data-testid="save-note-button"
                      >
                        {addingNote ? <SpinnerGap className="w-3 h-3 animate-spin" /> : <FloppyDisk className="w-3 h-3" />}
                        Save note
                      </button>
                    </div>
                  </div>

                  {/* Portal link — compact */}
                  {portalUrl && (
                    <div data-testid="overview-portal-section">
                      <h4 className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-2">{lang.client} Portal</h4>
                      <div className="flex items-center gap-2">
                        <input readOnly value={portalUrl} className="flex-1 text-[10px] px-2.5 py-1.5 rounded-md bg-[var(--surface-background)] border border-[var(--border)] text-[var(--text-secondary)] truncate" />
                        <button onClick={handleCopyPortalLink} className="h-7 px-2 rounded-md text-[10px] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-background)] transition" data-testid="copy-portal-link-btn">
                          {copiedLink ? 'Copied' : 'Copy'}
                        </button>
                        <button onClick={handleSendPortalLink} disabled={sendingPortalLink} className="h-7 px-2 rounded-md text-[10px] font-medium bg-[#6C2EDB] text-white transition disabled:opacity-50" data-testid="send-portal-link-btn">
                          {sendingPortalLink ? '...' : portalLinkSent ? 'Sent' : 'Send'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ Right Panel — Relationship Timeline ═══ */}
                <div className="bg-[var(--surface-background)] p-4 overflow-y-auto" data-testid="relationship-timeline">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-3">Timeline</h4>
                  {loadingActivities ? (
                    <ActivitySkeleton />
                  ) : (
                    <div className="space-y-0">
                      {activities.slice(0, 15).map((activity, idx) => {
                        const dotColor = getTimelineDotColor(activity.type)
                        const isLast = idx === Math.min(activities.length, 15) - 1
                        return (
                          <div key={activity.id} className="flex gap-2.5 relative" data-testid={`timeline-item-${activity.id}`}>
                            <div className="flex flex-col items-center">
                              <div className="w-[9px] h-[9px] rounded-full flex-shrink-0 mt-1" style={{ background: dotColor }} />
                              {!isLast && <div className="w-px flex-1 bg-[var(--border)] min-h-[12px]" />}
                            </div>
                            <div className="flex-1 pb-3 min-w-0">
                              <p className="text-xs font-semibold text-text-primary leading-tight">{getTimelineTitle(activity)}</p>
                              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{activity.description}</p>
                              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{formatTimeAgo(activity.createdAt)}</p>
                            </div>
                          </div>
                        )
                      })}
                      {/* Next step indicator */}
                      <div className="flex gap-2.5 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-[9px] h-[9px] rounded-full flex-shrink-0 mt-1 border-2" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--text-secondary)]">{getNextStep(lead.status)}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Upcoming</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'notes' ? (
              <div className="p-5 space-y-4" data-testid="notes-tab">
                {/* Add Note */}
                <div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={`Write a note about this ${lang.lead.toLowerCase()}...`}
                    className="w-full bg-[var(--surface-background)] text-text-primary text-sm placeholder:text-[var(--text-tertiary)] resize-none rounded-lg px-3 py-3"
                    style={{ border: '0.5px solid var(--border-dark, var(--border))', minHeight: '100px' }}
                    rows={4}
                    data-testid="notes-tab-input"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#6C2EDB] transition disabled:opacity-40 flex items-center gap-1.5"
                      data-testid="notes-tab-save"
                    >
                      {addingNote ? <SpinnerGap className="w-3.5 h-3.5 animate-spin" /> : <FloppyDisk className="w-3.5 h-3.5" />}
                      Save Note
                    </button>
                  </div>
                </div>
                {/* Note history */}
                <div className="space-y-2">
                  {activities.filter(a => a.type === 'NOTE_ADDED').length === 0 ? (
                    <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No notes yet</p>
                  ) : (
                    activities.filter(a => a.type === 'NOTE_ADDED').map(activity => (
                      <div key={activity.id} className="bg-[var(--surface-background)] rounded-lg p-3 border border-[var(--border)]" data-testid={`note-${activity.id}`}>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-tertiary)]">
                          {activity.user && <span>by {activity.user.firstName} {activity.user.lastName}</span>}
                          <span>{formatTimeAgo(activity.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === 'activity' ? (
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Discovery Call Card */}
                {['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED'].includes(lead.status) && (
                  <div data-testid="discovery-call-card">
                    {!lead.discoveryCallScheduled && !lead.discoveryCallCompletedAt && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <PhoneCall weight="duotone" className="w-4.5 h-4.5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-text-primary">Schedule {lang.discoveryCall}</h4>
                            <p className="text-xs text-text-secondary mt-0.5">Book a call to discuss project details before sending a quote</p>
                          </div>
                          <button
                            onClick={() => setShowBookingModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition flex-shrink-0"
                            data-testid="schedule-discovery-btn"
                          >
                            <PhoneCall weight="bold" className="w-3.5 h-3.5" />
                            Schedule {lang.discoveryCall}
                          </button>
                        </div>
                      </div>
                    )}

                    {lead.discoveryCallScheduled && !lead.discoveryCallCompletedAt && (
                      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <CalendarBlank weight="duotone" className="w-4.5 h-4.5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-blue-900">{lang.discoveryCall} Scheduled</h4>
                            <p className="text-xs text-blue-700 mt-0.5">Waiting for call to complete before sending quote</p>
                          </div>
                          <button
                            onClick={handleCompleteDiscoveryCall}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition flex-shrink-0"
                            data-testid="complete-discovery-btn"
                          >
                            <Checks weight="bold" className="w-3.5 h-3.5" />
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    )}

                    {lead.discoveryCallCompletedAt && (
                      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle weight="fill" className="w-4.5 h-4.5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-emerald-900">{lang.discoveryCall} Completed</h4>
                            <p className="text-xs text-emerald-700 mt-0.5">
                              {new Date(lead.discoveryCallCompletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {lead.discoveryCallNotes && ` — ${lead.discoveryCallNotes}`}
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('quotes')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition flex-shrink-0"
                            data-testid="send-quote-after-discovery-btn"
                          >
                            <Receipt weight="bold" className="w-3.5 h-3.5" />
                            Send Quote
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Add Note */}
                <div className="bg-surface-base rounded-xl p-4 md:p-5 border border-light-200">
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
                                <div className="bg-surface-base border border-light-200 rounded-xl p-4 hover:border-light-300 transition-all duration-200">
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
                      : 'border-light-200 hover:border-purple-300 hover:bg-surface-base'
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
                        PDF, Word, Excel, Images up to 50MB &middot; Files are auto-categorized
                      </p>
                    </>
                  )}
                </div>

                {/* Category Filter */}
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5" data-testid="file-category-filter">
                    <button
                      onClick={() => setCategoryFilter(null)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                        !categoryFilter ? 'bg-purple-600 text-white border-purple-600' : 'bg-surface-base text-gray-600 border-gray-200 hover:border-purple-300'
                      }`}
                      data-testid="filter-all"
                    >
                      All ({files.length})
                    </button>
                    {['REFERENCE', 'LEGAL', 'PAYMENT', 'DELIVERABLE', 'REVISION', 'ASSET', 'OTHER'].map(cat => {
                      const count = files.filter(f => f.category === cat).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                            categoryFilter === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-surface-base text-gray-600 border-gray-200 hover:border-purple-300'
                          }`}
                          data-testid={`filter-${cat}`}
                        >
                          <FileCategoryBadge category={cat} size="sm" /> ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* File List */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    {categoryFilter ? `${categoryFilter} Files` : 'All Files'} ({filteredFiles.length})
                  </h3>

                  {loadingFiles ? (
                    <FileGridSkeleton />
                  ) : filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center" data-testid="files-empty-state">
                      <div className="text-5xl md:text-6xl mb-5 md:mb-6 opacity-40 select-none">&#x1F4CE;</div>
                      <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-2">
                        {categoryFilter ? 'No files in this category' : 'No files uploaded yet'}
                      </h3>
                      <p className="text-sm text-text-secondary max-w-md mb-1 leading-relaxed">
                        Upload contracts, references, or deliverables to keep everything organized with your client.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="file-list">
                      {filteredFiles.map((file) => {
                        const isImage = isImageFile(file);

                        return (
                          <div 
                            key={file.id} 
                            className="rounded-xl border border-light-200 bg-surface-base hover:border-purple-200 transition-all duration-200 overflow-hidden"
                            data-testid={`file-${file.id}`}
                          >
                            <div className="flex items-start gap-3 p-4">
                              {/* Thumbnail / Icon */}
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-light-200 bg-light-50 flex items-center justify-center">
                                {isImage ? (
                                  <img src={file.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <FileText className="w-6 h-6 text-gray-400" />
                                )}
                              </div>

                              {/* File Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-sm text-gray-900 hover:text-purple-600 truncate max-w-[200px]"
                                    title={file.originalName}
                                  >
                                    {file.originalName}
                                  </a>
                                  <FileCategoryBadge category={file.category} size="sm" />
                                  {file.requiresReview && file.reviewStatus === 'PENDING' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold" data-testid={`review-pending-${file.id}`}>
                                      Needs Review
                                    </span>
                                  )}
                                  {file.reviewStatus === 'APPROVED' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold" data-testid={`review-approved-${file.id}`}>
                                      Approved
                                    </span>
                                  )}
                                  {file.reviewStatus === 'NEEDS_CHANGES' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold" data-testid={`review-changes-${file.id}`}>
                                      Changes Needed
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>{file.formattedSize}</span>
                                  <span>&middot;</span>
                                  <span>{new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  {(file.uploadedByType === 'CLIENT' || file.uploadedBy === 'client') && (
                                    <>
                                      <span>&middot;</span>
                                      <span className="text-blue-500 font-medium">Client Upload</span>
                                    </>
                                  )}
                                  {file.sharedWithClient && (
                                    <>
                                      <span>&middot;</span>
                                      <span className="text-emerald-500 font-medium flex items-center gap-0.5"><Eye className="w-3 h-3" /> Shared</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Review actions */}
                                {file.requiresReview && file.reviewStatus === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleReviewFile(file.id, 'APPROVED')}
                                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                      title="Approve"
                                      data-testid={`approve-${file.id}`}
                                    >
                                      <CheckCircle className="w-5 h-5" weight="fill" />
                                    </button>
                                    <button
                                      onClick={() => handleReviewFile(file.id, 'NEEDS_CHANGES')}
                                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                      title="Request Changes"
                                      data-testid={`request-changes-${file.id}`}
                                    >
                                      <Flag className="w-5 h-5" weight="fill" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleToggleShare(file.id, !!file.sharedWithClient)}
                                  className={`p-1.5 rounded-lg transition-colors ${file.sharedWithClient ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                  title={file.sharedWithClient ? 'Shared with client' : 'Share with client'}
                                  data-testid={`share-toggle-${file.id}`}
                                >
                                  {file.sharedWithClient ? <Eye className="w-4 h-4" /> : <EyeSlash className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleDownload(file)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                  title="Download"
                                  data-testid={`download-${file.id}`}
                                >
                                  <DownloadSimple className="w-4 h-4" weight="bold" />
                                </button>
                                {deleteConfirm === file.id ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleDeleteFile(file.id)} className="px-2 py-1 bg-red-600 text-white text-[10px] rounded-lg" data-testid={`confirm-delete-${file.id}`}>Yes</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] rounded-lg">No</button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(file.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Delete"
                                    data-testid={`delete-${file.id}`}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Comments Toggle + Panel */}
                            <div className="border-t border-light-200 px-4 py-2">
                              <button
                                onClick={() => setExpandedComments(expandedComments === file.id ? null : file.id)}
                                className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                data-testid={`toggle-comments-${file.id}`}
                              >
                                <ChatCircle className="w-3.5 h-3.5" />
                                {expandedComments === file.id ? 'Hide Comments' : `Comments${file.commentCount ? ` (${file.commentCount})` : ''}`}
                              </button>
                              {expandedComments === file.id && (
                                <div className="mt-3 pb-1">
                                  <FileComments fileId={file.id} />
                                </div>
                              )}
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
                <ProjectTimeline leadId={lead.id} editable={true} />
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
                    className="flex-1 px-4 py-2.5 bg-surface-base border border-light-200 rounded-xl text-text-primary placeholder-gray-400 text-sm focus:outline-none focus:border-brand-primary"
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
                        className="px-3 py-1.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={lead.status} />
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
                    <div className="flex items-center gap-3 p-3 md:p-4 bg-surface-base rounded-xl border border-light-200 hover:border-light-300 transition-all duration-200">
                      <User className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-text-tertiary">Name</p>
                        <p className="font-medium text-text-primary">{lead.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 md:p-4 bg-surface-base rounded-xl border border-light-200 hover:border-light-300 transition-all duration-200">
                      <Envelope className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-text-tertiary">Email</p>
                        <a href={`mailto:${lead.clientEmail}`} className="font-medium text-purple-600 hover:underline">
                          {lead.clientEmail}
                        </a>
                      </div>
                    </div>
                    {lead.clientPhone && (
                      <div className="flex items-center gap-3 p-4 bg-surface-base rounded-xl border border-light-200 hover:border-light-300 transition-all duration-200">
                        <Phone className="w-5 h-5 text-text-tertiary" />
                        <div>
                          <p className="text-xs text-text-tertiary">Phone</p>
                          <a href={`tel:${lead.clientPhone}`} className="font-medium text-text-primary">{lead.clientPhone}</a>
                        </div>
                      </div>
                    )}
                    {lead.clientCompany && (
                      <div className="flex items-center gap-3 p-4 bg-surface-base rounded-xl border border-light-200 hover:border-light-300 transition-all duration-200">
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
                  <div className="bg-surface-base rounded-xl p-4 md:p-5 mb-3 md:mb-4 border border-light-200">
                    <p className="text-text-secondary whitespace-pre-wrap text-sm leading-relaxed">{lead.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {(editing || lead.budget) && (
                      <div className="flex items-center gap-3 p-4 bg-surface-base rounded-xl border border-light-200">
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
                      <div className="flex items-center gap-3 p-4 bg-surface-base rounded-xl border border-light-200">
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
                      <div className="flex items-center gap-3 p-4 bg-surface-base rounded-xl border border-light-200">
                        <CalendarBlank className="w-5 h-5 text-text-tertiary" />
                        <div>
                          <p className="text-xs text-text-tertiary">Event Date</p>
                          <p className="font-medium text-text-primary">{formatDate(lead.eventDate)}</p>
                        </div>
                      </div>
                    )}
                    {(editing || lead.estimatedValue) && (
                      <div className="flex items-center gap-3 p-4 bg-surface-base rounded-xl border border-light-200">
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
                              {currencySymbol}{lead.estimatedValue?.toLocaleString()}
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
                    <div className="rounded-xl border border-light-200 bg-surface-base p-3 mb-4">
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
                      <div className="flex items-center gap-3 p-4 bg-surface-base rounded-xl border border-light-200">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-200">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary">Portal Views</p>
                          <p className="font-semibold text-lg text-text-primary">{lead.portalViews || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-surface-base rounded-xl border border-light-200">
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
