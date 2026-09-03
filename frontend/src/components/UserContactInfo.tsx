import { useState, useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import EmailChangeModal from './EmailChangeModal'

/**
 * User contact info editor (iter 259).
 *
 * Edits User-model fields via settingsApi.update() through the shared
 * shared SettingsContext (same provider MoneyTab uses).
 *
 * Real Prisma fields: firstName, lastName, studioName?, phone?, website?
 * Email is display-only — changing it requires a separate verification
 * flow (deferred to a later iteration).
 */
export default function UserContactInfo() {
  const { settings, saving, saved, error, save } = useSettings()

  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [studioName, setStudioName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [website, setWebsite] = useState<string>('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Seed local state once settings load. Subsequent saves come back via
  // the hook and re-seed automatically.
  useEffect(() => {
    if (!settings) return
    setFirstName(settings.firstName ?? '')
    setLastName(settings.lastName ?? '')
    setStudioName(settings.studioName ?? '')
    setPhone(settings.phone ?? '')
    setWebsite(settings.website ?? '')
    setPendingEmail(settings.pendingEmail ?? null)
  }, [settings])

  if (!settings) {
    return <div className="text-sm text-text-secondary">Loading contact info…</div>
  }

  const isDirty =
    firstName !== (settings.firstName ?? '') ||
    lastName !== (settings.lastName ?? '') ||
    studioName !== (settings.studioName ?? '') ||
    phone !== (settings.phone ?? '') ||
    website !== (settings.website ?? '')

  const handleSave = () => {
    save({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      studioName: studioName.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
    })
  }

  return (
    <section className="space-y-4" data-testid="user-contact-info">
      <div>
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
          Contact info
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          How your name and studio appear on quotes, contracts, and outbound emails.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--kolor-ink, #1A1613)' }}>First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 rounded-md kolor-input"
            style={{
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink, #1A1613)',
            }}
            data-testid="user-contact-first-name-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--kolor-ink, #1A1613)' }}>Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 rounded-md kolor-input"
            style={{
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink, #1A1613)',
            }}
            data-testid="user-contact-last-name-input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--kolor-ink, #1A1613)' }}>Studio name</label>
          <input
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            disabled={saving}
            placeholder="Your business name"
            className="w-full px-3 py-2 rounded-md kolor-input"
            style={{
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink, #1A1613)',
            }}
            data-testid="user-contact-studio-name-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--kolor-ink, #1A1613)' }}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
            placeholder="Optional"
            className="w-full px-3 py-2 rounded-md kolor-input"
            style={{
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink, #1A1613)',
            }}
            data-testid="user-contact-phone-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--kolor-ink, #1A1613)' }}>Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={saving}
            placeholder="https://yourstudio.com"
            className="w-full px-3 py-2 rounded-md kolor-input"
            style={{
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink, #1A1613)',
            }}
            data-testid="user-contact-website-input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--kolor-ink, #1A1613)' }}>Email</label>
          <div className="flex gap-2 items-center">
            <input
              type="email"
              value={settings.email}
              readOnly
              className="flex-1 px-3 py-2 rounded-md cursor-not-allowed"
              style={{
                background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                color: 'var(--kolor-ink-muted, #5F5751)',
              }}
              data-testid="user-contact-email-input"
            />
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="px-4 py-2 rounded-md whitespace-nowrap transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                color: 'var(--kolor-ink, #1A1613)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              data-testid="user-contact-change-email-button"
            >
              Change
            </button>
          </div>
          {pendingEmail ? (
            <p className="text-xs mt-1" style={{ color: 'var(--kolor-terra, #B84A2C)' }} data-testid="user-contact-pending-email">
              Pending change: <strong>{pendingEmail}</strong>. Check your new inbox for the
              verification link (expires in 15 minutes).
            </p>
          ) : (
            <p className="text-xs mt-1" style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}>
              Changing your email requires verification at the new address.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="px-4 py-2 rounded-md disabled:opacity-50 transition-colors"
          style={{
            background: 'var(--kolor-terra, #B84A2C)',
            color: 'var(--kolor-canvas, #F7F4EE)',
            border: '1px solid var(--kolor-terra, #B84A2C)',
          }}
          data-testid="user-contact-save-button"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && (
          <span
            className="text-sm"
            style={{ color: 'var(--kolor-terra, #B84A2C)' }}
            data-testid="user-contact-saved"
          >
            Saved ✓
          </span>
        )}
        {error && <span className="text-sm text-red-500" data-testid="user-contact-error">{error}</span>}
      </div>

      {showEmailModal && (
        <EmailChangeModal
          currentEmail={settings.email}
          onClose={() => setShowEmailModal(false)}
          onSuccess={(p) => setPendingEmail(p)}
        />
      )}
    </section>
  )
}
