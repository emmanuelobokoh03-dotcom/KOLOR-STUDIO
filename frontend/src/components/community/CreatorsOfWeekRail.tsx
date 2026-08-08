import { useEffect, useState } from 'react'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface FeaturedCreator {
  id: string
  profile: {
    id: string
    handle?: string | null
    city?: string | null
    user: {
      firstName: string
      lastName?: string
      primaryIndustry?: string | null
    }
    // Optional latest post preview
    posts?: Array<{ id: string; mainImage?: string | null }>
  }
}

interface CreatorsOfWeekRailProps {
  onCreatorClick?: (profileId: string, handle?: string | null) => void
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

// iter 287-v3a — 3-card rail of Featured Creators. Fetches from
// /api/featured/creators. Empty: returns null (graceful hide until iter
// 288-v3 wires algorithmic cron).
export default function CreatorsOfWeekRail({ onCreatorClick }: CreatorsOfWeekRailProps) {
  const [creators, setCreators] = useState<FeaturedCreator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/featured/creators`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.featured?.length > 0) {
          setCreators(data.featured.slice(0, 3))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || creators.length === 0) return null

  return (
    <section
      data-testid="creators-of-week-rail"
      style={{
        padding: '48px 24px',
        marginBottom: '48px',
        borderTop: '1px solid var(--kolor-hairline)',
        borderBottom: '1px solid var(--kolor-hairline)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--kolor-terra)',
            margin: 0,
            marginBottom: '24px',
          }}
        >
          Creators of the Week
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {creators.map((c) => {
            const name = `${c.profile.user.firstName}${
              c.profile.user.lastName ? ' ' + c.profile.user.lastName : ''
            }`
            const industryLabel = c.profile.user.primaryIndustry
              ? INDUSTRY_LABELS[c.profile.user.primaryIndustry] ||
                c.profile.user.primaryIndustry
              : ''
            const preview = c.profile.posts?.[0]?.mainImage

            return (
              <div
                key={c.id}
                data-testid="creator-card"
                onClick={() => onCreatorClick && onCreatorClick(c.profile.id, c.profile.handle)}
                style={{
                  background: 'var(--kolor-canvas)',
                  border: '1px solid var(--kolor-hairline)',
                  borderRadius: '2px',
                  padding: '20px',
                  cursor: onCreatorClick ? 'pointer' : 'default',
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
                {preview && (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '4/3',
                      background: 'var(--kolor-canvas-shade-1)',
                      marginBottom: '16px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={preview}
                      alt=""
                      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <p
                  style={{
                    fontFamily: '"Fraunces", serif',
                    fontStyle: 'italic',
                    fontSize: '20px',
                    fontWeight: 400,
                    color: 'var(--kolor-ink)',
                    margin: 0,
                    marginBottom: '6px',
                    lineHeight: 1.2,
                  }}
                >
                  {name}
                </p>
                {(industryLabel || c.profile.city) && (
                  <p
                    style={{
                      fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                      fontSize: '9px',
                      fontWeight: 500,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'var(--kolor-ink-subtle)',
                      margin: 0,
                    }}
                  >
                    {industryLabel}
                    {industryLabel && c.profile.city && ' · '}
                    {c.profile.city}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
