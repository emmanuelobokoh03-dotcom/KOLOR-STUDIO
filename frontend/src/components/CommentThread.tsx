import { useState, useEffect } from 'react'
import KolorSpinner from './KolorSpinner'
import { linkifyText } from '../utils/linkifyText'

const API = (import.meta as any).env?.VITE_API_URL || ''

export default function CommentThread({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/community/posts/${postId}/comments`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setComments(d.comments || []))
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
      if (data.comment) { setComments(prev => [...prev, data.comment]); setInput('') }
    } catch { /* silent */ }
    setPosting(false)
  }

  return (
    <div className="border-t px-4 pt-3 pb-4" style={{ borderColor: 'var(--border)' }} data-testid="comment-thread">
      {loading ? (
        <div className="flex justify-center py-3"><KolorSpinner size={16} /></div>
      ) : (
        <div className="flex flex-col gap-3 mb-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: '#6C2EDB' }}>
                {c.author?.user?.firstName?.[0]}{c.author?.user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] font-semibold text-text-primary">
                    {c.author?.user?.firstName} {c.author?.user?.lastName}
                  </span>
                  {c.author?.city && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {c.author.city}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-primary leading-relaxed mt-0.5" dangerouslySetInnerHTML={{ __html: linkifyText(c.content) }} />
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-[var(--text-tertiary)] text-center py-1">No comments yet</p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a comment..."
          maxLength={300}
          data-testid="comment-input"
          className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
          style={{ background: 'var(--surface-background)', border: '0.5px solid var(--border)', color: 'var(--text-primary)' }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        {input.trim() && (
          <button onClick={handleSubmit} disabled={posting}
            data-testid="comment-submit"
            className="text-xs font-semibold px-3 py-2 rounded-lg text-white flex-shrink-0"
            style={{ background: '#6C2EDB' }}>
            {posting ? '...' : 'Post'}
          </button>
        )}
      </div>
    </div>
  )
}
