import { ReactNode } from 'react'

/**
 * iter 291-v3a — Base card container used across the Dashboard v3 card
 * taxonomy (Today, Needs Attention, and forthcoming Pipeline Pulse / Recent
 * Work / Community Pulse cards in v3b).
 *
 * Framework-calibrated to match Community v3 + Portfolio v3 aesthetic:
 *   • Fraunces italic title (size configurable via `hero` prop)
 *   • Mono UPPERCASE meta line
 *   • kolor-canvas surface with hairline border
 *   • 24-32px internal padding
 *   • Optional icon on left, optional action element on right
 *
 * Composability: pass any child JSX through `children`. The card handles the
 * outer chrome only.
 */
export interface DashboardCardProps {
  title: string
  meta?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  hero?: boolean
  testId?: string
}

export function DashboardCard({
  title,
  meta,
  icon,
  action,
  children,
  hero = false,
  testId,
}: DashboardCardProps) {
  return (
    <section
      className="mb-4 md:mb-6"
      style={{
        background: 'var(--kolor-canvas, #F7F4EE)',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
        borderRadius: 4,
        padding: hero ? '28px 32px' : '24px 28px',
      }}
      data-testid={testId}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: hero ? 20 : 16,
        }}
      >
        {icon && (
          <div
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--kolor-terra, #B84A2C)',
            }}
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: hero ? 'clamp(28px, 3.5vw, 36px)' : 'clamp(20px, 2.5vw, 24px)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'var(--kolor-ink, #1A1613)',
              margin: 0,
            }}
          >
            {title}
          </h2>
          {meta && (
            <p
              style={{
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle, #928B84)',
                margin: 0,
                marginTop: 6,
              }}
            >
              {meta}
            </p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </header>
      <div>{children}</div>
    </section>
  )
}

export default DashboardCard
