import { useEffect, useState } from 'react'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface FeaturedPost {
  id: string
  post: {
    id: string
    content: string
    mainImage?: string | null
    industry: string
    author: {
      user: { firstName: string; lastName?: string }
    }
  }
}

interface FeaturedBannerProps {
  onShotClick?: (shotId: string) => void
}

const INDUSTRY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  DESIGN: 'Design',
  FINE_ART: 'Fine Art',
}

// iter 287-v3a — Featured Work banner. Fetches from /api/featured/work.
// Empty state: component returns null (graceful hide per Q61 — no
// empty-banner UI). Populated: single Featured shot with editorial layout.
export default function FeaturedBanner({ onShotClick }: FeaturedBannerProps) {
  const [featured, setFeatured] = useState<FeaturedPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/featured/work`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.featured?.length > 0) {
          setFeatured(data.featured[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Graceful hide while loading + when empty
  if (loading || !featured || !featured.post.mainImage) return null

  const creatorName = `${featured.post.author.user.firstName}${
    featured.post.author.user.lastName ? ' ' + featured.post.author.user.lastName : ''
  }`

  return (
    <section
      data-testid="featured-banner"
      style={{
        background: 'var(--kolor-canvas)',
        borderTop: '1px solid var(--kolor-hairline)',
        borderBottom: '1px solid var(--kolor-hairline)',
        padding: '80px 24px',
        marginBottom: '48px',
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
          Featured Work
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          <div
            onClick={() => onShotClick && onShotClick(featured.post.id)}
            style={{
              cursor: onShotClick ? 'pointer' : 'default',
              border: '1px solid var(--kolor-hairline)',
              overflow: 'hidden',
            }}
          >
            <img
              src={featured.post.mainImage}
              alt={featured.post.content}
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle)',
                margin: 0,
                marginBottom: '16px',
              }}
            >
              {creatorName} · {INDUSTRY_LABELS[featured.post.industry] || featured.post.industry}
            </p>
            <h2
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: 'clamp(28px, 4vw, 32px)',
                fontWeight: 400,
                color: 'var(--kolor-ink)',
                margin: 0,
                marginBottom: '24px',
                lineHeight: 1.15,
              }}
            >
              {featured.post.content}
            </h2>
            <button
              onClick={() => onShotClick && onShotClick(featured.post.id)}
              data-testid="featured-view-shot"
              style={{
                padding: '12px 20px',
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
                transition: 'background 200ms, color 200ms',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background =
                  'var(--kolor-terra)'
                ;(e.currentTarget as HTMLButtonElement).style.color =
                  'var(--kolor-canvas)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--kolor-terra)'
              }}
            >
              View shot
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
