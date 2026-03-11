import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X } from '@phosphor-icons/react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consentChoice = localStorage.getItem('cookie_consent')
    if (!consentChoice) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem('cookie_consent', 'all')
    localStorage.setItem('analytics_consent', 'true')
    setShowBanner(false)
  }

  const handleEssentialOnly = () => {
    localStorage.setItem('cookie_consent', 'essential')
    localStorage.setItem('analytics_consent', 'false')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-dark-card rounded-2xl shadow-2xl border border-dark-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icon & Text */}
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-brand-primary-dark/30 rounded-xl flex items-center justify-center flex-shrink-0 border border-brand-primary-dark/30">
              <Cookie className="w-5 h-5 text-brand-primary-light" />
            </div>
            <div>
              <p className="text-gray-300 text-sm sm:text-base">
                We use cookies to keep you logged in and improve our product.{' '}
                <Link 
                  to="/privacy" 
                  className="text-brand-primary-light hover:text-brand-primary-light underline transition"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleEssentialOnly}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-card-hover rounded-lg transition"
              data-testid="cookie-essential-btn"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition"
              data-testid="cookie-accept-btn"
            >
              Accept All
            </button>
          </div>

          {/* Close button (mobile) */}
          <button
            onClick={handleEssentialOnly}
            className="absolute top-3 right-3 sm:hidden p-1 text-gray-500 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
