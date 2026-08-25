// iter 292-v3b — Saved Views (preset + user-defined).
//
// Storage strategy: Case A localStorage keyed by userId. Backend
// user.preferences JSON migration deferred to v3.1.
//
// PRESET_VIEWS: 5 shipped presets adaptive to Lead schema fields
// actually available (createdAt, updatedAt, eventDate, status).
// "Past deposit due" preset deferred to v3.1 backlog until deposit
// tracking exists on Lead schema.

import type { Lead } from '../../services/api'
import type { ClientsFilterState } from './ClientsFilterBar'
import { DEFAULT_CLIENTS_FILTER } from './ClientsFilterBar'
import { getStageForLead } from './stages'

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
]

const LS_KEY = (userId: string) => `kolor_clients_saved_views:${userId}`

export function loadSavedViews(userId: string): SavedView[] {
  try {
    const raw = localStorage.getItem(LS_KEY(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function persistSavedViews(userId: string, views: SavedView[]): void {
  try {
    localStorage.setItem(LS_KEY(userId), JSON.stringify(views))
  } catch {
    // Silently ignore storage quota / private mode errors.
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
