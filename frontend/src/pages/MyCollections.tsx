import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KolorSpinner from '../components/KolorSpinner'
import CollectionCard from '../components/community/CollectionCard'
import { toast } from 'sonner'
import { Z } from '../lib/z'

const API = (import.meta as any).env?.VITE_API_URL || ''

// iter 287-v3c2 — My Collections page. Route: /community/collections.
// Auth required. Lists own collections + create-new modal.
export default function MyCollections() {
  const navigate = useNavigate()
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIsPublic, setNewIsPublic] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/collections/mine`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { collections: [] }))
      .then((d) => setCollections(d.collections || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch(`${API}/api/collections`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), isPublic: newIsPublic }),
      })
      const data = await res.json()
      if (data.collection) {
        setCollections((prev) => [data.collection, ...prev])
        setNewName(''); setModalOpen(false); toast.success('Collection created')
      } else { toast.error('Create failed') }
    } catch { toast.error('Create failed') }
    setCreating(false)
  }

  return (
    <div data-testid="my-collections" style={{ minHeight: '100vh', background: 'var(--kolor-canvas)' }}>
      <header style={hdrStyle}>
        <button onClick={() => navigate('/dashboard?view=community')} style={backBtn}>← Back</button>
        <p style={wordmark}>KOLOR</p>
        <div style={{ width: '60px' }} />
      </header>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <p style={monoEyebrow}>Yours</p>
            <h1 style={nameStyle}>My Collections</h1>
            <p style={{ ...monoMeta, marginTop: '10px' }}>{collections.length} {collections.length === 1 ? 'collection' : 'collections'}</p>
          </div>
          <button onClick={() => setModalOpen(true)} data-testid="new-collection" style={btnGhostTerra}>New collection</button>
        </section>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><KolorSpinner size={28} /></div>
        ) : collections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', borderTop: '1px solid var(--kolor-hairline)' }}>
            <p style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: '28px', color: 'var(--kolor-ink)', margin: '0 0 12px' }}>You haven't saved anything yet.</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--kolor-ink-muted)', margin: '0 0 24px' }}>Save shots from the community to build your first collection.</p>
            <button onClick={() => navigate('/dashboard?view=community')} data-testid="empty-browse" style={btnGhostTerra}>Browse shots</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {collections.map((c) => <CollectionCard key={c.id} collection={c} />)}
          </div>
        )}
      </main>

      {modalOpen && (
        <div onClick={() => setModalOpen(false)} data-testid="create-modal-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: Z.MODAL, background: 'rgba(26, 22, 19, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} data-testid="create-modal"
            style={{ background: 'var(--kolor-canvas)', border: '1px solid var(--kolor-hairline-strong)', borderRadius: '2px', padding: '32px', maxWidth: '440px', width: '100%' }}>
            <p style={monoEyebrow}>New collection</p>
            <h3 style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: '24px', color: 'var(--kolor-ink)', margin: '10px 0 24px' }}>Name your set.</h3>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value.slice(0, 60))} placeholder="Collection name" autoFocus data-testid="create-name"
              style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--kolor-hairline)', fontFamily: 'Inter, sans-serif', fontSize: '18px', color: 'var(--kolor-ink)', outline: 'none' }} />
            <p style={{ ...monoMeta, textAlign: 'right', margin: '4px 0 20px' }}>{newName.length}/60</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', ...monoMeta, marginBottom: '24px', cursor: 'pointer' }}>
              <input type="checkbox" checked={newIsPublic} onChange={(e) => setNewIsPublic(e.target.checked)} data-testid="create-ispublic" />
              Public collection
            </label>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)} data-testid="create-cancel" style={btnGhostInk}>Cancel</button>
              <button onClick={handleCreate} disabled={!newName.trim() || creating} data-testid="create-submit"
                style={{ ...btnGhostTerra, background: newName.trim() ? 'var(--kolor-terra)' : 'transparent', color: newName.trim() ? 'var(--kolor-canvas)' : 'var(--kolor-terra)', opacity: newName.trim() ? 1 : 0.5, cursor: newName.trim() ? 'pointer' : 'not-allowed' }}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const hdrStyle: any = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--kolor-hairline)' }
const wordmark: any = { fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: '20px', color: 'var(--kolor-ink)', margin: 0 }
const backBtn: any = { padding: '6px 0', background: 'transparent', border: 'none', fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-ink-muted)', cursor: 'pointer' }
const monoEyebrow: any = { fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-terra)', margin: 0 }
const monoMeta: any = { fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--kolor-ink-subtle)', margin: 0 }
const nameStyle: any = { fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: 'clamp(28px, 4.5vw, 36px)', fontWeight: 400, color: 'var(--kolor-ink)', margin: '8px 0 0', letterSpacing: '-0.02em', lineHeight: 1.1 }
const btnGhostTerra: any = { padding: '10px 18px', background: 'transparent', border: '1px solid var(--kolor-terra)', borderRadius: '2px', fontFamily: 'var(--font-mono, "Space Mono", monospace)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--kolor-terra)', cursor: 'pointer' }
const btnGhostInk: any = { ...btnGhostTerra, borderColor: 'var(--kolor-hairline)', color: 'var(--kolor-ink-muted)' }
