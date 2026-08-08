import { useState, useEffect } from 'react'
import KolorSpinner from './KolorSpinner'
import { linkifyText } from '../utils/linkifyText'

const API = (import.meta as any).env?.VITE_API_URL || ''

// iter 287-v3b — Framework-calibrated: canvas ivory, hairline dividers,
// Fraunces italic empty state, mono UPPERCASE timestamps, Terra active
// submit, initials avatar with Fraunces italic.

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function CommentThread({
  postId,
  onCommentAdded,
}: {
  postId: string
  onCommentAdded?: () => void
}) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/community/posts/${postId}/comments`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [postId])

  const handleSubmit = async () => {
    if (!input.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch(`${API}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: input.trim() }),
      })
      const data = await res.json()
      if (data.comment) {
        setComments((prev) => [...prev, data.comment])
        setInput('')
        onCommentAdded?.()
      }
    } catch {
      /* silent */
    }
    setPosting(false)
  }

  return (
    <div
      data-testid="comment-thread"
      style={{
        borderTop: '1px solid var(--kolor-hairline)',
        padding: '20px 0',
      }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <KolorSpinner size={16} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {comments.map((c, i) => {
            const authorName = `${c.author?.user?.firstName || ''} ${c.author?.user?.lastName || ''}`.trim()
            const initial = c.author?.user?.firstName?.[0]?.toUpperCase() || '?'
            return (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr',
                  gap: '12px',
                  paddingBottom: '16px',
                  borderBottom: i < comments.length - 1 ? '1px solid var(--kolor-hairline)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--kolor-canvas-shade-1)',
                    border: '1px solid var(--kolor-hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"Fraunces", serif',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    color: 'var(--kolor-ink)',
                  }}
                >
                  {initial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--kolor-ink)',
                      }}
                    >
                      {authorName}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                        fontSize: '9px',
                        fontWeight: 500,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color: 'var(--kolor-ink-subtle)',
                      }}
                    >
                      {timeAgo(c.createdAt)}
                      {c.author?.city ? ` · ${c.author.city}` : ''}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--kolor-ink)',
                      margin: '6px 0 0',
                    }}
                    dangerouslySetInnerHTML={{ __html: linkifyText(c.content) }}
                  />
                </div>
              </div>
            )
          })}
          {comments.length === 0 && (
            <p
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: '16px',
                color: 'var(--kolor-ink-muted)',
                textAlign: 'center',
                padding: '12px 0',
                margin: 0,
              }}
            >
              No comments yet.
            </p>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a comment…"
          maxLength={300}
          data-testid="comment-input"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{
            flex: 1,
            padding: '10px 0',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--kolor-hairline)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: 'var(--kolor-ink)',
            outline: 'none',
          }}
          onFocus={(e) => {
            ;(e.currentTarget as HTMLInputElement).style.borderBottomColor = 'var(--kolor-terra)'
          }}
          onBlur={(e) => {
            ;(e.currentTarget as HTMLInputElement).style.borderBottomColor = 'var(--kolor-hairline)'
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, "Space Mono", monospace)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: 'var(--kolor-ink-subtle)',
          }}
        >
          {input.length}/300
        </span>
        {input.trim() && (
          <button
            onClick={handleSubmit}
            disabled={posting}
            data-testid="comment-submit"
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid var(--kolor-terra)',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-terra)',
              cursor: posting ? 'wait' : 'pointer',
            }}
          >
            {posting ? '…' : 'Post'}
          </button>
        )}
      </div>
    </div>
  )
}
