import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkle,
  FileText,
  PencilSimple,
  CurrencyDollar,
  CheckCircle,
  ArrowRight,
  Heartbeat,
  EnvelopeSimple,
  ChartBar,
} from '@phosphor-icons/react'
import Footer from '../components/Footer'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-light-50" data-testid="landing-page">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20" data-testid="landing-nav">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Sparkle weight="fill" className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">KOLOR STUDIO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              data-testid="nav-login-link"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-white text-purple-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-all shadow-lg"
              data-testid="nav-signup-link"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── SECTION 1: HERO ─── */}
      <section
        className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden"
        data-testid="hero-section"
      >
        {/* Decorative blobs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight"
            data-testid="hero-headline"
          >
            Your CRM Should Work
            <br />
            <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
              Harder Than You Do
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto"
            data-testid="hero-subheadline"
          >
            Autopilot quotes, contracts, and payments for photographers, artists, and designers.
            <br className="hidden sm:block" />
            So you can focus on creating, not chasing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/signup"
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-elevation-3 hover:scale-105 transition-all inline-flex items-center gap-2"
              data-testid="hero-cta-primary"
            >
              Start Free Trial <ArrowRight weight="bold" className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="border-2 border-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
              data-testid="hero-cta-secondary"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/60 text-sm mt-8"
          >
            Join 1,000+ creatives who stopped chasing clients
          </motion.p>
        </div>
      </section>

      {/* ─── SECTION 2: PROBLEM ─── */}
      <section className="py-20 md:py-24 bg-light-50" data-testid="problem-section">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-3xl sm:text-4xl font-bold text-text-primary mb-6"
          >
            You Didn't Become a Creative to Do Admin
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-lg sm:text-xl text-text-secondary mb-12 max-w-2xl mx-auto"
          >
            But you're spending 20+ hours a week on quotes, follow-ups, contracts,
            and payment reminders instead of your craft.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <PainCard
              icon={<Heartbeat weight="duotone" className="w-8 h-8 text-red-500" />}
              bg="bg-red-50"
              title="Chasing Payments"
              desc="Manually reminding clients to pay invoices"
              index={2}
            />
            <PainCard
              icon={<EnvelopeSimple weight="duotone" className="w-8 h-8 text-amber-500" />}
              bg="bg-amber-50"
              title="Endless Follow-Ups"
              desc='Writing the same "just checking in" emails'
              index={3}
            />
            <PainCard
              icon={<ChartBar weight="duotone" className="w-8 h-8 text-blue-500" />}
              bg="bg-blue-50"
              title="Spreadsheet Hell"
              desc="Tracking everything manually in Google Sheets"
              index={4}
            />
          </div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={5}
            className="text-xl sm:text-2xl font-bold text-text-primary"
          >
            There's a better way.
          </motion.p>
        </div>
      </section>

      {/* ─── SECTION 3: SOLUTION ─── */}
      <section
        className="py-20 md:py-24 bg-gradient-to-br from-purple-50/50 to-cyan-50/50"
        data-testid="solution-section"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="text-3xl sm:text-4xl font-bold text-text-primary mb-4"
            >
              Complete Autopilot from Inquiry to Payment
            </motion.h2>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="text-lg sm:text-xl text-text-secondary"
            >
              Your CRM handles everything while you create
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <FeatureCard
              icon={<FileText weight="duotone" className="w-8 h-8 text-[#F59E0B]" />}
              iconBg="from-amber-100 to-amber-200"
              title="Instant Professional Quotes"
              desc="Send beautiful, branded quotes in seconds. Your CRM follows up automatically if clients don't respond."
              tags={[
                { label: '3-email sequence', color: 'bg-amber-100 text-amber-700' },
                { label: 'Auto follow-up', color: 'bg-purple-100 text-purple-700' },
              ]}
              index={0}
            />
            <FeatureCard
              icon={<PencilSimple weight="duotone" className="w-8 h-8 text-[#6366F1]" />}
              iconBg="from-indigo-100 to-indigo-200"
              title="Digital Contracts That Sign Themselves"
              desc="Clients sign online in 30 seconds. No printing, scanning, or chasing signatures."
              tags={[
                { label: 'E-signature', color: 'bg-indigo-100 text-indigo-700' },
                { label: 'Auto-send', color: 'bg-purple-100 text-purple-700' },
              ]}
              index={1}
            />
            <FeatureCard
              icon={<CurrencyDollar weight="duotone" className="w-8 h-8 text-[#06B6D4]" />}
              iconBg="from-cyan-100 to-cyan-200"
              title="Payments on Autopilot"
              desc="Stripe integration handles deposits and final payments. Get paid faster without asking."
              tags={[
                { label: 'Stripe powered', color: 'bg-cyan-100 text-cyan-700' },
                { label: 'Auto-reminders', color: 'bg-purple-100 text-purple-700' },
              ]}
              index={2}
            />
            <FeatureCard
              icon={<CheckCircle weight="duotone" className="w-8 h-8 text-[#10B981]" />}
              iconBg="from-green-100 to-green-200"
              title="Client Portals They'll Love"
              desc="Beautiful branded portals where clients view quotes, sign contracts, and make payments. No back-and-forth emails."
              tags={[
                { label: 'Your branding', color: 'bg-green-100 text-green-700' },
                { label: 'Mobile-friendly', color: 'bg-purple-100 text-purple-700' },
              ]}
              index={3}
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: HOW IT WORKS ─── */}
      <section className="py-20 md:py-24 bg-light-50" id="how-it-works" data-testid="how-it-works-section">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-16"
          >
            From Inquiry to Payment in 3 Clicks
          </motion.h2>

          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-creative rounded-full hidden md:block" />

            <div className="space-y-10 md:space-y-12 relative">
              <Step
                num={1}
                color="bg-purple-500"
                title="Create Quote"
                desc="Add line items, set pricing. Your CRM generates a beautiful quote and client portal."
                index={1}
              />
              <Step
                num={2}
                color="bg-[#06B6D4]"
                title="Autopilot Takes Over"
                desc="Follow-up emails, contract sending, payment reminders — all automatic. You do nothing."
                index={2}
              />
              <Step
                num={3}
                color="bg-[#10B981]"
                title="Get Paid, Start Creating"
                desc="Client signs, pays deposit, you get notification. Focus on your craft, not admin."
                index={3}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: PRICING ─── */}
      <section
        className="py-20 md:py-24 bg-gradient-to-br from-purple-50/50 to-cyan-50/50"
        data-testid="pricing-section"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="text-3xl sm:text-4xl font-bold text-text-primary mb-4"
            >
              Simple Pricing for Creatives
            </motion.h2>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="text-lg sm:text-xl text-text-secondary"
            >
              First 20 beta users get FREE FOREVER
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="bg-white rounded-2xl p-8 border-2 border-light-200 shadow-elevation-1"
              data-testid="pricing-free"
            >
              <h3 className="text-2xl font-bold text-text-primary mb-2">Free</h3>
              <p className="text-text-secondary mb-6">For trying it out</p>
              <p className="text-5xl font-bold text-text-primary mb-6">$0</p>
              <ul className="space-y-3 mb-8 text-text-secondary">
                <PricingItem text="3 active projects" />
                <PricingItem text="Basic autopilot" />
                <PricingItem text="Client portals" />
              </ul>
              <Link
                to="/signup"
                className="block w-full py-3 border-2 border-light-200 rounded-xl font-semibold text-text-primary hover:bg-light-100 transition-colors text-center"
                data-testid="pricing-free-cta"
              >
                Start Free
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={3}
              className="bg-gradient-brand text-white rounded-2xl p-8 shadow-elevation-3 relative"
              data-testid="pricing-pro"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#10B981] text-white text-sm font-bold rounded-full whitespace-nowrap">
                BETA SPECIAL
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-white/80 mb-6">For serious creatives</p>
              <p className="text-5xl font-bold mb-2">$29</p>
              <p className="text-white/80 mb-6">per month</p>
              <ul className="space-y-3 mb-8">
                <PricingItemWhite text="Unlimited projects" />
                <PricingItemWhite text="Full autopilot sequences" />
                <PricingItemWhite text="Custom branding" />
                <PricingItemWhite text="Priority support" />
              </ul>
              <Link
                to="/signup"
                className="block w-full py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-elevation-3 transition-all text-center"
                data-testid="pricing-pro-cta"
              >
                Start Free Trial <span aria-hidden>→</span>
              </Link>
            </motion.div>

            {/* Studio */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={4}
              className="bg-white rounded-2xl p-8 border-2 border-light-200 shadow-elevation-1"
              data-testid="pricing-studio"
            >
              <h3 className="text-2xl font-bold text-text-primary mb-2">Studio</h3>
              <p className="text-text-secondary mb-6">For growing studios</p>
              <p className="text-5xl font-bold text-text-primary mb-6">$79</p>
              <ul className="space-y-3 mb-8 text-text-secondary">
                <PricingItem text="Everything in Pro" />
                <PricingItem text="Team collaboration" />
                <PricingItem text="Advanced analytics" />
                <PricingItem text="White label option" />
              </ul>
              <Link
                to="/signup"
                className="block w-full py-3 border-2 border-light-200 rounded-xl font-semibold text-text-primary hover:bg-light-100 transition-colors text-center"
                data-testid="pricing-studio-cta"
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: FINAL CTA ─── */}
      <section className="py-20 md:py-24 bg-gradient-hero" data-testid="final-cta-section">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-4xl sm:text-5xl font-bold text-white mb-6"
          >
            Stop Chasing. Start Creating.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-lg sm:text-xl text-white/90 mb-12"
          >
            Join 1,000+ photographers, artists, and designers who let their CRM work harder than they do.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/signup"
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-elevation-3 hover:scale-105 transition-all inline-flex items-center gap-2"
              data-testid="final-cta-button"
            >
              Start Free Trial <ArrowRight weight="bold" className="w-5 h-5" />
            </Link>
            <p className="text-white/60 text-sm">
              No credit card required &bull; First 20 users FREE FOREVER
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

/* ─── Sub-components ─── */

function PainCard({
  icon,
  bg,
  title,
  desc,
  index,
}: {
  icon: React.ReactNode
  bg: string
  title: string
  desc: string
  index: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={index}
      className="bg-white rounded-xl p-6 border border-light-200 shadow-elevation-1"
      data-testid={`pain-card-${index}`}
    >
      <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
        {icon}
      </div>
      <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm">{desc}</p>
    </motion.div>
  )
}

function FeatureCard({
  icon,
  iconBg,
  title,
  desc,
  tags,
  index,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  desc: string
  tags: { label: string; color: string }[]
  index: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={index}
      className="bg-white rounded-2xl p-8 shadow-elevation-2 hover:shadow-elevation-3 transition-shadow"
      data-testid={`feature-card-${index}`}
    >
      <div
        className={`w-16 h-16 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center mb-6`}
      >
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">{title}</h3>
      <p className="text-text-secondary mb-4">{desc}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {tags.map((t) => (
          <span key={t.label} className={`px-2 py-1 ${t.color} rounded-full text-xs font-medium`}>
            {t.label}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

function Step({
  num,
  color,
  title,
  desc,
  index,
}: {
  num: number
  color: string
  title: string
  desc: string
  index: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={index}
      className="flex gap-6 items-start"
      data-testid={`step-${num}`}
    >
      <div
        className={`w-16 h-16 ${color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-elevation-2 relative z-10 flex-shrink-0`}
      >
        {num}
      </div>
      <div className="flex-1 bg-white rounded-xl p-6 shadow-elevation-1">
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary">{desc}</p>
      </div>
    </motion.div>
  )
}

function PricingItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle weight="fill" className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </li>
  )
}

function PricingItemWhite({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle weight="fill" className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </li>
  )
}

export default LandingPage
