import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Sparkle, SpinnerGap, WarningCircle, CheckCircle, Eye, EyeSlash, Lock, ArrowLeft } from '@phosphor-icons/react'

const API_URL = import.meta.env.VITE_API_URL || ''

// Password strength calculation
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-yellow-500' }
  return { score: 3, label: 'Strong', color: 'bg-green-500' }
}

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  useEffect(() => {
    if (!token) {
      setError('Invalid password reset link')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!password) {
      setError('Please enter a new password')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to reset password. The link may be invalid or expired.')
        setLoading(false)
        return
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-light-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <Sparkle className="w-8 h-8 text-brand-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary-light to-brand-primary-light bg-clip-text text-transparent">
                KOLOR STUDIO
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-light-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-700/50">
                <CheckCircle weight="duotone" className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-text-primary" data-testid="reset-success-title">Password reset successful!</h1>
              <p className="text-text-secondary mb-6">
                Your password has been changed successfully. Redirecting you to the login page...
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <SpinnerGap className="w-4 h-4 animate-spin" />
                <span className="text-sm">Redirecting...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Sparkle className="w-8 h-8 text-brand-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary-light to-brand-primary-light bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">Create new password</h1>
          <p className="text-text-secondary">Your new password must be at least 8 characters</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-light-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-400" data-testid="reset-password-error">
              <WarningCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full pl-12 pr-12 py-3 bg-light-100 border border-light-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-text-primary placeholder-gray-400"
                  placeholder="Enter new password"
                  data-testid="reset-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-light-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.score === 1
                          ? 'text-red-400'
                          : passwordStrength.score === 2
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                      data-testid="password-strength-label"
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    Use 8+ characters with a mix of letters, numbers & symbols
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError('')
                  }}
                  className={`w-full pl-12 pr-12 py-3 bg-light-100 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-text-primary placeholder-gray-400 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-500/50'
                      : confirmPassword && confirmPassword === password
                      ? 'border-green-500/50'
                      : 'border-light-200'
                  }`}
                  placeholder="Confirm new password"
                  data-testid="reset-confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showConfirmPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-2 text-sm text-red-400">Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-brand-primary text-white py-3 rounded-lg hover:bg-brand-primary transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-brand-primary-dark/40 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="reset-password-submit"
            >
              {loading ? (
                <>
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-purple-600 transition-colors"
              data-testid="back-to-login-from-reset"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
