import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

// useOpenLead — opens a lead modal from any component or route.
// Uses URL param as fallback for mobile Safari full-page reload cases.
//
// Usage: const openLead = useOpenLead()
//        openLead(leadId)             // opens lead modal
//        openLead(leadId, 'pipeline') // opens at specific tab

export function useOpenLead() {
  const navigate = useNavigate()

  const openLead = useCallback((leadId: string, tab?: string) => {
    const isDashboard = window.location.pathname === '/'

    if (isDashboard) {
      // Already on dashboard — dispatch immediately
      window.dispatchEvent(new CustomEvent('kolor:openLead', {
        detail: { leadId, tab },
      }))
      return
    }

    // Cross-route: use URL param fallback (survives full-page reload on mobile Safari)
    const params = new URLSearchParams()
    params.set('openLead', leadId)
    if (tab) params.set('openLeadTab', tab)
    navigate(`/?${params.toString()}`)

    // Also fire CustomEvent shortly after — primary path for SPA navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('kolor:openLead', {
        detail: { leadId, tab },
      }))
    }, 400)
  }, [navigate])

  return openLead
}
