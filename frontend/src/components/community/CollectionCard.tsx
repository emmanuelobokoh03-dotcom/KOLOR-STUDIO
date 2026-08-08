import { useNavigate } from 'react-router-dom'

interface CollectionCardProps {
  collection: {
    id: string
    name: string
    isPublic: boolean
    items?: Array<{ post: { mainImage?: string | null } | null }>
    _count?: { items: number }
  }
  itemCount?: number
}

// iter 287-v3c — Reusable 2x2 preview + metadata card.
// Used by PublicProfile + MyCollections pages.
export default function CollectionCard({ collection, itemCount }: CollectionCardProps) {
  const navigate = useNavigate()
  const total = collection._count?.items ?? itemCount ?? collection.items?.length ?? 0

  const previews: Array<string | null> = [null, null, null, null]
  ;(collection.items || []).slice(0, 4).forEach((item, i) => {
    previews[i] = item.post?.mainImage || null
  })

  return (
    <div
      data-testid="collection-card"
      onClick={() => navigate(`/collection/${collection.id}`)}
      style={{
        border: '1px solid var(--kolor-hairline)',
        borderRadius: '2px',
        background: 'var(--kolor-canvas)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 200ms',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--kolor-hairline-strong)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--kolor-hairline)'
      }}
    >
      {/* 2×2 preview grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2px',
          background: 'var(--kolor-hairline)',
          aspectRatio: '3/2',
        }}
      >
        {previews.map((img, i) => (
          <div
            key={i}
            style={{
              background: 'var(--kolor-canvas-shade-1)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {img && (
              <img
                src={img}
                alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: '20px' }}>
        <p
          style={{
            fontFamily: '"Fraunces", serif',
            fontStyle: 'italic',
            fontSize: '18px',
            fontWeight: 400,
            color: 'var(--kolor-ink)',
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {collection.name}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-subtle)',
            margin: '8px 0 0',
          }}
        >
          {total} {total === 1 ? 'shot' : 'shots'} · {collection.isPublic ? 'Public' : 'Private'}
        </p>
      </div>
    </div>
  )
}
