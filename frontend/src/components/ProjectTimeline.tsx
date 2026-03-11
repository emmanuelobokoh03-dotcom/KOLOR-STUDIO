import { useState, useEffect } from 'react';
import {
  CalendarBlank,
  CheckCircle,
  Circle,
  Clock,
  Plus,
  Trash,
  SpinnerGap,
  DotsSixVertical,
  Flag
} from '@phosphor-icons/react';
import { format, isPast, isFuture, isToday } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Milestone {
  id: string;
  name: string;
  description?: string | null;
  dueDate: string;
  completed: boolean;
  completedAt?: string | null;
  order: number;
}

interface TimelineData {
  shootingDate: string | null;
  editingDeadline: string | null;
  deliveryDate: string | null;
  milestones: Milestone[];
}

interface ProjectTimelineProps {
  leadId?: string;
  token?: string;
  editable?: boolean;
  authToken?: string;
}

// ── Helpers ────────────────────────────────────────────
function fmtDate(d: string) { return format(new Date(d), 'MMM d, yyyy'); }

function statusOf(d: string, completed: boolean) {
  if (completed) return 'completed';
  if (isPast(new Date(d)) && !isToday(new Date(d))) return 'overdue';
  if (isToday(new Date(d))) return 'today';
  return 'upcoming';
}

const STATUS_STYLES = {
  completed: { dot: 'bg-green-500/20 border-green-500', icon: 'text-green-400', card: 'bg-green-900/10 border-green-700/30', text: 'text-green-400' },
  overdue:   { dot: 'bg-red-500/20 border-red-500',     icon: 'text-red-400',   card: 'bg-red-900/10 border-red-700/30',     text: 'text-red-400' },
  today:     { dot: 'bg-amber-500/20 border-amber-500',  icon: 'text-amber-400', card: 'bg-amber-900/10 border-amber-700/30', text: 'text-amber-400' },
  upcoming:  { dot: 'bg-[#333] border-[#555]',           icon: 'text-[#A3A3A3]', card: 'bg-[#1A1A1A] border-[#333]',          text: 'text-[#A3A3A3]' },
};

const PORTAL_STATUS_STYLES = {
  completed: { dot: 'bg-green-100 border-green-500', icon: 'text-green-600', card: 'bg-green-50 border-green-200', text: 'text-green-600' },
  overdue:   { dot: 'bg-red-100 border-red-500',     icon: 'text-red-600',   card: 'bg-red-50 border-red-200',     text: 'text-red-600' },
  today:     { dot: 'bg-amber-100 border-amber-500',  icon: 'text-amber-600', card: 'bg-amber-50 border-amber-200', text: 'text-amber-600' },
  upcoming:  { dot: 'bg-gray-100 border-gray-300',    icon: 'text-gray-400',  card: 'bg-gray-50 border-gray-200',   text: 'text-gray-500' },
};

// ── Component ──────────────────────────────────────────
export default function ProjectTimeline({ leadId, token, editable = false, authToken }: ProjectTimelineProps) {
  const [data, setData] = useState<TimelineData>({ shootingDate: null, editingDeadline: null, deliveryDate: null, milestones: [] });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isPortal = !!token;
  const styles = isPortal ? PORTAL_STATUS_STYLES : STATUS_STYLES;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  useEffect(() => { fetchTimeline(); }, [leadId, token]);

  const fetchTimeline = async () => {
    try {
      const url = token
        ? `${API_URL}/api/portal/${token}/timeline`
        : `${API_URL}/api/leads/${leadId}/milestones`;
      const res = await fetch(url, { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
      if (res.ok) setData(await res.json());
    } catch (err) { console.error('Fetch timeline error:', err); }
    finally { setLoading(false); }
  };

  const addMilestone = async () => {
    if (!newName.trim() || !newDate || !leadId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/leads/${leadId}/milestones`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null, dueDate: newDate, order: data.milestones.length }),
      });
      if (res.ok) { setNewName(''); setNewDate(''); setNewDesc(''); setShowAdd(false); await fetchTimeline(); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const toggleComplete = async (ms: Milestone) => {
    setTogglingId(ms.id);
    try {
      await fetch(`${API_URL}/api/leads/milestones/${ms.id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ completed: !ms.completed }),
      });
      await fetchTimeline();
    } catch (err) { console.error(err); }
    finally { setTogglingId(null); }
  };

  const deleteMilestone = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/leads/milestones/${id}`, { method: 'DELETE', headers });
      await fetchTimeline();
    } catch (err) { console.error(err); }
  };

  // Build unified sorted list of key dates + custom milestones
  const allItems: (Milestone & { isKey?: boolean })[] = [];
  if (data.shootingDate)    allItems.push({ id: '_shoot',    name: 'Shoot Day',        dueDate: data.shootingDate,    completed: isPast(new Date(data.shootingDate)) && !isToday(new Date(data.shootingDate)),    completedAt: null, description: null, order: -3, isKey: true });
  if (data.editingDeadline) allItems.push({ id: '_edit',     name: 'Editing Deadline',  dueDate: data.editingDeadline, completed: isPast(new Date(data.editingDeadline)) && !isToday(new Date(data.editingDeadline)), completedAt: null, description: null, order: -2, isKey: true });
  if (data.deliveryDate)    allItems.push({ id: '_delivery', name: 'Final Delivery',    dueDate: data.deliveryDate,    completed: isPast(new Date(data.deliveryDate)) && !isToday(new Date(data.deliveryDate)),    completedAt: null, description: null, order: -1, isKey: true });
  allItems.push(...data.milestones);
  allItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // ── Render ───────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center py-10"><SpinnerGap className="w-6 h-6 animate-spin text-brand-primary" /></div>;

  const emptyTextCls = isPortal ? 'text-gray-400' : 'text-[#A3A3A3]';
  const headingCls = isPortal ? 'text-gray-900' : 'text-[#FAFAFA]';
  const lineCls = isPortal ? 'bg-gray-200' : 'bg-[#333]';

  if (allItems.length === 0 && !editable) {
    return (
      <div className={`text-center py-10 ${emptyTextCls}`} data-testid="timeline-empty">
        <CalendarBlank weight="duotone" className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="font-medium">No timeline set yet</p>
        <p className="text-sm mt-1 opacity-70">Your creative will set key dates and milestones soon</p>
      </div>
    );
  }

  return (
    <div data-testid="project-timeline">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarBlank className={`w-5 h-5 ${isPortal ? 'text-brand-primary' : 'text-brand-primary-light'}`} />
          <h3 className={`font-semibold ${headingCls}`}>Project Timeline</h3>
          {allItems.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isPortal ? 'bg-gray-100 text-gray-500' : 'bg-[#333] text-[#A3A3A3]'}`}>
              {data.milestones.filter(m => m.completed).length}/{data.milestones.length} done
            </span>
          )}
        </div>
        {editable && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-primary-light hover:text-brand-primary transition-colors"
            data-testid="add-milestone-btn"
          >
            <Plus weight="bold" className="w-4 h-4" /> Add Milestone
          </button>
        )}
      </div>

      {/* Add Milestone Form */}
      {showAdd && editable && (
        <div className="mb-5 p-4 bg-[#0F0F0F] border border-[#333] rounded-xl space-y-3" data-testid="add-milestone-form">
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Milestone name (e.g., First Look Preview)"
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-sm text-[#FAFAFA] placeholder-[#666] focus:outline-none focus:border-brand-primary"
            data-testid="milestone-name-input"
          />
          <div className="flex gap-3">
            <input
              type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-sm text-[#FAFAFA] focus:outline-none focus:border-brand-primary"
              data-testid="milestone-date-input"
            />
            <input
              type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-sm text-[#FAFAFA] placeholder-[#666] focus:outline-none focus:border-brand-primary"
              data-testid="milestone-desc-input"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAdd(false); setNewName(''); setNewDate(''); setNewDesc(''); }}
              className="px-3 py-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors" data-testid="cancel-milestone-btn">
              Cancel
            </button>
            <button onClick={addMilestone} disabled={saving || !newName.trim() || !newDate}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-all"
              data-testid="save-milestone-btn">
              {saving ? <SpinnerGap className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
            </button>
          </div>
        </div>
      )}

      {/* Empty state for editable with no items */}
      {allItems.length === 0 && editable && !showAdd && (
        <div className="text-center py-8 text-[#A3A3A3]" data-testid="timeline-empty-editable">
          <Flag weight="duotone" className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No milestones yet</p>
          <p className="text-xs mt-1 opacity-70">Add milestones to track project progress</p>
        </div>
      )}

      {/* Timeline */}
      {allItems.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className={`absolute left-[15px] top-4 bottom-4 w-px ${lineCls}`} />

          <div className="space-y-3">
            {allItems.map((item) => {
              const status = statusOf(item.dueDate, item.completed);
              const s = styles[status];
              const isKey = (item as any).isKey;

              return (
                <div key={item.id} className="relative pl-10" data-testid={`milestone-${item.id}`}>
                  {/* Dot */}
                  <div className={`absolute left-0 top-3.5 w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 ${s.dot}`}>
                    {status === 'completed' ? <CheckCircle className={`w-4 h-4 ${s.icon}`} /> :
                     status === 'overdue' ? <Clock className={`w-4 h-4 ${s.icon}`} /> :
                     status === 'today' ? <Clock className={`w-4 h-4 ${s.icon}`} /> :
                     <Circle className={`w-4 h-4 ${s.icon}`} />}
                  </div>

                  {/* Card */}
                  <div className={`p-3 rounded-xl border ${s.card} ${isKey ? 'border-l-4' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-semibold ${isPortal ? 'text-gray-900' : 'text-[#FAFAFA]'}`}>{item.name}</h4>
                          {isKey && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isPortal ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-primary-dark/30 text-brand-primary-light'}`}>
                              Key Date
                            </span>
                          )}
                          {status === 'today' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isPortal ? 'bg-amber-100 text-amber-700' : 'bg-amber-900/30 text-amber-400'}`}>
                              Today
                            </span>
                          )}
                        </div>
                        {item.description && <p className={`text-xs mt-1 ${isPortal ? 'text-gray-500' : 'text-[#A3A3A3]'}`}>{item.description}</p>}
                        <p className={`text-xs mt-1 ${s.text}`}>
                          {status === 'completed' && item.completedAt ? `Completed ${fmtDate(item.completedAt)}` :
                           status === 'completed' ? fmtDate(item.dueDate) :
                           status === 'overdue' ? `Overdue \u00b7 was ${fmtDate(item.dueDate)}` :
                           fmtDate(item.dueDate)}
                        </p>
                      </div>

                      {/* Actions (only for custom milestones when editable) */}
                      {editable && !isKey && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleComplete(item)}
                            disabled={togglingId === item.id}
                            className={`text-[11px] px-2 py-1 rounded-lg font-medium transition-colors ${
                              item.completed
                                ? 'text-[#A3A3A3] hover:bg-[#333]'
                                : 'text-green-400 hover:bg-green-900/20'
                            }`}
                            data-testid={`toggle-milestone-${item.id}`}
                          >
                            {togglingId === item.id ? <SpinnerGap className="w-3 h-3 animate-spin" /> : item.completed ? 'Undo' : 'Done'}
                          </button>
                          <button
                            onClick={() => deleteMilestone(item.id)}
                            className="p-1 text-[#666] hover:text-red-400 transition-colors"
                            data-testid={`delete-milestone-${item.id}`}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
  );
}
