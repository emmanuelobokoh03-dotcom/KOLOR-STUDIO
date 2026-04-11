import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Database, Envelope, Globe, User, FileText, Trash } from '@phosphor-icons/react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-light-50 text-text-secondary">
      {/* Header */}
      <header className="bg-surface-base border-b border-light-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-purple-600 hover:text-purple-600 transition">
            <ArrowLeft className="w-5 h-5" />
            Back to KOLOR STUDIO
          </Link>
          <Link to="/terms" className="text-sm text-text-secondary hover:text-white transition">
            Terms of Service
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-200">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              <p className="text-text-tertiary">Last Updated: February 21, 2026</p>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <section className="mb-10">
          <p className="text-lg text-text-secondary leading-relaxed">
            At KOLOR STUDIO, we take your privacy seriously. This policy explains how we collect, use, and protect your data.
          </p>
        </section>

        {/* What Data We Collect */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            What Data We Collect
          </h2>

          <div className="space-y-6">
            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-3">Account Information</h3>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Name and email address
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Studio name and contact information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Password (encrypted)
                </li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-3">Lead & Client Data</h3>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Client names, emails, phone numbers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Project details and descriptions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Quotes and pricing information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Event dates and booking details
                </li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-3">Files & Documents</h3>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Contracts, images, mood boards
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Any files you upload to leads
                </li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-3">Usage Data</h3>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Pages you visit in the app
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Features you use
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Time spent in the app
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Device and browser information
                </li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-3">Cookies</h3>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Essential cookies (keep you logged in)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Analytics cookies (if enabled, optional)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            How We Use Your Data
          </h2>

          <div className="space-y-6">
            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-3">To Provide Services</h3>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Manage your leads and projects
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Send quotes to clients
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Enable client portal access
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Store your files securely
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Send email notifications
                </li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-3">To Improve Our Product</h3>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Analyze usage patterns
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Fix bugs and issues
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Develop new features
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Improve user experience
                </li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-3">Communications</h3>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Product updates and announcements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Important service notifications
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  Optional marketing emails (you can opt out)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Third-Party Data Processors */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            Third-Party Data Processors
          </h2>

          <div className="space-y-4">
            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Supabase, Inc.</h3>
              <ul className="space-y-1 text-text-secondary text-sm">
                <li>• Database hosting and file storage</li>
                <li>• Transfer mechanism: USA — Standard Contractual Clauses (SCCs)</li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Railway Corp.</h3>
              <ul className="space-y-1 text-text-secondary text-sm">
                <li>• Backend server hosting</li>
                <li>• Transfer mechanism: USA — Standard Contractual Clauses (SCCs)</li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Vercel, Inc.</h3>
              <ul className="space-y-1 text-text-secondary text-sm">
                <li>• Frontend hosting and analytics</li>
                <li>• Transfer mechanism: USA — SCCs / Data Privacy Framework (DPF)</li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Resend, Inc.</h3>
              <ul className="space-y-1 text-text-secondary text-sm">
                <li>• Transactional email delivery</li>
                <li>• Transfer mechanism: USA — Standard Contractual Clauses (SCCs)</li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Sentry, Inc.</h3>
              <ul className="space-y-1 text-text-secondary text-sm">
                <li>• Error monitoring and crash reporting</li>
                <li>• Transfer mechanism: USA — Standard Contractual Clauses (SCCs)</li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Google LLC</h3>
              <ul className="space-y-1 text-text-secondary text-sm">
                <li>• Fonts CDN (see note below)</li>
                <li>• Transfer mechanism: USA — SCCs / Data Privacy Framework (DPF)</li>
              </ul>
            </div>

            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Stripe, Inc.</h3>
              <ul className="space-y-1 text-text-secondary text-sm">
                <li>• Payment processing</li>
                <li>• Transfer mechanism: USA — SCCs / Data Privacy Framework (DPF)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 bg-surface-base rounded-xl p-5 border border-light-200">
            <p className="text-sm text-text-tertiary leading-relaxed">
              <span className="font-semibold text-text-secondary">Google Fonts:</span> When you load any KOLOR Studio page, your browser makes a direct request to fonts.googleapis.com to download typeface files. Google receives your IP address as part of this request. We use Google Fonts to render our interface typography. This request occurs on every page load.
            </p>
          </div>

          <div className="mt-4 bg-surface-base rounded-xl p-5 border border-light-200">
            <p className="text-sm text-text-tertiary leading-relaxed">
              Standard Contractual Clauses (SCCs) are legal agreements approved by the European Commission that provide appropriate safeguards for transferring personal data outside the UK and EEA. The EU-US Data Privacy Framework (DPF) is a certification scheme that allows certified US companies to receive personal data from the EU/UK/EEA.
            </p>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            Data Security
          </h2>

          <div className="bg-surface-base rounded-xl p-5 border border-light-200">
            <p className="text-text-secondary mb-4">We protect your data with:</p>
            <ul className="space-y-2 text-text-secondary">
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
            <User className="w-5 h-5 text-purple-600" />
            Your Rights
          </h2>

          <div className="bg-surface-base rounded-xl p-5 border border-light-200">
            <p className="text-text-secondary mb-4">You have the right to:</p>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                View all your data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                Export your data (leads, quotes, files)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                Delete your account and all data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                Opt out of marketing emails
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                Correct inaccurate information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                Request we stop processing your data
              </li>
            </ul>
            <p className="mt-4 text-sm text-text-tertiary">
              To exercise these rights, email: <a href="mailto:privacy@kolorstudio.com" className="text-purple-600 hover:underline">privacy@kolorstudio.com</a>
            </p>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trash className="w-5 h-5 text-purple-600" />
            Data Retention
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Active Accounts</h3>
              <p className="text-text-secondary text-sm">
                We keep your data as long as your account is active
              </p>
            </div>
            <div className="bg-surface-base rounded-xl p-5 border border-light-200">
              <h3 className="font-semibold text-white mb-2">Deleted Accounts</h3>
              <ul className="space-y-1 text-text-secondary text-sm">
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
          <div className="bg-surface-base rounded-xl p-5 border border-light-200">
            <p className="text-text-secondary">
              KOLOR STUDIO is not intended for users under 18. We don't knowingly collect data from children.
            </p>
          </div>
        </section>

        {/* International Users */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">International Users</h2>
          <div className="bg-surface-base rounded-xl p-5 border border-light-200">
            <p className="text-text-secondary">
              Your data may be transferred to and processed in the United States. By using KOLOR STUDIO, you consent to this transfer.
            </p>
          </div>
        </section>

        {/* Changes to This Policy */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Changes to This Policy</h2>
          <div className="bg-surface-base rounded-xl p-5 border border-light-200">
            <p className="text-text-secondary">
              We may update this policy. If we make significant changes, we'll notify you via email 30 days before they take effect.
            </p>
          </div>
        </section>

        {/* Contact Us */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Envelope className="w-5 h-5 text-purple-600" />
            Contact Us
          </h2>

          <div className="bg-gradient-to-r from-brand-primary-dark/30 to-brand-primary-dark/30 rounded-xl p-6 border border-purple-200">
            <p className="text-text-secondary mb-4">Questions about privacy?</p>
            <div className="space-y-2">
              <p className="text-text-secondary">
                Email: <a href="mailto:privacy@kolorstudio.com" className="text-purple-600 hover:underline">privacy@kolorstudio.com</a>
              </p>
              <p className="text-text-secondary">
                Or: <a href="mailto:hello@kolorstudio.com" className="text-purple-600 hover:underline">hello@kolorstudio.com</a>
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-light-200">
          <Link to="/" className="text-purple-600 hover:text-purple-600 transition flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link to="/terms" className="text-purple-600 hover:text-purple-600 transition">
            Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  )
}
