import { useState, useEffect, useRef } from 'react'
import {
  Check, X, CalendarBlank, Clock, FileText, Sparkle, ArrowRight, UserCircle
} from '@phosphor-icons/react'

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  action?: () => void
  icon: React.ReactNode
}

export default function OnboardingChecklist({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('kolor_onboarding_dismissed') === 'true')
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const celebratedRef = useRef(false)

  useEffect(() => {
    if (dismissed) return
    fetchProgress()
  }, [dismissed])

  const fetchProgress = async () => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [calRes, mtRes, availRes, leadsRes] = await Promise.all([
        fetch('/api/google-calendar/status', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/meeting-types', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/availability', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/leads', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      const meetingTypes = mtRes?.meetingTypes || mtRes || []
      const availability = availRes?.availability || availRes || []
      const leads = leadsRes?.leads || []
      const hasQuotes = leads.some((l: any) => (l.quotesCount || 0) > 0)

      const list: ChecklistItem[] = [
        {
          id: 'account',
          title: 'Create your account',
          description: "You're all set up!",
          completed: true,
          icon: <UserCircle className="w-5 h-5" weight="duotone" />,
        },
        {
          id: 'availability',
          title: 'Set availability hours',
          description: 'Define when clients can book you',
          completed: Array.isArray(availability) ? availability.length > 0 : !!availability?.schedule,
          action: onOpenSettings,
          icon: <Clock className="w-5 h-5" weight="duotone" />,
        },
        {
          id: 'meeting-type',
          title: 'Create a meeting type',
          description: 'Add a consultation or discovery call',
          completed: Array.isArray(meetingTypes) ? meetingTypes.length > 0 : false,
          action: onOpenSettings,
          icon: <CalendarBlank className="w-5 h-5" weight="duotone" />,
        },
        {
          id: 'calendar',
          title: 'Connect Google Calendar',
          description: 'Auto-sync your availability',
          completed: !!calRes?.connected,
          action: () => document.querySelector('[data-testid="calendar-widget-section"]')?.scrollIntoView({ behavior: 'smooth' }),
          icon: <CalendarBlank className="w-5 h-5" weight="duotone" />,
        },
        {
          id: 'quote',
          title: 'Send your first quote',
          description: 'Convert a lead into revenue',
          completed: hasQuotes,
          icon: <FileText className="w-5 h-5" weight="duotone" />,
        },
      ]

      setItems(list)

      // Auto-dismiss if all complete (celebrate first)
      if (list.every(i => i.completed) && !celebratedRef.current) {
        celebratedRef.current = true
        setTimeout(() => dismiss(), 6000)
      }
    } catch {
      // silently fail
    }
    setLoading(false)
  }

  const dismiss = () => {
    localStorage.setItem('kolor_onboarding_dismissed', 'true')
    setDismissed(true)
  }

  if (dismissed || loading || items.length === 0) return null

  const done = items.filter(i => i.completed).length
  const total = items.length
  const pct = Math.round((done / total) * 100)
  const allDone = done === total

  return (
    <div className="glass-card rounded-xl border border-purple-200/60 p-5 mb-4 md:mb-6" data-testid="onboarding-checklist">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            {allDone
              ? <Sparkle weight="fill" className="w-5 h-5 text-purple-600" />
              : <span className="text-sm font-bold text-purple-700">{done}/{total}</span>
            }
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {allDone ? 'Setup Complete!' : 'Get Started with KOLOR Studio'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {allDone ? "You're ready to start booking clients!" : 'Complete these steps to unlock full power'}
            </p>
          </div>
        </div>
        <button onClick={dismiss} className="text-text-tertiary hover:text-text-primary transition p-1" data-testid="dismiss-onboarding">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-text-secondary">Progress</span>
          <span className="text-xs font-bold text-purple-700">{pct}%</span>
        </div>
        <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            onClick={!item.completed && item.action ? item.action : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              item.completed
                ? 'bg-emerald-50/70 border border-emerald-200'
                : item.action
                  ? 'bg-white border border-light-200 hover:border-purple-300 cursor-pointer'
                  : 'bg-white border border-light-200'
            }`}
            data-testid={`onboarding-item-${item.id}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.completed ? 'bg-emerald-500 text-white' : 'bg-purple-100 text-purple-600'
            }`}>
              {item.completed ? <Check weight="bold" className="w-3.5 h-3.5" /> : item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${item.completed ? 'text-emerald-700 line-through' : 'text-text-primary'}`}>
                {item.title}
              </p>
              <p className="text-[11px] text-text-tertiary">{item.description}</p>
            </div>
            {!item.completed && item.action && (
              <ArrowRight weight="bold" className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* CTA / Celebration */}
      {allDone ? (
        <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 text-xs text-purple-800">
          <strong>Congratulations!</strong> You've completed all setup steps. You're ready to book clients and manage projects!
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => items.find(i => !i.completed)?.action?.()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition"
            data-testid="continue-setup-btn"
          >
            Continue Setup
            <ArrowRight weight="bold" className="w-3.5 h-3.5" />
          </button>
          <button onClick={dismiss} className="text-[11px] text-text-tertiary hover:text-text-secondary transition">
            I'll do this later
          </button>
        </div>
      )}
    </div>
  )
}
