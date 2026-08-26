// iter 292-v3c — Clients v3 Studio Wall empty state helper.
//
// Extends Portfolio v3c "space held" empty pattern (three hairline
// frames) into a reusable component for Clients v3 empty surfaces.
// Framework-calibrated: Fraunces italic heading + Inter body +
// mono UPPERCASE eyebrow + kolor-terra optional CTA.

interface ClientsEmptyStateProps {
  eyebrow?: string
  title: string
  description: string
  cta?: { label: string; onClick: () => void }
  testId?: string
  compact?: boolean
}

const frameBaseStyle: React.CSSProperties = {
  border: '1px solid var(--kolor-hairline, #E5E0D8)',
  background: 'transparent',
}

export function ClientsEmptyState({
  eyebrow,
  title,
  description,
  cta,
  testId = 'clients-empty-state',
  compact = false,
}: ClientsEmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: compact ? '32px 16px' : '56px 16px 72px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 10 : 14,
      }}
      data-testid={testId}
    >
      {/* Three hairline frames (Studio Wall echo) */}
      {!compact && (
        <div
          aria-hidden
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            marginBottom: 12,
          }}
          data-testid={`${testId}-visual-anchor`}
        >
          <div style={{ ...frameBaseStyle, width: 32, height: 44 }} />
          <div style={{ ...frameBaseStyle, width: 44, height: 60 }} />
          <div style={{ ...frameBaseStyle, width: 32, height: 40 }} />
        </div>
      )}

      {eyebrow && (
        <p
          style={{
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-subtle, #928B84)',
            margin: 0,
          }}
        >
          {eyebrow}
        </p>
      )}

      <h3
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: compact ? 18 : 24,
          color: 'var(--kolor-ink, #1A1613)',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          color: 'var(--kolor-ink-muted, #5F5751)',
          margin: 0,
          maxWidth: 380,
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>

      {cta && (
        <button
          onClick={cta.onClick}
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'var(--kolor-terra, #B84A2C)',
            color: 'var(--kolor-canvas, #F7F4EE)',
            border: 'none',
            borderRadius: 2,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          data-testid={`${testId}-cta`}
        >
          {cta.label} →
        </button>
      )}
    </div>
  )
}

export default ClientsEmptyState
