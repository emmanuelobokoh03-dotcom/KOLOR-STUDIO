import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SpinnerGap, CheckCircle, Camera, PencilSimple, PaintBrush, ArrowLeft } from '@phosphor-icons/react'
import { authApi } from '../services/api'
import { trackSignup } from '../utils/analytics'

/* SVG helpers */
const CheckSvg = () => <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
const LockIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.3" /><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
const ShieldIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z" stroke="currentColor" strokeWidth="1.3" /></svg>
const CheckCircleIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 4C4 4 1 10 1 10s3 6 9 6 9-6 9-6-3-6-9-6z" stroke="currentColor" strokeWidth="1.3" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" /></svg>
) : (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 4C4 4 1 10 1 10s3 6 9 6 9-6 9-6-3-6-9-6z" stroke="currentColor" strokeWidth="1.3" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" /><line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2a10.4 10.4 0 00-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92A8.78 8.78 0 0017.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 009 18z" fill="#34A853"/><path d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 009 0 9 9 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>
)

type IndustryChoice = 'PHOTOGRAPHY' | 'DESIGN' | 'FINE_ART'

const INDUSTRY_CARDS: { value: IndustryChoice; label: string; sub: string; Icon: typeof Camera; selectedBg: string; selectedBorder: string }[] = [
  {
    value: 'PHOTOGRAPHY',
    label: 'Photography',
    sub: 'Wedding, portrait, commercial, fashion, editorial',
    Icon: Camera,
    selectedBg: 'rgba(108,46,219,0.08)',
    selectedBorder: '#6C2EDB',
  },
  {
    value: 'DESIGN',
    label: 'Design',
    sub: 'Brand, UI/UX, graphic, interior, motion, illustration',
    Icon: PencilSimple,
    selectedBg: 'rgba(16,185,129,0.08)',
    selectedBorder: '#10B981',
  },
  {
    value: 'FINE_ART',
    label: 'Fine Art',
    sub: 'Painting, sculpture, print, mixed media, installation',
    Icon: PaintBrush,
    selectedBg: 'rgba(232,137,26,0.08)',
    selectedBorder: '#E8891A',
  },
]

const Signup = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', studioName: '', email: '', password: '' })
  const [industry, setIndustry] = useState<IndustryChoice | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const pwStrength = useMemo(() => {
    const len = formData.password.length
    if (len === 0) return 0
    if (len < 6) return 1
    if (len < 10) return 2
    return 3
  }, [formData.password])
  const strengthLabel = ['', 'Weak', 'Medium', 'Strong'][pwStrength]
  const strengthColor = ['', '#EF4444', '#F59E0B', '#10B981'][pwStrength]

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!industry) return
    setLoading(true)
    setError('')
    setSuccess('')
    const result = await authApi.signup({
      firstName: formData.firstName,
      lastName: formData.lastName,
      studioName: formData.studioName || undefined,
      email: formData.email,
      password: formData.password,
      industry,
    } as Parameters<typeof authApi.signup>[0] & { industry: string })
    setLoading(false)
    if (result.error) { setError(result.message || 'Failed to create account'); return }
    trackSignup('email')
    const loginResult = await authApi.login({ email: formData.email, password: formData.password, rememberMe: true })
    if (loginResult.data?.user) {
      localStorage.removeItem('token')
      setSuccess('Account created! Setting up your workspace...')
      setTimeout(() => navigate('/onboarding'), 1000)
    } else {
      setSuccess('Account created! Please log in.')
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  return (
    <div className="h-screen overflow-hidden grid md:grid-cols-[420px_1fr] grid-cols-1">
      {/* Left panel — dark brand */}
      <div className="hidden md:flex flex-col justify-between relative overflow-hidden" style={{ background: '#080612', padding: '40px 40px 36px' }}>
        <div className="absolute pointer-events-none" style={{ top: -100, left: -100, width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(108,46,219,0.30) 0%, transparent 62%)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -80, right: -80, width: 360, height: 360, background: 'radial-gradient(ellipse, rgba(232,137,26,0.09) 0%, transparent 62%)' }} />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.03 }}><filter id="gs"><feTurbulence baseFrequency="0.65" /></filter><rect width="100%" height="100%" filter="url(#gs)" /></svg>

        <div className="relative z-10">
          <Link to="/" className="block mb-12" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.08em', background: 'linear-gradient(135deg, #ffffff 40%, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOLOR</Link>

          <h2 className="font-display font-extrabold leading-[1.1] tracking-[-0.025em] mb-4" style={{ fontSize: 34 }}>
            <span style={{ color: '#fff' }}>Your studio starts</span><br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>right here.</span>
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 300, marginBottom: 28 }}>
            Free forever for the first 20 creators. Leads, quotes, contracts — in one place that fits your workflow.
          </p>

          {/* Feature checklist */}
          <div className="flex flex-col gap-2.5 mb-7">
            {['No credit card required, ever', 'Set up fully in under 5 minutes', 'Free forever for beta creators', 'Cancel or leave anytime'].map(item => (
              <div key={item} className="flex items-center gap-2.5" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                <span className="flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(108,46,219,0.18)', border: '1px solid rgba(108,46,219,0.3)' }}><CheckSvg /></span>
                {item}
              </div>
            ))}
          </div>

          {/* Scarcity bar */}
          <div style={{ background: 'rgba(232,137,26,0.10)', border: '1px solid rgba(232,137,26,0.2)', borderRadius: 10, padding: '12px 14px' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="landing-pulse-dot flex-shrink-0" style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8891A' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>3 free spots remaining</span>
            </div>
            <div style={{ height: 4, background: 'rgba(232,137,26,0.15)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #E8891A, #fbbf24)', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 6 }}>17 of 20 beta spots claimed</div>
          </div>
        </div>

        <div className="relative z-10" style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'rgba(167,139,250,0.7)' }}>Sign in &rarr;</Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center bg-surface-base overflow-y-auto" style={{ padding: 'clamp(24px, 4vh, 52px) clamp(24px, 4vw, 48px)' }}>
        <div className="max-w-[400px] w-full mx-auto">
          <Link to="/" className="md:hidden block mb-6" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.08em', background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOLOR</Link>

          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text-primary mb-1">
            {step === 1 ? 'Create your account' : 'What do you create?'}
          </h1>
          <p className="text-[13px] text-text-secondary mb-5">
            {step === 1 ? (
              <>Already have one?{' '}<Link to="/login" className="font-medium" style={{ color: '#6C2EDB' }}>Sign in &rarr;</Link></>
            ) : (
              "We'll tailor the experience to your craft."
            )}
          </p>

          {/* Progress indicator — 2 steps */}
          <div className="flex gap-1.5 mb-6">
            <span className="flex-1 h-[3px] rounded-sm" style={{ background: '#6C2EDB' }} />
            <span className="flex-1 h-[3px] rounded-sm" style={{ background: step >= 2 ? '#6C2EDB' : 'var(--border)' }} />
          </div>

          {/* Errors / Success */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg text-[12px]" style={{ background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.2)', padding: '10px 14px', color: '#DC2626' }} data-testid="signup-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 16 16" className="flex-shrink-0 mt-0.5"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" fill="none" /><path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg text-[12px]" style={{ background: 'rgba(16,185,129,0.06)', border: '0.5px solid rgba(16,185,129,0.2)', padding: '10px 14px', color: '#059669' }} data-testid="signup-success">
              <CheckCircle weight="fill" className="w-4 h-4 flex-shrink-0" />{success}
            </div>
          )}

          {/* ═══ Step 1: Account details ═══ */}
          {step === 1 && (
            <>
              {/* Google */}
              <button className="w-full flex items-center justify-center gap-2.5 rounded-[10px] border border-light-200 bg-surface-base hover:bg-surface-background transition-colors duration-fast" style={{ height: 46 }} data-testid="google-sso">
                <GoogleIcon />
                <span className="text-[13px] font-medium text-text-primary">Continue with Google</span>
              </button>
              <div className="flex items-center gap-3 my-4">
                <span className="flex-1 h-px bg-light-200" />
                <span className="text-[11px] font-medium text-text-tertiary">or use your email</span>
                <span className="flex-1 h-px bg-light-200" />
              </div>

              <form onSubmit={handleNextStep}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="signup-fn" className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-[5px]">First name *</label>
                    <input id="signup-fn" type="text" name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full rounded-[10px] border border-light-200 bg-surface-base text-[13px] text-text-primary placeholder:text-text-tertiary outline-none transition-all duration-fast focus:border-[#6C2EDB] focus:shadow-[0_0_0_3px_rgba(108,46,219,0.10)]" style={{ height: 46, padding: '0 14px' }} data-testid="signup-firstname" />
                  </div>
                  <div>
                    <label htmlFor="signup-ln" className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-[5px]">Last name *</label>
                    <input id="signup-ln" type="text" name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full rounded-[10px] border border-light-200 bg-surface-base text-[13px] text-text-primary placeholder:text-text-tertiary outline-none transition-all duration-fast focus:border-[#6C2EDB] focus:shadow-[0_0_0_3px_rgba(108,46,219,0.10)]" style={{ height: 46, padding: '0 14px' }} data-testid="signup-lastname" />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="signup-email" className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-[5px]">Email address *</label>
                  <input id="signup-email" type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full rounded-[10px] border border-light-200 bg-surface-base text-[13px] text-text-primary placeholder:text-text-tertiary outline-none transition-all duration-fast focus:border-[#6C2EDB] focus:shadow-[0_0_0_3px_rgba(108,46,219,0.10)]" style={{ height: 46, padding: '0 14px' }} data-testid="signup-email" />
                </div>

                <div className="mb-1">
                  <label htmlFor="signup-pw" className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-[5px]">Password *</label>
                  <div className="relative">
                    <input id="signup-pw" type={showPw ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full rounded-[10px] border border-light-200 bg-surface-base text-[13px] text-text-primary placeholder:text-text-tertiary outline-none transition-all duration-fast focus:border-[#6C2EDB] focus:shadow-[0_0_0_3px_rgba(108,46,219,0.10)]" style={{ height: 46, padding: '0 42px 0 14px' }} data-testid="signup-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"><EyeIcon open={showPw} /></button>
                  </div>
                </div>

                {/* Strength indicator */}
                {formData.password.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5 mb-3">
                    {[1, 2, 3].map(i => (
                      <span key={i} className="flex-1 h-[3px] rounded-sm transition-all duration-200" style={{ background: i <= pwStrength ? strengthColor : 'var(--border)' }} />
                    ))}
                    <span className="text-[10px] font-semibold ml-1" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}

                <button type="submit" className="w-full rounded-[10px] text-white text-sm font-bold tracking-[0.01em] transition-all duration-fast active:scale-[0.97] mt-4" style={{ height: 46, background: '#6C2EDB', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = '#5522B8')} onMouseLeave={e => (e.currentTarget.style.background = '#6C2EDB')} data-testid="signup-next-step">
                  Continue &rarr;
                </button>
              </form>
            </>
          )}

          {/* ═══ Step 2: Industry selection ═══ */}
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => { setStep(1); setError('') }}
                className="flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-text-primary transition-colors mb-5"
                data-testid="signup-back-step"
              >
                <ArrowLeft weight="bold" className="w-3 h-3" /> Back to account details
              </button>

              <div className="flex flex-col gap-3 mb-6">
                {INDUSTRY_CARDS.map(card => {
                  const selected = industry === card.value
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => setIndustry(card.value)}
                      className="flex items-center gap-3.5 text-left rounded-xl transition-all duration-150"
                      style={{
                        padding: 16,
                        background: selected ? card.selectedBg : 'var(--surface-background)',
                        border: selected ? `1.5px solid ${card.selectedBorder}` : '0.5px solid var(--border)',
                        cursor: 'pointer',
                        minHeight: 44,
                      }}
                      data-testid={`industry-card-${card.value}`}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: selected ? `${card.selectedBorder}15` : 'rgba(108,46,219,0.06)',
                        }}
                      >
                        <card.Icon
                          weight="duotone"
                          className="w-[18px] h-[18px]"
                          style={{ color: selected ? card.selectedBorder : 'var(--text-secondary)' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{card.label}</span>
                        <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{card.sub}</span>
                      </div>
                      {selected && (
                        <CheckCircle weight="fill" className="w-5 h-5 flex-shrink-0" style={{ color: card.selectedBorder }} />
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!industry || loading}
                className="w-full rounded-[10px] text-white text-sm font-bold tracking-[0.01em] transition-all duration-fast active:scale-[0.97]"
                style={{
                  height: 46,
                  background: !industry ? 'rgba(108,46,219,0.4)' : loading ? 'rgba(108,46,219,0.7)' : '#6C2EDB',
                  cursor: !industry || loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (industry && !loading) e.currentTarget.style.background = '#5522B8' }}
                onMouseLeave={e => { if (industry && !loading) e.currentTarget.style.background = '#6C2EDB' }}
                data-testid="signup-submit"
              >
                {loading ? <span className="inline-flex items-center gap-2"><SpinnerGap className="w-4 h-4 animate-spin" />Creating account...</span> : 'Create free account \u2192'}
              </button>
            </>
          )}

          <p className="text-center text-[11px] text-text-secondary mt-3.5" data-testid="signup-legal-agreement">
            By creating an account you agree to our{' '}
            <Link to="/terms" style={{ color: '#6C2EDB' }}>Terms of Service</Link> and{' '}
            <Link to="/privacy" style={{ color: '#6C2EDB' }}>Privacy Policy</Link>
          </p>

          {/* Trust */}
          <div className="flex items-center justify-center gap-4 mt-5">
            {[
              { icon: <LockIcon />, label: 'Secure signup' },
              { icon: <ShieldIcon />, label: '256-bit SSL' },
              { icon: <CheckCircleIcon />, label: 'No spam, ever' },
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

export default Signup
