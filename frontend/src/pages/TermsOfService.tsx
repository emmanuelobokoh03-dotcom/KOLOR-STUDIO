import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Shield, CreditCard, AlertTriangle, Scale, Mail } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-dark-bg text-gray-300">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-brand-primary-light hover:text-brand-primary-light transition">
            <ArrowLeft className="w-5 h-5" />
            Back to KOLOR STUDIO
          </Link>
          <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition">
            Privacy Policy
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-primary-dark/30 rounded-xl flex items-center justify-center border border-brand-primary-dark/30">
              <FileText className="w-6 h-6 text-brand-primary-light" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
              <p className="text-gray-500">Last Updated: February 21, 2026</p>
            </div>
          </div>
        </div>

        {/* 1. Acceptance of Terms */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
          <div className="bg-dark-card rounded-xl p-5 border border-dark-border space-y-4">
            <p className="text-gray-400">
              By creating an account or using KOLOR STUDIO, you agree to these Terms of Service. If you don't agree, please don't use our service.
            </p>
            <p className="text-gray-400">
              We may update these terms. We'll notify you 30 days before significant changes take effect. Continued use means you accept the new terms.
            </p>
          </div>
        </section>

        {/* 2. Description of Service */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
          <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
            <p className="text-gray-400 mb-4">KOLOR STUDIO provides:</p>
            <ul className="grid md:grid-cols-2 gap-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Lead and client relationship management
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Quote and proposal generation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Client portal for project tracking
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                File storage and management
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Email notifications
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Revenue analytics
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary-light mt-1">•</span>
                Calendar and scheduling tools
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Account Registration */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-primary-light" />
            3. Account Registration
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">You must:</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  Provide accurate information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  Be at least 18 years old
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  Use a valid email address
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  Keep your password secure
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  Notify us of unauthorized access
                </li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">You may not:</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  Share your account credentials
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  Create multiple accounts to abuse free tier
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  Impersonate others
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  Use the service for illegal purposes
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Subscription Plans */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-primary-light" />
            4. Subscription Plans
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded">FREE</span>
                <span className="text-white font-semibold">Free Tier</span>
              </div>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• 10 leads per month</li>
                <li>• Basic features included</li>
                <li>• KOLOR STUDIO branding on client portal</li>
                <li>• No credit card required</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-brand-primary-dark/30 to-brand-primary-dark/30 rounded-xl p-5 border border-brand-primary-dark/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-brand-primary text-white text-xs font-medium rounded">PRO</span>
                <span className="text-white font-semibold">$29/month</span>
              </div>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Unlimited leads</li>
                <li>• All features unlocked</li>
                <li>• Remove KOLOR branding</li>
                <li>• Priority support</li>
                <li>• Billed monthly, cancel anytime</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Payment Terms */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">5. Payment Terms</h2>

          <div className="space-y-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Billing</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Charged monthly on your signup anniversary</li>
                <li>• Automatic renewal unless cancelled</li>
                <li>• Payment via Stripe (credit card)</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Cancellation</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Cancel anytime from Settings</li>
                <li>• Access continues until end of billing period</li>
                <li>• No partial refunds for mid-month cancellations</li>
              </ul>
            </div>

            <div className="bg-green-900/20 rounded-xl p-5 border border-green-700/30">
              <h3 className="font-semibold text-white mb-3">Refund Policy</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• 30-day money-back guarantee</li>
                <li>• Request refund within 30 days of first payment</li>
                <li>• Email: <a href="mailto:billing@kolorstudio.com" className="text-brand-primary-light hover:underline">billing@kolorstudio.com</a></li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Price Changes</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• We may change pricing with 30 days notice</li>
                <li>• Existing customers: grandfathered for 12 months</li>
                <li>• Then new pricing applies</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Your Content & Data */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">6. Your Content & Data</h2>

          <div className="space-y-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Ownership</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• You own all data you enter (leads, quotes, files)</li>
                <li>• We don't claim ownership of your content</li>
                <li>• You can export or delete anytime</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">License to Us</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• You grant us permission to store and display your data</li>
                <li>• Only to provide the service to you</li>
                <li>• We may use anonymized data for analytics</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Your Responsibilities</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• You're responsible for your data accuracy</li>
                <li>• Don't upload illegal, harmful, or copyrighted content</li>
                <li>• Keep backups of critical data</li>
                <li>• Don't store sensitive data (SSNs, credit cards) in leads</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 7. Service Availability */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">7. Service Availability</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Uptime</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• We strive for 99.9% uptime</li>
                <li>• No guarantee of zero downtime</li>
                <li>• Scheduled maintenance announced in advance</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Data Backups</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Automated daily backups</li>
                <li>• You should still keep your own backups</li>
                <li>• We're not liable for data loss</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 8. Prohibited Uses */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            8. Prohibited Uses
          </h2>

          <div className="bg-red-900/10 rounded-xl p-5 border border-red-700/30">
            <p className="text-gray-300 mb-4">You may not:</p>
            <ul className="grid md:grid-cols-2 gap-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                Spam clients or use for unsolicited marketing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                Abuse the service (excessive API calls, DoS attacks)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                Scrape or copy our interface/code
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                Reverse engineer the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                Use for illegal activities
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                Violate others' privacy or intellectual property
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                Resell access to KOLOR STUDIO
              </li>
            </ul>
          </div>
        </section>

        {/* 9. Intellectual Property */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">9. Intellectual Property</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Our Property</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• KOLOR STUDIO name and logo</li>
                <li>• Platform design and code</li>
                <li>• All UI/UX elements</li>
                <li>• Documentation and content</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Your Use</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• You may not copy, modify, or distribute our IP</li>
                <li>• You may use our logo to say "Powered by KOLOR STUDIO"</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 10. Termination */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">10. Termination</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">We May Terminate If:</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• You violate these terms</li>
                <li>• You abuse the service</li>
                <li>• Your account is inactive for 12+ months (free tier)</li>
                <li>• Required by law</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">You May Terminate:</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Cancel anytime from Settings</li>
                <li>• Data exported before deletion</li>
                <li>• Account permanently deleted after 30 days</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 11. Limitation of Liability */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-primary-light" />
            11. Limitation of Liability
          </h2>

          <div className="space-y-4">
            <div className="bg-yellow-900/10 rounded-xl p-5 border border-yellow-700/30">
              <h3 className="font-semibold text-white mb-3">Service "As Is"</h3>
              <p className="text-gray-400 text-sm mb-3">
                No warranties or guarantees. We're not liable for:
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Lost business or revenue</li>
                <li>• Data loss (keep backups!)</li>
                <li>• Service interruptions</li>
                <li>• Third-party service failures</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-3">Maximum Liability</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Our liability limited to amount you paid in last 12 months</li>
                <li>• For free tier: $100 maximum</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 12. Indemnification */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">12. Indemnification</h2>
          <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
            <p className="text-gray-400 mb-3">You agree to indemnify us against claims arising from:</p>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>• Your use of the service</li>
              <li>• Your violation of these terms</li>
              <li>• Your violation of others' rights</li>
            </ul>
          </div>
        </section>

        {/* 13. Dispute Resolution */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">13. Dispute Resolution</h2>

          <div className="space-y-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Governing Law</h3>
              <p className="text-gray-400 text-sm">
                These terms governed by laws of the State of Delaware, United States.
              </p>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Informal Resolution</h3>
              <p className="text-gray-400 text-sm">
                Contact us first: <a href="mailto:legal@kolorstudio.com" className="text-brand-primary-light hover:underline">legal@kolorstudio.com</a>. We'll try to resolve within 30 days.
              </p>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Arbitration</h3>
              <p className="text-gray-400 text-sm">
                If informal resolution fails, binding arbitration (not court). JAMS or AAA arbitration rules apply.
              </p>
            </div>
          </div>
        </section>

        {/* 14. General Terms */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">14. General Terms</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Entire Agreement</h3>
              <p className="text-gray-400 text-sm">
                These terms constitute the full agreement. Supersede any prior agreements.
              </p>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Severability</h3>
              <p className="text-gray-400 text-sm">
                If one provision is invalid, others remain valid.
              </p>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">No Waiver</h3>
              <p className="text-gray-400 text-sm">
                Our failure to enforce doesn't waive our rights.
              </p>
            </div>

            <div className="bg-dark-card rounded-xl p-5 border border-dark-border">
              <h3 className="font-semibold text-white mb-2">Assignment</h3>
              <p className="text-gray-400 text-sm">
                We may transfer our rights/obligations. You may not assign your account.
              </p>
            </div>
          </div>
        </section>

        {/* 15. Contact Information */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-primary-light" />
            15. Contact Information
          </h2>

          <div className="bg-gradient-to-r from-brand-primary-dark/30 to-brand-primary-dark/30 rounded-xl p-6 border border-brand-primary-dark/30">
            <p className="text-gray-300 mb-4">Questions? Contact us:</p>
            <div className="space-y-2">
              <p className="text-gray-400">
                Email: <a href="mailto:legal@kolorstudio.com" className="text-brand-primary-light hover:underline">legal@kolorstudio.com</a>
              </p>
              <p className="text-gray-400">
                General: <a href="mailto:hello@kolorstudio.com" className="text-brand-primary-light hover:underline">hello@kolorstudio.com</a>
              </p>
              <p className="text-gray-400">
                Support: <a href="mailto:support@kolorstudio.com" className="text-brand-primary-light hover:underline">support@kolorstudio.com</a>
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
          <Link to="/privacy" className="text-brand-primary-light hover:text-brand-primary-light transition">
            Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  )
}
