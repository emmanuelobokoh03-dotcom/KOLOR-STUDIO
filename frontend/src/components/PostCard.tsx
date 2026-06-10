import { useState } from 'react'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { DotsThree } from '@phosphor-icons/react/dist/csr/DotsThree'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { Trash } from '@phosphor-icons/react/dist/csr/Trash'
import { Flag } from '@phosphor-icons/react/dist/csr/Flag'
import CommentThread from './CommentThread'
import { linkifyText } from '../utils/linkifyText'

const API = (import.meta as any).env?.VITE_API_URL || ''

const INDUSTRY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  DESIGN: 'Design',
  FINE_ART: 'Fine Art',
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface PostCardProps {
  post: any
  myUserId?: string
  myProfileId?: string
  industryColor?: string
  onLikeToggle: (postId: string, liked: boolean, newCount: number) => void
}

export default function PostCard({ post, myUserId, myProfileId, industryColor = '#6C2EDB', onLikeToggle }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const initialLiked = !!(post.likes && post.likes.length > 0 && myProfileId &&
    post.likes.some((l: any) => l.userId === myProfileId))
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [content, setContent] = useState(post.content)
  const [hidden, setHidden] = useState(false)
  const isMyPost = post.author?.userId === myUserId

  const handleLike = async () => {
    const newLiked = !liked
    const newCount = likeCount + (newLiked ? 1 : -1)
    setLiked(newLiked)
    setLikeCount(newCount)
    onLikeToggle(post.id, newLiked, newCount)
    try {
      await fetch(`${API}/api/community/posts/${post.id}/like`, {
        method: 'POST', credentials: 'include'
      })
    } catch {
      setLiked(!newLiked)
      setLikeCount(likeCount)
    }
  }

  const handleEdit = async () => {
    try {
      const res = await fetch(`${API}/api/community/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: editContent }),
      })
      if (res.ok) { setContent(editContent); setEditing(false) }
    } catch { /* silent */ }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    try {
      await fetch(`${API}/api/community/posts/${post.id}`, {
        method: 'DELETE', credentials: 'include'
      })
      setHidden(true)
    } catch { /* silent */ }
  }

  const handleReport = async () => {
    await fetch(`${API}/api/community/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ postId: post.id, reason: 'user_report' }),
    })
    setShowMenu(false)
    alert('Reported. Thank you.')
  }

  if (hidden) return null

  const name = `${post.author?.user?.firstName || ''} ${post.author?.user?.lastName || ''}`.trim()
  const initials = name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <div className="rounded-2xl overflow-hidden" data-testid="post-card"
      style={{
        background: 'var(--surface-base)',
        border: '0.5px solid var(--border)',
        borderLeft: `3px solid ${industryColor}`,
      }}>

      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: industryColor }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">{name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded text-[var(--text-tertiary)]"
              style={{ background: 'var(--surface-background)' }}>
              {INDUSTRY_LABELS[post.industry] || post.industry}
            </span>
            {post.author?.city && (
              <span className="text-[10px] text-[var(--text-tertiary)]">· {post.author.city}</span>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {timeAgo(post.createdAt)}
            {post.editedAt && <span className="ml-1 opacity-60">(edited)</span>}
          </p>
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            data-testid="post-menu-toggle"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-background)] active:bg-[var(--surface-background)] active:scale-90 transition-colors"
          >
            <DotsThree className="w-4 h-4" weight="bold" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 rounded-xl overflow-hidden shadow-lg min-w-[140px]"
              style={{ background: 'var(--surface-base)', border: '0.5px solid var(--border)' }}>
              {isMyPost ? (
                <>
                  <button onClick={() => { setEditing(true); setShowMenu(false) }}
                    data-testid="post-edit-btn"
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-text-primary hover:bg-[var(--surface-background)] transition-colors">
                    <PencilSimple className="w-3.5 h-3.5" /> Edit post
                  </button>
                  <button onClick={handleDelete}
                    data-testid="post-delete-btn"
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors">
                    <Trash className="w-3.5 h-3.5" /> Delete post
                  </button>
                </>
              ) : (
                <button onClick={handleReport}
                  data-testid="post-report-btn"
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-background)] transition-colors">
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-0">
        {editing ? (
          <div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full text-sm text-text-primary resize-none outline-none rounded-lg p-2.5"
              style={{ background: 'var(--surface-background)', border: '0.5px solid var(--border)' }}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleEdit}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                style={{ background: '#6C2EDB' }}>Save</button>
              <button onClick={() => { setEditing(false); setEditContent(content) }}
                className="text-xs px-3 py-1.5 rounded-lg text-[var(--text-secondary)]"
                style={{ border: '0.5px solid var(--border)' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: linkifyText(content) }} />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-3">
        <button onClick={handleLike}
          data-testid="post-like-btn"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
          style={{ color: liked ? '#E8891A' : 'var(--text-tertiary)' }}>
          <Heart weight={liked ? 'fill' : 'regular'} className="w-4 h-4" />
          <span className="text-xs tabular-nums">{likeCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)}
          data-testid="post-comment-toggle"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[var(--text-tertiary)] transition-all hover:text-[var(--text-secondary)]">
          <ChatCircle className="w-4 h-4" />
          <span className="text-xs tabular-nums">{post._count?.comments || 0}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentThread postId={post.id} />
      )}
    </div>
  )
}
