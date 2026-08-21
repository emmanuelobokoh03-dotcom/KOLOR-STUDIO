// iter 292-v3a — Clients v3 filter + sort bar.
//
// Client-side filter/sort (data pre-loaded via GET /api/leads).
// URL parameter reflection deferred to v3b saved views (per Q4=C).
//
// Filter dimensions:
//   - Stage: All / Inquiry / Discovery / Quoted / Contracted / Completed
//   - Industry: All / Photography / Design / Fine Art
//   - Tag: multi-select (schema-provided String[] on Lead)
//
// Sort dimensions:
//   - Name (A-Z)
//   - Last activity (recent)
//   - Stage (pipeline order)

import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
import type { ClientStage, ClientIndustryFilter } from './stages'
import { STAGE_ORDER } from './stages'
import type { IndustryLanguage } from '../../utils/industryLanguage'

export type ClientsSortMode = 'name' | 'activity' | 'stage'

export interface ClientsFilterState {
  stage: ClientStage | 'all'
  industry: ClientIndustryFilter
  tag: string | null
  sort: ClientsSortMode
}

export const DEFAULT_CLIENTS_FILTER: ClientsFilterState = {
  stage: 'all',
  industry: 'ALL',
  tag: null,
  sort: 'activity',
}

interface ClientsFilterBarProps {
  state: ClientsFilterState
  onChange: (next: ClientsFilterState) => void
  lang: IndustryLanguage
  availableTags: string[]
  showSort?: boolean
}

const INDUSTRY_OPTIONS: Array<{ value: ClientIndustryFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'FINE_ART', label: 'Fine Art' },
]

const SORT_OPTIONS: Array<{ value: ClientsSortMode; label: string }> = [
  { value: 'activity', label: 'Recent activity' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'stage', label: 'Stage order' },
]

const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 10px',
  minHeight: 28,
  background: active ? 'var(--kolor-terra, #B84A2C)' : 'transparent',
  color: active ? 'var(--kolor-canvas, #F7F4EE)' : 'var(--kolor-ink-muted, #5F5751)',
  border: `1px solid ${
    active ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-hairline, #E5E0D8)'
  }`,
  borderRadius: 2,
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background 200ms ease-out, color 200ms ease-out',
})

const groupLabelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink-subtle, #928B84)',
}

export function ClientsFilterBar({
  state,
  onChange,
  lang,
  availableTags,
  showSort = true,
}: ClientsFilterBarProps) {
  const stageOptions: Array<{ value: ClientStage | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    ...STAGE_ORDER.map((s) => ({ value: s, label: lang.stages[s] })),
  ]

  const activeCount =
    (state.stage !== 'all' ? 1 : 0) +
    (state.industry !== 'ALL' ? 1 : 0) +
    (state.tag ? 1 : 0)

  const clearAll = () =>
    onChange({ ...DEFAULT_CLIENTS_FILTER, sort: state.sort })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 16px',
        background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
        borderRadius: 2,
        marginBottom: 12,
      }}
      data-testid="clients-filter-bar"
    >
      {/* Stage row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ ...groupLabelStyle, minWidth: 64 }}>Stage</span>
        {stageOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...state, stage: opt.value })}
            style={pillStyle(state.stage === opt.value)}
            data-testid={`clients-filter-stage-${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Industry row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ ...groupLabelStyle, minWidth: 64 }}>Industry</span>
        {INDUSTRY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...state, industry: opt.value })}
            style={pillStyle(state.industry === opt.value)}
            data-testid={`clients-filter-industry-${opt.value.toLowerCase()}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tag row (only if tags exist) */}
      {availableTags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ ...groupLabelStyle, minWidth: 64 }}>Tag</span>
          <button
            type="button"
            onClick={() => onChange({ ...state, tag: null })}
            style={pillStyle(state.tag === null)}
            data-testid="clients-filter-tag-all"
          >
            All
          </button>
          {availableTags.slice(0, 12).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...state, tag: state.tag === t ? null : t })}
              style={pillStyle(state.tag === t)}
              data-testid={`clients-filter-tag-${t.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Sort + clear row */}
      {(showSort || activeCount > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {showSort && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 30,
              }}
            >
              <span style={groupLabelStyle}>Sort</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={state.sort}
                  onChange={(e) =>
                    onChange({ ...state, sort: e.target.value as ClientsSortMode })
                  }
                  style={{
                    appearance: 'none',
                    padding: '6px 26px 6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--kolor-hairline, #E5E0D8)',
                    borderRadius: 2,
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink, #1A1613)',
                    cursor: 'pointer',
                  }}
                  data-testid="clients-sort-select"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={10}
                  weight="bold"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                  }}
                />
              </div>
            </label>
          )}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                marginLeft: 'auto',
                padding: '6px 10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--kolor-terra, #B84A2C)',
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              data-testid="clients-filter-clear-all"
            >
              Clear all ({activeCount})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ClientsFilterBar
