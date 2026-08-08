import { useState } from 'react'
import type { CreativeIndustry } from '../../lib/communityTaxonomy'

interface ShotTileProps {
  shot: {
    id: string
    mainImage: string
    content: string
    industry: CreativeIndustry
    author: {
      id: string
      handle?: string | null
      user: { firstName: string; lastName?: string }
    }
    _count?: { likes?: number; comments?: number }
  }
  onSaveClick?: (shotId: string) => void
  onClick?: (shotId: string) => void
}

const INDUSTRY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  DESIGN: 'Design',
  FINE_ART: 'Fine Art',
}

// iter 287-v3a — Masonry grid tile. Native aspect ratio. Hover reveal
// (200ms fade): dark scrim + creator + industry mono UPPERCASE + SAVE
// affordance. Click → /shot/:id (placeholder route until iter 287-v3b).
export default function ShotTile({ shot, onSaveClick, onClick }: ShotTileProps) {
  const [hovered, setHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const creatorName = `${shot.author.user.firstName}${shot.author.user.lastName ? ' ' + shot.author.user.lastName : ''}`
  const industryLabel = INDUSTRY_LABELS[shot.industry] || shot.industry

  return (
    <div
      data-testid="shot-tile"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick && onClick(shot.id)}
      style={{
        position: 'relative',
        breakInside: 'avoid',
        marginBottom: '16px',
        background: 'var(--kolor-canvas-shade-1)',
        border: '1px solid var(--kolor-hairline)',
        borderRadius: '2px',
        overflow: 'hidden',
        cursor: 'pointer',
        maxHeight: '800px',
      }}
    >
      <img
        src={shot.mainImage}
        alt={shot.content}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maxHeight: '800px',
          objectFit: 'contain',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 300ms',
        }}
      />

      {/* Hover scrim + metadata */}
      <div
        data-testid="shot-tile-hover"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(26, 22, 19, 0.72) 0%, rgba(26, 22, 19, 0.2) 40%, transparent 70%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 200ms',
          pointerEvents: hovered ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px',
        }}
      >
        {/* SAVE affordance top-right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            data-testid="shot-tile-save"
            onClick={(e) => {
              e.stopPropagation()
              if (onSaveClick) onSaveClick(shot.id)
            }}
            style={{
              padding: '6px 12px',
              background: 'rgba(247, 244, 238, 0.95)',
              border: '1px solid rgba(247, 244, 238, 0.95)',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink)',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>

        {/* Creator + industry bottom */}
        <div>
          <p
            style={{
              fontFamily: '"Fraunces", serif',
              fontStyle: 'italic',
              fontSize: '18px',
              color: 'var(--kolor-canvas)',
              margin: 0,
              marginBottom: '4px',
              lineHeight: 1.2,
            }}
          >
            {creatorName}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'rgba(247, 244, 238, 0.75)',
              margin: 0,
            }}
          >
            {industryLabel}
            {typeof shot._count?.likes === 'number' && shot._count.likes > 0 && (
              <span style={{ marginLeft: 12 }}>· {shot._count.likes} likes</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
