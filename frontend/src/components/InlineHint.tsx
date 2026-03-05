import { useState } from 'react'
import { X } from 'lucide-react'

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
    ? 'bg-violet-900/20 border-violet-700/30 text-violet-300'
    : 'bg-[#1A1A1A] border-[#333] text-[#A3A3A3]'

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
