// iter Settings v3-v3a.2 — proactive sweep calibration.
// AccountDangerZone framework calibration (Case B moderate refactor).
// Legacy palette migrated to framework tokens; semantic red danger
// accents preserved per Q2 confirmation (unambiguous danger signal).

import { useState } from 'react'
import KolorSpinner from './KolorSpinner'
import { Warning } from '@phosphor-icons/react/dist/csr/Warning'
const API_URL = import.meta.env.VITE_API_URL || ''

export default function AccountDangerZone() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!password) return
    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/user/account`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete account')
        setDeleting(false)
        return
      }

      localStorage.clear()
      window.location.href = '/'
    } catch {
      setError('Network error. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6" data-testid="account-settings">
      <div>
        <p
          style={{
            margin: 0,
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Danger zone
        </p>
        <h3
          style={{
            margin: 0,
            marginBottom: 6,
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 20,
            lineHeight: 1.2,
            color: 'var(--kolor-ink, #1A1613)',
          }}
        >
          Delete account
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            color: 'var(--kolor-ink-muted, #5F5751)',
          }}
        >
          Permanently remove your account and all associated data.
        </p>
      </div>

      {/* Danger surface — semantic red preserved */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(220, 38, 38, 0.05)', // red-600 5% alpha wash on kolor canvas
          border: '1px solid rgba(220, 38, 38, 0.20)',
        }}
        data-testid="danger-zone"
      >
        <div className="flex items-start gap-3 mb-4">
          <Warning weight="fill" className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <div>
            <p
              style={{
                margin: 0,
                marginBottom: 4,
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#DC2626',
              }}
            >
              Danger zone
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--kolor-ink-muted, #5F5751)',
              }}
            >
              Once you delete your account, all your data will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="rounded-lg text-sm font-semibold transition-colors"
            style={{
              padding: '10px 20px',
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontSize: 11,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#B91C1C' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#DC2626' }}
            data-testid="delete-account-btn"
          >
            Delete my account
          </button>
        ) : (
          <div
            className="rounded-lg p-5 mt-2 space-y-4"
            style={{
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid rgba(220, 38, 38, 0.20)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--kolor-ink, #1A1613)',
              }}
            >
              This will permanently delete:
            </p>
            <ul
              className="ml-4 list-disc space-y-1"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                color: 'var(--kolor-ink-muted, #5F5751)',
              }}
            >
              <li>All leads and client data</li>
              <li>All quotes, contracts, and payments</li>
              <li>All files and messages</li>
              <li>All automation sequences</li>
            </ul>

            {error && (
              <p
                data-testid="delete-error"
                style={{
                  margin: 0,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#DC2626',
                }}
              >
                {error}
              </p>
            )}

            <input
              type="password"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg outline-none"
              style={{
                padding: '10px 16px',
                fontSize: 13,
                background: 'var(--kolor-canvas, #F7F4EE)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                color: 'var(--kolor-ink, #1A1613)',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#DC2626'
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.12)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              data-testid="delete-password-input"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setPassword(''); setError('') }}
                className="flex-1 rounded-lg text-sm font-medium transition-colors"
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  color: 'var(--kolor-ink, #1A1613)',
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                data-testid="delete-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!password || deleting}
                className="flex-1 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  padding: '10px 16px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: password && !deleting ? 'pointer' : 'not-allowed',
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontSize: 11,
                }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#B91C1C' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#DC2626' }}
                data-testid="delete-confirm-btn"
              >
                {deleting && <KolorSpinner size={16} />}
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
