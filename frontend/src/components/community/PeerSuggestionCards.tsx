interface PeerSuggestion {
  id: string
  score: number
  reasonCode: string
  toProfile: {
    id: string
    handle?: string | null
    city?: string | null
    user: { firstName: string; lastName?: string; primaryIndustry?: string | null }
    posts?: Array<{ id: string; mainImage?: string | null }>
  }
}

interface PeerSuggestionCardsProps {
  peerSuggestions: PeerSuggestion[]
  onCreatorClick?: (profileId: string, handle?: string | null) => void
  onFollowClick?: (profileId: string) => Promise<void>
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

// iter 287-v3b — 3-card peer suggestion display per Q70=C + Q86=A.
// "Creators like this one" eyebrow, 4/3 hero shot preview per card,
// Fraunces name + mono meta + ghost Terra FOLLOW. Renders null if empty
// (graceful hide).
export default function PeerSuggestionCards({
  peerSuggestions,
  onCreatorClick,
  onFollowClick,
}: PeerSuggestionCardsProps) {
  if (!peerSuggestions || peerSuggestions.length === 0) return null

  return (
    <section
      data-testid="peer-suggestion-cards"
      style={{
        padding: '48px 0',
        borderTop: '1px solid var(--kolor-hairline)',
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
          marginBottom: '24px',
        }}
      >
        Creators like this one
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {peerSuggestions.map((p) => {
          const name = `${p.toProfile.user.firstName}${
            p.toProfile.user.lastName ? ' ' + p.toProfile.user.lastName : ''
          }`
          const industryLabel = p.toProfile.user.primaryIndustry
            ? INDUSTRY_LABELS[p.toProfile.user.primaryIndustry] ||
              p.toProfile.user.primaryIndustry
            : ''
          const preview = p.toProfile.posts?.[0]?.mainImage

          return (
            <div
              key={p.id}
              data-testid="peer-card"
              style={{
                border: '1px solid var(--kolor-hairline)',
                borderRadius: '2px',
                background: 'var(--kolor-canvas)',
                overflow: 'hidden',
                transition: 'border-color 200ms',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor =
                  'var(--kolor-hairline-strong)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--kolor-hairline)'
              }}
            >
              <div
                onClick={() => onCreatorClick && onCreatorClick(p.toProfile.id, p.toProfile.handle)}
                style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  background: 'var(--kolor-canvas-shade-1)',
                  overflow: 'hidden',
                  cursor: onCreatorClick ? 'pointer' : 'default',
                }}
              >
                {preview && (
                  <img
                    src={preview}
                    alt=""
                    loading="lazy"
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <p
                  style={{
                    fontFamily: '"Fraunces", serif',
                    fontStyle: 'italic',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: 'var(--kolor-ink)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {name}
                </p>
                {(industryLabel || p.toProfile.city) && (
                  <p
                    style={{
                      fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                      fontSize: '9px',
                      fontWeight: 500,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'var(--kolor-ink-subtle)',
                      margin: '6px 0 12px',
                    }}
                  >
                    {industryLabel}
                    {industryLabel && p.toProfile.city && ' · '}
                    {p.toProfile.city}
                  </p>
                )}
                {onFollowClick && (
                  <button
                    data-testid="peer-follow"
                    onClick={() => onFollowClick(p.toProfile.id)}
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: '1px solid var(--kolor-terra)',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                      fontSize: '9px',
                      fontWeight: 500,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'var(--kolor-terra)',
                      cursor: 'pointer',
                    }}
                  >
                    Follow
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
