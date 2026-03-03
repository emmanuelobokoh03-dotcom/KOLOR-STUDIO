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
  Mail, 
  Calendar, 
  DollarSign,
  MoreHorizontal,
  Trash2,
  Eye,
  ImageIcon
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
  NEW: { bg: 'bg-blue-950/20', border: 'border-blue-800/40', header: 'bg-blue-600' },
  REVIEWING: { bg: 'bg-yellow-950/20', border: 'border-yellow-800/40', header: 'bg-yellow-600' },
  CONTACTED: { bg: 'bg-purple-950/20', border: 'border-purple-800/40', header: 'bg-purple-600' },
  QUALIFIED: { bg: 'bg-indigo-950/20', border: 'border-indigo-800/40', header: 'bg-indigo-600' },
  QUOTED: { bg: 'bg-orange-950/20', border: 'border-orange-800/40', header: 'bg-orange-600' },
  NEGOTIATING: { bg: 'bg-pink-950/20', border: 'border-pink-800/40', header: 'bg-pink-600' },
  BOOKED: { bg: 'bg-green-950/20', border: 'border-green-800/40', header: 'bg-green-600' },
  LOST: { bg: 'bg-gray-900/20', border: 'border-gray-700/40', header: 'bg-gray-600' },
};

export default function KanbanBoard({ leads, onLeadClick, onStatusChange, onLeadDelete }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 min-h-[600px]">
      {KANBAN_COLUMNS.map((status) => {
        const columnLeads = getLeadsByStatus(status);
        const colors = COLUMN_COLORS[status];
        const isOver = dragOverColumn === status;

        return (
          <div
            key={status}
            className={`flex-shrink-0 w-[300px] rounded-xl ${colors.bg} ${colors.border} border-2 transition-all duration-300 ${
              isOver ? 'ring-2 ring-violet-400 scale-[1.02]' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            data-testid={`kanban-column-${status.toLowerCase()}`}
          >
            {/* Column Header */}
            <div className={`${colors.header} text-white px-5 py-3.5 rounded-t-[10px]`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{LEAD_STATUS_LABELS[status]}</h3>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {columnLeads.length}
                </span>
              </div>
            </div>

            {/* Cards Container */}
            <div className="p-3 space-y-3 min-h-[500px]">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  className={`bg-[#1A1A1A] rounded-xl border border-[#333] overflow-hidden cursor-grab active:cursor-grabbing hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200 group ${
                    draggedLead?.id === lead.id ? 'opacity-50 scale-95' : ''
                  }`}
                  data-testid={`lead-card-${lead.id}`}
                >
                  {/* Cover Image */}
                  {lead.coverImage ? (
                    <div 
                      className="relative h-36 overflow-hidden cursor-pointer"
                      onClick={() => onLeadClick(lead)}
                    >
                      <img 
                        src={lead.coverImage} 
                        alt={lead.projectTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <span className="text-xs px-2 py-0.5 bg-violet-600/80 backdrop-blur-sm text-white rounded-full">
                          {SERVICE_TYPE_LABELS[lead.serviceType]}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="relative h-24 bg-gradient-to-br from-violet-900/30 to-purple-900/20 flex items-center justify-center cursor-pointer overflow-hidden"
                      onClick={() => onLeadClick(lead)}
                    >
                      <ImageIcon className="w-8 h-8 text-violet-500/30" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <span className="text-xs px-2 py-0.5 bg-violet-900/80 backdrop-blur-sm text-violet-300 rounded-full border border-violet-700/50">
                          {SERVICE_TYPE_LABELS[lead.serviceType]}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Header with menu */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <GripVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        {lead.projectType && lead.projectType !== 'SERVICE' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full border border-blue-700/50">
                            {PROJECT_TYPE_LABELS[lead.projectType as ProjectType] || lead.projectType}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === lead.id ? null : lead.id); }}
                          className="p-1 hover:bg-[#262626] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <MoreHorizontal className="w-4 h-4 text-[#A3A3A3]" />
                        </button>
                        {menuOpen === lead.id && (
                          <div className="absolute right-0 top-8 bg-[#1A1A1A] rounded-xl shadow-xl border border-[#333] py-1 z-10 min-w-[120px] animate-fade-in">
                            <button
                              onClick={(e) => { e.stopPropagation(); onLeadClick(lead); setMenuOpen(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-[#262626] text-[#A3A3A3] flex items-center gap-2 transition-colors duration-150"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-red-900/30 text-red-400 flex items-center gap-2 transition-colors duration-150"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project Title */}
                    <h4 
                      className="font-semibold text-[#FAFAFA] mb-3 cursor-pointer hover:text-violet-400 transition-colors duration-200 text-sm leading-snug"
                      onClick={() => onLeadClick(lead)}
                    >
                      {lead.projectTitle}
                    </h4>

                    {/* Client Info */}
                    <div className="space-y-1.5 text-sm text-[#A3A3A3]">
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
              ))}

              {columnLeads.length === 0 && (
                <div className="text-center py-12 text-gray-600 text-sm">
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
