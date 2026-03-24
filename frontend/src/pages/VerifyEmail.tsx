import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, SpinnerGap } from '@phosphor-icons/react'
import { authApi } from '../services/api'

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    authApi.verifyEmail(token).then(result => {
      if (result.error) {
        setStatus('error')
        setMessage(result.message || 'Verification failed')
      } else {
        setStatus('success')
        setMessage(result.data?.message || 'Email verified successfully')
        // Clear the dismissed state so banner updates
        localStorage.removeItem('email_verification_dismissed')
        setTimeout(() => navigate('/dashboard'), 3000)
      }
    })
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-6" data-testid="verify-email-page">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <SpinnerGap weight="duotone" className="w-16 h-16 mx-auto mb-4 text-brand-primary animate-spin" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Verifying Email...</h2>
            <p className="text-text-secondary">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <div data-testid="verify-success">
            <CheckCircle weight="duotone" className="w-16 h-16 mx-auto mb-4 text-green-700" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Email Verified!</h2>
            <p className="text-text-secondary mb-6">{message}</p>
            <p className="text-sm text-text-tertiary">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div data-testid="verify-error">
            <XCircle weight="duotone" className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Verification Failed</h2>
            <p className="text-text-secondary mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:opacity-90 transition"
              data-testid="go-to-dashboard-btn"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
