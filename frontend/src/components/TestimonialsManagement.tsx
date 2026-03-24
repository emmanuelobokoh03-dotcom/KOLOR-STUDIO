import { useState, useEffect } from 'react'
import {
  Star as StarIcon,
  Check,
  X,
  Sparkle,
  ChatText,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Clock,
  SpinnerGap,
  PaperPlaneTilt
} from '@phosphor-icons/react'

interface Testimonial {
  id: string
  clientName: string
  clientEmail: string | null
  rating: number
  content: string
  recommend: boolean
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  featured: boolean
  requestedAt: string | null
  submittedAt: string | null
  approvedAt: string | null
  publicToken: string
  lead: { clientName: string; projectTitle: string } | null
}

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

export default function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('ALL')
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, avgRating: 0 })

  const fetchTestimonials = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || ''
      const opts = { credentials: 'include' as RequestCredentials }
      const [tesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/testimonials`, opts),
        fetch(`${API_URL}/api/testimonials/stats`, opts)
      ])
      if (tesRes.ok) { const d = await tesRes.json(); setTestimonials(d.testimonials) }
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d) }
    } catch (err) { console.error('Failed to fetch testimonials:', err) }
    setLoading(false)
  }

  useEffect(() => { fetchTestimonials() }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'feature') => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || ''
      await fetch(`${API_URL}/api/testimonials/${id}/${action}`, {
        method: 'PATCH',
        credentials: 'include',
      })
      fetchTestimonials()
    } catch (err) { console.error(`Failed to ${action}:`, err) }
  }

  const filtered = testimonials.filter(t => {
    if (filter === 'ALL') return true
    if (filter === 'PENDING') return t.status === 'PENDING' && t.submittedAt
    return t.status === filter
  })

  const pendingCount = testimonials.filter(t => t.status === 'PENDING' && t.submittedAt).length

  return (
    <div className="space-y-5" data-testid="testimonials-management">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-base rounded-xl p-3 border border-light-200">
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Total</p>
          <p className="text-xl font-bold text-text-primary" data-testid="testimonials-total">{stats.total}</p>
        </div>
        <div className="bg-surface-base rounded-xl p-3 border border-light-200">
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Pending Review</p>
          <p className="text-xl font-bold text-amber-700" data-testid="testimonials-pending">{stats.pending}</p>
        </div>
        <div className="bg-surface-base rounded-xl p-3 border border-light-200">
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Published</p>
          <p className="text-xl font-bold text-emerald-600" data-testid="testimonials-approved">{stats.approved}</p>
        </div>
        <div className="bg-surface-base rounded-xl p-3 border border-light-200">
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Avg Rating</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-bold text-text-primary" data-testid="testimonials-rating">{stats.avgRating ? stats.avgRating.toFixed(1) : '—'}</p>
            {stats.avgRating > 0 && <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-surface-base rounded-lg border border-light-200">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              filter === tab ? 'bg-light-50 text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            data-testid={`filter-${tab.toLowerCase()}`}
          >
            {tab === 'ALL' ? 'All' : tab === 'PENDING' ? `Pending${pendingCount ? ` (${pendingCount})` : ''}` : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Testimonials List */}
      {loading ? (
        <div className="text-center py-12 text-text-tertiary"><SpinnerGap className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ChatText weight="duotone" className="w-10 h-10 text-text-primary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            {filter === 'ALL' ? 'No testimonials yet. Request one from a completed project!' : `No ${filter.toLowerCase()} testimonials.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div
              key={t.id}
              className={`bg-surface-base rounded-xl p-4 border transition-colors ${
                t.featured ? 'border-brand-primary/30' : 'border-light-200'
              }`}
              data-testid={`testimonial-${t.id}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary">{t.clientName}</span>
                    {t.featured && (
                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary">
                        Featured
                      </span>
                    )}
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${
                      t.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                      : t.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : t.submittedAt ? 'bg-amber-500/20 text-amber-700 border-amber-500/30'
                      : 'bg-light-200 text-text-secondary border-light-300'
                    }`}>
                      {!t.submittedAt && t.status === 'PENDING' ? 'Awaiting' : t.status}
                    </span>
                  </div>
                  {t.lead && <p className="text-xs text-text-tertiary">{t.lead.projectTitle}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {t.submittedAt && t.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(t.id, 'approve')}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                        title="Approve"
                        data-testid={`approve-${t.id}`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAction(t.id, 'reject')}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Reject"
                        data-testid={`reject-${t.id}`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {t.status === 'APPROVED' && (
                    <button
                      onClick={() => handleAction(t.id, 'feature')}
                      className={`p-1.5 rounded-lg transition-colors ${t.featured ? 'bg-brand-primary/20 text-brand-primary' : 'bg-light-100 text-text-tertiary hover:text-text-primary'}`}
                      title={t.featured ? 'Unfeature' : 'Feature'}
                      data-testid={`feature-${t.id}`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Rating + Content (only if submitted) */}
              {t.submittedAt ? (
                <>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <StarIcon key={s} className="w-3.5 h-3.5" fill={s <= t.rating ? '#FBBF24' : 'none'} stroke={s <= t.rating ? '#FBBF24' : '#555'} strokeWidth={1.5} />
                    ))}
                    <span className="text-xs text-text-secondary ml-1">{t.rating}/5</span>
                  </div>
                  <p className="text-sm text-text-secondary italic leading-relaxed">"{t.content}"</p>
                  {t.recommend && <p className="text-[10px] text-emerald-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Would recommend</p>}
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Requested {t.requestedAt ? new Date(t.requestedAt).toLocaleDateString() : 'recently'} — waiting for client response</span>
                </div>
              )}

              {/* Copy Link (for pending requests) */}
              {!t.submittedAt && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/testimonial/${t.publicToken}`
                    navigator.clipboard.writeText(url)
                  }}
                  className="mt-2 text-xs text-brand-primary hover:text-purple-600 transition-colors flex items-center gap-1"
                  data-testid={`copy-link-${t.id}`}
                >
                  <PaperPlaneTilt className="w-3 h-3" /> Copy submission link
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
