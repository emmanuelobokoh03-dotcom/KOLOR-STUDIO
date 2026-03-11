import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from '@phosphor-icons/react'

interface SmartSuggestionProps {
  leadCount: number
  hasQuotes: boolean
  hasPortfolio: boolean
  hasContracts: boolean
  hasStudioName: boolean
  onAction: (action: string) => void
}

interface Suggestion {
  id: string
  condition: boolean
  emoji: string
  title: string
  message: string
  cta: string
  action: string
  gradient: string
}

export function SmartSuggestion({
  leadCount, hasQuotes, hasPortfolio, hasContracts, hasStudioName, onAction
}: SmartSuggestionProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    const d = new Set<string>()
    const keys = ['first-project', 'send-quote', 'portfolio-upload', 'first-contract', 'complete-profile']
    keys.forEach(k => { if (localStorage.getItem(`suggestion_${k}_dismissed`) === 'true') d.add(k) })
    return d
  })

  const suggestions: Suggestion[] = useMemo(() => [
    {
      id: 'first-project',
      condition: leadCount === 0,
      emoji: '\u{1F3A8}',
      title: 'Create Your First Project',
      message: 'Start by adding a client project. This is the foundation of everything in KOLOR STUDIO.',
      cta: 'Create Project',
      action: 'open-add-lead',
      gradient: 'from-brand-primary-dark/30 to-brand-primary-dark/30 border-brand-primary-dark/40',
    },
    {
      id: 'send-quote',
      condition: leadCount > 0 && !hasQuotes,
      emoji: '\u{1F4B0}',
      title: 'Ready to Send a Quotes?',
      message: 'You have projects but no quotes yet. Send your first quote to lock in work!',
      cta: 'View Projects',
      action: 'view-kanban',
      gradient: 'from-brand-accent-dark/30 to-pink-900/30 border-brand-accent-dark/40',
    },
    {
      id: 'portfolio-upload',
      condition: leadCount >= 3 && !hasPortfolio,
      emoji: '\u{1F5BC}\u{FE0F}',
      title: 'Showcase Your Work',
      message: "You've got projects rolling! Upload your portfolio to attract more clients.",
      cta: 'Go to Portfolio',
      action: 'view-portfolio',
      gradient: 'from-indigo-900/30 to-blue-900/30 border-indigo-700/40',
    },
    {
      id: 'first-contract',
      condition: leadCount >= 2 && hasQuotes && !hasContracts,
      emoji: '\u{1F4DD}',
      title: 'Protect Yourself with Contracts',
      message: "You're quoting clients \u2014 great! Create contracts to protect you and your clients.",
      cta: 'View Projects',
      action: 'view-kanban',
      gradient: 'from-emerald-900/30 to-teal-900/30 border-emerald-700/40',
    },
    {
      id: 'complete-profile',
      condition: !hasStudioName,
      emoji: '\u{2699}\u{FE0F}',
      title: 'Complete Your Profile',
      message: 'Add your studio name to look professional when sharing your portfolio.',
      cta: 'Edit Settings',
      action: 'open-settings',
      gradient: 'from-amber-900/30 to-orange-900/30 border-amber-700/40',
    },
    {
      id: 'setup-email-signature',
      condition: leadCount >= 1 && localStorage.getItem('suggestion_setup-email-signature_dismissed') !== 'true',
      emoji: '\u{1F4E7}',
      title: 'Set Up Email Signature',
      message: 'Add your portfolio link to every email you send. Free marketing!',
      cta: 'Create Signature',
      action: 'open-brand-settings',
      gradient: 'from-cyan-900/30 to-sky-900/30 border-cyan-700/40',
    },
    {
      id: 'share-portfolio',
      condition: hasPortfolio && localStorage.getItem('suggestion_share-portfolio_dismissed') !== 'true',
      emoji: '\u{1F517}',
      title: 'Share Your Portfolio',
      message: 'You have work uploaded! Share your portfolio link or QR code with potential clients.',
      cta: 'Get Share Link',
      action: 'view-portfolio',
      gradient: 'from-violet-900/30 to-purple-900/30 border-violet-700/40',
    },
  ], [leadCount, hasQuotes, hasPortfolio, hasContracts, hasStudioName])

  const active = suggestions.find(s => s.condition && !dismissed.has(s.id))

  const handleDismiss = (id: string) => {
    localStorage.setItem(`suggestion_${id}_dismissed`, 'true')
    setDismissed(prev => new Set([...prev, id]))
  }

  if (!active) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className={`mb-5 bg-gradient-to-r ${active.gradient} border rounded-xl p-4 md:p-5`}
        data-testid={`suggestion-${active.id}`}
      >
        <div className="flex items-start gap-3 md:gap-4">
          <div className="text-2xl md:text-3xl flex-shrink-0 mt-0.5 select-none">{active.emoji}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-[#FAFAFA] mb-0.5">{active.title}</h4>
            <p className="text-sm text-[#CCCCCC] mb-3">{active.message}</p>
            <button
              onClick={() => onAction(active.action)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition text-sm font-medium"
              data-testid={`suggestion-cta-${active.id}`}
            >
              {active.cta}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => handleDismiss(active.id)}
            className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
            data-testid={`suggestion-dismiss-${active.id}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
