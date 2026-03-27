import {
  FileText,
  Clock,
  CalendarBlank,
  UserPlus,
  Lightning,
  CaretRight,
} from '@phosphor-icons/react'
import { Lead } from '../services/api'

interface QuickActionsProps {
  leads: Lead[]
  onSendQuote: (lead: Lead | null) => void
  onFollowUpStale: (staleLeads: Lead[]) => void
  onCheckSchedule: () => void
  onAddLead: () => void
}

const TERMINAL_STATUSES = ['BOOKED', 'LOST']

function isStaleLead(lead: Lead): boolean {
  if (TERMINAL_STATUSES.includes(lead.status)) return false
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return new Date(lead.updatedAt).getTime() < sevenDaysAgo
}

function isToday(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}

export function QuickActions({
  leads,
  onSendQuote,
  onFollowUpStale,
  onCheckSchedule,
  onAddLead,
}: QuickActionsProps) {
  // Action 1 — lead with no quote yet (INQUIRY-like statuses)
  const noQuoteLead = leads.find(
    l => ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED'].includes(l.status) && !(l.quotesCount && l.quotesCount > 0)
  ) || null

  // Action 2 — stale leads
  const staleLeads = leads.filter(isStaleLead)
  const staleCount = staleLeads.length

  // Action 3 — today's events (eventDate matching today)
  const todayCount = leads.filter(l => isToday(l.eventDate)).length

  const actions = [
    {
      key: 'send-quote',
      icon: FileText,
      label: 'Send a quote',
      sub: noQuoteLead ? 'To a lead with no quote yet' : 'Create a new quote',
      dot: null,
      onClick: () => onSendQuote(noQuoteLead),
    },
    {
      key: 'follow-up',
      icon: Clock,
      label: 'Follow up on stale leads',
      sub: staleCount > 0
        ? `${staleCount} lead${staleCount > 1 ? 's' : ''} with no activity in 7+ days`
        : 'All leads are up to date',
      dot: staleCount > 0 ? '#E8891A' : null,
      onClick: () => onFollowUpStale(staleLeads),
    },
    {
      key: 'schedule',
      icon: CalendarBlank,
      label: "Check today's schedule",
      sub: todayCount > 0
        ? `${todayCount} event${todayCount > 1 ? 's' : ''} today`
        : 'Nothing scheduled today',
      dot: todayCount > 0 ? '#10B981' : null,
      onClick: onCheckSchedule,
    },
    {
      key: 'add-lead',
      icon: UserPlus,
      label: 'Add a lead',
      sub: 'Start tracking a new client',
      dot: null,
      onClick: onAddLead,
    },
  ]

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--surface-base)', border: '0.5px solid var(--border)' }}
      data-testid="quick-actions-panel"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3.5"
        style={{ borderBottom: '0.5px solid var(--border)' }}
      >
        <Lightning weight="duotone" className="w-3.5 h-3.5" style={{ color: '#6C2EDB' }} />
        <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
          Quick actions
        </span>
      </div>

      {/* Action list */}
      {actions.map((a, i) => {
        const Icon = a.icon
        const isLast = i === actions.length - 1
        return (
          <button
            key={a.key}
            onClick={a.onClick}
            className="flex items-center w-full text-left transition-colors duration-100"
            style={{
              padding: '11px 16px',
              borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
              cursor: 'pointer',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-background)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            data-testid={`quick-action-${a.key}`}
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(108,46,219,0.08)',
              }}
            >
              <Icon weight="duotone" className="w-3.5 h-3.5" style={{ color: '#6C2EDB' }} />
            </div>

            {/* Label + Sub */}
            <div className="flex-1 min-w-0" style={{ paddingLeft: 10 }}>
              <span
                className="block text-xs font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {a.label}
              </span>
              <span
                className="flex items-center gap-1 mt-px"
                style={{ fontSize: 10, color: 'var(--text-secondary)' }}
              >
                {a.dot && (
                  <span
                    className="inline-block flex-shrink-0 rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      background: a.dot,
                      marginRight: 4,
                    }}
                    data-testid={`quick-action-dot-${a.key}`}
                  />
                )}
                <span className="truncate">{a.sub}</span>
              </span>
            </div>

            {/* Chevron */}
            <CaretRight
              weight="bold"
              className="w-3 h-3 flex-shrink-0 ml-2"
              style={{ color: 'var(--text-secondary)', opacity: 0.4 }}
            />
          </button>
        )
      })}
    </div>
  )
}
