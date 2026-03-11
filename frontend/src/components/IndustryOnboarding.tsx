import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IndustryType, INDUSTRY_TYPE_LABELS, authApi } from '../services/api'
import {
  Camera,
  FilmStrip,
  PenNib,
  Globe,
  PaintBrush,
  Palette,
  Scissors,
  Megaphone,
  FileImage,
  Stack,
  SpinnerGap,
  CheckCircle,
  ArrowRight,
  Sparkle
} from '@phosphor-icons/react'

const INDUSTRY_CONFIG: { type: IndustryType; icon: React.ElementType; gradient: string; desc: string }[] = [
  { type: 'PHOTOGRAPHY', icon: Camera, gradient: 'from-brand-primary to-brand-primary-dark', desc: 'Portraits, weddings, events, commercial' },
  { type: 'VIDEOGRAPHY', icon: FilmStrip, gradient: 'from-blue-600 to-indigo-700', desc: 'Films, events, brand content, reels' },
  { type: 'GRAPHIC_DESIGN', icon: PenNib, gradient: 'from-pink-600 to-rose-700', desc: 'Logos, branding, print, digital design' },
  { type: 'WEB_DESIGN', icon: Globe, gradient: 'from-cyan-600 to-teal-700', desc: 'Websites, apps, UX/UI, digital products' },
  { type: 'ILLUSTRATION', icon: PaintBrush, gradient: 'from-amber-600 to-orange-700', desc: 'Book covers, editorial, character design' },
  { type: 'FINE_ART', icon: Palette, gradient: 'from-emerald-600 to-green-700', desc: 'Paintings, portraits, mixed media' },
  { type: 'SCULPTURE', icon: Scissors, gradient: 'from-stone-600 to-stone-700', desc: 'Sculptures, installations, 3D work' },
  { type: 'BRANDING', icon: Megaphone, gradient: 'from-brand-accent to-pink-700', desc: 'Brand strategy, identity, campaigns' },
  { type: 'CONTENT_CREATION', icon: FileImage, gradient: 'from-sky-600 to-blue-700', desc: 'Social media, blogs, podcasts' },
  { type: 'OTHER', icon: Stack, gradient: 'from-gray-600 to-gray-700', desc: 'Other creative disciplines' },
]

export default function IndustryOnboarding() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<IndustryType | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [error, setError] = useState('')

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_URL}/api/auth/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ primaryIndustry: selected }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong')
        setLoading(false)
        return
      }

      // Show success state
      setTemplateName(data.templates?.[0]?.name || `${INDUSTRY_TYPE_LABELS[selected]} Workflow`)
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
          <h1 className="text-3xl font-bold text-white mb-3">You're all set!</h1>
          <p className="text-lg text-text-secondary mb-2">
            Your <span className="text-white font-semibold">{INDUSTRY_TYPE_LABELS[selected!]}</span> workspace is ready
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
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          What type of creative are you?
        </h1>
        <p className="text-lg text-text-secondary max-w-xl mx-auto">
          We'll set up your workspace with industry-specific workflows, so you can start managing clients right away.
        </p>
      </div>

      {/* Industry Grid */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="industry-grid">
          {INDUSTRY_CONFIG.map(({ type, icon: Icon, gradient, desc }) => {
            const isSelected = selected === type
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                data-testid={`industry-${type.toLowerCase().replace('_', '-')}`}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${
                  isSelected
                    ? 'border-brand-primary bg-purple-50 scale-[1.02] shadow-lg shadow-brand-primary-dark/20'
                    : 'border-light-200 bg-white hover:border-gray-600 hover:bg-light-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 ${
                  isSelected ? 'shadow-md' : 'opacity-70 group-hover:opacity-100'
                } transition`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
                  {INDUSTRY_TYPE_LABELS[type]}
                </div>
                <div className="text-xs text-text-tertiary leading-relaxed">{desc}</div>
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
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-400 text-center">
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
