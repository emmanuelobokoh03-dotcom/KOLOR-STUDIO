import { useState, useEffect, useRef } from 'react'
import KolorSpinner from './KolorSpinner'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/csr/PaperPlaneTilt'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
interface Message {
  id: string
  content: string
  from: 'CLIENT' | 'CREATIVE'
  read: boolean
  createdAt: string
}

interface ClientPortalMessagesProps {
  token: string
  studioName: string
}

const API_URL = import.meta.env.VITE_API_URL || ''

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ClientPortalMessages({ token, studioName }: ClientPortalMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/portal/${token}/messages`)
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (e) {
      console.error('Error fetching messages:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [token])

  // Track message count for scroll gating (iter 280-hotfix)
  const prevMessageCountRef = useRef(0)

  useEffect(() => {
    // Only scroll if a NEW message arrived (count increased), not on identical
    // refetch data from the 30s poll. block: 'nearest' prevents page-level scroll.
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`${API_URL}/api/portal/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      })
      if (res.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (e) {
      console.error('Failed to send message:', e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border border-[color:var(--kolor-hairline)] rounded-xl overflow-hidden" style={{ background: 'var(--kolor-canvas)' }} data-testid="portal-messages">
      {/* Header */}
      <div className="px-6 md:px-7 py-5 border-b border-[color:var(--kolor-hairline)]" style={{ background: 'var(--kolor-canvas)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--kolor-terra-tint)' }}>
            <ChatCircle className="w-5 h-5" style={{ color: 'var(--kolor-terra)' }} />
          </div>
          <div>
            <h3 className="uppercase" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '11px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-ink)' }}>Messages</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--kolor-ink-muted)' }}>Ask questions or share updates with {studioName}</p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="p-4 md:p-6 space-y-3 max-h-80 overflow-y-auto bg-surface-base" data-testid="portal-messages-list">
        {loading ? (
          <div className="flex justify-center py-8">
            <KolorSpinner size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-14">
            <p
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: 'clamp(20px, 2.4vw, 26px)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color: 'var(--kolor-ink-muted)',
              }}
            >
              Nothing yet.
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: '10px',
                fontWeight: 400,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-ink-subtle)',
                marginTop: '16px',
              }}
            >
              Start the conversation.
            </p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'CLIENT' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${msg.id}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.from === 'CLIENT'
                      ? 'bg-[color:var(--kolor-terra-tint)]'
                      : 'bg-[color:var(--kolor-slate-tint)]'
                  }`}
                  style={{ color: 'var(--kolor-ink)' }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--kolor-ink)' }}>{msg.content}</p>
                  <p
                    className="mt-2 uppercase"
                    style={{
                      fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                      fontSize: '9px',
                      fontWeight: 400,
                      letterSpacing: '0.18em',
                      color: 'var(--kolor-ink-subtle)',
                    }}
                  >
                    {msg.from === 'CLIENT' ? 'You' : studioName} &middot; {timeAgo(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-6 md:px-7 py-5 border-t border-[color:var(--kolor-hairline)]" style={{ background: 'var(--kolor-canvas)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-0 py-3 text-[15px] bg-transparent border-0 border-b transition-colors focus:outline-none" style={{ borderBottomColor: 'var(--kolor-hairline)', color: 'var(--kolor-ink)', fontFamily: 'Inter, system-ui, sans-serif' }} onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'var(--kolor-terra)')} onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'var(--kolor-hairline)')}
            disabled={sending}
            data-testid="portal-message-input"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="uppercase flex items-center gap-2 py-3 disabled:opacity-40 transition-colors" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: '11px', fontWeight: 500, letterSpacing: '0.24em', color: 'var(--kolor-terra)' }}
            data-testid="portal-send-message-btn"
          >
            <PaperPlaneTilt weight="bold" className="w-4 h-4" />
            <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
