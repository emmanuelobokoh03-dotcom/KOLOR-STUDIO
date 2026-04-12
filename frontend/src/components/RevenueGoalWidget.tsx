import { useState } from 'react'
import { Crosshair, PencilSimple, X } from '@phosphor-icons/react'

interface RevenueGoalWidgetProps {
  bookedThisYear: number
  currencySymbol: string
  lang: { leads: string }
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

  const barColor = goalHit ? '#059669' : behindPace ? '#D97706' : '#6C2EDB'

  // Editing mode
  if (editing) {
    return (
      <div className="glass-card rounded-xl border border-light-200 p-4" data-testid="revenue-goal-widget">
        <p className="text-xs font-semibold text-text-primary mb-3">Set annual revenue goal</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">{currencySymbol}</span>
          <input
            type="number"
            min={0}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="e.g. 30000"
            className="flex-1 bg-surface-base border border-light-200 rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-purple-400 min-h-[44px]"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            data-testid="revenue-goal-input"
          />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold bg-[#6C2EDB] text-white rounded-lg hover:bg-[#5522C4] transition min-h-[44px]"
            data-testid="revenue-goal-save"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  // Empty state — no goal set
  if (goal === 0) {
    return (
      <div className="rounded-xl border border-dashed border-light-200 p-4 bg-surface-base" data-testid="revenue-goal-widget">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl flex-shrink-0">
            <Crosshair weight="duotone" className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Set your revenue goal</p>
            <p className="text-xs text-text-tertiary mt-0.5">Track your annual target vs booked</p>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={() => { setInputValue(''); setEditing(true) }}
            className="text-xs font-semibold text-[#6C2EDB] hover:text-[#5522C4] transition min-h-[44px] px-2"
            data-testid="set-revenue-goal-cta"
          >
            Set goal &rarr;
          </button>
        </div>
      </div>
    )
  }

  // Goal set — show progress
  return (
    <div className="glass-card rounded-xl border border-light-200 p-4" data-testid="revenue-goal-widget">
      <div className="flex items-center justify-between mb-3">
        <span
          style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(0,0,0,0.4)' }}
        >
          Annual goal · {new Date().getFullYear()}
        </span>
        <button
          onClick={() => { setInputValue(String(goal)); setEditing(true) }}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Edit revenue goal"
          data-testid="edit-revenue-goal"
        >
          <PencilSimple className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>

      <p className="text-sm text-text-primary mb-1">
        <span className="font-bold">{currencySymbol}{bookedThisYear.toLocaleString()}</span>
        <span className="text-text-secondary"> booked of </span>
        <span className="font-semibold">{currencySymbol}{goal.toLocaleString()}</span>
        <span className="text-text-secondary"> goal</span>
      </p>

      {/* Progress bar */}
      <div className="bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
            transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          data-testid="revenue-goal-progress-bar"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-tertiary">
          {currencySymbol}{remaining.toLocaleString()} remaining · {monthsLeft} month{monthsLeft !== 1 ? 's' : ''} left
        </span>
        <span className="text-[11px] font-semibold" style={{ color: barColor }}>
          {pct}%
        </span>
      </div>

      {goalHit && (
        <div className="mt-2 text-xs text-emerald-600 font-medium text-center">
          Goal reached!
        </div>
      )}

      {/* Clear goal button */}
      <div className="flex justify-end mt-2">
        <button
          onClick={() => { setGoal(0); localStorage.removeItem('kolor_revenue_goal') }}
          className="text-[10px] text-text-tertiary hover:text-text-secondary transition flex items-center gap-1 min-h-[44px]"
          data-testid="clear-revenue-goal"
        >
          <X className="w-3 h-3" /> Clear goal
        </button>
      </div>
    </div>
  )
}
