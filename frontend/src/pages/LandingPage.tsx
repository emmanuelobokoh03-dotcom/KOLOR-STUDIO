import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  LayoutDashboard, 
  MessageCircle, 
  BarChart3,
  ArrowRight,
  Check,
  Lock,
  Cloud,
  Star,
  ChevronDown,
  ChevronUp,
  X as XIcon,
  Mail,
  Quote,
  Globe,
  Zap
} from 'lucide-react'
import Footer from '../components/Footer'

const LandingPage = () => {
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // In production, this would call an API
      setEmailSubmitted(true)
      setEmail('')
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Sparkles className="w-8 h-8 text-brand-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary-light to-brand-primary-light bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link 
              to="/login" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/signup"
              className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary transition-all shadow-lg shadow-brand-primary-dark/30 hover:shadow-xl hover:shadow-brand-primary-dark/40"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="inline-block px-4 py-2 bg-brand-primary-dark/50 text-brand-primary-light rounded-full text-sm font-medium mb-6 border border-brand-primary-dark/50">
              The CRM that doesn't feel like a CRM
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold mb-6 leading-tight text-white"
          >
            Turn{' '}
            <span className="bg-gradient-to-r from-brand-primary-light to-brand-primary-light bg-clip-text text-transparent">
              creativity
            </span>
            {' '}into revenue
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-400 mb-10 leading-relaxed"
          >
            Built for creative professionals — photographers, videographers, designers, illustrators, and visual artists.
            <br />
            Manage leads, impress clients, and grow your creative business.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Link
                to="/signup"
                className="bg-brand-primary text-white px-8 py-4 rounded-xl hover:bg-brand-primary transition-all shadow-xl shadow-brand-primary-dark/30 hover:shadow-2xl hover:shadow-brand-primary-dark/40 flex items-center space-x-2 text-lg font-semibold"
              >
                <span>Start Managing Leads in 2 Minutes</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="border-2 border-dark-border text-gray-300 px-8 py-4 rounded-xl hover:border-gray-500 hover:bg-dark-card transition-all text-lg font-semibold">
                Watch demo
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              Join 200+ photographers, videographers, and designers who've ditched spreadsheets
            </p>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-4"
          >
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" /> Free forever</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" /> No credit card required</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" /> 2-minute setup</span>
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<LayoutDashboard className="w-6 h-6" />}
            title="Visual Pipeline"
            description="Drag-and-drop Kanban board that shows your entire business at a glance. Move leads from inquiry to booking with satisfaction."
            delay={0.1}
          />
          <FeatureCard
            icon={<MessageCircle className="w-6 h-6" />}
            title="Client Portal"
            description="Branded client experience that makes you look like a million-dollar studio. Real-time updates and seamless communication."
            delay={0.2}
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Smart Analytics"
            description="See pipeline value, conversion rates, and revenue trends. Know which services print money and which need work."
            delay={0.3}
          />
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-dark-card rounded-2xl shadow-xl p-12 border border-dark-border"
          >
            <h2 className="text-3xl font-bold mb-8 text-center text-white">
              Why creatives love KOLOR STUDIO
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Benefit text="No more losing leads in email chaos" />
              <Benefit text="Clients think you're way more professional" />
              <Benefit text="Pays for itself with one extra booking" />
              <Benefit text="Actually enjoy managing your business" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-brand-primary-dark/30 text-brand-primary-light rounded-full text-sm font-medium mb-4 border border-brand-primary-dark/30">
            Trusted by Creative Professionals Worldwide
          </span>
          <h2 className="text-4xl font-bold text-white mb-4">What our users say</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Don't just take our word for it — hear from creative professionals who've transformed their business
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <TestimonialCard
            quote="KOLOR STUDIO transformed how I manage my photography business. The client portal alone has helped me book 3x more projects!"
            author="Sarah Chen"
            role="Wedding Photographer"
            location="Los Angeles, CA"
            initials="SC"
            rating={5}
            delay={0.1}
          />
          <TestimonialCard
            quote="Finally, a CRM that doesn't feel overwhelming. I set it up in 10 minutes and sent my first quote the same day."
            author="Marcus Williams"
            role="Videographer & Content Creator"
            location="Miami, FL"
            initials="MW"
            rating={5}
            delay={0.2}
          />
          <TestimonialCard
            quote="My clients love the professional portal. It makes me look like a much bigger studio than I am!"
            author="Emma Rodriguez"
            role="Brand Designer"
            location="London, UK"
            initials="ER"
            rating={5}
            delay={0.3}
          />
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16"
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-white">200+</p>
            <p className="text-sm text-gray-400">Creative Professionals</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">1,000+</p>
            <p className="text-sm text-gray-400">Quotes Sent</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-brand-primary-light">₦500K+</p>
            <p className="text-sm text-gray-400">Revenue Managed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">98%</p>
            <p className="text-sm text-gray-400">User Satisfaction</p>
          </div>
        </motion.div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            KOLOR STUDIO vs. The Old Way
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Stop wasting time with spreadsheets, scattered emails, and manual follow-ups
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
            <div className="min-w-[600px]">
            <div className="grid grid-cols-3 bg-dark-bg-secondary border-b border-dark-border">
              <div className="p-4 text-gray-400 text-sm font-medium">Task</div>
              <div className="p-4 text-center text-gray-400 text-sm font-medium border-x border-dark-border">Spreadsheets</div>
              <div className="p-4 text-center text-brand-primary-light text-sm font-medium bg-brand-primary-dark/20">KOLOR STUDIO</div>
            </div>
            
            <ComparisonRow 
              task="Track leads & status" 
              old="Manual entry, easy to forget" 
              newWay="Visual Kanban, drag & drop" 
            />
            <ComparisonRow 
              task="Send professional quotes" 
              old="Word docs, inconsistent format" 
              newWay="Templates, PDF export, e-sign" 
            />
            <ComparisonRow 
              task="Client communication" 
              old="Buried in email inbox" 
              newWay="Branded portal, real-time updates" 
            />
            <ComparisonRow 
              task="Track revenue" 
              old="Formulas, prone to errors" 
              newWay="Automatic analytics dashboard" 
            />
            <ComparisonRow 
              task="Follow-up reminders" 
              old="Calendar reminders, easy to miss" 
              newWay="Built-in activity timeline" 
            />
            <ComparisonRow 
              task="Time to create quote" 
              old="30-60 minutes" 
              newWay="Under 5 minutes" 
              isLast
            />
            </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust & Security Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-green-900/30 text-green-300 rounded-full text-sm font-medium mb-4 border border-green-700/30">
              Built for Security & Reliability
            </span>
            <h2 className="text-4xl font-bold text-white mb-4">Your data is safe with us</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We take security seriously. Your client data is protected with the same standards used by banks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TrustCard
              icon={<Lock className="w-6 h-6" />}
              title="256-bit Encryption"
              description="Your data is secured with bank-level 256-bit SSL/TLS encryption"
            />
            <TrustCard
              icon={<Globe className="w-6 h-6" />}
              title="GDPR Compliant"
              description="We follow strict data protection standards and privacy regulations"
            />
            <TrustCard
              icon={<Cloud className="w-6 h-6" />}
              title="Daily Backups"
              description="Automated daily backups ensure you never lose your client data"
            />
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Got questions? We've got answers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-4"
        >
          <FAQItem
            question="Do I need a credit card to start?"
            answer="No! The free tier is free forever. No credit card required to sign up."
            isOpen={openFaq === 0}
            onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
          />
          <FAQItem
            question="Can I import my existing leads?"
            answer="Yes! You can manually add leads or contact us for help with bulk imports."
            isOpen={openFaq === 1}
            onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
          />
          <FAQItem
            question="What happens to my data if I cancel?"
            answer="You own your data. Export it anytime. We keep it for 30 days after cancellation, then it's permanently deleted."
            isOpen={openFaq === 2}
            onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
          />
          <FAQItem
            question="Do you offer refunds?"
            answer="Yes! 30-day money-back guarantee on all paid plans, no questions asked."
            isOpen={openFaq === 3}
            onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
          />
          <FAQItem
            question="Is my client data secure?"
            answer="Absolutely. We use bank-level encryption, daily backups, and SOC 2 compliant hosting."
            isOpen={openFaq === 4}
            onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
          />
          <FAQItem
            question="Can my clients access the portal on mobile?"
            answer="Yes! The client portal works beautifully on all devices - desktop, tablet, and phone."
            isOpen={openFaq === 5}
            onClick={() => setOpenFaq(openFaq === 5 ? null : 5)}
          />
          <FAQItem
            question="What currencies do you support?"
            answer="We support 10 currencies including USD, EUR, GBP, NGN, and more. You can also customize your currency symbol."
            isOpen={openFaq === 6}
            onClick={() => setOpenFaq(openFaq === 6 ? null : 6)}
          />
          <FAQItem
            question="How is KOLOR different from HoneyBook?"
            answer="KOLOR is built specifically for solo creatives who want simplicity. We're easier to use, faster to set up, and more affordable."
            isOpen={openFaq === 7}
            onClick={() => setOpenFaq(openFaq === 7 ? null : 7)}
          />
        </motion.div>
      </section>

      {/* Email Capture Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto bg-dark-card rounded-2xl p-10 border border-dark-border text-center"
        >
          <Mail className="w-10 h-10 text-brand-primary-light mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Get Lead Management Tips & Updates</h3>
          <p className="text-gray-400 mb-6">
            Join 500+ creatives getting weekly tips on booking more clients and growing their business.
          </p>
          
          {emailSubmitted ? (
            <div className="flex items-center justify-center gap-2 text-green-400 bg-green-900/20 py-3 px-4 rounded-lg border border-green-700/30">
              <Check className="w-5 h-5" />
              <span>Thanks! Check your email to confirm your subscription.</span>
            </div>
          ) : (
            <>
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:px-6 sm:py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition font-medium "
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-gray-500">No spam. Unsubscribe anytime. We respect your inbox.</p>
            </>
          )}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-brand-primary to-brand-primary rounded-2xl shadow-2xl p-12 text-center text-white"
        >
          <Sparkles className="w-12 h-12 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            Ready to elevate your creative business?
          </h2>
          <p className="text-xl mb-8 text-brand-primary-light">
            Join photographers, videographers, designers, illustrators, and visual artists who are in control.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-brand-primary px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl text-lg font-semibold"
          >
            Start your free account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-dark-card p-8 rounded-2xl shadow-lg border border-dark-border hover:border-brand-primary/50 hover:shadow-xl hover:shadow-brand-primary-dark/20 transition-all"
    >
      <div className="w-12 h-12 bg-brand-primary-dark/50 rounded-xl flex items-center justify-center text-brand-primary-light mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}

// Benefit Component
const Benefit = ({ text }: { text: string }) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-6 h-6 bg-brand-primary-dark/50 rounded-full flex items-center justify-center mt-0.5">
        <Check className="w-4 h-4 text-brand-primary-light" />
      </div>
      <p className="text-gray-300">{text}</p>
    </div>
  )
}

// Testimonial Card Component
interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  location: string
  initials: string
  rating: number
  delay: number
}

const TestimonialCard = ({ quote, author, role, location, initials, rating, delay }: TestimonialCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-dark-card p-6 rounded-2xl border border-dark-border hover:border-brand-primary/30 transition-all"
    >
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <Quote className="w-8 h-8 text-brand-primary/30 mb-2" />
      <p className="text-gray-300 mb-4 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-semibold text-sm">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-white">{author}</p>
          <p className="text-sm text-gray-500">{role}</p>
          <p className="text-xs text-gray-600">{location}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Comparison Row Component
interface ComparisonRowProps {
  task: string
  old: string
  newWay: string
  isLast?: boolean
}

const ComparisonRow = ({ task, old, newWay, isLast = false }: ComparisonRowProps) => {
  return (
    <div className={`grid grid-cols-3 ${!isLast ? 'border-b border-dark-border' : ''}`}>
      <div className="p-4 text-white text-sm">{task}</div>
      <div className="p-4 text-center text-gray-500 text-sm border-x border-dark-border flex items-center justify-center gap-2">
        <XIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
        <span>{old}</span>
      </div>
      <div className="p-4 text-center text-sm bg-brand-primary-dark/10 flex items-center justify-center gap-2">
        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
        <span className="text-white">{newWay}</span>
      </div>
    </div>
  )
}

// Trust Card Component
interface TrustCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

const TrustCard = ({ icon, title, description }: TrustCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-dark-card p-6 rounded-xl border border-dark-border text-center"
    >
      <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center text-green-400 mx-auto mb-4 border border-green-700/30">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
  )
}

// FAQ Item Component
interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
  return (
    <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
      <button
        onClick={onClick}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-dark-card-hover transition"
      >
        <span className="font-medium text-white">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-brand-primary-light" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default LandingPage
