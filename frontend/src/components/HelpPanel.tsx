import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, X, FileText, Calendar, Upload, ScrollText,
  Copy, ChevronDown, Mail,
} from 'lucide-react'

const quickStartItems = [
  {
    icon: FileText,
    title: 'Create Your First Quote',
    description: 'Send professional pricing to clients',
    color: 'text-fuchsia-400 bg-fuchsia-900/30 border-fuchsia-700/30',
  },
  {
    icon: Calendar,
    title: 'Set Up a Booking',
    description: 'Schedule shoots and meetings',
    color: 'text-blue-400 bg-blue-900/30 border-blue-700/30',
  },
  {
    icon: Upload,
    title: 'Upload Portfolio Work',
    description: 'Showcase your best pieces',
    color: 'text-violet-400 bg-violet-900/30 border-violet-700/30',
  },
  {
    icon: ScrollText,
    title: 'Send a Contract',
    description: 'Protect yourself legally',
    color: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/30',
  },
]

const faqs = [
  {
    q: 'How do I share my portfolio?',
    a: 'Go to Portfolio, click "Copy Link", and share it anywhere! Your public portfolio is always up to date.',
  },
  {
    q: 'Can clients upload files?',
    a: 'Yes! Clients can upload files through the Client Portal link you share with them.',
  },
  {
    q: 'How do contracts work?',
    a: 'Create from a template, customize it, hit Send. Your client signs digitally via the portal.',
  },
  {
    q: 'How do I track project progress?',
    a: 'Use the Deliverables tab in any project to list what you\'ll deliver and update status as you go.',
  },
  {
    q: 'Can I customize my pipeline stages?',
    a: 'Your pipeline follows: New, Contacted, Qualified, Quoted, Negotiating, Booked. Drag cards between columns to update.',
  },
]

function FAQ({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#262626] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left group"
        data-testid={`faq-${question.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`}
      >
        <span className="text-sm text-[#CCCCCC] group-hover:text-[#FAFAFA] transition-colors pr-4">
          {question}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[#A3A3A3] pb-3 pl-0 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface HelpPanelProps {
  open: boolean
  onClose: () => void
}

export default function HelpPanel({ open, onClose }: HelpPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            data-testid="help-panel-backdrop"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[70] w-full sm:w-96 bg-[#141414] border-l border-[#333] shadow-2xl flex flex-col"
            data-testid="help-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#262626] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-900/40 border border-violet-700/30 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#FAFAFA]">Need Help?</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-[#262626] flex items-center justify-center transition-colors"
                data-testid="help-panel-close"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Quick Start */}
              <div className="p-5">
                <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-3">Quick Start</h4>
                <div className="space-y-2">
                  {quickStartItems.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A1A] border border-[#262626] hover:border-[#444] transition-colors cursor-default"
                      data-testid={`help-quickstart-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#FAFAFA]">{item.title}</p>
                        <p className="text-xs text-[#A3A3A3]">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="p-5 border-t border-[#262626]">
                <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-3">Common Questions</h4>
                <div>
                  {faqs.map((faq) => (
                    <FAQ key={faq.q} question={faq.q} answer={faq.a} />
                  ))}
                </div>
              </div>

              {/* Pro Tips */}
              <div className="p-5 border-t border-[#262626]">
                <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-3">Pro Tips</h4>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-violet-900/15 border border-violet-800/25">
                    <p className="text-xs text-violet-300 leading-relaxed">
                      <strong>Keyboard shortcut:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-violet-900/40 text-violet-200 text-[10px] font-mono">?</kbd> anywhere to open this panel.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-900/15 border border-emerald-800/25">
                    <p className="text-xs text-emerald-300 leading-relaxed">
                      <strong>Client portal:</strong> Share one link and clients can view quotes, sign contracts, and track progress — no login needed.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-fuchsia-900/15 border border-fuchsia-800/25">
                    <p className="text-xs text-fuchsia-300 leading-relaxed">
                      <strong>Quick add:</strong> Use the "+ Add Lead" button to capture new inquiries on the spot.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#262626] flex-shrink-0">
              <a
                href="mailto:hello@kolorstudio.app"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-[#333] text-[#A3A3A3] hover:text-[#FAFAFA] hover:border-[#444] transition-colors text-sm font-medium"
                data-testid="help-contact-support"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Floating Help Button
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-lg shadow-violet-900/30 hover:shadow-xl hover:shadow-violet-900/40 flex items-center justify-center transition-all duration-200 hover:scale-110 md:bottom-6 md:right-6"
      aria-label="Open help panel"
      data-testid="help-button"
    >
      <HelpCircle className="w-5 h-5" />
    </button>
  )
}
