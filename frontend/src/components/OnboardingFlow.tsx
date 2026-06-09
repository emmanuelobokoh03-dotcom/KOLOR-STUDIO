import { useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { X } from '@phosphor-icons/react/dist/csr/X'
import KolorSpinner from './KolorSpinner'
import { authApi, leadsApi } from '../services/api'
import { getIndustryLanguage, IndustryType } from '../utils/industryLanguage'

const INDUSTRIES = [
  { value: 'PHOTOGRAPHY', label: 'Photography', desc: 'Shoot bookings, contracts, client portals' },
  { value: 'DESIGN', label: 'Design', desc: 'Scope agreements, milestone billing, projects' },
  { value: 'FINE_ART', label: 'Fine Art', desc: 'Commission management, collector portals' },
] as const

interface OnboardingFlowProps {
  userFirstName: string
  userEmail: string
  userIndustry?: string | null
  onComplete: () => void
}

type Step = 'welcome' | 'client' | 'offer' | 'done'
type SendState = 'idle' | 'sending' | 'sent' | 'error'

export default function OnboardingFlow({
  userFirstName, userEmail, userIndustry, onComplete
}: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(userIndustry ? 'client' : 'welcome')
  const [industry, setIndustry] = useState<string>(userIndustry || '')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [sendState, setSendState] = useState<SendState>('idle')
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null)
  const [savingClient, setSavingClient] = useState(false)

  const lang = getIndustryLanguage((industry || 'PHOTOGRAPHY') as IndustryType)
  const totalSteps = 4
  const stepIndex = { welcome: 1, client: 2, offer: 3, done: 4 }[step]

  const handleIndustrySelect = async (value: string) => {
    setIndustry(value)
    try { await authApi.onboarding(value) } catch { /* non-blocking */ }
    setTimeout(() => setStep('client'), 300)
  }

  const handleClientSave = async () => {
    if (!clientName.trim()) { setStep('offer'); return }
    setSavingClient(true)
    try {
      await leadsApi.create({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        serviceType: 'OTHER' as any,
        projectTitle: 'First project',
        description: '',
        industry: (industry || 'PHOTOGRAPHY') as any,
      })
    } catch { /* non-blocking */ }
    setSavingClient(false)
    setStep('offer')
  }

  const handleSendOffer = async () => {
    setSendState('sending')
    try {
      const result = await authApi.sendSampleQuote()
      if (result.data) {
        setQuoteUrl(result.data.quoteUrl)
        setSendState('sent')
        localStorage.setItem('kolor_aha_completed', 'true')
      } else {
        setSendState('error')
      }
    } catch {
      setSendState('error')
    }
  }

  const handleComplete = () => {
    localStorage.setItem('kolor_aha_completed', 'true')
    onComplete()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      data-testid="onboarding-flow"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--surface-base)',
          border: '0.5px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.24)',
          maxHeight: '90vh',
        }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i < stepIndex ? '20px' : '6px',
                    height: '4px',
                    borderRadius: '2px',
                    background: i < stepIndex ? '#6C2EDB' : 'var(--border)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}>
              Step {stepIndex} of {totalSteps}
            </p>
          </div>
          <button
            onClick={handleComplete}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-background)] transition-colors"
            aria-label="Skip onboarding"
            data-testid="onboarding-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {step === 'welcome' && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Welcome, {userFirstName}.
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6" style={{ lineHeight: 1.6 }}>
                What kind of creative work do you do? KOLOR adapts its language and workflows to your practice.
              </p>
              <div className="flex flex-col gap-3">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind.value}
                    onClick={() => handleIndustrySelect(ind.value)}
                    className="w-full text-left p-4 rounded-xl border transition-all duration-150"
                    style={{
                      border: industry === ind.value ? '1.5px solid #6C2EDB' : '0.5px solid var(--border)',
                      background: industry === ind.value ? '#EDE9FE' : 'var(--surface-background)',
                    }}
                    data-testid={`industry-${ind.value}`}
                  >
                    <div className="text-sm font-semibold text-text-primary mb-0.5">{ind.label}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{ind.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'client' && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Add your first {lang.client.toLowerCase()}.
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6" style={{ lineHeight: 1.6 }}>
                Anyone you&apos;re currently working with or in conversation with. You can add more later.
              </p>
              <div className="flex flex-col gap-3 mb-6">
                <div>
                  <label className="text-xs font-medium text-text-primary block mb-1.5">
                    Name <span className="text-[var(--text-tertiary)]">(required)</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder={`${lang.client} name`}
                    className="w-full rounded-lg border text-sm text-text-primary placeholder:text-[var(--text-tertiary)] outline-none transition-all"
                    style={{
                      border: '0.5px solid var(--border)',
                      background: 'var(--surface-background)',
                      height: 42,
                      padding: '0 12px',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6C2EDB'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    autoFocus
                    data-testid="onboarding-client-name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-primary block mb-1.5">
                    Email <span className="text-[var(--text-tertiary)]">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="their@email.com"
                    className="w-full rounded-lg border text-sm text-text-primary placeholder:text-[var(--text-tertiary)] outline-none transition-all"
                    style={{
                      border: '0.5px solid var(--border)',
                      background: 'var(--surface-background)',
                      height: 42,
                      padding: '0 12px',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6C2EDB'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    onKeyDown={e => e.key === 'Enter' && handleClientSave()}
                    data-testid="onboarding-client-email"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleClientSave}
                  disabled={savingClient || !clientName.trim()}
                  className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: clientName.trim() ? '#6C2EDB' : 'var(--border)' }}
                  data-testid="onboarding-client-save"
                >
                  {savingClient ? <KolorSpinner size={16} /> : (
                    <>Add {lang.client.toLowerCase()} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <button
                  onClick={() => setStep('offer')}
                  className="w-full h-9 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  data-testid="onboarding-client-skip"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 'offer' && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                See what your {lang.client.toLowerCase()} sees.
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6" style={{ lineHeight: 1.6 }}>
                We&apos;ll send a sample {lang.quote.toLowerCase()} to <strong>{userEmail}</strong> so you can see exactly what your clients receive when you send an offer.
              </p>

              {sendState === 'idle' && (
                <>
                  <button
                    onClick={handleSendOffer}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: '#6C2EDB' }}
                    data-testid="onboarding-send-sample"
                  >
                    Send sample {lang.quote.toLowerCase()} to me
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStep('done')}
                    className="w-full h-9 mt-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Skip for now
                  </button>
                </>
              )}

              {sendState === 'sending' && (
                <div className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]"
                  style={{ background: 'var(--surface-background)', border: '0.5px solid var(--border)' }}>
                  <KolorSpinner size={16} />
                  Sending...
                </div>
              )}

              {sendState === 'sent' && (
                <div className="space-y-4">
                  <div className="rounded-xl p-4 flex items-start gap-3"
                    style={{ background: '#F0FDF4', border: '0.5px solid #BBF7D0' }}>
                    <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800 mb-0.5">Sent to {userEmail}</p>
                      <p className="text-xs text-green-700" style={{ lineHeight: 1.5 }}>
                        Check your inbox. That&apos;s exactly what your client receives when you send an offer.
                      </p>
                    </div>
                  </div>
                  {quoteUrl && (
                    <a
                      href={quoteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all"
                      style={{
                        border: '0.5px solid var(--border)',
                        color: 'var(--text-secondary)',
                        background: 'var(--surface-background)',
                      }}
                      data-testid="onboarding-preview-quote"
                    >
                      Preview the {lang.quote.toLowerCase()} &rarr;
                    </a>
                  )}
                  <button
                    onClick={() => setStep('done')}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: '#6C2EDB' }}
                    data-testid="onboarding-continue"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {sendState === 'error' && (
                <div className="space-y-3">
                  <p className="text-sm text-red-600">
                    Could not send the sample. You can try again or skip this step.
                  </p>
                  <button
                    onClick={handleSendOffer}
                    className="w-full h-10 rounded-xl text-sm font-medium text-[var(--text-secondary)] transition-all"
                    style={{ border: '0.5px solid var(--border)', background: 'var(--surface-background)' }}
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => setStep('done')}
                    className="w-full h-9 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  >
                    Skip this step
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#EDE9FE' }}
              >
                <CheckCircle weight="fill" className="w-8 h-8" style={{ color: '#6C2EDB' }} />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Your studio is ready.
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-8" style={{ lineHeight: 1.65 }}>
                Add clients, send offers, collect deposits, and manage your practice &mdash;
                all in one place. Everything you do from here builds your client journey.
              </p>
              <button
                onClick={handleComplete}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: '#6C2EDB' }}
                data-testid="onboarding-finish"
              >
                Go to my studio <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
