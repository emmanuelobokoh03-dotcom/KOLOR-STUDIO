import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import KolorSpinner from './KolorSpinner'
import FilterChipBar from './community/FilterChipBar'
import type { CreativeIndustry } from '../lib/communityTaxonomy'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface CreatorRow {
  id: string
  handle?: string | null
  bio?: string | null
  city?: string | null
  availability?: string | null
  subHeadline?: string | null
  user: { firstName: string; lastName?: string; primaryIndustry?: string | null }
  posts?: Array<{ id: string; mainImage?: string | null }>
  _count?: { posts: number; followers: number }
}

const INDUSTRY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  DESIGN: 'Design',
  FINE_ART: 'Fine Art',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  ILLUSTRATION: 'Illustration',
  BRANDING: 'Branding',
  SCULPTURE: 'Sculpture',
}

// iter 287-v3c — Designer Browse (rewrite of CommunityDiscover).
// Visual-first grid of creators with hero shot preview per card + industry
// filter chips + city input. Click creator → /creator/:handle.
// Preserves onStartDM prop for backwards compatibility with Dashboard.
export default function CommunityDiscover({ onStartDM }: { onStartDM?: (profileId: string) => void }) {
  const navigate = useNavigate()
  const [industry, setIndustry] = useState<CreativeIndustry | 'ALL'>('ALL')
  const [cityFilter, setCityFilter] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [profiles, setProfiles] = useState<CreatorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [followingInFlight, setFollowingInFlight] = useState<Set<string>>(new Set())
  const [dmInFlight, setDmInFlight] = useState<Set<string>>(new Set())

  const fetchProfiles = useCallback(async (ind: string, q: string, cur?: string | null) => {
    try {
      const params = new URLSearchParams({ industry: ind })
      // iter 289-v3c3b — Discover search extended from city-only to compound
      // search (creator name / city / sub-headline) via ?q param. Backend
      // performs case-insensitive contains across all three fields.
      if (q.trim()) params.set('q', q.trim())
      if (cur) params.set('cursor', cur)
      const res = await fetch(`${API}/api/community/discover?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (cur) setProfiles((prev) => [...prev, ...(data.profiles || [])])
      else setProfiles(data.profiles || [])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (err) {
      console.error('[Community] Failed to load profiles:', err)
      toast.error('Could not load creators. Try again.')
    }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    fetch(`${API}/api/community/following/mine`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.followingIds) setFollowing(new Set(d.followingIds))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setProfiles([])
    setCursor(null)
    fetchProfiles(industry, cityFilter)
  }, [industry, cityFilter, fetchProfiles])

  const handleCitySubmit = () => setCityFilter(cityInput.trim())

  const handleFollowToggle = async (profileId: string) => {
    if (followingInFlight.has(profileId)) return
    setFollowingInFlight((prev) => new Set([...prev, profileId]))
    const isFollowing = following.has(profileId)
    try {
      const res = await fetch(`${API}/api/community/follows/${profileId}`, {
        method: isFollowing ? 'DELETE' : 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        setFollowing((prev) => {
          const next = new Set(prev)
          if (isFollowing) next.delete(profileId)
          else next.add(profileId)
          return next
        })
      }
    } catch {
      toast.error('Follow action failed')
    }
    setFollowingInFlight((prev) => {
      const next = new Set(prev)
      next.delete(profileId)
      return next
    })
  }

  const handleStartDM = async (profileId: string) => {
    if (dmInFlight.has(profileId)) return
    setDmInFlight((prev) => new Set([...prev, profileId]))
    try {
      // iter 289-v3c3a — hit find-or-create so we route to a specific thread
      const res = await fetch(`${API}/api/community/dms/${profileId}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data?.thread?.id) {
        navigate(`/dashboard?view=community&subtab=dms&thread=${data.thread.id}`)
      } else if (onStartDM) {
        // Fallback for legacy Dashboard consumer expecting the prop
        onStartDM(profileId)
      } else {
        toast.error('Could not start conversation')
      }
    } catch {
      toast.error('Could not start conversation')
    } finally {
      setDmInFlight((prev) => {
        const next = new Set(prev)
        next.delete(profileId)
        return next
      })
    }
  }

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    fetchProfiles(industry, cityFilter, cursor)
  }

  return (
    <div
      data-testid="designer-browse"
      style={{
        background: 'var(--kolor-canvas)',
        minHeight: '100vh',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      }}
    >
      {/* City input row */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: '240px', flex: '1 1 260px', maxWidth: '360px' }}>
          <label
            htmlFor="creator-city"
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle)',
              marginBottom: '6px',
            }}
          >
            Search creators
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              id="creator-city"
              data-testid="creator-city-input"
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCitySubmit()}
              placeholder="Search creators, cities, or specializations…"
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--kolor-hairline)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: 'var(--kolor-ink)',
                outline: 'none',
              }}
            />
            {(cityInput || cityFilter) && (
              <button
                onClick={() => {
                  setCityInput('')
                  setCityFilter('')
                }}
                data-testid="creator-city-clear"
                style={{
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--kolor-hairline)',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-subtle)',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <span
          data-testid="creator-count"
          style={{
            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-subtle)',
          }}
        >
          {profiles.length} {profiles.length === 1 ? 'creator' : 'creators'}
        </span>
      </div>

      <FilterChipBar activeIndustry={industry} onIndustryChange={setIndustry} />

      {/* Creator grid */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <KolorSpinner size={28} />
          </div>
        ) : profiles.length === 0 ? (
          <div
            data-testid="empty-state"
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              borderTop: '1px solid var(--kolor-hairline)',
            }}
          >
            <p
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: '28px',
                fontWeight: 400,
                color: 'var(--kolor-ink)',
                margin: 0,
                marginBottom: '12px',
              }}
            >
              No creators to show.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle)',
                margin: 0,
              }}
            >
              Try another industry or city
            </p>
          </div>
        ) : (
          <div
            data-testid="creator-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {profiles.map((p) => {
              const name = `${p.user.firstName}${p.user.lastName ? ' ' + p.user.lastName : ''}`
              const industryLabel = p.user.primaryIndustry
                ? INDUSTRY_LABELS[p.user.primaryIndustry] || p.user.primaryIndustry
                : ''
              const hero = p.posts?.[0]?.mainImage
              const isFollowing = following.has(p.id)
              const followPending = followingInFlight.has(p.id)
              const dmPending = dmInFlight.has(p.id)

              return (
                <div
                  key={p.id}
                  data-testid="creator-card"
                  style={{
                    background: 'var(--kolor-canvas)',
                    border: '1px solid var(--kolor-hairline)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    transition: 'border-color 200ms',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor =
                      'var(--kolor-hairline-strong)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor =
                      'var(--kolor-hairline)'
                  }}
                >
                  {/* Hero shot */}
                  <div
                    onClick={() =>
                      p.handle
                        ? navigate(`/creator/${p.handle}`)
                        : toast('Creator has no public handle yet')
                    }
                    style={{
                      width: '100%',
                      aspectRatio: '4/3',
                      background: 'var(--kolor-canvas-shade-1)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    {hero && (
                      <img
                        src={hero}
                        alt=""
                        loading="lazy"
                        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <p
                      onClick={() => p.handle && navigate(`/creator/${p.handle}`)}
                      style={{
                        fontFamily: '"Fraunces", serif',
                        fontStyle: 'italic',
                        fontSize: '20px',
                        fontWeight: 400,
                        color: 'var(--kolor-ink)',
                        margin: 0,
                        cursor: p.handle ? 'pointer' : 'default',
                        lineHeight: 1.3,
                      }}
                    >
                      {name}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                        fontSize: '9px',
                        fontWeight: 500,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color: 'var(--kolor-ink-subtle)',
                        margin: '6px 0 0',
                      }}
                    >
                      {[p.handle ? `@${p.handle}` : null, industryLabel, p.city].filter(Boolean).join(' · ')}
                    </p>
                    {p.subHeadline && (
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: 'var(--kolor-ink-muted)',
                          margin: '10px 0 0',
                        }}
                      >
                        {p.subHeadline}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={() => handleFollowToggle(p.id)}
                        disabled={followPending}
                        data-testid="creator-follow"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: isFollowing ? 'var(--kolor-canvas-shade-1)' : 'transparent',
                          border: '1px solid var(--kolor-terra)',
                          borderRadius: '2px',
                          fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                          fontSize: '9px',
                          fontWeight: 500,
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: 'var(--kolor-terra)',
                          cursor: followPending ? 'wait' : 'pointer',
                        }}
                      >
                        {followPending ? '…' : isFollowing ? 'Following' : 'Follow'}
                      </button>
                      {onStartDM !== undefined || true ? (
                        <button
                          onClick={() => handleStartDM(p.id)}
                          disabled={dmPending}
                          data-testid="creator-message"
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px solid var(--kolor-hairline)',
                            borderRadius: '2px',
                            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                            fontSize: '9px',
                            fontWeight: 500,
                            letterSpacing: '0.24em',
                            textTransform: 'uppercase',
                            color: 'var(--kolor-ink)',
                            cursor: dmPending ? 'wait' : 'pointer',
                          }}
                        >
                          {dmPending ? '…' : 'Message'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              data-testid="creators-load-more"
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid var(--kolor-hairline)',
                borderRadius: '2px',
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-muted)',
                cursor: loadingMore ? 'wait' : 'pointer',
              }}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
