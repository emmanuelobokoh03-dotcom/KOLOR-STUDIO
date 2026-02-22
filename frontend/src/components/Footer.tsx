import { Link } from 'react-router-dom'
import { Sparkles, Instagram, Twitter, Linkedin } from 'lucide-react'
import StatusIndicator from './StatusIndicator'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-dark-card border-t border-dark-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">KOLOR STUDIO</span>
            </Link>
            <p className="text-gray-400 text-sm mb-2">
              The CRM that doesn't feel like a CRM
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Built for photographers, videographers, designers, illustrators, and visual artists
            </p>
            <p className="text-gray-600 text-xs">
              © {currentYear} KOLOR STUDIO
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  About Us
                </Link>
              </li>
              <li>
                <a href="mailto:hello@kolorstudio.com" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  Contact
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Connect</h3>
            <ul className="space-y-2 mb-4">
              <li>
                <a href="mailto:hello@kolorstudio.com" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  hello@kolorstudio.com
                </a>
              </li>
              <li>
                <a href="mailto:support@kolorstudio.com" className="text-gray-500 hover:text-violet-400 text-sm transition">
                  support@kolorstudio.com
                </a>
              </li>
            </ul>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-dark-bg-secondary rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-400 hover:bg-violet-900/30 transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-dark-bg-secondary rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-400 hover:bg-violet-900/30 transition"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-dark-bg-secondary rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-400 hover:bg-violet-900/30 transition"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-8 pt-6 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <StatusIndicator />
          <p className="text-gray-600 text-sm">
            Made with <span className="text-violet-400">💜</span> for creative professionals worldwide
          </p>
          <p className="text-gray-600 text-xs">
            © {currentYear} KOLOR STUDIO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
