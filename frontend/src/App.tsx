import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import LoadingScreen from './components/LoadingScreen'
const LandingPageV2 = lazy(() => import('./pages/LandingPageV2'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const SubmitInquiry = lazy(() => import('./pages/SubmitInquiry'))
const ClientPortal = lazy(() => import('./pages/ClientPortal'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const PublicQuote = lazy(() => import('./pages/PublicQuote'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PublicPortfolio = lazy(() => import('./pages/PublicPortfolio'))
const SubmitTestimonial = lazy(() => import('./pages/SubmitTestimonial'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage'))
const IndustryOnboarding = lazy(() => import('./components/IndustryOnboarding'))
const CalendarPage = lazy(() => import('./pages/Calendar'))
import { BrandThemeProvider } from './contexts/BrandThemeContext'
import CookieConsent from './components/CookieConsent'
import NotFound from './pages/NotFound'
import { Toaster } from 'sonner'

function App() {
  // AUDIT FIX [9.1]: Gate analytics behind cookie consent
  const [analyticsConsented, setAnalyticsConsented] = useState(
    localStorage.getItem('analytics_consent') === 'true'
  )

  useEffect(() => {
    const handler = () => {
      setAnalyticsConsented(localStorage.getItem('analytics_consent') === 'true')
    }
    window.addEventListener('kolor-consent-update', handler)
    return () => window.removeEventListener('kolor-consent-update', handler)
  }, [])

  return (
    <BrandThemeProvider>
      <Router>
      {/* Skip navigation link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only-focusable bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg focus:outline focus:outline-2 focus:outline-white focus:outline-offset-2"
      >
        Skip to main content
      </a>
      <div id="main-content">
      <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPageV2 />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/inquiry" element={<SubmitInquiry />} />
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/quote/:quoteToken" element={<PublicQuote />} />
        <Route path="/portfolio/:userId" element={<PublicPortfolio />} />
        <Route path="/testimonial/:token" element={<SubmitTestimonial />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/book/:userId" element={<PublicBookingPage />} />
        <Route path="/onboarding" element={<IndustryOnboarding />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        {/* AUDIT FIX [10.1]: Custom 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </div>
      <CookieConsent />
      <Toaster
        theme="light"
        position="top-center"
        richColors
        toastOptions={{
          className: 'animate-toast-in',
        }}
      />
      {/* AUDIT FIX [9.1]: Only render Analytics after consent */}
      {analyticsConsented && <Analytics />}
    </Router>
    </BrandThemeProvider>
  )
}

export default App
