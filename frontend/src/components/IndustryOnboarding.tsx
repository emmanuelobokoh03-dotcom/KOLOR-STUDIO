import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IndustryType, authApi } from '../services/api'
import {
  Camera,
  PenNib,
  Palette,
  SpinnerGap,
  CheckCircle,
  ArrowRight,
  Sparkle
} from '@phosphor-icons/react'

const INDUSTRY_CONFIG: { type: string; label: string; icon: React.ElementType; gradient: string; desc: string; examples: string }[] = [
  {
    type: 'PHOTOGRAPHY',
    label: 'Photography',
    icon: Camera,
    gradient: 'from-brand-primary to-brand-primary-dark',
    desc: 'Portraits, weddings, events, commercial',
    examples: 'e.g. portrait, wedding, commercial, editorial'
  },
  {
    type: 'GRAPHIC_DESIGN',
    label: 'Design',
    icon: PenNib,
    gradient: 'from-pink-600 to-rose-700',
    desc: 'Logos, branding, web design, illustration',
    examples: 'e.g. graphic design, UX/UI, illustration, branding'
  },
  {
    type: 'FINE_ART',
    label: 'Fine Art',
    icon: Palette,
    gradient: 'from-emerald-600 to-green-700',
    desc: 'Paintings, sculpture, mixed media, commissions',
    examples: 'e.g. oil painting, sculpture, watercolour, printmaking'
  },
]

export default function IndustryOnboarding() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [error, setError] = useState('')

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)
    setError('')

    try {
      const API_URL = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_URL}/api/auth/onboarding`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryIndustry: selected }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong')
        setLoading(false)
        return
      }

      // Show success state
      setTemplateName(data.templates?.[0]?.name || `${INDUSTRY_CONFIG.find(c => c.type === selected)?.label ?? selected} Workflow`)
      setDone(true)
      setLoading(false)

      // Redirect after celebration
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch {
      setError('Failed to complete setup')
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  // Success screen
  if (done) {
    return (
      <div className="min-h-screen bg-light-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto animate-fadeIn">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/30">
            <CheckCircle weight="duotone" className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">You're all set!</h1>
          <p className="text-lg text-text-secondary mb-2">
            Your <span className="text-purple-600 font-semibold">{INDUSTRY_CONFIG.find(c => c.type === selected)?.label ?? selected}</span> workspace is ready
          </p>
          <p className="text-sm text-text-tertiary mb-6">
            We've created your "<span className="text-purple-600">{templateName}</span>" workflow template
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary">
            <SpinnerGap className="w-4 h-4 animate-spin" />
            Taking you to your dashboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-50 flex flex-col" data-testid="industry-onboarding">
      {/* Header */}
      <div className="text-center pt-16 pb-8 px-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkle className="w-6 h-6 text-purple-600" />
          <span className="text-sm font-medium text-purple-600 tracking-wider uppercase">Welcome to Kolor Studio</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
          What type of creative are you?
        </h1>
        <p className="text-lg text-text-secondary max-w-xl mx-auto">
          We'll set up your workspace with industry-specific workflows, so you can start managing clients right away.
        </p>
      </div>

      {/* Industry Grid */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="industry-grid">
          {INDUSTRY_CONFIG.map(({ type, label, icon: Icon, gradient, desc, examples }) => {
            const isSelected = selected === type
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                data-testid={`industry-${type.toLowerCase().replace('_', '-')}`}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${
                  isSelected
                    ? 'border-brand-primary bg-purple-50 scale-[1.02] shadow-lg shadow-brand-primary-dark/20'
                    : 'border-light-200 bg-surface-base hover:border-gray-600 hover:bg-light-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 ${
                  isSelected ? 'shadow-md' : 'opacity-70 group-hover:opacity-100'
                } transition`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-purple-700' : 'text-text-secondary'}`}>
                  {label}
                </div>
                <div className="text-xs text-text-tertiary leading-relaxed">{desc}</div>
                <div className="text-[11px] text-text-tertiary mt-1 italic">{examples}</div>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-light-200 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-text-tertiary hover:text-text-secondary transition"
            data-testid="onboarding-skip"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            disabled={!selected || loading}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all ${
              selected
                ? 'bg-brand-primary hover:bg-brand-primary shadow-lg shadow-purple-200'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
            data-testid="onboarding-continue"
          >
            {loading ? (
              <><SpinnerGap className="w-5 h-5 animate-spin" /> Setting up...</>
            ) : (
              <>Continue <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
