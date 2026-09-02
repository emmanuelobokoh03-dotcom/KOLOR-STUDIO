// iter 293-v3.1-v3b W1 — Studio Pulse card.
//
// Weekly activity rhythm visualization. 6th card in DashboardCards region.
// Hybrid design (Q1a=c): mini bars + Fraunces italic weekly total prominent
// + editorial insight. Meaningful activities only (Q1b=b) — creator studio
// work, excludes PORTAL_VIEWED (client-driven event).
//
// Data source: GET /api/activities/pulse?days=7 (single query, in-memory
// bucketing, backed by @@index([userId, createdAt])).

import { useEffect, useState } from 'react'
import { Pulse } from '@phosphor-icons/react/dist/csr/Pulse'
import DashboardCard from './DashboardCard'

interface DailyActivity {
  date: string
  dayLabel: string
  dayName: string
  count: number
}

interface PulseData {
  last7Days: DailyActivity[]
  weeklyTotal: number
  previousWeekTotal: number
  thisWeekVsLast: number
  generatedAt: string
}

function derivePulseInsight(total: number, delta: number, dayIdx: number): string {
  if (total === 0 && dayIdx <= 1) return 'Fresh week — plenty of room.'
  if (total === 0) return 'Quiet week — space for deep work.'
  if (total >= 30 && delta > 0.2) return 'Busy week — strong momentum.'
  if (total >= 20 && delta > 0.1) return 'Building momentum.'
  if (total >= 15) return 'Steady rhythm.'
  if (total < 5 && delta < -0.3) return 'Quieter than usual.'
  if (total < 8 && dayIdx >= 4) return 'Quiet week — space for deep work.'
  if (delta > 0.3) return 'Stronger than last week.'
  if (delta < -0.3) return 'Slower than last week.'
  return 'Steady rhythm.'
}

function WeeklyBars({ data }: { data: DailyActivity[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        height: 56,
      }}
      data-testid="studio-pulse-bars"
    >
      {data.map((day, i) => {
        const heightPct = (day.count / max) * 100
        const isToday = i === data.length - 1
        return (
          <div
            key={day.date}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
            title={`${day.dayName}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
          >
            <div
              style={{
                width: '100%',
                height: 40,
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(heightPct, day.count > 0 ? 8 : 2)}%`,
                  background:
                    day.count === 0
                      ? 'var(--kolor-hairline, #E5E0D8)'
                      : isToday
                      ? 'var(--kolor-terra, #B84A2C)'
                      : 'var(--kolor-ink-muted, #5F5751)',
                  borderRadius: 2,
                  transition: 'height 300ms ease',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.14em',
                color: isToday
                  ? 'var(--kolor-terra, #B84A2C)'
                  : 'var(--kolor-ink-subtle, #928B84)',
              }}
            >
              {day.dayLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function StudioPulseCard() {
  const [data, setData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const API = (import.meta as any).env?.VITE_API_URL || ''
        const res = await fetch(`${API}/api/activities/pulse?days=7`, { credentials: 'include' })
        if (res.ok && !cancelled) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('[StudioPulseCard] Failed to load pulse:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || !data) {
    return (
      <DashboardCard
        title="Studio pulse"
        meta="This week's rhythm"
        icon={<Pulse weight="duotone" size={20} />}
        testId="studio-pulse-card-loading"
      >
        <div
          style={{
            height: 56,
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            borderRadius: 2,
          }}
          className="ks-shimmer"
        />
      </DashboardCard>
    )
  }

  const dayIdx = new Date().getDay() // 0=Sun ... 6=Sat
  const insight = derivePulseInsight(data.weeklyTotal, data.thisWeekVsLast, dayIdx)
  const deltaPct = Math.round(data.thisWeekVsLast * 100)
  const deltaSign = deltaPct > 0 ? '+' : ''
  const showDelta = data.previousWeekTotal > 0 || data.weeklyTotal > 0

  return (
    <DashboardCard
      title="Studio pulse"
      meta="This week's rhythm"
      icon={<Pulse weight="duotone" size={20} />}
      testId="studio-pulse-card"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          borderTop: '1px solid var(--kolor-hairline, #E5E0D8)',
          paddingTop: 16,
        }}
      >
        {/* Prominent total */}
        <div style={{ flexShrink: 0, minWidth: 96 }}>
          <div
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1,
              color: 'var(--kolor-ink, #1A1613)',
            }}
            data-testid="studio-pulse-total"
          >
            {data.weeklyTotal}
          </div>
          <p
            style={{
              margin: 0,
              marginTop: 6,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-muted, #5F5751)',
            }}
          >
            Activities
          </p>
          {showDelta && (
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:
                  deltaPct > 0
                    ? 'var(--kolor-terra, #B84A2C)'
                    : deltaPct < 0
                    ? 'var(--kolor-ink-subtle, #928B84)'
                    : 'var(--kolor-ink-muted, #5F5751)',
              }}
            >
              {deltaSign}
              {deltaPct}% vs last
            </p>
          )}
        </div>

        {/* Weekly bars */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <WeeklyBars data={data.last7Days} />
        </div>
      </div>

      {/* Editorial insight */}
      <p
        style={{
          margin: 0,
          marginTop: 16,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--kolor-ink-muted, #5F5751)',
        }}
        data-testid="studio-pulse-insight"
      >
        {insight}
      </p>
    </DashboardCard>
  )
}

export default StudioPulseCard
