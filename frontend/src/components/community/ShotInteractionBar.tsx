import { useEffect, useRef, useState } from 'react'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { BookmarkSimple } from '@phosphor-icons/react/dist/csr/BookmarkSimple'
import { Share } from '@phosphor-icons/react/dist/csr/Share'
import { toast } from 'sonner'

interface ShotInteractionBarProps {
  likesCount: number
  hasAppreciated: boolean
  onAppreciateToggle: () => Promise<void>
  onSaveClick: () => void
  shareUrl: string
  shareTitle?: string
}

// iter 287-v3b — APPRECIATE + SAVE + Share horizontal bar. Mono UPPERCASE
// labels, hairline top+bottom, Terra active state.
// iter 289-v3c3b — Share expanded from copy-to-clipboard-only to a proper
// share menu (Copy Link / Email / X / Threads) with Web Share API fallback
// to native share sheet on mobile.
export default function ShotInteractionBar({
  likesCount,
  hasAppreciated,
  onAppreciateToggle,
  onSaveClick,
  shareUrl,
  shareTitle,
}: ShotInteractionBarProps) {
  const [appreciated, setAppreciated] = useState(hasAppreciated)
  const [count, setCount] = useState(likesCount)
  const [pending, setPending] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const title = shareTitle || 'A shot on KOLOR'

  const handleAppreciate = async () => {
    if (pending) return
    setPending(true)
    const next = !appreciated
    setAppreciated(next)
    setCount((c) => c + (next ? 1 : -1))
    try {
      await onAppreciateToggle()
    } catch {
      setAppreciated(!next)
      setCount((c) => c + (next ? -1 : 1))
    }
    setPending(false)
  }

  const openShare = async () => {
    // iter 289-v3c3b.1 — Native Web Share API restricted to touch devices.
    // Prior gate (navigator.share existence only) triggered the OS share
    // sheet on desktop Chromium 89+ where users expect a custom menu.
    // Touch detection combines ontouchstart + navigator.maxTouchPoints so
    // iPad Safari + Android Chrome + Windows tablets get native share,
    // mouse-only desktop browsers get the custom menu.
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        (typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0))
    if (
      isTouchDevice &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({ title, url: shareUrl })
        return
      } catch {
        // User cancelled or share failed — fall through to custom menu.
      }
    }
    setMenuOpen((prev) => !prev)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch {
      toast.error('Copy failed')
    }
    setMenuOpen(false)
  }

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    setMenuOpen(false)
  }

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)

  const shareVia = {
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    threads: `https://www.threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`,
  }

  // Close menu on outside click.
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const buttonBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 4px',
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--font-mono, "Space Mono", monospace)',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  }

  const menuItemStyle = {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--font-mono, "Space Mono", monospace)',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.24em',
    textTransform: 'uppercase' as const,
    color: 'var(--kolor-ink)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  }

  return (
    <div
      data-testid="shot-interaction-bar"
      style={{
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        padding: '20px 0',
        borderTop: '1px solid var(--kolor-hairline)',
        borderBottom: '1px solid var(--kolor-hairline)',
      }}
    >
      <button
        data-testid="shot-appreciate"
        onClick={handleAppreciate}
        disabled={pending}
        style={{
          ...buttonBase,
          color: appreciated ? 'var(--kolor-terra)' : 'var(--kolor-ink)',
        }}
      >
        <Heart size={16} weight={appreciated ? 'fill' : 'regular'} />
        {appreciated ? 'Appreciated' : 'Appreciate'}
        <span style={{ color: 'var(--kolor-ink-subtle)', marginLeft: '4px' }}>· {count}</span>
      </button>

      <button
        data-testid="shot-save"
        onClick={onSaveClick}
        style={{ ...buttonBase, color: 'var(--kolor-ink)' }}
      >
        <BookmarkSimple size={16} />
        Save
      </button>

      <div style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          data-testid="shot-share"
          onClick={openShare}
          style={{ ...buttonBase, color: 'var(--kolor-ink)' }}
        >
          <Share size={16} />
          Share
        </button>
        {menuOpen && (
          <div
            ref={menuRef}
            data-testid="shot-share-menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: '200px',
              background: 'var(--kolor-canvas)',
              border: '1px solid var(--kolor-hairline)',
              borderRadius: '2px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
              zIndex: 20,
              padding: '4px 0',
            }}
          >
            <button
              data-testid="shot-share-copy"
              onClick={handleCopyLink}
              style={menuItemStyle}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--kolor-canvas-shade-1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              Copy Link
            </button>
            <button
              data-testid="shot-share-email"
              onClick={() => openInNewTab(shareVia.email)}
              style={menuItemStyle}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--kolor-canvas-shade-1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              Email
            </button>
            <button
              data-testid="shot-share-x"
              onClick={() => openInNewTab(shareVia.x)}
              style={menuItemStyle}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--kolor-canvas-shade-1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              Share to X
            </button>
            <button
              data-testid="shot-share-threads"
              onClick={() => openInNewTab(shareVia.threads)}
              style={menuItemStyle}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--kolor-canvas-shade-1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              Share to Threads
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
