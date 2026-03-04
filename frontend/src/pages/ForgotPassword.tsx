import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Loader2, AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.message || 'Too many requests. Please try again later.')
        } else {
          setError(data.message || 'Something went wrong. Please try again.')
        }
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <Sparkles className="w-8 h-8 text-violet-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                KOLOR STUDIO
              </span>
            </Link>
          </div>

          <div className="bg-dark-card rounded-2xl shadow-xl p-8 border border-dark-border">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-700/50">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-white" data-testid="success-title">Check your email</h1>
              <p className="text-gray-400 mb-6">
                If an account exists with <strong className="text-white">{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold"
                data-testid="back-to-login"
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

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Sparkles className="w-8 h-8 text-violet-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-white">Forgot password?</h1>
          <p className="text-gray-400">No worries, we'll send you reset instructions</p>
        </div>

        <div className="bg-dark-card rounded-2xl shadow-xl p-8 border border-dark-border">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-3 text-red-400" data-testid="forgot-password-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500"
                  placeholder="you@example.com"
                  data-testid="forgot-password-email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/30 hover:shadow-xl hover:shadow-violet-900/40 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="forgot-password-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-violet-400 transition-colors"
              data-testid="back-to-login-link"
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

export default ForgotPassword
