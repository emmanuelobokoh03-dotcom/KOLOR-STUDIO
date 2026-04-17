import { useState } from 'react'
import { X, Envelope, ArrowRight, CheckCircle, SpinnerGap, Eye } from '@phosphor-icons/react'
import { authApi } from '../services/api'

interface AHAModalProps {
  userFirstName: string
  userEmail: string
  userIndustry?: string | null
  onDismiss: () => void
}

type ModalState = 'idle' | 'sending' | 'sent' | 'error'

const INDUSTRY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'quote',
  DESIGN: 'proposal',
  GRAPHIC_DESIGN: 'proposal',
  FINE_ART: 'quote',
}

export default function AHAModal({ userFirstName, userEmail, userIndustry, onDismiss }: AHAModalProps) {
  const [state, setState] = useState<ModalState>('idle')
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null)
  const [studioName, setStudioName] = useState<string>('')
  const quoteTerm = INDUSTRY_LABELS[userIndustry || 'PHOTOGRAPHY'] || 'quote'

  const handleSend = async () => {
    setState('sending')
    try {
      const result = await authApi.sendSampleQuote()
      if (result.data) {
        setQuoteUrl(result.data.quoteUrl)
        setStudioName(result.data.studioName || `${userFirstName}'s Studio`)
        setState('sent')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  const sampleItems = userIndustry === 'FINE_ART'
    ? [
        { desc: 'Original oil on canvas (60\u00d780cm)', amt: '$1,800' },
        { desc: 'Certificate of authenticity', amt: '$75' },
        { desc: 'Secure delivery', amt: '$120' },
      ]
    : userIndustry === 'DESIGN' || userIndustry === 'GRAPHIC_DESIGN'
    ? [
        { desc: 'Brand identity \u2014 logo, colour, type', amt: '$1,400' },
        { desc: 'Brand guidelines document', amt: '$350' },
        { desc: '3 rounds of revision', amt: '$0' },
      ]
    : [
        { desc: 'Full-day coverage (8 hours)', amt: '$1,600' },
        { desc: 'Edited gallery (200 images)', amt: '$300' },
        { desc: 'Online gallery delivery', amt: '$80' },
      ]

  const projectLabel = userIndustry === 'FINE_ART' ? 'Portrait commission' : userIndustry === 'DESIGN' || userIndustry === 'GRAPHIC_DESIGN' ? 'Brand identity' : 'Wedding photography'

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      data-testid="aha-modal-overlay"
    >
      <div
        className="relative w-full sm:max-w-md bg-surface-base rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: '0.5px solid var(--border)' }}
        data-testid="aha-modal"
      >
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-light-100 transition z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Skip this step"
          data-testid="aha-modal-close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          {state === 'idle' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-5">
                <Eye weight="duotone" className="w-6 h-6 text-brand-primary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2" style={{ letterSpacing: '-0.02em' }}>
                See what your client sees
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                KOLOR will send a sample {quoteTerm} to <span className="font-medium text-text-primary">{userEmail}</span> — so you can see exactly what your clients experience when you send a {quoteTerm}. Takes 30 seconds.
              </p>

              <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(108,46,219,0.05)', border: '1px solid rgba(108,46,219,0.15)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand-primary mb-3">
                  {quoteTerm} preview — {projectLabel}
                </p>
                {sampleItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 text-xs" style={{ borderBottom: i < sampleItems.length - 1 ? '1px solid rgba(108,46,219,0.1)' : 'none' }}>
                    <span className="text-text-secondary">{item.desc}</span>
                    <span className="font-semibold text-text-primary tabular-nums">{item.amt}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSend}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition-colors min-h-[44px]"
                style={{ background: '#6C2EDB' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#5522B8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#6C2EDB')}
                data-testid="aha-send-btn"
              >
                <Envelope weight="duotone" className="w-4 h-4" />
                Send sample {quoteTerm} to my inbox
              </button>
              <button onClick={onDismiss} className="w-full text-center text-xs text-text-tertiary hover:text-text-secondary transition mt-3 py-2" data-testid="aha-skip-btn">
                Skip for now — I'll explore on my own
              </button>
            </>
          )}

          {state === 'sending' && (
            <div className="py-8 text-center">
              <SpinnerGap className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-text-primary">Sending your sample {quoteTerm}\u2026</p>
              <p className="text-xs text-text-secondary mt-1">This takes about 5 seconds</p>
            </div>
          )}

          {state === 'sent' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                <CheckCircle weight="duotone" className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2" style={{ letterSpacing: '-0.02em' }}>
                Check your inbox
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                A {quoteTerm} from <span className="font-medium text-text-primary">{studioName}</span> just landed at <span className="font-medium text-text-primary">{userEmail}</span>. Open it and approve it — see the whole experience your clients go through.
              </p>
              {quoteUrl && (
                <a
                  href={quoteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition-colors min-h-[44px] mb-3"
                  style={{ background: '#6C2EDB' }}
                  data-testid="aha-view-quote-btn"
                >
                  <ArrowRight weight="bold" className="w-4 h-4" />
                  Preview the {quoteTerm} now
                </a>
              )}
              <button onClick={onDismiss} className="w-full text-center text-xs text-text-tertiary hover:text-text-secondary transition py-2" data-testid="aha-done-btn">
                Got it — start building my studio
              </button>
            </>
          )}

          {state === 'error' && (
            <>
              <h2 className="text-lg font-bold text-text-primary mb-2">Something went wrong</h2>
              <p className="text-sm text-text-secondary mb-5">
                We couldn't send the sample {quoteTerm}. You can try again or skip this step.
              </p>
              <button onClick={handleSend} className="w-full py-3 rounded-xl font-semibold text-sm bg-brand-primary text-white transition min-h-[44px] mb-2" data-testid="aha-retry-btn">
                Try again
              </button>
              <button onClick={onDismiss} className="w-full text-center text-xs text-text-tertiary hover:text-text-secondary transition py-2">Skip</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
