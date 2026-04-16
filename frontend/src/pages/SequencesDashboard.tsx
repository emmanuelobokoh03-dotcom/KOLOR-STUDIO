import { useState, useEffect, useCallback } from 'react'
import {
  Envelope,
  CaretDown,
  X,
  Play,
  Pause,
  Eye,
  Users,
  Lightning,
  SpinnerGap,
  EnvelopeOpen,
  TrendUp,
  Tray,
  CaretLeft,
  CaretRight,
  Plus,
  EnvelopeSimple,
  Trash,
  PencilSimple
} from '@phosphor-icons/react'
import { sequencesApi } from '../services/api'
import type { CustomSequence, SequenceStepFull, NewStep } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL || ''

interface SequenceStep {
  stepNumber: number
  name: string
  delay: number
  subject: string
  sentCount: number
  openRate: number | null
}

interface SequenceData {
  id: string
  name: string
  type: 'built-in' | 'custom'
  trigger: string
  active: boolean
  steps: SequenceStep[]
  stats: { enrolled: number; completed: number; active: number; averageOpenRate?: number | null }
}

interface Enrollment {
  id: string
  clientName: string
  enrolledAt: string
  currentStep: number
  nextEmailDate: string | null
  completed: boolean
}

interface StatsData {
  totalSequences: number
  activeSequences: number
  emailsSentThisWeek: number
  totalEnrolled: number
}

function request(path: string, opts?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  }).then(r => r.json())
}

// ─── Stats Bar ───────────────────────────────────────────
function StatsBar({ stats, loading }: { stats: StatsData | null; loading: boolean }) {
  const items = stats
    ? [
        { label: 'Total Sequences', value: stats.totalSequences, icon: Tray, color: 'text-blue-600 bg-blue-500/10' },
        { label: 'Active', value: stats.activeSequences, icon: Lightning, color: 'text-emerald-600 bg-emerald-500/10' },
        { label: 'Emails This Week', value: stats.emailsSentThisWeek, icon: EnvelopeOpen, color: 'text-purple-400 bg-purple-500/10' },
        { label: 'Clients Enrolled', value: stats.totalEnrolled, icon: Users, color: 'text-amber-700 bg-amber-500/10' },
      ]
    : []

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="sequence-stats-loading">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-light-50 rounded-xl border border-light-200 p-5 animate-pulse">
            <div className="h-3 bg-light-200 rounded w-1/2 mb-3" />
            <div className="h-7 bg-light-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="sequence-stats">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-light-50 rounded-xl border border-light-200 p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
              <Icon weight="duotone" className="w-4 h-4" />
            </div>
            <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{label}</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Sequence Card ───────────────────────────────────────
function SequenceCard({ seq, onToggle, onViewDetail }: {
  seq: SequenceData
  onToggle: (id: string, active: boolean) => void
  onViewDetail: (seq: SequenceData) => void
}) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    await onToggle(seq.id, !seq.active)
    setToggling(false)
  }

  const maxDelay = Math.max(...seq.steps.map(s => s.delay), 0)

  return (
    <div
      className="bg-light-50 rounded-xl border border-light-200 p-6 hover:border-purple-500/40 transition-all duration-200"
      data-testid={`sequence-card-${seq.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{seq.name}</h3>
          <p className="text-sm text-text-secondary mt-0.5">Trigger: {seq.trigger}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            seq.active
              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
              : 'bg-light-100 text-text-tertiary border border-light-300'
          }`}
          data-testid={`sequence-status-${seq.id}`}
        >
          {seq.active ? 'Active' : 'Paused'}
        </span>
      </div>

      {/* Steps preview */}
      <div className="bg-surface-base rounded-lg p-4 mb-4 border border-light-200">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-2.5">
          {seq.steps.length} emails over {maxDelay} days
        </p>
        <div className="space-y-1.5">
          {seq.steps.map(step => (
            <div key={step.stepNumber} className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-purple-400 font-bold">{step.stepNumber}</span>
              </div>
              <span className="text-text-primary text-xs">
                Day {step.delay}: {step.name}
              </span>
              <span className="ml-auto flex items-center gap-2">
                {step.openRate != null && (
                  <span className="text-[10px] text-amber-700 font-medium">{step.openRate}% open</span>
                )}
                {step.sentCount > 0 && (
                  <span className="text-[10px] text-text-tertiary">{step.sentCount} sent</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Enrolled', value: seq.stats.enrolled, color: 'text-purple-400' },
          { label: 'Completed', value: seq.stats.completed, color: 'text-emerald-600' },
          { label: 'Active', value: seq.stats.active, color: 'text-blue-600' },
          { label: 'Open Rate', value: seq.stats.averageOpenRate != null ? `${seq.stats.averageOpenRate}%` : '—', color: 'text-amber-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetail(seq)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium hover:bg-purple-500/20 transition"
          data-testid={`view-detail-${seq.id}`}
        >
          <Eye className="w-4 h-4" />
          Details
        </button>
        <button
          onClick={handleToggle}
          disabled={toggling || seq.type !== 'built-in' || seq.id === 'quote-followup'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
            seq.active
              ? 'bg-light-100 text-text-secondary border border-light-300 hover:bg-light-200'
              : 'bg-purple-600 text-white hover:bg-purple-500'
          }`}
          data-testid={`toggle-${seq.id}`}
        >
          {toggling ? <SpinnerGap className="w-4 h-4 animate-spin" /> : seq.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {toggling ? '...' : seq.active ? 'Pause' : 'Activate'}
        </button>
      </div>
    </div>
  )
}

// ─── Detail Modal ────────────────────────────────────────
function SequenceDetailModal({ seq, onClose }: { seq: SequenceData; onClose: () => void }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)
  const [previewHtml, setPreviewHtml] = useState<{ subject: string; html: string } | null>(null)

  useEffect(() => {
    request(`/api/sequences/${seq.id}/enrollments`).then(d => {
      setEnrollments(d.enrollments || [])
      setLoadingEnrollments(false)
    }).catch(() => setLoadingEnrollments(false))
  }, [seq.id])

  const handlePreview = async (stepNumber: number) => {
    const data = await request(`/api/sequences/${seq.id}/steps/${stepNumber}/preview`)
    if (data.subject) setPreviewHtml(data)
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" data-testid="sequence-detail-modal">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-light-50 rounded-2xl border border-light-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-light-50 border-b border-light-200 px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{seq.name}</h2>
            <p className="text-sm text-text-secondary">Trigger: {seq.trigger}</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-light-100 rounded-lg transition" data-testid="close-detail-modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sequence Flow */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Sequence Flow</h3>
          <div className="space-y-3">
            {seq.steps.map((step, i) => (
              <div key={step.stepNumber}>
                <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-text-primary">
                        Step {step.stepNumber}: {step.name}
                      </h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Sent: {step.delay === 0 ? 'Immediately' : `${step.delay} days after enrollment`}
                      </p>
                    </div>
                    {step.sentCount > 0 && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-400">{step.sentCount}</p>
                        <p className="text-[10px] text-text-tertiary">Sent</p>
                        {step.openRate != null && (
                          <p className="text-sm font-semibold text-amber-700 mt-1">{step.openRate}% opened</p>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-3">
                    <span className="text-text-tertiary">Subject:</span> {step.subject}
                  </p>
                  <button
                    onClick={() => handlePreview(step.stepNumber)}
                    className="text-sm text-purple-400 font-medium hover:text-purple-300 transition"
                    data-testid={`preview-step-${step.stepNumber}`}
                  >
                    Preview Email →
                  </button>
                </div>
                {i < seq.steps.length - 1 && (
                  <div className="flex justify-center py-1.5">
                    <CaretDown className="w-5 h-5 text-text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enrolled Clients */}
        <div className="px-6 py-5 border-t border-light-200">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Enrolled Clients ({enrollments.length})
          </h3>
          {loadingEnrollments ? (
            <div className="flex justify-center py-8">
              <SpinnerGap className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-text-primary mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">No clients enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-surface-base border border-light-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{e.clientName}</p>
                    <p className="text-xs text-text-secondary">
                      {e.completed
                        ? <span className="text-emerald-600">Completed</span>
                        : `Step ${e.currentStep}${e.nextEmailDate ? ` · Next: ${new Date(e.nextEmailDate).toLocaleDateString()}` : ''}`
                      }
                    </p>
                  </div>
                  <span className="text-xs text-text-tertiary">{new Date(e.enrolledAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Preview Overlay */}
      {previewHtml && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" data-testid="email-preview-overlay">
          <div className="absolute inset-0 bg-black/80" onClick={() => setPreviewHtml(null)} />
          <div className="relative w-full max-w-2xl bg-surface-base rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-base border-b border-gray-200 px-5 py-3 flex items-center justify-between z-10">
              <h3 className="font-semibold text-gray-900 text-sm">{previewHtml.subject}</h3>
              <button onClick={() => setPreviewHtml(null)} className="p-1.5 hover:bg-gray-100 rounded-lg" data-testid="close-email-preview">
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </div>
            <div className="p-6" dangerouslySetInnerHTML={{ __html: previewHtml.html }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Email Log helpers ───────────────────────────────────
interface EmailLogEntry {
  id: string
  emailType: string
  sequenceId: string | null
  stepNumber: number | null
  leadId: string
  clientName: string
  projectTitle: string
  recipientEmail: string
  sentAt: string
  opened: boolean
  openedAt: string | null
  openCount: number
  clickCount: number
}

const formatEmailType = (emailType: string, sequenceId: string | null, stepNumber: number | null): string => {
  if (sequenceId === 'client-onboarding') return `Client Onboarding \u00b7 ${stepNumber}`
  if (sequenceId === 'quote-followup') return `Quote Follow-Up \u00b7 ${stepNumber}`
  return emailType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Main Dashboard ──────────────────────────────────────
export default function SequencesDashboard() {
  const [sequences, setSequences] = useState<SequenceData[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailSeq, setDetailSeq] = useState<SequenceData | null>(null)
  const [activeTab, setActiveTab] = useState<'sequences' | 'log'>('sequences')

  // Custom sequences state
  const [customSequences, setCustomSequences] = useState<CustomSequence[]>([])
  const [loadingCustom, setLoadingCustom] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingSequence, setEditingSequence] = useState<CustomSequence | null>(null)

  // Email log state
  const [emailLog, setEmailLog] = useState<EmailLogEntry[]>([])
  const [emailLogTotal, setEmailLogTotal] = useState(0)
  const [emailLogPages, setEmailLogPages] = useState(1)
  const [logPage, setLogPage] = useState(1)
  const [loadingLog, setLoadingLog] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [seqRes, statsRes, logRes] = await Promise.all([
        request('/api/sequences/dashboard'),
        request('/api/sequences/dashboard/stats'),
        request('/api/sequences/email-log?page=1'),
      ])
      setSequences(seqRes.sequences || [])

      // Compute accurate emailsSentThisWeek from EmailTracking rows
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const logs: Array<{ sentAt: string }> = logRes.logs || []
      const weekCount = logs.filter((l: { sentAt: string }) => new Date(l.sentAt).getTime() > oneWeekAgo).length

      setStats(statsRes ? {
        ...statsRes,
        emailsSentThisWeek: weekCount,
      } : null)
    } catch (err) {
      console.error('Failed to load sequences:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const fetchCustomSequences = useCallback(async () => {
    setLoadingCustom(true)
    const result = await sequencesApi.listCustom()
    if (result.data?.sequences) setCustomSequences(result.data.sequences)
    setLoadingCustom(false)
  }, [])

  useEffect(() => { fetchCustomSequences() }, [fetchCustomSequences])

  const fetchEmailLog = useCallback(async (page: number) => {
    setLoadingLog(true)
    const result = await sequencesApi.getEmailLog(page)
    if (result.data) {
      setEmailLog(result.data.logs)
      setEmailLogTotal(result.data.total)
      setEmailLogPages(result.data.totalPages)
    }
    setLoadingLog(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'log') fetchEmailLog(logPage)
  }, [activeTab, logPage, fetchEmailLog])

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await request(`/api/sequences/dashboard/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      })
      // Refresh data
      await fetchAll()
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  return (
    <div data-testid="sequences-dashboard">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Email Sequences</h1>
        <p className="text-sm text-text-secondary mt-1">Automated email workflows running on autopilot</p>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} loading={loading} />

      {/* Tabs */}
      <div className="flex gap-1 mt-6 mb-6 bg-light-100 rounded-lg p-1 w-fit" data-testid="sequences-tabs">
        <button
          onClick={() => setActiveTab('sequences')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition min-h-[44px] ${
            activeTab === 'sequences' ? 'bg-surface-base text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
          data-testid="tab-sequences"
        >
          Sequences
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition min-h-[44px] ${
            activeTab === 'log' ? 'bg-surface-base text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
          data-testid="tab-send-log"
        >
          Send Log
        </button>
      </div>

      {activeTab === 'sequences' ? (
      <>
      {/* Built-in Sequences */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-text-primary mb-4">Built-in Sequences</h2>
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-light-50 rounded-xl border border-light-200 p-6 animate-pulse h-80" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sequences.filter(s => s.type === 'built-in').map(seq => (
              <SequenceCard key={seq.id} seq={seq} onToggle={handleToggle} onViewDetail={setDetailSeq} />
            ))}
          </div>
        )}
      </div>

      {/* Custom Sequences */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Custom Sequences</h2>
          <button
            onClick={() => { setEditingSequence(null); setShowBuilder(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:brightness-110 transition min-h-[44px]"
            data-testid="new-sequence-btn"
          >
            <Plus weight="bold" className="w-4 h-4" />
            New Sequence
          </button>
        </div>

        {loadingCustom ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="bg-light-50 rounded-xl border border-light-200 p-6 animate-pulse h-48" />)}
          </div>
        ) : customSequences.length === 0 ? (
          <div className="bg-light-50 border-2 border-dashed border-light-200 rounded-xl p-10 text-center">
            <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <EnvelopeSimple weight="duotone" className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-2">No custom sequences yet</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto mb-5">
              Build automated email workflows with custom triggers, delays, and templates.
            </p>
            <button
              onClick={() => { setEditingSequence(null); setShowBuilder(true) }}
              className="px-5 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:brightness-110 transition min-h-[44px]"
              data-testid="create-first-sequence-btn"
            >
              Create your first sequence
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {customSequences.map(seq => (
              <CustomSequenceCard
                key={seq.id}
                seq={seq}
                onEdit={() => { setEditingSequence(seq); setShowBuilder(true) }}
                onDelete={async () => {
                  await sequencesApi.delete(seq.id)
                  fetchCustomSequences()
                }}
                onToggle={async (active) => {
                  await sequencesApi.update(seq.id, { active })
                  fetchCustomSequences()
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sequence Builder Modal */}
      {showBuilder && (
        <SequenceBuilder
          sequence={editingSequence}
          onClose={() => { setShowBuilder(false); setEditingSequence(null) }}
          onSaved={() => { setShowBuilder(false); setEditingSequence(null); fetchCustomSequences() }}
          onCreated={(newSeq) => {
            fetchCustomSequences()
            setEditingSequence(newSeq)
          }}
        />
      )}
      </>
      ) : (
      /* ─── Send Log Tab ─── */
      <div data-testid="send-log-tab">
        {loadingLog ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerGap className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : emailLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              <EnvelopeOpen className="w-8 h-8 text-text-secondary mx-auto" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 6 }}>
              No emails sent yet
            </p>
            <p style={{ fontSize: 13, color: '#6B7280' }}>
              Emails sent automatically via sequences will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-light-50 rounded-xl border border-light-200 overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[140px_1fr_1fr_160px_80px_80px] gap-4 px-5 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider border-b border-light-200">
                <span>Sent</span>
                <span>Client</span>
                <span>Email type</span>
                <span>Recipient</span>
                <span>Opened</span>
                <span>Clicked</span>
              </div>
              {/* Rows */}
              {emailLog.map(log => (
                <div
                  key={log.id}
                  className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr_160px_80px_80px] gap-2 md:gap-4 px-5 py-3.5 border-b border-light-200 last:border-b-0 hover:bg-surface-background transition text-sm"
                  data-testid={`email-log-${log.id}`}
                >
                  <span className="text-text-secondary text-xs" title={new Date(log.sentAt).toLocaleString()}>
                    {timeAgo(log.sentAt)}
                  </span>
                  <span className="text-text-primary font-medium truncate">
                    {log.clientName}
                  </span>
                  <span className="text-text-secondary text-xs">
                    {formatEmailType(log.emailType, log.sequenceId, log.stepNumber)}
                  </span>
                  <span className="text-text-tertiary text-xs truncate" title={log.recipientEmail}>
                    {log.recipientEmail.length > 22 ? log.recipientEmail.slice(0, 20) + '\u2026' : log.recipientEmail}
                  </span>
                  <span>
                    {log.opened ? (
                      <span className="text-emerald-600 font-semibold text-xs">&check; {log.openCount}&times;</span>
                    ) : (
                      <span className="text-text-tertiary text-xs">&mdash;</span>
                    )}
                  </span>
                  <span>
                    {log.clickCount > 0 ? (
                      <span className="text-emerald-600 font-semibold text-xs">{log.clickCount}&times;</span>
                    ) : (
                      <span className="text-text-tertiary text-xs">&mdash;</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {emailLogPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <span className="text-xs text-text-tertiary">{emailLogTotal} emails total</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                    disabled={logPage <= 1}
                    className="p-2 rounded-lg border border-light-200 text-text-secondary hover:bg-light-100 transition disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                    data-testid="log-prev-page"
                  >
                    <CaretLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-text-secondary font-medium">
                    {logPage} / {emailLogPages}
                  </span>
                  <button
                    onClick={() => setLogPage(p => Math.min(emailLogPages, p + 1))}
                    disabled={logPage >= emailLogPages}
                    className="p-2 rounded-lg border border-light-200 text-text-secondary hover:bg-light-100 transition disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                    data-testid="log-next-page"
                  >
                    <CaretRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      )}

      {/* Detail Modal */}
      {detailSeq && (
        <SequenceDetailModal seq={detailSeq} onClose={() => setDetailSeq(null)} />
      )}
    </div>
  )
}


// ─── Custom Sequence Card ────────────────────────────────
function CustomSequenceCard({ seq, onEdit, onDelete, onToggle }: {
  seq: CustomSequence
  onEdit: () => void
  onDelete: () => void
  onToggle: (active: boolean) => void
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const TRIGGER_LABELS: Record<string, string> = {
    QUOTE_SENT: 'When quote is sent',
    CONTRACT_SENT: 'When contract is sent',
    PROJECT_CREATED: 'When project is created',
    QUOTE_VIEWED_NO_ACTION: 'When quote viewed but not accepted',
    LEAD_COLD: 'When lead goes cold',
  }

  return (
    <div className="bg-light-50 rounded-xl border border-light-200 p-6 hover:border-purple-500/40 transition-all" data-testid={`custom-seq-${seq.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary truncate">{seq.name}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{TRIGGER_LABELS[seq.trigger] ?? seq.trigger}</p>
        </div>
        <span className={`ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
          seq.active ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                     : 'bg-light-100 text-text-tertiary border border-light-300'
        }`}>
          {seq.active ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="bg-surface-base rounded-lg px-4 py-3 mb-4 border border-light-200">
        {seq.steps.length === 0 ? (
          <p className="text-xs text-text-tertiary">No steps added yet</p>
        ) : (
          <div className="space-y-1">
            {seq.steps.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[9px] text-purple-400 font-bold flex-shrink-0">
                  {s.order + 1}
                </span>
                <span className="truncate">Day {s.delayDays}: {s.subject || '(no subject)'}</span>
              </div>
            ))}
            {seq.steps.length > 3 && (
              <p className="text-[10px] text-text-tertiary pl-6">+{seq.steps.length - 3} more steps</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 px-3 py-2 bg-purple-500/10 text-purple-500 border border-purple-500/30 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition min-h-[44px]" data-testid={`edit-seq-${seq.id}`}>
          Edit
        </button>
        <button
          onClick={() => onToggle(!seq.active)}
          className="flex-1 px-3 py-2 bg-light-100 text-text-secondary border border-light-300 rounded-lg text-xs font-medium hover:bg-light-200 transition min-h-[44px]"
          data-testid={`toggle-seq-${seq.id}`}
        >
          {seq.active ? 'Pause' : 'Activate'}
        </button>
        {deleteConfirm ? (
          <button
            onClick={async () => { await onDelete(); setDeleteConfirm(false) }}
            className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold transition min-h-[44px]"
            data-testid={`confirm-delete-seq-${seq.id}`}
          >
            Confirm delete
          </button>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-3 py-2 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg text-xs transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            data-testid={`delete-seq-${seq.id}`}
          >
            <Trash className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Sequence Builder Modal ──────────────────────────────
function SequenceBuilder({ sequence, onClose, onSaved, onCreated }: {
  sequence: CustomSequence | null
  onClose: () => void
  onSaved: () => void
  onCreated?: (seq: CustomSequence) => void
}) {
  const isEdit = !!sequence

  const [name, setName] = useState(sequence?.name ?? '')
  const [description, setDescription] = useState(sequence?.description ?? '')
  const [trigger, setTrigger] = useState(sequence?.trigger ?? 'QUOTE_SENT')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [steps, setSteps] = useState<SequenceStepFull[]>(sequence?.steps ?? [])
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [stepDraft, setStepDraft] = useState<Partial<NewStep>>({})

  const TRIGGERS = [
    { value: 'QUOTE_SENT', label: 'Quote sent to client' },
    { value: 'CONTRACT_SENT', label: 'Contract sent to client' },
    { value: 'PROJECT_CREATED', label: 'New project created' },
    { value: 'QUOTE_VIEWED_NO_ACTION', label: 'Quote viewed but not accepted' },
    { value: 'LEAD_COLD', label: 'Lead goes cold (7+ days inactive)' },
  ]

  const handleSaveMetadata = async () => {
    if (!name.trim()) { setError('Sequence name is required'); return }
    setSaving(true)
    setError('')
    try {
      if (isEdit && sequence) {
        const result = await sequencesApi.update(sequence.id, { name, description, trigger })
        if (result.error) { setError(result.message || 'Failed to update'); return }
        onSaved()
      } else {
        const result = await sequencesApi.create({ name, description, trigger, steps: [] })
        if (result.error) { setError(result.message || 'Failed to create'); return }
        if (result.data?.sequence && onCreated) {
          onCreated(result.data.sequence)
        } else {
          onSaved()
        }
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleAddStep = async () => {
    if (!sequence) return
    const newStep: NewStep = {
      subject: '',
      body: '',
      delayDays: steps.length === 0 ? 0 : (steps[steps.length - 1]?.delayDays ?? 0) + 3,
      order: steps.length,
    }
    const result = await sequencesApi.addStep(sequence.id, newStep)
    if (result.data?.step) {
      setSteps(prev => [...prev, result.data!.step])
      setEditingStep(result.data!.step.id)
      setStepDraft({ subject: '', body: '', delayDays: newStep.delayDays })
    }
  }

  const handleSaveStep = async (stepId: string) => {
    if (!sequence) return
    await sequencesApi.updateStep(sequence.id, stepId, stepDraft)
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...stepDraft } as SequenceStepFull : s))
    setEditingStep(null)
    setStepDraft({})
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!sequence) return
    await sequencesApi.deleteStep(sequence.id, stepId)
    setSteps(prev => prev.filter(s => s.id !== stepId))
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" data-testid="sequence-builder-modal">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-light-50 rounded-2xl border border-light-200 shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-light-50 border-b border-light-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {isEdit ? 'Edit Sequence' : 'New Sequence'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {isEdit ? 'Update your email workflow' : 'Build an automated email workflow'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-light-100 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center" data-testid="close-builder">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Sequence details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Sequence name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Post-booking welcome series"
                  maxLength={80}
                  className="w-full px-3 py-2.5 bg-surface-base border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                  data-testid="seq-name-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does this sequence do?"
                  maxLength={200}
                  className="w-full px-3 py-2.5 bg-surface-base border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                  data-testid="seq-desc-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Trigger</label>
                <select
                  value={trigger}
                  onChange={e => setTrigger(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-base border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                  data-testid="seq-trigger-select"
                >
                  {TRIGGERS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-text-tertiary mt-1.5">
                  This sequence will start automatically when this event occurs.
                </p>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 mt-3 font-medium">{error}</p>}

            <button
              onClick={handleSaveMetadata}
              disabled={saving || !name.trim()}
              className="mt-4 px-5 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
              data-testid="save-seq-metadata-btn"
            >
              {saving ? <SpinnerGap className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Save changes' : 'Create sequence'}
            </button>
          </div>

          {isEdit && sequence && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Email steps ({steps.length})</h3>
                <button
                  onClick={handleAddStep}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 text-purple-500 border border-purple-500/30 rounded-lg text-xs font-semibold hover:bg-purple-500/20 transition min-h-[44px]"
                  data-testid="add-step-btn"
                >
                  <Plus weight="bold" className="w-3.5 h-3.5" />
                  Add step
                </button>
              </div>

              {steps.length === 0 ? (
                <div className="bg-surface-base border border-dashed border-border rounded-xl p-8 text-center">
                  <p className="text-sm text-text-secondary mb-3">No steps yet. Add your first email.</p>
                  <button
                    onClick={handleAddStep}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg text-xs font-semibold hover:brightness-110 transition min-h-[44px]"
                    data-testid="add-first-step-btn"
                  >
                    Add first email
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="bg-surface-base border border-border rounded-xl overflow-hidden" data-testid={`step-${step.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-purple-400 font-bold">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">
                            {step.subject || '(no subject)'}
                          </p>
                          <p className="text-[10px] text-text-tertiary">Send on day {step.delayDays}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingStep(step.id)
                              setStepDraft({ subject: step.subject, body: step.body, delayDays: step.delayDays })
                            }}
                            className="p-1.5 text-text-tertiary hover:text-purple-500 hover:bg-purple-500/10 rounded-md transition"
                            data-testid={`edit-step-${step.id}`}
                          >
                            <PencilSimple className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="p-1.5 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-md transition"
                            data-testid={`delete-step-${step.id}`}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {editingStep === step.id && (
                        <div className="px-4 py-4 space-y-3 bg-surface-base">
                          <div>
                            <label className="block text-[11px] font-semibold text-text-secondary mb-1">Send on day</label>
                            <input
                              type="number"
                              min={0}
                              max={365}
                              value={stepDraft.delayDays ?? step.delayDays}
                              onChange={e => setStepDraft(d => ({ ...d, delayDays: parseInt(e.target.value) || 0 }))}
                              className="w-24 px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                              data-testid={`step-delay-${step.id}`}
                            />
                            <span className="ml-2 text-xs text-text-tertiary">days after trigger</span>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-text-secondary mb-1">Subject line</label>
                            <input
                              type="text"
                              value={stepDraft.subject ?? step.subject}
                              onChange={e => setStepDraft(d => ({ ...d, subject: e.target.value }))}
                              placeholder="Email subject line..."
                              maxLength={150}
                              className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-primary"
                              data-testid={`step-subject-${step.id}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-text-secondary mb-1">Email body</label>
                            <textarea
                              value={stepDraft.body ?? step.body}
                              onChange={e => setStepDraft(d => ({ ...d, body: e.target.value }))}
                              placeholder="Write your email content here. Use {clientName} and {studioName} as placeholders."
                              rows={6}
                              maxLength={5000}
                              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-primary resize-y"
                              data-testid={`step-body-${step.id}`}
                            />
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-text-tertiary">
                                Available placeholders: {'{clientName}'}, {'{studioName}'}, {'{projectTitle}'}
                              </p>
                              <span className={`text-[10px] font-mono ${
                                (stepDraft.body ?? step.body).length > 4500
                                  ? 'text-red-500'
                                  : (stepDraft.body ?? step.body).length > 4000
                                  ? 'text-amber-600'
                                  : 'text-text-tertiary'
                              }`}>
                                {(stepDraft.body ?? step.body).length} / 5000
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleSaveStep(step.id)}
                              className="px-4 py-2 bg-brand-primary text-white rounded-lg text-xs font-semibold hover:brightness-110 transition min-h-[44px]"
                              data-testid={`save-step-${step.id}`}
                            >
                              Save step
                            </button>
                            <button
                              onClick={() => { setEditingStep(null); setStepDraft({}) }}
                              className="px-4 py-2 bg-light-100 text-text-secondary rounded-lg text-xs font-medium hover:bg-light-200 transition min-h-[44px]"
                              data-testid={`cancel-step-${step.id}`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isEdit && name.trim() && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-text-secondary">
                Create the sequence to start adding email steps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
