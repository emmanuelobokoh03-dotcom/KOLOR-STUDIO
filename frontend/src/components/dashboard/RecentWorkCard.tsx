import { useEffect, useState } from 'react'
import { ImageSquare } from '@phosphor-icons/react/dist/csr/ImageSquare'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import DashboardCard from './DashboardCard'
import { portfolioApi, PortfolioItem, PORTFOLIO_CATEGORY_LABELS } from '../../services/api'

/**
 * iter 291-v3b — Recent Work card.
 *
 * Portfolio items only per Q11=A. Reuses existing GET /api/portfolio
 * (returns creator's own items). Frontend sorts by createdAt DESC and slices
 * to 4 for the tile grid. Empty state includes Studio Wall echo visual
 * anchor (Q14=B pattern prep from Portfolio v3c).
 */

interface RecentWorkCardProps {
  onViewPortfolio: () => void
}

export function RecentWorkCard({ onViewPortfolio }: RecentWorkCardProps) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    portfolioApi
      .getAll()
      .then((r) => {
        if (!cancelled) {
          const list = ((r.data as any)?.portfolio || []) as PortfolioItem[]
          const sorted = [...list].sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          )
          setItems(sorted.slice(0, 4))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <DashboardCard
        title="Recent work"
        meta="Loading"
        icon={<ImageSquare weight="duotone" size={20} />}
        testId="recent-work-card"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
          data-testid="recent-work-loading"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="ks-shimmer"
              style={{
                aspectRatio: '4 / 5',
                borderRadius: 2,
                background: 'var(--kolor-slate-tint, rgba(0,0,0,0.03))',
              }}
            />
          ))}
        </div>
      </DashboardCard>
    )
  }

  if (items.length === 0) {
    // Empty state with Studio Wall echo (matches Portfolio v3c empty pattern)
    return (
      <DashboardCard
        title="Recent work"
        meta="NO ITEMS YET"
        icon={<ImageSquare weight="duotone" size={20} />}
        testId="recent-work-card"
      >
        <div
          style={{ textAlign: 'center', padding: '20px 4px 8px' }}
          data-testid="recent-work-empty"
        >
          {/* Studio Wall echo — three hairline frames matching Portfolio v3c
              empty state pattern, scaled down for card context */}
          <div
            aria-hidden
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              margin: '0 auto 20px',
              maxWidth: 200,
            }}
          >
            <div style={{
              width: 28, height: 38,
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))',
              transform: 'translateY(4px)',
            }} />
            <div style={{
              width: 48, height: 64,
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))',
            }} />
            <div style={{
              width: 28, height: 38,
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))',
              transform: 'translateY(-4px)',
            }} />
          </div>
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--kolor-ink-muted, #5F5751)',
              margin: 0,
              marginBottom: 20,
              maxWidth: 320,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Publish your first portfolio piece to start building your public
            presence.
          </p>
          <button
            onClick={onViewPortfolio}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              background: 'var(--kolor-terra, #B84A2C)',
              color: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-terra, #B84A2C)',
              borderRadius: 2,
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'opacity 200ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            data-testid="recent-work-empty-cta"
          >
            <Plus size={12} weight="bold" aria-hidden />
            Add work
          </button>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Recent work"
      meta={`${items.length} recent`}
      icon={<ImageSquare weight="duotone" size={20} />}
      action={
        <button
          onClick={onViewPortfolio}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 0',
            background: 'transparent',
            color: 'var(--kolor-terra, #B84A2C)',
            border: 'none',
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          data-testid="recent-work-view-all"
        >
          View portfolio
          <ArrowRight size={12} weight="bold" aria-hidden />
        </button>
      }
      testId="recent-work-card"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          gap: 12,
        }}
        data-testid="recent-work-grid"
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={onViewPortfolio}
            style={{
              display: 'block',
              padding: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            data-testid={`recent-work-tile-${item.id}`}
          >
            <div
              style={{
                aspectRatio: '4 / 5',
                background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                borderRadius: 2,
                overflow: 'hidden',
                marginBottom: 8,
                transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 13,
                lineHeight: 1.3,
                color: 'var(--kolor-ink, #1A1613)',
                margin: 0,
                marginBottom: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.title}
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle, #928B84)',
                margin: 0,
              }}
            >
              {PORTFOLIO_CATEGORY_LABELS[item.category] || item.category}
            </p>
          </button>
        ))}
      </div>
    </DashboardCard>
  )
}

export default RecentWorkCard
