import { useEffect, useState } from 'react'

/**
 * iter 291-v3a — Shared /api/today hook used by TodayCard + NeedsAttentionCard.
 * Both cards consume the same endpoint (per Path 2b) so we fetch once at the
 * DashboardCards container level and pass down, or each card can call this
 * hook independently — the endpoint is cheap and cached by the browser.
 *
 * Returns the raw payload shape from backend/src/routes/today.ts:
 *   { attention: AttentionItem[], inProgress: LeadSummary[], generatedAt }
 */
export interface AttentionItem {
  id: string
  type: string
  priority: number
  clientName: string
  leadId: string
  label: string
  sublabel: string
  actionLabel: string
  actionRoute: string
  daysOverdue?: number
}

export interface LeadSummary {
  id: string
  clientName: string
  projectType: string
  status: string
  estimatedValue?: number
  updatedAt: string
  keyDate?: string
  eventDate?: string
}

export interface TodayData {
  attention: AttentionItem[]
  inProgress: LeadSummary[]
  generatedAt: string
}

export function useTodayData() {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const apiUrl =
          (import.meta as any).env?.VITE_API_URL ||
          (import.meta as any).env?.REACT_APP_BACKEND_URL ||
          ''
        const res = await fetch(`${apiUrl}/api/today`, {
          credentials: 'include',
        })
        if (res.ok && !cancelled) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        // silent — cards fall through to empty state
        console.error('Today data fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading }
}

/**
 * Urgency label config — reused from TodayScreen.tsx metaLabels so item
 * badges match the ratified item types (DAY N · CONTRACT, EXPIRES SOON ·
 * OFFER, NEW INQUIRY, VIEWED · AWAITING DECISION, etc.)
 */
export interface UrgencyMeta {
  tier: 'critical' | 'warning' | 'new' | 'stale'
  metaLabel: (item: AttentionItem) => string
}

export const URGENCY_META: Record<string, UrgencyMeta> = {
  contract_unsigned: {
    tier: 'critical',
    metaLabel: (item) => `DAY ${item.daysOverdue ?? 1} · CONTRACT`,
  },
  payment_overdue: {
    tier: 'critical',
    metaLabel: (item) => `${item.daysOverdue ?? 1} DAYS OVERDUE · PAYMENT`,
  },
  quote_expiring: {
    tier: 'warning',
    metaLabel: () => 'EXPIRES SOON · OFFER',
  },
  quote_viewed: {
    tier: 'warning',
    metaLabel: () => 'VIEWED · AWAITING DECISION',
  },
  new_inquiry: {
    tier: 'new',
    metaLabel: () => 'NEW INQUIRY',
  },
  stale_lead: {
    tier: 'stale',
    metaLabel: (item) => `${item.daysOverdue ?? 7} DAYS · NO UPDATE`,
  },
}
