import { useState, useEffect } from 'react'
import {
  Deliverable,
  DeliverableType,
  DeliverableStatus,
  DELIVERABLE_TYPE_LABELS,
  DELIVERABLE_STATUS_LABELS,
  deliverablesApi,
} from '../services/api'
import {
  Plus, Loader2, Trash2, X, Save,
  FileImage, Palette, Printer, Wrench, Layout, Package,
  Clock, CheckCircle, Truck, AlertCircle, ArrowRight, MapPin, Calendar, Ruler
} from 'lucide-react'

interface DeliverablesTabProps {
  leadId: string;
}

const TYPE_ICONS: Record<DeliverableType, React.ElementType> = {
  DIGITAL_FILES: FileImage,
  PHYSICAL_ART: Palette,
  PRINTS: Printer,
  SERVICE: Wrench,
  WEBSITE: Layout,
  MIXED: Package,
};

const TYPE_COLORS: Record<DeliverableType, string> = {
  DIGITAL_FILES: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
  PHYSICAL_ART: 'bg-amber-900/40 text-amber-400 border-amber-700/40',
  PRINTS: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  SERVICE: 'bg-violet-900/40 text-violet-400 border-violet-700/40',
  WEBSITE: 'bg-cyan-900/40 text-cyan-400 border-cyan-700/40',
  MIXED: 'bg-pink-900/40 text-pink-400 border-pink-700/40',
};

const STATUS_COLORS: Record<DeliverableStatus, string> = {
  PENDING: 'bg-gray-800/60 text-gray-400 border-gray-700/40',
  IN_PROGRESS: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
  READY: 'bg-amber-900/40 text-amber-400 border-amber-700/40',
  DELIVERED: 'bg-green-900/40 text-green-400 border-green-700/40',
  SHIPPED: 'bg-purple-900/40 text-purple-400 border-purple-700/40',
};

const STATUS_ICONS: Record<DeliverableStatus, React.ElementType> = {
  PENDING: Clock,
  IN_PROGRESS: Loader2,
  READY: AlertCircle,
  DELIVERED: CheckCircle,
  SHIPPED: Truck,
};

const NEXT_STATUS: Partial<Record<DeliverableStatus, { status: DeliverableStatus; label: string }>> = {
  PENDING: { status: 'IN_PROGRESS', label: 'Start Work' },
  IN_PROGRESS: { status: 'READY', label: 'Mark Ready' },
  READY: { status: 'DELIVERED', label: 'Mark Delivered' },
};

interface DeliverableForm {
  name: string;
  type: DeliverableType;
  description: string;
  dimensions: string;
  material: string;
  weight: string;
  sessionDate: string;
  sessionLocation: string;
  sessionDuration: string;
  dueDate: string;
  notes: string;
}

const emptyForm: DeliverableForm = {
  name: '', type: 'DIGITAL_FILES', description: '', dimensions: '', material: '',
  weight: '', sessionDate: '', sessionLocation: '', sessionDuration: '', dueDate: '', notes: '',
};

export default function DeliverablesTab({ leadId }: DeliverablesTabProps) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeliverableForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchDeliverables = async () => {
    const result = await deliverablesApi.getForLead(leadId);
    if (result.data) setDeliverables(result.data.deliverables);
    setLoading(false);
  };

  useEffect(() => { fetchDeliverables(); }, [leadId]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: any = {
      name: form.name, type: form.type, description: form.description || undefined,
      notes: form.notes || undefined, dueDate: form.dueDate || undefined,
    };
    if (form.type === 'PHYSICAL_ART' || form.type === 'PRINTS') {
      payload.dimensions = form.dimensions || undefined;
      payload.material = form.material || undefined;
      payload.weight = form.weight || undefined;
    }
    if (form.type === 'SERVICE') {
      payload.sessionDate = form.sessionDate || undefined;
      payload.sessionLocation = form.sessionLocation || undefined;
      payload.sessionDuration = form.sessionDuration || undefined;
    }

    if (editingId) {
      await deliverablesApi.update(editingId, payload);
    } else {
      await deliverablesApi.create(leadId, payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchDeliverables();
  };

  const handleEdit = (d: Deliverable) => {
    setForm({
      name: d.name, type: d.type, description: d.description || '',
      dimensions: d.dimensions || '', material: d.material || '', weight: d.weight || '',
      sessionDate: d.sessionDate ? d.sessionDate.slice(0, 10) : '',
      sessionLocation: d.sessionLocation || '',
      sessionDuration: d.sessionDuration?.toString() || '',
      dueDate: d.dueDate ? d.dueDate.slice(0, 10) : '',
      notes: d.notes || '',
    });
    setEditingId(d.id);
    setShowForm(true);
  };

  const handleStatusAdvance = async (d: Deliverable) => {
    const next = NEXT_STATUS[d.status];
    if (!next) return;
    setUpdatingStatus(d.id);
    await deliverablesApi.updateStatus(d.id, next.status);
    setUpdatingStatus(null);
    fetchDeliverables();
  };

  const handleDelete = async (id: string) => {
    await deliverablesApi.delete(id);
    fetchDeliverables();
  };

  const inputClass = "w-full px-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-gray-500 text-sm";

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>;
  }

  return (
    <div className="space-y-4" data-testid="deliverables-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">{deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''}</div>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-500 transition"
          data-testid="add-deliverable-btn"
        >
          <Plus className="w-4 h-4" /> Add Deliverable
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="p-4 bg-dark-bg-secondary rounded-xl border border-dark-border space-y-3" data-testid="deliverable-form">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">{editingId ? 'Edit' : 'New'} Deliverable</h4>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Wedding Photo Album" data-testid="deliverable-name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DeliverableType })} className={inputClass} data-testid="deliverable-type">
                {Object.entries(DELIVERABLE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass + ' resize-none'} rows={2} placeholder="Details about this deliverable..." />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} placeholder="Internal notes..." />
            </div>
          </div>

          {/* Conditional: Physical */}
          {(form.type === 'PHYSICAL_ART' || form.type === 'PRINTS') && (
            <div className="grid md:grid-cols-3 gap-3 p-3 bg-amber-900/10 border border-amber-800/20 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-amber-400 mb-1">Dimensions</label>
                <input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} className={inputClass} placeholder="24x36 in" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-400 mb-1">Material</label>
                <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className={inputClass} placeholder="Oil on canvas" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-400 mb-1">Weight</label>
                <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputClass} placeholder="2.5 lbs" />
              </div>
            </div>
          )}

          {/* Conditional: Service */}
          {form.type === 'SERVICE' && (
            <div className="grid md:grid-cols-3 gap-3 p-3 bg-violet-900/10 border border-violet-800/20 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-violet-400 mb-1">Session Date</label>
                <input type="date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-violet-400 mb-1">Location</label>
                <input value={form.sessionLocation} onChange={(e) => setForm({ ...form, sessionLocation: e.target.value })} className={inputClass} placeholder="Studio A" />
              </div>
              <div>
                <label className="block text-xs font-medium text-violet-400 mb-1">Duration (min)</label>
                <input type="number" value={form.sessionDuration} onChange={(e) => setForm({ ...form, sessionDuration: e.target.value })} className={inputClass} placeholder="120" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
            <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-500 disabled:opacity-50" data-testid="deliverable-save">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Deliverables List */}
      {deliverables.length === 0 && !showForm ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No deliverables yet</p>
          <p className="text-xs mt-1">Add deliverables to track what you're delivering</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deliverables.map((d) => {
            const TypeIcon = TYPE_ICONS[d.type] || Package;
            const StatusIcon = STATUS_ICONS[d.status] || Clock;
            const next = NEXT_STATUS[d.status];
            return (
              <div key={d.id} className="p-3 bg-dark-bg-secondary rounded-xl border border-dark-border hover:border-gray-600 transition group" data-testid={`deliverable-item-${d.id}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${TYPE_COLORS[d.type]}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white cursor-pointer hover:text-violet-400" onClick={() => handleEdit(d)}>{d.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[d.status]}`}>
                        <StatusIcon className={`w-3 h-3 ${d.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
                        {DELIVERABLE_STATUS_LABELS[d.status]}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${TYPE_COLORS[d.type]}`}>{DELIVERABLE_TYPE_LABELS[d.type]}</span>
                    </div>
                    {d.description && <p className="text-xs text-gray-500 mt-1 truncate">{d.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      {d.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {new Date(d.dueDate).toLocaleDateString()}</span>}
                      {d.dimensions && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{d.dimensions}</span>}
                      {d.sessionLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.sessionLocation}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {next && (
                      <button
                        onClick={() => handleStatusAdvance(d)}
                        disabled={updatingStatus === d.id}
                        className="flex items-center gap-1 px-2 py-1 bg-violet-600/20 text-violet-400 text-xs rounded-lg hover:bg-violet-600/30 disabled:opacity-50"
                        data-testid={`deliverable-advance-${d.id}`}
                      >
                        {updatingStatus === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                        {next.label}
                      </button>
                    )}
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-900/20" data-testid={`deliverable-delete-${d.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
