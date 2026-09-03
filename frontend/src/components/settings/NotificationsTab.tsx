// iter Settings v3-v3a.1 — Cross-arc corrective (Path 1): honest transparent
// placeholder copy replacing the vague "future update" wording. Component
// preserved intact for the Settings v3.1 preferences UI work.

import { useSettings } from '../../contexts/SettingsContext'

export default function NotificationsTab() {
  const { settings } = useSettings()

  if (!settings) {
    return (
      <div
        className="text-sm"
        style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
      >
        Loading notification preferences…
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="notifications-tab">
      <section>
        <p
          style={{
            margin: 0,
            marginBottom: 12,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Notifications
        </p>

        <h3
          style={{
            margin: 0,
            marginBottom: 12,
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 24,
            lineHeight: 1.15,
            color: 'var(--kolor-ink, #1A1613)',
          }}
        >
          We handle notifications thoughtfully by default.
        </h3>

        <p
          style={{
            margin: 0,
            marginBottom: 16,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          No configuration needed for now — the essentials fire automatically.
        </p>

        <ul
          data-testid="notifications-defaults-list"
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            lineHeight: 1.55,
            color: 'var(--kolor-ink, #1A1613)',
          }}
        >
          <li style={{ paddingLeft: 16, position: 'relative' }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                top: 8,
                width: 6,
                height: 1,
                background: 'var(--kolor-terra, #B84A2C)',
              }}
            />
            Community activity — likes, comments, DMs, follows in real time
          </li>
          <li style={{ paddingLeft: 16, position: 'relative' }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                top: 8,
                width: 6,
                height: 1,
                background: 'var(--kolor-terra, #B84A2C)',
              }}
            />
            Client actions — viewed quote, signed contract, deposit paid
          </li>
          <li style={{ paddingLeft: 16, position: 'relative' }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                top: 8,
                width: 6,
                height: 1,
                background: 'var(--kolor-terra, #B84A2C)',
              }}
            />
            System updates — in-app announcements when they matter
          </li>
        </ul>

        <p
          style={{
            margin: 0,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--kolor-hairline, #E5E0D8)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            lineHeight: 1.6,
            fontStyle: 'italic',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Detailed preferences arrive with the beta email templates release.
          Manage community email opt-out in the Community tab meanwhile.
        </p>
      </section>
    </div>
  )
}
