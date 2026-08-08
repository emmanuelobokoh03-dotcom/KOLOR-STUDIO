import { useEffect, useState } from 'react'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { toast } from 'sonner'
import { Z } from '../../lib/z'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface Collection {
  id: string
  name: string
  isPublic: boolean
  _count?: { items: number }
  items?: Array<{ post: { mainImage?: string | null } }>
}

interface SaveToCollectionModalProps {
  shotId: string
  isOpen: boolean
  onClose: () => void
  onSaveComplete?: (collectionCount: number) => void
}

// iter 287-v3b — Multi-select save modal per Q90=A. Displays existing
// collections with checkbox multi-select, create-new-collection input at
// bottom, 5-second UNDO toast on save.
export default function SaveToCollectionModal({
  shotId,
  isOpen,
  onClose,
  onSaveComplete,
}: SaveToCollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [newName, setNewName] = useState('')
  const [newIsPublic, setNewIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSelected(new Set())
    setNewName('')
    setNewIsPublic(true)
    setLoading(true)
    fetch(`${API}/api/collections/mine`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setCollections(data.collections || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch(`${API}/api/collections`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), isPublic: newIsPublic }),
      })
      const data = await res.json()
      if (data.collection) {
        setCollections((prev) => [data.collection, ...prev])
        setSelected((prev) => new Set([...prev, data.collection.id]))
        setNewName('')
      }
    } catch {
      toast.error('Failed to create collection')
    }
    setCreating(false)
  }

  const handleSave = async () => {
    if (selected.size === 0 || saving) return
    setSaving(true)
    const addedTo: string[] = []
    try {
      for (const collectionId of selected) {
        const res = await fetch(`${API}/api/collections/${collectionId}/items`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: shotId }),
        })
        if (res.ok) addedTo.push(collectionId)
      }
      const count = addedTo.length
      toast.success(`Saved to ${count} ${count === 1 ? 'collection' : 'collections'}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            for (const collectionId of addedTo) {
              await fetch(`${API}/api/collections/${collectionId}/items/${shotId}`, {
                method: 'DELETE',
                credentials: 'include',
              }).catch(() => {})
            }
            toast('Undone')
          },
        },
        duration: 5000,
      })
      onSaveComplete && onSaveComplete(count)
      onClose()
    } catch {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div
      data-testid="save-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.MODAL,
        background: 'rgba(26, 22, 19, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        data-testid="save-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--kolor-canvas)',
          border: '1px solid var(--kolor-hairline-strong)',
          borderRadius: '2px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
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
            }}
          >
            Save to collection
          </p>
          <button
            onClick={onClose}
            data-testid="save-modal-close"
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--kolor-hairline)',
              borderRadius: '2px',
              cursor: 'pointer',
              color: 'var(--kolor-ink-muted)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Collections list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '20px',
            maxHeight: '340px',
          }}
        >
          {loading ? (
            <p style={{ fontSize: '13px', color: 'var(--kolor-ink-subtle)', textAlign: 'center', padding: '20px 0' }}>
              Loading…
            </p>
          ) : collections.length === 0 ? (
            <p
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: '16px',
                color: 'var(--kolor-ink-muted)',
                margin: 0,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No collections yet. Create one below.
            </p>
          ) : (
            collections.map((c) => {
              const isSelected = selected.has(c.id)
              const preview = c.items?.[0]?.post?.mainImage
              return (
                <label
                  key={c.id}
                  data-testid={`collection-row-${c.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px 8px',
                    marginBottom: '8px',
                    background: isSelected ? 'var(--kolor-canvas-shade-1)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--kolor-terra)' : 'var(--kolor-hairline)'}`,
                    borderRadius: '2px',
                    cursor: 'pointer',
                    transition: 'background 200ms, border-color 200ms',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'var(--kolor-canvas-shade-1)',
                      border: '1px solid var(--kolor-hairline)',
                      overflow: 'hidden',
                    }}
                  >
                    {preview && (
                      <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--kolor-ink)', margin: 0 }}>
                      {c.name}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                        fontSize: '9px',
                        fontWeight: 500,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color: 'var(--kolor-ink-subtle)',
                        margin: '4px 0 0',
                      }}
                    >
                      {c._count?.items ?? 0} shots · {c.isPublic ? 'Public' : 'Private'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(c.id)}
                    aria-label={`Save to ${c.name}`}
                    style={{ cursor: 'pointer' }}
                  />
                </label>
              )
            })
          )}
        </div>

        {/* Create new */}
        <div
          style={{
            borderTop: '1px solid var(--kolor-hairline)',
            paddingTop: '20px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle)',
              margin: 0,
              marginBottom: '10px',
            }}
          >
            Or create new
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              data-testid="new-collection-name"
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--kolor-hairline)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: 'var(--kolor-ink)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              data-testid="new-collection-create"
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid var(--kolor-hairline)',
                borderRadius: '2px',
                fontFamily: 'var(--font-mono, "Space Mono", monospace)',
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: newName.trim() ? 'var(--kolor-terra)' : 'var(--kolor-ink-subtle)',
                cursor: newName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {creating ? '…' : 'Create'}
            </button>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-muted)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={newIsPublic}
              onChange={(e) => setNewIsPublic(e.target.checked)}
            />
            Public collection
          </label>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            data-testid="save-modal-cancel"
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid var(--kolor-hairline)',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-muted)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selected.size === 0 || saving}
            data-testid="save-modal-submit"
            style={{
              padding: '10px 20px',
              background: selected.size > 0 ? 'var(--kolor-terra)' : 'transparent',
              border: '1px solid var(--kolor-terra)',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono, "Space Mono", monospace)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: selected.size > 0 ? 'var(--kolor-canvas)' : 'var(--kolor-terra)',
              cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
              opacity: selected.size > 0 ? 1 : 0.5,
            }}
          >
            {saving ? 'Saving…' : `Save${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
