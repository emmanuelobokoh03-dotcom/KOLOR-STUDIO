import { useEffect, useState } from 'react'
import { ChartLine } from '@phosphor-icons/react/dist/csr/ChartLine'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import DashboardCard from './DashboardCard'
import { leadsApi } from '../../services/api'

/**
 * iter 291-v3b — Pipeline Pulse card.
 *
 * Compact snapshot of pipeline stages (text-forward, no charts). Reuses
 * existing GET /api/leads/stats which already returns `{ total, statusCounts,
 * recentLeads }`.
 */

interface PipelinePulseCardProps {
  onViewClients: () => void
}

const STAGE_ORDER: Array<{ key: string; label: string }> = [
  { key: 'NEW', label: 'New' },
  { key: 'REVIEWING', label: 'Reviewing' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'QUALIFIED', label: 'Qualified' },
  { key: 'QUOTED', label: 'Quoted' },
  { key: 'NEGOTIATING', label: 'Negotiating' },
  { key: 'BOOKED', label: 'Booked' },
]

export function PipelinePulseCard({ onViewClients }: PipelinePulseCardProps) {
  const [stats, setStats] = useState<{ total: number; statusCounts: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    leadsApi
      .getStats()
      .then((r) => {
        if (!cancelled) {
          setStats({
            total: (r.data as any)?.total ?? 0,
            statusCounts: (r.data as any)?.statusCounts ?? {},
          })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const activeCount = stats
    ? stats.total - (stats.statusCounts.BOOKED || 0) - (stats.statusCounts.LOST || 0)
    : 0

  if (loading) {
    return (
      <DashboardCard
        title="Pipeline"
        meta="Loading"
        icon={<ChartLine weight="duotone" size={20} />}
        testId="pipeline-pulse-card"
      >
        <div className="space-y-2" data-testid="pipeline-pulse-loading">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 rounded-lg ks-shimmer"
              style={{ background: 'var(--kolor-slate-tint, rgba(0,0,0,0.03))' }}
            />
          ))}
        </div>
      </DashboardCard>
    )
  }

  if (!stats || activeCount === 0) {
    return (
      <DashboardCard
        title="Pipeline"
        meta="ALL CLEAR"
        icon={<ChartLine weight="duotone" size={20} />}
        testId="pipeline-pulse-card"
      >
        <div style={{ textAlign: 'center', padding: '20px 4px 4px' }} data-testid="pipeline-pulse-empty">
          {/* iter 291-v3c — landing echo: subtle Studio Wall hairline anchor */}
          <div
            aria-hidden
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            <div style={{ width: 16, height: 24, border: '1px solid var(--kolor-hairline, #E5E0D8)', background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))' }} />
            <div style={{ width: 32, height: 44, border: '1px solid var(--kolor-hairline, #E5E0D8)', background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))' }} />
            <div style={{ width: 16, height: 24, border: '1px solid var(--kolor-hairline, #E5E0D8)', background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))' }} />
          </div>
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--kolor-ink-muted, #5F5751)',
              margin: 0,
            }}
          >
            No active leads yet. Ready when your first inquiry lands.
          </p>
        </div>
      </DashboardCard>
    )
  }

  const activeStages = STAGE_ORDER.filter(
    (s) => (stats.statusCounts[s.key] || 0) > 0 && s.key !== 'BOOKED',
  )

  return (
    <DashboardCard
      title="Pipeline"
      meta={`${activeCount} active`}
      icon={<ChartLine weight="duotone" size={20} />}
      action={
        <button
          onClick={onViewClients}
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
          data-testid="pipeline-pulse-view-all"
        >
          View pipeline
          <ArrowRight size={12} weight="bold" aria-hidden />
        </button>
      }
      testId="pipeline-pulse-card"
    >
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 12,
        }}
        data-testid="pipeline-pulse-stages"
      >
        {activeStages.map((stage) => {
          const count = stats.statusCounts[stage.key] || 0
          return (
            <li
              key={stage.key}
              style={{
                padding: '12px 14px',
                background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.5))',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                borderRadius: 2,
              }}
              data-testid={`pipeline-pulse-stage-${stage.key.toLowerCase()}`}
            >
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 500,
                  fontSize: 28,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'var(--kolor-ink, #1A1613)',
                  margin: 0,
                  marginBottom: 6,
                }}
              >
                {count}
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-subtle, #928B84)',
                  margin: 0,
                }}
              >
                {stage.label}
              </p>
            </li>
          )
        })}
      </ul>
    </DashboardCard>
  )
}

export default PipelinePulseCard
