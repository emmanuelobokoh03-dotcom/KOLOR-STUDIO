import { useState, useEffect } from 'react'
import KolorSpinner from './KolorSpinner'

const API = (import.meta as any).env?.VITE_API_URL || ''

const INDUSTRY_AVATAR_COLORS: Record<string, string> = {
  PHOTOGRAPHY: '#1A6B4A', VIDEOGRAPHY: '#1A6B4A', CONTENT_CREATION: '#1A6B4A',
  DESIGN: '#6C2EDB', GRAPHIC_DESIGN: '#6C2EDB', WEB_DESIGN: '#6C2EDB', BRANDING: '#6C2EDB', ILLUSTRATION: '#6C2EDB',
  FINE_ART: '#A32D2D', SCULPTURE: '#A32D2D',
}

const INDUSTRY_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'FINE_ART', label: 'Fine Art' },
]

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: '#3B6D11' },
  BOOKED: { label: 'Booked', color: '#E8891A' },
  UNAVAILABLE: { label: 'Taking a break', color: 'var(--text-tertiary)' },
}

const INDUSTRY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  DESIGN: 'Design',
  FINE_ART: 'Fine Art',
  GRAPHIC_DESIGN: 'Design',
  VIDEOGRAPHY: 'Photography',
  OTHER: 'Creative',
}

export default function CommunityDiscover({ onStartDM }: { onStartDM?: (profileId: string) => void }) {
  const [industry, setIndustry] = useState('ALL')
  const [cityFilter, setCityFilter] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [following, setFollowing] = useState<Set<string>>(new Set())

  const fetchProfiles = async (ind: string, cur?: string | null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ industry: ind })
      if (cityFilter.trim()) params.set('city', cityFilter.trim())
      if (cur) params.set('cursor', cur)
      const res = await fetch(`${API}/api/community/discover?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (cur) setProfiles(prev => [...prev, ...(data.profiles || [])])
      else setProfiles(data.profiles || [])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch { /* silent */ }
    setLoading(false)
  }

  // Fetch who we already follow so buttons show "Following" correctly
  useEffect(() => {
    fetch(`${API}/api/community/following/mine`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.followingIds) setFollowing(new Set(d.followingIds)) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setProfiles([])
    setCursor(null)
    fetchProfiles(industry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, cityFilter])

  const handleFollow = async (profileId: string) => {
    try {
      const res = await fetch(`${API}/api/community/follows/${profileId}`, {
        method: 'POST', credentials: 'include'
      })
      const data = await res.json()
      setFollowing(prev => {
        const next = new Set(prev)
        if (data.following) next.add(profileId)
        else next.delete(profileId)
        return next
      })
    } catch { /* silent */ }
  }

  const handleMessage = async (profileId: string) => {
    try {
      await fetch(`${API}/api/community/dms/${profileId}`, {
        method: 'POST', credentials: 'include'
      })
      onStartDM?.(profileId)
    } catch { /* silent */ }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="community-discover" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}>
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {INDUSTRY_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setIndustry(f.value)}
            data-testid={`discover-filter-${f.value.toLowerCase()}`}
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{
              background: industry === f.value ? '#6C2EDB' : 'var(--surface-background)',
              color: industry === f.value ? '#fff' : 'var(--text-secondary)',
              border: '0.5px solid ' + (industry === f.value ? '#6C2EDB' : 'var(--border)'),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* City filter */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={cityInput}
          onChange={e => setCityInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setCityFilter(cityInput)}
          placeholder="Filter by city..."
          className="flex-1 text-xs rounded-full px-4 py-2 outline-none"
          style={{
            border: '0.5px solid var(--border)',
            background: 'var(--surface-background)',
            color: 'var(--text-primary)',
          }}
        />
        {cityInput && (
          <button
            onClick={() => setCityFilter(cityInput)}
            className="text-xs font-medium px-3 py-2 rounded-full flex-shrink-0 text-white"
            style={{ background: '#6C2EDB' }}>
            Search
          </button>
        )}
        {cityFilter && (
          <button
            onClick={() => { setCityFilter(''); setCityInput('') }}
            className="text-xs px-3 py-2 rounded-full flex-shrink-0"
            style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            Clear
          </button>
        )}
      </div>

      {loading && profiles.length === 0 ? (
        <div className="flex justify-center py-12"><KolorSpinner size={28} /></div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
          No profiles to discover yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map(profile => {
              const name = `${profile.user?.firstName || ''} ${profile.user?.lastName || ''}`.trim()
              const initials = name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
              const avail = AVAILABILITY_LABELS[profile.availability] || AVAILABILITY_LABELS.OPEN
              const industryLabel = INDUSTRY_LABELS[profile.user?.primaryIndustry] || 'Creative'
              const isFollowing = following.has(profile.id)

              return (
                <div key={profile.id} className="p-4 rounded-2xl"
                  data-testid={`discover-profile-${profile.id}`}
                  style={{ background: 'var(--surface-base)', border: '0.5px solid var(--border)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: INDUSTRY_AVATAR_COLORS[profile.user?.primaryIndustry || ''] || '#6C2EDB' }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        {industryLabel}{profile.city ? ` · ${profile.city}` : ''}
                      </p>
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: avail.color, background: avail.color + '18' }}>
                      {avail.label}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleFollow(profile.id)}
                        data-testid={`discover-follow-${profile.id}`}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                        style={{
                          background: isFollowing ? 'var(--surface-background)' : '#6C2EDB',
                          color: isFollowing ? 'var(--text-secondary)' : '#fff',
                          border: '0.5px solid ' + (isFollowing ? 'var(--border)' : '#6C2EDB'),
                          transition: 'transform 0.1s, opacity 0.1s',
                        }}
                        onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
                        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
                        onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
                        onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      {onStartDM && (
                        <button
                          onClick={() => handleMessage(profile.id)}
                          data-testid={`discover-message-${profile.id}`}
                          className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                          style={{
                            background: 'var(--surface-background)',
                            color: 'var(--text-secondary)',
                            border: '0.5px solid var(--border)',
                            transition: 'transform 0.1s, opacity 0.1s',
                          }}
                          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
                          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
                          onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
                          onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}>
                          DM
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {hasMore && (
            <button
              onClick={() => fetchProfiles(industry, cursor)}
              data-testid="discover-load-more"
              className="w-full text-xs text-[var(--text-tertiary)] py-4 text-center hover:text-[var(--text-secondary)] mt-3 transition-colors">
              Load more
            </button>
          )}
        </>
      )}
    </div>
  )
}
