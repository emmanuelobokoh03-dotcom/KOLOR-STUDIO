import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SpinnerGap } from '@phosphor-icons/react'
import { authApi } from '../services/api'
import { trackLogin } from '../utils/analytics'

/* SVG helpers */
const StarIcon = () => <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0l1.12 3.45H10L6.94 5.59l1.18 3.41L5 6.91 1.88 9l1.18-3.41L0 3.45h3.88z" fill="#E8891A" /></svg>
const LockIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.3" /><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
const ShieldIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z" stroke="currentColor" strokeWidth="1.3" /></svg>
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 4C4 4 1 10 1 10s3 6 9 6 9-6 9-6-3-6-9-6z" stroke="currentColor" strokeWidth="1.3" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" /></svg>
) : (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 4C4 4 1 10 1 10s3 6 9 6 9-6 9-6-3-6-9-6z" stroke="currentColor" strokeWidth="1.3" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" /><line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2a10.4 10.4 0 00-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92A8.78 8.78 0 0017.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 009 18z" fill="#34A853"/><path d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 009 0 9 9 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>
)

const Login = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

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
    const result = await authApi.login({ email: formData.email, password: formData.password, rememberMe })
    setLoading(false)
    if (result.error) { setError(result.message || 'Failed to sign in'); return }
    if (result.data?.token) {
      localStorage.removeItem('token')
      localStorage.setItem('user', JSON.stringify(result.data.user))
      trackLogin('email')
      navigate('/dashboard')
    }
  }

  return (
    <div className="h-screen overflow-hidden grid md:grid-cols-[420px_1fr] grid-cols-1">
      {/* Left panel — dark brand */}
      <div className="hidden md:flex flex-col justify-between relative overflow-hidden" style={{ background: '#080612', padding: '40px 40px 36px' }}>
        {/* Ambient glows */}
        <div className="absolute pointer-events-none" style={{ top: -100, left: -100, width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(108,46,219,0.30) 0%, transparent 62%)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -80, right: -80, width: 360, height: 360, background: 'radial-gradient(ellipse, rgba(232,137,26,0.09) 0%, transparent 62%)' }} />
        {/* Grain */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.03 }}><filter id="g"><feTurbulence baseFrequency="0.65" /></filter><rect width="100%" height="100%" filter="url(#g)" /></svg>

        <div className="relative z-10">
          <Link to="/" className="block mb-12" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.08em', background: 'linear-gradient(135deg, #ffffff 40%, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOLOR</Link>

          <h2 className="font-display font-extrabold leading-[1.1] tracking-[-0.025em] mb-4" style={{ fontSize: 34 }}>
            <span style={{ color: '#fff' }}>Welcome back to</span><br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your studio.</span>
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 300, marginBottom: 32 }}>
            Everything you left is exactly where you left it. Your leads, your quotes, your next booking.
          </p>

          {/* Testimonial */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 18 }}>
            <div className="flex gap-[3px] mb-2.5">{[...Array(5)].map((_, i) => <StarIcon key={i} />)}</div>
            <p className="italic" style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)', lineHeight: 1.65, marginBottom: 12 }}>
              "I booked 4 weddings in my first month using KOLOR. It's the first CRM that actually feels designed for photographers."
            </p>
            <div className="flex items-center gap-2.5">
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>SL</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Sophie L.</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Wedding photographer · Cape Town</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10" style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
          New to KOLOR?{' '}
          <Link to="/signup" style={{ color: 'rgba(167,139,250,0.7)' }}>Create a free account →</Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center bg-surface-base overflow-y-auto" style={{ padding: 'clamp(32px, 5vh, 52px) clamp(24px, 4vw, 48px)' }}>
        <div className="max-w-[400px] w-full mx-auto">
          {/* Mobile logo */}
          <Link to="/" className="md:hidden block mb-8" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.08em', background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOLOR</Link>

          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text-primary mb-1">Sign in</h1>
          <p className="text-[13px] text-text-secondary mb-6">
            No account yet?{' '}
            <Link to="/signup" className="font-medium" style={{ color: '#6C2EDB' }}>Start for free →</Link>
          </p>

          {/* Google SSO */}
          <button className="w-full flex items-center justify-center gap-2.5 rounded-[10px] border border-light-200 bg-surface-base hover:bg-surface-background transition-colors duration-fast" style={{ height: 46 }} data-testid="google-sso">
            <GoogleIcon />
            <span className="text-[13px] font-medium text-text-primary">Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-[18px]">
            <span className="flex-1 h-px bg-light-200" />
            <span className="text-[11px] font-medium text-text-tertiary">or</span>
            <span className="flex-1 h-px bg-light-200" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg text-[12px]" style={{ background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.2)', padding: '10px 14px', color: '#DC2626' }} data-testid="login-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 16 16" className="flex-shrink-0 mt-0.5"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" fill="none" /><path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="login-email" className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-[5px]">Email address</label>
              <input id="login-email" type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full rounded-[10px] border border-light-200 bg-surface-base text-[13px] text-text-primary placeholder:text-text-tertiary outline-none transition-all duration-fast focus:border-[#6C2EDB] focus:shadow-[0_0_0_3px_rgba(108,46,219,0.10)]" style={{ height: 46, padding: '0 14px' }} data-testid="login-email" />
            </div>

            <div className="mb-4">
              <label htmlFor="login-password" className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-[5px]">Password</label>
              <div className="relative">
                <input id="login-password" type={showPw ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full rounded-[10px] border border-light-200 bg-surface-base text-[13px] text-text-primary placeholder:text-text-tertiary outline-none transition-all duration-fast focus:border-[#6C2EDB] focus:shadow-[0_0_0_3px_rgba(108,46,219,0.10)]" style={{ height: 46, padding: '0 42px 0 14px' }} data-testid="login-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between mb-5">
              <label className="flex items-center gap-2 cursor-pointer" data-testid="remember-me-label">
                <span className="relative flex items-center justify-center w-[15px] h-[15px] rounded cursor-pointer" style={{ background: rememberMe ? '#6C2EDB' : 'transparent', border: rememberMe ? 'none' : '1.5px solid var(--border-dark)' }} onClick={(e) => { e.preventDefault(); setRememberMe(!rememberMe) }}>
                  {rememberMe && <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only" data-testid="remember-me-checkbox" />
                <span className="text-xs text-text-secondary select-none">Remember me for 7 days</span>
              </label>
              <Link to="/forgot-password" className="text-xs font-medium" style={{ color: '#6C2EDB' }} data-testid="forgot-password-link">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-[10px] text-white text-sm font-bold tracking-[0.01em] transition-all duration-fast active:scale-[0.97]" style={{ height: 46, background: loading ? 'rgba(108,46,219,0.7)' : '#6C2EDB', cursor: loading ? 'not-allowed' : 'pointer' }} onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#5522B8' }} onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#6C2EDB' }} data-testid="login-submit">
              {loading ? <span className="inline-flex items-center gap-2"><SpinnerGap className="w-4 h-4 animate-spin" />Signing in...</span> : 'Sign in to KOLOR →'}
            </button>
          </form>

          {/* Trust */}
          <div className="flex items-center justify-center gap-4 mt-5">
            {[
              { icon: <LockIcon />, label: 'Secure login' },
              { icon: <ShieldIcon />, label: '256-bit SSL' },
              { icon: <CheckIcon />, label: 'No spam, ever' },
            ].map((t, i) => (
              <div key={t.label} className="flex items-center gap-3">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-light-300 -ml-1" />}
                <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <span className="text-text-tertiary">{t.icon}</span>{t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
