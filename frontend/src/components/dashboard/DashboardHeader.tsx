// iter 289-v3c3c — Extracted from Dashboard.tsx to reduce line count and
// isolate the greeting header. Pure refactor: no behavior changes. All
// state remains owned by Dashboard.tsx; values arrive here as props.
//
// The `viewMode === 'community'` branch preserves v3c3b Community-scoped
// framework calibration (Fraunces italic 24px greeting + mono UPPERCASE
// meta). Non-Community views retain their existing bold sans styling
// until the full Dashboard redesign lands.

interface DashboardHeaderProps {
  viewMode: string
  firstName: string
  greeting: string
  metaText: string
  currentDate: string
}

export default function DashboardHeader({
  viewMode,
  firstName,
  greeting,
  metaText,
  currentDate,
}: DashboardHeaderProps) {
  return (
    <div className="hidden lg:block">
      {viewMode === 'community' ? (
        <>
          {/* iter 289-v3c3b — Community-scoped framework calibration.
              Fraunces italic greeting + mono UPPERCASE meta line.
              Preserves default styling on all other views until the
              full Dashboard redesign lands. */}
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '24px',
              color: 'var(--kolor-ink)',
              lineHeight: 1.15,
            }}
          >
            {greeting}, {firstName}{' '}
            <span style={{ color: 'var(--kolor-terra)', fontStyle: 'normal' }}>&#10022;</span>
          </h1>
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle)',
              marginTop: '4px',
            }}
          >
            {metaText} · {currentDate}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-[17px] font-extrabold tracking-[-0.015em] text-text-primary">
            {greeting}, {firstName} <span style={{ color: '#a78bfa' }}>&#10022;</span>
          </h1>
          <p className="text-xs text-text-secondary">
            {metaText} · {currentDate}
          </p>
        </>
      )}
    </div>
  )
}
