import { useState } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'
import {
  X,
  Bug,
  Lightbulb,
  ChatText,
  PaperPlaneTilt,
  SpinnerGap,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react'

interface FeedbackModalProps {
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'general' | 'other';

const FEEDBACK_TYPES: { type: FeedbackType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'bug', label: 'Bug Report', icon: Bug, color: 'red' },
  { type: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'violet' },
  { type: 'general', label: 'General Feedback', icon: ChatText, color: 'blue' },
  { type: 'other', label: 'Other', icon: WarningCircle, color: 'gray' },
]

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!description.trim()) {
      setError('Please describe your feedback')
      return
    }

    setSending(true)

    // Simulate sending (in production, this would call an API)
    // For now, we'll compose an email
    try {
      const subject = encodeURIComponent(`[${feedbackType.toUpperCase()}] ${title}`)
      const body = encodeURIComponent(
        `Type: ${feedbackType}\n\n` +
        `Description:\n${description}\n\n` +
        `Contact Email: ${email || 'Not provided'}\n\n` +
        `Browser: ${navigator.userAgent}\n` +
        `URL: ${window.location.href}`
      )
      
      // Open mailto link
      window.open(`mailto:hello@kolorstudio.com?subject=${subject}&body=${body}`, '_blank')
      
      setSending(false)
      setSuccess(true)
    } catch (err) {
      setSending(false)
      setError('Failed to submit feedback. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="bg-surface-base rounded-2xl shadow-2xl w-full max-w-md border border-light-200 p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-700/30">
            <CheckCircle weight="duotone" className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Thank You!</h3>
          <p className="text-text-secondary mb-6">
            Thanks! We read every piece of feedback and will respond within 24 hours.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose} role="presentation">
      <div 
        className="bg-surface-base rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-light-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="feedback-title" className="text-xl font-bold">Send Feedback</h2>
              <p className="text-purple-600 text-sm mt-1">Help us improve KOLOR STUDIO</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Close feedback form" title="Close (Esc)"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-400">
              <WarningCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Feedback Type */}
          <div>
            <label className="text-sm text-text-secondary mb-2 block">What type of feedback?</label>
            <div className="flex gap-2">
              {FEEDBACK_TYPES.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedbackType(type)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border transition ${
                    feedbackType === type
                      ? `bg-${color}-900/30 border-${color}-600 text-${color}-400`
                      : 'bg-light-100 border-light-200 text-text-secondary hover:border-gray-600'
                  }`}
                  data-testid={`feedback-type-${type}`}
                  style={{
                    backgroundColor: feedbackType === type ? `rgb(var(--color-${color}-900) / 0.3)` : undefined,
                    borderColor: feedbackType === type ? `rgb(var(--color-${color}-600))` : undefined,
                  }}
                >
                  <Icon className={`w-5 h-5 ${feedbackType === type ? `text-${color}-400` : ''}`} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-light-100 border border-light-200 rounded-lg text-text-primary placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={
                feedbackType === 'bug' 
                  ? "Brief description of the bug" 
                  : feedbackType === 'feature'
                  ? "What feature would you like?"
                  : "What's on your mind?"
              }
              data-testid="feedback-title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-light-100 border border-light-200 rounded-lg text-text-primary placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder={
                feedbackType === 'bug'
                  ? "Please describe what happened, what you expected, and steps to reproduce..."
                  : feedbackType === 'feature'
                  ? "Describe the feature and how it would help you..."
                  : "Share your thoughts with us..."
              }
              data-testid="feedback-description"
            />
          </div>

          {/* Contact Email (optional) */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">
              Your Email <span className="text-gray-600">(optional, for follow-up)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-light-100 border border-light-200 rounded-lg text-text-primary placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="you@example.com"
              data-testid="feedback-email"
            />
          </div>

          {/* Tips based on feedback type */}
          {feedbackType === 'bug' && (
            <div className="bg-light-100 rounded-lg p-4 border border-light-200">
              <p className="text-xs text-text-secondary mb-2 font-medium">Tips for a helpful bug report:</p>
              <ul className="text-xs text-text-tertiary space-y-1">
                <li>• Describe what you were doing when the bug occurred</li>
                <li>• What did you expect to happen?</li>
                <li>• What actually happened?</li>
                <li>• Can you reproduce it consistently?</li>
              </ul>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-light-200 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:bg-light-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition font-medium disabled:opacity-50"
            data-testid="submit-feedback-btn"
          >
            {sending ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <PaperPlaneTilt weight="bold" className="w-4 h-4" />}
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  )
}
