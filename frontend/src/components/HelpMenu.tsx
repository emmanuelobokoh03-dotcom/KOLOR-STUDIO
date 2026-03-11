import { useState, useRef, useEffect } from 'react'
import { Question, BookOpen, Envelope, CaretDown, ChatText } from '@phosphor-icons/react'

interface HelpMenuProps {
  onOpenFeedback: () => void;
}

export default function HelpMenu({ onOpenFeedback }: HelpMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDocumentation = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 text-gray-400 hover:text-white hover:bg-dark-card-hover rounded-lg transition"
        data-testid="help-menu-button"
        title="Help & Support"
      >
        <Question className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">Help</span>
        <CaretDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-dark-card rounded-xl shadow-xl border border-dark-border py-2 z-50">
          {/* Email Support */}
          <a
            href="mailto:hello@kolorstudio.com"
            className="w-full px-4 py-2.5 text-left hover:bg-dark-card-hover flex items-center gap-3 transition"
            data-testid="email-support-link"
          >
            <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center border border-green-700/30">
              <Envelope className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Email Support</p>
              <p className="text-xs text-gray-500">We respond within 24 hours</p>
            </div>
          </a>

          {/* Documentation */}
          <button
            onClick={handleDocumentation}
            className="w-full px-4 py-2.5 text-left hover:bg-dark-card-hover flex items-center gap-3 transition"
            data-testid="documentation-link"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center border border-blue-700/30">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Documentation</p>
              <p className="text-xs text-gray-500">Guides and tutorials</p>
            </div>
          </button>

          {/* Send Feedback */}
          <button
            onClick={() => { onOpenFeedback(); setIsOpen(false); }}
            className="w-full px-4 py-2.5 text-left hover:bg-dark-card-hover flex items-center gap-3 transition"
            data-testid="send-feedback-btn"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-primary-dark/30 flex items-center justify-center border border-brand-primary-dark/30">
              <ChatText className="w-4 h-4 text-brand-primary-light" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Send Feedback</p>
              <p className="text-xs text-gray-500">Report bugs or suggest features</p>
            </div>
          </button>

          <div className="my-2 border-t border-dark-border" />

          {/* Version Info */}
          <div className="px-4 py-2">
            <p className="text-xs text-gray-500">
              KOLOR STUDIO v1.0.0
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-dark-card border border-dark-border rounded-lg px-4 py-3 shadow-xl z-50 animate-slide-up">
          <p className="text-sm text-white">
            📚 Documentation coming soon! Stay tuned for guides and tutorials.
          </p>
        </div>
      )}
    </div>
  )
}
