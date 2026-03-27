import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { CountdownTimer } from '../components/CountdownTimer'
import DashboardMock from '../components/illustrations/DashboardMock'
import QuoteMock from '../components/illustrations/QuoteMock'
import PortalMock from '../components/illustrations/PortalMock'

/* ---------- BETA end date (7 days from now, persisted in localStorage) ---------- */
function getBetaEndDate(): Date {
  const key = 'kolor_beta_end'
  const stored = localStorage.getItem(key)
  if (stored) {
    const d = new Date(stored)
    if (d.getTime() > Date.now()) return d
  }
  const d = new Date(Date.now() + 7 * 86400000)
  localStorage.setItem(key, d.toISOString())
  return d
}

/* ---------- Section label with purple rule ---------- */
function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="block w-4 h-px" style={{ background: '#a78bfa' }} />
      <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: '#a78bfa' }}>
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
      <HeroSection onCta={goSignup} />
      <MarqueeSection />
      <ProblemSection />
      <WorkflowSection />
      <FeaturesSection />
      <TestimonialsSection />
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
        <Link
          to="/"
          className="font-extrabold text-lg tracking-[0.08em]"
          style={{ background: 'linear-gradient(180deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          KOLOR
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Stories', 'Changelog'].map(label => (
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
function HeroSection({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative overflow-hidden" style={{ padding: '100px 0 80px' }} data-testid="hero-section">
      {/* Ambient glows */}
      <div className="absolute pointer-events-none" style={{ top: '10%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(108,46,219,0.28) 0%, rgba(108,46,219,0.06) 50%, transparent 70%)', zIndex: 0 }} />
      <div className="absolute pointer-events-none" style={{ top: '20%', left: '30%', transform: 'translateX(-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(232,137,26,0.07) 0%, transparent 60%)', zIndex: 0 }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
        {/* Announcement pill */}
        <div
          className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 mb-8"
          style={{ background: 'rgba(108,46,219,0.15)', border: '1px solid rgba(108,46,219,0.3)' }}
        >
          <span className="landing-pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6C2EDB' }} />
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Beta is live &middot; First 20 users get free access forever
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>&rarr;</span>
        </div>

        {/* H1 */}
        <h1
          className="font-display font-extrabold leading-[1.05] tracking-[-0.03em] mb-6"
          style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
          data-testid="hero-headline"
        >
          <span style={{ background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            The studio behind{'\n'}
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            your best work.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 leading-relaxed" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 520 }}>
          CRM built for photographers and designers who are done managing clients from a spreadsheet. Leads, quotes, contracts, and calendar — one beautiful tool.
        </p>

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
            className="rounded-2xl overflow-hidden"
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
                  <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>app.kolorstudio.com/dashboard</span>
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
          <span style={{ background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your work is world-class.{'\n'}
          </span>
          <br />
          <span style={{ background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>workflow</span> shouldn't hold it back.
          </span>
        </h2>

        <p className="mb-12" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 480, lineHeight: 1.7 }}>
          Every creative professional knows the feeling. The art is there. The clients are there. The admin is a disaster.
        </p>

        {/* Pain grid */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
          {/* Featured card */}
          <div
            className="p-8 md:p-10 landing-pain-card"
            style={{ background: 'rgba(108,46,219,0.08)', gridColumn: '1 / -1' }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
              <div className="text-[52px] font-extrabold flex-shrink-0" style={{ color: '#6C2EDB' }}>73%</div>
              <div>
                <p className="font-semibold text-white/90 mb-2">of freelance creatives lose clients to poor follow-up — not poor work.</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  The most talented photographers and designers lose bookings because they forgot to reply, sent a messy invoice, or double-booked a shoot. KOLOR makes sure that never happens to you.
                </p>
                <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Based on KOLOR user research &middot; 2024</p>
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
  const steps = [
    { num: '01', title: 'Capture the lead', body: "Every inquiry lands in your pipeline automatically. Lead forms, email parsing, or manual entry. Nothing falls through the cracks — every potential client is visible, tracked, and followed up." },
    { num: '02', title: 'Send the quote', body: "Build a professional quote in under 2 minutes. Your packages, your rates, your brand. The client approves it with one click — no PDF attachments, no back-and-forth, no printing." },
    { num: '03', title: 'Close the booking', body: "Contract sent, signed online, and filed automatically. Your calendar updates. You're booked. The whole process takes less time than finding a parking spot." },
  ]

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

        {/* 3-step grid */}
        <div className="rounded-2xl overflow-hidden" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="relative p-8 md:p-9 transition-colors duration-200"
              style={{ background: '#080612' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(108,46,219,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#080612')}
            >
              <div
                className="w-8 h-8 flex items-center justify-center rounded-lg mb-5 text-[13px] font-bold"
                style={{ background: 'rgba(108,46,219,0.15)', border: '1px solid rgba(108,46,219,0.3)', color: '#a78bfa' }}
              >
                {step.num}
              </div>
              <h3 className="text-lg font-semibold text-white/90 mb-3">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{step.body}</p>

              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 w-6 h-6 rounded-full items-center justify-center" style={{ background: '#6C2EDB', transform: 'translateY(-50%)' }}>
                  <ArrowRight weight="bold" className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 5: FEATURES ---------- */
function FeaturesSection() {
  const cards: { component: React.ComponentType<{ className?: string }>; label: string; title: string; body: string }[] = [
    { component: DashboardMock, label: 'Lead Management', title: 'Every lead, always visible', body: "From first inquiry to signed contract. Know exactly where every potential client is in your pipeline — without building a spreadsheet to track your spreadsheet." },
    { component: QuoteMock, label: 'Quote Builder', title: 'Quotes that close', body: "Professional proposals in 2 minutes. Your packages, your pricing, your brand. Clients approve online — no attachments, no printing, no excuses not to reply." },
    { component: PortalMock, label: 'Online Contracts', title: 'Signed before they change their mind', body: 'Send a contract and get it back signed — from any device, in minutes. No printing. No scanning. No "I\'ll get it back to you this week."' },
  ]

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
          No switching between apps. No copy-pasting. No "where did I put that contract." Everything is connected — and it remembers, so you don't have to.
        </p>

        {/* Hero screenshot frame */}
        <div className="max-w-[860px] mx-auto mb-12">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#100D20',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(108,46,219,0.15), 0 40px 80px rgba(0,0,0,0.7), 0 0 120px rgba(108,46,219,0.08)',
            }}
          >
            <div className="flex items-center gap-2 px-4 h-10" style={{ background: '#0C0A1A', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-[5px]">
                <span className="w-[11px] h-[11px] rounded-full" style={{ background: '#FF5F57' }} />
                <span className="w-[11px] h-[11px] rounded-full" style={{ background: '#FFBD2E' }} />
                <span className="w-[11px] h-[11px] rounded-full" style={{ background: '#28CA41' }} />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-[5px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#28CA41' }} />
                  <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>app.kolorstudio.com/dashboard</span>
                </div>
              </div>
            </div>
            <div style={{ minHeight: 340 }}>
              <DashboardMock data-testid="screenshot-dashboard" />
            </div>
          </div>
        </div>

        {/* 3 feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="feature-cards">
          {cards.map((card, i) => (
            <div
              key={i}
              className="rounded-[14px] overflow-hidden group transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,46,219,0.3)'; e.currentTarget.style.background = 'rgba(108,46,219,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            >
              <div className="overflow-hidden" style={{ aspectRatio: '16/10', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <card.component />
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: '#a78bfa' }}>{card.label}</span>
                <h3 className="text-base font-semibold text-white/90 mt-1 mb-2">{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 6: TESTIMONIALS ---------- */
function TestimonialsSection() {
  return (
    <section className="reveal-section" style={{ padding: '100px 24px' }} data-testid="testimonials-section">
      <div className="max-w-[1000px] mx-auto">
        <SectionLabel>From the studio</SectionLabel>

        <h2 className="font-display font-extrabold tracking-[-0.025em] mb-10" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15 }}>
          <span style={{ background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Real creatives.
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Real results.
          </span>
        </h2>

        {/* Featured + 2 stacked */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mb-4">
          <TestimonialCard
            quote="I used to spend Sunday nights drowning in spreadsheets and unanswered emails. Now I open KOLOR on Monday morning and everything is just — there. My leads, my quotes, what needs attention. I booked 4 weddings in my first month."
            name="Sophie L."
            title="Wedding photographer, Cape Town"
            featured
          />
          <div className="flex flex-col gap-4">
            <TestimonialCard
              quote="Sent my first quote in literally 90 seconds. Client signed the contract the same afternoon. That's never happened with my old process."
              name="James M."
              title="Commercial photographer, London"
            />
            <TestimonialCard
              quote="Finally a CRM that doesn't look like it was designed for a car dealership. My clients notice the difference when they receive a KOLOR quote."
              name="Nadia D."
              title="Brand designer, Paris"
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { q: '"I haven\'t missed a follow-up in three months. My booking rate went from 30% to over 60%."', n: 'Marcus T.', t: 'Portrait photographer, New York' },
            { q: '"Dubsado was powerful but I needed a PhD to set it up. KOLOR was running in an afternoon."', n: 'Priya S.', t: 'Interior designer, Mumbai' },
            { q: '"The discovery call workflow alone is worth the price. My clients book themselves."', n: 'Léa K.', t: 'Fashion photographer, Paris' },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-sm italic leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.q}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>— {item.n}, <span className="italic">{item.t}</span></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ quote, name, title, featured = false }: { quote: string; name: string; title: string; featured?: boolean }) {
  return (
    <div
      className="relative rounded-[14px] p-7 transition-all duration-200 flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,46,219,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
    >
      <span className="absolute top-4 right-6 font-display font-extrabold select-none" style={{ fontSize: 60, color: 'rgba(108,46,219,0.07)', lineHeight: 1 }}>&ldquo;</span>
      <p className={`relative z-10 italic leading-relaxed flex-1 ${featured ? 'text-[17px]' : 'text-sm'}`} style={{ color: 'rgba(255,255,255,0.5)' }}>
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm font-medium text-white/70">— {name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{title}</p>
      </div>
    </div>
  )
}

/* ---------- SECTION 7: URGENCY / BETA PRICING ---------- */
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

          <h2 className="font-display font-extrabold tracking-[-0.025em] mb-8 mx-auto" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15, maxWidth: 560, background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Limited spots. Unlimited upside.
          </h2>

          <p className="text-[15px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Beta pricing closes in</p>

          {/* Countdown with dark overrides */}
          <div className="landing-countdown">
            <CountdownTimer endDate={endDate} />
          </div>

          {/* Pricing cards row */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mt-10">
            {/* Free tier */}
            <div className="rounded-2xl p-7 text-left flex-1 max-w-[280px] mx-auto sm:mx-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] uppercase tracking-[0.08em] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>First 20 spots</div>
              <div className="text-4xl font-extrabold text-white mb-1">Free</div>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Free forever — no catch, no credit card, no expiry</p>
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

            {/* Paid tier */}
            <div className="rounded-2xl p-7 text-left flex-1 max-w-[280px] mx-auto sm:mx-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] uppercase tracking-[0.08em] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Spots 21–50</div>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-white">$9</span>
                <span className="text-base" style={{ color: 'rgba(255,255,255,0.3)' }}>/mo</span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Beta rate, locked in for life</p>
              <div className="h-[26px] mb-5" /> {/* spacer to align with scarcity badge */}
              <button
                className="w-full font-medium py-3 rounded-lg text-sm transition-all duration-150"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Join the waitlist
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
    <section className="reveal-section text-center" style={{ padding: '100px 24px' }} data-testid="final-cta-section">
      <div className="max-w-2xl mx-auto">
        <h2
          className="font-display font-extrabold tracking-[-0.025em] mb-6"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1 }}
        >
          <span style={{ background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your clients deserve<br />a better experience.<br />
          </span>
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            So do you.
          </span>
        </h2>

        <p className="mx-auto mb-10 leading-relaxed" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 440 }}>
          Join 20+ creative professionals already running their studio with KOLOR. Start free — no credit card, no setup fee, no spreadsheets.
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
          Free forever for the first 20 &nbsp;&middot;&nbsp; No credit card &nbsp;&middot;&nbsp; 5-minute setup
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
        </div>
      </div>
    </footer>
  )
}
