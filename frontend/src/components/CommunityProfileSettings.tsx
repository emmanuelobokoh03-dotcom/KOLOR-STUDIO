// iter Settings v3-v3a.2 — second cross-arc corrective.
// CommunityProfileSettings framework calibration (Case B moderate
// refactor). Legacy palette migrated to framework tokens, typography
// hierarchy added (mono UPPERCASE eyebrow + Fraunces italic heading),
// "KOLOR community" copy softened per Answer B positioning.

import { useState, useEffect } from 'react'

export default function CommunityProfileSettings() {
  const API = (import.meta as any).env?.VITE_API_URL || ''
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [availability, setAvailability] = useState('OPEN')
  const [emailsEnabled, setEmailsEnabled] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userIndustry, setUserIndustry] = useState('')

  useEffect(() => {
    fetch(`${API}/api/community/profile/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setBio(d.profile.bio || '')
          setCity(d.profile.city || '')
          setAvailability(d.profile.availability || 'OPEN')
          setEmailsEnabled(d.profile.communityEmailsEnabled !== false)
          setIsPublic(d.profile.isPublic !== false)
          setUserIndustry(d.profile.user?.primaryIndustry || '')
        }
      }).catch(() => {})
  }, [API])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/community/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bio, city, availability, isPublic, communityEmailsEnabled: emailsEnabled }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch { /* silent */ }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--kolor-canvas, #F7F4EE)',
    border: '1px solid var(--kolor-hairline, #E5E0D8)',
    color: 'var(--kolor-ink, #1A1613)',
    height: 40,
    padding: '0 12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'border-color 150ms ease',
  }

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)'
  }
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)'
  }

  return (
    <div className="space-y-6" data-testid="settings-community-panel">
      <div>
        <p
          style={{
            margin: 0,
            marginBottom: 8,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Community profile
        </p>
        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 22,
            lineHeight: 1.2,
            color: 'var(--kolor-ink, #1A1613)',
          }}
        >
          Your presence in the community.
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Connect with photographers, designers, and fine artists in your industry. Your profile is visible to other community members when public.
        </p>
      </div>

      <div
        className="flex items-center justify-between p-3 rounded-lg"
        style={{
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--kolor-ink, #1A1613)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Visible in community
          </p>
          <p style={{ margin: 0, marginTop: 2, fontSize: 11, color: 'var(--kolor-ink-subtle, #928B84)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Other creatives can find and follow you
          </p>
        </div>
        <button
          onClick={() => setIsPublic(!isPublic)}
          data-testid="community-public-toggle"
          aria-label="Toggle community visibility"
          className="w-10 h-5 rounded-full transition-all flex-shrink-0 relative"
          style={{ background: isPublic ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-hairline, #E5E0D8)' }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
            style={{ left: isPublic ? '1.25rem' : '0.125rem' }}
          />
        </button>
      </div>

      <div
        className="flex items-center justify-between p-3 rounded-lg"
        style={{
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--kolor-ink, #1A1613)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Email notifications
          </p>
          <p style={{ margin: 0, marginTop: 2, fontSize: 11, color: 'var(--kolor-ink-subtle, #928B84)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Receive emails for likes, comments, DMs and follows
          </p>
        </div>
        <button
          onClick={() => setEmailsEnabled(!emailsEnabled)}
          data-testid="community-emails-toggle"
          aria-label="Toggle community email notifications"
          className="w-10 h-5 rounded-full transition-all flex-shrink-0 relative"
          style={{ background: emailsEnabled ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-hairline, #E5E0D8)' }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
            style={{ left: emailsEnabled ? '1.25rem' : '0.125rem' }}
          />
        </button>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Bio
        </label>
        <input
          type="text"
          value={bio}
          onChange={e => setBio(e.target.value.slice(0, 150))}
          placeholder="One sentence about your practice…"
          data-testid="community-bio-input"
          className="w-full text-sm rounded-lg outline-none"
          style={inputStyle}
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <p style={{ margin: 0, marginTop: 4, fontSize: 10, color: 'var(--kolor-ink-subtle, #928B84)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {bio.length}/150
        </p>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          City
        </label>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Lagos, Nigeria"
          data-testid="community-city-input"
          className="w-full text-sm rounded-lg outline-none"
          style={inputStyle}
          onFocus={focusInput}
          onBlur={blurInput}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Availability
        </label>
        <select
          value={availability}
          onChange={e => setAvailability(e.target.value)}
          data-testid="community-availability-select"
          className="w-full text-sm rounded-lg outline-none"
          style={inputStyle}
          onFocus={focusInput}
          onBlur={blurInput}
        >
          <option value="OPEN">{
            (userIndustry === 'FINE_ART' || userIndustry === 'SCULPTURE') ? 'Open to commissions'
            : (userIndustry === 'PHOTOGRAPHY' || userIndustry === 'VIDEOGRAPHY' || userIndustry === 'CONTENT_CREATION') ? 'Open for bookings'
            : 'Available for projects'
          }</option>
          <option value="BOOKED">Currently booked</option>
          <option value="UNAVAILABLE">Taking a break</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        data-testid="community-save-btn"
        className="w-full h-10 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
        style={{
          background: saved ? '#059669' : 'var(--kolor-terra, #B84A2C)',
          color: '#F7F4EE',
          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 12,
        }}
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save community profile'}
      </button>
    </div>
  )
}
