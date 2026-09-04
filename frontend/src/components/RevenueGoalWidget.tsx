// iter Revenue Modal Calibration Patch — RevenueGoalWidget framework
// calibration (Case B moderate refactor).
//
// Aligned with the Path C aesthetic established by RevenueHero in
// Dashboard v3.1-v3a and the RevenueDetailModal shell. Preserves all
// three render states (empty, editing, progress) + goal-progress color
// logic (goal hit → emerald semantic, behind pace → amber semantic,
// default on-pace → kolor-terra).

import { useState } from 'react'
import { Crosshair } from '@phosphor-icons/react/dist/csr/Crosshair'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { X } from '@phosphor-icons/react/dist/csr/X'

interface RevenueGoalWidgetProps {
  bookedThisYear: number
  currencySymbol: string
  lang: { leads: string }
}

// Framework style constants for reuse across states.
const MONO_LABEL: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink-muted, #5F5751)',
}

const FRAUNCES_MONEY: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontStyle: 'italic',
  fontWeight: 400,
  color: 'var(--kolor-ink, #1A1613)',
}

export default function RevenueGoalWidget({ bookedThisYear, currencySymbol }: RevenueGoalWidgetProps) {
  const [goal, setGoal] = useState<number>(() => {
    const stored = localStorage.getItem('kolor_revenue_goal')
    return stored ? parseInt(stored, 10) : 0
  })
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleSave = () => {
    const val = parseInt(inputValue.replace(/[^0-9]/g, ''), 10)
    if (val > 0) {
      setGoal(val)
      localStorage.setItem('kolor_revenue_goal', String(val))
    }
    setEditing(false)
  }

  const monthsLeft = 12 - new Date().getMonth()
  const remaining = Math.max(0, goal - bookedThisYear)
  const pct = goal > 0 ? Math.min(100, Math.round((bookedThisYear / goal) * 100)) : 0
  const yearProgress = (new Date().getMonth() + 1) / 12
  const behindPace = yearProgress > 0.5 && pct < 40
  const goalHit = pct >= 100

  // 3-color progress logic: emerald (semantic success), amber (semantic
  // warning), kolor-terra (framework default on-pace) — Q3 answer.
  const barColor = goalHit
    ? '#059669'
    : behindPace
      ? '#D97706'
      : 'var(--kolor-terra, #B84A2C)'

  // ─────────────────────────────────────────────────────────────────
  // Editing state
  // ─────────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div
        data-testid="revenue-goal-widget"
        style={{
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <p style={{ ...MONO_LABEL, marginBottom: 12 }}>Set annual revenue goal</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 13,
              color: 'var(--kolor-ink-muted, #5F5751)',
            }}
          >
            {currencySymbol}
          </span>
          <input
            type="number"
            min={0}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="e.g. 30000"
            className="flex-1 min-h-[44px]"
            style={{
              flex: 1,
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
              color: 'var(--kolor-ink, #1A1613)',
              outline: 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'border-color 150ms ease',
            }}
            autoFocus
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)' }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            data-testid="revenue-goal-input"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setEditing(false)}
            className="min-h-[44px]"
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-muted, #5F5751)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="min-h-[44px]"
            style={{
              padding: '10px 18px',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: '#F7F4EE',
              background: 'var(--kolor-terra, #B84A2C)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#9A3E24' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--kolor-terra, #B84A2C)' }}
            data-testid="revenue-goal-save"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // Empty state — no goal set
  // ─────────────────────────────────────────────────────────────────
  if (goal === 0) {
    return (
      <div
        data-testid="revenue-goal-widget"
        style={{
          background: 'var(--kolor-canvas, #F7F4EE)',
          border: '1px dashed var(--kolor-hairline, #E5E0D8)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              padding: 10,
              background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              borderRadius: 10,
              flexShrink: 0,
            }}
          >
            <Crosshair
              weight="duotone"
              className="w-4 h-4"
              style={{ color: 'var(--kolor-terra, #B84A2C)' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...MONO_LABEL, marginBottom: 6 }}>Annual goal</p>
            <h4
              style={{
                margin: 0,
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 20,
                lineHeight: 1.2,
                color: 'var(--kolor-ink, #1A1613)',
              }}
            >
              Set your revenue goal
            </h4>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                color: 'var(--kolor-ink-muted, #5F5751)',
              }}
            >
              Track your annual target versus what you have booked.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={() => { setInputValue(''); setEditing(true) }}
            className="min-h-[44px]"
            style={{
              padding: '10px 4px',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'var(--kolor-terra, #B84A2C)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#9A3E24' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--kolor-terra, #B84A2C)' }}
            data-testid="set-revenue-goal-cta"
          >
            Set goal →
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // Goal set — progress display
  // ─────────────────────────────────────────────────────────────────
  return (
    <div
      data-testid="revenue-goal-widget"
      style={{
        background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={MONO_LABEL}>Annual goal · {new Date().getFullYear()}</span>
        <button
          onClick={() => { setInputValue(String(goal)); setEditing(true) }}
          aria-label="Edit revenue goal"
          data-testid="edit-revenue-goal"
          style={{
            padding: 8,
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--kolor-canvas, #F7F4EE)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <PencilSimple className="w-3.5 h-3.5" style={{ color: 'var(--kolor-ink-muted, #5F5751)' }} />
        </button>
      </div>

      <p
        style={{
          margin: 0,
          marginBottom: 12,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          color: 'var(--kolor-ink, #1A1613)',
        }}
      >
        <span style={{ ...FRAUNCES_MONEY, fontSize: 22 }}>
          {currencySymbol}{bookedThisYear.toLocaleString()}
        </span>
        <span style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}> booked of </span>
        <span style={{ ...FRAUNCES_MONEY, fontSize: 16, fontStyle: 'normal', fontWeight: 500 }}>
          {currencySymbol}{goal.toLocaleString()}
        </span>
        <span style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}> goal</span>
      </p>

      {/* Progress bar — kolor-terra fill by default, semantic overrides for hit/behind */}
      <div
        style={{
          background: 'var(--kolor-hairline, #E5E0D8)',
          borderRadius: 999,
          height: 6,
          marginBottom: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 999,
            width: `${pct}%`,
            background: barColor,
            transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          data-testid="revenue-goal-progress-bar"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          {currencySymbol}{remaining.toLocaleString()} remaining · {monthsLeft} month{monthsLeft !== 1 ? 's' : ''} left
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: barColor,
          }}
        >
          {pct}%
        </span>
      </div>

      {goalHit && (
        <p
          style={{
            margin: 0,
            marginTop: 12,
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 14,
            textAlign: 'center',
            color: '#059669',
          }}
        >
          Goal reached.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          onClick={() => { setGoal(0); localStorage.removeItem('kolor_revenue_goal') }}
          data-testid="clear-revenue-goal"
          className="min-h-[44px]"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '10px 4px',
            fontSize: 10,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)' }}
        >
          <X className="w-3 h-3" /> Clear goal
        </button>
      </div>
    </div>
  )
}
