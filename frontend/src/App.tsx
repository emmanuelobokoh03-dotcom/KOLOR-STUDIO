import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import SubmitInquiry from './pages/SubmitInquiry'
import ClientPortal from './pages/ClientPortal'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PublicQuote from './pages/PublicQuote'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import PublicPortfolio from './pages/PublicPortfolio'
import IndustryOnboarding from './components/IndustryOnboarding'
import { BrandThemeProvider } from './contexts/BrandThemeContext'
import CookieConsent from './components/CookieConsent'

function App() {
  return (
    <BrandThemeProvider>
      <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inquiry" element={<SubmitInquiry />} />
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/quote/:quoteToken" element={<PublicQuote />} />
        <Route path="/portfolio/:userId" element={<PublicPortfolio />} />
        <Route path="/onboarding" element={<IndustryOnboarding />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
      <CookieConsent />
      <Analytics />
    </Router>
    </BrandThemeProvider>
  )
}

export default App
