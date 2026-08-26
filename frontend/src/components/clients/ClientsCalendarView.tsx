// iter 292-v3b — Clients calendar view (third view mode).
//
// Rendering approach: Case B date-fns custom month grid.
// Q10=B denser hierarchy: framework-calibrated, kolor-canvas-shade-1
// backgrounds, kolor-terra accents, Fraunces italic month heading,
// mono UPPERCASE day-of-week labels.
//
// Dots on days with leads (eventDate populated). Color-coded by stage.
// Click a day → detail panel below the grid.

import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import type { Lead } from '../../services/api'
import type { IndustryLanguage } from '../../utils/industryLanguage'
import ClientAvatar from './ClientAvatar'
import ClientsEmptyState from './ClientsEmptyState'
import { getStageForLead } from './stages'
import type { ClientStage } from './stages'

interface ClientsCalendarViewProps {
  leads: Lead[]
  lang: IndustryLanguage
  onLeadClick: (lead: Lead) => void
}

const STAGE_DOT_COLOR: Record<ClientStage | 'lost', string> = {
  inquiry: 'var(--kolor-ink-subtle, #928B84)',
  discovery: 'var(--kolor-ink-muted, #5F5751)',
  quoted: 'var(--kolor-terra, #B84A2C)',
  contracted: 'var(--kolor-terra, #B84A2C)',
  completed: 'var(--kolor-ink-subtle, #928B84)',
  lost: 'transparent',
}

const dayOfWeekStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink-subtle, #928B84)',
  textAlign: 'center',
  padding: '8px 0',
}

const dayNumberStyle = (inMonth: boolean, isTodayDay: boolean): React.CSSProperties => ({
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 11,
  fontWeight: isTodayDay ? 600 : 500,
  letterSpacing: '0.1em',
  color: !inMonth
    ? 'var(--kolor-ink-subtle, #928B84)'
    : isTodayDay
    ? 'var(--kolor-terra, #B84A2C)'
    : 'var(--kolor-ink, #1A1613)',
  opacity: inMonth ? 1 : 0.4,
})

export function ClientsCalendarView({ leads, lang, onLeadClick }: ClientsCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  const eventLeads = useMemo(
    () => leads.filter((l) => l.eventDate && l.status !== 'LOST'),
    [leads],
  )

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const leadsByDate = useMemo(() => {
    const map = new Map<string, Lead[]>()
    eventLeads.forEach((l) => {
      if (!l.eventDate) return
      const key = format(new Date(l.eventDate), 'yyyy-MM-dd')
      const arr = map.get(key) ?? []
      arr.push(l)
      map.set(key, arr)
    })
    return map
  }, [eventLeads])

  const selectedLeads = useMemo(() => {
    if (!selectedDay) return []
    return leadsByDate.get(format(selectedDay, 'yyyy-MM-dd')) ?? []
  }, [selectedDay, leadsByDate])

  const monthEmpty = eventLeads.every(
    (l) => !l.eventDate || !isSameMonth(new Date(l.eventDate), currentMonth),
  )

  return (
    <div data-testid="clients-calendar-view">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          marginBottom: 10,
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          borderRadius: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            background: 'transparent',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            borderRadius: 2,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
            cursor: 'pointer',
          }}
          data-testid="clients-calendar-prev"
        >
          <CaretLeft size={10} weight="bold" />
          Prev
        </button>

        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 22,
            color: 'var(--kolor-ink, #1A1613)',
            margin: 0,
          }}
          data-testid="clients-calendar-month"
        >
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            background: 'transparent',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            borderRadius: 2,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
            cursor: 'pointer',
          }}
          data-testid="clients-calendar-next"
        >
          Next
          <CaretRight size={10} weight="bold" />
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          background: 'var(--kolor-canvas, #F7F4EE)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
          }}
        >
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} style={dayOfWeekStyle}>
              {d}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayLeads = leadsByDate.get(key) ?? []
            const inMonth = isSameMonth(day, currentMonth)
            const todayDay = isToday(day)
            const selected = selectedDay && isSameDay(day, selectedDay)
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(day)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 4,
                  padding: '8px 8px',
                  minHeight: 72,
                  background: selected
                    ? 'var(--kolor-slate-tint, rgba(59, 74, 63, 0.08))'
                    : 'transparent',
                  border: 'none',
                  borderRight: '1px solid var(--kolor-hairline, #E5E0D8)',
                  borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 200ms ease-out',
                }}
                data-testid={`clients-calendar-day-${key}`}
              >
                <span style={dayNumberStyle(inMonth, todayDay)}>{format(day, 'd')}</span>
                {dayLeads.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    {dayLeads.slice(0, 3).map((l) => (
                      <span
                        key={l.id}
                        aria-hidden
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: STAGE_DOT_COLOR[getStageForLead(l)],
                        }}
                      />
                    ))}
                    {dayLeads.length > 3 && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                          fontSize: 9,
                          fontWeight: 500,
                          color: 'var(--kolor-ink-subtle, #928B84)',
                          letterSpacing: '0.1em',
                        }}
                      >
                        +{dayLeads.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Empty month state (Studio Wall echo per iter 292-v3c) */}
      {monthEmpty && (
        <div style={{ marginTop: 14 }} data-testid="clients-calendar-empty">
          <ClientsEmptyState
            eyebrow="Quiet month"
            title="No booked work this month"
            description="Bookings with an event date populate this grid. Navigate to another month or add work on the Clients list."
            compact
          />
        </div>
      )}

      {/* Day detail panel */}
      {selectedDay && (
        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            borderRadius: 2,
          }}
          data-testid="clients-calendar-day-detail"
        >
          <p
            style={{
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle, #928B84)',
              margin: 0,
              marginBottom: 8,
            }}
          >
            {format(selectedDay, 'EEEE, MMM d')}
          </p>
          {selectedLeads.length === 0 ? (
            <p
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--kolor-ink-subtle, #928B84)',
                margin: 0,
              }}
            >
              Nothing booked.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedLeads.map((lead) => {
                const stage = getStageForLead(lead)
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => onLeadClick(lead)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'var(--kolor-canvas, #F7F4EE)',
                      border: '1px solid var(--kolor-hairline, #E5E0D8)',
                      borderRadius: 2,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    data-testid={`clients-calendar-lead-${lead.id}`}
                  >
                    <ClientAvatar name={lead.clientName} size={24} />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "'Fraunces', Georgia, serif",
                        fontStyle: 'italic',
                        fontWeight: 500,
                        fontSize: 14,
                        color: 'var(--kolor-ink, #1A1613)',
                      }}
                    >
                      {lead.clientName}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                        fontSize: 9,
                        fontWeight: 500,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color: 'var(--kolor-ink-muted, #5F5751)',
                      }}
                    >
                      {stage === 'lost' ? 'LOST' : lang.stages[stage]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ClientsCalendarView
