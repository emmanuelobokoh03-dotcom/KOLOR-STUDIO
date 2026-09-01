import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import DashboardCard from './DashboardCard'
import { useTodayData, URGENCY_META } from './useTodayData'

interface NeedsAttentionCardProps {
  onLeadClick: (leadId: string, tab?: string, item?: import('./useTodayData').AttentionItem) => void
}

/**
 * iter 291-v3a — Needs Attention card (Path 2b: deep attention[] view with
 * critical badge). Consumes /api/today (same endpoint as TodayCard). Renders
 * ALL attention items — the deep view — while Today card shows a top-5 mix.
 * Critical badge appears when 1+ items have tier === 'critical'.
 */
export function NeedsAttentionCard({ onLeadClick }: NeedsAttentionCardProps) {
  const { data, loading } = useTodayData()

  if (loading) {
    return (
      <DashboardCard
        title="Needs attention"
        meta="Loading"
        icon={<Lightning weight="duotone" size={20} />}
        testId="needs-attention-card"
      >
        <div className="space-y-2" data-testid="needs-attention-loading">
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

  const items = data?.attention || []

  if (items.length === 0) {
    return (
      <DashboardCard
        title="Needs attention"
        meta="ALL CLEAR"
        icon={<Lightning weight="duotone" size={20} />}
        testId="needs-attention-card"
      >
        <div
          style={{ padding: '16px 4px' }}
          data-testid="needs-attention-empty"
        >
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--kolor-ink-muted, #5F5751)',
              margin: 0,
            }}
          >
            No overdue quotes, unsigned contracts, or stale leads. You&apos;re on
            top of things.
          </p>
        </div>
      </DashboardCard>
    )
  }

  const criticalCount = items.filter(
    (item) => URGENCY_META[item.type]?.tier === 'critical',
  ).length

  const criticalBadge =
    criticalCount > 0 ? (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          background: 'var(--kolor-terra, #B84A2C)',
          color: 'var(--kolor-canvas, #F7F4EE)',
          borderRadius: 2,
          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
        }}
        data-testid="needs-attention-critical-badge"
      >
        {criticalCount} critical
      </span>
    ) : null

  return (
    <DashboardCard
      title="Needs attention"
      meta={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
      icon={<Lightning weight="duotone" size={20} />}
      action={criticalBadge}
      testId="needs-attention-card"
    >
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          borderTop: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
        data-testid="needs-attention-items"
      >
        {items.map((item) => {
          const meta = URGENCY_META[item.type] || URGENCY_META.stale_lead
          const isCritical = meta.tier === 'critical'
          return (
            <li
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 4px',
                borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
              }}
              data-testid={`needs-attention-item-${item.id}`}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: isCritical
                      ? 'var(--kolor-terra, #B84A2C)'
                      : 'var(--kolor-ink-subtle, #928B84)',
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  {meta.metaLabel(item)}
                </p>
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
                  {item.label}
                </p>
                {item.sublabel && (
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
                    {item.sublabel}
                  </p>
                )}
              </div>
              <button
                onClick={() => onLeadClick(item.leadId, item.actionRoute, item)}
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
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
                data-testid={`needs-attention-action-${item.id}`}
              >
                {item.actionLabel}
                <ArrowRight size={12} weight="bold" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </DashboardCard>
  )
}

export default NeedsAttentionCard
