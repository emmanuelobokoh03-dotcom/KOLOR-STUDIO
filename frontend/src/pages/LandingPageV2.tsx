import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import KolorLogo from '../components/KolorLogo'
import { CountdownTimer } from '../components/CountdownTimer'

/* ---------- BETA end date (fixed deadline for all visitors) ---------- */
// AUDIT FIX [M3]: Fixed beta end date — countdown must be consistent for all visitors
function getBetaEndDate(): Date {
  // AUDIT FIX [L2]: Updated to real future beta deadline
  return new Date('2026-07-31T23:59:59Z')
}

/* ---------- Section label with purple rule ---------- */
function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="block w-4 h-px" style={{ background: '#a78bfa' }} />
      <span className="font-mono-kolor text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: '#a78bfa' }}>
        {children}
      </span>
    </div>
  )
}

/* ================================================================
   LANDING PAGE — Dark Atmospheric Rebuild
   ================================================================ */
export default function LandingPageV2() {
  const navigate = useNavigate()
  const goSignup = () => navigate('/signup')

  // A/B test: fine art first vs control
  const [heroVariant] = useState<'control' | 'fine_art'>(() => {
    const stored = localStorage.getItem('kolor_hero_variant')
    if (stored === 'control' || stored === 'fine_art') return stored
    const variant = Math.random() < 0.5 ? 'fine_art' : 'control'
    localStorage.setItem('kolor_hero_variant', variant)
    return variant
  })

  /* Scroll-reveal observer */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('revealed')
            }, i * 80)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal-section').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#080612' }}>
      <Nav onCta={goSignup} />
      <HeroSection onCta={goSignup} variant={heroVariant} />
      <MarqueeSection />
      <SocialProofStrip />
      <FeatureRowsSection />
      <TestimonialsSection />
      <UrgencySection onCta={goSignup} />
      <FinalCTA onCta={goSignup} />
      <Footer />
    </div>
  )
}

/* ---------- NAVIGATION ---------- */
// ═══════════════════════════════════════════════════════════════
// NEW iter-142 sections — SocialProofStrip, FeatureRowsSection, SimpleFinalCTA
// Kept above Nav so they render without circular type issues.
// ═══════════════════════════════════════════════════════════════

function SocialProofStrip() {
  const quotes = [
    { text: "Sent my first quote in 4 minutes.", author: "Adaeze O.", role: "Fine artist, Lagos" },
    { text: "Finally a CRM that doesn't feel like it was built for wedding photographers only.", author: "Marc D.", role: "Graphic designer, Berlin" },
    { text: "The client portal alone is worth it.", author: "Priya K.", role: "Portrait photographer, London" },
  ]
  return (
    <section className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {quotes.map((q, i) => (
          <div key={i} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm text-white/80 leading-relaxed mb-4">&ldquo;{q.text}&rdquo;</p>
            <p className="text-xs font-semibold text-white/60">{q.author}</p>
            <p className="text-[11px] text-white/40">{q.role}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function LeadsMockup() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-2 h-2 rounded-full bg-red-500/60" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
        <div className="w-2 h-2 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[10px] text-white/30">Pipeline</span>
      </div>
      <div className="p-4 space-y-3">
        {[
          { name: 'Chiara B.', project: 'Brand shoot', status: 'Quoted', color: '#a78bfa' },
          { name: 'James O.', project: 'Commission', status: 'Signed', color: '#34d399' },
          { name: 'Lena M.', project: 'Editorial', status: 'New', color: '#fbbf24' },
        ].map((lead, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div>
              <p className="text-xs font-semibold text-white/80">{lead.name}</p>
              <p className="text-[10px] text-white/40">{lead.project}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${lead.color}20`, color: lead.color }}>{lead.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuoteMockup() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #6C2EDB, #a78bfa)' }} />
      <div className="p-5">
        <p className="text-xs font-bold text-white/80 mb-1">Quote #004 &mdash; Brand Campaign</p>
        <p className="text-[10px] text-white/40 mb-4">For Chiara B. &middot; Valid 30 days</p>
        <div className="space-y-2 mb-4">
          {[['Creative direction', '$2,400'], ['Photography (2 days)', '$3,200'], ['Post-processing', '$800']].map(([item, price], i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-white/60">{item}</span>
              <span className="text-white/80 font-medium">{price}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-3 border-t border-white/10">
          <span className="text-xs font-bold text-white">Total</span>
          <span className="text-sm font-extrabold text-white">$6,400</span>
        </div>
      </div>
    </div>
  )
}

function ArtistMockup() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bar = barRef.current
    if (!bar) return
    const section = bar.closest('[data-feature-row]')
    if (!section) return

    const apply = () => { bar.style.width = '60%' }
    if (section.classList.contains('revealed')) { apply(); return }

    const obs = new MutationObserver(() => {
      if (section.classList.contains('revealed')) { apply(); obs.disconnect() }
    })
    obs.observe(section, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] text-white/30">Commission Portal</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl h-28 flex items-center justify-center" style={{ background: 'rgba(108,46,219,0.08)', border: '1px dashed rgba(108,46,219,0.3)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="8.5" r="1.5" fill="currentColor"/>
            <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="15.5" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-white/80">Oil on Canvas &mdash; 36&times;48&quot;</p>
          <p className="text-[10px] text-white/40">Collector: Marcus A. &middot; Progress: 60%</p>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div ref={barRef} className="h-full rounded-full bg-purple-500" style={{ width: '0%', transition: 'width 1.2s ease 0.4s' }} />
        </div>
      </div>
    </div>
  )
}

function FeatureRowsSection() {
  const rows: Array<{ label: string; title: string; body: string; mockup: JSX.Element; flip?: boolean }> = [
    {
      label: 'LEADS & PIPELINE',
      title: 'Every inquiry. Organised.',
      body: 'Capture leads from your inquiry form, track them through your pipeline, and never forget a follow-up. Built for the way creatives actually work — not how enterprise software thinks you should.',
      mockup: <LeadsMockup />,
    },
    {
      label: 'QUOTES & CONTRACTS',
      title: 'Look professional from day one.',
      body: 'Send branded quotes in minutes. When they accept, a contract goes out automatically. Get paid faster with Stripe and Paystack — in your currency, wherever you are.',
      mockup: <QuoteMockup />,
      flip: true,
    },
    {
      label: 'FOR FINE ARTISTS',
      title: 'The first CRM built for commission artists.',
      body: 'Track commission inquiries, manage collector relationships, and deliver your work through a client portal that reflects your gallery-level standards. No other CRM does this.',
      mockup: <ArtistMockup />,
    },
  ]
  // Iter 143 — animate mockup entrance when the row gains the `revealed` class (set by the existing IO at the page root).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const sections = document.querySelectorAll<HTMLElement>('[data-feature-row]')
    const observers: MutationObserver[] = []

    sections.forEach(section => {
      const mockup = section.querySelector<HTMLElement>('.mockup-animate')
      if (!mockup) return

      const apply = () => {
        mockup.style.opacity = '1'
        mockup.style.transform = 'translateY(0)'
      }

      if (section.classList.contains('revealed')) { apply(); return }

      const obs = new MutationObserver(() => {
        if (section.classList.contains('revealed')) { apply(); obs.disconnect() }
      })
      obs.observe(section, { attributes: true, attributeFilter: ['class'] })
      observers.push(obs)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [])

  return (
    <section className="py-16 px-6" id="features" data-testid="features-section">
      <div className="max-w-5xl mx-auto space-y-20">
        {rows.map((row, i) => (
          <div
            key={i}
            data-feature-row
            className={`reveal-section flex flex-col ${row.flip ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-16`}
          >
            <div className="flex-1">
              <span className="text-[11px] font-mono font-bold tracking-[0.12em] text-purple-400 mb-3 block">{row.label}</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">{row.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{row.body}</p>
            </div>
            <div
              className="flex-1 w-full mockup-animate"
              style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.55s ease, transform 0.55s ease' }}
            >
              {row.mockup}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SimpleFinalCTA({ onCta }: { onCta: () => void }) {
  return (
    <section className="py-20 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Your creative business.<br />Finally under control.
      </h2>
      <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">
        Join photographers, designers, and artists building sustainable practices with KOLOR.
      </p>
      <button
        onClick={onCta}
        className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-white rounded-xl transition-all hover:scale-[1.02] motion-reduce:hover:scale-100"
        style={{ background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)', boxShadow: '0 0 40px rgba(108,46,219,0.4)' }}
        data-testid="landing-final-cta"
      >
        Start free &mdash; no credit card required
      </button>
    </section>
  )
}

function Nav({ onCta }: { onCta: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-all duration-200"
      style={{
        background: 'rgba(8,6,18,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
      data-testid="landing-nav"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-3.5">
        <KolorLogo variant="light" size="md" />

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features', id: 'features' },
            { label: 'Pricing', id: 'pricing' },
            { label: 'Stories', id: 'stories' },
          ].map(({ label, id }) => (
            <button
              key={label}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="text-[13px] font-medium transition-colors duration-150 bg-transparent border-none cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.5)', padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              data-testid={`nav-scroll-${id}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-[13px] font-medium transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            data-testid="nav-login"
          >
            Log in
          </Link>
          <button
            onClick={onCta}
            className="text-[13px] font-semibold text-white rounded-lg transition-colors duration-150"
            style={{ background: '#6C2EDB', padding: '8px 18px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5522B8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6C2EDB')}
            data-testid="nav-cta"
          >
            Start free <span className="inline-block ml-0.5">&rarr;</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

/* ---------- SECTION 1: HERO ---------- */
function HeroSection({ onCta, variant = 'control' }: { onCta: () => void; variant?: 'control' | 'fine_art' }) {
  return (
    <section className="relative overflow-hidden" style={{ padding: '100px 0 80px' }} data-testid="hero-section" data-variant={variant}>
      {/* Ambient glows */}
      <div className="absolute pointer-events-none" style={{ top: '10%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(108,46,219,0.28) 0%, rgba(108,46,219,0.06) 50%, transparent 70%)', zIndex: 0 }} />
      <div className="absolute pointer-events-none" style={{ top: '20%', left: '30%', transform: 'translateX(-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(232,137,26,0.07) 0%, transparent 60%)', zIndex: 0 }} />
      <div className="absolute pointer-events-none" style={{ bottom: -60, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(108,46,219,0.08) 0%, transparent 65%)', zIndex: 0 }} />

      {/* Rotating radial grid — ambient layer */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 700,
          maxWidth: '100vw',
          zIndex: 0,
          opacity: 0.04,
        }}
      >
        <svg
          viewBox="0 0 700 700"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '100%',
            height: '100%',
            animation: 'radial-grid-rotate 45s linear infinite',
          }}
        >
          {[80, 140, 200, 260, 320].map(r => (
            <circle key={r} cx="350" cy="350" r={r} fill="none" stroke="white" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30 * Math.PI) / 180
            return (
              <line
                key={i}
                x1={350 + Math.cos(angle) * 80}
                y1={350 + Math.sin(angle) * 80}
                x2={350 + Math.cos(angle) * 320}
                y2={350 + Math.sin(angle) * 320}
                stroke="white"
                strokeWidth="0.5"
              />
            )
          })}
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
        {/* Announcement pill */}
        <div
          className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 mb-8"
          style={{ background: 'rgba(108,46,219,0.15)', border: '1px solid rgba(108,46,219,0.3)' }}
          data-testid="hero-announcement-pill"
        >
          <span className="landing-pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6C2EDB' }} />
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {variant === 'fine_art'
              ? 'For fine artists \u00b7 No CRM has been built for you. Until now.'
              : 'Now in beta \u00b7 20 founder spots \u2014 lifetime access for $97'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>&rarr;</span>
        </div>

        {/* H1 — staggered word reveal */}
        {variant === 'fine_art' ? (
          <>
            <h1
              className="font-display font-extrabold leading-[1.05] tracking-[-0.03em] mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
              data-testid="hero-headline"
            >
              {'The CRM built for'.split(' ').map((word, i) => (
                <span
                  key={i}
                  className="hero-word inline-block mr-[0.25em]"
                  style={{ animationDelay: `${i * 80}ms`, color: '#ffffff' }}
                >
                  {word}
                </span>
              ))}
              <br />
              {'fine artists.'.split(' ').map((word, i) => (
                <span
                  key={i}
                  className="hero-word inline-block mr-[0.25em]"
                  style={{ animationDelay: `${(i + 4) * 80}ms`, color: '#6C2EDB' }}
                >
                  {word}
                </span>
              ))}
            </h1>
            <p className="mx-auto mb-10 leading-relaxed" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 540 }}>
              Manage commissions, collectors, and reproduction rights — all in one place. KOLOR is the first CRM purpose-built for independent fine artists. Track commissions from inquiry to delivery. Send professional offers. Sign agreements with built-in reproduction rights clauses. Know what needs attention before a collector goes quiet.
            </p>
          </>
        ) : (
          <>
            <h1
              className="font-display font-extrabold leading-[1.05] tracking-[-0.03em] mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
              data-testid="hero-headline"
            >
              {'The studio behind'.split(' ').map((word, i) => (
                <span
                  key={i}
                  className="hero-word inline-block mr-[0.25em]"
                  style={{ animationDelay: `${i * 80}ms`, color: '#ffffff' }}
                >
                  {word}
                </span>
              ))}
              <br />
              {'your best work.'.split(' ').map((word, i) => (
                <span
                  key={i}
                  className="hero-word inline-block mr-[0.25em]"
                  style={{ animationDelay: `${(i + 3) * 80}ms`, color: '#6C2EDB' }}
                >
                  {word}
                </span>
              ))}
            </h1>
            <p className="mx-auto mb-10 leading-relaxed" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 520 }}>
              CRM built for photographers, designers, and fine artists who are done managing clients from a spreadsheet. Leads, quotes, contracts, and calendar — one beautiful tool.
            </p>
          </>
        )}

        {/* CTA row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 text-white font-semibold rounded-[10px] transition-colors duration-150"
            style={{ background: '#6C2EDB', padding: '14px 28px', fontSize: 15 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5522B8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6C2EDB')}
            data-testid="hero-cta-primary"
          >
            Start for free <ArrowRight weight="bold" className="w-4 h-4" />
          </button>
          <button
            className="font-medium rounded-[10px] transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '14px 28px', fontSize: 15 }}
            data-testid="hero-cta-secondary"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See how it works
          </button>
        </div>

        {/* Trust line */}
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          No credit card required &nbsp;&middot;&nbsp; Set up in 5 minutes &nbsp;&middot;&nbsp; Cancel anytime
        </p>

        {/* Avatar stack — social proof at fold */}
        <div className="flex items-center justify-center gap-3 mb-10" data-testid="hero-avatar-stack">
          <div className="flex -space-x-2.5">
            {[
              { initials: 'SL', color: '#6C2EDB' },
              { initials: 'AO', color: '#5522B8' },
              { initials: 'JM', color: '#7C3AED' },
              { initials: 'PD', color: '#4C1D95' },
              { initials: 'KN', color: '#6D28D9' },
            ].map(({ initials, color }) => (
              <div
                key={initials}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: color, border: '2px solid #080612', boxShadow: '0 0 0 1px rgba(108,46,219,0.3)' }}
              >
                {initials}
              </div>
            ))}
          </div>
          <div className="text-left">
            <div className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Joined by creatives in 14 countries
            </div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Photography &nbsp;&middot;&nbsp; Design &nbsp;&middot;&nbsp; Fine Art
            </div>
          </div>
        </div>

        {/* Dashboard product frame */}
        <div className="relative max-w-[900px] mx-auto">
          <div
            className="rounded-2xl hero-frame-tilt"
            style={{
              overflowX: 'clip',
              overflowY: 'hidden',
              background: '#100D20',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(108,46,219,0.15), 0 40px 80px rgba(0,0,0,0.7), 0 0 120px rgba(108,46,219,0.08)',
            }}
          >
            {/* Chrome bar */}
            <div className="flex items-center gap-2 px-4 h-10" style={{ background: '#0C0A1A', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-[5px]">
                <span className="w-[11px] h-[11px] rounded-full" style={{ background: '#FF5F57' }} />
                <span className="w-[11px] h-[11px] rounded-full" style={{ background: '#FFBD2E' }} />
                <span className="w-[11px] h-[11px] rounded-full" style={{ background: '#28CA41' }} />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-[5px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#28CA41' }} />
                  <span className="font-mono-kolor text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>kolorstudio.app/dashboard</span>
                </div>
              </div>
            </div>

            {/* App content mock */}
            <div className="flex" style={{ overflow: 'hidden' }}>
              {/* Sidebar */}
              <div className="hidden md:block flex-shrink-0 py-4 px-3" style={{ background: '#0C0A1A', borderRight: '1px solid rgba(255,255,255,0.05)', width: 180 }}>
                <div className="font-extrabold text-sm mb-5 px-2" style={{ color: '#a78bfa' }}>KOLOR</div>
                {['Dashboard', 'Leads', 'Quotes', 'Contracts', 'Calendar', 'Settings'].map((item, i) => (
                  <div
                    key={item}
                    className="text-xs font-medium rounded-md px-2 py-1.5 mb-0.5"
                    style={{
                      background: i === 0 ? 'rgba(108,46,219,0.2)' : 'transparent',
                      color: i === 0 ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0 p-3 md:p-5 min-h-[240px] md:min-h-[340px]" style={{ background: '#100D20', overflow: 'hidden' }}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div>
                    <div className="text-[11px] font-semibold text-white/80 whitespace-nowrap">Good morning, Sarah <span style={{ color: '#a78bfa' }}>&#10022;</span></div>
                  </div>
                  <div className="text-[10px] font-semibold text-white rounded-md px-2.5 py-1 whitespace-nowrap flex-shrink-0" style={{ background: '#6C2EDB' }}>+ New Lead</div>
                </div>

                {/* 4-stat row */}
                <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-0.5">
                  {[
                    { label: 'Leads', val: '24' },
                    { label: 'New', val: '8' },
                    { label: 'Quoted', val: '6' },
                    { label: 'Booked', val: '10' },
                  ].map(s => (
                    <div
                      key={s.label}
                      className="rounded-lg px-2.5 py-2 flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minWidth: 52 }}
                    >
                      <div className="text-sm font-bold text-white/90">{s.val}</div>
                      <div className="text-[9px] text-white/30 whitespace-nowrap">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Mini table */}
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { name: 'Jessica Liu', project: 'Wedding', status: 'Quoted', amount: '$4,200', statusColor: '#D97706', bg: 'rgba(217,119,6,0.1)' },
                    { name: 'Marcus Reid', project: 'Portrait', status: 'Signed', amount: '$850', statusColor: '#059669', bg: 'rgba(5,150,105,0.1)' },
                    { name: 'Anika Kapoor', project: 'Commercial', status: 'Inquiry', amount: '$6,500', statusColor: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.03)' },
                  ].map((row, i) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between px-3 py-2.5 text-[11px]"
                      style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-white/70 truncate">{row.name}</span>
                        <span className="text-white/25 hidden sm:inline flex-shrink-0">{row.project}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="font-medium rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap"
                          style={{ borderLeft: `2px solid ${row.statusColor}`, background: row.bg, color: row.statusColor }}
                        >
                          {row.status}
                        </span>
                        <span className="hidden sm:inline text-white/40 tabular-nums">{row.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating activity pills */}
          <div className="hidden lg:flex items-center gap-2 absolute landing-float z-10 rounded-full px-4 py-2.5" style={{ bottom: -16, left: 40, animationDelay: '0s', background: 'rgba(16,13,32,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#059669' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Quote accepted &middot; $4,200</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 absolute landing-float z-10 rounded-full px-4 py-2.5" style={{ top: 60, right: 0, animationDelay: '1.3s', background: 'rgba(16,13,32,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#6C2EDB' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>New inquiry from Anika K.</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 absolute landing-float z-10 rounded-full px-4 py-2.5" style={{ bottom: 80, right: -10, animationDelay: '2.6s', background: 'rgba(16,13,32,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#3B82F6' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Contract signed &#10003;</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 2: SOCIAL PROOF MARQUEE ---------- */
function MarqueeSection() {
  const items = [
    'Wedding Photography', 'Brand Design', 'Commercial Photography', 'Interior Design',
    'Fashion Photography', 'Graphic Design', 'Portrait Studios', 'Creative Agencies',
    'Event Photography', 'Illustration', 'Architecture', 'Video Production',
  ]
  const doubled = [...items, ...items]

  return (
    <section
      className="py-10 overflow-hidden reveal-section"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <p className="text-center mb-5 uppercase tracking-[0.12em]" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
        Trusted by creative professionals
      </p>
      <div className="landing-marquee-track flex gap-12 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2.5 flex-shrink-0" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>
            <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: 'rgba(108,46,219,0.4)' }} />
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}

/* ---------- SECTION 3: PROBLEM ---------- */
function ProblemSection() {
  const painCards = [
    { num: '01', title: 'Spreadsheet chaos', body: "Leads in Google Sheets. Contracts lost in email threads. Payments tracked in PayPal. Nothing talks to anything. Something always falls through the cracks." },
    { num: '02', title: 'Double bookings', body: "Two clients. Same Saturday. One furious email. Every double-booking costs you a referral, a review, and a piece of your reputation." },
    { num: '03', title: 'Quote paralysis', body: "Opening Canva or Word every time. 45 minutes building something your client glances at for 10 seconds — before going with whoever replied faster." },
    { num: '04', title: 'The follow-up you forgot', body: "That inquiry three weeks ago. You meant to reply. Life happened. They booked your competitor. That's not a client lost — that's $3,000 gone." },
  ]

  return (
    <section className="reveal-section" style={{ padding: '100px 24px' }} data-testid="problem-section" id="stories">
      <div className="max-w-[1000px] mx-auto">
        <SectionLabel>The problem</SectionLabel>

        <h2 className="font-display font-extrabold tracking-[-0.025em] mb-4" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15 }}>
          <span style={{ color: '#ffffff' }}>
            Your work is world-class.{'\n'}
          </span>
          <br />
          <span style={{ color: '#ffffff' }}>
            Your <span style={{ color: '#6C2EDB' }}>workflow</span> shouldn't hold it back.
          </span>
        </h2>

        <p className="mb-12" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 480, lineHeight: 1.7 }}>
          Every creative professional knows the feeling. The art is there. The clients are there. The admin is a disaster.
        </p>

        {/* Pain grid */}
        <div className="stagger-children rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
          {/* Featured card */}
          <div
            className="p-8 md:p-10 landing-pain-card"
            style={{ background: 'rgba(108,46,219,0.08)', gridColumn: '1 / -1' }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
              <div className="text-[52px] font-extrabold flex-shrink-0" style={{ color: '#6C2EDB' }}>78%</div>
              <div>
                <p className="font-semibold text-white/90 mb-2">of buyers choose the first business that responds — not the best-reviewed, not the cheapest.</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Speed wins the booking. Photographers and designers lose clients every day — not because of their work, but because a competitor replied first. KOLOR makes sure you're always first.
                </p>
                <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>MIT / Harvard Business Review Lead Response Study &middot; Dr. James Oldroyd &middot; 2,241 firms audited</p>
              </div>
            </div>
          </div>

          {painCards.map(card => (
            <div key={card.num} className="p-7 landing-pain-card" style={{ background: '#080612' }}>
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3" style={{ color: 'rgba(108,46,219,0.5)' }}>{card.num}</div>
              <h3 className="text-base font-semibold text-white/90 mb-2">{card.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 4: WORKFLOW ---------- */
function WorkflowSection() {
  return (
    <section
      className="reveal-section"
      style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="max-w-[1000px] mx-auto">
        <SectionLabel>How it works</SectionLabel>

        <h2 className="font-display font-extrabold tracking-[-0.025em] mb-4" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15 }}>
          <span style={{ background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Capture. Quote. Book.
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            In that order. Every time.
          </span>
        </h2>

        <p className="mb-14" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 480, lineHeight: 1.7 }}>
          Three steps between a stranger's inquiry and a signed contract in your inbox.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute" style={{ top: 28, left: 'calc(16.66% + 20px)', right: 'calc(16.66% + 20px)', height: 1, background: 'linear-gradient(90deg, rgba(108,46,219,0.7), rgba(108,46,219,0.3), rgba(108,46,219,0.7))', zIndex: 0 }} />

          {/* Step 01 */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: '#a78bfa' }}>01</span>
              <div className="w-2 h-2 rounded-full" style={{ background: '#6C2EDB', border: '1px solid #a78bfa' }} />
            </div>
            <h3 className="text-[17px] font-bold text-white/90 mb-2">Capture the lead</h3>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Every inquiry lands in your pipeline automatically. Share a form link — leads arrive directly in your dashboard.
            </p>
            {/* Lead card mockup */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,10,30,0.8)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
              <div className="flex items-center gap-[5px] mb-3">
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FF5F57' }} />
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FFBD2E' }} />
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#28CA41' }} />
              </div>
              <div className="inline-block text-[9px] font-bold tracking-[0.07em] uppercase px-[7px] py-[2px] rounded mb-2" style={{ background: 'rgba(108,46,219,0.2)', color: '#a78bfa' }}>New inquiry</div>
              <div className="rounded-lg p-3 mb-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>Amara Okonkwo</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Wedding &middot; Cape Town &middot; Jun 14</div>
              </div>
              <div className="rounded-lg p-3 opacity-60" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>Sophie Laurent</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Brand identity &middot; Paris &middot; Jul 2</div>
              </div>
            </div>
          </div>

          {/* Step 02 */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: '#a78bfa' }}>02</span>
              <div className="w-2 h-2 rounded-full" style={{ background: '#6C2EDB', border: '1px solid #a78bfa' }} />
            </div>
            <h3 className="text-[17px] font-bold text-white/90 mb-2">Send the quote</h3>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Professional proposals in 2 minutes. Clients approve online — no PDF attachments, no back-and-forth.
            </p>
            {/* Quote mockup */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,10,30,0.8)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
              <div className="flex items-center gap-[5px] mb-3">
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FF5F57' }} />
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FFBD2E' }} />
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#28CA41' }} />
              </div>
              {[
                { label: 'Full-day coverage', val: '\u00a31,800' },
                { label: 'Second shooter', val: '\u00a3350' },
                { label: 'Gallery delivery', val: '\u00a3120' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between py-[5px] text-[10px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{row.val}</span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 text-[13px] font-bold" style={{ borderTop: '1px solid rgba(108,46,219,0.3)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Total</span>
                <span style={{ color: '#a78bfa' }}>{'\u00a3'}2,270</span>
              </div>
            </div>
          </div>

          {/* Step 03 */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: '#a78bfa' }}>03</span>
              <div className="w-2 h-2 rounded-full" style={{ background: '#6C2EDB', border: '1px solid #a78bfa' }} />
            </div>
            <h3 className="text-[17px] font-bold text-white/90 mb-2">Close the booking</h3>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Contract sent, signed online, and filed automatically. You're booked before they change their mind.
            </p>
            {/* Contract mockup */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,10,30,0.8)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
              <div className="flex items-center gap-[5px] mb-3">
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FF5F57' }} />
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FFBD2E' }} />
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#28CA41' }} />
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
                <span className="text-[10px] font-semibold" style={{ color: 'rgba(34,197,94,0.9)' }}>Contract signed &middot; 2 mins ago</span>
              </div>
              <div className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Booking Agreement — Amara Okonkwo</div>
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: 8 }}>
                <div className="text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Client signature</div>
                <div className="text-[11px] font-semibold italic" style={{ color: 'rgba(255,255,255,0.8)' }}>Amara Okonkwo</div>
              </div>
              <div className="text-[9px] mt-3" style={{ color: 'rgba(34,197,94,0.6)' }}>Deposit of {'\u00a3'}454 received</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 5: FEATURES ---------- */
function QuotePipelineBar() {
  const stages = [
    { label: 'Sent', pct: 100 },
    { label: 'Viewed', pct: 78 },
    { label: 'Approved', pct: 52 },
    { label: 'Signed', pct: 31 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stages.map((s) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="font-mono-kolor" style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', minWidth: 52 }}>
            {s.label}
          </span>
          <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
            <div
              style={{
                height: '100%',
                width: `${s.pct}%`,
                background: '#6C2EDB',
                borderRadius: 2,
                opacity: s.pct / 100,
              }}
            />
          </div>
          <span className="font-mono-kolor" style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', minWidth: 28, textAlign: 'right' }}>
            {s.pct}%
          </span>
        </div>
      ))}
    </div>
  )
}

function FeaturesSection() {
  return (
    <section className="reveal-section" style={{ padding: '100px 24px' }} data-testid="features-section" id="features">
      <div className="max-w-[1000px] mx-auto">
        <SectionLabel>Everything in one place</SectionLabel>

        <h2 className="font-display font-extrabold tracking-[-0.025em] mb-4" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15 }}>
          <span style={{ background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your whole studio.
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            One tab.
          </span>
        </h2>

        <p className="mb-12" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 540, lineHeight: 1.7 }}>
          No switching between apps. No copy-pasting. No "where did I put that contract." Everything connected — it remembers, so you don't have to.
        </p>

        {/* Bento grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }} data-testid="feature-cards">

          {/* HERO CARD — Kanban pipeline (full width) */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{ gridColumn: 'span 12', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '22px' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,46,219,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            data-testid="feature-kanban"
          >
            <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-2" style={{ color: '#a78bfa' }}>Lead management</div>
            <h3 className="text-base font-semibold text-white/90 mb-1">Every lead, always visible</h3>
            <p className="text-[13px] mb-5" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>From first inquiry to signed contract. Know exactly where every potential client is — without a spreadsheet.</p>

            {/* Mini kanban */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { col: 'New', count: 2, cards: [{ name: 'Amara O.', meta: 'Wedding \u00b7 Jun 14' }, { name: 'Marcus T.', meta: 'Portrait \u00b7 Jun 21' }] },
                { col: 'Contacted', count: 1, cards: [{ name: 'Priya S.', meta: 'Brand \u00b7 Jul 2', amt: '\u00a32,800' }] },
                { col: 'Quoted', count: 2, cards: [{ name: 'Sophie L.', meta: 'Editorial', amt: '\u00a31,400' }, { name: 'L\u00e9a K.', meta: 'Fashion', amt: '\u00a33,200' }] },
                { col: 'Booked', count: 1, cards: [{ name: 'David M.', meta: 'Commercial', amt: '\u00a34,500', booked: true }] },
              ].map(col => (
                <div key={col.col}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold tracking-[0.07em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>{col.col}</span>
                    <span className="flex items-center justify-center w-4 h-4 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{col.count}</span>
                  </div>
                  {col.cards.map((card, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-2 mb-1 cursor-pointer transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.05)', border: (card as any).booked ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.07)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,46,219,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = (card as any).booked ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none' }}
                    >
                      <div className="text-[10px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{card.name}</div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{card.meta}</div>
                      {(card as any).amt && <div className="text-[9px] font-semibold mt-1" style={{ color: (card as any).booked ? 'rgba(34,197,94,0.9)' : 'rgba(34,197,94,0.7)' }}>{(card as any).amt}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* MEDIUM CARD — Quotes */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 col-span-12 md:col-span-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '22px' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,46,219,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            data-testid="feature-quotes"
          >
            <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-2" style={{ color: '#a78bfa' }}>Quotes</div>
            <h3 className="text-base font-semibold text-white/90 mb-1">Proposals that close</h3>
            <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Build, send, and get approved online. Clients approve in one tap from any device.</p>
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,10,30,0.8)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
              {[
                { label: 'Full-day shoot', val: '\u00a31,800' },
                { label: 'Second shooter', val: '\u00a3350' },
                { label: 'Gallery delivery', val: '\u00a3120' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between text-[11px] py-[5px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{row.val}</span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(108,46,219,0.25)' }}>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Total</span>
                <span className="text-[13px] font-bold" style={{ color: '#a78bfa' }}>{'\u00a3'}2,270</span>
              </div>
              <div className="mt-3 w-full text-center text-white text-[11px] font-semibold py-2 rounded-lg" style={{ background: '#6C2EDB' }}>Approve quote &rarr;</div>
            </div>
          </div>

          {/* MEDIUM CARD — Contracts */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 col-span-12 md:col-span-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '22px' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,46,219,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            data-testid="feature-contracts"
          >
            <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-2" style={{ color: '#a78bfa' }}>Contracts</div>
            <h3 className="text-base font-semibold text-white/90 mb-1">Signed before they change their mind</h3>
            <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>E-signature compliant with ESIGN and eIDAS. Industry-specific templates for photography, design, and fine art.</p>
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,10,30,0.8)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
                <span className="text-[10px] font-semibold" style={{ color: 'rgba(34,197,94,0.9)' }}>Contract signed &middot; timestamped audit trail</span>
              </div>
              <div className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Booking Agreement — David Mensah</div>
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: 8, marginBottom: 10 }}>
                <div className="text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Client signature</div>
                <div className="text-[11px] font-semibold italic" style={{ color: 'rgba(255,255,255,0.8)' }}>David Mensah</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['Photography', 'Fine Art', 'Design'].map(t => (
                  <span key={t} className="text-[9px] px-2 py-1 rounded" style={{ background: 'rgba(108,46,219,0.15)', border: '1px solid rgba(108,46,219,0.25)', color: '#a78bfa' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* SMALL CARD — Client portal */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 col-span-12 md:col-span-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '22px' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,46,219,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            data-testid="feature-portal"
          >
            <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-2" style={{ color: '#a78bfa' }}>Client portal</div>
            <h3 className="text-base font-semibold text-white/90 mb-1">Your client's home base</h3>
            <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>One link. Quote, contract, and messages — all in one place your clients love.</p>
            <div className="rounded-lg p-3 mb-2 text-center" style={{ background: 'rgba(108,46,219,0.12)', border: '1px solid rgba(108,46,219,0.2)' }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: '#a78bfa' }}>Studio L{'\u00e9'}a K.</div>
              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Your project portal</div>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: '#22c55e' }} />
              <span className="text-[10px]" style={{ color: 'rgba(34,197,94,0.8)' }}>Contract signed &middot; Deposit paid</span>
            </div>
          </div>

          {/* SMALL CARD — Calendar */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 col-span-12 md:col-span-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '22px' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,46,219,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            data-testid="feature-calendar"
          >
            <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-2" style={{ color: '#a78bfa' }}>Calendar sync</div>
            <h3 className="text-base font-semibold text-white/90 mb-1">No more double-bookings</h3>
            <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Google Calendar sync. Every shoot, call, and deadline blocked automatically.</p>
            <div className="grid grid-cols-7 gap-1">
              {[
                { d: 'M', n: '10' }, { d: 'T', n: '11', event: 'Shoot' }, { d: 'W', n: '12' },
                { d: 'T', n: '13', today: true }, { d: 'F', n: '14', event: 'Wedding' },
                { d: 'S', n: '15' }, { d: 'S', n: '16' }
              ].map((day, i) => (
                <div key={i} className="text-center">
                  <div className="text-[8px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{day.d}</div>
                  <div className="text-[10px] font-semibold w-[22px] h-[22px] flex items-center justify-center rounded-md mx-auto"
                    style={{ background: day.today ? '#6C2EDB' : day.event ? 'rgba(108,46,219,0.2)' : 'transparent', color: day.today ? '#fff' : day.event ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>
                    {day.n}
                  </div>
                  {day.event && <div className="text-[7px] rounded px-1 mt-1 truncate" style={{ background: 'rgba(108,46,219,0.2)', color: '#a78bfa' }}>{day.event}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* SMALL CARD — Automation */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 col-span-12 md:col-span-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '22px' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,46,219,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            data-testid="feature-automation"
          >
            <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-2" style={{ color: '#a78bfa' }}>Automation</div>
            <h3 className="text-base font-semibold text-white/90 mb-1">Follow-ups on autopilot</h3>
            <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Automated sequences keep leads warm so nothing falls through the cracks.</p>
            <div>
              {[
                { label: 'Inquiry received — instant reply', day: 'Day 0', color: '#22c55e' },
                { label: 'Quote follow-up sent', day: 'Day 3', color: '#a78bfa' },
                { label: 'Contract reminder', day: 'Day 7', color: 'rgba(255,255,255,0.25)' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-[7px] h-[7px] rounded-full mt-1" style={{ background: item.color }} />
                    {i < 2 && <div className="w-px mt-1" style={{ height: 18, background: 'rgba(255,255,255,0.1)' }} />}
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</div>
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.day}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ---------- TESTIMONIALS DATA ---------- */
const TESTIMONIALS: {
  quote: string
  name: string
  title: string
  industry: 'photography' | 'design' | 'fine-art'
  featured?: boolean
}[] = [
  // ── PHOTOGRAPHY ──────────────────────────────────────────────────────────
  {
    quote: "I used to spend Sunday nights rebuilding my inquiry spreadsheet. Now I open KOLOR on Monday morning and it's all just there — sorted, followed up, nothing dropped. Booked 4 weddings in the first month.",
    name: "Sophie L.",
    title: "Wedding photographer, Cape Town",
    industry: "photography",
    featured: true,
  },
  {
    quote: "90 seconds to send a quote. Client signed the contract the same afternoon. That's never happened with my old process.",
    name: "James M.",
    title: "Commercial photographer, London",
    industry: "photography",
  },
  {
    quote: "Three months without missing a follow-up. My booking rate went from 30% to 62%. The pipeline view alone changed how I run my business.",
    name: "Marcus T.",
    title: "Portrait photographer, New York",
    industry: "photography",
  },

  // ── DESIGN ───────────────────────────────────────────────────────────────
  {
    quote: "Finally a CRM that doesn't look like it was built for a car dealership. My clients notice when they get a KOLOR proposal. It's the first tool that feels like it was made for someone like me.",
    name: "Nadia D.",
    title: "Brand designer, Paris",
    industry: "design",
  },
  {
    quote: "Dubsado was powerful but I needed a PhD to set it up. KOLOR was running inside an afternoon, and my first Statement of Work went out the same day.",
    name: "Priya S.",
    title: "Interior designer, Mumbai",
    industry: "design",
  },
  {
    quote: "I was losing briefs in my inbox and chasing clients for signatures for weeks. The scoping call workflow sorted both problems at once. My clients book themselves now.",
    name: "Léa K.",
    title: "Motion designer, Berlin",
    industry: "design",
  },

  // ── FINE ART ─────────────────────────────────────────────────────────────
  {
    quote: "I didn't expect a CRM to understand that my collectors don't get 'quotes' — they get offers. KOLOR uses the right language. Small thing, but it changes the whole tone of the conversation.",
    name: "Tomás R.",
    title: "Painter, São Paulo",
    industry: "fine-art",
  },
  {
    quote: "Commission tracking used to be a stack of notebooks and two email threads I'd inevitably lose. Now every piece, every collector, every deposit request is in one place. Three commissions delivered on time this quarter.",
    name: "Yuki M.",
    title: "Ceramic sculptor, Kyoto",
    industry: "fine-art",
  },
  {
    quote: "The contract template for commissions actually covered deposit terms and reproduction rights out of the box. My lawyer reviewed it in 20 minutes. That alone was worth it.",
    name: "Amara O.",
    title: "Mixed media artist, Lagos",
    industry: "fine-art",
  },
]

/* ---------- SECTION 6: TESTIMONIALS ---------- */
function TestimonialsSection() {
  // Iter 142 — trim to top 3 testimonials for tighter conversion focus
  const topThree = TESTIMONIALS.slice(0, 3)
  const track = [...topThree, ...topThree]
  // AUDIT FIX [5.2, 5.3]: Keyboard accessible marquee with pause control
  const [paused, setPaused] = useState(false)

  return (
    <section
      id="stories"
      className="reveal-section"
      style={{ padding: '100px 0' }}
      data-testid="testimonials-section"
      aria-label="Testimonials from KOLOR Studio users"
    >
      {/* Section header — constrained width */}
      <div className="max-w-[1000px] mx-auto px-6 md:px-10 mb-14">
        <SectionLabel>From the studio</SectionLabel>

        <h2
          className="font-display font-extrabold tracking-[-0.025em]"
          style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15 }}
        >
          <span style={{ color: '#ffffff' }}>Real creatives.</span>
          <br />
          <span style={{ color: '#6C2EDB' }}>Real results.</span>
        </h2>

        {/* Industry pill row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {(
            [
              { label: 'Photography', color: 'rgba(232,137,26,0.15)', text: '#E8891A' },
              { label: 'Design', color: 'rgba(108,46,219,0.15)', text: '#a78bfa' },
              { label: 'Fine Art', color: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.5)' },
            ] as const
          ).map(({ label, color, text }) => (
            <span
              key={label}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 20,
                background: color,
                color: text,
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Marquee track — full viewport width */}
      <div
        role="region"
        aria-label="Scrolling testimonials"
        style={{
          overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div
          className="marquee-track"
          style={{
            display: 'flex',
            gap: 16,
            width: 'max-content',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {track.map((t, i) => (
            <MarqueeCard key={i} {...t} />
          ))}
        </div>
      </div>

      {/* AUDIT FIX [5.2]: Screen-reader accessible pause button */}
      <div className="max-w-[1000px] mx-auto px-6 md:px-10 mt-4">
        <button
          onClick={() => setPaused(p => !p)}
          aria-label={paused ? 'Resume testimonial scroll' : 'Pause testimonial scroll'}
          className="sr-only-focusable"
          data-testid="marquee-pause-btn"
        >
          {paused ? 'Resume' : 'Pause'} testimonials
        </button>
      </div>
    </section>
  )
}

function MarqueeCard({
  quote,
  name,
  title,
  industry,
  featured,
}: {
  quote: string
  name: string
  title: string
  industry: 'photography' | 'design' | 'fine-art'
  featured?: boolean
}) {
  const industryAccent: Record<string, string> = {
    photography: '#E8891A',
    design: '#a78bfa',
    'fine-art': 'rgba(255,255,255,0.4)',
  }
  const accent = industryAccent[industry]

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderRadius: 14,
        padding: '24px 24px 20px',
        background: featured ? 'rgba(108,46,219,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${featured ? 'rgba(108,46,219,0.25)' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 0,
      }}
    >
      {/* Industry dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: accent,
            flexShrink: 0,
          }}
        />
        <span
          className="font-mono-kolor"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: accent,
          }}
        >
          {industry === 'fine-art' ? 'Fine Art' : industry.charAt(0).toUpperCase() + industry.slice(1)}
        </span>
        {featured && (
          <span
            className="font-mono-kolor"
            style={{
              marginLeft: 'auto',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase' as const,
            }}
          >
            Featured
          </span>
        )}
      </div>

      {/* Quote */}
      <p
        style={{
          fontSize: featured ? 15 : 13,
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.55)',
          fontStyle: 'italic',
          flex: 1,
          margin: 0,
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>

      {/* Attribution */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
          {name}
        </p>
        <p
          className="font-mono-kolor"
          style={{
            margin: '2px 0 0',
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {title}
        </p>
      </div>
    </div>
  )
}

/* ---------- SECTION 7: FAQ ACCORDION ---------- */
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Is KOLOR really free for the first 20 users?',
    answer: 'The first 20 accounts pay a one-time fee of $97 \u2014 not a subscription, a single payment that covers lifetime access with no recurring charges, ever. After those 20 spots fill, users 21\u201350 pay $19/month during the beta period, locked in permanently at that rate. After the beta closes, new users pay the standard $29/month. No hidden fees at any tier, and no credit card is required to start a free trial.',
  },
  {
    question: 'Which creative industries does KOLOR support?',
    answer: 'KOLOR is built for three industries: photography (wedding, portrait, commercial, fashion), design (brand, UI/UX, graphic, interior, motion, illustration), and fine art (painting, sculpture, print, mixed media, installation). When you sign up, you choose your industry and KOLOR adapts its language, workflows, and templates to match \u2014 so a fine artist sees \u201cCommission\u201d and \u201cCollector\u201d where a photographer sees \u201cBooking\u201d and \u201cClient.\u201d',
  },
  {
    question: 'Are the contracts legally binding?',
    answer: 'Yes. KOLOR\u2019s e-signature system complies with the Electronic Signatures in Global and National Commerce Act (ESIGN) in the US and the eIDAS regulation in the EU. Every signed contract includes a timestamped audit trail \u2014 when it was sent, when it was first opened, and when each party signed. We recommend consulting a lawyer to review your specific contract clauses, but the signing mechanism itself is legally enforceable.',
  },
  {
    question: 'What happens to my data if I leave?',
    answer: 'You own your data entirely. You can export all your leads, quotes, contracts, and client records at any time from Settings \u2192 Export. If you close your account, your data is permanently deleted from our servers within 30 days. We never sell your data or share it with third parties.',
  },
  {
    question: 'Does KOLOR replace my existing contract?',
    answer: 'Not necessarily. You can upload your existing contract template and KOLOR will auto-fill the client name, project details, and agreed price from your quote. If you don\u2019t have a contract yet, KOLOR provides industry-specific starting templates for photography, design, and fine art \u2014 which your lawyer can review and customise before you use them with clients.',
  },
  {
    question: 'How does Google Calendar sync work?',
    answer: 'Connect your Google account in Settings and KOLOR automatically creates calendar events for every shoot date, deadline, or discovery call you schedule through the app. Changes made in KOLOR update your Google Calendar in real time. The sync is one-way by default (KOLOR \u2192 Google) but two-way sync is on our roadmap.',
  },
  {
    question: 'Can my clients use the portal on their phone?',
    answer: 'Yes \u2014 the client portal is fully mobile-responsive. Most clients open quote and contract links directly from their email on a phone. The approval button is always above the fold, the quote is readable at any screen size, and signing works with a finger on touch screens.',
  },
  {
    question: 'What\u2019s coming after the beta?',
    answer: 'After the beta closes, KOLOR moves to a single Pro plan at $29/month \u2014 unlimited projects, all features, priority support. We may introduce team features and white-labelling at a higher tier later, but the roadmap is shaped by what beta users actually need. Beta users keep their rate locked in permanently regardless of what public pricing becomes.',
  },
]

function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Inject FAQPage JSON-LD structured data for Google rich snippets
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  return (
    <section
      className="reveal-section"
      style={{
        padding: 'clamp(64px, 8vw, 96px) clamp(16px, 4vw, 40px)',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
      data-testid="faq-section"
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <SectionLabel>Answers</SectionLabel>

        <h2 className="font-display font-extrabold tracking-[-0.025em] mb-3" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15 }}>
          <span style={{ color: '#ffffff' }}>
            Everything you need to know.
          </span>
        </h2>

        <p className="mb-10" style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
          Questions before you commit are good. Here are the ones we hear most.
        </p>

        <div className="stagger-children">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}
              data-testid={`faq-item-${i}`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 16,
                }}
                data-testid={`faq-toggle-${i}`}
              >
                <span style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: openFaq === i ? '#a78bfa' : 'rgba(255,255,255,0.85)',
                  transition: 'color 200ms ease',
                }}>
                  {item.question}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    flexShrink: 0,
                    transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    color: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div style={{
                maxHeight: openFaq === i ? 300 : 0,
                overflow: 'hidden',
                transition: 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <p style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.75,
                  paddingBottom: 20,
                  maxWidth: 600,
                }}>
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- FOUNDER SECTION ---------- */
function FounderSection() {
  const signals = [
    { icon: '\u{1F512}', title: 'GDPR-native', desc: 'from day one' },
    { icon: '\u{1F30D}', title: 'Global-first', desc: 'UK, EU, Africa, LatAm, Asia' },
    { icon: '\u26A1', title: 'Built in public', desc: 'Every iteration shipped live' },
    { icon: '\u{1F91D}', title: 'Operations-first', desc: 'Built from the management side' },
  ]

  return (
    <section
      className="reveal-section"
      style={{ padding: 'clamp(80px, 10vw, 120px) clamp(16px, 4vw, 40px)' }}
      data-testid="founder-section"
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <SectionLabel>The builder</SectionLabel>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-10 md:gap-14">
          {/* Left column — copy */}
          <div className="stagger-children">
            <h2
              className="font-display font-extrabold tracking-[-0.025em] mb-8"
              style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15 }}
            >
              <span style={{ background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Built by someone who watched
              </span>
              <br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                talented creatives lose work to broken admin.
              </span>
            </h2>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 16 }}>
              For years, I led creative teams comprised of photographers doing freelance
              assignments, designers on contract, and artists working under commission. The
              biggest issue has always been the lack of a seamless transition between the two
              stages of a project: &ldquo;I&rsquo;m interested&rdquo; and &ldquo;I have a signed contract.&rdquo; That gap
              showed up the same way every time &mdash; an inquiry sitting in someone&rsquo;s inbox for
              four days, a proposal sent as an email attachment, a follow-up that only happened
              because the creative happened to remember.
            </p>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 16 }}>
              After exploring every option on the market, I found the same thing in all of
              them: most are iterations of HoneyBook and Dubsado &mdash; both built in 2016 for
              wedding photographers working in the United States, and unchanged in any
              meaningful way since. They are built on the assumption that US banking, tax, and
              self-employment law applies universally. They do not work for a fine artist
              managing collectors in Tokyo, a brand designer sending proposals in Lagos, or a
              photographer billing clients in Europe. That assumption shows in every screen.
            </p>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 0 }}>
              KOLOR is what I would have built for every creative I ever managed. It has
              the same depth of functionality for photography, design, and fine art. It has been
              built under GDPR regulation from the first line of code. It operates the way a
              creative business actually operates &mdash; not the way a software company would expect
              one to. The first 20 people who join will help define how KOLOR develops over time.
            </p>

            <div style={{
              borderLeft: '2px solid rgba(108,46,219,0.5)',
              paddingLeft: 12,
              marginTop: 24,
              fontSize: 13,
              color: 'rgba(255,255,255,0.35)',
              fontStyle: 'italic',
            }}>
              — Emmanuel, founder of KOLOR Studio
            </div>
          </div>

          {/* Right column — credibility signals */}
          <div className="stagger-children">
            {signals.map(s => (
              <div
                key={s.title}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.02em', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- STATS ROW ---------- */
function StatsRow() {
  const stats = [
    { value: '3', label: 'Industries supported', sub: 'Photography, Design, Fine Art' },
    { value: '29+', label: 'Email automations', sub: 'Built-in sequences + custom builder' },
    { value: '14', label: 'Countries', sub: 'Global-first, GDPR-native' },
    { value: '5 min', label: 'Setup time', sub: 'From signup to first lead in minutes' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20" data-testid="stats-row">
      {stats.map(({ value, label, sub }) => (
        <div key={label} className="rounded-xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="font-display font-extrabold mb-1" style={{ fontSize: 'clamp(24px, 3vw, 32px)', color: '#6C2EDB', lineHeight: 1.1 }}>{value}</div>
          <div className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{sub}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------- PRODUCT DEEP DIVE ---------- */
function ProductDeepDiveSection() {
  const features = [
    {
      label: 'Lead management',
      headline: 'Every inquiry. Always visible.',
      body: 'Leads arrive from your public inquiry form and land directly in your Kanban pipeline. No inbox hunting. No missed messages. Move leads from inquiry to booked without leaving one screen.',
      bullets: ['Instant inquiry acknowledgement email', 'Kanban + list view', 'Auto-sorted by urgency'],
      mockup: (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,10,30,0.9)', border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
          <div className="flex items-center gap-[5px] mb-4">
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FF5F57' }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FFBD2E' }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#28CA41' }} />
          </div>
          <div className="text-[9px] font-bold tracking-[0.08em] uppercase mb-3" style={{ color: 'rgba(108,46,219,0.6)' }}>Pipeline &middot; 6 active leads</div>
          {[
            { name: 'Amara Okonkwo', meta: 'Commission \u00b7 Cape Town', stage: 'New', dot: '#6C2EDB' },
            { name: 'Sophie Laurent', meta: 'Brand identity \u00b7 Paris', stage: 'Quoted', dot: '#E8891A' },
            { name: 'James Mensah', meta: 'Wedding \u00b7 London', stage: 'Booked', dot: '#22c55e' },
          ].map((lead) => (
            <div key={lead.name} className="flex items-center justify-between rounded-lg px-3 py-2.5 mb-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <div className="text-[11px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{lead.name}</div>
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{lead.meta}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-[5px] h-[5px] rounded-full" style={{ background: lead.dot }} />
                <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{lead.stage}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: 'Quotes & contracts',
      headline: 'Send a quote. Get it signed. In minutes.',
      body: 'Build professional proposals in 2 minutes with your line items and branding. Clients approve online \u2014 no PDF attachments. Contract follows automatically. Everything timestamped and stored.',
      bullets: ['Client-facing quote approval page', 'E-signature built in', 'Automated contract reminders'],
      mockup: (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,10,30,0.9)', border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
          <div className="flex items-center gap-[5px] mb-4">
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FF5F57' }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FFBD2E' }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#28CA41' }} />
          </div>
          <div className="text-[9px] font-bold tracking-[0.08em] uppercase mb-3" style={{ color: 'rgba(232,137,26,0.7)' }}>Quote &middot; Amara Okonkwo</div>
          {[
            { label: 'Oil on canvas (60\u00d780cm)', val: '\u00a31,800' },
            { label: 'Artist certificate + framing', val: '\u00a3240' },
            { label: 'Secure delivery', val: '\u00a380' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-[6px] text-[10px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{row.val}</span>
            </div>
          ))}
          <div className="flex justify-between mt-3 pt-3 text-[13px] font-bold" style={{ borderTop: '1px solid rgba(108,46,219,0.3)' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Total</span>
            <span style={{ color: '#a78bfa' }}>{'\u00a3'}2,120</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 mt-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(34,197,94,0.85)' }}>Quote approved &middot; Contract sent</span>
          </div>
        </div>
      ),
    },
    {
      label: 'Email automation',
      headline: 'Follow-ups that run while you sleep.',
      body: 'KOLOR sends the right email at exactly the right moment \u2014 inquiry acknowledgements, quote reminders, contract nudges, onboarding sequences. Set it once. Never lose a client to silence again.',
      bullets: ['Instant inquiry reply', 'Quote & contract follow-ups', 'Custom sequences for any workflow'],
      mockup: (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,10,30,0.9)', border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
          <div className="flex items-center gap-[5px] mb-4">
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FF5F57' }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#FFBD2E' }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#28CA41' }} />
          </div>
          <div className="text-[9px] font-bold tracking-[0.08em] uppercase mb-3" style={{ color: 'rgba(108,46,219,0.6)' }}>Email sequences &middot; Running</div>
          {[
            { label: 'Inquiry received \u2014 instant reply', day: 'Day 0', color: '#22c55e', sent: 12 },
            { label: 'Quote follow-up', day: 'Day 3', color: '#a78bfa', sent: 8 },
            { label: 'Contract reminder', day: 'Day 4', color: '#E8891A', sent: 5 },
            { label: 'Client onboarding', day: 'Day 0', color: '#60a5fa', sent: 3 },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: item.color }} />
                <div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{item.label}</div>
                  <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.day}</div>
                </div>
              </div>
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.sent} sent</span>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <section className="reveal-section" style={{ padding: '80px 24px' }} data-testid="product-deepdive-section">
      <div className="max-w-[1000px] mx-auto">
        <SectionLabel>How KOLOR works</SectionLabel>
        <h2 className="font-display font-extrabold tracking-[-0.025em] mb-16" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15, color: '#ffffff' }}>
          Built for every stage of your studio.
        </h2>

        <StatsRow />

        <div className="space-y-24">
          {features.map((feature, i) => (
            <div key={feature.label} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-16`}>
              <div className="flex-1">
                <div className="text-[10px] font-bold tracking-[0.08em] uppercase mb-3" style={{ color: '#a78bfa' }}>{feature.label}</div>
                <h3 className="font-display font-extrabold tracking-[-0.02em] mb-4" style={{ fontSize: 'clamp(22px, 2.5vw, 30px)', color: '#ffffff', lineHeight: 1.2 }}>{feature.headline}</h3>
                <p className="mb-6 leading-relaxed" style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{feature.body}</p>
                <ul className="space-y-2.5">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-3 text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6C2EDB' }} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">{feature.mockup}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- MID-PAGE CTA ---------- */
function MidPageCTA({ onCta }: { onCta: () => void }) {
  return (
    <section
      className="reveal-section"
      style={{ padding: '80px 24px', background: 'rgba(108,46,219,0.06)', borderTop: '1px solid rgba(108,46,219,0.15)', borderBottom: '1px solid rgba(108,46,219,0.15)' }}
      data-testid="mid-page-cta"
    >
      <div className="max-w-[700px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6" style={{ background: 'rgba(108,46,219,0.15)', border: '1px solid rgba(108,46,219,0.3)' }}>
          <span className="landing-pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: '#6C2EDB' }} />
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>20 founder spots &middot; 3 remaining</span>
        </div>
        <h2 className="font-display font-extrabold tracking-[-0.025em] mb-5" style={{ fontSize: 'clamp(26px, 3vw, 38px)', lineHeight: 1.15, color: '#ffffff' }}>
          Stop losing clients to a slower reply.
        </h2>
        <p className="mb-8 leading-relaxed" style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 480, margin: '0 auto 32px' }}>
          Every day without KOLOR is another inquiry that goes cold, another quote that gets forgotten, another contract that took too long. Set up takes 5 minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 text-white font-semibold rounded-[10px] transition-colors duration-150"
            style={{ background: '#6C2EDB', padding: '14px 28px', fontSize: 15 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5522B8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6C2EDB')}
            data-testid="mid-cta-btn"
          >
            Claim your founder spot &rarr;
          </button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            $97 one-time &nbsp;&middot;&nbsp; Lifetime access &nbsp;&middot;&nbsp; No card required
          </span>
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 8: URGENCY / BETA PRICING ---------- */
function UrgencySection({ onCta }: { onCta: () => void }) {
  const endDate = getBetaEndDate()

  return (
    <section className="reveal-section px-6 md:px-10 mb-20" data-testid="urgency-section" id="pricing">
      <div
        className="relative overflow-hidden rounded-3xl max-w-[1000px] mx-auto text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(108,46,219,0.12) 0%, rgba(108,46,219,0.04) 50%, rgba(232,137,26,0.05) 100%)',
          border: '1px solid rgba(108,46,219,0.2)',
          padding: 'clamp(40px, 5vw, 72px) clamp(24px, 4vw, 64px)',
        }}
      >
        {/* Ambient glows */}
        <div className="absolute pointer-events-none" style={{ top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(108,46,219,0.18), transparent)', zIndex: 0 }} />
        <div className="absolute pointer-events-none" style={{ bottom: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(232,137,26,0.08), transparent)', zIndex: 0 }} />

        <div className="relative z-10">
          <SectionLabel>Beta access</SectionLabel>

          <h2 className="font-display font-extrabold tracking-[-0.025em] mb-8 mx-auto" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15, maxWidth: 560, color: '#ffffff' }}>
            Limited spots. Unlimited upside.
          </h2>

          <p className="text-[15px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Beta pricing closes in</p>

          {/* Countdown with dark overrides */}
          <div className="landing-countdown">
            <CountdownTimer endDate={endDate} />
          </div>

          {/* Pricing cards row */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mt-10">
            {/* $97 lifetime tier (highlighted) */}
            <div className="rounded-2xl p-7 text-left flex-1 max-w-[280px] mx-auto sm:mx-0" style={{ background: 'rgba(108,46,219,0.10)', border: '2px solid rgba(108,46,219,0.35)' }}>
              <div className="text-[10px] uppercase tracking-[0.08em] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>First 20 spots</div>
              <div className="text-4xl font-extrabold text-white mb-1">$97</div>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>One-time payment. Lifetime access. No monthly fees.</p>
              <div
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold mb-5"
                style={{ background: 'rgba(232,137,26,0.15)', border: '1px solid rgba(232,137,26,0.3)', color: '#fbbf24' }}
              >
                3 spots remaining
              </div>
              {/* PSP payment badges */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Pay via</span>
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold"
                  style={{ background: 'rgba(99,91,255,0.12)', border: '1px solid rgba(99,91,255,0.25)', color: '#a5b4fc' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                  </svg>
                  Stripe
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold"
                  style={{ background: 'rgba(0,196,140,0.12)', border: '1px solid rgba(0,196,140,0.25)', color: '#6ee7b7' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15"/>
                    <path d="M7 12h10M7 8h10M7 16h6"/>
                  </svg>
                  Paystack
                </span>
              </div>
              <button
                onClick={onCta}
                className="w-full text-white font-semibold py-3 rounded-lg text-sm transition-colors duration-150"
                style={{ background: '#6C2EDB' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#5522B8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#6C2EDB')}
                data-testid="urgency-cta"
              >
                Claim your spot &rarr;
              </button>
              <ul className="mt-5 space-y-2">
                {['Lead pipeline + Kanban board', 'Quotes, contracts, e-signature', 'Client portal included', 'Email automation sequences', 'Calendar + Google sync', 'Public portfolio page', 'All 3 industries supported', 'Lifetime access \u00b7 No monthly fee'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ color: '#22c55e', fontSize: 12, lineHeight: 1 }}>{'\u2713'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* $19/mo beta tier */}
            <div className="rounded-2xl p-7 text-left flex-1 max-w-[280px] mx-auto sm:mx-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] uppercase tracking-[0.08em] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Spots 21–50</div>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-white">$19</span>
                <span className="text-base" style={{ color: 'rgba(255,255,255,0.3)' }}>/month</span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Beta rate, locked in permanently.</p>
              <div className="h-[26px] mb-5" />
              <button
                className="w-full font-medium py-3 rounded-lg text-sm transition-all duration-150"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Join the waitlist
              </button>
              <ul className="mt-5 space-y-2">
                {['Everything in the lifetime plan', 'Rate locked in permanently', 'Priority onboarding support'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1 }}>{'\u2713'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* $29/mo public tier (ghost/dimmed) */}
            <div className="rounded-2xl p-7 text-left flex-1 max-w-[280px] mx-auto sm:mx-0" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.5 }}>
              <div className="text-[10px] uppercase tracking-[0.08em] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>After beta</div>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-base" style={{ color: 'rgba(255,255,255,0.3)' }}>/month</span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Public launch price.</p>
              <div className="h-[26px] mb-5" />
              <button
                disabled
                className="w-full font-medium py-3 rounded-lg text-sm cursor-not-allowed"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
              >
                Coming soon
              </button>
            </div>
          </div>

          {/* PSP trust strip */}
          <div className="mt-8 flex flex-col items-center gap-2" data-testid="psp-trust-strip">
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Secure payments via</p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#a5b4fc" aria-hidden="true">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Stripe</span>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Global</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
              <div
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(110,231,183,0.9)" strokeWidth="1.75" aria-hidden="true">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M3 12h18M12 3a13.5 13.5 0 010 18M12 3a13.5 13.5 0 000 18" strokeLinecap="round"/>
                </svg>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Paystack</span>
                <span className="text-[9px]" style={{ color: 'rgba(0,196,140,0.7)' }}>NG · GH · ZA · KE</span>
              </div>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
              256-bit SSL encryption &nbsp;·&nbsp; GDPR compliant &nbsp;·&nbsp; No card stored
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 8: FINAL CTA ---------- */
function FinalCTA({ onCta }: { onCta: () => void }) {
  return (
    <section
      className="reveal-section text-center"
      style={{
        padding: '100px 24px',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        backgroundPosition: 'center center',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
      }}
      data-testid="final-cta-section"
    >      <div className="max-w-2xl mx-auto">
        <h2
          className="font-display font-extrabold tracking-[-0.025em] mb-6"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1 }}
        >
          <span style={{ color: '#ffffff' }}>
            Your clients deserve<br />a better experience.<br />
          </span>
          <span style={{ color: '#6C2EDB' }}>
            So do you.
          </span>
        </h2>

        <p className="mx-auto mb-10 leading-relaxed" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 440 }}>
          Join creative professionals already running their studio with KOLOR. No spreadsheets. No monthly SaaS trap. One payment, lifetime access.
        </p>

        <button
          onClick={onCta}
          className="inline-flex items-center gap-2 text-white font-semibold rounded-[10px] transition-colors duration-150"
          style={{ background: '#6C2EDB', padding: '16px 36px', fontSize: 16 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#5522B8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#6C2EDB')}
          data-testid="final-cta-btn"
        >
          Start building your studio &rarr;
        </button>

        <p className="mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          $97 one-time for the first 20 &nbsp;&middot;&nbsp; Lifetime access &nbsp;&middot;&nbsp; 5-minute setup
        </p>
      </div>
    </section>
  )
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="px-6 md:px-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px' }} data-testid="footer">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>KOLOR Studio</span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>&copy; {new Date().getFullYear()} KOLOR Studio. Built for creatives.</span>
        <div className="flex gap-4 text-xs">
          <Link to="/privacy" className="transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.3)' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>Privacy</Link>
          <Link to="/terms" className="transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.3)' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>Terms</Link>
          <a href="https://x.com/kolor_studio" target="_blank" rel="noopener noreferrer" className="transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.3)' }} onMouseEnter={e => ((e.target as HTMLElement).style.color = '#fff')} onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}>X</a>
          <a href="https://instagram.com/kolorcreativestudio" target="_blank" rel="noopener noreferrer" className="transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.3)' }} onMouseEnter={e => ((e.target as HTMLElement).style.color = '#fff')} onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}>Instagram</a>
          <a href="https://tiktok.com/@kolorcreativestudio" target="_blank" rel="noopener noreferrer" className="transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.3)' }} onMouseEnter={e => ((e.target as HTMLElement).style.color = '#fff')} onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}>TikTok</a>
        </div>
      </div>
    </footer>
  )
}
