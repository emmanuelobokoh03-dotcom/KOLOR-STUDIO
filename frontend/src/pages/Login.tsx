import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkle, SpinnerGap, WarningCircle } from '@phosphor-icons/react'
import { authApi } from '../services/api'
import { trackLogin } from '../utils/analytics'

const Login = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
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

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    const result = await authApi.login({
      email: formData.email,
      password: formData.password,
    })

    setLoading(false)

    if (result.error) {
      setError(result.message || 'Failed to sign in')
      return
    }

    if (result.data?.token) {
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))
      trackLogin('email')
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-surface-background flex items-center justify-center px-6">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <Sparkle className="w-8 h-8 text-brand-600 group-hover:text-brand-700 transition-colors duration-fast" />
            <span className="text-2xl font-bold font-heading bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </Link>
          <h1 className="text-h3 font-heading text-text-primary mb-2">Welcome back</h1>
          <p className="text-body-lg text-text-secondary">Sign in to manage your creative business</p>
        </div>

        <div className="card p-8 shadow-elevation-3 border-border">
          {error && (
            <div className="mb-6 p-4 bg-danger-light border border-danger-border rounded-card flex items-center gap-3 text-danger-text animate-fade-in" data-testid="login-error" role="alert">
              <WarningCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="text-body">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-email" className="input-label">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                required
                aria-required="true"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
                data-testid="login-email"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="input-label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                required
                aria-required="true"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
                data-testid="login-password"
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-body-sm text-brand-600 hover:text-brand-700 font-medium transition-colors duration-fast"
                data-testid="forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="btn btn-primary w-full py-3 rounded-card shadow-elevation-2 hover:shadow-elevation-3"
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <SpinnerGap className="w-5 h-5 animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-body text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors duration-fast">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
