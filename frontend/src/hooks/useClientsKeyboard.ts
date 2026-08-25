// iter 292-v3b — Clients keyboard shortcuts hook.
//
// Standard shortcuts (per Q9=B):
//   CMD+K / Ctrl+K → onSearchOpen (focus header "Search anything…" per Case C)
//   ESC            → onEscape (close modals / clear selection)
//   J / ArrowDown  → onNavigateNext (list row navigation)
//   K / ArrowUp    → onNavigatePrev
//   /              → onFocusFilter (focus filter row / stage pills)
//
// Guard: J/K/`/` do NOT fire while typing in inputs/textareas/select/
// contenteditable. CMD+K + ESC always fire (system-level shortcuts).

import { useEffect } from 'react'

export interface ClientsKeyboardHandlers {
  onSearchOpen?: () => void
  onNavigateNext?: () => void
  onNavigatePrev?: () => void
  onEscape?: () => void
  onFocusFilter?: () => void
}

function isInputFocused(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.getAttribute('contenteditable') === 'true'
  )
}

export function useClientsKeyboard(handlers: ClientsKeyboardHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        handlers.onSearchOpen?.()
        return
      }
      if (e.key === 'Escape') {
        handlers.onEscape?.()
        return
      }
      if (isInputFocused()) return
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        handlers.onNavigateNext?.()
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        handlers.onNavigatePrev?.()
      } else if (e.key === '/') {
        e.preventDefault()
        handlers.onFocusFilter?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handlers, enabled])
}
