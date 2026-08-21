// iter 289-v3c3c — Extracted from Dashboard.tsx to reduce line count and
// isolate the greeting header. Pure refactor: no behavior changes. All
// state remains owned by Dashboard.tsx; values arrive here as props.
//
// iter 291-v3c.1 — Framework calibration extended to ALL viewMode
// branches uniformly (was previously scoped to Community only). Today,
// Portfolio, Calendar, Clients, Analytics, Sequences, Quotes, Contracts
// all now share the Fraunces italic greeting + mono UPPERCASE meta.

// Note: `viewMode` prop retained in case future variations want subtle
// per-section differentiation, but currently unused.
interface DashboardHeaderProps {
  viewMode: string
  firstName: string
  greeting: string
  metaText: string
  currentDate: string
}

export default function DashboardHeader({
  firstName,
  greeting,
  metaText,
  currentDate,
}: DashboardHeaderProps) {
  return (
    <div className="hidden lg:block">
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
    </div>
  )
}
