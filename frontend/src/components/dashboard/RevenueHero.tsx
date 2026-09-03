// iter 293-v3.1-v3a — Revenue Hero (Path C hero metric strip).
// iter Settings v3-v3a.1 — Cross-arc corrective: persistence bug fix.
// Refactored fetch from useEffect + useState to @tanstack/react-query so
// data survives view mount cycles + page refreshes via query cache.
// staleTime 60s, gcTime 5min, query key ['revenue'].
//
// Renders above DashboardCards on Today view. Reads GET /api/crm/revenue.
// Click the metric or goal label → opens RevenueDetailModal (deep view
// wrapping existing RevenueDashboard + RevenueGoalWidget).
//
// Framework calibration: kolor-canvas-shade-1 container + kolor-hairline
// bottom + Fraunces italic primary metric + mono UPPERCASE eyebrows +
// kolor-terra goal ring + inline SVG sparkline.

import { useQuery } from '@tanstack/react-query'

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

interface RevenueHeroProps {
  currencySymbol?: string
  onOpenDetail: () => void
}

function formatMoney(amount: number, symbol: string): string {
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`
  }
  return `${symbol}${amount.toLocaleString()}`
}

function deriveEditorialInsight(
  thisMonth: number,
  yearGoal: number,
  trend: { amount: number }[]
): string {
  const monthlyGoal = yearGoal > 0 ? yearGoal / 12 : 0
  if (monthlyGoal === 0 && thisMonth === 0) return 'Set a yearly goal to track your rhythm.'
  if (monthlyGoal === 0) return 'Set a yearly goal to track your rhythm.'

  const progress = thisMonth / monthlyGoal
  const recent = trend.slice(-3).map((t) => t.amount)
  const avgLast3 = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
  const trendDelta = avgLast3 > 0 ? (thisMonth - avgLast3) / avgLast3 : 0
  const dayOfMonth = new Date().getDate()

  if (progress >= 1.1) return 'Ahead of goal.'
  if (progress >= 0.95) return 'On pace.'
  if (progress >= 0.7 && trendDelta > 0.1) return 'Building momentum.'
  if (progress < 0.5 && dayOfMonth > 15) return 'Slow month — quiet is okay.'
  if (trendDelta > 0.2) return 'Strong compared to recent months.'
  if (progress > 0) return 'Steady rhythm.'
  return 'Nothing booked yet — a fresh page.'
}

function MonthlySparkline({ data }: { data: { amount: number }[] }) {
  if (data.length < 2) {
    return (
      <div
        style={{
          height: 24,
          fontSize: 10,
          color: 'var(--kolor-ink-subtle, #928B84)',
          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        —
      </div>
    )
  }
  const amounts = data.map((d) => d.amount)
  const max = Math.max(...amounts, 1)
  const width = 96
  const height = 24
  const points = amounts
    .map((val, i) => {
      const x = (i / (amounts.length - 1)) * width
      const y = height - (val / max) * (height - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="var(--kolor-terra, #B84A2C)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GoalRing({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress))
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped)
  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
      <svg width={48} height={48} viewBox="0 0 48 48" aria-hidden>
        <circle
          cx={24}
          cy={24}
          r={radius}
          fill="none"
          stroke="var(--kolor-hairline, #E5E0D8)"
          strokeWidth={2}
        />
        <circle
          cx={24}
          cy={24}
          r={radius}
          fill="none"
          stroke="var(--kolor-terra, #B84A2C)"
          strokeWidth={2}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.06em',
          color: 'var(--kolor-ink, #1A1613)',
        }}
      >
        {Math.round(clamped * 100)}%
      </span>
    </div>
  )
}

export default function RevenueHero({ currencySymbol = '$', onOpenDetail }: RevenueHeroProps) {
  // iter Settings v3-v3a.1 — React Query replaces useEffect+useState.
  // Persistent cache means the hero survives view mount cycles + refresh
  // hydration races. Silent-failure regression eliminated: on fetch error,
  // useQuery gives us an explicit error state so we render zero-state
  // instead of collapsing to null.
  const { data: stats, isLoading, isError } = useQuery<RevenueStats>({
    queryKey: ['revenue'],
    queryFn: async () => {
      const API = (import.meta as any).env?.VITE_API_URL || ''
      const res = await fetch(`${API}/api/crm/revenue`, { credentials: 'include' })
      if (!res.ok) throw new Error(`Revenue fetch failed: ${res.status}`)
      return res.json()
    },
    staleTime: 60 * 1000, // 60s — fresher than the app-wide 5min default
    gcTime: 5 * 60 * 1000, // 5min cache retention
  })

  if (isLoading) {
    return (
      <div
        data-testid="revenue-hero-loading"
        style={{
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
          padding: '28px 32px',
          marginBottom: 24,
          height: 140,
        }}
      />
    )
  }

  // iter Settings v3-v3a.1 — Persistent surface even on error / empty
  // stats. Previously `if (!stats) return null` collapsed the hero
  // silently on any fetch failure or race, causing the persistence bug.
  const safeStats: RevenueStats = stats ?? {
    thisMonth: 0,
    thisMonthCount: 0,
    monthOverMonth: 0,
    ytd: 0,
    yearGoal: 0,
    goalProgress: 0,
    expected: 0,
    expectedCount: 0,
    monthlyTrend: [],
  }

  const monthlyGoal = safeStats.yearGoal > 0 ? safeStats.yearGoal / 12 : 0
  const monthlyProgress = monthlyGoal > 0 ? safeStats.thisMonth / monthlyGoal : 0
  const insight = isError
    ? 'Revenue temporarily unavailable — will refresh shortly.'
    : deriveEditorialInsight(safeStats.thisMonth, safeStats.yearGoal, safeStats.monthlyTrend)

  return (
    <section
      data-testid="revenue-hero"
      style={{
        background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
        borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
        padding: '28px 32px',
        marginBottom: 24,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 32,
          alignItems: 'center',
        }}
        className="revenue-hero-grid"
      >
        <style>{`
          @media (max-width: 640px) {
            .revenue-hero-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 20px !important; }
            .revenue-hero-secondary { justify-content: flex-start !important; }
          }
        `}</style>

        {/* Primary metric column */}
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-muted, #5F5751)',
              marginBottom: 6,
            }}
          >
            This month · YTD {formatMoney(safeStats.ytd, currencySymbol)}
          </p>
          <button
            onClick={onOpenDetail}
            data-testid="revenue-hero-metric"
            style={{
              display: 'block',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1.05,
              color: 'var(--kolor-ink, #1A1613)',
              transition: 'color 200ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--kolor-terra, #B84A2C)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--kolor-ink, #1A1613)' }}
          >
            {formatMoney(safeStats.thisMonth, currencySymbol)}
          </button>
          <p
            style={{
              margin: 0,
              marginTop: 8,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              color: 'var(--kolor-ink-muted, #5F5751)',
              fontStyle: 'italic',
            }}
            data-testid="revenue-hero-insight"
          >
            {insight}
          </p>
        </div>

        {/* Secondary column: goal ring + sparkline */}
        <div
          className="revenue-hero-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexShrink: 0,
          }}
        >
          {safeStats.yearGoal > 0 && (
            <button
              onClick={onOpenDetail}
              data-testid="revenue-hero-goal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <GoalRing progress={monthlyProgress} />
              <div style={{ textAlign: 'left' }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                    lineHeight: 1.4,
                  }}
                >
                  Of {formatMoney(monthlyGoal, currencySymbol)}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                    lineHeight: 1.4,
                  }}
                >
                  Monthly goal
                </p>
              </div>
            </button>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              paddingLeft: safeStats.yearGoal > 0 ? 20 : 0,
              borderLeft: safeStats.yearGoal > 0 ? '1px solid var(--kolor-hairline, #E5E0D8)' : 'none',
            }}
          >
            <MonthlySparkline data={safeStats.monthlyTrend} />
            <p
              style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle, #928B84)',
              }}
            >
              6 mo trend
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
