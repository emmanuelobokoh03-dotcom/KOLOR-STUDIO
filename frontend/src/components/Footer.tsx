import { Link } from 'react-router-dom'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { InstagramLogo } from '@phosphor-icons/react/dist/csr/InstagramLogo'
import { XLogo } from '@phosphor-icons/react/dist/csr/XLogo'
import { LinkedinLogo } from '@phosphor-icons/react/dist/csr/LinkedinLogo'
import StatusIndicator from './StatusIndicator'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface-base border-t border-light-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-primary rounded-lg flex items-center justify-center">
                <Sparkle className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">KOLOR STUDIO</span>
            </Link>
            <p className="text-text-secondary text-sm mb-2">
              The CRM that doesn't feel like a CRM
            </p>
            <p className="text-text-tertiary text-xs mb-4">
              Built for photographers, videographers, designers, illustrators, and visual artists
            </p>
            <p className="text-gray-600 text-xs">
              © {currentYear} KOLOR STUDIO
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-text-tertiary text-sm">
                  Features
                </span>
              </li>
              <li>
                <span className="text-text-tertiary text-sm">
                  Pricing
                </span>
              </li>
              <li>
                <span className="text-text-tertiary text-sm">
                  Roadmap
                </span>
              </li>
              <li>
                <span className="text-text-tertiary text-sm">
                  Changelog
                </span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-text-tertiary text-sm">
                  About Us
                </span>
              </li>
              <li>
                <a href="mailto:hello@kolorstudio.app" className="text-text-tertiary hover:text-purple-600 text-sm transition">
                  Contact
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-text-tertiary hover:text-purple-600 text-sm transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-text-tertiary hover:text-purple-600 text-sm transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Connect</h3>
            <ul className="space-y-2 mb-4">
              <li>
                <a href="mailto:hello@kolorstudio.app" className="text-text-tertiary hover:text-purple-600 text-sm transition">
                  hello@kolorstudio.app
                </a>
              </li>
              <li>
                <a href="mailto:support@kolorstudio.app" className="text-text-tertiary hover:text-purple-600 text-sm transition">
                  support@kolorstudio.app
                </a>
              </li>
            </ul>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a 
                href="https://instagram.com/kolorcreativestudio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-light-100 rounded-lg flex items-center justify-center text-text-tertiary hover:text-purple-600 hover:bg-purple-50 transition"
              >
                <InstagramLogo className="w-4 h-4" />
              </a>
              <a 
                href="https://x.com/kolor_studio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-light-100 rounded-lg flex items-center justify-center text-text-tertiary hover:text-purple-600 hover:bg-purple-50 transition"
              >
                <XLogo className="w-4 h-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-light-100 rounded-lg flex items-center justify-center text-text-tertiary hover:text-purple-600 hover:bg-purple-50 transition"
              >
                <LinkedinLogo className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-8 pt-6 border-t border-light-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <StatusIndicator />
          <p className="text-gray-600 text-sm">
            Made with <span className="text-purple-600">💜</span> for creative professionals worldwide
          </p>
          <p className="text-gray-600 text-xs">
            © {currentYear} KOLOR STUDIO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
