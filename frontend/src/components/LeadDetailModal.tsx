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
  Mail, 
  Phone,
  Building2,
  Calendar, 
  DollarSign,
  Clock,
  FileText,
  Save,
  Loader2,
  MessageSquare,
  ArrowRightLeft,
  Send,
  CheckCircle,
  StickyNote,
  History,
  Upload,
  File,
  Image,
  FileSpreadsheet,
  Trash2,
  Download,
  Paperclip,
  Link,
  Copy,
  ExternalLink,
  Eye,
  BarChart3,
  Receipt,
  MailPlus,
  Package
} from 'lucide-react'
import QuotesTab from './QuotesTab'
import EmailComposerModal from './EmailComposerModal'
import BookingModal from './BookingModal'
import DeliverablesTab from './DeliverablesTab'
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
}

const STATUS_OPTIONS: LeadStatus[] = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED', 'LOST'];

// Dark theme status colors for dropdown/badges
const DARK_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  REVIEWING: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  CONTACTED: 'bg-purple-900/50 text-purple-300 border border-purple-700/50',
  QUALIFIED: 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50',
  QUOTED: 'bg-orange-900/50 text-orange-300 border border-orange-700/50',
  NEGOTIATING: 'bg-pink-900/50 text-pink-300 border border-pink-700/50',
  BOOKED: 'bg-green-900/50 text-green-300 border border-green-700/50',
  LOST: 'bg-gray-800/50 text-gray-400 border border-gray-700/50',
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  NOTE_ADDED: StickyNote,
  STATUS_CHANGED: ArrowRightLeft,
  EMAIL_SENT: Send,
  EMAIL_RECEIVED: Mail,
  CALL_MADE: Phone,
  CALL_RECEIVED: Phone,
  MEETING_SCHEDULED: Calendar,
  MEETING_COMPLETED: CheckCircle,
  FILE_UPLOADED: Upload,
  QUOTE_SENT: DollarSign,
  PAYMENT_RECEIVED: DollarSign,
  CONTRACT_SIGNED: FileText,
};

const ACTIVITY_COLORS: Record<string, string> = {
  NOTE_ADDED: 'bg-blue-900/50 text-blue-400',
  STATUS_CHANGED: 'bg-purple-900/50 text-purple-400',
  EMAIL_SENT: 'bg-green-900/50 text-green-400',
  EMAIL_RECEIVED: 'bg-teal-900/50 text-teal-400',
  CALL_MADE: 'bg-orange-900/50 text-orange-400',
  CALL_RECEIVED: 'bg-yellow-900/50 text-yellow-400',
  MEETING_SCHEDULED: 'bg-indigo-900/50 text-indigo-400',
  MEETING_COMPLETED: 'bg-emerald-900/50 text-emerald-400',
  FILE_UPLOADED: 'bg-pink-900/50 text-pink-400',
  QUOTE_SENT: 'bg-amber-900/50 text-amber-400',
  PAYMENT_RECEIVED: 'bg-lime-900/50 text-lime-400',
  CONTRACT_SIGNED: 'bg-cyan-900/50 text-cyan-400',
};

const FILE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  pdf: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  text: FileText,
  file: File,
};

const FILE_COLORS: Record<string, string> = {
  image: 'bg-green-900/50 text-green-400',
  pdf: 'bg-red-900/50 text-red-400',
  document: 'bg-blue-900/50 text-blue-400',
  spreadsheet: 'bg-emerald-900/50 text-emerald-400',
  text: 'bg-gray-800/50 text-gray-400',
  file: 'bg-purple-900/50 text-purple-400',
};

export default function LeadDetailModal({ lead, onClose, onUpdate }: LeadDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'quotes' | 'files' | 'details' | 'deliverables'>('activity');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [formData, setFormData] = useState({
    status: lead.status,
    priority: lead.priority,
    estimatedValue: lead.estimatedValue?.toString() || '',
    timeline: lead.timeline || '',
    budget: lead.budget || '',
  });

  // File state
  const [files, setFiles] = useState<LeadFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Portal state
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingPortalLink, setSendingPortalLink] = useState(false);
  const [portalLinkSent, setPortalLinkSent] = useState(false);

  // Get portal URL
  const baseUrl = window.location.origin;
  const portalUrl = lead.portalToken ? `${baseUrl}/portal/${lead.portalToken}` : null;

  useEffect(() => {
    fetchActivities();
    fetchFiles();
  }, [lead.id]);

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

  // File upload handlers
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
        // Track file uploads
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

  const handleCopyPortalLink = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      trackPortalLinkShared();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      alert('Failed to copy link');
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
      alert('Failed to send portal link email');
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

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="bg-dark-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-dark-border"
          onClick={(e) => e.stopPropagation()}
          data-testid="lead-detail-modal"
        >
          {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs px-2 py-1 bg-white/20 rounded-full">
                {SERVICE_TYPE_LABELS[lead.serviceType]}
              </span>
              <h2 className="text-2xl font-bold mt-2">{lead.projectTitle}</h2>
              <p className="text-violet-100 mt-1">Submitted {formatDate(lead.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowBookingModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                data-testid="create-booking-btn"
                title="Create Booking"
              >
                <Calendar className="w-4 h-4" />
                Book
              </button>
              <button 
                onClick={() => setShowEmailComposer(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                data-testid="email-client-btn"
                title="Email Client"
              >
                <MailPlus className="w-4 h-4" />
                Email
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {/* Tab Navigation */}
        <div className="flex border-b border-dark-border flex-shrink-0">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'activity' 
                ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-900/20' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            data-testid="tab-activity"
          >
            <div className="flex items-center justify-center gap-2">
              <History className="w-4 h-4" />
              Activity
            </div>
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'quotes' 
                ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-900/20' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            data-testid="tab-quotes"
          >
            <div className="flex items-center justify-center gap-2">
              <Receipt className="w-4 h-4" />
              Quotes
            </div>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'files' 
                ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-900/20' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            data-testid="tab-files"
          >
            <div className="flex items-center justify-center gap-2">
              <Paperclip className="w-4 h-4" />
              Files
              {files.length > 0 && (
                <span className="bg-violet-900/50 text-violet-300 text-xs px-2 py-0.5 rounded-full">
                  {files.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'details' 
                ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-900/20' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            data-testid="tab-details"
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'deliverables' 
                ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-900/20' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            data-testid="tab-deliverables"
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Deliverables
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'activity' ? (
            <div className="p-6">
              {/* Add Note Section */}
              <div className="mb-6 bg-dark-bg-secondary rounded-xl p-4 border border-dark-border">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Add Note
                </h3>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write a note about this lead..."
                  className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm text-white placeholder-gray-500"
                  rows={3}
                  data-testid="note-input"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    data-testid="save-note-button"
                  >
                    {addingNote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Note
                  </button>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Activity History
                </h3>

                {loadingActivities ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No activity yet</p>
                    <p className="text-sm">Add a note to start tracking this lead</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-dark-border" />
                    <div className="space-y-4">
                      {activities.map((activity) => {
                        const Icon = ACTIVITY_ICONS[activity.type] || StickyNote;
                        const colorClass = ACTIVITY_COLORS[activity.type] || 'bg-gray-800/50 text-gray-400';

                        return (
                          <div key={activity.id} className="relative flex gap-4" data-testid={`activity-${activity.id}`}>
                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    {activity.type.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs text-gray-500" title={formatDate(activity.createdAt)}>
                                    {formatTimeAgo(activity.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                  {activity.description}
                                </p>
                                {activity.user && (
                                  <p className="text-xs text-gray-500 mt-2">
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
            <div className="p-6">
              {/* Upload Section */}
              <div 
                className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragOver 
                    ? 'border-violet-500 bg-violet-900/20' 
                    : 'border-dark-border hover:border-violet-500/50 hover:bg-dark-bg-secondary'
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
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">{uploadProgress}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">
                      Drag and drop files here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-violet-400 font-medium hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, Word, Excel, Images up to 50MB
                    </p>
                  </>
                )}
              </div>

              {/* Files List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Uploaded Files ({files.length})
                </h3>

                {loadingFiles ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No files uploaded yet</p>
                    <p className="text-sm">Upload contracts, briefs, or reference images</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => {
                      const Icon = FILE_ICONS[file.category] || File;
                      const colorClass = FILE_COLORS[file.category] || 'bg-gray-800/50 text-gray-400';

                      return (
                        <div 
                          key={file.id} 
                          className="flex items-center gap-4 p-4 bg-dark-bg-secondary border border-dark-border rounded-lg hover:border-violet-500/50 transition"
                          data-testid={`file-${file.id}`}
                        >
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-6 h-6" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate" title={file.originalName}>
                              {file.originalName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {file.formattedSize} • {formatTimeAgo(file.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-2 text-gray-400 hover:text-violet-400 hover:bg-violet-900/30 rounded-lg transition"
                              title="Download"
                              data-testid={`download-${file.id}`}
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            
                            {deleteConfirm === file.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 bg-dark-border text-gray-300 text-xs rounded hover:bg-dark-card-hover"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(file.id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition"
                                title="Delete"
                                data-testid={`delete-${file.id}`}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'quotes' ? (
            <QuotesTab 
              lead={lead} 
              onQuoteUpdate={() => {
                fetchActivities();
              }} 
            />
          ) : activeTab === 'deliverables' ? (
            <div className="p-6">
              <DeliverablesTab leadId={lead.id} />
            </div>
          ) : (
            <div className="p-6">
              {/* Status & Actions */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-dark-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Status:</span>
                  {editing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                      className="px-3 py-1.5 bg-dark-bg-secondary border border-dark-border rounded-lg text-sm text-white"
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
                      className="px-4 py-2 text-gray-400 hover:bg-dark-card-hover rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-500 flex items-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 text-violet-400 hover:bg-violet-900/30 rounded-lg text-sm font-medium"
                  >
                    Edit Lead
                  </button>
                )}
              </div>

              {/* Client Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <User className="w-5 h-5 text-violet-400" />
                  Client Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-white">{lead.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <a href={`mailto:${lead.clientEmail}`} className="font-medium text-violet-400 hover:underline">
                        {lead.clientEmail}
                      </a>
                    </div>
                  </div>
                  {lead.clientPhone && (
                    <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <a href={`tel:${lead.clientPhone}`} className="font-medium text-white">{lead.clientPhone}</a>
                      </div>
                    </div>
                  )}
                  {lead.clientCompany && (
                    <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Company</p>
                        <p className="font-medium text-white">{lead.clientCompany}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-violet-400" />
                  Project Details
                </h3>
                <div className="bg-dark-bg-secondary rounded-lg p-4 mb-4 border border-dark-border">
                  <p className="text-gray-300 whitespace-pre-wrap">{lead.description}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(editing || lead.budget) && (
                    <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                      <DollarSign className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Budget</p>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            className="w-full px-2 py-1 bg-dark-card border border-dark-border rounded text-sm text-white"
                            placeholder="e.g., $5,000-$10,000"
                          />
                        ) : (
                          <p className="font-medium text-white">{lead.budget}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(editing || lead.timeline) && (
                    <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Timeline</p>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.timeline}
                            onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                            className="w-full px-2 py-1 bg-dark-card border border-dark-border rounded text-sm text-white"
                            placeholder="e.g., March 2026"
                          />
                        ) : (
                          <p className="font-medium text-white">{lead.timeline}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {lead.eventDate && (
                    <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Event Date</p>
                        <p className="font-medium text-white">{formatDate(lead.eventDate)}</p>
                      </div>
                    </div>
                  )}
                  {(editing || lead.estimatedValue) && (
                    <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Estimated Value</p>
                        {editing ? (
                          <input
                            type="number"
                            value={formData.estimatedValue}
                            onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                            className="w-full px-2 py-1 bg-dark-card border border-dark-border rounded text-sm text-white"
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
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                    <BarChart3 className="w-5 h-5 text-violet-400" />
                    Client Portal
                  </h3>
                  
                  {/* Portal URL */}
                  <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-700/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Link className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium text-gray-300">Portal URL</span>
                    </div>
                    <div className="flex items-center gap-2 bg-dark-card rounded-lg p-2 border border-dark-border">
                      <input
                        type="text"
                        value={portalUrl}
                        readOnly
                        className="flex-1 text-sm text-gray-400 bg-transparent border-none focus:outline-none truncate"
                        data-testid="portal-url-input"
                      />
                      <button
                        onClick={handleCopyPortalLink}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                          copiedLink 
                            ? 'bg-green-900/50 text-green-400' 
                            : 'bg-violet-900/50 text-violet-300 hover:bg-violet-800/50'
                        }`}
                        data-testid="copy-portal-link-btn"
                      >
                        {copiedLink ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-violet-500 transition-colors"
                        data-testid="open-portal-btn"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </a>
                    </div>
                  </div>

                  {/* Portal Stats */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                      <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center border border-blue-700/50">
                        <Eye className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Portal Views</p>
                        <p className="font-semibold text-lg text-white">
                          {lead.portalViews || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-dark-bg-secondary rounded-lg border border-dark-border">
                      <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center border border-purple-700/50">
                        <Clock className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Viewed</p>
                        <p className="font-medium text-white">
                          {lead.lastPortalView 
                            ? formatTimeAgo(lead.lastPortalView)
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Share Options */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopyPortalLink}
                        className="flex-1 px-4 py-2.5 border border-dark-border rounded-lg text-sm font-medium text-gray-300 hover:bg-dark-card-hover flex items-center justify-center gap-2 transition-colors"
                        data-testid="copy-link-btn"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={handleEmailPortalLink}
                        className="flex-1 px-4 py-2.5 border border-dark-border rounded-lg text-sm font-medium text-gray-300 hover:bg-dark-card-hover flex items-center justify-center gap-2 transition-colors"
                        data-testid="email-portal-link-btn"
                      >
                        <Mail className="w-4 h-4" />
                        Email via App
                      </button>
                    </div>
                    <button
                      onClick={handleSendPortalLink}
                      disabled={sendingPortalLink}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        portalLinkSent
                          ? 'bg-green-600 text-white'
                          : 'bg-violet-600 text-white hover:bg-violet-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      data-testid="send-portal-link-btn"
                    >
                      {sendingPortalLink ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : portalLinkSent ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Sent to {lead.clientEmail}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Portal Link to Client
                        </>
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

      {/* Email Composer Modal - rendered outside main container to prevent event bubbling */}
      {showEmailComposer && (
        <EmailComposerModal
          lead={lead}
          onClose={() => setShowEmailComposer(false)}
          onSent={() => {
            fetchActivities();
          }}
        />
      )}

      {/* Booking Modal - rendered outside main container to prevent event bubbling */}
      {showBookingModal && (
        <BookingModal
          lead={lead}
          onClose={() => setShowBookingModal(false)}
          onSaved={() => {
            setShowBookingModal(false);
            fetchActivities(); // Refresh activities to show booking created
          }}
        />
      )}
    </>
  );
}
