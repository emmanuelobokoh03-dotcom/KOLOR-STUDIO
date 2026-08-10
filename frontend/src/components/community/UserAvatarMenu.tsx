import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = (import.meta as any).env?.VITE_API_URL || ''

// iter 289-v3c3a — Top-right header avatar-with-dropdown.
// Matches NotificationBell dropdown visual style (canvas ivory,
// hairline border, subtle shadow, mono UPPERCASE items).
// Items: My Profile (→ /creator/[own-handle]) + My Collections
// (→ /community/collections). Handle fetched at mount via
// /api/community/profile/me.

interface Props {
  firstName?: string | null
}

export default function UserAvatarMenu({ firstName }: Props) {
  const [open, setOpen] = useState(false)
  const [handle, setHandle] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API}/api/community/profile/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile?.handle) setHandle(data.profile.handle)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const initial = (firstName?.[0] || 'K').toUpperCase()

  const goProfile = () => {
    setOpen(false)
    if (handle) navigate(`/creator/${handle}`)
  }

  const goCollections = () => {
    setOpen(false)
    navigate('/community/collections')
  }

  const itemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--font-mono, "Space Mono", monospace)',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'var(--kolor-ink-muted, #5F5751)',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background 120ms, color 120ms',
  }

  return (
    <div ref={rootRef} className="relative" data-testid="user-avatar-menu-root">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        data-testid="user-avatar-menu-trigger"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          fontFamily: '"Fraunces", Georgia, serif',
          fontStyle: 'italic',
          fontSize: '14px',
          color: 'var(--kolor-ink, #1A1613)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          data-testid="user-avatar-menu-dropdown"
          className="absolute right-0 top-10 z-50 overflow-hidden"
          style={{
            width: '220px',
            background: 'var(--kolor-canvas, #F7F4EE)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            padding: '8px',
          }}
        >
          <button
            onClick={goProfile}
            disabled={!handle}
            data-testid="user-avatar-menu-profile"
            style={{ ...itemStyle, opacity: handle ? 1 : 0.4, cursor: handle ? 'pointer' : 'not-allowed' }}
            onMouseEnter={(e) => {
              if (!handle) return
              ;(e.currentTarget as HTMLElement).style.background = 'var(--kolor-canvas-shade-1)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--kolor-ink)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--kolor-ink-muted)'
            }}
          >
            My Profile
          </button>
          <button
            onClick={goCollections}
            data-testid="user-avatar-menu-collections"
            style={itemStyle}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--kolor-canvas-shade-1)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--kolor-ink)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--kolor-ink-muted)'
            }}
          >
            My Collections
          </button>
        </div>
      )}
    </div>
  )
}
