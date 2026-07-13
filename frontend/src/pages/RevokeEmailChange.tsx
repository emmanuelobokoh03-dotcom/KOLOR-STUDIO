import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

type Status = 'revoking' | 'success' | 'error'

/**
 * RevokeEmailChange (iter 269). Landing page for the "This wasn't me"
 * link sent to the OLD address. Cancels the pending change.
 */
export default function RevokeEmailChange() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('revoking')
  // Guard against React.StrictMode double-invocation (mutating call).
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    if (!token) {
      setStatus('error')
      return
    }
    authApi
      .revokeEmailChange(token)
      .then((res: any) => {
        setStatus(res?.data?.success ? 'success' : 'error')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-elevated rounded-lg shadow-md p-6 sm:p-8">
        {status === 'revoking' && (
          <div className="text-center space-y-3" data-testid="revoke-email-loading">
            <h1 className="text-2xl font-bold text-text-primary">Cancelling…</h1>
            <p className="text-sm text-text-secondary">Revoking the email change request.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4" data-testid="revoke-email-success">
            <h1 className="text-2xl font-bold text-text-primary">Email change cancelled</h1>
            <p className="text-sm text-text-primary">
              The pending email change has been revoked. Your account email is unchanged.
            </p>
            <p className="text-sm text-text-secondary">
              If this change wasn't requested by you, we recommend also changing your password.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
              data-testid="revoke-email-signin-button"
            >
              Sign in
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4" data-testid="revoke-email-error">
            <h1 className="text-2xl font-bold text-text-primary">Link expired</h1>
            <p className="text-sm text-text-secondary">
              This link is no longer valid. If the email change already went through and it
              wasn't you, please reset your password and contact support immediately.
            </p>
            <button
              onClick={() => navigate('/forgot-password', { replace: true })}
              className="w-full px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
              data-testid="revoke-email-reset-password"
            >
              Reset password
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
