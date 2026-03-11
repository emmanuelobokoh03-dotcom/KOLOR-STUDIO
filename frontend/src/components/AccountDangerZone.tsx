import { useState } from 'react'
import { Warning, SpinnerGap } from '@phosphor-icons/react'

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
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/user/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
        <h3 className="text-lg font-semibold text-text-primary mb-1">Account</h3>
        <p className="text-sm text-text-secondary">Manage your account and data</p>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200" data-testid="danger-zone">
        <div className="flex items-start gap-3 mb-4">
          <Warning weight="fill" className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-lg font-bold text-red-600 mb-1">Danger Zone</h4>
            <p className="text-sm text-text-secondary">
              Once you delete your account, all your data will be permanently removed.
              This action cannot be undone.
            </p>
          </div>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
            data-testid="delete-account-btn"
          >
            Delete My Account
          </button>
        ) : (
          <div className="bg-white rounded-lg p-5 border border-red-200 mt-2 space-y-4">
            <p className="text-sm font-semibold text-text-primary">
              This will permanently delete:
            </p>
            <ul className="text-sm text-text-secondary space-y-1 ml-4 list-disc">
              <li>All leads and client data</li>
              <li>All quotes, contracts, and payments</li>
              <li>All files and messages</li>
              <li>All automation sequences</li>
            </ul>

            {error && (
              <p className="text-sm text-red-500 font-medium" data-testid="delete-error">{error}</p>
            )}

            <input
              type="password"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-light-200 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
              data-testid="delete-password-input"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setPassword(''); setError('') }}
                className="flex-1 px-4 py-2.5 border border-light-200 rounded-lg text-sm font-medium text-text-primary hover:bg-light-50 transition-colors"
                data-testid="delete-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!password || deleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="delete-confirm-btn"
              >
                {deleting && <SpinnerGap className="w-4 h-4 animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
