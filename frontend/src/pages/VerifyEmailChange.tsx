import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

type Status = 'verifying' | 'success' | 'error'

/**
 * VerifyEmailChange (iter 269). Landing page for the verification link
 * sent to the NEW address. Backend bumps tokenVersion on success, so the
 * current session is dead — redirect to /login.
 */
export default function VerifyEmailChange() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('verifying')
  const [oldEmail, setOldEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  // Guard against React.StrictMode double-invocation: the verify call is
  // mutating and single-use, so it must fire exactly once per mount pair.
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    if (!token) {
      setStatus('error')
      setErrorMsg('Invalid link')
      return
    }
    authApi
      .verifyEmailChange(token)
      .then((res: any) => {
        if (res?.data?.success) {
          setOldEmail(res.data.oldEmail)
          setNewEmail(res.data.newEmail)
          setStatus('success')
          setTimeout(() => navigate('/login', { replace: true }), 3000)
        } else {
          setStatus('error')
          setErrorMsg(res?.message || res?.error || 'Verification failed')
        }
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Unexpected error')
      })
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-elevated rounded-lg shadow-md p-6 sm:p-8">
        {status === 'verifying' && (
          <div className="text-center space-y-3" data-testid="verify-email-loading">
            <h1 className="text-2xl font-bold text-text-primary">Verifying…</h1>
            <p className="text-sm text-text-secondary">Applying your email change.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4" data-testid="verify-email-success">
            <h1 className="text-2xl font-bold text-text-primary">Email changed ✓</h1>
            <p className="text-sm text-text-primary">
              Your email was changed from <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
            </p>
            <p className="text-sm text-text-secondary">
              Please sign in with your new email address. Your password hasn't changed.
            </p>
            <p className="text-xs text-text-secondary">Redirecting to login…</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
              data-testid="verify-email-signin-button"
            >
              Sign in now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4" data-testid="verify-email-error">
            <h1 className="text-2xl font-bold text-text-primary">Link expired or invalid</h1>
            <p className="text-sm text-text-secondary">{errorMsg}</p>
            <p className="text-sm text-text-secondary">
              Please request a new email change from your account settings.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-4 py-2 border border-border rounded-md text-text-primary hover:bg-surface-muted"
              data-testid="verify-email-back-to-login"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
