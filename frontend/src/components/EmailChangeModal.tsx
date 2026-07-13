import { useState, FormEvent } from 'react'
import { authApi } from '../services/api'

interface EmailChangeModalProps {
  currentEmail: string
  onClose: () => void
  onSuccess: (pendingEmail: string) => void
}

/**
 * EmailChangeModal (iter 269). Two states: form (new email + current
 * password re-auth) and success ("verification sent"). 401/409/429 errors
 * surfaced inline.
 */
export default function EmailChangeModal({ currentEmail, onClose, onSuccess }: EmailChangeModalProps) {
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!newEmail || !currentPassword) {
      setError('Both fields are required.')
      return
    }
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setError('New email must be different from your current email.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res: any = await authApi.requestEmailChange({ newEmail: newEmail.trim(), currentPassword })
      if (res?.data?.success) {
        setPendingEmail(res.data.pendingEmail)
        onSuccess(res.data.pendingEmail)
      } else {
        setError(res?.message || res?.error || 'Failed to request email change.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-2 sm:p-4"
      data-testid="email-change-modal"
      onClick={onClose}
    >
      <div
        className="bg-surface-elevated rounded-lg shadow-xl w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">
            {pendingEmail ? 'Check your inbox' : 'Change email address'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Close"
            data-testid="email-change-close"
          >
            ✕
          </button>
        </header>

        <main className="px-6 py-6 overflow-y-auto">
          {pendingEmail ? (
            <div className="space-y-4" data-testid="email-change-success">
              <p className="text-sm text-text-primary">
                We sent a verification link to <strong>{pendingEmail}</strong>. Click the link
                within 15 minutes to complete the change.
              </p>
              <p className="text-sm text-text-secondary">
                Your current email remains active until you verify. If you don't see the email,
                check your spam folder.
              </p>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
                data-testid="email-change-close-success"
              >
                Got it
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="email-change-form">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Current email</label>
                <input
                  type="email"
                  value={currentEmail}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface-muted text-text-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">New email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={submitting}
                  required
                  placeholder="new@example.com"
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
                  data-testid="email-change-new-email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={submitting}
                  required
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
                  data-testid="email-change-password"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Required for security. Your password isn't changing.
                </p>
              </div>

              {error && (
                <div
                  className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2"
                  data-testid="email-change-error"
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-border rounded-md text-text-primary hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 disabled:opacity-50"
                  data-testid="email-change-submit"
                >
                  {submitting ? 'Sending…' : 'Send verification'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
