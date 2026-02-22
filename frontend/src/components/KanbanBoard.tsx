import { useState } from 'react'
import { 
  Lead, 
  LeadStatus, 
  LEAD_STATUS_LABELS, 
  SERVICE_TYPE_LABELS
} from '../services/api'
import { 
  GripVertical, 
  User, 
  Mail, 
  Calendar, 
  DollarSign,
  MoreHorizontal,
  Trash2,
  Eye
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
  NEW: { bg: 'bg-blue-950/30', border: 'border-blue-800/50', header: 'bg-blue-600' },
  REVIEWING: { bg: 'bg-yellow-950/30', border: 'border-yellow-800/50', header: 'bg-yellow-600' },
  CONTACTED: { bg: 'bg-purple-950/30', border: 'border-purple-800/50', header: 'bg-purple-600' },
  QUALIFIED: { bg: 'bg-indigo-950/30', border: 'border-indigo-800/50', header: 'bg-indigo-600' },
  QUOTED: { bg: 'bg-orange-950/30', border: 'border-orange-800/50', header: 'bg-orange-600' },
  NEGOTIATING: { bg: 'bg-pink-950/30', border: 'border-pink-800/50', header: 'bg-pink-600' },
  BOOKED: { bg: 'bg-green-950/30', border: 'border-green-800/50', header: 'bg-green-600' },
  LOST: { bg: 'bg-gray-900/30', border: 'border-gray-700/50', header: 'bg-gray-600' },
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
      // Track status change
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
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {KANBAN_COLUMNS.map((status) => {
        const columnLeads = getLeadsByStatus(status);
        const colors = COLUMN_COLORS[status];
        const isOver = dragOverColumn === status;

        return (
          <div
            key={status}
            className={`flex-shrink-0 w-72 rounded-xl ${colors.bg} ${colors.border} border-2 transition-all ${
              isOver ? 'ring-2 ring-violet-400 scale-[1.02]' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            data-testid={`kanban-column-${status.toLowerCase()}`}
          >
            {/* Column Header */}
            <div className={`${colors.header} text-white px-4 py-3 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{LEAD_STATUS_LABELS[status]}</h3>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
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
                  className={`bg-dark-card rounded-lg shadow-sm border border-dark-border p-4 cursor-grab active:cursor-grabbing hover:border-violet-500/50 hover:shadow-md transition-all ${
                    draggedLead?.id === lead.id ? 'opacity-50 scale-95' : ''
                  }`}
                  data-testid={`lead-card-${lead.id}`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-500" />
                      <span className="text-xs px-2 py-0.5 bg-violet-900/50 text-violet-300 rounded-full border border-violet-700/50">
                        {SERVICE_TYPE_LABELS[lead.serviceType]}
                      </span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === lead.id ? null : lead.id)}
                        className="p-1 hover:bg-dark-card-hover rounded"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      {menuOpen === lead.id && (
                        <div className="absolute right-0 top-8 bg-dark-card rounded-lg shadow-lg border border-dark-border py-1 z-10 min-w-[120px]">
                          <button
                            onClick={() => { onLeadClick(lead); setMenuOpen(null); }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-dark-card-hover text-gray-300 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-900/30 text-red-400 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Title */}
                  <h4 
                    className="font-semibold text-white mb-2 cursor-pointer hover:text-violet-400"
                    onClick={() => onLeadClick(lead)}
                  >
                    {lead.projectTitle}
                  </h4>

                  {/* Client Info */}
                  <div className="space-y-1.5 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{lead.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{lead.clientEmail}</span>
                    </div>
                    {lead.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="text-green-400">{lead.budget}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(lead.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {columnLeads.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
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
