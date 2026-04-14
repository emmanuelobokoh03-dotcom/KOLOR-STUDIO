import { useState, useEffect } from 'react'
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
      <ProblemSection />
      <WorkflowSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <FounderSection />
      <UrgencySection onCta={goSignup} />
      <FinalCTA onCta={goSignup} />
      <Footer />
    </div>
  )
}

/* ---------- NAVIGATION ---------- */
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
          {['Features', 'Pricing', 'Stories'].map(label => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="text-[13px] font-medium transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-[13px] font-medium transition-colors duration-150 hidden sm:block"
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
        >
          <span className="landing-pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6C2EDB' }} />
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {variant === 'fine_art'
              ? 'For fine artists \u00b7 No CRM has been built for you. Until now.'
              : 'Beta is live \u00b7 First 20 spots \u2014 $97 one-time, lifetime access'}
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
        <p className="text-xs mb-14" style={{ color: 'rgba(255,255,255,0.3)' }}>
          No credit card required &nbsp;&middot;&nbsp; Set up in 5 minutes &nbsp;&middot;&nbsp; Cancel anytime
        </p>

        {/* Dashboard product frame */}
        <div className="relative max-w-[900px] mx-auto">
          <div
            className="rounded-2xl overflow-hidden hero-frame-tilt"
            style={{
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
                  <span className="font-mono-kolor text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>app.kolorstudio.com/dashboard</span>
                </div>
              </div>
            </div>

            {/* App content mock */}
            <div className="grid" style={{ gridTemplateColumns: '180px 1fr' }}>
              {/* Sidebar */}
              <div className="hidden md:block py-4 px-3" style={{ background: '#0C0A1A', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
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
              <div className="p-4 md:p-5 min-h-[280px] md:min-h-[340px]" style={{ background: '#100D20' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-white/80">Good morning, Sarah <span style={{ color: '#a78bfa' }}>&#10022;</span></div>
                  </div>
                  <div className="text-[10px] font-semibold text-white rounded-md px-2.5 py-1" style={{ background: '#6C2EDB' }}>+ New Lead</div>
                </div>

                {/* 4-stat row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Total Leads', val: '24' },
                    { label: 'New', val: '8' },
                    { label: 'Quoted', val: '6' },
                    { label: 'Booked', val: '10' },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-sm font-bold text-white/90">{s.val}</div>
                      <div className="text-[9px] text-white/30">{s.label}</div>
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
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white/70">{row.name}</span>
                        <span className="text-white/25">{row.project}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="font-medium rounded px-1.5 py-0.5"
                          style={{ borderLeft: `2px solid ${row.statusColor}`, background: row.bg, color: row.statusColor }}
                        >
                          {row.status}
                        </span>
                        <span className="text-white/40 tabular-nums">{row.amount}</span>
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
  const track = [...TESTIMONIALS, ...TESTIMONIALS]
  // AUDIT FIX [5.2, 5.3]: Keyboard accessible marquee with pause control
  const [paused, setPaused] = useState(false)

  return (
    <section
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
              I spent years managing creative teams — photographers on assignment, designers
              on retainer, artists fulfilling commissions. The talent was never the problem.
              The problem was the black hole between "I'm interested" and "contract signed."
              Inquiries sitting in inboxes for four days. Proposals sent as email attachments.
              Follow-up that depended entirely on memory. World-class work, chaos behind it.
            </p>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 16 }}>
              I looked at every tool on the market and found the same thing: HoneyBook and
              Dubsado were built for American wedding photographers in 2016 and never
              meaningfully expanded beyond that. They assume US bank accounts, US tax rates,
              and a single industry. A fine artist managing collectors in Tokyo, a brand
              designer sending proposals in Lagos, a photographer billing in euros — none of
              them were the intended user. It shows in every screen.
            </p>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 0 }}>
              KOLOR is what I would have built for every creative I ever managed. Equal depth
              for photography, design, and fine art. GDPR-native from the first line of code.
              Designed to work the way creative businesses actually run — not the way software
              companies assume they do. The first 20 people who join are shaping what it becomes.
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
