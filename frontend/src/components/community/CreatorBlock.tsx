import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface CreatorBlockProps {
  creator: {
    id: string
    handle?: string | null
    userId?: string
    city?: string | null
    availability?: string | null
    bio?: string | null
    user: {
      firstName: string
      lastName?: string
      primaryIndustry?: string | null
      industry?: string | null
    }
  }
  isFollowing: boolean
  hideFollowButton?: boolean
  onFollowChange?: (nowFollowing: boolean) => void
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

// iter 287-v3b — Reusable creator info block with follow button.
// 64px avatar circle + Fraunces italic initial fallback, Inter name,
// mono UPPERCASE meta, ghost Terra FOLLOW button (FOLLOWING on hover
// reveals UNFOLLOW per Q87=A).
export default function CreatorBlock({
  creator,
  isFollowing: initialFollowing,
  hideFollowButton = false,
  onFollowChange,
}: CreatorBlockProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [hovered, setHovered] = useState(false)
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()

  const goToProfile = () => {
    if (creator.handle) navigate(`/creator/${creator.handle}`)
  }

  const name = `${creator.user.firstName}${creator.user.lastName ? ' ' + creator.user.lastName : ''}`
  const initial = creator.user.firstName?.charAt(0).toUpperCase() || '?'
  const industryLabel = creator.user.primaryIndustry
    ? INDUSTRY_LABELS[creator.user.primaryIndustry] || creator.user.primaryIndustry
    : ''

  const followLabel = pending
    ? '…'
    : isFollowing
    ? hovered
      ? 'Unfollow'
      : 'Following'
    : 'Follow'

  const handleToggle = async () => {
    if (pending) return
    setPending(true)
    const nextState = !isFollowing
    try {
      const res = await fetch(`${API}/api/community/follows/${creator.id}`, {
        method: nextState ? 'POST' : 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setIsFollowing(nextState)
        onFollowChange && onFollowChange(nextState)
      }
    } catch {
      /* silent */
    }
    setPending(false)
  }

  return (
    <div
      data-testid="creator-block"
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr auto',
        gap: '20px',
        alignItems: 'center',
        padding: '24px 0',
        borderTop: '1px solid var(--kolor-hairline)',
        borderBottom: '1px solid var(--kolor-hairline)',
      }}
    >
      {/* Avatar */}
      <div
        onClick={goToProfile}
        data-testid="creator-block-avatar"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--kolor-canvas-shade-1)',
          border: '1px solid var(--kolor-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Fraunces", serif',
          fontStyle: 'italic',
          fontSize: '28px',
          color: 'var(--kolor-ink)',
          cursor: creator.handle ? 'pointer' : 'default',
        }}
      >
        {initial}
      </div>

      {/* Info */}
      <div
        onClick={goToProfile}
        data-testid="creator-block-info"
        style={{ cursor: creator.handle ? 'pointer' : 'default' }}
      >
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            fontWeight: 500,
            color: 'var(--kolor-ink)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {name}
        </p>
        {creator.handle && (
          <p
            style={{
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle)',
              margin: '4px 0 0',
            }}
          >
            @{creator.handle}
          </p>
        )}
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
          {[industryLabel, creator.city, creator.availability].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Follow button */}
      {!hideFollowButton && (
        <button
          data-testid="follow-button"
          onClick={handleToggle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          disabled={pending}
          style={{
            padding: '10px 20px',
            background: isFollowing && !hovered ? 'var(--kolor-canvas-shade-1)' : 'transparent',
            border: `1px solid var(--kolor-terra)`,
            borderRadius: '2px',
            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--kolor-terra)',
            cursor: pending ? 'wait' : 'pointer',
            transition: 'background 200ms, color 200ms',
            minWidth: '120px',
          }}
        >
          {followLabel}
        </button>
      )}
    </div>
  )
}
