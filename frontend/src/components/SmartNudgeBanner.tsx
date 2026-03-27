import { useState } from 'react'
import { Clock, X, ArrowRight } from '@phosphor-icons/react'
import { Lead } from '../services/api'

interface SmartNudgeBannerProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

export function SmartNudgeBanner({ leads, onLeadClick }: SmartNudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const staleLeads = leads.filter(
    l => !['BOOKED', 'LOST'].includes(l.status) && new Date(l.updatedAt).getTime() < sevenDaysAgo
  )

  if (staleLeads.length === 0) return null

  const topStale = staleLeads.slice(0, 3)
  const daysStale = (lead: Lead) => Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div
      className="mb-4 md:mb-6 rounded-xl border border-amber-200/80 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.02) 100%)' }}
      data-testid="smart-nudge-banner"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Clock weight="duotone" className="w-4 h-4 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-text-primary">
              {staleLeads.length} lead{staleLeads.length > 1 ? 's' : ''} need{staleLeads.length === 1 ? 's' : ''} attention
            </h3>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-text-tertiary hover:text-text-secondary transition-colors flex-shrink-0"
              data-testid="dismiss-nudge-banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            These leads haven't been updated in over a week. A quick follow-up could keep them warm.
          </p>
          <div className="flex flex-wrap gap-2">
            {topStale.map(lead => (
              <button
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-amber-200/60 text-text-primary hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-150 group"
                data-testid={`nudge-lead-${lead.id}`}
              >
                <span className="truncate max-w-[120px]">{lead.clientName}</span>
                <span className="text-text-tertiary">·</span>
                <span className="text-amber-600 tabular-nums">{daysStale(lead)}d</span>
                <ArrowRight weight="bold" className="w-3 h-3 text-text-tertiary group-hover:text-purple-500 transition-colors" />
              </button>
            ))}
            {staleLeads.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-1.5 text-[11px] text-text-tertiary">
                +{staleLeads.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
