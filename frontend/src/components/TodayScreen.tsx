import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { UserPlus } from '@phosphor-icons/react/dist/csr/UserPlus'
import { getIndustryLanguage, IndustryType } from '../utils/industryLanguage'
import { getLeadStatusPillStyle } from '../utils/statusColors'

interface AttentionItem {
  id: string
  type: string
  priority: number
  clientName: string
  leadId: string
  label: string
  sublabel: string
  actionLabel: string
  actionRoute: string
  daysOverdue?: number
}

interface LeadSummary {
  id: string
  clientName: string
  projectType: string
  status: string
  estimatedValue?: number
  updatedAt: string
  keyDate?: string
  eventDate?: string
}

interface TodayData {
  attention: AttentionItem[]
  inProgress: LeadSummary[]
  generatedAt: string
}

interface TodayScreenProps {
  userIndustry?: IndustryType
  currencySymbol?: string
  onLeadClick: (leadId: string, tab?: string) => void
  onAddLead: () => void
  onShareForm?: () => void
  greeting?: string
}

const URGENCY_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  new_inquiry:       { bg: 'rgba(108,46,219,0.08)', color: '#6C2EDB', dot: '#6C2EDB' },
  contract_unsigned: { bg: 'rgba(245,158,11,0.10)', color: '#92400E', dot: '#D97706' },
  quote_expiring:    { bg: 'rgba(245,158,11,0.10)', color: '#92400E', dot: '#D97706' },
  quote_viewed:      { bg: 'rgba(59,130,246,0.08)', color: '#1E40AF', dot: '#3B82F6' },
  stale_lead:        { bg: 'rgba(107,114,128,0.08)', color: '#374151', dot: '#9CA3AF' },
}

export default function TodayScreen({
  userIndustry,
  currencySymbol = '$',
  onLeadClick,
  onAddLead,
  greeting,
}: TodayScreenProps) {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const lang = getIndustryLanguage(userIndustry)

  useEffect(() => {
    const fetchToday = async () => {
      setLoading(true)
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.REACT_APP_BACKEND_URL || ''
        const res = await fetch(`${apiUrl}/api/today`, { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Today screen fetch error:', err)
      }
      setLoading(false)
    }
    fetchToday()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 py-4" data-testid="today-loading">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-light-200 p-4">
            <div className="h-3.5 w-48 ks-shimmer rounded mb-2" />
            <div className="h-3 w-32 ks-shimmer rounded" />
          </div>
        ))}
      </div>
    )
  }

  const hasAttention = data && data.attention.length > 0
  const hasInProgress = data && data.inProgress.length > 0

  return (
    <div className="space-y-6" data-testid="today-screen">
      {greeting && (
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">{greeting}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}

      {hasAttention && (
        <section data-testid="attention-section">
          <div className="flex items-center gap-2 mb-3">
            <Lightning weight="fill" className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-secondary">
              Needs attention
            </h2>
          </div>
          <div className="space-y-2">
            {data!.attention.map(item => {
              const uc = URGENCY_COLORS[item.type] || URGENCY_COLORS.stale_lead
              return (
                <div
                  key={item.id}
                  className="rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:brightness-95 transition-all active:scale-[0.99]"
                  style={{ background: uc.bg, border: `0.5px solid ${uc.dot}30` }}
                  onClick={() => onLeadClick(item.leadId, item.actionRoute)}
                  data-testid={`attention-item-${item.id}`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: uc.dot }} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{item.label}</p>
                    <p className="text-[10px] text-text-secondary mt-0.5 truncate">{item.sublabel}</p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 flex items-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.7)', color: uc.color }}
                  >
                    {item.actionLabel}
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {hasInProgress && (
        <section data-testid="in-progress-section">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-secondary mb-3">
            In progress ({data!.inProgress.length})
          </h2>
          <div className="space-y-1.5">
            {data!.inProgress.map(lead => {
              const ps = getLeadStatusPillStyle(lead.status)
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-xl hover:bg-[var(--surface-background)] transition-colors cursor-pointer active:scale-[0.99]"
                  style={{ border: '0.5px solid var(--border)' }}
                  onClick={() => onLeadClick(lead.id)}
                  data-testid={`in-progress-${lead.id}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)' }}
                      aria-hidden="true"
                    >
                      {lead.clientName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{lead.clientName}</p>
                      <p className="text-[10px] text-text-secondary truncate">
                        {lead.projectType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || lang.lead}
                        {lead.estimatedValue ? ` · ${currencySymbol}${lead.estimatedValue.toLocaleString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                    style={{ background: ps.background, color: ps.color }}
                  >
                    {ps.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!hasAttention && !hasInProgress && (
        <div className="text-center py-12" data-testid="today-empty">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
            <Lightning weight="fill" className="w-5 h-5 text-purple-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">All clear</p>
          <p className="text-xs text-text-secondary mb-4">No actions needed right now. Add a new {lang.client.toLowerCase()} to get started.</p>
          <button
            onClick={onAddLead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: '#6C2EDB' }}
            data-testid="today-add-client-btn"
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            Add {lang.client}
          </button>
        </div>
      )}
      {/* Calendar & Booking shortcut */}
      <button
        onClick={() => navigate('/calendar')}
        className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors"
        style={{ border: '0.5px solid var(--border)', background: 'var(--surface-background)' }}
        data-testid="today-calendar-link"
      >
        <div className="flex items-center gap-2.5">
          <CalendarBlank weight="duotone" className="w-4 h-4 text-purple-500" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-text-primary text-left">Calendar & Booking</p>
            <p className="text-[10px] text-text-secondary text-left">Schedule sessions and manage bookings</p>
          </div>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" aria-hidden="true" />
      </button>

    </div>
  )
}
