import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import KolorSpinner from '../components/KolorSpinner'
import CreatorBlock from '../components/community/CreatorBlock'
import ShotInteractionBar from '../components/community/ShotInteractionBar'
import SaveToCollectionModal from '../components/community/SaveToCollectionModal'
import PeerSuggestionCards from '../components/community/PeerSuggestionCards'
import CommentThread from '../components/CommentThread'
import { detectMilestone } from '../lib/imageCompress'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface ShotDetailData {
  shot: {
    id: string
    content: string
    industry: string
    mainImage?: string | null
    additionalImages?: string[]
    createdAt: string
    author: {
      id: string
      userId?: string
      handle?: string | null
      bio?: string | null
      city?: string | null
      availability?: string | null
      user: {
        firstName: string
        lastName?: string
        primaryIndustry?: string | null
        industry?: string | null
      }
    }
  }
  isFollowing: boolean
  hasAppreciated: boolean
  likesCount: number
  commentsCount: number
  comments: any[]
  peerSuggestions: any[]
  viewerProfileId?: string
}

const INDUSTRY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  DESIGN: 'Design',
  FINE_ART: 'Fine Art',
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// iter 287-v3b — Shot detail page composed of iter 287-v3a/b components.
// Stacked layout per Q69=B mobile-first. Route: /shot/:id
export default function ShotDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ShotDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    fetch(`${API}/api/community/shots/${id}`, { credentials: 'include' })
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true)
          return null
        }
        return r.json()
      })
      .then((body) => {
        if (body) setData(body)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const handleAppreciate = async () => {
    if (!data) return
    await fetch(`${API}/api/community/posts/${data.shot.id}/like`, {
      method: 'POST',
      credentials: 'include',
    })
  }

  const parseTitleAndDescription = (content: string) => {
    const [firstLine, ...rest] = content.split('\n\n')
    return { title: firstLine, description: rest.join('\n\n') }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--kolor-canvas)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KolorSpinner size={32} />
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--kolor-canvas)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
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
            marginBottom: '12px',
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: '"Fraunces", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(32px, 6vw, 48px)',
            fontWeight: 400,
            color: 'var(--kolor-ink)',
            margin: 0,
            marginBottom: '24px',
          }}
        >
          Shot not found.
        </h1>
        <button
          onClick={() => navigate('/dashboard?view=community')}
          data-testid="notfound-back"
          style={{
            padding: '12px 24px',
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
          Back to Community
        </button>
      </div>
    )
  }

  const { shot } = data
  const { title, description } = parseTitleAndDescription(shot.content)
  const isMilestone = detectMilestone(shot.content)
  const industryLabel = INDUSTRY_LABELS[shot.industry] || shot.industry
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div
      data-testid="shot-detail"
      style={{
        minHeight: '100vh',
        background: 'var(--kolor-canvas)',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--kolor-hairline)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          data-testid="shot-back"
          style={{
            padding: '6px 0',
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted)',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <p
          style={{
            fontFamily: '"Fraunces", serif',
            fontStyle: 'italic',
            fontSize: '20px',
            fontWeight: 400,
            color: 'var(--kolor-ink)',
            margin: 0,
          }}
        >
          KOLOR
        </p>
        <div style={{ width: '60px' }} />
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        {/* Main image */}
        {shot.mainImage && (
          <div
            style={{
              background: 'var(--kolor-canvas-shade-1)',
              border: '1px solid var(--kolor-hairline)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '32px',
              maxHeight: '900px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <img
              src={shot.mainImage}
              alt={title}
              data-testid="shot-main-image"
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '900px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Creator block */}
        <CreatorBlock
          creator={shot.author}
          isFollowing={data.isFollowing}
          hideFollowButton={data.viewerProfileId === shot.author.id}
        />

        {/* Title + description + milestone */}
        <div style={{ padding: '32px 0', borderBottom: '1px solid var(--kolor-hairline)' }}>
          {isMilestone && (
            <p
              data-testid="milestone-badge"
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                background: 'var(--kolor-canvas-shade-1)',
                border: '1px solid var(--kolor-terra)',
                borderRadius: '2px',
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-terra)',
                marginBottom: '16px',
              }}
            >
              Milestone
            </p>
          )}
          <p
            style={{
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle)',
              margin: 0,
              marginBottom: '12px',
            }}
          >
            {industryLabel} · {timeAgo(shot.createdAt)}
          </p>
          <h1
            data-testid="shot-title"
            style={{
              fontFamily: '"Fraunces", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(32px, 5vw, 44px)',
              fontWeight: 400,
              color: 'var(--kolor-ink)',
              margin: 0,
              lineHeight: 1.15,
              marginBottom: description ? '20px' : 0,
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                lineHeight: 1.7,
                color: 'var(--kolor-ink-muted)',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Interaction bar */}
        <ShotInteractionBar
          likesCount={data.likesCount}
          hasAppreciated={data.hasAppreciated}
          onAppreciateToggle={handleAppreciate}
          onSaveClick={() => setSaveOpen(true)}
          shareUrl={shareUrl}
        />

        {/* Additional images gallery */}
        {shot.additionalImages && shot.additionalImages.length > 0 && (
          <div
            data-testid="shot-additional"
            style={{
              padding: '48px 0',
              borderBottom: '1px solid var(--kolor-hairline)',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
            }}
          >
            {shot.additionalImages.map((img, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--kolor-canvas-shade-1)',
                  border: '1px solid var(--kolor-hairline)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Comments */}
        <section style={{ padding: '32px 0' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--kolor-terra)',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            Comments ({data.commentsCount})
          </p>
          <CommentThread postId={shot.id} />
        </section>

        {/* Peer suggestions */}
        <PeerSuggestionCards
          peerSuggestions={data.peerSuggestions}
          onCreatorClick={(profileId, handle) => {
            if (handle) navigate(`/community/${handle}`)
            else navigate(`/profile/${profileId}`)
          }}
        />
      </main>

      <SaveToCollectionModal
        shotId={shot.id}
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
      />
    </div>
  )
}
