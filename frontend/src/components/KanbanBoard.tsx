import { useState } from 'react'
import { 
  Lead, 
  LeadStatus, 
  LEAD_STATUS_LABELS, 
  SERVICE_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  ProjectType,
} from '../services/api'
import { 
  GripVertical, 
  User, 
  Calendar, 
  DollarSign,
  MoreHorizontal,
  Trash2,
  Eye,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { trackLeadStatusChanged, trackLeadDeleted } from '../utils/analytics'

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onLeadDelete: (leadId: string) => void;
}

const KANBAN_COLUMNS: LeadStatus[] = ['NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATING', 'BOOKED'];

const COLUMN_COLORS: Record<LeadStatus, { bg: string; border: string; header: string }> = {
  NEW: { bg: 'bg-brand-primary-dark/20', border: 'border-brand-primary-dark/40', header: 'bg-brand-primary' },
  REVIEWING: { bg: 'bg-brand-primary-dark/20', border: 'border-brand-primary-dark/40', header: 'bg-brand-primary' },
  CONTACTED: { bg: 'bg-brand-primary-dark/20', border: 'border-brand-primary-dark/40', header: 'bg-brand-primary' },
  QUALIFIED: { bg: 'bg-indigo-950/20', border: 'border-indigo-800/40', header: 'bg-indigo-500' },
  QUOTED: { bg: 'bg-brand-accent-dark/20', border: 'border-brand-accent-dark/40', header: 'bg-brand-accent' },
  NEGOTIATING: { bg: 'bg-blue-950/20', border: 'border-blue-800/40', header: 'bg-blue-500' },
  BOOKED: { bg: 'bg-emerald-950/20', border: 'border-emerald-800/40', header: 'bg-emerald-500' },
  LOST: { bg: 'bg-slate-950/20', border: 'border-slate-700/40', header: 'bg-slate-500' },
};

export default function KanbanBoard({ leads, onLeadClick, onStatusChange, onLeadDelete }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [mobileColumn, setMobileColumn] = useState(0);

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

  const handleDelete = async (leadId: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      trackLeadDeleted();
      onLeadDelete(leadId);
    }
    setMenuOpen(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <div
      key={lead.id}
      draggable
      onDragStart={(e) => handleDragStart(e, lead)}
      className={`bg-[#1A1A1A] rounded-xl border border-[#333] overflow-hidden cursor-grab active:cursor-grabbing hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-200 group ${
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
        <div className="relative h-20 md:h-24 bg-gradient-to-br from-brand-primary-dark/30 to-brand-primary-dark/20 flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => onLeadClick(lead)}>
          <ImageIcon className="w-7 h-7 md:w-8 md:h-8 text-brand-primary/30" />
          <div className="absolute bottom-2 left-3 right-3">
            <span className="text-xs px-2 py-0.5 bg-brand-primary-dark/80 backdrop-blur-sm text-brand-primary-light rounded-full border border-brand-primary-dark/50">
              {SERVICE_TYPE_LABELS[lead.serviceType]}
            </span>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-1.5 md:mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <GripVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block" />
            {lead.projectType && lead.projectType !== 'SERVICE' && (
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full border border-blue-700/50">
                {PROJECT_TYPE_LABELS[lead.projectType as ProjectType] || lead.projectType}
              </span>
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === lead.id ? null : lead.id); }}
              className="p-1.5 hover:bg-[#262626] rounded-lg transition-all duration-200 touch-target md:opacity-0 md:group-hover:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4 text-[#A3A3A3]" />
            </button>
            {menuOpen === lead.id && (
              <div className="absolute right-0 top-8 bg-[#1A1A1A] rounded-xl shadow-xl border border-[#333] py-1 z-10 min-w-[120px] animate-fade-in">
                <button
                  onClick={(e) => { e.stopPropagation(); onLeadClick(lead); setMenuOpen(null); }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-[#262626] text-[#A3A3A3] flex items-center gap-2 touch-target"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-red-900/30 text-red-400 flex items-center gap-2 touch-target"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <h4 className="font-semibold text-[#FAFAFA] mb-2 md:mb-3 cursor-pointer hover:text-brand-primary-light transition-colors duration-200 text-sm leading-snug line-clamp-2" onClick={() => onLeadClick(lead)}>
          {lead.projectTitle}
        </h4>

        <div className="space-y-1 md:space-y-1.5 text-xs md:text-sm text-[#A3A3A3]">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{lead.clientName}</span>
          </div>
          {lead.budget && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-green-400 font-medium">{lead.budget}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
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
            className="p-2 text-[#A3A3A3] disabled:opacity-30 touch-target"
            data-testid="kanban-prev-column"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {KANBAN_COLUMNS.map((status, idx) => {
              const count = getLeadsByStatus(status).length;
              const colors = COLUMN_COLORS[status];
              return (
                <button
                  key={status}
                  onClick={() => setMobileColumn(idx)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 touch-target ${
                    mobileColumn === idx
                      ? `${colors.header} text-white shadow-lg`
                      : 'bg-[#1A1A1A] text-[#A3A3A3] border border-[#333]'
                  }`}
                  data-testid={`mobile-tab-${status.toLowerCase()}`}
                >
                  {LEAD_STATUS_LABELS[status]}
                  <span className={`ml-1.5 ${mobileColumn === idx ? 'bg-white/20' : 'bg-[#333]'} px-1.5 py-0.5 rounded-full text-[10px]`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setMobileColumn(Math.min(KANBAN_COLUMNS.length - 1, mobileColumn + 1))}
            disabled={mobileColumn === KANBAN_COLUMNS.length - 1}
            className="p-2 text-[#A3A3A3] disabled:opacity-30 touch-target"
            data-testid="kanban-next-column"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile: Single column view */}
      <div className="md:hidden">
        {(() => {
          const status = KANBAN_COLUMNS[mobileColumn];
          const columnLeads = getLeadsByStatus(status);
          const colors = COLUMN_COLORS[status];

          return (
            <div
              className={`rounded-xl ${colors.bg} ${colors.border} border-2 animate-fade-in`}
              data-testid={`kanban-column-${status.toLowerCase()}`}
            >
              <div className={`${colors.header} text-white px-4 py-3 rounded-t-[10px]`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{LEAD_STATUS_LABELS[status]}</h3>
                  <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">{columnLeads.length}</span>
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
          const colors = COLUMN_COLORS[status];
          const isOver = dragOverColumn === status;

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-[300px] rounded-xl ${colors.bg} ${colors.border} border-2 transition-all duration-300 ${
                isOver ? 'ring-2 ring-brand-primary-light scale-[1.02]' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
              data-testid={`kanban-column-${status.toLowerCase()}`}
            >
              <div className={`${colors.header} text-white px-5 py-3.5 rounded-t-[10px]`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{LEAD_STATUS_LABELS[status]}</h3>
                  <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">{columnLeads.length}</span>
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
