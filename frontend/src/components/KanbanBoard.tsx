import { useState, useMemo } from 'react'
import { 
  Lead, 
  LeadStatus, 
  LEAD_STATUS_LABELS, 
  SERVICE_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  ProjectType,
} from '../services/api'
import {
  DotsSixVertical,
  User,
  CalendarBlank,
  CurrencyDollar,
  DotsThree,
  Trash,
  Eye,
  Image,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react'
import { trackLeadStatusChanged, trackLeadDeleted } from '../utils/analytics'
import { getIndustryLanguage } from '../utils/industryLanguage'

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onLeadDelete: (leadId: string) => void;
  user?: { industry?: string; primaryIndustry?: string };
}

const KANBAN_COLUMNS: LeadStatus[] = ['NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATING', 'BOOKED'];

// Warm pastel palette — soft column backgrounds with readable colored dots for status indicators.
// Each stage keys to { bg, border, text, dot } and is applied via inline styles for precise pastel hues.
const KANBAN_STAGE_COLORS: Record<LeadStatus, { bg: string; border: string; text: string; dot: string }> = {
  NEW:         { bg: '#FFF8F0', border: '#FDDCB5', text: '#92400E', dot: '#F59E0B' },
  REVIEWING:   { bg: '#FFF8F0', border: '#FDDCB5', text: '#92400E', dot: '#F59E0B' },
  CONTACTED:   { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E3A8A', dot: '#3B82F6' },
  QUALIFIED:   { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6' },
  QUOTED:      { bg: '#F5F0FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6' },
  NEGOTIATING: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#D97706' },
  BOOKED:      { bg: '#F0FDF4', border: '#BBF7D0', text: '#14532D', dot: '#22C55E' },
  LOST:        { bg: '#FAFAFA', border: '#E5E7EB', text: '#6B7280', dot: '#9CA3AF' },
};

// (COLUMN_COLORS removed — iter 142 swapped all column rendering to KANBAN_STAGE_COLORS pastels.)


export default function KanbanBoard({ leads, onLeadClick, onStatusChange, onLeadDelete, user }: KanbanBoardProps) {
  const lang = getIndustryLanguage(user?.industry || user?.primaryIndustry);
  const customStageNames = useMemo<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('kolor_stage_names')
      return stored ? JSON.parse(stored) : {}
    } catch { return {} }
  }, [])
  const stageLabel = (status: LeadStatus): string =>
    customStageNames[status] || lang.pipelineStageLabels?.[status] || LEAD_STATUS_LABELS[status];
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [mobileColumn, setMobileColumn] = useState(0);
  // AUDIT FIX [U3.1]: Destructive action confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getLeadsByStatus = (status: LeadStatus) => leads.filter(lead => lead.status === status);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedLead && draggedLead.status !== newStatus) {
      trackLeadStatusChanged(draggedLead.status, newStatus);
      onStatusChange(draggedLead.id, newStatus);
    }
    setDraggedLead(null);
  };

  // AUDIT FIX [U3.1]: Two-tap delete confirmation — remove browser confirm()
  const handleDelete = async (leadId: string) => {
    if (deleteConfirmId === leadId) {
      trackLeadDeleted();
      onLeadDelete(leadId);
      setDeleteConfirmId(null);
      setMenuOpen(null);
    } else {
      setDeleteConfirmId(leadId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <div
      key={lead.id}
      draggable
      onDragStart={(e) => handleDragStart(e, lead)}
      className={`bg-light-50 rounded-xl border border-light-200 overflow-hidden cursor-grab active:cursor-grabbing hover:border-purple-300 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-200 group ${
        draggedLead?.id === lead.id ? 'opacity-50 scale-95' : ''
      }`}
      data-testid={`lead-card-${lead.id}`}
    >
      {/* Cover Image */}
      {lead.coverImage ? (
        <div className="relative h-28 md:h-36 overflow-hidden cursor-pointer" onClick={() => onLeadClick(lead)}>
          <img src={lead.coverImage} alt={lead.projectTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-2 left-3 right-3">
            <span className="text-xs px-2 py-0.5 bg-brand-primary/80 backdrop-blur-sm text-white rounded-full">
              {SERVICE_TYPE_LABELS[lead.serviceType]}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative h-20 md:h-24 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => onLeadClick(lead)}>
          <Image className="w-7 h-7 md:w-8 md:h-8 text-purple-300" />
          <div className="absolute bottom-2 left-3 right-3">
            <span className="text-xs px-2 py-0.5 bg-white/80 backdrop-blur-sm text-purple-700 rounded-full border border-purple-200 font-medium">
              {SERVICE_TYPE_LABELS[lead.serviceType]}
            </span>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-1.5 md:mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <DotsSixVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block" />
            {lead.projectType && lead.projectType !== 'SERVICE' && (
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {PROJECT_TYPE_LABELS[lead.projectType as ProjectType] || lead.projectType}
              </span>
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === lead.id ? null : lead.id); }}
              className="p-1.5 hover:bg-light-100 rounded-lg transition-all duration-200 touch-target md:opacity-0 md:group-hover:opacity-100"
            >
              <DotsThree className="w-4 h-4 text-text-secondary" />
            </button>
            {menuOpen === lead.id && (
              <div className="absolute right-0 top-8 bg-light-50 rounded-xl shadow-xl border border-light-200 py-1 z-10 min-w-[120px] animate-fade-in">
                <button
                  onClick={(e) => { e.stopPropagation(); onLeadClick(lead); setMenuOpen(null); }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-light-100 text-text-secondary flex items-center gap-2 touch-target"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                  className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 touch-target ${deleteConfirmId === lead.id ? 'bg-red-50 text-red-600 font-semibold' : 'hover:bg-red-50 text-red-400'}`}
                >
                  <Trash className="w-4 h-4" /> {deleteConfirmId === lead.id ? 'Tap to confirm' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        <h4 className="font-bold text-text-primary mb-2 md:mb-3 cursor-pointer hover:text-purple-600 transition-colors duration-200 text-sm leading-snug line-clamp-2" onClick={() => onLeadClick(lead)}>
          {lead.projectTitle}
        </h4>

        <div className="space-y-1 md:space-y-1.5 text-xs md:text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{lead.clientName}</span>
          </div>
          {lead.budget && (
            <div className="flex items-center gap-2">
              <CurrencyDollar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-emerald-600 font-medium">{lead.budget}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CalendarBlank className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(lead.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Mobile: Tab-based column selector */}
      <div className="md:hidden mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileColumn(Math.max(0, mobileColumn - 1))}
            disabled={mobileColumn === 0}
            className="p-2 text-text-secondary disabled:opacity-30 touch-target"
            data-testid="kanban-prev-column"
          >
            <CaretLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {KANBAN_COLUMNS.map((status, idx) => {
              const count = getLeadsByStatus(status).length;
              const pastel = KANBAN_STAGE_COLORS[status];
              const isActive = mobileColumn === idx;
              return (
                <button
                  key={status}
                  onClick={() => setMobileColumn(idx)}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 touch-target border"
                  style={{
                    background: isActive ? pastel.bg : 'var(--surface-base)',
                    borderColor: isActive ? pastel.dot : 'var(--border)',
                    color: isActive ? pastel.text : 'var(--text-secondary)',
                  }}
                  data-testid={`mobile-tab-${status.toLowerCase()}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: pastel.dot }} aria-hidden="true" />
                    {stageLabel(status)}
                  </span>
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: isActive ? `${pastel.dot}20` : 'rgba(0,0,0,0.05)' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setMobileColumn(Math.min(KANBAN_COLUMNS.length - 1, mobileColumn + 1))}
            disabled={mobileColumn === KANBAN_COLUMNS.length - 1}
            className="p-2 text-text-secondary disabled:opacity-30 touch-target"
            data-testid="kanban-next-column"
          >
            <CaretRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile: Single column view */}
      <div className="md:hidden">
        {(() => {
          const status = KANBAN_COLUMNS[mobileColumn];
          const columnLeads = getLeadsByStatus(status);
          const pastel = KANBAN_STAGE_COLORS[status];

          return (
            <div
              className="rounded-xl border-2 animate-fade-in"
              style={{ background: pastel.bg, borderColor: pastel.border }}
              data-testid={`kanban-column-${status.toLowerCase()}`}
            >
              <div className="px-4 py-3 rounded-t-[10px]" style={{ background: `${pastel.dot}18`, borderBottom: `1px solid ${pastel.border}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: pastel.dot }} aria-hidden="true" />
                    <h3 className="font-semibold text-sm" style={{ color: pastel.text }}>{stageLabel(status)}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: `${pastel.dot}20`, color: pastel.text }}>{columnLeads.length}</span>
                </div>
              </div>
              <div className="p-3 space-y-3 min-h-[300px]">
                {columnLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
                {columnLeads.length === 0 && (
                  <div className="text-center py-12 text-gray-600 text-sm">No leads in this stage</div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Desktop: Horizontal columns */}
      <div className="hidden md:flex gap-5 overflow-x-auto pb-4 min-h-[600px]">
        {KANBAN_COLUMNS.map((status) => {
          const columnLeads = getLeadsByStatus(status);
          const pastel = KANBAN_STAGE_COLORS[status];
          const isOver = dragOverColumn === status;

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-[300px] rounded-xl border-2 transition-all duration-300 ${
                isOver ? 'ring-2 ring-brand-primary-light scale-[1.02]' : ''
              }`}
              style={{ background: pastel.bg, borderColor: pastel.border }}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
              data-testid={`kanban-column-${status.toLowerCase()}`}
            >
              <div className="px-5 py-3.5 rounded-t-[10px]" style={{ background: `${pastel.dot}14`, borderBottom: `1px solid ${pastel.border}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: pastel.dot }} aria-hidden="true" />
                    <h3 className="font-semibold text-sm" style={{ color: pastel.text }}>{stageLabel(status)}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: `${pastel.dot}20`, color: pastel.text }}>{columnLeads.length}</span>
                </div>
              </div>
              <div className="p-3 space-y-3 min-h-[500px]">
                {columnLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
                {columnLeads.length === 0 && (
                  <div className="text-center py-12 text-gray-600 text-sm">Drop leads here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
