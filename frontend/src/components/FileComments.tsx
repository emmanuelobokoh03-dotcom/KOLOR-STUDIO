import { useState, useEffect, useCallback } from 'react'
import { leadsApi } from '../services/api'
import { PaperPlaneTilt, Trash, SpinnerGap, ChatCircle } from '@phosphor-icons/react'

interface Comment {
  id: string
  authorName: string
  authorType: string
  content: string
  createdAt: string
}

export default function FileComments({ fileId }: { fileId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    const res = await leadsApi.getFileComments(fileId)
    if (res.data?.comments) setComments(res.data.comments)
    setLoading(false)
  }, [fileId])

  useEffect(() => { fetchComments() }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    const res = await leadsApi.addFileComment(fileId, newComment.trim())
    if (res.data?.comment) {
      setComments(prev => [...prev, res.data!.comment])
      setNewComment('')
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    const res = await leadsApi.deleteFileComment(fileId, commentId)
    if (!res.error) setComments(prev => prev.filter(c => c.id !== commentId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <SpinnerGap className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="file-comments-section">
      {comments.length === 0 && (
        <div className="text-center py-4">
          <ChatCircle className="w-6 h-6 mx-auto mb-1.5 text-gray-300" />
          <p className="text-xs text-gray-400">No comments yet</p>
        </div>
      )}

      {comments.map(c => (
        <div
          key={c.id}
          className={`relative group rounded-lg px-3 py-2.5 text-sm border ${
            c.authorType === 'USER'
              ? 'bg-purple-50/60 border-purple-100'
              : 'bg-blue-50/60 border-blue-100'
          }`}
          data-testid={`file-comment-${c.id}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800 text-xs">{c.authorName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              c.authorType === 'USER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {c.authorType === 'USER' ? 'You' : 'Client'}
            </span>
            <span className="text-[10px] text-gray-400 ml-auto">
              {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
              {new Date(c.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">{c.content}</p>
          {c.authorType === 'USER' && (
            <button
              onClick={() => handleDelete(c.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
              title="Delete comment"
              data-testid={`delete-comment-${c.id}`}
            >
              <Trash className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 text-xs rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white"
          disabled={submitting}
          data-testid="file-comment-input"
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          data-testid="file-comment-submit"
        >
          {submitting ? <SpinnerGap className="w-3 h-3 animate-spin" /> : <PaperPlaneTilt className="w-3 h-3" weight="fill" />}
        </button>
      </form>
    </div>
  )
}
