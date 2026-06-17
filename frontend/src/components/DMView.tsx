import { useState, useEffect, useRef, useCallback } from 'react'
import KolorSpinner from './KolorSpinner'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/csr/PaperPlaneTilt'

const API = (import.meta as any).env?.VITE_API_URL || ''
const POLL_INTERVAL = 10000

export default function DMView() {
  const [threads, setThreads] = useState<any[]>([])
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const lastMsgRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTimestampRef = useRef<string | null>(null)

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/community/dms`, { credentials: 'include' })
      const data = await res.json()
      setThreads(data.threads || [])
      setMyProfileId(data.myProfileId || null)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  const fetchMessages = useCallback(async (threadId: string, after?: string) => {
    try {
      const url = after
        ? `${API}/api/community/dms/${threadId}/messages?after=${encodeURIComponent(after)}`
        : `${API}/api/community/dms/${threadId}/messages`
      const res = await fetch(url, { credentials: 'include' })
      const data = await res.json()
      const msgs = data.messages || []
      if (after) {
        if (msgs.length > 0) setMessages(prev => [...prev, ...msgs])
      } else {
        setMessages(msgs)
      }
      if (msgs.length > 0) lastTimestampRef.current = msgs[msgs.length - 1].sentAt
      // Mark as read (best-effort)
      fetch(`${API}/api/community/dms/${threadId}/read`, {
        method: 'PATCH', credentials: 'include'
      }).catch(() => {})
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  useEffect(() => {
    if (!activeThread) return
    lastTimestampRef.current = null
    fetchMessages(activeThread)

    pollRef.current = setInterval(() => {
      if (lastTimestampRef.current) {
        fetchMessages(activeThread, lastTimestampRef.current)
      }
    }, POLL_INTERVAL)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
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
        fetchThreads()
      }
    } catch { /* silent */ }
    setSending(false)
  }

  if (loading) return <div className="flex justify-center py-12"><KolorSpinner size={28} /></div>

  return (
    <div className="flex relative" style={{ height: 'calc(100dvh - 120px)', overflow: 'hidden' }} data-testid="dm-view">

      {/* Thread list */}
      <div className={`${activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-col flex-shrink-0 border-r overflow-y-auto`}
        style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-bold text-text-primary">Messages</h3>
        </div>
        {threads.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-tertiary)]">
            No conversations yet.<br />Visit a profile to start a DM.
          </div>
        ) : (
          threads.map(thread => {
            const lastMsg = thread.messages?.[0]
            const isActive = activeThread === thread.id
            return (
              <button
                key={thread.id}
                onClick={() => setActiveThread(thread.id)}
                data-testid={`dm-thread-${thread.id}`}
                className="w-full text-left px-4 py-3 transition-colors border-b"
                style={{
                  background: isActive ? '#EDE9FE' : 'transparent',
                  borderColor: 'var(--border)',
                  borderLeft: isActive ? '3px solid #6C2EDB' : '3px solid transparent',
                }}
              >
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const other = thread.participantA === myProfileId ? thread.partB : thread.partA
                    const name = other ? `${other.user?.firstName || ''} ${other.user?.lastName || ''}`.trim() : 'Community member'
                    const initials = name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
                    return (
                      <>
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: '#6C2EDB' }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">{name}</p>
                          {lastMsg && (
                            <p className="text-[10px] text-[var(--text-tertiary)] truncate">{lastMsg.content}</p>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>
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
              onClick={() => setActiveThread(null)}
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
              ← Back to messages
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
                  <div className="max-w-[75%] px-3 py-2 text-sm"
                    style={{
                      background: isMe ? '#6C2EDB' : 'var(--surface-background)',
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      border: isMe ? 'none' : '0.5px solid var(--border)',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    }}>
                    {msg.content}
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
