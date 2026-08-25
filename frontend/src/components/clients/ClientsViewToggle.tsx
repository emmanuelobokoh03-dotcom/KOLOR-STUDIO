// iter 292-v3a — Clients v3 view mode toggle (LIST ↔ KANBAN).
//
// Sits at the top-right of the Clients page content area. Toggle
// state is `clientsViewMode` scoped to the outer `viewMode === 'list'`
// branch (Clients page). Orthogonal to Dashboard's outer viewMode.
//
// Per Dashboard v3 v3a.1 codified lesson: precise conditional guarding
// clientsViewMode === 'list' / 'kanban' explicit — no ambiguity.

import { ListDashes } from '@phosphor-icons/react/dist/csr/ListDashes'
import { SquaresFour } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'

export type ClientsViewMode = 'list' | 'kanban' | 'calendar'

interface ClientsViewToggleProps {
  mode: ClientsViewMode
  onChange: (mode: ClientsViewMode) => void
}

const OPTIONS: Array<{ value: ClientsViewMode; label: string; Icon: typeof ListDashes }> = [
  { value: 'list', label: 'List', Icon: ListDashes },
  { value: 'kanban', label: 'Kanban', Icon: SquaresFour },
  { value: 'calendar', label: 'Calendar', Icon: CalendarBlank },
]

export function ClientsViewToggle({ mode, onChange }: ClientsViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Clients view mode"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
        borderRadius: 2,
      }}
      data-testid="clients-view-toggle"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              minHeight: 30,
              background: active ? 'var(--kolor-terra, #B84A2C)' : 'transparent',
              color: active
                ? 'var(--kolor-canvas, #F7F4EE)'
                : 'var(--kolor-ink-muted, #5F5751)',
              border: 'none',
              borderRadius: 2,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 200ms ease-out, color 200ms ease-out',
            }}
            data-testid={`clients-view-toggle-${value}`}
          >
            <Icon size={12} weight={active ? 'fill' : 'regular'} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default ClientsViewToggle
