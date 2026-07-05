import { useState, useEffect } from 'react'

// Extracted from SettingsModal.tsx in iter 257. Same behaviour, own file so
// iter 258's settings restructure can move/remove the tab entry cleanly.
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

  return (
    <div className="space-y-6" data-testid="settings-community-panel">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Community profile</h3>
        <p className="text-xs text-text-secondary mb-4" style={{ lineHeight: 1.6 }}>
          Join the KOLOR community to connect with photographers, designers, and fine artists in your industry. Your profile is visible to other community members when public.
        </p>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-background border border-light-200">
        <div>
          <p className="text-xs font-medium text-text-primary">Visible in community</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">Other creatives can find and follow you</p>
        </div>
        <button
          onClick={() => setIsPublic(!isPublic)}
          data-testid="community-public-toggle"
          className="w-10 h-5 rounded-full transition-all flex-shrink-0 relative"
          style={{ background: isPublic ? '#6C2EDB' : '#d1d5db' }}>
          <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
            style={{ left: isPublic ? '1.25rem' : '0.125rem' }} />
        </button>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-background border border-light-200">
        <div>
          <p className="text-xs font-medium text-text-primary">Email notifications</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">Receive emails for likes, comments, DMs and follows</p>
        </div>
        <button
          onClick={() => setEmailsEnabled(!emailsEnabled)}
          data-testid="community-emails-toggle"
          className="w-10 h-5 rounded-full transition-all flex-shrink-0 relative"
          style={{ background: emailsEnabled ? '#6C2EDB' : '#d1d5db' }}>
          <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
            style={{ left: emailsEnabled ? '1.25rem' : '0.125rem' }} />
        </button>
      </div>
      <div>
        <label className="text-xs font-medium text-text-primary block mb-1.5">Bio</label>
        <input type="text" value={bio} onChange={e => setBio(e.target.value.slice(0, 150))}
          placeholder="One sentence about your practice..."
          data-testid="community-bio-input"
          className="w-full text-sm rounded-lg outline-none bg-surface-background border border-light-200 text-text-primary"
          style={{ height: 40, padding: '0 12px' }} />
        <p className="text-[10px] text-text-tertiary mt-1">{bio.length}/150</p>
      </div>
      <div>
        <label className="text-xs font-medium text-text-primary block mb-1.5">City</label>
        <input type="text" value={city} onChange={e => setCity(e.target.value)}
          placeholder="Lagos, Nigeria"
          data-testid="community-city-input"
          className="w-full text-sm rounded-lg outline-none bg-surface-background border border-light-200 text-text-primary"
          style={{ height: 40, padding: '0 12px' }} />
      </div>
      <div>
        <label className="text-xs font-medium text-text-primary block mb-1.5">Availability</label>
        <select value={availability} onChange={e => setAvailability(e.target.value)}
          data-testid="community-availability-select"
          className="w-full text-sm rounded-lg outline-none bg-surface-background border border-light-200 text-text-primary"
          style={{ height: 40, padding: '0 12px' }}>
          <option value="OPEN">{
            (userIndustry === 'FINE_ART' || userIndustry === 'SCULPTURE') ? 'Open to commissions'
            : (userIndustry === 'PHOTOGRAPHY' || userIndustry === 'VIDEOGRAPHY' || userIndustry === 'CONTENT_CREATION') ? 'Open for bookings'
            : 'Available for projects'
          }</option>
          <option value="BOOKED">Currently booked</option>
          <option value="UNAVAILABLE">Taking a break</option>
        </select>
      </div>
      <button onClick={handleSave} disabled={saving}
        data-testid="community-save-btn"
        className="w-full h-10 rounded-lg text-sm font-semibold text-white transition-all"
        style={{ background: saved ? '#3B6D11' : '#6C2EDB' }}>
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save community profile'}
      </button>
    </div>
  )
}
