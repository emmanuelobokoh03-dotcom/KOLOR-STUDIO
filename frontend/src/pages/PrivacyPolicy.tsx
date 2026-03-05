import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Database, Mail, Globe, User, FileText, Trash2 } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-dark-bg text-gray-300">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-brand-primary-light hover:text-brand-primary-light transition">
            <ArrowLeft className="w-5 h-5" />
            Back to KOLOR STUDIO
          </Link>
          <Link to="/terms" className="text-sm text-gray-400 hover:text-white transition">
            Terms of Service
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-primary-dark/30 rounded-xl flex items-center justify-center border border-brand-primary-dark/30">
              <Shield className="w-6 h-6 text-brand-primary-light" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              <p className="text-gray-500">Last Updated: February 21, 2026</p>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <section className="mb-10">
          <p className="text-lg text-gray-300 leading-relaxed">
            At KOLOR STUDIO, we take your privacy seriously. This policy explains how we collect, use, and protect your data.
          </p>
        </section>

        {/* What Data We Collect */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-primary-light" />
            What Data We Collect
          </h2>

          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Account Information</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Name and email address
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Studio name and contact information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Password (encrypted)
                </li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Lead & Client Data</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Client names, emails, phone numbers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Project details and descriptions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Quotes and pricing information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Event dates and booking details
                </li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Files & Documents</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Contracts, images, mood boards
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Any files you upload to leads
                </li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Usage Data</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Pages you visit in the app
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Features you use
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Time spent in the app
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Device and browser information
                </li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Cookies</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Essential cookies (keep you logged in)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Analytics cookies (if enabled, optional)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-primary-light" />
            How We Use Your Data
          </h2>

          <div className="space-y-6">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">To Provide Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Manage your leads and projects
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Send quotes to clients
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Enable client portal access
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Store your files securely
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Send email notifications
                </li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">To Improve Our Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Analyze usage patterns
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Fix bugs and issues
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Develop new features
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Improve user experience
                </li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Communications</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Product updates and announcements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Important service notifications
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary-light mt-1">•</span>
                  Optional marketing emails (you can opt out)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Third-Party Services */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-primary-light" />
            Third-Party Services We Use
          </h2>

          <div className="space-y-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Supabase (Database & Storage)</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>• Hosts your database</li>
                <li>• Stores uploaded files</li>
                <li>• Data encrypted at rest and in transit</li>
                <li>• Location: US/EU</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Resend (Email Delivery)</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>• Sends quote emails to clients</li>
                <li>• Sends notification emails to you</li>
                <li>• No marketing emails from Resend</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Vercel (Hosting)</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>• Hosts the application</li>
                <li>• Provides analytics</li>
                <li>• CDN for fast loading</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-primary-light" />
            Data Security
          </h2>

          <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
            <p className="text-gray-400 mb-4">We protect your data with:</p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                SSL/TLS encryption (HTTPS everywhere)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Encrypted database storage
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Secure authentication (JWT tokens)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Regular automated backups
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Industry-standard security practices
              </li>
            </ul>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-primary-light" />
            Your Rights
          </h2>

          <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
            <p className="text-gray-400 mb-4">You have the right to:</p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                View all your data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Export your data (leads, quotes, files)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Delete your account and all data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Opt out of marketing emails
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Correct inaccurate information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Request we stop processing your data
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              To exercise these rights, email: <a href="mailto:privacy@kolorstudio.com" className="text-brand-primary-light hover:underline">privacy@kolorstudio.com</a>
            </p>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-brand-primary-light" />
            Data Retention
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Active Accounts</h3>
              <p className="text-gray-400 text-sm">
                We keep your data as long as your account is active
              </p>
            </div>
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Deleted Accounts</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>• Data retained for 30 days after deletion</li>
                <li>• Then permanently deleted</li>
                <li>• Backups purged within 90 days</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Children's Privacy</h2>
          <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
            <p className="text-gray-400">
              KOLOR STUDIO is not intended for users under 18. We don't knowingly collect data from children.
            </p>
          </div>
        </section>

        {/* International Users */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">International Users</h2>
          <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
            <p className="text-gray-400">
              Your data may be transferred to and processed in the United States. By using KOLOR STUDIO, you consent to this transfer.
            </p>
          </div>
        </section>

        {/* Changes to This Policy */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Changes to This Policy</h2>
          <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
            <p className="text-gray-400">
              We may update this policy. If we make significant changes, we'll notify you via email 30 days before they take effect.
            </p>
          </div>
        </section>

        {/* Contact Us */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-primary-light" />
            Contact Us
          </h2>

          <div className="bg-gradient-to-r from-brand-primary-dark/30 to-brand-primary-dark/30 rounded-xl p-6 border border-brand-primary-dark/30">
            <p className="text-gray-300 mb-4">Questions about privacy?</p>
            <div className="space-y-2">
              <p className="text-gray-400">
                Email: <a href="mailto:privacy@kolorstudio.com" className="text-brand-primary-light hover:underline">privacy@kolorstudio.com</a>
              </p>
              <p className="text-gray-400">
                Or: <a href="mailto:hello@kolorstudio.com" className="text-brand-primary-light hover:underline">hello@kolorstudio.com</a>
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-dark-border">
          <Link to="/" className="text-brand-primary-light hover:text-brand-primary-light transition flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link to="/terms" className="text-brand-primary-light hover:text-brand-primary-light transition">
            Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  )
}
