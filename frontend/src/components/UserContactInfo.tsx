import { useState, useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'

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

  // Seed local state once settings load. Subsequent saves come back via
  // the hook and re-seed automatically.
  useEffect(() => {
    if (!settings) return
    setFirstName(settings.firstName ?? '')
    setLastName(settings.lastName ?? '')
    setStudioName(settings.studioName ?? '')
    setPhone(settings.phone ?? '')
    setWebsite(settings.website ?? '')
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
        <h3 className="text-lg font-semibold text-text-primary mb-1">Contact info</h3>
        <p className="text-sm text-text-secondary">
          How your name and studio appear on quotes, contracts, and outbound emails.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
            data-testid="user-contact-first-name-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
            data-testid="user-contact-last-name-input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-1">Studio name</label>
          <input
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            disabled={saving}
            placeholder="Your business name"
            className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
            data-testid="user-contact-studio-name-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
            data-testid="user-contact-phone-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={saving}
            placeholder="https://yourstudio.com"
            className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
            data-testid="user-contact-website-input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
          <input
            type="email"
            value={settings.email}
            disabled
            className="w-full px-3 py-2 border border-border rounded-md bg-surface-muted text-text-secondary cursor-not-allowed"
            data-testid="user-contact-email-input"
          />
          <p className="text-xs text-text-secondary mt-1">
            Changing email requires verification (coming soon).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 disabled:opacity-50"
          data-testid="user-contact-save-button"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-sm text-brand-primary" data-testid="user-contact-saved">Saved ✓</span>}
        {error && <span className="text-sm text-red-500" data-testid="user-contact-error">{error}</span>}
      </div>
    </section>
  )
}
