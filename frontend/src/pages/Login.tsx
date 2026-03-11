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

    // Basic validation
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

    // Store token and user data
    if (result.data?.token) {
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))
      trackLogin('email')
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <Sparkle className="w-8 h-8 text-brand-primary group-hover:text-purple-600 transition-colors duration-200" />
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary-light to-brand-primary-light bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">Welcome back</h1>
          <p className="text-text-secondary">Sign in to manage your creative business</p>
        </div>

        <div className="bg-light-50 rounded-2xl shadow-2xl p-8 border border-light-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-400 animate-fade-in" data-testid="login-error">
              <WarningCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-light-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-text-primary placeholder-gray-400"
                placeholder="you@example.com"
                data-testid="login-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-light-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-text-primary placeholder-gray-400"
                placeholder="••••••••"
                data-testid="login-password"
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-600 font-medium transition-colors duration-200"
                data-testid="forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-3 rounded-xl hover:bg-brand-primary transition-all duration-200 shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-brand-primary-dark/40 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-600 hover:text-purple-600 font-semibold transition-colors duration-200">
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
