import { useEffect, useState } from 'react'
import { Bell } from '@phosphor-icons/react/dist/csr/Bell'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { UserPlus } from '@phosphor-icons/react/dist/csr/UserPlus'
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple'

/**
 * iter 291-v3c — NotificationBell extraction + archival sheet drawer.
 *
 * Q3=C: Bell merged — deep-history archival view; dashboard cards remain
 * primary "latest" surface.
 * Q12=C: Bell click = sheet drawer (slide from right, keeps context).
 *
 * Consumes existing `/api/community/notifications` endpoint. Actor
 * enrichment via /api/community/notifications?enrich=1 (v3c backend
 * extension).
 */

type NotificationType =
  | 'POST_LIKED'
  | 'POST_COMMENTED'
  | 'NEW_FOLLOWER'
  | 'DM_RECEIVED'
  | 'DM_REQUEST_RECEIVED'

interface NotificationDoc {
  id: string
  type: NotificationType
  createdAt: string
  isRead: boolean
  fromUserId: string | null
  postId: string | null
  // iter 291-v3c — actor enrichment (see backend extension)
  actor?: {
    id: string
    name: string
    handle?: string | null
    avatarUrl?: string | null
  } | null
}

interface NotificationBellProps {
  onNavigateCommunity: (tab: 'feed' | 'dms') => void
}

type FilterType = 'all' | NotificationType

const FILTERS: Array<{ value: FilterType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'POST_LIKED', label: 'Likes' },
  { value: 'POST_COMMENTED', label: 'Comments' },
  { value: 'NEW_FOLLOWER', label: 'Follows' },
  { value: 'DM_RECEIVED', label: 'Messages' },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'JUST NOW'
  if (mins < 60) return `${mins}M AGO`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}H AGO`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}D AGO`
  return `${Math.floor(days / 7)}W AGO`
}

function iconFor(type: NotificationType) {
  const common = { size: 14, weight: 'duotone' as const }
  switch (type) {
    case 'POST_LIKED':
      return <Heart {...common} />
    case 'POST_COMMENTED':
      return <ChatCircle {...common} />
    case 'NEW_FOLLOWER':
      return <UserPlus {...common} />
    case 'DM_RECEIVED':
    case 'DM_REQUEST_RECEIVED':
      return <EnvelopeSimple {...common} />
  }
}

function messageFor(n: NotificationDoc): string {
  const actor = n.actor?.name || 'Someone'
  switch (n.type) {
    case 'POST_LIKED':
      return `${actor} liked your shot`
    case 'POST_COMMENTED':
      return `${actor} commented on your shot`
    case 'NEW_FOLLOWER':
      return `${actor} started following you`
    case 'DM_RECEIVED':
      return `${actor} sent you a message`
    case 'DM_REQUEST_RECEIVED':
      return `${actor} sent you a message request`
  }
}

export function NotificationBell({ onNavigateCommunity }: NotificationBellProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationDoc[]>([])
  const [unread, setUnread] = useState(0)
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(false)

  const fetchNotifications = () => {
    const apiUrl =
      (import.meta as any).env?.VITE_API_URL ||
      (import.meta as any).env?.REACT_APP_BACKEND_URL ||
      ''
    setLoading(true)
    fetch(`${apiUrl}/api/community/notifications?enrich=1`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setNotifications(d.notifications || [])
          setUnread(d.unread || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchNotifications()
    const t = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(t)
  }, [])

  // ESC + backdrop close
  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  const markAllRead = () => {
    const apiUrl =
      (import.meta as any).env?.VITE_API_URL ||
      (import.meta as any).env?.REACT_APP_BACKEND_URL ||
      ''
    fetch(`${apiUrl}/api/community/notifications/read`, {
      method: 'PATCH',
      credentials: 'include',
    }).then(() => {
      setUnread(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    })
  }

  const handleClickNotification = (n: NotificationDoc) => {
    onNavigateCommunity(
      n.type === 'DM_RECEIVED' || n.type === 'DM_REQUEST_RECEIVED'
        ? 'dms'
        : 'feed',
    )
    setSheetOpen(false)
    if (!n.isRead) {
      const apiUrl =
        (import.meta as any).env?.VITE_API_URL ||
        (import.meta as any).env?.REACT_APP_BACKEND_URL ||
        ''
      fetch(`${apiUrl}/api/community/notifications/read`, {
        method: 'PATCH',
        credentials: 'include',
      }).then(() => setUnread(0))
    }
  }

  const filtered =
    filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-background)] active:scale-90 transition-all"
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        data-testid="header-notification-bell"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: 'var(--kolor-terra, #B84A2C)' }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Sheet drawer (Q12=C) */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 22, 19, 0.4)',
            zIndex: 60,
            transition: 'opacity 200ms',
          }}
          data-testid="notification-sheet-backdrop"
          aria-hidden
        />
      )}
      <aside
        role="dialog"
        aria-label="Notification archive"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 92vw)',
          background: 'var(--kolor-canvas, #F7F4EE)',
          borderLeft: '1px solid var(--kolor-hairline, #E5E0D8)',
          zIndex: 61,
          transform: sheetOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: sheetOpen ? '-12px 0 40px rgba(26, 22, 19, 0.08)' : 'none',
        }}
        data-testid="notification-sheet"
        aria-hidden={!sheetOpen}
      >
        {/* Header */}
        <header
          style={{
            padding: '28px 32px 20px',
            borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle, #928B84)',
                margin: 0,
                marginBottom: 6,
              }}
            >
              Archive
            </p>
            <h2
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: 28,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: 'var(--kolor-ink, #1A1613)',
                margin: 0,
              }}
            >
              Notifications
            </h2>
          </div>
          <button
            onClick={() => setSheetOpen(false)}
            aria-label="Close notifications"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              color: 'var(--kolor-ink-muted, #5F5751)',
            }}
            data-testid="notification-sheet-close"
          >
            <X size={16} weight="bold" />
          </button>
        </header>

        {/* Filters */}
        <nav
          style={{
            padding: '14px 32px',
            borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
          }}
          data-testid="notification-sheet-filters"
        >
          {FILTERS.map((f) => {
            const active = filter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: '8px 12px',
                  minHeight: 32,
                  background: active
                    ? 'var(--kolor-terra, #B84A2C)'
                    : 'transparent',
                  color: active
                    ? 'var(--kolor-canvas, #F7F4EE)'
                    : 'var(--kolor-ink-muted, #5F5751)',
                  border: `1px solid ${
                    active
                      ? 'var(--kolor-terra, #B84A2C)'
                      : 'var(--kolor-hairline, #E5E0D8)'
                  }`,
                  borderRadius: 2,
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background 200ms, color 200ms',
                }}
                data-testid={`notification-filter-${f.value.toLowerCase()}`}
              >
                {f.label}
              </button>
            )
          })}
          {unread > 0 && filter === 'all' && (
            <button
              onClick={markAllRead}
              style={{
                marginLeft: 'auto',
                padding: '8px 12px',
                minHeight: 32,
                background: 'transparent',
                color: 'var(--kolor-terra, #B84A2C)',
                border: 'none',
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              data-testid="notification-mark-all-read"
            >
              Mark all read
            </button>
          )}
        </nav>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
          data-testid="notification-sheet-body"
        >
          {loading ? (
            <div style={{ padding: '24px 32px' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="ks-shimmer"
                  style={{
                    height: 60,
                    marginBottom: 8,
                    borderRadius: 2,
                    background: 'var(--kolor-slate-tint, rgba(0,0,0,0.03))',
                  }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{ padding: '40px 32px', textAlign: 'center' }}
              data-testid="notification-sheet-empty"
            >
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 20,
                  color: 'var(--kolor-ink, #1A1613)',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {filter === 'all'
                  ? 'No notifications yet.'
                  : 'Nothing here yet.'}
              </p>
              <p
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 14,
                  color: 'var(--kolor-ink-muted, #5F5751)',
                  margin: 0,
                }}
              >
                Activity from your community will show up here.
              </p>
            </div>
          ) : (
            <ul
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
              data-testid="notification-sheet-list"
            >
              {filtered.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClickNotification(n)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 32px',
                      background: n.isRead
                        ? 'transparent'
                        : 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.4))',
                      border: 'none',
                      borderBottom:
                        '1px solid var(--kolor-hairline, #E5E0D8)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 200ms',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.background =
                        'var(--kolor-slate-tint, rgba(245, 240, 232, 0.7))'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.background =
                        n.isRead
                          ? 'transparent'
                          : 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.4))'
                    }}
                    data-testid={`notification-row-${n.id}`}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background:
                          'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))',
                        border: '1px solid var(--kolor-hairline, #E5E0D8)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--kolor-terra, #B84A2C)',
                      }}
                    >
                      {n.actor?.avatarUrl ? (
                        <img
                          src={n.actor.avatarUrl}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        iconFor(n.type)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontSize: 13,
                          lineHeight: 1.4,
                          color: 'var(--kolor-ink, #1A1613)',
                          margin: 0,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {messageFor(n)}
                      </p>
                      <p
                        style={{
                          fontFamily:
                            "'JetBrains Mono', 'DM Mono', monospace",
                          fontSize: 9,
                          fontWeight: 500,
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: 'var(--kolor-ink-subtle, #928B84)',
                          margin: 0,
                          marginTop: 2,
                        }}
                      >
                        {relativeTime(n.createdAt)}
                        {!n.isRead && (
                          <span
                            style={{
                              marginLeft: 8,
                              color: 'var(--kolor-terra, #B84A2C)',
                            }}
                          >
                            · New
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}

export default NotificationBell
