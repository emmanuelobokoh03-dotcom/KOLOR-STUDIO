// iter Revenue Modal Calibration Patch — RevenueDashboard framework
// calibration (Case B moderate refactor).
//
// Aligned with the Path C aesthetic (RevenueHero + RevenueDetailModal
// shell). Chart palette calibrated to kolor-terra / kolor-hairline /
// kolor-ink-muted; tooltip now light-canvas framework style instead of
// dark mode; 4-card stat grid uses kolor-canvas-shade-1 + Fraunces
// italic metric values + mono UPPERCASE eyebrows.
//
// Semantic accents preserved: emerald for positive delta, red for
// negative delta, amber for pipeline/pending metric.

import { useState, useEffect } from 'react'
import { CurrencyDollar } from '@phosphor-icons/react/dist/csr/CurrencyDollar'
import { TrendUp } from '@phosphor-icons/react/dist/csr/TrendUp'
import { TrendDown } from '@phosphor-icons/react/dist/csr/TrendDown'
import { Crosshair } from '@phosphor-icons/react/dist/csr/Crosshair'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface RevenueStats {
  thisMonth: number
  thisMonthCount: number
  monthOverMonth: number
  ytd: number
  yearGoal: number
  goalProgress: number
  expected: number
  expectedCount: number
  monthlyTrend: { month: string; amount: number }[]
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`
  return `$${amount.toLocaleString()}`
}

// Framework style constants.
const MONO_EYEBROW: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink-muted, #5F5751)',
}

const FRAUNCES_METRIC: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: 22,
  lineHeight: 1.1,
  color: 'var(--kolor-ink, #1A1613)',
}

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--kolor-canvas, #F7F4EE)',
  border: '1px solid var(--kolor-hairline, #E5E0D8)',
  borderRadius: 12,
  padding: 14,
}

// Kolor-terra chart color for recharts fill.
const KOLOR_TERRA = '#B84A2C'

export default function RevenueDashboard() {
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || ''
        const res = await fetch(`${API_URL}/api/crm/revenue`, {
          credentials: 'include',
        })
        if (res.ok) setStats(await res.json())
      } catch (err) {
        console.error('Failed to fetch revenue:', err)
      }
      setLoading(false)
    }
    fetchRevenue()
  }, [])

  if (loading) {
    return (
      <div
        data-testid="revenue-dashboard-loading"
        style={{
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div className="ks-shimmer" style={{ height: 16, borderRadius: 4, width: 128, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="ks-shimmer" style={{ height: 64, borderRadius: 12 }} />
          ))}
        </div>
        <div className="ks-shimmer" style={{ height: 128, borderRadius: 12 }} />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div
      data-testid="revenue-dashboard"
      style={{
        background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CurrencyDollar weight="duotone" className="w-4 h-4" style={{ color: '#059669' }} />
          </div>
          <div>
            <p style={{ ...MONO_EYEBROW, marginBottom: 2 }}>Overview</p>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 18,
                lineHeight: 1.15,
                color: 'var(--kolor-ink, #1A1613)',
              }}
            >
              Revenue by the numbers
            </h3>
          </div>
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* This Month */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...MONO_EYEBROW, fontSize: 9, letterSpacing: '0.18em' }}>This month</span>
              {stats.monthOverMonth !== 0 && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: stats.monthOverMonth > 0 ? '#059669' : '#DC2626',
                  }}
                >
                  {stats.monthOverMonth > 0 ? <TrendUp className="w-3 h-3" /> : <TrendDown className="w-3 h-3" />}
                  {Math.abs(stats.monthOverMonth)}%
                </span>
              )}
            </div>
            <p data-testid="revenue-this-month" style={{ ...FRAUNCES_METRIC, margin: 0 }}>
              {formatCurrency(stats.thisMonth)}
            </p>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
                color: 'var(--kolor-ink-subtle, #928B84)',
              }}
            >
              {stats.thisMonthCount} payment{stats.thisMonthCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* YTD */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...MONO_EYEBROW, fontSize: 9, letterSpacing: '0.18em' }}>Year to date</span>
              <CalendarBlank className="w-3 h-3" style={{ color: 'var(--kolor-ink-subtle, #928B84)' }} />
            </div>
            <p data-testid="revenue-ytd" style={{ ...FRAUNCES_METRIC, margin: 0 }}>
              {formatCurrency(stats.ytd)}
            </p>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
                color: 'var(--kolor-ink-subtle, #928B84)',
              }}
            >
              of {formatCurrency(stats.yearGoal)} goal
            </p>
          </div>

          {/* Expected / Pipeline — amber semantic preserved */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...MONO_EYEBROW, fontSize: 9, letterSpacing: '0.18em' }}>Pipeline</span>
              <ArrowUpRight className="w-3 h-3" style={{ color: 'var(--kolor-ink-subtle, #928B84)' }} />
            </div>
            <p
              data-testid="revenue-expected"
              style={{
                ...FRAUNCES_METRIC,
                margin: 0,
                color: '#B45309', // amber-700 semantic — pending money
              }}
            >
              {formatCurrency(stats.expected)}
            </p>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
                color: 'var(--kolor-ink-subtle, #928B84)',
              }}
            >
              {stats.expectedCount} pending
            </p>
          </div>

          {/* Goal Progress */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...MONO_EYEBROW, fontSize: 9, letterSpacing: '0.18em' }}>Goal</span>
              <Crosshair className="w-3 h-3" style={{ color: 'var(--kolor-ink-subtle, #928B84)' }} />
            </div>
            <p data-testid="revenue-goal" style={{ ...FRAUNCES_METRIC, margin: 0 }}>
              {stats.goalProgress}%
            </p>
            <div
              style={{
                width: '100%',
                height: 4,
                background: 'var(--kolor-hairline, #E5E0D8)',
                borderRadius: 999,
                marginTop: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 999,
                  width: `${Math.min(stats.goalProgress, 100)}%`,
                  background: KOLOR_TERRA,
                  transition: 'width 500ms ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div style={CARD_STYLE}>
          <p style={{ ...MONO_EYEBROW, marginBottom: 12 }}>Monthly revenue · 12 months</p>
          <div className="h-[140px]" data-testid="revenue-chart" style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
              <BarChart data={stats.monthlyTrend} barSize={16}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--kolor-hairline, #E5E0D8)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fill: 'var(--kolor-ink-muted, #5F5751)',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    letterSpacing: 1.2,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: 'var(--kolor-ink-muted, #5F5751)',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v > 0 ? `$${v >= 1000 ? `${v / 1000}k` : v}` : ''}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                    border: '1px solid var(--kolor-hairline, #E5E0D8)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: 'var(--kolor-ink, #1A1613)',
                    boxShadow: '0 4px 12px rgba(26, 22, 19, 0.06)',
                  }}
                  labelStyle={{
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                    marginBottom: 4,
                  }}
                  itemStyle={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontStyle: 'italic',
                    color: 'var(--kolor-ink, #1A1613)',
                  }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  cursor={{ fill: 'rgba(184, 74, 44, 0.06)' }}
                />
                <Bar dataKey="amount" fill={KOLOR_TERRA} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
