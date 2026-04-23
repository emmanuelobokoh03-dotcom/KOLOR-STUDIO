import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { InlineHint } from './InlineHint'
import {
  Lead,
  Contract,
  ContractStatus,
  ContractType,
  ContractTemplate,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  contractsApi,
  authApi,
} from '../services/api'
import {
  Plus,
  FileText,
  PaperPlaneTilt,
  CheckCircle,
  PencilSimple,
  Trash,
  SpinnerGap,
  WarningCircle,
  Clock,
  Eye,
  X,
  Camera,
  Palette,
  PenNib,
  Globe,
  Briefcase,
  CaretDown
} from '@phosphor-icons/react'
import EmailComposer from './EmailComposer'
import { EmptyState } from './EmptyState'
import { Signature } from '@phosphor-icons/react'

interface ContractsTabProps {
  leadId: string;
  lead?: Lead;
  onContractSigned?: () => void;
}

const STATUS_STYLES: Record<ContractStatus, string> = {
  DRAFT: 'bg-light-100 text-text-secondary border border-light-200',
  SENT: 'bg-blue-50 text-blue-700 border border-blue-200',
  VIEWED: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  AGREED: 'bg-green-50 text-green-700 border border-green-200',
};

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  PHOTOGRAPHY_SHOOT: Camera,
  PORTRAIT_COMMISSION: Palette,
  LOGO_DESIGN: PenNib,
  WEB_DESIGN: Globe,
  GENERAL_SERVICE: Briefcase,
  CUSTOM: FileText,
};

export default function ContractsTab({ leadId, lead, onContractSigned }: ContractsTabProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [emailComposerContract, setEmailComposerContract] = useState<Contract | null>(null);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const [userName, setUserName] = useState('');
  const [studioName, setStudioName] = useState('');

  useEffect(() => {
    fetchContracts();
    fetchUserInfo();
  }, [leadId]);

  const fetchContracts = async () => {
    setLoading(true);
    const result = await contractsApi.getForLead(leadId);
    if (result.data?.contracts) {
      setContracts(result.data.contracts);
      // Auto-expand the newest contract so it's immediately visible
      if (result.data.contracts.length > 0 && !expandedContract) {
        setExpandedContract(result.data.contracts[0].id);
      }
      // Check for first signed contract celebration
      if (result.data.contracts.some((c: Contract) => c.clientAgreed)) {
        onContractSigned?.();
      }
    }
    setLoading(false);
  };

  const fetchUserInfo = async () => {
    const result = await authApi.getMe();
    if (result.data?.user) {
      const u = result.data.user as { firstName: string; lastName: string; studioName?: string; industry?: string | null; primaryIndustry?: string | null };
      setUserName(`${u.firstName} ${u.lastName}`.trim());
      setStudioName(u.studioName || '');
      // Fetch templates filtered by industry so fine-art users don't see photography templates
      const industry = u.industry || u.primaryIndustry || undefined;
      const tmplResult = await contractsApi.getTemplates(industry || undefined);
      if (tmplResult.data?.templates) setTemplates(tmplResult.data.templates);
    }
  };

  const handleCreateFromTemplate = async (templateType: string) => {
    setCreating(true);
    setError('');
    const result = await contractsApi.create(leadId, { templateType });
    setCreating(false);
    if (result.error) {
      setError(result.message || 'Failed to create contract');
      return;
    }
    if (result.data?.contract) {
      setContracts([result.data.contract, ...contracts]);
      setShowTemplateSelector(false);
      setEditingContract(result.data.contract);
      setEditContent(result.data.contract.content);
      setEditTitle(result.data.contract.title);
    }
  };

  const handleSave = async () => {
    if (!editingContract) return;
    setSaving(true);
    const result = await contractsApi.update(editingContract.id, {
      title: editTitle,
      content: editContent,
    });
    setSaving(false);
    if (result.data?.contract) {
      setContracts(contracts.map(c => c.id === editingContract.id ? result.data!.contract : c));
      setEditingContract(null);
    }
  };

  const handleSaveAndSend = async () => {
    if (!editingContract) return;
    setSaving(true);
    try {
      const result = await contractsApi.update(editingContract.id, {
        title: editTitle,
        content: editContent,
      });
      if (result.error || !result.data?.contract) {
        toast.error(result.message || 'Failed to save contract');
        return;
      }
      setContracts(contracts.map(c => c.id === editingContract.id ? result.data!.contract : c));
      const updated = result.data.contract;
      setEditingContract(null);
      // Open the email composer; handleEmailSend toasts success on actual send
      handleSendClick(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleSendClick = (contract: Contract) => {
    if (lead) {
      setEmailComposerContract(contract);
    } else {
      // Fallback: send without email composer if lead not available
      handleSendDirect(contract.id);
    }
  };

  const handleSendDirect = async (contractId: string) => {
    setSending(contractId);
    const result = await contractsApi.send(contractId);
    setSending(null);
    if (result.data?.contract) {
      setContracts(contracts.map(c => c.id === contractId ? result.data!.contract : c));
    } else {
      setError(result.message || 'Failed to send contract');
    }
  };

  const handleEmailSend = async (subject: string, message: string) => {
    if (!emailComposerContract) return;
    setSending(emailComposerContract.id);
    try {
      const result = await contractsApi.send(emailComposerContract.id, { subject, message });
      if (result.error) {
        toast.error(result.message || 'Failed to send contract');
        throw new Error(result.message || 'Failed to send contract');
      }
      if (result.data?.contract) {
        setContracts(contracts.map(c => c.id === emailComposerContract.id ? result.data!.contract : c));
      }
      toast.success('Contract sent to client');
      fetchContracts();
    } catch (e) {
      // EmailComposer expects thrown errors to show inline validation state; retain throw
      throw e;
    } finally {
      setSending(null);
      setEmailComposerContract(null);
    }
  };

  const handleDelete = (contractId: string) => {
    // Iter 147 — Universal undo pattern (replaces confirm() dialog)
    const deletedContract = contracts.find(c => c.id === contractId);
    if (!deletedContract) return;

    setContracts(prev => prev.filter(c => c.id !== contractId));

    let undoTimeout: ReturnType<typeof setTimeout>;

    const toastId = toast(
      <div className="flex items-center justify-between gap-3 w-full">
        <span className="text-sm">
          <span className="font-medium">{deletedContract.title}</span>
          <span className="text-text-secondary"> deleted</span>
        </span>
        <button
          onClick={() => {
            clearTimeout(undoTimeout)
            toast.dismiss(toastId)
            setContracts(prev => [deletedContract, ...prev])
          }}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition flex-shrink-0 underline"
          data-testid="undo-contract-delete"
        >
          Undo
        </button>
      </div>,
      { duration: 5000, position: 'bottom-right' }
    );

    undoTimeout = setTimeout(async () => {
      const result = await contractsApi.delete(contractId);
      if (result.error) {
        setContracts(prev => [deletedContract, ...prev]);
        toast.error('Failed to delete contract — restored');
      }
    }, 5000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  // Editor view
  if (editingContract) {
    return (
      <div className="p-4 md:p-6 space-y-4" data-testid="contract-editor">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-text-primary">Edit Contract</h3>
          <button
            onClick={() => setEditingContract(null)}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-light-100 rounded-xl touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Title</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-base border border-light-200 rounded-xl text-text-primary text-base"
            data-testid="contract-title-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Contract Content (HTML)</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 bg-surface-base border border-light-200 rounded-xl text-text-primary font-mono text-sm resize-none text-base"
            data-testid="contract-content-input"
          />
        </div>
        <div className="bg-surface-base rounded-xl p-4 border border-light-200">
          <p className="text-xs text-text-secondary mb-2 font-medium">Preview:</p>
          <div
            className="prose prose-sm prose-invert max-w-none text-text-secondary [&_h2]:text-text-primary [&_h2]:text-lg [&_h3]:text-text-primary [&_h3]:text-base [&_strong]:text-text-primary [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: editContent }}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setEditingContract(null)}
            className="px-5 py-2.5 text-text-secondary hover:bg-light-100 rounded-xl font-medium touch-target"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary disabled:opacity-50 flex items-center gap-2 touch-target"
            data-testid="save-contract-btn"
          >
            {saving ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Contract
          </button>
          {editingContract.status === 'DRAFT' && (
            <button
              onClick={handleSaveAndSend}
              disabled={saving}
              className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2 touch-target"
              data-testid="save-and-send-contract-btn"
            >
              <PaperPlaneTilt weight="bold" className="w-4 h-4" />
              Save &amp; Send
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-400 text-sm animate-fade-in">
          <WarningCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto p-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Contracts
        </h3>
        <button
          onClick={() => setShowTemplateSelector(true)}
          className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary touch-target"
          data-testid="new-contract-btn"
        >
          <Plus weight="bold" className="w-4 h-4" /> New Contract
        </button>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="bg-surface-base rounded-xl border border-light-200 p-4 md:p-5 animate-fade-in" data-testid="template-selector">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-primary">Choose a Template</h4>
            <button onClick={() => setShowTemplateSelector(false)} className="p-1.5 text-text-secondary hover:text-text-primary touch-target">
              <X className="w-4 h-4" />
            </button>
          </div>
          <InlineHint storageKey="seen_contract_template_tip" variant="violet">
            <span className="text-xs"><strong>First contract?</strong> Pick a template that fits your project. You can edit every word before sending.</span>
          </InlineHint>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((tmpl, index) => {
              const Icon = TEMPLATE_ICONS[tmpl.type] || FileText;
              const isRecommended = index === 0;
              return (
                <button
                  key={tmpl.type}
                  onClick={() => handleCreateFromTemplate(tmpl.type)}
                  disabled={creating}
                  className="flex items-center gap-3 p-3 md:p-4 bg-light-50 border border-light-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-left touch-target"
                  data-testid={`template-${tmpl.type.toLowerCase()}`}
                >
                  <div className="p-2 bg-purple-50 rounded-xl border border-purple-200 flex-shrink-0">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{tmpl.label}</p>
                      {isRecommended && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0 uppercase tracking-wide"
                          data-testid="template-recommended-badge"
                        >
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">{tmpl.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {creating && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-purple-600">
              <SpinnerGap className="w-4 h-4 animate-spin" /> Creating contract...
            </div>
          )}
        </div>
      )}

      {/* Contracts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-surface-base rounded-xl border border-light-200 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-light-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-light-200 rounded" />
                  <div className="h-3 w-24 bg-light-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={Signature}
          headline="Get your first contract signed today."
          description="Send a contract for online signing. No printing, no scanning, no chasing clients for paperwork."
          ctaLabel="+ New Contract"
          onCta={() => setShowTemplateSelector(true)}
        />
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const Icon = TEMPLATE_ICONS[contract.templateType] || FileText;
            const isExpanded = expandedContract === contract.id;

            return (
              <div
                key={contract.id}
                className="bg-surface-base rounded-xl border border-light-200 overflow-hidden hover:border-light-300 transition-all duration-200"
                data-testid={`contract-${contract.id}`}
              >
                {/* Contract header */}
                <div
                  className="flex items-center gap-3 p-3 md:p-4 cursor-pointer"
                  onClick={() => setExpandedContract(isExpanded ? null : contract.id)}
                >
                  <div className="p-2 bg-purple-50 rounded-xl border border-purple-200 flex-shrink-0">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-text-primary truncate">{contract.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium flex-shrink-0 ${STATUS_STYLES[contract.status]}`}>
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {CONTRACT_TYPE_LABELS[contract.templateType]} &middot; Created {formatDate(contract.createdAt)}
                    </p>
                  </div>
                  <CaretDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-light-200 animate-fade-in">
                    {/* Status info */}
                    <div className="px-3 md:px-4 py-3 bg-light-50 space-y-1.5">
                      {contract.sentAt && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <PaperPlaneTilt className="w-3.5 h-3.5 text-blue-600" />
                          Sent on {formatDate(contract.sentAt)}
                        </div>
                      )}
                      {contract.clientAgreedAt && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Signed on {formatDate(contract.clientAgreedAt)}
                          {contract.clientIP && <span className="text-text-tertiary">(IP: {contract.clientIP})</span>}
                        </div>
                      )}
                      {contract.status === 'DRAFT' && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                          Draft &mdash; edit and send to client when ready
                        </div>
                      )}
                    </div>

                    {/* Contract preview — inline summary with fade + "See full" link (Iter 145) */}
                    <div className="px-3 md:px-4 py-4 max-h-[200px] overflow-y-auto relative">
                      <div
                        className="prose prose-sm prose-invert max-w-none text-text-secondary [&_h2]:text-text-primary [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-text-primary [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:text-text-primary [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-2"
                        dangerouslySetInnerHTML={{ __html: contract.content }}
                      />
                      {/* Fade gradient hinting there's more below the fold */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                        style={{ background: 'linear-gradient(to bottom, transparent, var(--surface-base))' }}
                        aria-hidden="true"
                      />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewContract(contract); }}
                      className="w-full py-2 text-xs text-brand-600 hover:text-brand-700 font-medium border-t border-light-200 transition"
                      data-testid={`see-full-contract-${contract.id}`}
                    >
                      See full contract &rarr;
                    </button>

                    {/* Actions */}
                    <div className="px-3 md:px-4 py-3 border-t border-light-200 flex items-center gap-2 flex-wrap">
                      {/* Preview button — always shown so user can open the full-screen modal with Send inside (Iter 145) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewContract(contract); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-brand-600 border border-brand-200 hover:bg-brand-50 rounded-xl font-medium touch-target transition"
                        data-testid={`preview-contract-${contract.id}`}
                      >
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      {contract.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingContract(contract); setEditContent(contract.content); setEditTitle(contract.title); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary hover:bg-light-100 rounded-xl font-medium touch-target"
                            data-testid={`edit-contract-${contract.id}`}
                          >
                            <PencilSimple className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(contract.id); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:bg-red-50 rounded-xl font-medium touch-target"
                            data-testid={`delete-contract-${contract.id}`}
                          >
                            <Trash className="w-4 h-4" /> Delete
                          </button>
                        </>
                      )}
                      {contract.status !== 'AGREED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSendClick(contract); }}
                          disabled={sending === contract.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary disabled:opacity-50 ml-auto touch-target"
                          data-testid={`send-contract-${contract.id}`}
                        >
                          {sending === contract.id ? (
                            <><SpinnerGap className="w-4 h-4 animate-spin" /> Sending...</>
                          ) : (
                            <><PaperPlaneTilt weight="bold" className="w-4 h-4" /> {contract.status === 'DRAFT' ? 'Send to Client' : 'Resend'}</>
                          )}
                        </button>
                      )}
                      {contract.status === 'AGREED' && (
                        <div className="flex items-center gap-2 ml-auto text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" /> Agreement Signed
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Email Composer Modal */}
      {emailComposerContract && lead && (
        <EmailComposer
          type="contract"
          recipientName={lead.clientName}
          recipientEmail={lead.clientEmail}
          projectTitle={lead.projectTitle}
          userName={userName}
          studioName={studioName}
          onSend={handleEmailSend}
          onCancel={() => setEmailComposerContract(null)}
        />
      )}

      {/* Contract Preview Modal (Iter 145) — fullscreen unclipped review with Send button */}
      {previewContract && (
        <ContractPreviewModal
          contract={previewContract}
          onClose={() => setPreviewContract(null)}
          onSend={() => {
            const c = previewContract;
            setPreviewContract(null);
            handleSendClick(c);
          }}
          sending={sending === previewContract.id}
        />
      )}
    </div>
  );
}

// ─── ContractPreviewModal ───────────────────────────────────────────
function ContractPreviewModal({
  contract,
  onClose,
  onSend,
  sending,
}: {
  contract: Contract
  onClose: () => void
  onSend: () => void
  sending: boolean
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      data-testid="contract-preview-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-preview-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative z-10 flex flex-col bg-surface-base m-4 md:m-8 lg:m-16 rounded-2xl border border-light-200 shadow-2xl overflow-hidden w-auto"
        style={{ maxHeight: 'calc(100vh - 64px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-light-200 flex-shrink-0">
          <div className="min-w-0">
            <h2 id="contract-preview-title" className="text-base font-bold text-text-primary truncate">{contract.title}</h2>
            <p className="text-xs text-text-secondary mt-0.5">Review before sending to client</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-light-100 rounded-xl touch-target transition flex-shrink-0"
            aria-label="Close preview"
            data-testid="contract-preview-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable contract body — no max-height clipping */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-8">
          <div
            className="prose prose-sm max-w-none text-text-secondary
              [&_h1]:text-text-primary [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4
              [&_h2]:text-text-primary [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2
              [&_h3]:text-text-primary [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1
              [&_strong]:text-text-primary
              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
              [&_li]:text-sm [&_li]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: contract.content }}
          />
        </div>

        {/* Footer — always visible, sticky at bottom */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-light-200 bg-surface-base flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-text-secondary hover:bg-light-100 rounded-xl font-medium touch-target transition"
            data-testid="contract-preview-cancel-btn"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {contract.status !== 'AGREED' && (
              <button
                onClick={onSend}
                disabled={sending}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 disabled:opacity-50 touch-target transition"
                data-testid="contract-preview-send-btn"
              >
                {sending
                  ? <><SpinnerGap className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><PaperPlaneTilt weight="bold" className="w-4 h-4" /> {contract.status === 'DRAFT' ? 'Send to Client' : 'Resend to Client'}</>}
              </button>
            )}
            {contract.status === 'AGREED' && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Agreement Signed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
