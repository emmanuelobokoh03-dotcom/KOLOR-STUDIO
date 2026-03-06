import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Loader2 } from 'lucide-react'

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden" data-testid="portal-messages">
      {/* Header */}
      <div className="px-5 md:px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Messages</h3>
            <p className="text-xs text-gray-500">Ask questions or share updates with {studioName}</p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="p-4 md:p-6 space-y-3 max-h-80 overflow-y-auto bg-white" data-testid="portal-messages-list">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm mb-1">No messages yet</p>
            <p className="text-gray-400 text-xs">Send a message to start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'CLIENT' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${msg.id}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.from === 'CLIENT'
                    ? 'bg-brand-primary text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${
                    msg.from === 'CLIENT' ? 'text-white/60' : 'text-gray-400'
                  }`}>
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
      <form onSubmit={sendMessage} className="p-3 md:p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-primary text-sm"
            disabled={sending}
            data-testid="portal-message-input"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2.5 bg-brand-primary text-white rounded-xl font-medium text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            data-testid="portal-send-message-btn"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
