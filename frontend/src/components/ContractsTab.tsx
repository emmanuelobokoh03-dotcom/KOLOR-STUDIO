import { useState, useEffect } from 'react'
import { InlineHint } from './InlineHint'
import {
  Contract,
  ContractStatus,
  ContractType,
  ContractTemplate,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  contractsApi,
} from '../services/api'
import {
  Plus,
  FileText,
  Send,
  CheckCircle,
  Edit3,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Eye,
  X,
  Camera,
  Palette,
  PenTool,
  Globe,
  Briefcase,
  FileEdit,
  ChevronDown,
} from 'lucide-react'

interface ContractsTabProps {
  leadId: string;
}

const STATUS_STYLES: Record<ContractStatus, string> = {
  DRAFT: 'bg-gray-800/50 text-gray-400 border border-gray-700/50',
  SENT: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  VIEWED: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  AGREED: 'bg-green-900/50 text-green-300 border border-green-700/50',
};

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  PHOTOGRAPHY_SHOOT: Camera,
  PORTRAIT_COMMISSION: Palette,
  LOGO_DESIGN: PenTool,
  WEB_DESIGN: Globe,
  GENERAL_SERVICE: Briefcase,
  CUSTOM: FileEdit,
};

export default function ContractsTab({ leadId }: ContractsTabProps) {
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

  useEffect(() => {
    fetchContracts();
    fetchTemplates();
  }, [leadId]);

  const fetchContracts = async () => {
    setLoading(true);
    const result = await contractsApi.getForLead(leadId);
    if (result.data?.contracts) setContracts(result.data.contracts);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const result = await contractsApi.getTemplates();
    if (result.data?.templates) setTemplates(result.data.templates);
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

  const handleSend = async (contractId: string) => {
    setSending(contractId);
    const result = await contractsApi.send(contractId);
    setSending(null);
    if (result.data?.contract) {
      setContracts(contracts.map(c => c.id === contractId ? result.data!.contract : c));
    } else {
      setError(result.message || 'Failed to send contract');
    }
  };

  const handleDelete = async (contractId: string) => {
    if (!confirm('Delete this draft contract?')) return;
    const result = await contractsApi.delete(contractId);
    if (!result.error) {
      setContracts(contracts.filter(c => c.id !== contractId));
    }
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
          <h3 className="text-base md:text-lg font-semibold text-[#FAFAFA]">Edit Contract</h3>
          <button
            onClick={() => setEditingContract(null)}
            className="p-2 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-xl touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#A3A3A3] mb-1.5">Title</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-white text-base"
            data-testid="contract-title-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#A3A3A3] mb-1.5">Contract Content (HTML)</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#333] rounded-xl text-white font-mono text-sm resize-none text-base"
            data-testid="contract-content-input"
          />
        </div>
        <div className="bg-[#0F0F0F] rounded-xl p-4 border border-[#333]">
          <p className="text-xs text-[#A3A3A3] mb-2 font-medium">Preview:</p>
          <div
            className="prose prose-sm prose-invert max-w-none text-[#A3A3A3] [&_h2]:text-[#FAFAFA] [&_h2]:text-lg [&_h3]:text-[#FAFAFA] [&_h3]:text-base [&_strong]:text-[#FAFAFA] [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: editContent }}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setEditingContract(null)}
            className="px-5 py-2.5 text-[#A3A3A3] hover:bg-[#262626] rounded-xl font-medium touch-target"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-500 disabled:opacity-50 flex items-center gap-2 touch-target"
            data-testid="save-contract-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Contract
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl flex items-center gap-2 text-red-400 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto p-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-[#FAFAFA] flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-400" />
          Contracts
        </h3>
        <button
          onClick={() => setShowTemplateSelector(true)}
          className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-500 touch-target"
          data-testid="new-contract-btn"
        >
          <Plus className="w-4 h-4" /> New Contract
        </button>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="bg-[#0F0F0F] rounded-xl border border-[#333] p-4 md:p-5 animate-fade-in" data-testid="template-selector">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-[#FAFAFA]">Choose a Template</h4>
            <button onClick={() => setShowTemplateSelector(false)} className="p-1.5 text-[#A3A3A3] hover:text-white touch-target">
              <X className="w-4 h-4" />
            </button>
          </div>
          <InlineHint storageKey="seen_contract_template_tip" variant="violet">
            <span className="text-xs"><strong>First contract?</strong> Pick a template that fits your project. You can edit every word before sending.</span>
          </InlineHint>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((tmpl) => {
              const Icon = TEMPLATE_ICONS[tmpl.type] || FileText;
              return (
                <button
                  key={tmpl.type}
                  onClick={() => handleCreateFromTemplate(tmpl.type)}
                  disabled={creating}
                  className="flex items-center gap-3 p-3 md:p-4 bg-[#1A1A1A] border border-[#333] rounded-xl hover:border-violet-500/50 hover:bg-violet-900/10 transition-all duration-200 text-left touch-target"
                  data-testid={`template-${tmpl.type.toLowerCase()}`}
                >
                  <div className="p-2 bg-violet-900/30 rounded-xl border border-violet-700/30 flex-shrink-0">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#FAFAFA] truncate">{tmpl.label}</p>
                    <p className="text-xs text-[#A3A3A3]">{tmpl.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {creating && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-violet-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Creating contract...
            </div>
          )}
        </div>
      )}

      {/* Contracts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#0F0F0F] rounded-xl border border-[#333] p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#333] rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-[#333] rounded" />
                  <div className="h-3 w-24 bg-[#2a2a2a] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center" data-testid="contracts-empty-state">
          <div className="text-5xl md:text-6xl mb-5 md:mb-6 opacity-40 select-none">&#x1F4DD;</div>
          <h3 className="text-lg md:text-xl font-semibold text-[#FAFAFA] mb-2">Protect yourself legally</h3>
          <p className="text-sm text-[#A3A3A3] max-w-md mb-5 leading-relaxed">
            Create a contract to set clear expectations and protect both you and your client.
          </p>
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition font-medium"
            data-testid="contracts-empty-cta"
          >
            <FileText className="w-5 h-5" />
            Create Contract
          </button>
          <p className="text-xs text-gray-500 mt-4 max-w-sm">
            <strong>Pro tip:</strong> Use a template to get started quickly. You can customize it before sending.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const Icon = TEMPLATE_ICONS[contract.templateType] || FileText;
            const isExpanded = expandedContract === contract.id;

            return (
              <div
                key={contract.id}
                className="bg-[#0F0F0F] rounded-xl border border-[#333] overflow-hidden hover:border-[#404040] transition-all duration-200"
                data-testid={`contract-${contract.id}`}
              >
                {/* Contract header */}
                <div
                  className="flex items-center gap-3 p-3 md:p-4 cursor-pointer"
                  onClick={() => setExpandedContract(isExpanded ? null : contract.id)}
                >
                  <div className="p-2 bg-violet-900/30 rounded-xl border border-violet-700/30 flex-shrink-0">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-[#FAFAFA] truncate">{contract.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium flex-shrink-0 ${STATUS_STYLES[contract.status]}`}>
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </span>
                    </div>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">
                      {CONTRACT_TYPE_LABELS[contract.templateType]} &middot; Created {formatDate(contract.createdAt)}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#A3A3A3] transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[#333] animate-fade-in">
                    {/* Status info */}
                    <div className="px-3 md:px-4 py-3 bg-[#1A1A1A] space-y-1.5">
                      {contract.sentAt && (
                        <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                          <Send className="w-3.5 h-3.5 text-blue-400" />
                          Sent on {formatDate(contract.sentAt)}
                        </div>
                      )}
                      {contract.clientAgreedAt && (
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Signed on {formatDate(contract.clientAgreedAt)}
                          {contract.clientIP && <span className="text-gray-500">(IP: {contract.clientIP})</span>}
                        </div>
                      )}
                      {contract.status === 'DRAFT' && (
                        <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          Draft &mdash; edit and send to client when ready
                        </div>
                      )}
                    </div>

                    {/* Contract preview */}
                    <div className="px-3 md:px-4 py-4 max-h-[300px] overflow-y-auto">
                      <div
                        className="prose prose-sm prose-invert max-w-none text-[#A3A3A3] [&_h2]:text-[#FAFAFA] [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-[#FAFAFA] [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:text-[#FAFAFA] [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-2"
                        dangerouslySetInnerHTML={{ __html: contract.content }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="px-3 md:px-4 py-3 border-t border-[#333] flex items-center gap-2 flex-wrap">
                      {contract.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingContract(contract); setEditContent(contract.content); setEditTitle(contract.title); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#A3A3A3] hover:bg-[#262626] rounded-xl font-medium touch-target"
                            data-testid={`edit-contract-${contract.id}`}
                          >
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(contract.id); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-xl font-medium touch-target"
                            data-testid={`delete-contract-${contract.id}`}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </>
                      )}
                      {contract.status !== 'AGREED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSend(contract.id); }}
                          disabled={sending === contract.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-500 disabled:opacity-50 ml-auto touch-target"
                          data-testid={`send-contract-${contract.id}`}
                        >
                          {sending === contract.id ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                          ) : (
                            <><Send className="w-4 h-4" /> {contract.status === 'DRAFT' ? 'Send to Client' : 'Resend'}</>
                          )}
                        </button>
                      )}
                      {contract.status === 'AGREED' && (
                        <div className="flex items-center gap-2 ml-auto text-green-400 text-sm font-medium">
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
    </div>
  );
}
