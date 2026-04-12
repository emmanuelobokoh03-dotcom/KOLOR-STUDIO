import { Lead } from '../services/api'
import { CaretRight } from '@phosphor-icons/react'

type AttentionReason = 'overdue_quote' | 'stale_contact' | 'awaiting_contract' | 'no_response'

interface NeedsAttentionSectionProps {
  items: { lead: Lead; reason: AttentionReason }[]
  lang: { quote: string; contract: string; lead: string; leads: string }
  currencySymbol?: string
  onLeadClick: (lead: Lead) => void
}

const REASON_CONFIG: Record<AttentionReason, {
  label: (lang: NeedsAttentionSectionProps['lang']) => string
  badgeBg: string
  badgeText: string
}> = {
  overdue_quote: {
    label: (lang) => `${lang.quote} going cold`,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  no_response: {
    label: (lang) => `No response to ${lang.quote.toLowerCase()}`,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  awaiting_contract: {
    label: (lang) => `${lang.contract} not sent`,
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
  },
  stale_contact: {
    label: () => 'No follow-up',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
  },
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export default function NeedsAttentionSection({ items, lang, onLeadClick }: NeedsAttentionSectionProps) {
  if (items.length === 0) return null

  return (
    <div
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 md:mb-6"
      data-testid="needs-attention-section"
    >
      <div
        className="mb-3"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B45309' }}
      >
        Needs attention · {items.length} {items.length === 1 ? 'item' : 'items'}
      </div>

      <div className="space-y-0">
        {items.map(({ lead, reason }) => {
          const config = REASON_CONFIG[reason]
          return (
            <button
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className="flex items-center gap-3 py-2.5 border-b border-amber-100 last:border-0 w-full text-left hover:bg-amber-100/50 rounded-lg transition-colors group min-h-[44px]"
              data-testid={`attention-item-${lead.id}`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-amber-200/60 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-amber-800">
                  {(lead.clientName || '?').charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">{lead.clientName}</span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(lead.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {lead.projectTitle && (
                    <span className="text-xs text-gray-500 truncate">{lead.projectTitle}</span>
                  )}
                </div>
              </div>

              {/* Reason badge */}
              <span className={`${config.badgeBg} ${config.badgeText} text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap`}>
                {config.label(lang)}
              </span>

              <CaretRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
