// iter 292-v3a — Clients v3 list view (Case B: additive alongside
// LeadsListView.tsx). Framework-calibrated from day 1 using kolor
// tokens. Denser than Dashboard v3 cards per Q10=B aligned hierarchy.
//
// Row structure (spreadsheet-adjacent density with visual anchors):
//   Avatar (32px) | Name (Fraunces italic) + industry badge |
//   Stage (mono UPPERCASE) | Last activity | Next action (Terra)
//
// Sort dimensions: name / activity / stage (order defined in
// ClientsFilterBar).

import { useMemo, useState } from 'react'
import { CaretUp } from '@phosphor-icons/react/dist/csr/CaretUp'
import type { Lead } from '../../services/api'
import type { IndustryLanguage } from '../../utils/industryLanguage'
import { useClientsKeyboard } from '../../hooks/useClientsKeyboard'
import ClientAvatar from './ClientAvatar'
import ClientsEmptyState from './ClientsEmptyState'
import type { ClientsFilterState } from './ClientsFilterBar'
import ClientsFilterBar from './ClientsFilterBar'
import type { ClientIndustryFilter, ClientStage } from './stages'
import {
  STAGE_ORDER,
  getStageForLead,
  matchesIndustryFilter,
  relativeTimeShort,
} from './stages'

interface ClientsListViewProps {
  leads: Lead[]
  lang: IndustryLanguage
  filter: ClientsFilterState
  onFilterChange: (next: ClientsFilterState) => void
  onLeadClick: (lead: Lead) => void
  onAddClient?: () => void
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: (ids: string[]) => void
  keyboardEnabled?: boolean
}

const HEADER_LABELS = ['Client', 'Stage', 'Last activity', 'Next'] as const

const headerCellStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink-subtle, #928B84)',
  textAlign: 'left',
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 6px',
  background: 'var(--kolor-slate-tint, rgba(59, 74, 63, 0.08))',
  border: '1px solid var(--kolor-hairline, #E5E0D8)',
  borderRadius: 2,
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink-muted, #5F5751)',
}

// iter 292-v3a.1 — tag chip style: softer than industry badge to keep
// visual hierarchy (name > industry > tags).
const tagChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 6px',
  background: 'transparent',
  border: '1px solid var(--kolor-hairline, #E5E0D8)',
  borderRadius: 2,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 500,
  color: 'var(--kolor-ink-subtle, #928B84)',
  flexShrink: 0,
}

function industryLabel(lead: Lead): string | null {
  const ind = (lead.industry || '').toString().toUpperCase()
  if (!ind) return null
  if (ind === 'PHOTOGRAPHY' || ind === 'VIDEOGRAPHY') return 'PHOTO'
  if (ind === 'DESIGN' || ind === 'GRAPHIC_DESIGN' || ind === 'BRAND_DESIGN') return 'DESIGN'
  if (ind === 'FINE_ART' || ind === 'FINEART' || ind === 'PAINTING') return 'ART'
  return ind.slice(0, 6)
}

// iter 292-v3a.1 — industry canonical bucket for `availableIndustries`
// so ClientsFilterBar hides buttons that would yield zero results.
function industryBucket(lead: Lead): ClientIndustryFilter | null {
  const ind = (lead.industry || '').toString().toUpperCase()
  if (!ind) return null
  if (ind === 'PHOTOGRAPHY' || ind === 'VIDEOGRAPHY') return 'PHOTOGRAPHY'
  if (ind === 'DESIGN' || ind === 'GRAPHIC_DESIGN' || ind === 'BRAND_DESIGN') return 'DESIGN'
  if (ind === 'FINE_ART' || ind === 'FINEART' || ind === 'PAINTING') return 'FINE_ART'
  return null
}

function nextActionFor(lead: Lead, lang: IndustryLanguage): string {
  const stage = getStageForLead(lead)
  if (stage === 'inquiry') return `Reply to ${lang.lead.toLowerCase()}`
  if (stage === 'discovery') return `Send ${lang.quote.toLowerCase()}`
  if (stage === 'quoted') return 'Follow up'
  if (stage === 'contracted') return `${lang.bookingConfirmed} — active`
  if (stage === 'completed') return 'Archive'
  return 'View'
}

export function ClientsListView({
  leads,
  lang,
  filter,
  onFilterChange,
  onLeadClick,
  onAddClient,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  keyboardEnabled = true,
}: ClientsListViewProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    leads.forEach((l) => (l.tags || []).forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [leads])

  // iter 292-v3a.1 — available industries in the visible dataset.
  const availableIndustries = useMemo(() => {
    const set = new Set<ClientIndustryFilter>()
    leads.forEach((l) => {
      const b = industryBucket(l)
      if (b) set.add(b)
    })
    return Array.from(set)
  }, [leads])

  const filtered = useMemo(() => {
    let result = leads.filter((l) => l.status !== 'LOST')
    // Stage filter
    if (filter.stage !== 'all') {
      result = result.filter((l) => getStageForLead(l) === filter.stage)
    }
    // Industry filter
    result = result.filter((l) => matchesIndustryFilter(l, filter.industry))
    // Tag filter
    if (filter.tag) {
      result = result.filter((l) => (l.tags || []).includes(filter.tag as string))
    }
    // Sort
    if (filter.sort === 'name') {
      result = [...result].sort((a, b) => a.clientName.localeCompare(b.clientName))
    } else if (filter.sort === 'stage') {
      result = [...result].sort(
        (a, b) =>
          STAGE_ORDER.indexOf(getStageForLead(a) as ClientStage) -
          STAGE_ORDER.indexOf(getStageForLead(b) as ClientStage),
      )
    } else {
      // activity (default): most recently updated first
      result = [...result].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    }
    return result
  }, [leads, filter])

  // iter 292-v3b — J/K/Enter navigation (list-scoped). CMD+K/ESC//
  // handled at Dashboard.tsx level. Guards inside `useClientsKeyboard`
  // skip J/K when typing in inputs.
  useClientsKeyboard(
    {
      onNavigateNext: () => {
        setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1))
      },
      onNavigatePrev: () => {
        setFocusedIndex((i) => Math.max(i - 1, 0))
      },
    },
    keyboardEnabled && filtered.length > 0,
  )

  return (
    <div data-testid="clients-list-view">
      <ClientsFilterBar
        state={filter}
        onChange={onFilterChange}
        lang={lang}
        availableTags={availableTags}
        availableIndustries={availableIndustries}
      />

      {/* Table container */}
      <div
        style={{
          background: 'var(--kolor-canvas, #F7F4EE)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Sticky header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '32px minmax(0, 2fr) 120px 120px 140px',
            gap: 16,
            padding: '10px 16px',
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
          data-testid="clients-list-header"
        >
          {/* iter 292-v3b — Header checkbox: select all visible / clear */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {onToggleSelectAll && (
              <input
                type="checkbox"
                checked={filtered.length > 0 && filtered.every((l) => selectedIds.includes(l.id))}
                ref={(el) => {
                  if (el) {
                    const someSelected = filtered.some((l) => selectedIds.includes(l.id))
                    const allSelected = filtered.every((l) => selectedIds.includes(l.id))
                    el.indeterminate = someSelected && !allSelected
                  }
                }}
                onChange={() => onToggleSelectAll(filtered.map((l) => l.id))}
                style={{
                  cursor: 'pointer',
                  width: 14,
                  height: 14,
                  accentColor: 'var(--kolor-terra, #B84A2C)',
                }}
                data-testid="clients-list-select-all"
                aria-label="Select all visible"
              />
            )}
          </div>
          {HEADER_LABELS.map((label) => {
            const key = label.toLowerCase().replace(/\s+/g, '-')
            const activeSort =
              (label === 'Client' && filter.sort === 'name') ||
              (label === 'Last activity' && filter.sort === 'activity') ||
              (label === 'Stage' && filter.sort === 'stage')
            return (
              <div
                key={key}
                style={{
                  ...headerCellStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: activeSort
                    ? 'var(--kolor-ink, #1A1613)'
                    : 'var(--kolor-ink-subtle, #928B84)',
                }}
              >
                {label}
                {activeSort && <CaretUp size={9} weight="bold" />}
              </div>
            )
          })}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <ClientsEmptyState
            eyebrow={leads.length === 0 ? 'Studio wall' : 'No matches'}
            title={leads.length === 0 ? 'No clients yet' : 'No clients match this filter'}
            description={
              leads.length === 0
                ? `Your first ${lang.lead.toLowerCase()} lands here. Send a share link or wait for a new inquiry.`
                : 'Try clearing filters or switching to a different preset view.'
            }
            cta={
              onAddClient && leads.length === 0
                ? { label: 'Add client', onClick: onAddClient }
                : undefined
            }
            testId="clients-list-empty"
          />
        ) : (
          filtered.map((lead, idx) => {
            const stage = getStageForLead(lead)
            const stageLabel = stage === 'lost' ? 'LOST' : lang.stages[stage as ClientStage]
            const ind = industryLabel(lead)
            const isSelected = selectedIds.includes(lead.id)
            const isFocused = idx === focusedIndex
            return (
              <div
                key={lead.id}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '32px minmax(0, 2fr) 120px 120px 140px',
                  gap: 16,
                  alignItems: 'center',
                  padding: '12px 16px',
                  minHeight: 56,
                  background: isSelected
                    ? 'var(--kolor-slate-tint, rgba(59, 74, 63, 0.10))'
                    : isFocused
                    ? 'var(--kolor-slate-tint, rgba(59, 74, 63, 0.06))'
                    : 'transparent',
                  borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
                  borderLeft: isFocused
                    ? '2px solid var(--kolor-terra, #B84A2C)'
                    : '2px solid transparent',
                  transition: 'background 200ms ease-out',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isFocused) {
                    ;(e.currentTarget as HTMLDivElement).style.background =
                      'var(--kolor-slate-tint, rgba(59, 74, 63, 0.06))'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isFocused) {
                    ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }
                }}
                data-testid={`clients-row-${lead.id}`}
              >
                {/* iter 292-v3b — Row checkbox */}
                <div
                  style={{ display: 'flex', alignItems: 'center' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {onToggleSelect && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(lead.id)}
                      style={{
                        cursor: 'pointer',
                        width: 14,
                        height: 14,
                        accentColor: 'var(--kolor-terra, #B84A2C)',
                      }}
                      data-testid={`clients-row-select-${lead.id}`}
                      aria-label={`Select ${lead.clientName}`}
                    />
                  )}
                </div>
                <button
                  onClick={() => onLeadClick(lead)}
                  style={{
                    display: 'contents',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                {/* Client cell */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <ClientAvatar name={lead.clientName} size={32} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Fraunces', Georgia, serif",
                          fontStyle: 'italic',
                          fontWeight: 500,
                          fontSize: 15,
                          color: 'var(--kolor-ink, #1A1613)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lead.clientName}
                      </span>
                      {ind && <span style={badgeStyle}>{ind}</span>}
                      {/* iter 292-v3a.1 — up to 2 tag chips as visual
                          anchor so users see which tags exist without
                          opening the filter panel. */}
                      {(lead.tags || []).slice(0, 2).map((t) => (
                        <span
                          key={t}
                          style={tagChipStyle}
                          data-testid={`clients-row-tag-${t.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {t}
                        </span>
                      ))}
                      {(lead.tags || []).length > 2 && (
                        <span style={{ ...tagChipStyle, fontStyle: 'italic' }}>
                          +{lead.tags.length - 2}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: 12,
                        color: 'var(--kolor-ink-muted, #5F5751)',
                        margin: 0,
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lead.projectTitle}
                    </p>
                  </div>
                </div>

                {/* Stage */}
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink, #1A1613)',
                  }}
                >
                  {stageLabel}
                </div>

                {/* Last activity */}
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                  }}
                >
                  {relativeTimeShort(lead.updatedAt)}
                </div>

                {/* Next action */}
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-terra, #B84A2C)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {nextActionFor(lead, lang)}
                </div>
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p
          style={{
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-subtle, #928B84)',
            margin: '10px 4px 0',
          }}
          data-testid="clients-list-count"
        >
          {filtered.length} of {leads.filter((l) => l.status !== 'LOST').length}{' '}
          {lang.leads.toLowerCase()}
        </p>
      )}
    </div>
  )
}

export default ClientsListView
