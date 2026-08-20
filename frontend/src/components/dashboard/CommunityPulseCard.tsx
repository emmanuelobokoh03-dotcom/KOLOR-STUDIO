import { useEffect, useState } from 'react'
import { Users } from '@phosphor-icons/react/dist/csr/Users'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { UserPlus } from '@phosphor-icons/react/dist/csr/UserPlus'
import DashboardCard from './DashboardCard'

/**
 * iter 291-v3b — Community Pulse card.
 *
 * Recent likes + comments + new followers on creator's community activity.
 * Reuses existing GET /api/community/notifications endpoint. Filters to
 * engagement notification types (POST_LIKED, POST_COMMENTED, NEW_FOLLOWER)
 * and takes top 5, last 7 days.
 *
 * MVP: does not enrich with actor names (notification schema does not join
 * fromUser); shows type + relative time. Fuller enrichment deferred to the
 * v3c bell architecture merge.
 */

interface CommunityPulseCardProps {
  onViewCommunity: () => void
}

interface NotificationDoc {
  id: string
  type: 'POST_LIKED' | 'POST_COMMENTED' | 'NEW_FOLLOWER' | 'DM_RECEIVED' | 'DM_REQUEST_RECEIVED'
  createdAt: string
  isRead: boolean
  fromUserId: string | null
  postId: string | null
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = now - then
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'JUST NOW'
  if (min < 60) return `${min}M AGO`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}H AGO`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}D AGO`
  return `${Math.floor(day / 7)}W AGO`
}

function formatActivityMessage(type: NotificationDoc['type']): string {
  switch (type) {
    case 'POST_LIKED':
      return 'Someone liked your shot'
    case 'POST_COMMENTED':
      return 'New comment on your shot'
    case 'NEW_FOLLOWER':
      return 'New follower'
    default:
      return 'New activity'
  }
}

function IconForType({ type }: { type: NotificationDoc['type'] }) {
  const common = { size: 14, weight: 'duotone' as const }
  switch (type) {
    case 'POST_LIKED':
      return <Heart {...common} />
    case 'POST_COMMENTED':
      return <ChatCircle {...common} />
    case 'NEW_FOLLOWER':
      return <UserPlus {...common} />
    default:
      return <Users {...common} />
  }
}

export function CommunityPulseCard({ onViewCommunity }: CommunityPulseCardProps) {
  const [items, setItems] = useState<NotificationDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const apiUrl =
          (import.meta as any).env?.VITE_API_URL ||
          (import.meta as any).env?.REACT_APP_BACKEND_URL ||
          ''
        const res = await fetch(`${apiUrl}/api/community/notifications`, {
          credentials: 'include',
        })
        if (res.ok && !cancelled) {
          const json = await res.json()
          const all: NotificationDoc[] = json.notifications || []
          const cutoff = Date.now() - SEVEN_DAYS_MS
          const engagementTypes = new Set(['POST_LIKED', 'POST_COMMENTED', 'NEW_FOLLOWER'])
          const filtered = all
            .filter((n) => engagementTypes.has(n.type))
            .filter((n) => new Date(n.createdAt).getTime() > cutoff)
            .slice(0, 5)
          setItems(filtered)
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <DashboardCard
        title="Community"
        meta="Loading"
        icon={<Users weight="duotone" size={20} />}
        testId="community-pulse-card"
      >
        <div className="space-y-2" data-testid="community-pulse-loading">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-10 rounded-lg ks-shimmer"
              style={{ background: 'var(--kolor-slate-tint, rgba(0,0,0,0.03))' }}
            />
          ))}
        </div>
      </DashboardCard>
    )
  }

  if (items.length === 0) {
    return (
      <DashboardCard
        title="Community"
        meta="QUIET WEEK"
        icon={<Users weight="duotone" size={20} />}
        testId="community-pulse-card"
      >
        <div style={{ padding: '16px 4px' }} data-testid="community-pulse-empty">
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--kolor-ink-muted, #5F5751)',
              margin: 0,
              marginBottom: 16,
            }}
          >
            No recent community activity. Publish a shot in Community to start
            engaging with peers.
          </p>
          <button
            onClick={onViewCommunity}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              background: 'transparent',
              color: 'var(--kolor-terra, #B84A2C)',
              border: '1px solid var(--kolor-terra, #B84A2C)',
              borderRadius: 2,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            data-testid="community-pulse-empty-cta"
          >
            Visit community
            <ArrowRight size={12} weight="bold" aria-hidden />
          </button>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Community"
      meta={`${items.length} recent`}
      icon={<Users weight="duotone" size={20} />}
      action={
        <button
          onClick={onViewCommunity}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 0',
            background: 'transparent',
            color: 'var(--kolor-terra, #B84A2C)',
            border: 'none',
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          data-testid="community-pulse-view-all"
        >
          View community
          <ArrowRight size={12} weight="bold" aria-hidden />
        </button>
      }
      testId="community-pulse-card"
    >
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          borderTop: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
        data-testid="community-pulse-items"
      >
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 4px',
              borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
            }}
            data-testid={`community-pulse-item-${item.id}`}
          >
            <div
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                borderRadius: '50%',
                color: 'var(--kolor-terra, #B84A2C)',
              }}
              aria-hidden
            >
              <IconForType type={item.type} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: 'var(--kolor-ink, #1A1613)',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {formatActivityMessage(item.type)}
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-subtle, #928B84)',
                  margin: 0,
                  marginTop: 2,
                }}
              >
                {relativeTime(item.createdAt)}
                {!item.isRead && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: 'var(--kolor-terra, #B84A2C)',
                    }}
                  >
                    · New
                  </span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  )
}

export default CommunityPulseCard
