import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import KolorSpinner from './KolorSpinner'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/csr/PaperPlaneTilt'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { linkifyText } from '../utils/linkifyText'

const API = (import.meta as any).env?.VITE_API_URL || ''
const POLL_INTERVAL = 10000

function formatMessageTime(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (isToday) return time
  if (isYesterday) return `Yesterday ${time}`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ` ${time}`
}

export default function DMView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const threadParam = searchParams.get('thread')
  const [threads, setThreads] = useState<any[]>([])
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [activeThread, setActiveThread] = useState<string | null>(threadParam)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState<'messages' | 'requests'>('messages')
  const [pendingCount, setPendingCount] = useState(0)
  const lastMsgRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTimestampRef = useRef<string | null>(null)
  // iter 289-v3c3a.3 — Abort controller for in-flight message fetches.
  // Prevents a stale fetch from the prior thread overwriting the new thread's
  // messages when the user switches threads mid-request (race → apparent
  // "loops" in the Network log as new fetches pile onto unresolved ones).
  const fetchAbortRef = useRef<AbortController | null>(null)

  // iter 289-v3c3a.3 — activeThread is URL-driven.
  // Prior code read window.location.search inside a useEffect gated on
  // [threads.length, activeThread]. When React Router changed the URL (e.g.,
  // Discover MESSAGE → navigate to ?thread=Y), the URL param wasn't in deps,
  // so the effect never re-fired and activeThread stayed stale. Now
  // useSearchParams() gives us reactive access, and activeThread mirrors it.
  useEffect(() => {
    if (threadParam) {
      if (threadParam !== activeThread) setActiveThread(threadParam)
    } else if (activeThread !== null) {
      setActiveThread(null)
    }
  }, [threadParam])

  // Helper: navigate DMView state via URL so back/forward + share links work.
  const openThread = useCallback((threadId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (threadId) next.set('thread', threadId)
      else next.delete('thread')
      return next
    }, { replace: true })
  }, [setSearchParams])

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/community/dms/pending-count`, { credentials: 'include' })
      const data = await res.json()
      setPendingCount(data.count || 0)
    } catch { /* silent */ }
  }, [])

  const fetchThreads = useCallback(async (mode: 'messages' | 'requests' = filterMode) => {
    try {
      const url = mode === 'requests'
        ? `${API}/api/community/dms?filter=requests`
        : `${API}/api/community/dms`
      const res = await fetch(url, { credentials: 'include' })
      const data = await res.json()
      setThreads(data.threads || [])
      setMyProfileId(data.myProfileId || null)
    } catch { /* silent */ }
    setLoading(false)
  }, [filterMode])

  const fetchMessages = useCallback(async (threadId: string, after?: string, signal?: AbortSignal) => {
    try {
      const url = after
        ? `${API}/api/community/dms/${threadId}/messages?after=${encodeURIComponent(after)}`
        : `${API}/api/community/dms/${threadId}/messages`
      const res = await fetch(url, { credentials: 'include', signal })
      const data = await res.json()
      const msgs = data.messages || []
      if (after) {
        if (msgs.length > 0) setMessages(prev => [...prev, ...msgs])
      } else {
        setMessages(msgs)
      }
      if (msgs.length > 0) lastTimestampRef.current = msgs[msgs.length - 1].sentAt
      // Mark as read (best-effort, not aborted with fetch)
      fetch(`${API}/api/community/dms/${threadId}/read`, {
        method: 'PATCH', credentials: 'include'
      }).catch(() => {})
    } catch { /* silent (includes AbortError) */ }
  }, [])

  useEffect(() => { fetchThreads(filterMode); fetchPendingCount() }, [fetchThreads, fetchPendingCount, filterMode])

  useEffect(() => {
    // iter 289-v3c3a.3 — Full teardown when activeThread changes or unmounts.
    // Previous code left in-flight fetches racing when switching threads.
    if (fetchAbortRef.current) fetchAbortRef.current.abort()
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }

    if (!activeThread) {
      setMessages([])
      lastTimestampRef.current = null
      return
    }

    const controller = new AbortController()
    fetchAbortRef.current = controller
    lastTimestampRef.current = null
    setMessages([])
    fetchMessages(activeThread, undefined, controller.signal)

    pollRef.current = setInterval(() => {
      if (lastTimestampRef.current) {
        fetchMessages(activeThread, lastTimestampRef.current)
      }
    }, POLL_INTERVAL)

    return () => {
      controller.abort()
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [activeThread, fetchMessages])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
    lastMsgRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeThread || sending) return
    setSending(true)
    try {
      const res = await fetch(`${API}/api/community/dms/${activeThread}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: input.trim() }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, data.message])
        lastTimestampRef.current = data.message.sentAt
        setInput('')
        fetchThreads(filterMode)
      }
    } catch { /* silent */ }
    setSending(false)
  }

  if (loading) return <div className="flex justify-center py-12"><KolorSpinner size={28} /></div>

  const handleAccept = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`${API}/api/community/dms/${threadId}/accept`, {
        method: 'PATCH', credentials: 'include'
      })
      if (res.ok) {
        setThreads(prev => prev.filter(t => t.id !== threadId))
        setPendingCount(c => Math.max(0, c - 1))
        toast.success('Message request accepted')
      }
    } catch { toast.error('Could not accept request') }
  }

  const handleDismiss = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`${API}/api/community/dms/${threadId}`, {
        method: 'DELETE', credentials: 'include'
      })
      if (res.ok) {
        setThreads(prev => prev.filter(t => t.id !== threadId))
        setPendingCount(c => Math.max(0, c - 1))
        toast.success('Request dismissed')
      }
    } catch { toast.error('Could not dismiss request') }
  }

  return (
    <div className="flex relative" style={{ height: 'calc(100dvh - 120px)', overflow: 'hidden' }} data-testid="dm-view">

      {/* Thread list */}
      <div className={`${activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-col flex-shrink-0 border-r overflow-y-auto`}
        style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-bold text-text-primary">Messages</h3>
        </div>
        {/* iter 287-v3c2b: MESSAGES / REQUESTS filter tabs */}
        <div
          role="tablist"
          aria-label="Message filter"
          className="flex items-center border-b flex-shrink-0"
          style={{ height: '48px', borderColor: 'var(--kolor-hairline)', padding: '0 16px', gap: '20px' }}
        >
          <button
            role="tab"
            aria-selected={filterMode === 'messages'}
            data-testid="dm-tab-messages"
            onClick={() => { setFilterMode('messages'); openThread(null) }}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: filterMode === 'messages' ? 'var(--kolor-terra)' : 'var(--kolor-ink-subtle)',
              background: 'transparent',
              border: 'none',
              padding: '14px 0',
              cursor: 'pointer',
              borderBottom: filterMode === 'messages' ? '1px solid var(--kolor-terra)' : '1px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            Messages
          </button>
          <button
            role="tab"
            aria-selected={filterMode === 'requests'}
            data-testid="dm-tab-requests"
            onClick={() => { setFilterMode('requests'); openThread(null) }}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: filterMode === 'requests' ? 'var(--kolor-terra)' : 'var(--kolor-ink-subtle)',
              background: 'transparent',
              border: 'none',
              padding: '14px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: filterMode === 'requests' ? '1px solid var(--kolor-terra)' : '1px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            <span>Requests</span>
            {pendingCount > 0 && (
              <span
                data-testid="dm-requests-count"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  color: 'var(--kolor-terra)',
                  background: 'var(--kolor-terra-tint)',
                  padding: '2px 8px',
                  borderRadius: '8px',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {threads.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-tertiary)]">
            {filterMode === 'requests'
              ? <>No pending requests.<br />You&apos;re all caught up.</>
              : <>No conversations yet.<br />Visit a profile to start a DM.</>}
          </div>
        ) : (
          threads.map(thread => {
            const lastMsg = thread.messages?.[0]
            const isActive = activeThread === thread.id
            const isRequest = filterMode === 'requests'
            const rowContent = (() => {
              const other = thread.participantA === myProfileId ? thread.partB : thread.partA
              const name = other ? `${other.user?.firstName || ''} ${other.user?.lastName || ''}`.trim() : 'Community member'
              const initials = name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
              return (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#6C2EDB' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-text-primary truncate" style={{ fontWeight: (!isRequest && lastMsg && lastMsg.senderId !== myProfileId && !lastMsg.readAt) ? 700 : 500 }}>{name}</p>
                      {lastMsg && !isRequest && (
                        <span className="text-[9px] text-[var(--text-tertiary)] flex-shrink-0 tabular-nums">{formatMessageTime(lastMsg.sentAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {lastMsg && (
                        <p className="text-[10px] truncate flex-1" style={{
                          color: isRequest ? 'var(--kolor-ink-muted)' : 'var(--text-tertiary)',
                          fontWeight: (!isRequest && lastMsg.senderId !== myProfileId && !lastMsg.readAt) ? 600 : 400
                        }}>{lastMsg.content}</p>
                      )}
                      {!isRequest && lastMsg && lastMsg.senderId !== myProfileId && !lastMsg.readAt && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#6C2EDB' }} />
                      )}
                    </div>
                  </div>
                  {isRequest && (
                    <div className="flex flex-col gap-1 flex-shrink-0" style={{ marginLeft: '6px' }}>
                      <button
                        onClick={(e) => handleAccept(thread.id, e)}
                        data-testid={`dm-request-accept-${thread.id}`}
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '10px',
                          fontWeight: 500,
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                          color: 'var(--kolor-terra)',
                          background: 'transparent',
                          border: '1px solid var(--kolor-terra)',
                          padding: '4px 8px',
                          borderRadius: '2px',
                          cursor: 'pointer',
                        }}
                      >Accept</button>
                      <button
                        onClick={(e) => handleDismiss(thread.id, e)}
                        data-testid={`dm-request-dismiss-${thread.id}`}
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '10px',
                          fontWeight: 500,
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                          color: 'var(--kolor-ink-muted)',
                          background: 'transparent',
                          border: '1px solid var(--kolor-hairline)',
                          padding: '4px 8px',
                          borderRadius: '2px',
                          cursor: 'pointer',
                        }}
                      >Dismiss</button>
                    </div>
                  )}
                </div>
              )
            })()
            if (isRequest) {
              return (
                <div
                  key={thread.id}
                  data-testid={`dm-thread-${thread.id}`}
                  className="w-full text-left px-4 py-3 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {rowContent}
                </div>
              )
            }
            return (
              <button
                key={thread.id}
                onClick={() => openThread(thread.id)}
                data-testid={`dm-thread-${thread.id}`}
                className="w-full text-left px-4 py-3 transition-colors border-b"
                style={{
                  background: isActive ? '#EDE9FE' : 'transparent',
                  borderColor: 'var(--border)',
                  borderLeft: isActive ? '3px solid #6C2EDB' : '3px solid transparent',
                }}
              >
                {rowContent}
              </button>
            )
          })
        )}
      </div>

      {/* Conversation */}
      {activeThread ? (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface-base)',
            zIndex: 10,
            overflow: 'hidden',
          }}>
          <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '0.5px solid var(--border)',
              flexShrink: 0,
              background: 'var(--surface-base)',
            }}>
            <button
              onClick={() => openThread(null)}
              style={{
                fontSize: '13px',
                color: '#6C2EDB',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
          <div
            ref={messagesContainerRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              gap: '8px',
            }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                color: 'var(--text-tertiary)',
                fontSize: '12px',
                lineHeight: 1.6,
              }}>
                <p style={{ fontSize: '24px', marginBottom: '8px' }}>✉️</p>
                <p style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Start the conversation
                </p>
                <p>Say hello and introduce yourself</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.sender?.id === myProfileId
              return (
                <div key={msg.id} ref={i === messages.length - 1 ? lastMsgRef : null}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%]">
                    <div className="px-3 py-2 text-sm"
                      style={{
                        background: isMe ? '#6C2EDB' : 'var(--surface-background)',
                        color: isMe ? '#fff' : 'var(--text-primary)',
                        border: isMe ? 'none' : '0.5px solid var(--border)',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}
                      dangerouslySetInnerHTML={{ __html: isMe ? linkifyText(msg.content).replace(/color:#6C2EDB/g, 'color:rgba(255,255,255,0.9)') : linkifyText(msg.content) }}
                    />
                    <p className="text-[9px] mt-0.5 px-1" style={{ color: 'var(--text-tertiary)', textAlign: isMe ? 'right' : 'left' }}>
                      {formatMessageTime(msg.sentAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{
              padding: '12px 16px',
              borderTop: '0.5px solid var(--border)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexShrink: 0,
              background: 'var(--surface-base)',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={1000}
              data-testid="dm-message-input"
              className="flex-1 text-sm rounded-xl px-4 py-3 outline-none"
              style={{
                background: 'var(--surface-background)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6C2EDB'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim() || sending}
              data-testid="dm-message-send"
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: '#6C2EDB',
                border: 'none',
                opacity: input.trim() ? 1 : 0.35,
                transition: 'opacity 0.15s',
              }}>
              <PaperPlaneTilt weight="fill" className="w-4 h-4"
                style={{ color: input.trim() ? '#fff' : 'var(--text-tertiary)' }} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center text-xs text-[var(--text-tertiary)]">
          Select a conversation
        </div>
      )}
    </div>
  )
}
