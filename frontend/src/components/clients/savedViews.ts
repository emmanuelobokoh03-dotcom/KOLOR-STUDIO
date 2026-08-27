// iter 292-v3b — Saved Views (preset + user-defined).
// iter 293-v3b — Storage migrated: localStorage → backend user.preferences.
//   • loadSavedViews now async; falls back to localStorage on backend error
//   • persistSavedViews now async; writes to backend, keeps localStorage
//     during one-time migration window (cleared after first backend save)
//   • PRESET_VIEWS gains 'archived' (showLost: true) + 'past-deposit-due'
//   • showLost flag on PresetView opts view into including LOST leads
//     (bypasses default exclusion in ClientsListView/Kanban/Calendar)

import type { Lead } from '../../services/api'
import type { ClientsFilterState } from './ClientsFilterBar'
import { DEFAULT_CLIENTS_FILTER } from './ClientsFilterBar'
import { getStageForLead } from './stages'

const API_URL: string = (import.meta as any).env?.VITE_API_URL || ''

export interface SavedView {
  id: string
  label: string
  filter: ClientsFilterState
  createdAt: string
}

export interface PresetView {
  id: string
  label: string
  eyebrow: string
  // Matcher returns true if the lead qualifies for this preset.
  matcher: (lead: Lead) => boolean
  // Preset filter overrides (union of ClientsFilterState + matcher).
  filter?: Partial<ClientsFilterState>
  // iter 293-v3b — Set to true to bypass default LOST exclusion in list views.
  showLost?: boolean
}

const DAY = 86400000

export const PRESET_VIEWS: PresetView[] = [
  {
    id: 'all-active',
    label: 'All active',
    eyebrow: '●',
    matcher: (l) => {
      const s = getStageForLead(l)
      return s !== 'completed' && s !== 'lost'
    },
  },
  {
    id: 'recent-inquiries',
    label: 'Recent inquiries',
    eyebrow: '✦',
    matcher: (l) => {
      if (getStageForLead(l) !== 'inquiry') return false
      return Date.now() - new Date(l.createdAt).getTime() < 14 * DAY
    },
  },
  {
    id: 'awaiting-response',
    label: 'Awaiting response',
    eyebrow: '○',
    matcher: (l) => {
      if (getStageForLead(l) !== 'quoted') return false
      return Date.now() - new Date(l.updatedAt).getTime() > 3 * DAY
    },
  },
  // iter 293-v3b — Past-deposit-due preset (Q1.4=B).
  // Note: deposit fields live on Income/Quote, not Lead. Rather than defer
  // this preset until leads endpoint joins deposit data, ship a Lead-only
  // heuristic that flags the same real-world concern: booked leads whose
  // event date has passed or is within 7 days (deposit typically due before
  // the event / early in the commission). Signals "revenue at risk" without
  // requiring server-side joins.
  {
    id: 'past-deposit-due',
    label: 'Past deposit due',
    eyebrow: '◐',
    matcher: (l) => {
      const s = getStageForLead(l)
      // BOOKED (contracted / commission active) leads with event date within
      // 7 days ahead or already past. Deposit typically expected by now.
      if (s !== 'contracted') return false
      if (!l.eventDate) return false
      const eventTime = new Date(l.eventDate).getTime()
      return eventTime - Date.now() < 7 * DAY
    },
  },
  {
    id: 'this-month',
    label: 'This month',
    eyebrow: '◑',
    matcher: (l) => {
      if (!l.eventDate) return false
      const d = new Date(l.eventDate)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    },
  },
  {
    id: 'completed-work',
    label: 'Completed work',
    eyebrow: '◆',
    matcher: (l) => getStageForLead(l) === 'completed',
  },
  // iter 293-v3b — Archived preset (Bug 4 delivery). Includes LOST-status
  // leads which the list/kanban/calendar views exclude by default. The
  // `showLost` flag opts the view into showing archived rows.
  {
    id: 'archived',
    label: 'Archived',
    eyebrow: '◱',
    showLost: true,
    matcher: (l) => l.status === 'LOST',
  },
]

const LS_KEY = (userId: string) => `kolor_clients_saved_views:${userId}`

// iter 293-v3b — Backend-backed saved views with localStorage fallback.
// Backend: user.preferences.clientsSavedViews (JSON). GET/PATCH via /api/user/preferences.
// One-time migration: on first successful backend load, existing localStorage
// entries are merged and pushed to backend, then localStorage is cleared.

async function fetchPreferences(): Promise<Record<string, any>> {
  const res = await fetch(`${API_URL}/api/user/preferences`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch preferences')
  const data = await res.json()
  return (data && typeof data.preferences === 'object' && data.preferences) || {}
}

async function writePreferences(preferences: Record<string, any>): Promise<void> {
  const res = await fetch(`${API_URL}/api/user/preferences`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferences }),
  })
  if (!res.ok) throw new Error('Failed to update preferences')
}

/**
 * Loads saved views from backend user.preferences.clientsSavedViews.
 * One-time migration path:
 *   1. Fetch backend preferences.
 *   2. If localStorage has views AND backend doesn't → migrate LS → backend, then clear LS.
 *   3. Return backend views.
 * On backend error: fall back to localStorage (transient outage safety).
 */
export async function loadSavedViews(userId: string): Promise<SavedView[]> {
  const lsRaw = localStorage.getItem(LS_KEY(userId))
  let lsViews: SavedView[] = []
  if (lsRaw) {
    try {
      const parsed = JSON.parse(lsRaw)
      if (Array.isArray(parsed)) lsViews = parsed
    } catch { /* ignore */ }
  }

  try {
    const prefs = await fetchPreferences()
    const backendViews: SavedView[] = Array.isArray(prefs.clientsSavedViews) ? prefs.clientsSavedViews : []

    // Migration path: LS has data, backend doesn't
    if (lsViews.length > 0 && backendViews.length === 0) {
      await writePreferences({ ...prefs, clientsSavedViews: lsViews })
      localStorage.removeItem(LS_KEY(userId))
      return lsViews
    }

    // Backend has data → source of truth; clean up LS if still present
    if (lsRaw) localStorage.removeItem(LS_KEY(userId))
    return backendViews
  } catch {
    // Backend unavailable — return LS fallback (do NOT clear LS in this branch)
    return lsViews
  }
}

/**
 * Persists saved views to backend user.preferences.clientsSavedViews.
 * On backend error: writes to localStorage as fallback (retry next session).
 */
export async function persistSavedViews(userId: string, views: SavedView[]): Promise<void> {
  try {
    const prefs = await fetchPreferences()
    await writePreferences({ ...prefs, clientsSavedViews: views })
  } catch {
    // Fallback: write to localStorage so retry next session picks it up
    try {
      localStorage.setItem(LS_KEY(userId), JSON.stringify(views))
    } catch { /* ignore quota */ }
  }
}

export function newSavedView(label: string, filter: ClientsFilterState): SavedView {
  return {
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label,
    filter: { ...filter },
    createdAt: new Date().toISOString(),
  }
}

// Applied filter includes matcher for presets so ClientsListView +
// ClientsKanbanView + ClientsCalendarView can further narrow the leads array.
export function applyPresetToLeads(preset: PresetView, leads: Lead[]): Lead[] {
  return leads.filter(preset.matcher)
}

export const DEFAULT_PRESET_FILTER: ClientsFilterState = { ...DEFAULT_CLIENTS_FILTER }
