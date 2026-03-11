import { useState } from 'react'
import { X, Envelope, SpinnerGap } from '@phosphor-icons/react'
import { authApi, User } from '../services/api'

interface EmailVerificationBannerProps {
  user: User | null;
}

export default function EmailVerificationBanner({ user }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('email_verification_dismissed') === 'true'
  )
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!user || user.emailVerified || dismissed) return null

  const handleResend = async () => {
    setSending(true)
    const result = await authApi.sendVerification()
    setSending(false)
    if (result.error) {
      alert(result.message || 'Failed to send verification email')
    } else {
      setSent(true)
      setTimeout(() => setSent(false), 5000)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('email_verification_dismissed', 'true')
    setDismissed(true)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200" data-testid="email-verification-banner">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Envelope className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 truncate">
              <strong>Verify your email</strong> to unlock all features and secure your account.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleResend}
              disabled={sending || sent}
              className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors whitespace-nowrap disabled:opacity-50"
              data-testid="resend-verification-btn"
            >
              {sending ? (
                <span className="flex items-center gap-1"><SpinnerGap className="w-3.5 h-3.5 animate-spin" /> Sending...</span>
              ) : sent ? 'Sent!' : 'Resend Email'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-amber-500 hover:text-amber-700 transition-colors p-1"
              data-testid="dismiss-verification-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
