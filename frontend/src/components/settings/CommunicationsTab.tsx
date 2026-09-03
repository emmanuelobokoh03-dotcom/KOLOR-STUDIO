// iter Settings v3-v3a W2 (Answer B) — Communications tab.
//
// Houses email signature editor + generator. Migrated from BrandStudioTab.
// Reasoning: signature is personal communications hygiene, not brand
// identity — belongs in its own tab, honestly named.

import EmailSignatureSettings from '../EmailSignatureSettings'
import EmailSignatureGenerator from '../EmailSignatureGenerator'

export default function CommunicationsTab() {
  return (
    <div className="space-y-8" data-testid="communications-tab">
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--kolor-ink-muted, #5F5751)',
          marginBottom: 4,
        }}
      >
        Email signature
      </div>
      <p
        style={{
          margin: 0,
          marginBottom: 16,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--kolor-ink-muted, #5F5751)',
        }}
      >
        Appears at the bottom of every outbound email — quotes, contracts,
        reminders, and one-off replies.
      </p>
      <EmailSignatureSettings />
      <EmailSignatureGenerator />
    </div>
  )
}
