import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import KolorSpinner from '../components/KolorSpinner'

// AuthCallback — relay page for Google OAuth token exchange.
// Google OAuth sets cookie on api.kolorstudio.app, then redirects here
// with the JWT as a URL param. We immediately POST it back to the API
// via a credentialed request, which sets the cookie in the browser
// correctly (same-origin credentialed response, no sameSite:lax issue).
export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('t')
    const next = searchParams.get('next') || '/dashboard'
    const API_URL = (import.meta as any).env?.VITE_API_URL || ''

    if (!token) {
      setError('No token received from Google. Please try signing in again.')
      return
    }

    // Exchange token for cookie
    fetch(`${API_URL}/api/auth/exchange-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Small delay to ensure cookie is set before navigation
          setTimeout(() => navigate(next, { replace: true }), 100)
        } else {
          setError(data.error || 'Authentication failed. Please try again.')
        }
      })
      .catch(() => {
        setError('Connection error. Please try signing in again.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div
        data-testid="auth-callback-error"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          background: 'var(--surface-base)',
        }}
      >
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          {error}
        </p>
        <button
          onClick={() => { window.location.href = '/login' }}
          style={{
            padding: '10px 20px',
            background: '#6C2EDB',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to login
        </button>
      </div>
    )
  }

  return (
    <div
      data-testid="auth-callback-spinner"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-base)',
      }}
    >
      <KolorSpinner />
    </div>
  )
}
