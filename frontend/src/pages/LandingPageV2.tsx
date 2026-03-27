import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  EnvelopeSimple,
  FileText,
  CalendarBlank,
  Users,
  Sparkle,
  ArrowRight,
  Check,
  X,
  Star,
  Timer,
  Play,
} from '@phosphor-icons/react'
import { CountdownTimer } from '../components/CountdownTimer'

/* ---------- scroll-reveal hook ---------- */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ---------- animated counter ---------- */
function Counter({ end, suffix = '', prefix = '', duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const { ref, visible } = useReveal(0.3)
  useEffect(() => {
    if (!visible) return
    let start: number
    let frame: number
    const animate = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setCount(Math.floor(p * end))
      if (p < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [visible, end, duration])
  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

/* ---------- star rating ---------- */
function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} weight="fill" className="w-4 h-4 text-amber-400" />
      ))}
    </div>
  )
}

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

/* ================================================================
   LANDING PAGE
   ================================================================ */
export default function LandingPageV2() {
  const navigate = useNavigate()
  const goSignup = () => navigate('/signup')

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-x-hidden">
      <Nav onCta={goSignup} />
      <HeroSection onCta={goSignup} />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <TestimonialsSection />
      <StatsSection />
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
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-surface-base/80 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}
      data-testid="landing-nav"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className={`font-heading font-extrabold text-xl tracking-tight transition-colors duration-300 ${scrolled ? 'text-brand-700' : 'text-white'}`}>
          KOLOR <span className={scrolled ? 'text-text-primary' : 'text-white/90'}>STUDIO</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className={`text-sm font-medium transition-colors ${scrolled ? 'text-text-secondary hover:text-text-primary' : 'text-white/80 hover:text-white'}`} data-testid="nav-login">
            Log in
          </Link>
          <button
            onClick={onCta}
            className={`text-sm font-semibold px-5 py-2.5 rounded-lg transition-all ${
              scrolled
                ? 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-lg hover:shadow-brand-600/25'
                : 'bg-white text-brand-700 hover:bg-brand-50 shadow-lg shadow-black/10'
            }`}
            data-testid="nav-cta"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    </nav>
  )
}

/* ---------- SECTION 1: HERO ---------- */
function HeroSection({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden" data-testid="hero-section">
      {/* gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-60" />

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* copy */}
        <div className="text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium text-white/90 mb-6">
            <Sparkle weight="fill" className="w-3.5 h-3.5 text-amber-300" /> Now in Beta — Free for Early Adopters
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight mb-6" data-testid="hero-headline">
            Stop Losing Clients to&nbsp;Messy&nbsp;Workflows
          </h1>
          <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-xl">
            KOLOR Studio manages your leads, quotes, and bookings automatically — so you can focus on creating stunning work, not chasing invoices.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <button
              onClick={onCta}
              className="bg-surface-base text-brand-700 font-bold px-7 py-3.5 rounded-xl text-base hover:bg-brand-50 transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 hover:-translate-y-0.5"
              data-testid="hero-cta-primary"
            >
              Start Free Trial <ArrowRight weight="bold" className="w-4 h-4 inline ml-1" />
            </button>
            <button
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-all"
              data-testid="hero-cta-secondary"
            >
              <Play weight="fill" className="w-4 h-4" /> Watch 60s Demo
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/70">
            <div className="flex -space-x-2">
              {['bg-pink-400','bg-amber-400','bg-teal-400','bg-sky-400'].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white/30 flex items-center justify-center text-xs font-bold text-white`}>
                  {['S','M','E','D'][i]}
                </div>
              ))}
            </div>
            <div>
              <span className="text-white font-medium">Trusted by 100+ creatives</span>
              <div className="flex items-center gap-1"><Stars /> <span>4.9/5</span></div>
            </div>
          </div>
        </div>

        {/* hero image */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute -inset-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10" />
            <img
              src="/screenshots/dashboard-overview.webp"
              alt="KOLOR Studio Dashboard"
              className="relative rounded-xl shadow-2xl shadow-black/30 border border-white/10 w-full"
              data-testid="hero-image"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 2: PROBLEM ---------- */
function ProblemSection() {
  const { ref, visible } = useReveal()
  const pains = [
    'Forgetting to follow up with inquiries (and losing money)',
    'Spending 30 minutes crafting each quote manually',
    'Double-booking client meetings and scrambling to reschedule',
    'Chasing clients for signatures on email-attached contracts',
    'Juggling Gmail, Google Sheets, and 5 different tools',
  ]

  return (
    <section className="py-20 lg:py-28 bg-surface-base" data-testid="problem-section">
      <div ref={ref} className={`max-w-3xl mx-auto px-6 text-center transition-all duration-slow ease-standard ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-primary mb-12">Sound Familiar?</h2>

        <div className="space-y-4 text-left max-w-xl mx-auto mb-12">
          {pains.map((p, i) => (
            <div key={i} className="flex items-start gap-3 group" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <X weight="bold" className="w-3.5 h-3.5 text-red-500" />
              </div>
              <p className="text-text-secondary leading-relaxed">{p}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-2xl p-8 border border-brand-100">
          <p className="text-text-primary font-medium leading-relaxed text-lg">
            Every missed follow-up is lost revenue.<br />
            Every double-booking dents your credibility.
          </p>
          <p className="text-brand-700 font-semibold mt-4">
            You didn't become a creative professional to be buried in workflows.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 3: SOLUTION ---------- */
function SolutionSection() {
  const { ref, visible } = useReveal()
  const steps = [
    { icon: EnvelopeSimple, title: 'Capture Every Inquiry', desc: 'Leads flow into your dashboard automatically. Never lose another inquiry to a cluttered inbox.' },
    { icon: FileText, title: 'Quote in 2 Minutes', desc: 'Professional quotes with your branding, sent in clicks. No more custom Word docs or manual calculations.' },
    { icon: CalendarBlank, title: 'Book & Get Paid', desc: 'Clients book calls, sign contracts, and pay deposits — all from a stunning client portal.' },
  ]

  return (
    <section className="py-20 lg:py-28 bg-[#fafafa]" data-testid="solution-section">
      <div ref={ref} className={`max-w-6xl mx-auto px-6 transition-all duration-slow ease-standard ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-primary mb-4">
            KOLOR Studio Handles the Business,<br className="hidden sm:block" /> So You Can Focus on the Craft
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Automated workflows, intelligent scheduling, and professional client experiences — all in one beautifully designed platform.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative bg-surface-base rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-6 right-6 text-5xl font-heading font-extrabold text-brand-100 select-none">{i + 1}</div>
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-5 group-hover:bg-brand-100 transition-colors">
                <s.icon weight="duotone" className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-text-primary mb-2">{s.title}</h3>
              <p className="text-text-secondary leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 4: FEATURES ---------- */
function FeaturesSection() {
  const { ref, visible } = useReveal()

  return (
    <section className="py-20 lg:py-28 bg-surface-base" data-testid="features-section">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 transition-all duration-slow ease-standard ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-primary mb-4">
            Everything You Need to Run Your Creative Business
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            From first inquiry to final payment, KOLOR handles it all — so you can focus on your craft.
          </p>
        </div>

        {/* Hero screenshot with browser chrome + floating pills */}
        <div className="relative max-w-4xl mx-auto mb-20" data-testid="screenshot-hero-frame">
          {/* Browser chrome frame */}
          <div className="rounded-xl border border-border shadow-hover overflow-hidden bg-surface-base">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 h-9 bg-surface-hover border-b border-border">
              <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#28CA41' }} />
              <div className="flex-1 flex justify-center">
                <span className="text-xs text-text-tertiary font-medium bg-surface-base border border-border rounded-md px-3 py-0.5">app.kolorstudio.com/dashboard</span>
              </div>
            </div>
            {/* Screenshot */}
            <img
              src="/screenshots/dashboard-overview.webp"
              alt="KOLOR Studio Dashboard — leads, quotes, contracts at a glance"
              className="w-full"
              loading="lazy"
              data-testid="screenshot-dashboard"
            />
          </div>

          {/* Floating activity pills */}
          <div className="hidden lg:block absolute -bottom-4 -left-6 animate-float z-10" style={{ animationDelay: '0s' }}>
            <div className="flex items-center gap-2 bg-surface-base border border-border rounded-full px-4 py-2 shadow-card">
              <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
              <span className="text-sm font-medium text-text-primary whitespace-nowrap">Quote accepted &middot; $4,200</span>
            </div>
          </div>
          <div className="hidden lg:block absolute -top-3 -right-6 animate-float z-10" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-2 bg-surface-base border border-border rounded-full px-4 py-2 shadow-card">
              <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0" />
              <span className="text-sm font-medium text-text-primary whitespace-nowrap">New inquiry &middot; Anika K.</span>
            </div>
          </div>
          <div className="hidden lg:block absolute -bottom-4 -right-6 animate-float z-10" style={{ animationDelay: '2s' }}>
            <div className="flex items-center gap-2 bg-surface-base border border-border rounded-full px-4 py-2 shadow-card">
              <span className="w-2 h-2 rounded-full bg-info flex-shrink-0" />
              <span className="text-sm font-medium text-text-primary whitespace-nowrap">Contract signed &#10003;</span>
            </div>
          </div>
        </div>

        {/* Three feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="feature-cards">
          {[
            { img: '/screenshots/dashboard-overview.webp', label: 'Lead Management', title: 'Every lead, always visible', desc: 'From first inquiry to signed contract. No spreadsheet, no sticky notes, no lost clients.', color: 'text-brand-600' },
            { img: '/screenshots/quote-builder.webp', label: 'Quote Builder', title: 'Professional quotes in 2 minutes', desc: "Line items, packages, discounts. Send a polished proposal before your competitor finds their spreadsheet.", color: 'text-brand-600' },
            { img: '/screenshots/client-portal.webp', label: 'Online Contracts', title: 'Clients sign from any device', desc: "No printing. No scanning. No back-and-forth. They click, sign, and you get paid.", color: 'text-brand-600' },
          ].map((card, i) => (
            <div key={i} className="bg-surface-base border border-border rounded-xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 group">
              <div className="overflow-hidden aspect-video">
                <img src={card.img} alt={card.title} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" />
              </div>
              <div className="p-6">
                <span className={`text-xs font-bold uppercase tracking-wider ${card.color}`}>{card.label}</span>
                <h3 className="font-bold text-lg text-text-primary mt-1 mb-2">{card.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 5: TESTIMONIALS ---------- */
function TestimonialsSection() {
  const { ref, visible } = useReveal()
  const testimonials = [
    {
      quote: "Honestly? KOLOR changed everything. I used to send quotes via Google Docs and pray they'd respond. Now I book discovery calls first, understand exactly what they want, then send a custom quote through the portal. My acceptance rate went from 42% to 81%. That's not a typo. 81%.",
      name: 'Sarah Chen',
      title: 'Wedding Photographer, Los Angeles, CA',
      sub: '15 years experience | 200+ weddings',
      color: 'bg-pink-100 text-pink-600',
      initial: 'S',
    },
    {
      quote: "I was drowning in spreadsheets. Literally spending 2 hours a day on admin — follow-ups, quotes, scheduling. KOLOR automated all of it. Now? 15 minutes. That's 10 extra hours per week. I booked 8 additional sessions last month with that time. Do the math.",
      name: 'Marcus Williams',
      title: 'Portrait & Headshot Photographer, Austin, TX',
      sub: '500+ corporate clients | Featured in PDN',
      color: 'bg-amber-100 text-amber-600',
      initial: 'M',
    },
    {
      quote: "My clients think I'm way more established than I am. The portal makes me look like a million-dollar agency. They click one link, review the proposal, sign the contract, pay the deposit — all in 5 minutes. THREE clients told me they chose me because of how professional my process was.",
      name: 'Elena Rodriguez',
      title: 'Brand & Identity Designer, Miami, FL',
      sub: 'Branding for startups | 50+ clients',
      color: 'bg-emerald-100 text-emerald-600',
      initial: 'E',
    },
    {
      quote: "I shoot 3-4 events a week. Keeping track of deposits, contracts, deliverables — it was chaos. Now everything's in one place. Client uploads event details, I deliver photos through the portal, they approve, I get paid. No more 'did you get my email?' messages.",
      name: 'David Kim',
      title: 'Event & Conference Photographer, Seattle, WA',
      sub: '250+ corporate events | 20 years in business',
      color: 'bg-sky-100 text-sky-600',
      initial: 'D',
    },
    {
      quote: "The discovery call feature is GENIUS. I used to quote everyone who emailed, then spend 30 min explaining my process. Now I book a 15-min call, qualify them, and THEN send a detailed quote to serious clients. My close rate is insane now. KOLOR basically runs my business.",
      name: 'Aisha Patel',
      title: 'Fashion & Editorial Photographer, NYC',
      sub: 'Published in Vogue, Harper\'s',
      color: 'bg-violet-100 text-violet-600',
      initial: 'A',
    },
    {
      quote: "Real talk: I made an extra $6,200 last month because KOLOR gave me back my time. I was spending 12 hours a week on proposals, invoices, and chasing signatures. Now it's automated. I took those 12 hours and booked 3 more clients. The ROI is stupid good.",
      name: 'Jordan Miller',
      title: 'Graphic & Web Designer, Denver, CO',
      sub: '100+ small business clients',
      color: 'bg-rose-100 text-rose-600',
      initial: 'J',
    },
  ]

  return (
    <section className="py-20 lg:py-28 bg-[#fafafa]" data-testid="testimonials-section">
      <div ref={ref} className={`max-w-6xl mx-auto px-6 transition-all duration-slow ease-standard ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-primary mb-4">
            Join 100+ Creative Professionals Who've Taken Back Their&nbsp;Time
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-surface-base rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <Stars />
              <p className="text-text-secondary text-sm leading-relaxed mt-4 flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-bold text-sm`}>{t.initial}</div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                  <p className="text-xs text-text-tertiary">{t.title}</p>
                  <p className="text-xs text-text-tertiary">{t.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 6: STATS ---------- */
function StatsSection() {
  const { ref, visible } = useReveal()
  const stats = [
    { value: 78, suffix: '%', label: 'Average Quote Acceptance Rate', sub: '(Industry average: 40%)' },
    { value: 10, suffix: ' hrs', label: 'Saved Per Week on Admin', sub: "(That's 2 extra shoots/month)" },
    { value: 2, suffix: ' min', label: 'Average Quote Creation Time', sub: '(Down from 30 minutes)' },
    { value: 4, prefix: '$', suffix: ',000+', label: 'Average Monthly Revenue Increase', sub: '(From reclaimed time)' },
  ]

  return (
    <section className="py-20 lg:py-28 bg-surface-base" data-testid="stats-section">
      <div ref={ref} className={`max-w-5xl mx-auto px-6 transition-all duration-slow ease-standard ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-gradient-to-b from-brand-50/60 to-white border border-brand-100">
              <div className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-600 mb-2">
                {visible ? <Counter end={s.value} prefix={s.prefix || ''} suffix={s.suffix} /> : `${s.prefix || ''}0${s.suffix}`}
              </div>
              <p className="text-sm font-medium text-text-primary">{s.label}</p>
              <p className="text-xs text-text-tertiary mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 7: URGENCY ---------- */
function UrgencySection({ onCta }: { onCta: () => void }) {
  const { ref, visible } = useReveal()
  const endDate = getBetaEndDate()

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-brand-700 via-brand-800 to-indigo-900 relative overflow-hidden" data-testid="urgency-section">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-40" />

      <div ref={ref} className={`relative max-w-3xl mx-auto px-6 text-center transition-all duration-slow ease-standard ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 mb-6 uppercase tracking-wider">
          <Timer weight="fill" className="w-4 h-4 text-amber-300" /> Beta Launch Special
        </div>

        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-white mb-3">
          Limited Beta Access — Lock In Your&nbsp;Spot
        </h2>
        <p className="text-white/70 mb-8">Beta pricing expires in:</p>

        <CountdownTimer endDate={endDate} />

        <div className="mt-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
          <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
            {[
              { label: 'First 20 Users:', value: 'FREE FOREVER', bold: true },
              { label: 'Users 21–50:', value: '$9/month (Regular price: $29/month)', bold: false },
              { label: '', value: 'No credit card required to start', bold: false },
              { label: '', value: "Cancel anytime (but you won't want to)", bold: false },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Check weight="bold" className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90 text-sm">
                  {b.label && <span className={b.bold ? 'font-bold text-white' : 'font-medium'}>{b.label} </span>}
                  {b.bold ? <span className="text-emerald-300 font-bold">{b.value}</span> : b.value}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={onCta}
            className="bg-surface-base text-brand-700 font-bold px-8 py-4 rounded-xl text-base hover:bg-brand-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 w-full sm:w-auto"
            data-testid="urgency-cta"
          >
            Claim Your Free Account <ArrowRight weight="bold" className="w-4 h-4 inline ml-1" />
          </button>

          <p className="text-amber-300/80 text-xs mt-4 font-medium">
            <Timer weight="fill" className="w-3.5 h-3.5 inline mr-1" /> Only 12 spots remaining
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- SECTION 8: FINAL CTA ---------- */
function FinalCTA({ onCta }: { onCta: () => void }) {
  const { ref, visible } = useReveal()
  const badges = [
    'Set up in 5 minutes',
    'No credit card needed',
    'Import your existing leads',
    'Free onboarding support',
  ]
  const snippets = [
    { text: '"Best CRM for creatives I\'ve ever used"', name: 'Jessica M.' },
    { text: '"Paid for itself in week one"', name: 'David K.' },
    { text: '"My clients love the portal"', name: 'Aisha P.' },
  ]

  return (
    <section className="py-20 lg:py-28 bg-surface-base" data-testid="final-cta-section">
      <div ref={ref} className={`max-w-3xl mx-auto px-6 text-center transition-all duration-slow ease-standard ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-primary mb-4">
          Ready to Stop Losing Time and Money on&nbsp;Admin?
        </h2>
        <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">
          Join 100+ photographers and designers who've automated their business and reclaimed 10+ hours per week.
        </p>

        <button
          onClick={onCta}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5"
          data-testid="final-cta-btn"
        >
          Start Your Free Account <ArrowRight weight="bold" className="w-5 h-5 inline ml-1" />
        </button>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Check weight="bold" className="w-4 h-4 text-emerald-500" /> {b}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-gray-100">
          {snippets.map((s, i) => (
            <div key={i} className="text-sm text-text-tertiary">
              <Stars /><span className="italic">{s.text}</span> — <span className="font-medium text-text-secondary">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12" data-testid="footer">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-heading font-extrabold text-lg text-white tracking-tight">KOLOR <span className="text-brand-400">STUDIO</span></span>
            <p className="text-sm mt-1">&copy; {new Date().getFullYear()} KOLOR Studio. All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:hello@kolorstudio.app" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
