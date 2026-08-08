import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import KolorSpinner from '../components/KolorSpinner'
import ShotTile from '../components/community/ShotTile'
import { toast } from 'sonner'

const API = (import.meta as any).env?.VITE_API_URL || ''

// iter 287-v3c2 — Collection detail page. Route: /collection/:id.
// Read-only shot grid + owner rename/toggle-public/delete actions.
export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [meProfile, setMeProfile] = useState<{ id: string } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true); setNotFound(false)
    Promise.all([
      fetch(`${API}/api/collections/${id}`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API}/api/community/profile/me`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([c, me]) => {
        if (!c?.collection) { setNotFound(true); return }
        setData(c.collection); setNewName(c.collection.name)
        if (me?.profile) setMeProfile({ id: me.profile.id })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--kolor-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><KolorSpinner size={32} /></div>
  if (notFound || !data) return <NotFound onBack={() => navigate('/dashboard?view=community')} />

  const isOwner = meProfile?.id === data.ownerId
  const items = data.items || []
  const owner = data.owner
  const ownerName = owner?.user ? `${owner.user.firstName}${owner.user.lastName ? ' ' + owner.user.lastName : ''}` : 'Unknown'

  const handleRename = async () => {
    if (!newName.trim() || newName === data.name) { setRenaming(false); return }
    const res = await fetch(`${API}/api/collections/${data.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) { setData({ ...data, name: newName.trim() }); toast.success('Collection renamed') }
    setRenaming(false)
  }

  const handleTogglePublic = async () => {
    const res = await fetch(`${API}/api/collections/${data.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !data.isPublic }),
    })
    if (res.ok) { setData({ ...data, isPublic: !data.isPublic }); toast.success(data.isPublic ? 'Set to Private' : 'Set to Public') }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete collection "${data.name}"?`)) return
    const res = await fetch(`${API}/api/collections/${data.id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) { toast.success('Collection deleted'); navigate('/community/collections') }
  }

  return (
    <div data-testid="collection-detail" style={{ minHeight: '100vh', background: 'var(--kolor-canvas)' }}>
      <header style={hdrStyle}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>
        <p style={wordmark}>KOLOR</p>
        <div style={{ width: '60px' }} />
      </header>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <section style={{ paddingBottom: '32px', borderBottom: '1px solid var(--kolor-hairline)' }}>
          <p style={monoEyebrow}>Collection · {data.isPublic ? 'Public' : 'Private'}</p>
          {renaming ? (
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={handleRename} onKeyDown={(e) => e.key === 'Enter' && handleRename()} autoFocus data-testid="rename-input"
              style={{ ...nameStyle, background: 'transparent', border: 'none', borderBottom: '1px solid var(--kolor-terra)', outline: 'none', width: '100%' }} />
          ) : (
            <h1 style={nameStyle} onClick={() => isOwner && setRenaming(true)}>{data.name}</h1>
          )}
          {owner && <p style={{ ...bioStyle, marginTop: '12px' }}>By <span onClick={() => owner.handle && navigate(`/creator/${owner.handle}`)} style={{ color: 'var(--kolor-terra)', cursor: owner.handle ? 'pointer' : 'default', fontWeight: 500 }}>{ownerName}</span></p>}
          <p style={{ ...monoMeta, marginTop: '12px' }}>{items.length} {items.length === 1 ? 'shot' : 'shots'}</p>
          {isOwner && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={handleTogglePublic} data-testid="toggle-public" style={btnGhostInk}>Make {data.isPublic ? 'Private' : 'Public'}</button>
              <button onClick={handleDelete} data-testid="delete-collection" style={{ ...btnGhostInk, borderColor: 'var(--kolor-terra)', color: 'var(--kolor-terra)' }}>Delete</button>
            </div>
          )}
        </section>
        <section style={{ padding: '48px 0 0' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: '24px', color: 'var(--kolor-ink-muted)', margin: 0 }}>This collection is empty.</p>
              {isOwner && <button onClick={() => navigate('/dashboard?view=community')} style={{ ...btnGhostTerra, marginTop: '20px' }}>Browse shots to add</button>}
            </div>
          ) : (
            <div className="cd-masonry" style={{ columnCount: 3, columnGap: '16px' }}>
              {items.filter((it: any) => it.post?.mainImage).map((it: any) => (
                <ShotTile key={it.post.id} shot={{ id: it.post.id, mainImage: it.post.mainImage, content: it.post.content, industry: it.post.industry, author: it.post.author, _count: it.post._count }} onClick={(pid) => navigate(`/shot/${pid}`)} />
              ))}
            </div>
          )}
        </section>
      </main>
      <style>{`
        @media (max-width: 900px) { .cd-masonry { column-count: 2 !important; } }
        @media (max-width: 560px) { .cd-masonry { column-count: 1 !important; } }
      `}</style>
    </div>
  )
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kolor-canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
      <p style={monoEyebrow}>404</p>
      <h1 style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: 'clamp(32px, 6vw, 48px)', color: 'var(--kolor-ink)', margin: '12px 0 24px' }}>Collection not found.</h1>
      <button onClick={onBack} data-testid="notfound-back" style={btnGhostTerra}>Back to Community</button>
    </div>
  )
}

const hdrStyle: any = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--kolor-hairline)' }
const wordmark: any = { fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: '20px', color: 'var(--kolor-ink)', margin: 0 }
const backBtn: any = { padding: '6px 0', background: 'transparent', border: 'none', fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-ink-muted)', cursor: 'pointer' }
const monoEyebrow: any = { fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-terra)', margin: 0 }
const monoMeta: any = { fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--kolor-ink-subtle)', margin: 0 }
const nameStyle: any = { fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: 'clamp(32px, 5vw, 40px)', fontWeight: 400, color: 'var(--kolor-ink)', margin: '10px 0 0', letterSpacing: '-0.02em', lineHeight: 1.1 }
const bioStyle: any = { fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--kolor-ink-muted)', margin: 0 }
const btnGhostTerra: any = { padding: '10px 18px', background: 'transparent', border: '1px solid var(--kolor-terra)', borderRadius: '2px', fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-terra)', cursor: 'pointer' }
const btnGhostInk: any = { ...btnGhostTerra, borderColor: 'var(--kolor-hairline)', color: 'var(--kolor-ink-muted)' }
