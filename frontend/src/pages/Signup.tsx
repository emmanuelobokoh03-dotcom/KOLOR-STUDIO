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
    <div className="min-h-screen bg-surface-background flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <Sparkle className="w-8 h-8 text-brand-600 group-hover:text-brand-700 transition-colors duration-fast" />
            <span className="text-2xl font-bold font-heading bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </Link>
          <h1 className="text-h3 font-heading text-text-primary mb-2">Start your free account</h1>
          <p className="text-body-lg text-text-secondary">No credit card required · 2-minute setup</p>
        </div>

        <div className="card p-8 shadow-elevation-3">
          {error && (
            <div className="mb-6 p-4 bg-danger-light border border-danger-border rounded-card flex items-center gap-3 text-danger-text animate-fade-in" data-testid="signup-error" role="alert">
              <WarningCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-body">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-success-light border border-success-border rounded-card flex items-center gap-3 text-success-text animate-fade-in" data-testid="signup-success">
              <CheckCircle weight="fill" className="w-5 h-5 flex-shrink-0" />
              <span className="text-body font-medium">{success}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="signup-fn" className="input-label">
                  First Name <span className="text-danger" aria-label="required">*</span>
                </label>
                <input
                  id="signup-fn"
                  type="text"
                  name="firstName"
                  required
                  aria-required="true"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input"
                  placeholder="John"
                  data-testid="signup-firstname"
                />
              </div>
              <div>
                <label htmlFor="signup-ln" className="input-label">
                  Last Name <span className="text-danger" aria-label="required">*</span>
                </label>
                <input
                  id="signup-ln"
                  type="text"
                  name="lastName"
                  required
                  aria-required="true"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Doe"
                  data-testid="signup-lastname"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-studio" className="input-label">
                Studio Name
              </label>
              <input
                id="signup-studio"
                type="text"
                name="studioName"
                value={formData.studioName}
                onChange={handleChange}
                className="input"
                placeholder="Your Creative Studio"
                data-testid="signup-studioname"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="input-label">
                Email <span className="text-danger" aria-label="required">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                name="email"
                required
                aria-required="true"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
                data-testid="signup-email"
              />
            </div>

            <div>
              <label htmlFor="signup-pw" className="input-label">
                Password <span className="text-danger" aria-label="required">*</span>
              </label>
              <input
                id="signup-pw"
                type="password"
                name="password"
                required
                aria-required="true"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
                data-testid="signup-password"
              />
              <p className="text-caption text-text-tertiary mt-1">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 rounded-card shadow-elevation-2 hover:shadow-elevation-3"
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
            <p className="text-caption text-text-tertiary" data-testid="signup-legal-agreement">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-brand-600 hover:text-brand-700 underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-brand-600 hover:text-brand-700 underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-body text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors duration-fast">
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
