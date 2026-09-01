import { useState } from 'react'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { getIndustryLanguage, IndustryType } from '../../utils/industryLanguage'
import DashboardCard from './DashboardCard'
import {
  useTodayData,
  URGENCY_META,
  AttentionItem,
  LeadSummary,
} from './useTodayData'

interface TodayCardProps {
  userIndustry?: IndustryType
  currencySymbol?: string
  onLeadClick: (leadId: string, tab?: string, item?: AttentionItem) => void
}

type MixedItem =
  | { kind: 'attention'; item: AttentionItem }
  | { kind: 'inProgress'; item: LeadSummary }

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * iter 291-v3a — Today card (hero) per Q4 strongly-held + Q9=C adaptive.
 * Shows mixed top-5 of attention + inProgress items with "See all N →"
 * expander when more exist. Reuses URGENCY_META from useTodayData to keep
 * item badges consistent with legacy TodayScreen naming.
 */
export function TodayCard({
  userIndustry,
  currencySymbol = '$',
  onLeadClick,
}: TodayCardProps) {
  const { data, loading } = useTodayData()
  const [expanded, setExpanded] = useState(false)
  const lang = getIndustryLanguage(userIndustry)

  if (loading) {
    return (
      <DashboardCard
        title="Today"
        meta={formatDate().toUpperCase()}
        hero
        icon={<CalendarBlank weight="duotone" size={22} />}
        testId="today-card"
      >
        <div className="space-y-2" data-testid="today-card-loading">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg ks-shimmer"
              style={{ background: 'var(--kolor-slate-tint, rgba(0,0,0,0.03))' }}
            />
          ))}
        </div>
      </DashboardCard>
    )
  }

  // Mix attention + inProgress into single ranked list.
  // Attention items sort first by priority (already sorted server-side).
  // inProgress items follow — surface top upcoming so hero shows "what to
  // work on today" as well as "what's on fire."
  const mixed: MixedItem[] = [
    ...(data?.attention || []).map(
      (item): MixedItem => ({ kind: 'attention', item }),
    ),
    ...(data?.inProgress || []).map(
      (item): MixedItem => ({ kind: 'inProgress', item }),
    ),
  ]

  const total = mixed.length
  const displayItems = expanded ? mixed : mixed.slice(0, 5)

  if (total === 0) {
    return (
      <DashboardCard
        title="Today"
        meta={formatDate().toUpperCase()}
        hero
        icon={<CalendarBlank weight="duotone" size={22} />}
        testId="today-card"
      >
        <div
          style={{ padding: '24px 4px' }}
          data-testid="today-card-empty"
        >
          <p
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 22,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--kolor-ink, #1A1613)',
              margin: 0,
              marginBottom: 8,
            }}
          >
            Nothing urgent today.
          </p>
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--kolor-ink-muted, #5F5751)',
              margin: 0,
            }}
          >
            A good moment to publish new work or reach out to a{' '}
            {lang.lead.toLowerCase()} you&apos;ve been meaning to follow up
            with.
          </p>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Today"
      meta={`${total} ${total === 1 ? 'item' : 'items'} · ${formatDate().toUpperCase()}`}
      hero
      icon={<CalendarBlank weight="duotone" size={22} />}
      testId="today-card"
    >
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          borderTop: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
        data-testid="today-card-items"
      >
        {displayItems.map((mi, idx) => {
          if (mi.kind === 'attention') {
            const meta = URGENCY_META[mi.item.type] || URGENCY_META.stale_lead
            return (
              <li
                key={mi.item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 4px',
                  borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
                }}
                data-testid={`today-item-${mi.item.id}`}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily:
                        "'JetBrains Mono', 'DM Mono', monospace",
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color:
                        meta.tier === 'critical'
                          ? 'var(--kolor-terra, #B84A2C)'
                          : 'var(--kolor-ink-subtle, #928B84)',
                      margin: 0,
                      marginBottom: 4,
                    }}
                  >
                    {meta.metaLabel(mi.item)}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: 14,
                      lineHeight: 1.4,
                      color: 'var(--kolor-ink, #1A1613)',
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    {mi.item.label}
                  </p>
                  {mi.item.sublabel && (
                    <p
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: 12,
                        lineHeight: 1.4,
                        color: 'var(--kolor-ink-muted, #5F5751)',
                        margin: 0,
                        marginTop: 2,
                      }}
                    >
                      {mi.item.sublabel}
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    onLeadClick(mi.item.leadId, mi.item.actionRoute, mi.item)
                  }
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: 'transparent',
                    color: 'var(--kolor-terra, #B84A2C)',
                    border: 'none',
                    borderRadius: 2,
                    fontFamily:
                      "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'opacity 200ms',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.opacity =
                      '0.7'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.opacity =
                      '1'
                  }}
                  data-testid={`today-item-action-${mi.item.id}`}
                >
                  {mi.item.actionLabel}
                  <ArrowRight size={12} weight="bold" aria-hidden />
                </button>
              </li>
            )
          }
          // inProgress lead — lighter presentation, no urgency chip
          const lead = mi.item
          const value = lead.estimatedValue
            ? `${currencySymbol}${lead.estimatedValue.toLocaleString()}`
            : null
          return (
            <li
              key={`ip-${lead.id}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 4px',
                borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
              }}
              data-testid={`today-item-inprogress-${lead.id}`}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily:
                      "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink-subtle, #928B84)',
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  In progress · {lead.status.replace('_', ' ')}
                </p>
                <p
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 14,
                    lineHeight: 1.4,
                    color: 'var(--kolor-ink, #1A1613)',
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  {lead.clientName}
                  {value && (
                    <span
                      style={{
                        color: 'var(--kolor-ink-muted, #5F5751)',
                        fontWeight: 400,
                      }}
                    >
                      {' '}
                      · {value}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => onLeadClick(lead.id)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'transparent',
                  color: 'var(--kolor-ink-muted, #5F5751)',
                  border: 'none',
                  borderRadius: 2,
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
                data-testid={`today-item-inprogress-action-${lead.id}`}
              >
                Open
                <ArrowRight size={12} weight="bold" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
      {total > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginTop: 14,
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
          data-testid="today-card-expander"
        >
          {expanded ? 'Show less ↑' : `See all ${total} →`}
        </button>
      )}
    </DashboardCard>
  )
}

export default TodayCard
