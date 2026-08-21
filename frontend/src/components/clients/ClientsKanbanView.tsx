// iter 292-v3a — Clients v3 kanban view.
//
// 5 columns per industryLanguage.ts stage keys (inquiry / discovery /
// quoted / contracted / completed). Industry-adaptive labels via
// getIndustryLanguage() lang.stages.
//
// LOST clients excluded from pipeline columns per convention.
//
// Cards: 24px avatar + Fraunces italic name (14px) + days-in-stage
// (mono UPPERCASE). Horizontal scroll on mobile per Q10=B denser
// hierarchy. Drag-drop stage change deferred to v3b/v3.1.

import { useMemo } from 'react'
import type { Lead } from '../../services/api'
import type { IndustryLanguage } from '../../utils/industryLanguage'
import ClientAvatar from './ClientAvatar'
import type { ClientsFilterState } from './ClientsFilterBar'
import ClientsFilterBar from './ClientsFilterBar'
import type { ClientStage } from './stages'
import {
  STAGE_ORDER,
  getStageForLead,
  matchesIndustryFilter,
} from './stages'

interface ClientsKanbanViewProps {
  leads: Lead[]
  lang: IndustryLanguage
  filter: ClientsFilterState
  onFilterChange: (next: ClientsFilterState) => void
  onLeadClick: (lead: Lead) => void
}

function daysInStage(lead: Lead): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / 86400000),
  )
}

const columnHeaderStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink, #1A1613)',
}

const countPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 22,
  height: 20,
  padding: '0 6px',
  background: 'var(--kolor-canvas, #F7F4EE)',
  border: '1px solid var(--kolor-hairline, #E5E0D8)',
  borderRadius: 2,
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.2em',
  color: 'var(--kolor-ink-muted, #5F5751)',
}

export function ClientsKanbanView({
  leads,
  lang,
  filter,
  onFilterChange,
  onLeadClick,
}: ClientsKanbanViewProps) {
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    leads.forEach((l) => (l.tags || []).forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [leads])

  // Apply industry + tag filters first (stage filter conditionally
  // narrows visible columns but doesn't hide the layout).
  const filteredLeads = useMemo(() => {
    let result = leads.filter((l) => l.status !== 'LOST')
    result = result.filter((l) => matchesIndustryFilter(l, filter.industry))
    if (filter.tag) {
      result = result.filter((l) => (l.tags || []).includes(filter.tag as string))
    }
    return result
  }, [leads, filter.industry, filter.tag])

  const columns = useMemo(() => {
    const visibleStages: ClientStage[] =
      filter.stage === 'all'
        ? STAGE_ORDER
        : STAGE_ORDER.filter((s) => s === filter.stage)
    return visibleStages.map((stage) => ({
      stage,
      label: lang.stages[stage],
      cards: filteredLeads.filter((l) => getStageForLead(l) === stage),
    }))
  }, [filteredLeads, filter.stage, lang])

  return (
    <div data-testid="clients-kanban-view">
      <ClientsFilterBar
        state={filter}
        onChange={onFilterChange}
        lang={lang}
        availableTags={availableTags}
        showSort={false}
      />

      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(240px, 1fr)',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
        }}
        data-testid="clients-kanban-columns"
      >
        {columns.map(({ stage, label, cards }) => (
          <div
            key={stage}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: 12,
              background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              borderRadius: 2,
              minHeight: 200,
            }}
            data-testid={`clients-kanban-column-${stage}`}
          >
            {/* Column header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                paddingBottom: 8,
                borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
              }}
            >
              <span style={columnHeaderStyle}>{label}</span>
              <span style={countPillStyle} data-testid={`clients-kanban-count-${stage}`}>
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            {cards.length === 0 ? (
              <p
                style={{
                  padding: '20px 4px',
                  textAlign: 'center',
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--kolor-ink-subtle, #928B84)',
                  margin: 0,
                }}
              >
                Empty.
              </p>
            ) : (
              cards.map((lead) => (
                <button
                  key={lead.id}
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
                    transition: 'background 200ms ease-out, transform 200ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      'var(--kolor-slate-tint, rgba(59, 74, 63, 0.06))'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      'var(--kolor-canvas, #F7F4EE)'
                  }}
                  data-testid={`clients-kanban-card-${lead.id}`}
                >
                  <ClientAvatar name={lead.clientName} size={24} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontFamily: "'Fraunces', Georgia, serif",
                        fontStyle: 'italic',
                        fontWeight: 500,
                        fontSize: 14,
                        color: 'var(--kolor-ink, #1A1613)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lead.clientName}
                    </p>
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                        fontSize: 9,
                        fontWeight: 500,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color: 'var(--kolor-ink-subtle, #928B84)',
                        margin: 0,
                        marginTop: 2,
                      }}
                    >
                      {daysInStage(lead)}D in stage
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClientsKanbanView
