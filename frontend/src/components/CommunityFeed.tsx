import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import KolorSpinner from './KolorSpinner'
import FilterChipBar from './community/FilterChipBar'
import ShotTile from './community/ShotTile'
import FeaturedBanner from './community/FeaturedBanner'
import CreatorsOfWeekRail from './community/CreatorsOfWeekRail'
import ComposeModal from './community/ComposeModal'
import SaveToCollectionModal from './community/SaveToCollectionModal'
import { getIndustryLanguage } from '../utils/industryLanguage'
import { mapToPostIndustry } from '../lib/imageCompress'
import type { CreativeIndustry } from '../lib/communityTaxonomy'
import { Z } from '../lib/z'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface Shot {
  id: string
  content: string
  industry: CreativeIndustry
  mainImage?: string | null
  additionalImages?: string[]
  createdAt: string
  author: {
    id: string
    userId: string
    handle?: string | null
    city?: string | null
    user: { firstName: string; lastName?: string; primaryIndustry?: string | null }
  }
  _count?: { likes: number; comments: number }
}

interface CommunityFeedProps {
  userIndustry?: string | null
  userId?: string
  onOpenSettings?: (tab: string) => void
  onNavigateToPortfolio?: () => void
}

type SortMode = 'recent' | 'popular'

export default function CommunityFeed({
  userIndustry,
  userId: _userId,
  onOpenSettings,
  onNavigateToPortfolio: _onNavigateToPortfolio,
}: CommunityFeedProps) {
  // iter 289-v3c3b.1 — Sub-chip + industry URL sync (Pattern C fix).
  // Prior state was local-only: sub-chip clicks updated the grid via the
  // useEffect on `subChip` but never reflected in the URL. Emmanuel's
  // smoke test read this as "click doesn't update URL, no filter applied".
  // Now the URL is the source of truth: reading from ?industry= and
  // ?subHeadline= on mount; writing back on every chip change; deep-links
  // and back/forward navigation work naturally.
  const [searchParams, setSearchParams] = useSearchParams()
  const industryFromUrl = (searchParams.get('industry') || 'ALL') as CreativeIndustry | 'ALL'
  const subFromUrl = searchParams.get('subHeadline')
  const [industry, setIndustryState] = useState<CreativeIndustry | 'ALL'>(industryFromUrl)
  const [subChip, setSubChipState] = useState<string | null>(subFromUrl)

  // Keep local state aligned when the URL changes externally (back/forward).
  useEffect(() => {
    if (industryFromUrl !== industry) setIndustryState(industryFromUrl)
    if (subFromUrl !== subChip) setSubChipState(subFromUrl)
  }, [industryFromUrl, subFromUrl])

  const setIndustry = useCallback((next: CreativeIndustry | 'ALL') => {
    setIndustryState(next)
    setSubChipState(null)  // industry change clears sub-chip
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next === 'ALL') params.delete('industry')
      else params.set('industry', next)
      params.delete('subHeadline')
      return params
    }, { replace: true })
  }, [setSearchParams])

  const setSubChip = useCallback((next: string | null) => {
    setSubChipState(next)
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next) params.set('subHeadline', next)
      else params.delete('subHeadline')
      return params
    }, { replace: true })
  }, [setSearchParams])
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [shots, setShots] = useState<Shot[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const [saveOpenForShotId, setSaveOpenForShotId] = useState<string | null>(null)
  const navigate = useNavigate()

  const postIndustry = mapToPostIndustry(userIndustry)
  const lang = getIndustryLanguage(postIndustry)
  const composeLabel = 'Post ' + lang.shot

  const fetchFeed = useCallback(async (ind: CreativeIndustry | 'ALL', cur?: string | null, sub?: string | null) => {
    try {
      const params = new URLSearchParams({ industry: ind })
      if (cur) params.set('cursor', cur)
      if (sub) params.set('subHeadline', sub)
      const res = await fetch(`${API}/api/community/feed?${params}`, { credentials: 'include' })
      const data = await res.json()
      const incoming: Shot[] = data.posts || []
      if (cur) setShots((prev) => [...prev, ...incoming])
      else setShots(incoming)
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch {
      /* silent */
    }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    setShots([])
    setCursor(null)
    fetchFeed(industry, null, subChip)
  }, [industry, subChip, fetchFeed])

  // First-time community intro modal — preserved verbatim from prior implementation
  useEffect(() => {
    fetch(`${API}/api/community/profile/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile && d.profile.hasSeenCommunityIntro === false && !d.profile.isSynthetic) {
          setShowIntro(true)
        }
      })
      .catch(() => {})
  }, [])

  const dismissIntro = (openSettings: boolean) => {
    setShowIntro(false)
    fetch(`${API}/api/community/profile`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasSeenCommunityIntro: true }),
    }).catch(() => {})
    if (openSettings && onOpenSettings) onOpenSettings('community')
  }

  const handlePosted = (post: Shot) => {
    setShots((prev) => [post, ...prev])
  }

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    fetchFeed(industry, cursor, subChip)
  }

  const handleShotClick = (shotId: string) => {
    navigate(`/shot/${shotId}`)
  }

  const handleSaveClick = (shotId: string) => {
    setSaveOpenForShotId(shotId)
  }

  // Client-side: only shots with mainImage render (visual-first).
  // Sort mode applied client-side. Sub-chip filter is applied server-side.
  const visibleShots = useMemo(() => {
    let list = shots.filter((s) => s.mainImage)
    if (sortMode === 'popular') {
      list = [...list].sort((a, b) => (b._count?.likes || 0) - (a._count?.likes || 0))
    }
    return list
  }, [shots, sortMode])

  return (
    <div
      data-testid="community-feed"
      style={{
        background: 'var(--kolor-canvas)',
        minHeight: '100vh',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      }}
    >
      {showIntro && (
        <div
          data-testid="community-intro-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: Z.MODAL,
            background: 'rgba(26, 22, 19, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => dismissIntro(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--kolor-canvas)',
              border: '1px solid var(--kolor-hairline-strong)',
              borderRadius: '2px',
              padding: '32px',
              maxWidth: '440px',
              width: '100%',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--kolor-terra)',
                margin: 0,
                marginBottom: '10px',
              }}
            >
              The KOLOR Community
            </p>
            <h3
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: '28px',
                fontWeight: 400,
                color: 'var(--kolor-ink)',
                margin: 0,
                marginBottom: '16px',
              }}
            >
              A space for creatives.
            </h3>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--kolor-ink-muted)',
                marginBottom: '12px',
              }}
            >
              Share your work with independent creatives in photography, design and fine art.
            </p>
            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--kolor-ink-muted)',
                marginBottom: '24px',
              }}
            >
              Your name, industry and city are visible to other members. You will get an email when
              someone likes, comments or follows you — adjust anytime in Settings → Community.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => dismissIntro(false)}
                data-testid="community-intro-got-it"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '1px solid var(--kolor-terra)',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-terra)',
                  cursor: 'pointer',
                }}
              >
                Got it
              </button>
              <button
                onClick={() => dismissIntro(true)}
                data-testid="community-intro-edit-profile"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '1px solid var(--kolor-hairline)',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-muted)',
                  cursor: 'pointer',
                }}
              >
                Edit profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Banner + Creators of Week Rail — both hide gracefully when empty */}
      <FeaturedBanner onShotClick={handleShotClick} />
      <CreatorsOfWeekRail />

      {/* Compose CTA row + Filter chip bar */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '-4px',
        }}
      >
        <button
          onClick={() => setComposeOpen(true)}
          data-testid="community-compose-open"
          style={{
            padding: '12px 24px',
            background: 'var(--kolor-terra)',
            border: '1px solid var(--kolor-terra)',
            borderRadius: '2px',
            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--kolor-canvas)',
            cursor: 'pointer',
            transition: 'background 200ms',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'var(--kolor-terra-hover)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--kolor-terra)'
          }}
        >
          {composeLabel}
        </button>
      </div>

      <FilterChipBar
        activeIndustry={industry}
        onIndustryChange={setIndustry}
        activeSubChip={subChip}
        onSubChipChange={setSubChip}
      />

      {/* Sort + shot count row */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '20px' }}>
          {(['recent', 'popular'] as SortMode[]).map((mode) => {
            const active = sortMode === mode
            return (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                data-testid={`sort-${mode}`}
                style={{
                  padding: '4px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${active ? 'var(--kolor-ink)' : 'transparent'}`,
                  fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--kolor-ink)' : 'var(--kolor-ink-subtle)',
                  cursor: 'pointer',
                }}
              >
                {mode}
              </button>
            )
          })}
        </div>
        <span
          data-testid="shot-count"
          style={{
            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-subtle)',
          }}
        >
          {visibleShots.length} {visibleShots.length === 1 ? lang.shot : lang.shotPlural}
        </span>
      </div>

      {/* Masonry grid */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <KolorSpinner size={28} />
          </div>
        ) : visibleShots.length === 0 ? (
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
              No {lang.shotPlural} to show.
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
              Try another filter or post your first
            </p>
          </div>
        ) : (
          <>
            <div
              data-testid="shots-masonry"
              style={{
                columnCount: 3,
                columnGap: '16px',
              }}
              className="community-masonry"
            >
              {visibleShots.map((s) => (
                <ShotTile
                  key={s.id}
                  shot={{
                    id: s.id,
                    mainImage: s.mainImage as string,
                    content: s.content,
                    industry: s.industry,
                    author: s.author,
                    _count: s._count,
                  }}
                  onClick={handleShotClick}
                  onSaveClick={handleSaveClick}
                />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  data-testid="feed-load-more"
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
          </>
        )}
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        userIndustry={userIndustry}
        onPosted={handlePosted}
      />

      <SaveToCollectionModal
        shotId={saveOpenForShotId || ''}
        isOpen={!!saveOpenForShotId}
        onClose={() => setSaveOpenForShotId(null)}
      />

      {/* Masonry responsive rules via CSS */}
      <style>{`
        @media (max-width: 900px) {
          .community-masonry { column-count: 2 !important; }
        }
        @media (max-width: 560px) {
          .community-masonry { column-count: 1 !important; }
        }
      `}</style>
    </div>
  )
}
