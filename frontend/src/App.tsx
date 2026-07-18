import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import LoadingScreen from './components/LoadingScreen'
const LandingPageV2 = lazy(() => import('./pages/LandingPageV2'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const AccountTab = lazy(() => import('./components/settings/AccountTab'))
const BrandStudioTab = lazy(() => import('./components/settings/BrandStudioTab'))
const MoneyTab = lazy(() => import('./components/settings/MoneyTab'))
const SchedulingTab = lazy(() => import('./components/settings/SchedulingTab'))
const NotificationsTab = lazy(() => import('./components/settings/NotificationsTab'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const SubmitInquiry = lazy(() => import('./pages/SubmitInquiry'))
const ClientPortal = lazy(() => import('./pages/ClientPortal'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmailChange = lazy(() => import('./pages/VerifyEmailChange'))
const RevokeEmailChange = lazy(() => import('./pages/RevokeEmailChange'))
const PublicQuote = lazy(() => import('./pages/PublicQuote'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PublicPortfolio = lazy(() => import('./pages/PublicPortfolio'))
const SubmitTestimonial = lazy(() => import('./pages/SubmitTestimonial'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage'))
const IndustryOnboarding = lazy(() => import('./components/IndustryOnboarding'))
const CalendarPage = lazy(() => import('./pages/Calendar'))
const CalendarReconnect = lazy(() => import('./pages/CalendarReconnect'))
import { BrandThemeProvider } from './contexts/BrandThemeContext'
import CookieConsent from './components/CookieConsent'
import NotFound from './pages/NotFound'
import AuthCallback from './pages/AuthCallback'
import ConfirmProvider from './components/ConfirmProvider'
import { Toaster } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL || ''

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

  // Keep-alive ping: wake Railway on mount and re-ping every 4 minutes.
  // Railway spins down after ~5min inactivity; a 4min interval keeps the
  // backend warm for active users — zero cold starts after first load.
  useEffect(() => {
    const ping = () => fetch(`${API_URL}/api/health`, { method: 'GET', credentials: 'omit' })
      .catch(() => { /* silently ignore */ })
    ping()
    const interval = setInterval(ping, 4 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <BrandThemeProvider>
      <ConfirmProvider>
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
        <Route path="/verify-email-change/:token" element={<VerifyEmailChange />} />
        <Route path="/settings/calendar-reconnect" element={<CalendarReconnect />} />
        <Route path="/revoke-email-change/:token" element={<RevokeEmailChange />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<Settings />}>
              <Route index element={<Navigate to="account" replace />} />
              <Route path="account" element={<AccountTab />} />
              <Route path="brand" element={<BrandStudioTab />} />
              <Route path="money" element={<MoneyTab />} />
              <Route path="scheduling" element={<SchedulingTab />} />
              <Route path="notifications" element={<NotificationsTab />} />
            </Route>
        <Route path="/inquiry" element={<SubmitInquiry />} />
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/quote/:quoteToken" element={<PublicQuote />} />
        <Route path="/portfolio" element={<Navigate to="/dashboard?view=portfolio" replace />} />
        <Route path="/kanban" element={<Navigate to="/dashboard?view=kanban" replace />} />
        <Route path="/list" element={<Navigate to="/dashboard?view=list" replace />} />
        <Route path="/community" element={<Navigate to="/dashboard?view=community" replace />} />
        <Route path="/portfolio/:userId" element={<PublicPortfolio />} />
        <Route path="/testimonial/:token" element={<SubmitTestimonial />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/book/:userId" element={<PublicBookingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
      </ConfirmProvider>
    </BrandThemeProvider>
  )
}

export default App
