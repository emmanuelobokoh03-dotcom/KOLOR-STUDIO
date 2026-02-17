import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  LayoutDashboard, 
  MessageCircle, 
  BarChart3, 
  Zap,
  ArrowRight,
  Check
} from 'lucide-react'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Sparkles className="w-8 h-8 text-violet-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
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
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/signup"
              className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300"
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
            <span className="inline-block px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6">
              ✨ The CRM that doesn't feel like a CRM
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Turn{' '}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              creativity
            </span>
            {' '}into revenue
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 mb-10 leading-relaxed"
          >
            Built for photographers, designers, and videographers who deserve better than spreadsheets.
            <br />
            Manage leads, impress clients, and grow your creative business.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center space-x-4"
          >
            <Link
              to="/signup"
              className="bg-violet-600 text-white px-8 py-4 rounded-xl hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 hover:shadow-2xl hover:shadow-violet-300 flex items-center space-x-2 text-lg font-semibold"
            >
              <span>Start for free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-gray-400 transition-all text-lg font-semibold">
              Watch demo
            </button>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-500 mt-6"
          >
            Free forever • No credit card required • 2-minute setup
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
            className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">
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

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl shadow-2xl p-12 text-center text-white"
        >
          <Sparkles className="w-12 h-12 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            Ready to elevate your creative business?
          </h2>
          <p className="text-xl mb-8 text-violet-100">
            Join photographers, designers, and videographers who are in control.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-violet-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl text-lg font-semibold"
          >
            Start your free account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t">
        <div className="text-center text-gray-600">
          <p className="mb-2">
            Built with ❤️ for the creative community
          </p>
          <p className="text-sm">
            © 2026 KOLOR STUDIO. Empowering creatives to run professional businesses.
          </p>
        </div>
      </footer>
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
      className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all"
    >
      <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  )
}

// Benefit Component
const Benefit = ({ text }: { text: string }) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center mt-0.5">
        <Check className="w-4 h-4 text-violet-600" />
      </div>
      <p className="text-gray-700">{text}</p>
    </div>
  )
}

export default LandingPage
