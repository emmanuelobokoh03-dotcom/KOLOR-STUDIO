import { useState, useEffect, useCallback, useRef } from 'react'
import KolorSpinner from './KolorSpinner'
import PostCard from './PostCard'
import { ImageSquare } from '@phosphor-icons/react/dist/csr/ImageSquare'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Z } from '../lib/z'

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

// Client-side image compression — resizes to 1600px max side, JPEG q=0.85
// Drops a typical 5MB iPhone photo to ~300-400KB
async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxSide || height > maxSide) {
        const ratio = Math.min(maxSide / width, maxSide / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(blob
          ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
          : file),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

interface CommunityFeedProps {
  userIndustry?: string | null
  userId?: string
  onOpenSettings?: (tab: string) => void
  onNavigateToPortfolio?: () => void
}

export default function CommunityFeed({ userIndustry, userId, onOpenSettings, onNavigateToPortfolio }: CommunityFeedProps) {
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
  const [showIntro, setShowIntro] = useState(false)
  const composeRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [composeImage, setComposeImage] = useState<File | null>(null)
  const [composeImagePreview, setComposeImagePreview] = useState<string | null>(null)

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

  // First-time community intro modal — show once per user
  useEffect(() => {
    fetch(`${API}/api/community/profile/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d?.profile && d.profile.hasSeenCommunityIntro === false && !d.profile.isSynthetic) {
          setShowIntro(true)
        }
      })
      .catch(() => {})
  }, [])

  const dismissIntro = (openSettings: boolean) => {
    setShowIntro(false)
    fetch(`${API}/api/community/profile`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasSeenCommunityIntro: true }),
    }).catch(() => {})
    if (openSettings && onOpenSettings) onOpenSettings('community')
  }


  const handleCompose = (val: string) => {
    setCompose(val)
    const lower = val.toLowerCase()
    setShowMilestone(MILESTONE_KEYWORDS.some(kw => lower.includes(kw)))
  }

  const handlePost = async () => {
    if (!compose.trim() || posting) return
    setPosting(true)
    try {
      // Map user's primaryIndustry (9 values) to community Post industry (3 values)
      const postIndustry =
        (userIndustry === 'FINE_ART' || userIndustry === 'SCULPTURE') ? 'FINE_ART'
        : (userIndustry === 'WEB_DESIGN' || userIndustry === 'BRANDING' || userIndustry === 'ILLUSTRATION' || userIndustry === 'GRAPHIC_DESIGN' || userIndustry === 'DESIGN') ? 'DESIGN'
        : 'PHOTOGRAPHY'
      // Upload image if selected
      let imageUrls: string[] = []
      if (composeImage) {
        const formData = new FormData()
        formData.append('image', composeImage)
        try {
          const uploadRes = await fetch(`${API}/api/community/upload-image`, {
            method: 'POST', credentials: 'include', body: formData,
          })
          const uploadData = await uploadRes.json()
          if (uploadData.url) imageUrls = [uploadData.url]
        } catch { /* upload failed -- post without image */ }
      }

      const res = await fetch(`${API}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: compose.trim(), industry: postIndustry, images: imageUrls }),
      })
      const data = await res.json()
      if (data.post) {
        setPosts(prev => [data.post, ...prev])
        setCompose('')
        setShowMilestone(false)
        setComposeImage(null)
        setComposeImagePreview(null)
        if (imageInputRef.current) imageInputRef.current.value = ''
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
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }} data-testid="community-feed">

      {showIntro && (
        <div
          data-testid="community-intro-modal"
          style={{
            position: 'fixed', inset: 0, zIndex: Z.MODAL,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => dismissIntro(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface-base)',
              borderRadius: '20px',
              padding: '28px 24px',
              maxWidth: '380px',
              width: '100%',
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Welcome to the KOLOR Community
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
              This is a space for independent creatives — Photography, Design and Fine Art — to share wins, ask questions and connect.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
              Your name, industry, city and bio are visible to other members in Discover. Posts and comments are visible to the whole community.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              You'll get an email when someone likes, comments, follows or messages you — you can turn this off anytime in Settings → Community.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => dismissIntro(false)}
                data-testid="community-intro-got-it"
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '10px',
                  background: '#6C2EDB', color: '#fff', fontSize: '13px',
                  fontWeight: 600, border: 'none', cursor: 'pointer',
                }}
              >
                Got it
              </button>
              <button
                onClick={() => dismissIntro(true)}
                data-testid="community-intro-edit-profile"
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '10px',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px',
                  fontWeight: 600, border: '0.5px solid var(--border)', cursor: 'pointer',
                }}
              >
                Edit my profile
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Trending rail */}
      {trending.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-3">
            Popular this week
          </p>
          <div className="flex flex-col gap-2">
            {trending.map((post) => {
              const tColor = INDUSTRY_COLORS[post.industry] || '#6C2EDB'
              const tName = post.author?.user?.firstName || 'Member'
              return (
                <div key={post.id}
                  className="p-3.5 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                  style={{ background: tColor + '08', border: '0.5px solid ' + tColor + '25', borderLeft: '3px solid ' + tColor }}
                  onClick={() => setIndustry(post.industry)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                      style={{ background: tColor }}>
                      {tName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-semibold truncate" style={{ color: tColor }}>{tName}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] ml-auto flex-shrink-0">♥ {post._count?.likes}</span>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed line-clamp-2">{post.content}</p>
                </div>
              )
            })}
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
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{
              background: industry === f.value ? '#6C2EDB' : 'var(--surface-background)',
              color: industry === f.value ? '#fff' : 'var(--text-secondary)',
              border: '0.5px solid ' + (industry === f.value ? '#6C2EDB' : 'var(--border)'),
              transition: 'transform 0.1s, opacity 0.1s, background 0.2s, color 0.2s',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
            onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
            onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
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
            placeholder={
              ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'CONTENT_CREATION'].includes(userIndustry || '') ? 'What did you shoot today?'
              : ['FINE_ART', 'SCULPTURE'].includes(userIndustry || '') ? "What's on the easel?"
              : ['GRAPHIC_DESIGN', 'WEB_DESIGN', 'BRANDING', 'ILLUSTRATION', 'DESIGN'].includes(userIndustry || '') ? 'What are you working on?'
              : 'Share something with your community...'
            }
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
              <button className="ml-auto text-[10px] font-semibold underline"
                onClick={() => onNavigateToPortfolio?.()}>Add</button>
            </div>
          )}
          {composeImagePreview && (
            <div className="relative mt-2">
              <img src={composeImagePreview} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: 200 }} />
              <button
                onClick={() => { setComposeImage(null); setComposeImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = '' }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                data-testid="compose-image-remove"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}
        </div>
        {/* Image picker */}
        <div className="px-4 pb-1 flex items-center">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: composeImage ? '#6C2EDB' : 'var(--text-tertiary)' }}
            data-testid="feed-compose-image-btn"
          >
            <ImageSquare className="w-4 h-4" />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f && f.size <= 10 * 1024 * 1024) {
                const compressed = await compressImage(f)
                setComposeImage(compressed)
                setComposeImagePreview(URL.createObjectURL(compressed))
              }
            }}
          />
        </div>
        {compose.trim() && (
          <div className="px-4 pb-3 flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-tertiary)]">{compose.length}/500</span>
            <button
              onClick={handlePost}
              disabled={posting}
              data-testid="feed-compose-submit"
              className="text-xs font-semibold px-4 py-2 rounded-lg text-white"
              style={{ background: '#6C2EDB', transition: 'transform 0.1s, opacity 0.1s' }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
              onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
              onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
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
