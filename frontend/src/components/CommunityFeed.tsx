import { useState, useEffect, useCallback, useRef } from 'react'
import KolorSpinner from './KolorSpinner'
import PostCard from './PostCard'

const API = (import.meta as any).env?.VITE_API_URL || ''

const INDUSTRY_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'FINE_ART', label: 'Fine Art' },
]

const INDUSTRY_COLORS: Record<string, string> = {
  PHOTOGRAPHY: '#1A6B4A',
  DESIGN: '#6C2EDB',
  FINE_ART: '#A32D2D',
}

const MILESTONE_KEYWORDS = ['commission', 'delivered', 'signed', 'paid', 'completed', 'booked', 'first client', 'first quote', 'sold']

interface CommunityFeedProps {
  userIndustry?: string | null
  userId?: string
}

export default function CommunityFeed({ userIndustry, userId }: CommunityFeedProps) {
  const [industry, setIndustry] = useState(userIndustry || 'ALL')
  const [posts, setPosts] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [compose, setCompose] = useState('')
  const [posting, setPosting] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const composeRef = useRef<HTMLTextAreaElement>(null)

  const fetchFeed = useCallback(async (ind: string, cur?: string | null) => {
    try {
      const params = new URLSearchParams({ industry: ind })
      if (cur) params.set('cursor', cur)
      const res = await fetch(`${API}/api/community/feed?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (cur) setPosts(prev => [...prev, ...data.posts])
      else setPosts(data.posts || [])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
      if (data.myProfileId) setMyProfileId(data.myProfileId)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/community/trending`, { credentials: 'include' })
      const data = await res.json()
      setTrending(data.posts || [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    setPosts([])
    setCursor(null)
    fetchFeed(industry)
    fetchTrending()
  }, [industry, fetchFeed, fetchTrending])

  const handleCompose = (val: string) => {
    setCompose(val)
    const lower = val.toLowerCase()
    setShowMilestone(MILESTONE_KEYWORDS.some(kw => lower.includes(kw)))
  }

  const handlePost = async () => {
    if (!compose.trim() || posting) return
    setPosting(true)
    try {
      const postIndustry = userIndustry === 'GRAPHIC_DESIGN' ? 'DESIGN'
        : userIndustry === 'FINE_ART' ? 'FINE_ART' : 'PHOTOGRAPHY'
      const res = await fetch(`${API}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: compose.trim(), industry: postIndustry }),
      })
      const data = await res.json()
      if (data.post) {
        setPosts(prev => [data.post, ...prev])
        setCompose('')
        setShowMilestone(false)
      }
    } catch { /* silent */ }
    setPosting(false)
  }

  const handleLikeToggle = (postId: string, liked: boolean, newCount: number) => {
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, _count: { ...p._count, likes: newCount }, likes: liked && myProfileId ? [{ userId: myProfileId }] : [] }
      : p
    ))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24" data-testid="community-feed">

      {/* Trending rail */}
      {trending.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-3">
            Popular this week
          </p>
          <div className="flex flex-col gap-2">
            {trending.map((post, i) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'var(--surface-background)', border: '0.5px solid var(--border)' }}>
                <span className="text-xs font-bold tabular-nums text-[var(--text-tertiary)] w-4 flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary line-clamp-2">{post.content}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {post.author?.user?.firstName} · {post._count?.likes} likes
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: INDUSTRY_COLORS[post.industry] || 'var(--border)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
        {INDUSTRY_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setIndustry(f.value)}
            data-testid={`feed-filter-${f.value.toLowerCase()}`}
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{
              background: industry === f.value ? '#6C2EDB' : 'var(--surface-background)',
              color: industry === f.value ? '#fff' : 'var(--text-secondary)',
              border: '0.5px solid ' + (industry === f.value ? '#6C2EDB' : 'var(--border)'),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Compose */}
      <div className="mb-5 rounded-2xl overflow-hidden"
        style={{ border: '0.5px solid var(--border)', background: 'var(--surface-base)' }}>
        <div className="p-4">
          <textarea
            ref={composeRef}
            value={compose}
            onChange={e => handleCompose(e.target.value)}
            placeholder="Share something with your community..."
            maxLength={500}
            rows={compose ? 3 : 2}
            data-testid="feed-compose-input"
            className="w-full text-sm text-text-primary placeholder:text-[var(--text-tertiary)] resize-none outline-none bg-transparent"
            style={{ lineHeight: 1.6 }}
          />
          {showMilestone && (
            <div className="mt-2 p-2.5 rounded-lg flex items-center gap-2 text-xs"
              style={{ background: '#EDE9FE', color: '#6C2EDB' }}
              data-testid="milestone-prompt">
              <span>🎉</span>
              <span>This sounds like a milestone — add it to your portfolio?</span>
              <button className="ml-auto text-[10px] font-semibold underline">Add</button>
            </div>
          )}
        </div>
        {compose.trim() && (
          <div className="px-4 pb-3 flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-tertiary)]">{compose.length}/500</span>
            <button
              onClick={handlePost}
              disabled={posting}
              data-testid="feed-compose-submit"
              className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all"
              style={{ background: '#6C2EDB' }}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-12"><KolorSpinner size={28} /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
          No posts yet in this category.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              myUserId={userId}
              myProfileId={myProfileId || undefined}
              industryColor={INDUSTRY_COLORS[post.industry]}
              onLikeToggle={handleLikeToggle}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => fetchFeed(industry, cursor)}
              data-testid="feed-load-more"
              className="text-xs text-[var(--text-tertiary)] py-4 text-center hover:text-[var(--text-secondary)] transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  )
}
