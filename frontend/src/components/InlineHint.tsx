import { useState } from 'react'
import { X } from '@phosphor-icons/react'

interface InlineHintProps {
  storageKey: string
  children: React.ReactNode
  dismissible?: boolean
  variant?: 'violet' | 'subtle'
}

export function InlineHint({ storageKey, children, dismissible = true, variant = 'violet' }: InlineHintProps) {
  const [dismissed, setDismissed] = useState(() =>
    dismissible ? localStorage.getItem(storageKey) === 'true' : false
  )

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true')
    setDismissed(true)
  }

  const styles = variant === 'violet'
    ? 'bg-purple-50 border-purple-200 text-purple-600'
    : 'bg-light-50 border-light-200 text-text-secondary'

  return (
    <div className={`rounded-xl border p-3 mb-4 ${styles}`} data-testid={`hint-${storageKey}`}>
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 text-sm leading-relaxed">{children}</span>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 mt-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
            data-testid={`hint-dismiss-${storageKey}`}
          >
            <X className="w-3.5 h-3.5 opacity-60" />
          </button>
        )}
      </div>
    </div>
  )
}
