// useOpenLead — dispatch kolor:openLead CustomEvent to open a lead modal
// from any component or page, regardless of route.
//
// Usage:
//   const openLead = useOpenLead()
//   openLead(leadId)            // opens lead modal on the dashboard
//   openLead(leadId, 'pipeline') // opens at a specific tab
//
// The Dashboard listens for this event and opens the lead modal.
// Works across route boundaries (Calendar → Dashboard, etc.)

import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

export function useOpenLead() {
  const navigate = useNavigate()

  const openLead = useCallback((leadId: string, tab?: string) => {
    const isDashboard = window.location.pathname === '/'
    if (!isDashboard) {
      navigate('/')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('kolor:openLead', {
          detail: { leadId, tab },
        }))
      }, 150)
    } else {
      window.dispatchEvent(new CustomEvent('kolor:openLead', {
        detail: { leadId, tab },
      }))
    }
  }, [navigate])

  return openLead
}
