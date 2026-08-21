// iter 292-v3a — Clients v3 stage bucket mapping.
//
// Maps LeadStatus enum (NEW/REVIEWING/CONTACTED/QUALIFIED/QUOTED/
// NEGOTIATING/BOOKED/LOST) to the 5 v3 pipeline stages already
// codified in industryLanguage.ts (inquiry/discovery/quoted/
// contracted/completed).
//
// Per STEP 0 diagnostic: Q3 6-stage refinement (adding REVIEW +
// splitting CONTRACTED/ACTIVE) requires enum + industryLanguage.ts
// extension → deferred to v3.1 backlog with schema migration.
//
// COMPLETED heuristic: status === 'BOOKED' && eventDate < now.
// `deliveryDate` is not in the GET /api/leads select (would need
// backend change); `eventDate` is available and semantically maps
// to "session/project/commission completion" across all 3 industries.

import type { Lead, LeadStatus } from '../../services/api'

export type ClientStage = 'inquiry' | 'discovery' | 'quoted' | 'contracted' | 'completed'

export const STAGE_ORDER: ClientStage[] = [
  'inquiry',
  'discovery',
  'quoted',
  'contracted',
  'completed',
]

const STATUS_BUCKET: Record<LeadStatus, ClientStage | 'lost'> = {
  NEW: 'inquiry',
  REVIEWING: 'inquiry',
  CONTACTED: 'discovery',
  QUALIFIED: 'discovery',
  QUOTED: 'quoted',
  NEGOTIATING: 'quoted',
  BOOKED: 'contracted', // Refined by getStageForLead() completion heuristic
  LOST: 'lost',
}

export function getStageForLead(lead: Lead): ClientStage | 'lost' {
  const bucket = STATUS_BUCKET[lead.status]
  if (bucket !== 'contracted') return bucket
  // Completed heuristic
  const eventDate = lead.eventDate
  if (eventDate && new Date(eventDate).getTime() < Date.now()) return 'completed'
  return 'contracted'
}

export function getStageLabel(
  stage: ClientStage,
  lang: { stages: { inquiry: string; discovery: string; quoted: string; contracted: string; completed: string } },
): string {
  return lang.stages[stage]
}

// Industry filter values (matches CommunityFeed / IndustryType canonical buckets).
export type ClientIndustryFilter = 'ALL' | 'PHOTOGRAPHY' | 'DESIGN' | 'FINE_ART'

export function matchesIndustryFilter(lead: Lead, filter: ClientIndustryFilter): boolean {
  if (filter === 'ALL') return true
  const ind = (lead.industry || '').toString().toUpperCase()
  if (filter === 'PHOTOGRAPHY') return ind === 'PHOTOGRAPHY' || ind === 'VIDEOGRAPHY'
  if (filter === 'DESIGN') return ind === 'DESIGN' || ind === 'GRAPHIC_DESIGN' || ind === 'BRAND_DESIGN'
  if (filter === 'FINE_ART') return ind === 'FINE_ART' || ind === 'FINEART' || ind === 'PAINTING'
  return true
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'K'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function relativeTimeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'JUST NOW'
  if (mins < 60) return `${mins}M AGO`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}H AGO`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}D AGO`
  const months = Math.floor(days / 30)
  return `${months}MO AGO`
}
