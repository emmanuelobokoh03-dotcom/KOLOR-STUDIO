import type { CreativeIndustry } from '../../lib/communityTaxonomy'
import { INDUSTRY_CHIPS, SUB_CHIPS } from '../../lib/communityTaxonomy'

interface FilterChipBarProps {
  activeIndustry: CreativeIndustry | 'ALL'
  onIndustryChange: (industry: CreativeIndustry | 'ALL') => void
  activeSubChip?: string | null
  onSubChipChange?: (subChip: string | null) => void
}

// iter 287-v3a — Sticky filter chip bar with sub-chip progressive
// disclosure per Q68=C. Framework tokens: canvas + hairline + Terra active
// + mono UPPERCASE. Renders all 3 industries (Shots is a discovery surface,
// not personal).
export default function FilterChipBar({
  activeIndustry,
  onIndustryChange,
  activeSubChip = null,
  onSubChipChange,
}: FilterChipBarProps) {
  const subChips =
    activeIndustry !== 'ALL' ? SUB_CHIPS[activeIndustry] : []

  return (
    <div
      data-testid="filter-chip-bar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--kolor-canvas)',
        borderBottom: '1px solid var(--kolor-hairline)',
        padding: '20px 24px 16px',
        marginBottom: '24px',
      }}
    >
      {/* Industry chips */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {INDUSTRY_CHIPS.map((chip) => {
          const active = activeIndustry === chip.value
          return (
            <button
              key={chip.value}
              data-testid={`industry-chip-${chip.value.toLowerCase()}`}
              onClick={() => {
                onIndustryChange(chip.value)
                // Reset sub-chip when industry changes
                if (onSubChipChange) onSubChipChange(null)
              }}
              style={{
                flexShrink: 0,
                padding: '10px 16px',
                background: active ? 'var(--kolor-canvas-shade-1)' : 'transparent',
                border: `1px solid ${active ? 'var(--kolor-terra)' : 'var(--kolor-hairline)'}`,
                borderRadius: '2px',
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: active ? 'var(--kolor-terra)' : 'var(--kolor-ink-muted)',
                cursor: 'pointer',
                transition: 'border-color 200ms, color 200ms, background 200ms',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                    'var(--kolor-hairline-strong)'
                  ;(e.currentTarget as HTMLButtonElement).style.color =
                    'var(--kolor-ink)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                    'var(--kolor-hairline)'
                  ;(e.currentTarget as HTMLButtonElement).style.color =
                    'var(--kolor-ink-muted)'
                }
              }}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Sub-chips — appear on industry chip active (Q68=C progressive disclosure) */}
      {subChips.length > 0 && (
        <div
          data-testid="sub-chip-row"
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: '12px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {subChips.map((sub) => {
            const active = activeSubChip === sub
            return (
              <button
                key={sub}
                data-testid={`sub-chip-${sub.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onSubChipChange && onSubChipChange(active ? null : sub)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${active ? 'var(--kolor-ink)' : 'var(--kolor-hairline)'}`,
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--kolor-ink)' : 'var(--kolor-ink-subtle)',
                  cursor: 'pointer',
                  transition: 'border-color 200ms, color 200ms',
                }}
              >
                {sub}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
