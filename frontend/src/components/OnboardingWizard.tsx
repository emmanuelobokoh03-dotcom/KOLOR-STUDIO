import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Sparkles, UserPlus, FileText, Palette, CheckCircle, SkipForward } from 'lucide-react'

interface WizardStep {
  id: string
  title: string
  description: string
  icon: typeof Sparkles
  tip: string
  tourElement?: string // data-tour selector to highlight after wizard closes
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to KOLOR STUDIO',
    description: 'Your creative business command center. This quick setup will show you how to get your first client through the door in under 5 minutes.',
    icon: Sparkles,
    tip: 'KOLOR STUDIO automates quotes, contracts, payments, and follow-ups — so you can focus on creating.',
  },
  {
    id: 'add-lead',
    title: 'Add Your First Client',
    description: 'Every project starts with a lead. Click the "+ New Lead" button in the top right to add a client, or share your inquiry form link and let them come to you.',
    icon: UserPlus,
    tip: 'Pro tip: Share your public inquiry form link on social media, your website, or in your email signature!',
    tourElement: '[data-tour="add-lead"]',
  },
  {
    id: 'send-quote',
    title: 'Send a Quote',
    description: 'Open any lead card and click "Create Quote" to build a professional proposal. Set your line items, tax, and payment terms — then send it with one click.',
    icon: FileText,
    tip: 'Autopilot kicks in here: when your client accepts a quote, KOLOR automatically generates a contract and sends it for signing.',
    tourElement: '[data-tour="kanban-board"]',
  },
  {
    id: 'brand',
    title: 'Customize Your Brand',
    description: 'Head to Settings to set your brand colors, logo, and font. These appear on your client portal, quotes, and all emails.',
    icon: Palette,
    tip: 'Clients see your brand colors in their portal — make it match your studio identity!',
    tourElement: '[data-tour="settings-reviews"]',
  },
  {
    id: 'done',
    title: "You're All Set!",
    description: "That's it — you're ready to run your creative business on autopilot. New leads come in, quotes go out, contracts get signed, and payments arrive.",
    icon: CheckCircle,
    tip: 'Need this walkthrough again? Find it in Settings under "Restart Tutorial".',
  },
]

const STORAGE_KEY = 'kolor_onboarding_wizard_complete'

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const currentStep = WIZARD_STEPS[step]
  const Icon = currentStep.icon
  const isLast = step === WIZARD_STEPS.length - 1
  const isFirst = step === 0
  const progress = ((step + 1) / WIZARD_STEPS.length) * 100

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsVisible(false)
    setTimeout(onComplete, 300)
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" data-testid="onboarding-wizard">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#1A1A1A] rounded-2xl border border-[#333] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Progress bar */}
        <div className="h-1 bg-[#333]">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Step {step + 1} of {WIZARD_STEPS.length}
          </span>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            data-testid="wizard-skip-btn"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Icon className="w-7 h-7 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white leading-tight" data-testid="wizard-step-title">
              {currentStep.title}
            </h2>
          </div>

          <p className="text-gray-300 text-[15px] leading-relaxed mb-5">
            {currentStep.description}
          </p>

          {/* Tip box */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <p className="text-sm text-purple-300 leading-relaxed">
              {currentStep.tip}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={isFirst}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            data-testid="wizard-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {isLast ? (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20"
              data-testid="wizard-get-started-btn"
            >
              <CheckCircle className="w-4 h-4" />
              Get Started!
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20"
              data-testid="wizard-next-btn"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pb-5">
          {WIZARD_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-purple-500' : i < step ? 'bg-purple-500/50' : 'bg-[#444]'
              }`}
              data-testid={`wizard-dot-${i}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function useOnboardingWizard(leadsCount: number) {
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    const complete = localStorage.getItem(STORAGE_KEY) === 'true'
    // Show wizard for new users (0 leads, never completed wizard)
    if (!complete && leadsCount === 0) {
      // Slight delay to let the dashboard render first
      const timer = setTimeout(() => setShowWizard(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [leadsCount])

  return {
    showWizard,
    setShowWizard,
    resetWizard: () => {
      localStorage.removeItem(STORAGE_KEY)
      setShowWizard(true)
    },
  }
}
