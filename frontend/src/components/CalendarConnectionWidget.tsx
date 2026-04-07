import { useState, useEffect } from 'react'
import {
  GoogleLogo, Check, ArrowRight, SpinnerGap, LinkBreak, CalendarCheck
} from '@phosphor-icons/react'

interface CalendarConnectionWidgetProps {
  onStatusChange?: (connected: boolean) => void
}

export default function CalendarConnectionWidget({ onStatusChange }: CalendarConnectionWidgetProps) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const resp = await fetch('/api/google-calendar/status', { credentials: 'include' })
      if (resp.ok) {
        const data = await resp.json()
        setConnected(data.connected)
        onStatusChange?.(data.connected)
      }
    } catch { /* ignore */ }

    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar') === 'connected') {
      setConnected(true)
      onStatusChange?.(true)
      window.history.replaceState({}, '', window.location.pathname)
    }

    setLoading(false)
  }

  const handleConnect = async () => {
    setActionLoading(true)
    try {
      const configResp = await fetch('/api/google-calendar/config-check', { credentials: 'include' })
      if (configResp.ok) {
        const config = await configResp.json()
        if (!config.configured) {
          alert('Google Calendar is not configured on the server. Please contact support to set up Google OAuth credentials.')
          setActionLoading(false)
          return
        }
      }

      const resp = await fetch('/api/google-calendar/auth-url', { credentials: 'include' })
      if (!resp.ok) {
        const errText = await resp.text()
        console.error('[CALENDAR] Auth URL error:', resp.status, errText)
        alert(`Failed to connect calendar (${resp.status}). Check console for details.`)
        setActionLoading(false)
        return
      }

      const data = await resp.json()
      if (!data.authUrl) {
        alert('Failed to get authorization URL from server.')
        setActionLoading(false)
        return
      }

      window.location.href = data.authUrl
    } catch (err: any) {
      console.error('[CALENDAR] Connection error:', err)
      alert(`Calendar connection error: ${err.message || 'Unknown error'}`)
      setActionLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Calendar? Bookings still work, but calendar sync will stop.')) return
    setActionLoading(true)
    try {
      const resp = await fetch('/api/google-calendar/disconnect', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (resp.ok) {
        setConnected(false)
        onStatusChange?.(false)
      }
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-light-50 rounded-xl border border-light-200 p-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-light-200 rounded-lg" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-light-200 rounded w-1/3" />
            <div className="h-3 bg-light-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (connected) {
    return (
      <div className="bg-emerald-50/60 rounded-xl border-2 border-emerald-200 p-5" data-testid="calendar-widget-connected">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CalendarCheck weight="fill" className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-sm">Google Calendar Connected</h3>
              <p className="text-xs text-text-secondary mt-0.5">Syncing availability in real-time</p>
            </div>
          </div>
          <button onClick={handleDisconnect} disabled={actionLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50 flex-shrink-0"
            data-testid="calendar-widget-disconnect">
            {actionLoading ? <SpinnerGap className="w-3.5 h-3.5 animate-spin" /> : <LinkBreak className="w-3.5 h-3.5" />}
            Disconnect
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 mt-4">
          {[
            { label: 'Auto-sync availability', sub: 'No double-bookings' },
            { label: 'Auto-create events', sub: 'When clients book' },
            { label: 'Conflict detection', sub: 'Real-time checking' },
          ].map(({ label, sub }) => (
            <div key={label} className="flex items-start gap-2">
              <Check weight="bold" className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-text-primary">{label}</p>
                <p className="text-[11px] text-text-tertiary">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-5 w-full max-w-full" data-testid="calendar-widget-cta">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-base border border-purple-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <GoogleLogo weight="bold" className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text-primary text-sm">Connect Google Calendar</h3>
            <p className="text-xs text-text-secondary mt-0.5">Sync availability automatically and prevent double-bookings</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {['Real-time sync', 'Auto-create events', 'Prevent conflicts'].map(t => (
                <span key={t} className="flex items-center gap-1 text-[11px] text-purple-700">
                  <Check weight="bold" className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleConnect} disabled={actionLoading}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-purple-600/20"
          data-testid="calendar-widget-connect">
          {actionLoading ? (
            <SpinnerGap className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <GoogleLogo weight="bold" className="w-4 h-4" />
              Connect Calendar
              <ArrowRight weight="bold" className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
