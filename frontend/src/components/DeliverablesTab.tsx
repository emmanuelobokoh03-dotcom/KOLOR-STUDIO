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
  Plus,
  SpinnerGap,
  Trash,
  X,
  FloppyDisk,
  FileImage,
  Palette,
  Printer,
  Wrench,
  Layout,
  Package,
  Clock,
  CheckCircle,
  Truck,
  WarningCircle,
  ArrowRight,
  MapPin,
  CalendarBlank,
  Ruler
} from '@phosphor-icons/react'

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
  DIGITAL_FILES: 'bg-blue-50 text-blue-600 border-blue-200',
  PHYSICAL_ART: 'bg-amber-50 text-amber-700 border-amber-200',
  PRINTS: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  SERVICE: 'bg-purple-100 text-purple-600 border-purple-200',
  WEBSITE: 'bg-cyan-900/40 text-cyan-400 border-cyan-700/40',
  MIXED: 'bg-pink-900/40 text-pink-400 border-pink-700/40',
};

const STATUS_COLORS: Record<DeliverableStatus, string> = {
  PENDING: 'bg-light-100 text-text-secondary border-light-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-200',
  READY: 'bg-amber-50 text-amber-700 border-amber-200',
  DELIVERED: 'bg-green-900/40 text-green-400 border-green-700/40',
  SHIPPED: 'bg-purple-100 text-purple-600 border-purple-200',
};

const STATUS_ICONS: Record<DeliverableStatus, React.ElementType> = {
  PENDING: Clock,
  IN_PROGRESS: SpinnerGap,
  READY: WarningCircle,
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

  const inputClass = "w-full px-3 py-2 bg-light-100 border border-light-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-text-primary placeholder-gray-400 text-sm";

  if (loading) {
    return <div className="flex items-center justify-center py-12"><SpinnerGap className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-4" data-testid="deliverables-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-secondary">{deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''}</div>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-sm rounded-lg hover:bg-brand-primary transition"
          data-testid="add-deliverable-btn"
        >
          <Plus weight="bold" className="w-4 h-4" /> Add Deliverable
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="p-4 bg-light-100 rounded-xl border border-light-200 space-y-3" data-testid="deliverable-form">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">{editingId ? 'Edit' : 'New'} Deliverable</h4>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-text-tertiary hover:text-text-secondary"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Wedding Photo Album" data-testid="deliverable-name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DeliverableType })} className={inputClass} data-testid="deliverable-type">
                {Object.entries(DELIVERABLE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass + ' resize-none'} rows={2} placeholder="Details about this deliverable..." />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} placeholder="Internal notes..." />
            </div>
          </div>

          {/* Conditional: Physical */}
          {(form.type === 'PHYSICAL_ART' || form.type === 'PRINTS') && (
            <div className="grid md:grid-cols-3 gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Dimensions</label>
                <input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} className={inputClass} placeholder="24x36 in" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Material</label>
                <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className={inputClass} placeholder="Oil on canvas" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Weight</label>
                <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputClass} placeholder="2.5 lbs" />
              </div>
            </div>
          )}

          {/* Conditional: Service */}
          {form.type === 'SERVICE' && (
            <div className="grid md:grid-cols-3 gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-purple-600 mb-1">Session Date</label>
                <input type="date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-600 mb-1">Location</label>
                <input value={form.sessionLocation} onChange={(e) => setForm({ ...form, sessionLocation: e.target.value })} className={inputClass} placeholder="Studio A" />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-600 mb-1">Duration (min)</label>
                <input type="number" value={form.sessionDuration} onChange={(e) => setForm({ ...form, sessionDuration: e.target.value })} className={inputClass} placeholder="120" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-1.5 text-sm text-text-secondary hover:text-gray-200">Cancel</button>
            <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-primary text-white text-sm rounded-lg hover:bg-brand-primary disabled:opacity-50" data-testid="deliverable-save">
              {saving ? <SpinnerGap className="w-3.5 h-3.5 animate-spin" /> : <FloppyDisk className="w-3.5 h-3.5" />}
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Deliverables List */}
      {deliverables.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center" data-testid="deliverables-empty-state">
          <div className="text-5xl md:text-6xl mb-5 md:mb-6 opacity-40 select-none">&#x1F381;</div>
          <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-2">Track what you'll deliver</h3>
          <p className="text-sm text-text-secondary max-w-md mb-5 leading-relaxed">
            Add deliverables to show your client exactly what they'll receive and when.
          </p>
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary transition font-medium"
            data-testid="deliverables-empty-cta"
          >
            <Plus weight="bold" className="w-5 h-5" />
            Add Deliverable
          </button>
          <p className="text-xs text-text-tertiary mt-4 max-w-sm">
            <strong>Pro tip:</strong> Update deliverable status to keep clients informed of your progress.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {deliverables.map((d) => {
            const TypeIcon = TYPE_ICONS[d.type] || Package;
            const StatusIcon = STATUS_ICONS[d.status] || Clock;
            const next = NEXT_STATUS[d.status];
            return (
              <div key={d.id} className="p-3 bg-light-100 rounded-xl border border-light-200 hover:border-gray-600 transition group" data-testid={`deliverable-item-${d.id}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${TYPE_COLORS[d.type]}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-primary cursor-pointer hover:text-purple-600" onClick={() => handleEdit(d)}>{d.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[d.status]}`}>
                        <StatusIcon className={`w-3 h-3 ${d.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
                        {DELIVERABLE_STATUS_LABELS[d.status]}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${TYPE_COLORS[d.type]}`}>{DELIVERABLE_TYPE_LABELS[d.type]}</span>
                    </div>
                    {d.description && <p className="text-xs text-text-tertiary mt-1 truncate">{d.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-text-tertiary">
                      {d.dueDate && <span className="flex items-center gap-1"><CalendarBlank className="w-3 h-3" />Due {new Date(d.dueDate).toLocaleDateString()}</span>}
                      {d.dimensions && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{d.dimensions}</span>}
                      {d.sessionLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.sessionLocation}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {next && (
                      <button
                        onClick={() => handleStatusAdvance(d)}
                        disabled={updatingStatus === d.id}
                        className="flex items-center gap-1 px-2 py-1 bg-brand-primary/20 text-purple-600 text-xs rounded-lg hover:bg-brand-primary/30 disabled:opacity-50"
                        data-testid={`deliverable-advance-${d.id}`}
                      >
                        {updatingStatus === d.id ? <SpinnerGap className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                        {next.label}
                      </button>
                    )}
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-text-tertiary hover:text-red-400 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition" data-testid={`deliverable-delete-${d.id}`}>
                      <Trash className="w-3.5 h-3.5" />
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
