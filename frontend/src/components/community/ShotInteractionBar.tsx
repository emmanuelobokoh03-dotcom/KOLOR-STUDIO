import { useState } from 'react'
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
}

// iter 287-v3b — APPRECIATE + SAVE + Share horizontal bar. Mono UPPERCASE
// labels, hairline top+bottom, Terra active state. Inline count next to
// APPRECIATE. Share copies shot URL to clipboard.
export default function ShotInteractionBar({
  likesCount,
  hasAppreciated,
  onAppreciateToggle,
  onSaveClick,
  shareUrl,
}: ShotInteractionBarProps) {
  const [appreciated, setAppreciated] = useState(hasAppreciated)
  const [count, setCount] = useState(likesCount)
  const [pending, setPending] = useState(false)

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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch {
      toast.error('Copy failed')
    }
  }

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

      <button
        data-testid="shot-share"
        onClick={handleShare}
        style={{ ...buttonBase, color: 'var(--kolor-ink)' }}
      >
        <Share size={16} />
        Share
      </button>
    </div>
  )
}
