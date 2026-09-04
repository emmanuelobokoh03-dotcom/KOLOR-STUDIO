// iter Calendar v3-v3a W2 — Scheduling tab shell framework calibration.
// Renders <SchedulingSettings /> (child component migrated in the same
// iteration via surgical search_replace pass) plus a small email
// delivery info panel.

import SchedulingSettings from '../SchedulingSettings'

export default function SchedulingTab() {
  return (
    <div className="space-y-8" data-testid="scheduling-tab">
      <SchedulingSettings />

      <section
        data-testid="scheduling-email-delivery-info"
        style={{
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <p
          style={{
            margin: 0,
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Email delivery
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            lineHeight: 1.55,
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Emails send from{' '}
          <code
            style={{
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 4,
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink, #1A1613)',
            }}
          >
            noreply@kolorstudio.app
          </code>
          . Contact support to use your own domain.
        </p>
      </section>
    </div>
  )
}
