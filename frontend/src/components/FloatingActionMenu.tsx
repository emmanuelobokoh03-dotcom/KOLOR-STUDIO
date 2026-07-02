import { useEffect, useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { Link as LinkIcon } from '@phosphor-icons/react/dist/csr/Link'
import { Z } from '../lib/z'

interface FloatingActionMenuProps {
  onShareForm: () => void
  onNewLead: () => void
  newLeadLabel: string
}

export default function FloatingActionMenu({ onShareForm, onNewLead, newLeadLabel }: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  // Close-then-act: lets close animation start before the action fires
  const handleAction = (fn: () => void) => () => {
    setIsOpen(false)
    setTimeout(fn, 50)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!isOpen}
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: Z.FAB_BACKDROP,
        }}
        data-testid="fab-backdrop"
      />

      {/* Action pills (stacked above the FAB) */}
      <div
        style={{
          position: 'fixed',
          right: 20,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 150px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'flex-end',
          zIndex: Z.FAB_PILLS,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* Action 2: New Lead (top) — 40ms stagger */}
        <button
          onClick={handleAction(onNewLead)}
          tabIndex={isOpen ? 0 : -1}
          aria-label={newLeadLabel}
          data-testid="fab-action-new-lead"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: '#6C2EDB',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(108, 46, 219, 0.3)',
            cursor: 'pointer',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
            transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 40ms, transform 200ms cubic-bezier(0.4, 0, 0.2, 1) 40ms',
          }}
        >
          <Plus className="w-4 h-4" />
          {newLeadLabel}
        </button>

        {/* Action 1: Share form (closest to FAB) — 0ms */}
        <button
          onClick={handleAction(onShareForm)}
          tabIndex={isOpen ? 0 : -1}
          aria-label="Share inquiry form"
          data-testid="fab-action-share"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'white',
            color: '#6C2EDB',
            border: '1px solid rgba(108, 46, 219, 0.2)',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            cursor: 'pointer',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
            transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <LinkIcon className="w-4 h-4" />
          Share form
        </button>
      </div>

      {/* Trigger FAB */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
        data-testid="fab-trigger"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#6C2EDB',
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(108, 46, 219, 0.4)',
          cursor: 'pointer',
          zIndex: Z.FAB,
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  )
}
