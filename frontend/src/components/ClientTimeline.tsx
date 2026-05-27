import { useState, useEffect } from 'react'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Circle } from '@phosphor-icons/react/dist/csr/Circle'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import KolorSpinner from './KolorSpinner'
import { getIndustryLanguage, IndustryType } from '../utils/industryLanguage'

interface TimelineEvent {
  id: string
  type: string
  date: string | null
  status: 'done' | 'active' | 'pending'
  label: string
  sublabel?: string
  actionLabel?: string
  actionRoute?: string
}

interface ClientTimelineProps {
  leadId: string
  userIndustry?: IndustryType
  onTabChange?: (tab: string) => void
  currencySymbol?: string
}

export default function ClientTimeline({ leadId, userIndustry, onTabChange }: ClientTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _lang = getIndustryLanguage(userIndustry)

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true)
      setError(null)
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.REACT_APP_BACKEND_URL || ''
        const res = await fetch(
          `${apiUrl}/api/leads/${leadId}/timeline`,
          { credentials: 'include' }
        )
        if (!res.ok) throw new Error('Failed to load timeline')
        const data = await res.json()
        setEvents(data.events || [])
      } catch (_err) {
        setError('Could not load project timeline')
      }
      setLoading(false)
    }
    fetchTimeline()
  }, [leadId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <KolorSpinner size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-xs text-text-tertiary">{error}</div>
    )
  }

  return (
    <div className="p-4 md:p-6" data-testid="client-timeline">
      <div className="space-y-0">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1
          const isDone = event.status === 'done'
          const isActive = event.status === 'active'
          const isPending = event.status === 'pending'

          return (
            <div key={event.id} className="flex gap-3 relative" data-testid={`timeline-event-${event.id}`}>
              {/* Connector line */}
              {!isLast && (
                <div
                  className="absolute left-[11px] top-6 bottom-0 w-px"
                  style={{ background: isDone ? '#6C2EDB' : 'var(--border)' }}
                  aria-hidden="true"
                />
              )}

              {/* Status dot */}
              <div className="flex-shrink-0 mt-0.5 relative z-10">
                {isDone && (
                  <div className="w-6 h-6 rounded-full bg-[#ede9fe] flex items-center justify-center">
                    <CheckCircle weight="fill" className="w-4 h-4 text-[#6C2EDB]" aria-hidden="true" />
                  </div>
                )}
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-[#fef3c7] border-2 border-[#f59e0b] flex items-center justify-center">
                    <Clock weight="fill" className="w-3 h-3 text-[#92400e]" aria-hidden="true" />
                  </div>
                )}
                {isPending && (
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
                    <Circle className="w-2.5 h-2.5 text-[var(--text-tertiary)]" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-5 min-w-0 ${isPending ? 'opacity-50' : ''}`}>
                <p className={`text-sm font-medium leading-tight ${isDone ? 'text-text-primary' : isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {event.label}
                </p>
                {event.sublabel && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{event.sublabel}</p>
                )}
                {event.actionLabel && event.actionRoute && onTabChange && (
                  <button
                    onClick={() => onTabChange(event.actionRoute!)}
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]'
                        : 'bg-[#ede9fe] text-[#6C2EDB] hover:bg-[#ddd6fe]'
                    }`}
                    data-testid={`timeline-action-${event.id}`}
                  >
                    {event.actionLabel}
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
