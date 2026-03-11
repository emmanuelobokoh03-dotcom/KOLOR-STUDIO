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
  Tray
} from '@phosphor-icons/react'

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
  const token = localStorage.getItem('token')
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
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
      <div className="bg-white rounded-lg p-4 mb-4 border border-light-200">
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
                <div key={e.id} className="flex items-center justify-between p-3 bg-white border border-light-200 rounded-lg">
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
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between z-10">
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

// ─── Main Dashboard ──────────────────────────────────────
export default function SequencesDashboard() {
  const [sequences, setSequences] = useState<SequenceData[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailSeq, setDetailSeq] = useState<SequenceData | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [seqRes, statsRes] = await Promise.all([
        request('/api/sequences/dashboard'),
        request('/api/sequences/dashboard/stats'),
      ])
      setSequences(seqRes.sequences || [])
      setStats(statsRes)
    } catch (err) {
      console.error('Failed to load sequences:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

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

      {/* Custom Sequences — Coming Soon */}
      <div className="mt-10 bg-light-50 border-2 border-dashed border-light-200 rounded-xl p-10 text-center">
        <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <TrendUp className="w-7 h-7 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Custom Sequences</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-5">
          Build your own email workflows with custom triggers, delays, and templates.
        </p>
        <button
          disabled
          className="px-6 py-2.5 bg-light-100 text-text-tertiary border border-light-300 rounded-lg text-sm font-medium cursor-not-allowed"
          data-testid="create-custom-sequence-btn"
        >
          Coming Soon
        </button>
      </div>

      {/* Detail Modal */}
      {detailSeq && (
        <SequenceDetailModal seq={detailSeq} onClose={() => setDetailSeq(null)} />
      )}
    </div>
  )
}
