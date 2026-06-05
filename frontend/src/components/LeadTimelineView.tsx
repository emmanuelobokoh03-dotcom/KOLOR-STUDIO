import { useState, useEffect, useCallback } from 'react'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Circle } from '@phosphor-icons/react/dist/csr/Circle'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import KolorSpinner from './KolorSpinner'

// Matches the backend TimelineEvent shape exactly
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

interface LeadTimelineViewProps {
  leadId: string
  currencySymbol?: string
  onTabChange?: (tab: string) => void
  onAddNote: (note: string) => Promise<void>
}

export default function LeadTimelineView({
  leadId, onTabChange, onAddNote
}: LeadTimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const fetchTimeline = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || ''
      const res = await fetch(`${apiUrl}/api/leads/${leadId}/timeline`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      // Backend returns { events: TimelineEvent[] }
      setEvents(data.events || [])
    } catch (err) {
      console.error('Timeline fetch error:', err)
      setError('Could not load timeline')
    }
    setLoading(false)
  }, [leadId])

  useEffect(() => { fetchTimeline() }, [fetchTimeline])

  const handleNoteSubmit = async () => {
    if (!note.trim() || savingNote) return
    setSavingNote(true)
    try {
      await onAddNote(note.trim())
      setNote('')
    } catch (e) {
      console.error('Note save error:', e)
    }
    setSavingNote(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16" data-testid="timeline-loading">
      <KolorSpinner size={28} />
    </div>
  )

  if (error || events.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" data-testid="timeline-empty">
      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        {error || 'No timeline events yet'}
      </p>
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-0 pb-24" data-testid="lead-timeline-view">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-4"
        style={{ color: 'var(--text-secondary)' }}>
        Client journey
      </p>

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
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: '#EDE9FE' }}>
                  <CheckCircle weight="fill" className="w-4 h-4" style={{ color: '#6C2EDB' }} />
                </div>
              )}
              {isActive && (
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                  style={{ background: '#FEF3C7', borderColor: '#F59E0B' }}>
                  <Clock weight="fill" className="w-3 h-3" style={{ color: '#92400E' }} />
                </div>
              )}
              {isPending && (
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
                  <Circle className="w-2.5 h-2.5" style={{ color: 'var(--text-tertiary)' }} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-5 min-w-0 ${isPending ? 'opacity-50' : ''}`}>
              <p className={`text-sm font-medium leading-tight ${
                isDone ? 'text-text-primary' :
                isActive ? 'text-text-primary' :
                'text-text-secondary'
              }`}>
                {event.label}
              </p>
              {event.sublabel && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {event.sublabel}
                </p>
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

      {/* Note input */}
      <div className="mt-2 pt-4" style={{ borderTop: '0.5px solid var(--border)' }}>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note or update..."
              rows={2}
              className="w-full text-xs resize-none focus:outline-none rounded-lg"
              style={{
                background: 'var(--surface-background)',
                border: '0.5px solid var(--border)',
                padding: '8px 10px',
                color: 'var(--text-primary)',
              }}
              data-testid="timeline-note-input"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleNoteSubmit()
                }
              }}
            />
            {note.trim() && (
              <button
                onClick={handleNoteSubmit}
                disabled={savingNote}
                className="mt-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg text-white"
                style={{ background: '#6C2EDB' }}
                data-testid="timeline-note-save"
              >
                {savingNote ? 'Saving...' : 'Save note'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
