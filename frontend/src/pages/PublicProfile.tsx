import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import KolorSpinner from '../components/KolorSpinner'
import ShotTile from '../components/community/ShotTile'
import CollectionCard from '../components/community/CollectionCard'
import { getIndustryLanguage } from '../utils/industryLanguage'
import { mapToPostIndustry } from '../lib/imageCompress'
import { SUB_CHIPS } from '../lib/communityTaxonomy'
import type { CreativeIndustry } from '../lib/communityTaxonomy'
import { toast } from 'sonner'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface ProfileData {
  id: string
  handle?: string | null
  bio?: string | null
  city?: string | null
  availability?: string | null
  subHeadline?: string | null
  joinedAt?: string
  isPublic?: boolean
  user: {
    id?: string
    firstName: string
    lastName?: string
    primaryIndustry?: string | null
    website?: string | null
  }
}

const INDUSTRY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  DESIGN: 'Design',
  FINE_ART: 'Fine Art',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  ILLUSTRATION: 'Illustration',
  BRANDING: 'Branding',
  SCULPTURE: 'Sculpture',
}

// iter 287-v3c2 — Public Profile page with inline edit mode (Q95=A).
// Route: /creator/:handle. Publicly accessible; edit mode owner-only.
export default function PublicProfile() {
  const { handle } = useParams<{ handle: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [meProfile, setMeProfile] = useState<{ id: string; userId: string } | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '', city: '', availability: '', subHeadline: '', isPublic: true })
  const [saving, setSaving] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    if (!handle) return
    setLoading(true); setNotFound(false)
    Promise.all([
      fetch(`${API}/api/profiles/${handle}`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API}/api/profiles/${handle}/posts`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : { posts: [] })),
      fetch(`${API}/api/profiles/${handle}/collections`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : { collections: [] })),
      fetch(`${API}/api/community/profile/me`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([p, ps, cs, me]) => {
        if (!p?.profile) { setNotFound(true); return }
        setProfile(p.profile)
        setPosts(ps.posts || [])
        setCollections(cs.collections || [])
        setEditForm({
          bio: p.profile.bio || '', city: p.profile.city || '',
          availability: p.profile.availability || '', subHeadline: p.profile.subHeadline || '',
          isPublic: p.profile.isPublic !== false,
        })
        if (me?.profile) {
          setMeProfile({ id: me.profile.id, userId: me.profile.userId })
          fetch(`${API}/api/community/follows/${p.profile.id}/status`, { credentials: 'include' })
            .then((r) => r.ok ? r.json() : null)
            .then((d) => d && setIsFollowing(!!d.isFollowing))
            .catch(() => {})
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [handle])

  const isOwner = meProfile?.id === profile?.id
  const postIndustry = profile ? mapToPostIndustry(profile.user.primaryIndustry) : 'DESIGN'
  const lang = getIndustryLanguage(postIndustry as CreativeIndustry)

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/community/profile`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editForm.bio.trim(), city: editForm.city.trim(),
          availability: editForm.availability.trim() || null,
          subHeadline: editForm.subHeadline || null, isPublic: editForm.isPublic,
        }),
      })
      const data = await res.json()
      if (data.profile) {
        setProfile((p) => p ? { ...p, ...data.profile, user: p.user } : p)
        setEditMode(false)
        toast.success('Profile updated')
      } else { toast.error('Save failed') }
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const handleFollow = async () => {
    if (followBusy || !profile) return
    setFollowBusy(true)
    try {
      const res = await fetch(`${API}/api/community/follows/${profile.id}`, {
        method: isFollowing ? 'DELETE' : 'POST', credentials: 'include',
      })
      if (res.ok) setIsFollowing(!isFollowing)
    } catch { toast.error('Follow failed') }
    setFollowBusy(false)
  }

  // iter 289-v3c3a.2 — MESSAGE button on non-owner PublicProfile.
  // Hits find-or-create endpoint (POST /api/community/dms/:profileId),
  // then deep-links into Dashboard Messages tab with the returned threadId.
  const handleMessage = async () => {
    if (!profile) return
    try {
      const res = await fetch(`${API}/api/community/dms/${profile.id}`, {
        method: 'POST', credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data?.thread?.id) {
        navigate(`/dashboard?view=community&subtab=dms&thread=${data.thread.id}`)
      } else {
        toast.error('Could not start conversation')
      }
    } catch { toast.error('Could not start conversation') }
  }

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--kolor-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><KolorSpinner size={32} /></div>
  if (notFound || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--kolor-canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-terra)', margin: '0 0 12px' }}>404</p>
        <h1 style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: 'clamp(32px, 6vw, 48px)', color: 'var(--kolor-ink)', margin: '0 0 24px' }}>Creator not found.</h1>
        <button onClick={() => navigate('/dashboard?view=community')} data-testid="profile-back" style={btnGhostTerra}>Back to Community</button>
      </div>
    )
  }

  const name = `${profile.user.firstName}${profile.user.lastName ? ' ' + profile.user.lastName : ''}`
  const initial = profile.user.firstName?.charAt(0).toUpperCase() || '?'
  const industryLabel = profile.user.primaryIndustry ? INDUSTRY_LABELS[profile.user.primaryIndustry] || profile.user.primaryIndustry : ''
  const meta = [profile.subHeadline || industryLabel, profile.city, profile.availability].filter(Boolean).join(' · ')

  return (
    <div data-testid="public-profile" style={{ minHeight: '100vh', background: 'var(--kolor-canvas)' }}>
      <header style={hdrStyle}>
        <button onClick={() => navigate(-1)} data-testid="profile-back" style={backBtn}>← Back</button>
        <p style={wordmark}>KOLOR</p>
        <div style={{ width: '60px' }} />
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header block */}
        <section style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '32px', alignItems: 'start', paddingBottom: '32px', borderBottom: '1px solid var(--kolor-hairline)' }}>
          <div style={avatarStyle}>{initial}</div>
          <div>
            {profile.handle && <p style={monoEyebrow}>@{profile.handle}</p>}
            <h1 style={nameStyle}>{name}</h1>
            {!editMode && <p style={{ ...monoMeta, marginTop: '12px' }}>{meta}</p>}
            {!editMode && profile.bio && <p style={bioStyle}>{profile.bio}</p>}
            {editMode && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
                <TextInput label="City" value={editForm.city} onChange={(v) => setEditForm((f) => ({ ...f, city: v }))} maxLength={40} />
                <TextInput label="Availability" value={editForm.availability} onChange={(v) => setEditForm((f) => ({ ...f, availability: v }))} maxLength={30} />
                <div>
                  <label style={editLabel}>Specialization</label>
                  <select value={editForm.subHeadline} onChange={(e) => setEditForm((f) => ({ ...f, subHeadline: e.target.value }))} data-testid="edit-subheadline" style={selectStyle}>
                    <option value="">— None —</option>
                    {SUB_CHIPS[postIndustry as CreativeIndustry].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={editLabel}>Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value.slice(0, 150) }))} rows={3} data-testid="edit-bio" style={textareaStyle} />
                  <p style={{ ...monoMeta, textAlign: 'right', margin: '4px 0 0' }}>{editForm.bio.length}/150</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', ...monoMeta }}>
                  <input type="checkbox" checked={editForm.isPublic} onChange={(e) => setEditForm((f) => ({ ...f, isPublic: e.target.checked }))} data-testid="edit-ispublic" />
                  Profile visible to non-KOLOR visitors
                </label>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
            {isOwner && !editMode && <button onClick={() => setEditMode(true)} data-testid="edit-profile" style={btnGhostTerra}>Edit profile</button>}
            {isOwner && editMode && (
              <>
                <button onClick={handleSave} disabled={saving} data-testid="save-profile" style={btnSolidTerra}>{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setEditMode(false)} data-testid="cancel-profile" style={btnGhostInk}>Cancel</button>
              </>
            )}
            {!isOwner && meProfile && (
              <>
                <button onClick={handleFollow} disabled={followBusy} data-testid="follow" style={btnGhostTerra}>
                  {followBusy ? '…' : isFollowing ? 'Following' : 'Follow'}
                </button>
                <button onClick={handleMessage} data-testid="message" style={btnGhostInk}>
                  Message
                </button>
                {profile.user.id && <button onClick={() => navigate(`/portfolio/${profile.user.id}`)} data-testid="visit-portfolio" style={btnGhostTerra}>Visit portfolio</button>}
              </>
            )}
          </div>
        </section>

        {/* Shots */}
        <section style={{ padding: '48px 0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
            <p style={sectionEyebrow}>{lang.shotPlural}</p>
            <span style={monoMeta}>{posts.length} {posts.length === 1 ? lang.shot : lang.shotPlural}</span>
          </div>
          {posts.length === 0 ? (
            <p style={emptyText}>This creator hasn't posted yet.</p>
          ) : (
            <div className="profile-masonry" style={{ columnCount: 3, columnGap: '16px' }}>
              {posts.filter((p) => p.mainImage).map((p) => (
                <ShotTile key={p.id} shot={{ id: p.id, mainImage: p.mainImage, content: p.content, industry: p.industry, author: { id: profile.id, handle: profile.handle, user: profile.user }, _count: p._count }} onClick={(id) => navigate(`/shot/${id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* Collections */}
        {collections.length > 0 && (
          <section style={{ padding: '32px 0', borderTop: '1px solid var(--kolor-hairline)' }}>
            <p style={{ ...sectionEyebrow, marginBottom: '24px' }}>Collections</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {collections.map((c) => <CollectionCard key={c.id} collection={c} />)}
            </div>
          </section>
        )}
      </main>

      <style>{`
        @media (max-width: 900px) { .profile-masonry { column-count: 2 !important; } }
        @media (max-width: 560px) { .profile-masonry { column-count: 1 !important; } }
      `}</style>
    </div>
  )
}

const hdrStyle: any = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--kolor-hairline)' }
const wordmark: any = { fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: '20px', color: 'var(--kolor-ink)', margin: 0 }
const backBtn: any = { padding: '6px 0', background: 'transparent', border: 'none', fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-ink-muted)', cursor: 'pointer' }
const avatarStyle: any = { width: '120px', height: '120px', borderRadius: '50%', background: 'var(--kolor-canvas-shade-1)', border: '1px solid var(--kolor-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: '52px', color: 'var(--kolor-ink)' }
const monoEyebrow: any = { fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--kolor-ink-subtle)', margin: 0 }
const nameStyle: any = { fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: 400, color: 'var(--kolor-ink)', margin: '10px 0 0', letterSpacing: '-0.02em', lineHeight: 1.1 }
const monoMeta: any = { fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--kolor-ink-subtle)', margin: 0 }
const bioStyle: any = { fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: 1.7, color: 'var(--kolor-ink-muted)', margin: '16px 0 0', maxWidth: '580px' }
const sectionEyebrow: any = { fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-terra)', margin: 0 }
const emptyText: any = { fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--kolor-ink-subtle)', textAlign: 'center', padding: '48px 0' }
const editLabel: any = { display: 'block', fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--kolor-ink-subtle)', marginBottom: '6px' }
const textareaStyle: any = { width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--kolor-hairline)', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--kolor-ink)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }
const selectStyle: any = { width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--kolor-hairline)', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--kolor-ink)', outline: 'none' }
const btnGhostTerra: any = { padding: '10px 18px', background: 'transparent', border: '1px solid var(--kolor-terra)', borderRadius: '2px', fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-terra)', cursor: 'pointer' }
const btnSolidTerra: any = { ...btnGhostTerra, background: 'var(--kolor-terra)', color: 'var(--kolor-canvas)' }
const btnGhostInk: any = { ...btnGhostTerra, borderColor: 'var(--kolor-hairline)', color: 'var(--kolor-ink-muted)' }

function TextInput({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number }) {
  return (
    <div>
      <label style={editLabel}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)} data-testid={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
        style={{ ...textareaStyle, resize: undefined } as any} />
    </div>
  )
}
