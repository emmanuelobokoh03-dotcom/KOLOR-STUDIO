import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkle, SpinnerGap, WarningCircle, CheckCircle } from '@phosphor-icons/react'
import { authApi } from '../services/api'
import { trackSignup } from '../utils/analytics'

const Signup = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studioName: '',
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const result = await authApi.signup({
      firstName: formData.firstName,
      lastName: formData.lastName,
      studioName: formData.studioName || undefined,
      email: formData.email,
      password: formData.password,
    })

    setLoading(false)

    if (result.error) {
      setError(result.message || 'Failed to create account')
      return
    }

    trackSignup('email')
    
    // Auto-login after signup
    const loginResult = await authApi.login({ email: formData.email, password: formData.password })
    if (loginResult.data?.token) {
      localStorage.setItem('token', loginResult.data.token)
      setSuccess('Account created! Setting up your workspace...')
      setTimeout(() => navigate('/onboarding'), 1000)
    } else {
      setSuccess('Account created! Please log in.')
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-light-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Sparkle className="w-8 h-8 text-brand-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary-light to-brand-primary-light bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">Start your free account</h1>
          <p className="text-text-secondary">No credit card required • 2-minute setup</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-light-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600" data-testid="signup-error" role="alert">
              <WarningCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700" data-testid="signup-success">
              <CheckCircle weight="fill" className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="signup-fn" className="block text-sm font-medium text-text-secondary mb-2">
                  First Name <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="signup-fn"
                  type="text"
                  name="firstName"
                  required
                  aria-required="true"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-light-100 border border-light-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-text-primary placeholder-gray-400"
                  placeholder="John"
                  data-testid="signup-firstname"
                />
              </div>
              <div>
                <label htmlFor="signup-ln" className="block text-sm font-medium text-text-secondary mb-2">
                  Last Name <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="signup-ln"
                  type="text"
                  name="lastName"
                  required
                  aria-required="true"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-light-100 border border-light-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-text-primary placeholder-gray-400"
                  placeholder="Doe"
                  data-testid="signup-lastname"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-studio" className="block text-sm font-medium text-text-secondary mb-2">
                Studio Name
              </label>
              <input
                id="signup-studio"
                type="text"
                name="studioName"
                value={formData.studioName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-light-100 border border-light-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-text-primary placeholder-gray-400"
                placeholder="Your Creative Studio"
                data-testid="signup-studioname"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-text-secondary mb-2">
                Email <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                name="email"
                required
                aria-required="true"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-light-100 border border-light-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-text-primary placeholder-gray-400"
                placeholder="you@example.com"
                data-testid="signup-email"
              />
            </div>

            <div>
              <label htmlFor="signup-pw" className="block text-sm font-medium text-text-secondary mb-2">
                Password <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="signup-pw"
                type="password"
                name="password"
                required
                aria-required="true"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-light-100 border border-light-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-text-primary placeholder-gray-400"
                placeholder="••••••••"
                data-testid="signup-password"
              />
              <p className="text-xs text-text-tertiary mt-1">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-3 rounded-lg hover:bg-brand-primary transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-brand-primary-dark/40 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="signup-submit"
            >
              {loading ? (
                <>
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-text-tertiary" data-testid="signup-legal-agreement">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-purple-600 hover:text-purple-600 underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-purple-600 hover:text-purple-600 underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-600 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
