import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkle,
  SignOut,
  Plus,
  SquaresFour,
  List as ListIcon,
  MagnifyingGlass,
  ArrowsClockwise,
  Users,
  TrendUp,
  CurrencyDollar,
  CalendarBlank,
  Link as LinkIcon,
  Copy,
  Envelope,
  Crosshair,
  GearSix,
  ChartBar,
  CalendarDots,
  X,
  Briefcase,
  Funnel,
  CaretDown
} from '@phosphor-icons/react'
import { authApi, leadsApi, Lead, LeadStatus, User as UserType, LEAD_STATUS_LABELS, Booking, ProjectType, IndustryType, PROJECT_TYPE_LABELS, INDUSTRY_TYPE_LABELS, contractsApi } from '../services/api'
import KanbanBoard from '../components/KanbanBoard'
import LeadDetailModal from '../components/LeadDetailModal'
import AddLeadModal from '../components/AddLeadModal'
import ShareFormModal from '../components/ShareFormModal'
import SettingsModal from '../components/SettingsModal'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import CalendarViewNew from '../components/CalendarViewNew'
import PortfolioPage from './Portfolio'
import HelpMenu from '../components/HelpMenu'
import FeedbackModal from '../components/FeedbackModal'
import AnnouncementBanner from '../components/AnnouncementBanner'
import BookingModal from '../components/BookingModal'
import MobileBottomNav from '../components/MobileBottomNav'
import HelpPanel, { HelpButton } from '../components/HelpPanel'
import { PhotographyWidgets, FineArtWidgets, DesignWidgets } from '../components/IndustryWidgets'
import { useOnboardingTour } from '../components/OnboardingTour'
import OnboardingWizard, { useOnboardingWizard } from '../components/OnboardingWizard'
import { SmartSuggestion } from '../components/SmartSuggestion'
import { CelebrationModal, checkCelebration, Achievement, achievements } from '../components/CelebrationModal'
import CRMAlerts from '../components/CRMAlerts'
import RevenueDashboard from '../components/RevenueDashboard'
import RevenuePipelineWidget from '../components/RevenuePipelineWidget'
import CalendarConnectionWidget from '../components/CalendarConnectionWidget'
import OnboardingChecklist from '../components/OnboardingChecklist'
import SequencesDashboard from './SequencesDashboard'
import EmailVerificationBanner from '../components/EmailVerificationBanner'
import DemoProjectBanner from '../components/DemoProjectBanner'
import { trackLogout, trackViewChanged } from '../utils/analytics'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { StatCard } from '../components/StatCard'
import { SmartNudgeBanner } from '../components/SmartNudgeBanner'
import { ActivityFeed } from '../components/ActivityFeed'
import { QuickActions } from '../components/QuickActions'
import { UserPlus } from '@phosphor-icons/react'

type ViewMode = 'kanban' | 'list' | 'analytics' | 'calendar' | 'portfolio' | 'sequences';

// Skeleton components for loading states
const StatCardSkeleton = () => (
  <div className="bg-light-50 rounded-xl p-4 md:p-6 border border-light-200 animate-pulse">
    <div className="flex items-center gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-light-200 rounded-xl" />
      <div className="space-y-2">
        <div className="h-6 md:h-7 w-12 md:w-16 bg-light-200 rounded-md" />
        <div className="h-3 md:h-4 w-16 md:w-24 bg-light-100 rounded-md" />
      </div>
    </div>
  </div>
);

const KanbanSkeleton = () => (
  <div className="space-y-4 md:flex md:gap-5 md:space-y-0 overflow-x-auto pb-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex-shrink-0 w-full md:w-72 rounded-xl border-2 border-light-200 bg-light-50 animate-pulse">
        <div className="h-12 bg-light-200 rounded-t-lg" />
        <div className="p-4 space-y-4">
          {[1, 2].map((j) => (
            <div key={j} className="bg-light-50 rounded-lg p-4 space-y-3 border border-light-200">
              <div className="h-24 md:h-32 bg-light-100 rounded-lg" />
              <div className="h-4 w-3/4 bg-light-200 rounded" />
              <div className="h-3 w-1/2 bg-light-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserType | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedLeadInitialTab, setSelectedLeadInitialTab] = useState<string | undefined>(undefined)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [stats, setStats] = useState<{ total: number; statusCounts: Record<string, number> } | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('')
  const [industryFilter, setIndustryFilter] = useState<string>('')
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showHelpPanel, setShowHelpPanel] = useState(false)
  const [staleFilter, setStaleFilter] = useState(false)
  const [celebration, setCelebration] = useState<Achievement | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showDemoBanner, setShowDemoBanner] = useState(true)
  const [pendingContracts, setPendingContracts] = useState<any[]>([])
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarHintDismissed, setCalendarHintDismissed] = useState(
    () => localStorage.getItem('kolor_calendar_hint_dismissed') === 'true'
  )
  const { startTour, tourComplete } = useOnboardingTour()
  const { showWizard, setShowWizard, resetWizard } = useOnboardingWizard(leads.length)

  useEffect(() => {
    const init = async () => {
      const userResult = await authApi.getMe()
      if (userResult.error) {
        localStorage.removeItem('user')
        navigate('/login')
        return
      }

      if (userResult.data?.user) {
        setUser(userResult.data.user)
        const hasLoggedInBefore = localStorage.getItem('kolor_has_logged_in')
        if (!hasLoggedInBefore) {
          setIsFirstLogin(true)
          localStorage.setItem('kolor_has_logged_in', 'true')
        }
      }

      await fetchLeads()
      await fetchStats()
      await fetchPendingContracts()
      setLoading(false)

      // Handle Google Calendar OAuth callback
      const params = new URLSearchParams(window.location.search)
      if (params.get('calendar') === 'connected') {
        setCalendarConnected(true)
        setCalendarHintDismissed(false) // Show widget so user sees success
        localStorage.removeItem('kolor_calendar_hint_dismissed')
        window.history.replaceState({}, '', '/dashboard')
      }

      // Async celebration checks (milestones triggered by client-side events)
      const statsResult = await leadsApi.getStats()
      if ((statsResult.data?.statusCounts?.BOOKED ?? 0) > 0) {
        const ach = checkCelebration('quote_accepted', 'quoteAccepted')
        if (ach) { setCelebration(ach); setShowCelebration(true) }
      }
    }
    init()
  }, [navigate])

  // Auto-refresh dashboard data every 60s (skip when idle > 5 min)
  useEffect(() => {
    if (loading) return
    let lastActivity = Date.now()
    const handleActivity = () => { lastActivity = Date.now() }
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)

    const interval = setInterval(async () => {
      const inactive = Date.now() - lastActivity > 5 * 60 * 1000
      if (inactive) return // skip refresh when idle > 5 min
      await Promise.all([fetchLeads(), fetchStats(), fetchPendingContracts()])
    }, 60000)

    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
    }
  }, [loading, projectTypeFilter, industryFilter])

  // Auto-start onboarding tour for new users — only when wizard is NOT showing
  useEffect(() => {
    if (!loading && user && !tourComplete && !showWizard) {
      const timer = setTimeout(() => startTour(), 1500)
      return () => clearTimeout(timer)
    }
  }, [loading, user, tourComplete, startTour, showWizard])

  const fetchLeads = async () => {
    const params: any = {};
    if (projectTypeFilter) params.projectType = projectTypeFilter;
    if (industryFilter) params.industry = industryFilter;
    const result = await leadsApi.getAll(params)
    if (result.data?.leads) setLeads(result.data.leads)
  }

  const fetchStats = async () => {
    const result = await leadsApi.getStats()
    if (result.data) setStats({ total: result.data.total, statusCounts: result.data.statusCounts })
  }

  const fetchPendingContracts = async () => {
    const result = await contractsApi.getPending()
    if (result.data?.contracts) setPendingContracts(result.data.contracts)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLeads()
    await fetchStats()
    await fetchPendingContracts()
    setRefreshing(false)
  }

  const handleLogout = async () => {
    trackLogout()
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } catch { /* ignore */ }
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleViewChange = (view: ViewMode) => {
    setViewMode(view)
    setMobileMenuOpen(false)
    setStaleFilter(false)
    trackViewChanged(view)
  }

  useEffect(() => {
    if (!loading) fetchLeads();
  }, [projectTypeFilter, industryFilter]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const result = await leadsApi.updateStatus(leadId, newStatus)
    if (result.data?.lead) {
      setLeads(leads.map(l => l.id === leadId ? result.data!.lead : l))
      fetchStats()
      if (newStatus === 'BOOKED') {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          setBookingLead({ ...lead, status: 'BOOKED' })
          setShowBookingModal(true)
        }
      }
    }
  }

  const triggerCelebration = (key: string, achievementKey: keyof typeof achievements) => {
    const ach = checkCelebration(key, achievementKey)
    if (ach) { setCelebration(ach); setShowCelebration(true) }
  }

  const handleBookingSaved = (booking: Booking) => {
    setShowBookingModal(false)
    setBookingLead(null)
    fetchLeads()
    triggerCelebration('first_booking', 'firstBooking')
  }

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l))
    setSelectedLead(updatedLead)
    fetchStats()
  }

  const handleLeadDelete = async (leadId: string) => {
    const result = await leadsApi.delete(leadId)
    if (!result.error) {
      setLeads(leads.filter(l => l.id !== leadId))
      fetchStats()
    }
  }

  const filteredLeads = leads.filter(lead => {
    if (statusFilter && lead.status !== statusFilter) return false
    if (staleFilter) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      if (new Date(lead.updatedAt).getTime() >= sevenDaysAgo) return false
      if (['BOOKED', 'LOST'].includes(lead.status)) return false
    }
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lead.clientName.toLowerCase().includes(query) ||
      lead.clientEmail.toLowerCase().includes(query) ||
      lead.projectTitle.toLowerCase().includes(query)
    )
  })

  const handleFilterByStatus = (status: string | null) => {
    setStatusFilter(status)
    if (status) setViewMode('kanban')
  }

  const clearStatusFilter = () => setStatusFilter(null)

  // Quick Actions handlers
  const handleQuickSendQuote = (lead: Lead | null) => {
    if (lead) {
      setSelectedLead(lead)
      setSelectedLeadInitialTab('quotes')
    } else {
      setShowAddModal(true)
    }
  }

  const handleQuickFollowUp = (staleLeads: Lead[]) => {
    if (staleLeads.length > 0) {
      setStaleFilter(true)
      setStatusFilter(null)
      setViewMode('list')
    } else {
      setStaleFilter(false)
      setViewMode('list')
    }
  }

  const handleQuickCheckSchedule = () => {
    handleViewChange('calendar')
  }

  const activeFilterCount = [statusFilter, projectTypeFilter, industryFilter, staleFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base">
        <header className="glass-header sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-light-200 rounded-lg animate-pulse" />
              <div className="w-28 md:w-32 h-6 bg-light-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-24 lg:pb-8">
          <div className="space-y-2 animate-pulse">
            <div className="h-7 md:h-8 w-48 md:w-64 bg-light-200 rounded-lg" />
            <div className="h-4 md:h-5 w-36 md:w-48 bg-light-100 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
          </div>
          <KanbanSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-base lg:grid" style={{ gridTemplateColumns: '220px 1fr' }}>
      <AnnouncementBanner />
      <EmailVerificationBanner user={user} />

      {/* Onboarding Wizard for new users */}
      {showWizard && (
        <OnboardingWizard onComplete={() => setShowWizard(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col bg-surface-base border-r border-light-200 h-screen sticky top-0 overflow-y-auto" style={{ padding: '16px 12px' }} data-testid="desktop-sidebar">
        {/* Logo */}
        <button
          onClick={() => { setViewMode('kanban'); setStatusFilter(null) }}
          className="block mb-4 px-2"
          style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.08em', background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          data-testid="sidebar-logo"
        >
          KOLOR
        </button>

        {/* User block */}
        <div
          className="flex items-center gap-2.5 rounded-[10px] p-2.5 mb-4 cursor-pointer transition-all duration-150 border border-transparent hover:border-purple-200"
          style={{ background: 'var(--surface-background)' }}
          onClick={() => setShowSettings(true)}
          data-testid="sidebar-user-block"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-text-primary truncate">{user?.firstName} {user?.lastName}</div>
            <div className="text-[10px] text-text-secondary">Beta · Free plan</div>
          </div>
          <CaretDown weight="bold" className="w-3 h-3 text-text-tertiary" />
        </div>

        {/* Workspace nav */}
        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-2 mb-1 mt-2">Workspace</div>
        {([
          { mode: 'kanban' as ViewMode, icon: SquaresFour, label: 'Dashboard' },
          { mode: 'list' as ViewMode, icon: ListIcon, label: 'Leads', badge: stats?.total },
          { mode: 'analytics' as ViewMode, icon: ChartBar, label: 'Analytics' },
        ]).map(({ mode, icon: Icon, label, badge }) => (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 mb-0.5 relative ${
              viewMode === mode ? 'text-brand-600 font-semibold' : 'text-text-secondary hover:bg-surface-background hover:text-text-primary'
            }`}
            style={viewMode === mode ? { background: 'rgba(108,46,219,0.08)' } : undefined}
            data-testid={`sidebar-${mode}`}
          >
            {viewMode === mode && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-brand-600" />}
            <Icon weight={viewMode === mode ? 'fill' : 'regular'} className="w-[14px] h-[14px]" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="ml-auto text-[9px] font-bold rounded-full px-1.5 py-px" style={{ background: 'rgba(108,46,219,0.12)', color: '#6C2EDB' }}>{badge}</span>
            )}
          </button>
        ))}

        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-2 mb-1 mt-3">Schedule</div>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 mb-0.5 relative ${
            viewMode === 'calendar' ? 'text-brand-600 font-semibold' : 'text-text-secondary hover:bg-surface-background hover:text-text-primary'
          }`}
          style={viewMode === 'calendar' ? { background: 'rgba(108,46,219,0.08)' } : undefined}
          data-testid="sidebar-calendar"
        >
          {viewMode === 'calendar' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-brand-600" />}
          <CalendarDots weight={viewMode === 'calendar' ? 'fill' : 'regular'} className="w-[14px] h-[14px]" />
          Calendar
        </button>

        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-2 mb-1 mt-3">Account</div>
        {([
          { mode: 'portfolio' as ViewMode, icon: Briefcase, label: 'Portfolio' },
          { mode: 'sequences' as ViewMode, icon: Envelope, label: 'Sequences' },
        ]).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 mb-0.5 relative ${
              viewMode === mode ? 'text-brand-600 font-semibold' : 'text-text-secondary hover:bg-surface-background hover:text-text-primary'
            }`}
            style={viewMode === mode ? { background: 'rgba(108,46,219,0.08)' } : undefined}
            data-testid={`sidebar-${mode}`}
          >
            {viewMode === mode && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-brand-600" />}
            <Icon weight={viewMode === mode ? 'fill' : 'regular'} className="w-[14px] h-[14px]" />
            {label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Beta plan card */}
        <div className="rounded-[9px] p-3 mb-2" style={{ background: 'linear-gradient(135deg, rgba(108,46,219,0.07), rgba(108,46,219,0.03))', border: '0.5px solid rgba(108,46,219,0.18)' }}>
          <div className="text-[9px] font-bold uppercase tracking-[0.06em]" style={{ color: '#6C2EDB' }}>Beta Plan</div>
          <div className="text-xs font-bold text-text-primary">Free Forever</div>
          <div className="text-[10px] text-text-secondary">One of the first 20 &#10022;</div>
        </div>

        {/* Help */}
        <button
          onClick={() => setShowFeedback(true)}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-text-secondary hover:bg-surface-background transition-all duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 6.2c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.3-1 1.7-.3.2-.5.4-.6.6-.1.2-.2.3-.2.5M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Help &amp; feedback
        </button>
      </aside>

      {/* Main column */}
      <div className="flex flex-col min-h-screen">

      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-light-100 rounded-xl transition-all duration-200 lg:hidden touch-target"
              data-testid="mobile-menu-button"
            >
              <ListIcon className="w-5 h-5" />
            </button>
            {/* Mobile logo */}
            <button
              onClick={() => { setViewMode('kanban'); setStatusFilter(null); }}
              className="flex items-center gap-2 md:gap-3 group transition-all duration-200 hover:opacity-80 lg:hidden"
              data-testid="header-logo-link"
            >
              {user?.brandLogoUrl ? (
                <img src={user.brandLogoUrl} alt="" className="w-6 h-6 md:w-8 md:h-8 rounded-lg object-contain" />
              ) : (
                <Sparkle className="w-6 h-6 md:w-8 md:h-8 text-brand-primary group-hover:brightness-110 transition-colors duration-200" />
              )}
              <span className="text-lg md:text-xl font-bold text-brand-primary font-brand">
                {user?.studioName || 'KOLOR STUDIO'}
              </span>
            </button>

            {/* Desktop greeting */}
            <div className="hidden lg:block">
              <h1 className="text-[17px] font-extrabold tracking-[-0.015em] text-text-primary">
                {getGreeting()}, {user?.firstName} <span style={{ color: '#a78bfa' }}>&#10022;</span>
              </h1>
              <p className="text-[11px] text-text-secondary">
                {leads.filter(l => l.status === 'NEW' || l.status === 'REVIEWING').length > 0
                  ? `${leads.filter(l => l.status === 'NEW' || l.status === 'REVIEWING').length} lead${leads.filter(l => l.status === 'NEW' || l.status === 'REVIEWING').length > 1 ? 's' : ''} awaiting quotes`
                  : leads.length === 0
                    ? 'Add your first lead to get started'
                    : 'Welcome back to your studio'
                } · {formatCurrentDate()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search anything…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-[200px] h-8 rounded-[7px] border border-light-200 bg-surface-background text-[11px] pl-8 pr-3 text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-400"
                  data-testid="dashboard-search"
                />
              </div>
              <HelpMenu onOpenFeedback={() => setShowFeedback(true)} />
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-light-100 rounded-xl transition-all duration-200"
                data-testid="settings-button"
                title="Settings"
              >
                <GearSix className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="hidden lg:flex items-center gap-1.5 h-8 px-3 rounded-[7px] text-white text-[11px] font-semibold transition-colors duration-fast"
              style={{ background: '#6C2EDB' }}
              data-testid="add-lead-topbar"
            >
              <Plus weight="bold" className="w-3.5 h-3.5" /> New Lead
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-text-secondary hover:text-text-primary hover:bg-light-100 rounded-xl transition-all duration-200 touch-target"
              data-testid="logout-button"
            >
              <SignOut className="w-4 h-4" />
              <span className="hidden md:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out List */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" data-testid="mobile-sidebar">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-light-50 border-r border-light-200 animate-slide-left flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-light-200">
              <div className="flex items-center gap-2">
                <Sparkle className="w-6 h-6 text-brand-primary" />
                <span className="font-bold text-lg bg-gradient-to-r from-brand-primary-light to-brand-primary-light bg-clip-text text-transparent">
                  KOLOR STUDIO
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-light-100 rounded-xl touch-target"
                data-testid="close-mobile-menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* User */}
            <div className="px-4 py-4 border-b border-light-200">
              <p className="text-sm font-medium text-text-primary">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-text-secondary mt-0.5">{user?.studioName || `${user?.firstName}'s Studio`}</p>
            </div>
            {/* Nav items */}
            <div className="flex-1 overflow-y-auto py-2">
              {([
                { mode: 'kanban' as ViewMode, icon: SquaresFour, label: 'Pipeline' },
                { mode: 'list' as ViewMode, icon: ListIcon, label: 'List View' },
                { mode: 'analytics' as ViewMode, icon: ChartBar, label: 'Analytics' },
                { mode: 'calendar' as ViewMode, icon: CalendarDots, label: 'Calendar' },
                { mode: 'portfolio' as ViewMode, icon: Briefcase, label: 'Portfolio' },
                { mode: 'sequences' as ViewMode, icon: Envelope, label: 'Sequences' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => handleViewChange(mode)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 touch-target ${
                    viewMode === mode
                      ? 'text-brand-primary bg-brand-primary/10 border-r-2 border-brand-primary'
                      : 'text-text-secondary hover:bg-light-100 hover:text-text-primary'
                  }`}
                  data-testid={`sidebar-${mode}`}
                >
                  <Icon weight={viewMode === mode ? 'fill' : 'regular'} className="w-5 h-5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            {/* Sidebar Footer */}
            <div className="p-4 border-t border-light-200 space-y-2">
              <button
                onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-text-secondary hover:bg-light-100 rounded-xl transition-all duration-200 touch-target"
              >
                <GearSix weight="regular" className="w-5 h-5" aria-hidden="true" /> Settings
              </button>
              <button
                onClick={() => { setShowFeedback(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-text-secondary hover:bg-light-100 rounded-xl transition-all duration-200 touch-target"
              >
                <Envelope className="w-5 h-5" aria-hidden="true" /> Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Welcome Message — mobile only (desktop uses topbar greeting) */}
        <div className="mb-4 lg:hidden" data-testid="welcome-section">
          {isFirstLogin ? (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-text-primary font-heading" data-testid="welcome-first-login">
                Welcome to KOLOR, {user?.firstName}!
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Your creative workspace is ready.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-text-primary font-heading" data-testid="welcome-back">
                {getGreeting()}, {user?.firstName}
              </h1>
              <p className="text-xs text-text-secondary mt-1">{formatCurrentDate()}</p>
            </div>
          )}
        </div>

        {/* Demo Project Banner */}
        {showDemoBanner && leads.some(l => l.isDemoData) && (
          <DemoProjectBanner
            demoLeadId={leads.find(l => l.isDemoData)!.id}
            onDismiss={() => setShowDemoBanner(false)}
            onDeleted={() => { setShowDemoBanner(false); fetchLeads(); }}
          />
        )}

        {/* Smart Nudge Banner — stale leads needing follow-up */}
        <SmartNudgeBanner leads={leads} onLeadClick={setSelectedLead} />

        {/* Smart Suggestion */}
        <SmartSuggestion
          leadCount={leads.length}
          hasQuotes={leads.some(l => (l.quotesCount || 0) > 0)}
          hasPortfolio={false}
          hasContracts={leads.some(l => (l.contractsCount || 0) > 0)}
          hasStudioName={!!user?.studioName}
          onAction={(action) => {
            if (action === 'open-add-lead') setShowAddModal(true)
            else if (action === 'view-kanban') {
              handleViewChange('kanban')
              setTimeout(() => {
                document.querySelector('[data-tour="kanban-board"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }, 100)
            }
            else if (action === 'view-portfolio') handleViewChange('portfolio')
            else if (action === 'open-settings') setShowSettings(true)
            else if (action === 'open-brand-settings') setShowSettings(true)
          }}
        />

        {/* Revenue Pipeline Widget */}
        {/* Active Commissions Widget - Universal for all users */}
        {leads.filter(l => l.projectType === 'COMMISSION' && !['BOOKED', 'LOST'].includes(l.status)).length > 0 && (
          <div className="mb-4 md:mb-6 bg-surface-base border border-light-200 rounded-xl p-5" data-testid="active-commissions-widget">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crosshair weight="duotone" className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-semibold text-text-primary">Active Commissions</h3>
                <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 font-medium">
                  {leads.filter(l => l.projectType === 'COMMISSION' && !['BOOKED', 'LOST'].includes(l.status)).length}
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
                data-testid="new-commission-btn"
              >
                + New Commission
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {leads
                .filter(l => !['BOOKED', 'LOST'].includes(l.status))
                .slice(0, 6)
                .map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-light-50 border border-light-200 hover:border-purple-300 transition-all cursor-pointer group"
                    data-testid={`active-commission-${lead.id}`}
                  >
                    {lead.coverImage ? (
                      <img src={lead.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-amber-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-purple-600 transition-colors">{lead.projectTitle}</p>
                      <p className="text-xs text-text-secondary">{lead.clientName}</p>
                    </div>
                    <StatusBadge status={lead.status} size="sm" />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Pending Contract Review Banner */}
        {pendingContracts.length > 0 && (
          <div className="mb-4 md:mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5" data-testid="pending-contract-banner">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase weight="duotone" className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-amber-900 mb-1">
                  Contract Ready for Review
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  <strong>{pendingContracts[0].lead?.clientName}</strong> accepted your quote for <strong>"{pendingContracts[0].lead?.projectTitle}"</strong>. Review the contract before sending it to your client.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const lead = leads.find(l => l.id === pendingContracts[0].lead?.id)
                      if (lead) {
                        setSelectedLeadInitialTab('contracts')
                        setSelectedLead(lead)
                      }
                    }}
                    className="btn btn-primary text-sm"
                    data-testid="review-contract-btn"
                  >
                    Review Contract
                  </button>
                  {pendingContracts.length > 1 && (
                    <span className="inline-flex items-center px-3 py-2 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg">
                      +{pendingContracts.length - 1} more pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 md:mb-6">
          <RevenuePipelineWidget />
        </div>

        {/* ═══ Two-column layout: Main + Right sidebar ═══ */}
        <div className={`${(viewMode === 'kanban' || viewMode === 'list') ? 'lg:grid lg:gap-6' : ''}`} style={(viewMode === 'kanban' || viewMode === 'list') ? { gridTemplateColumns: '1fr 280px' } : undefined}>
          {/* Left: Main content */}
          <div className="min-w-0">

        {/* CRM Alerts + Revenue Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div data-tour="crm-alerts">
            <CRMAlerts onLeadClick={(leadId) => {
              const lead = leads.find(l => l.id === leadId)
              if (lead) setSelectedLead(lead)
            }} />
          </div>
          <div data-tour="revenue-dashboard">
            <RevenueDashboard />
          </div>
        </div>

        {/* Industry-Specific Widgets */}
        {user?.primaryIndustry === 'PHOTOGRAPHY' && (
          <PhotographyWidgets
            onViewCalendar={() => handleViewChange('calendar')}
            onLeadClick={setSelectedLead}
          />
        )}
        {user?.primaryIndustry === 'FINE_ART' && (
          <FineArtWidgets
            onLeadClick={setSelectedLead}
            onAddLead={() => setShowAddModal(true)}
          />
        )}
        {(user?.primaryIndustry === 'GRAPHIC_DESIGN' || user?.primaryIndustry === 'WEB_DESIGN' || user?.primaryIndustry === 'BRANDING' || user?.primaryIndustry === 'ILLUSTRATION') && (
          <DesignWidgets
            onLeadClick={setSelectedLead}
            onAddLead={() => setShowAddModal(true)}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-4 md:mb-8">
          <StatCard
            icon={Users}
            label="Total Leads"
            value={stats?.total || 0}
            trend={{ direction: 'neutral', label: 'all time' }}
            // TODO: wire to API — replace placeholder with real weekly history
            sparkline={[{ value: 2 }, { value: 3 }, { value: 3 }, { value: 4 }, { value: 4 }, { value: 5 }, { value: stats?.total || 5 }]}
            accentColor="brand"
            active={statusFilter === null}
            onClick={() => clearStatusFilter()}
            testId="stat-total-leads"
          />
          <StatCard
            icon={TrendUp}
            label="New Leads"
            value={stats?.statusCounts?.NEW || 0}
            trend={{ direction: 'neutral', label: 'awaiting review' }}
            // TODO: wire to API — replace placeholder with real weekly history
            sparkline={[{ value: 1 }, { value: 2 }, { value: 1 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: stats?.statusCounts?.NEW || 2 }]}
            accentColor="brand"
            active={statusFilter === 'NEW'}
            onClick={() => handleFilterByStatus(statusFilter === 'NEW' ? null : 'NEW')}
            testId="stat-new-leads"
          />
          <StatCard
            icon={CalendarBlank}
            label="Quoted"
            value={stats?.statusCounts?.QUOTED || 0}
            trend={{ direction: 'neutral', label: 'pending approval' }}
            // TODO: wire to API — replace placeholder with real weekly history
            sparkline={[{ value: 0 }, { value: 1 }, { value: 1 }, { value: 2 }, { value: 1 }, { value: 1 }, { value: stats?.statusCounts?.QUOTED || 1 }]}
            accentColor="amber"
            active={statusFilter === 'QUOTED'}
            onClick={() => handleFilterByStatus(statusFilter === 'QUOTED' ? null : 'QUOTED')}
            testId="stat-quoted"
          />
          <StatCard
            icon={CurrencyDollar}
            label="Booked"
            value={stats?.statusCounts?.BOOKED || 0}
            trend={{ direction: 'neutral', label: 'confirmed' }}
            // TODO: wire to API — replace placeholder with real weekly history
            sparkline={[{ value: 0 }, { value: 0 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 0 }, { value: stats?.statusCounts?.BOOKED || 0 }]}
            accentColor="green"
            active={statusFilter === 'BOOKED'}
            onClick={() => handleFilterByStatus(statusFilter === 'BOOKED' ? null : 'BOOKED')}
            testId="stat-booked"
          />
        </div>

        {/* Toolbar */}
        <div className="glass-card rounded-xl border border-light-200 p-3 md:p-5 mb-4 md:mb-8">
          {/* Mobile toolbar */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-surface-base border-2 border-border rounded-input focus:border-brand-600 focus:shadow-input-focus text-text-primary placeholder-text-tertiary transition-all duration-fast text-sm"
                data-testid="search-input"
              />
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`p-2.5 rounded-xl border transition-all duration-200 touch-target md:hidden relative ${
                activeFilterCount > 0 ? 'border-brand-primary bg-purple-50 text-purple-600' : 'border-light-200 text-text-secondary'
              }`}
              data-testid="mobile-filter-toggle"
              aria-label={`Toggle filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
            >
              <Funnel className="w-4 h-4" aria-hidden="true" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={handleRefresh}
              className="p-2.5 hover:bg-light-100 rounded-xl transition-all duration-200 touch-target hidden md:flex items-center gap-2"
              disabled={refreshing}
              data-testid="refresh-button"
              aria-label={refreshing ? 'Refreshing data' : 'Refresh data'}
            >
              <ArrowsClockwise className={`w-5 h-5 text-text-secondary ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <div className="flex items-center gap-1.5" role="status" aria-live="polite">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" aria-hidden="true" />
                <span className="text-xs text-text-tertiary">Live</span>
              </div>
            </button>

            {/* Desktop view toggles */}
            <div className="hidden md:flex bg-surface-base rounded-xl p-1 border border-light-200">
              {([
                { mode: 'kanban' as ViewMode, icon: SquaresFour, title: 'Pipeline View' },
                { mode: 'list' as ViewMode, icon: ListIcon, title: 'List View' },
                { mode: 'analytics' as ViewMode, icon: ChartBar, title: 'Analytics' },
                { mode: 'calendar' as ViewMode, icon: CalendarDots, title: 'Calendar' },
                { mode: 'portfolio' as ViewMode, icon: Briefcase, title: 'Portfolio' },
                { mode: 'sequences' as ViewMode, icon: Envelope, title: 'Sequences' },
              ]).map(({ mode, icon: Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => handleViewChange(mode)}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${viewMode === mode ? 'bg-purple-50 shadow-sm text-purple-500' : 'text-text-secondary hover:text-text-primary'}`}
                  data-testid={`view-${mode}`}
                  data-tour={mode === 'portfolio' ? 'view-portfolio' : mode === 'calendar' ? 'view-calendar' : undefined}
                  title={title}
                  aria-label={title}
                  aria-pressed={viewMode === mode}
                >
                  <Icon weight={viewMode === mode ? 'fill' : 'regular'} className="w-4 h-4" aria-hidden="true" />
                </button>
              ))}
            </div>

            {/* Desktop filters */}
            <select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              className="hidden md:block px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-secondary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              data-testid="filter-project-type"
            >
              <option value="">All Types</option>
              {(Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="hidden lg:block px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-secondary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              data-testid="filter-industry"
              title="Filter leads by industry"
            >
              <option value="">Filter: All Industries</option>
              {(Object.entries(INDUSTRY_TYPE_LABELS) as [IndustryType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <button
              onClick={() => setShowShareModal(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 border border-brand-primary text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-200 font-medium text-sm"
              data-testid="share-form-button"
            >
              <LinkIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Share Form</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-brand-primary text-white rounded-xl hover:brightness-110 transition-all duration-200 font-medium text-sm hover:shadow-lg hover:shadow-brand-primary/20 touch-target"
              data-testid="add-lead-button"
              data-tour="add-lead"
            >
              <Plus weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </button>
          </div>

          {/* Mobile filters dropdown */}
          {showMobileFilters && (
            <div className="mt-3 pt-3 border-t border-light-200 space-y-3 md:hidden animate-fade-in">
              {/* Active filter tags */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {staleFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-xs text-amber-700 font-medium">Stale (7+ days)</span>
                      <button onClick={() => setStaleFilter(false)} className="p-0.5 hover:bg-amber-100 rounded" data-testid="clear-stale-filter">
                        <X className="w-3 h-3 text-amber-500" />
                      </button>
                    </div>
                  )}
                  {statusFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                      <span className="text-xs text-purple-700 font-medium">{LEAD_STATUS_LABELS[statusFilter as LeadStatus]}</span>
                      <button onClick={clearStatusFilter} className="p-0.5 hover:bg-purple-100 rounded" data-testid="clear-filter">
                        <X className="w-3 h-3 text-purple-500" />
                      </button>
                    </div>
                  )}
                  {projectTypeFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-xs text-blue-700 font-medium">{PROJECT_TYPE_LABELS[projectTypeFilter as ProjectType]}</span>
                      <button onClick={() => setProjectTypeFilter('')} className="p-0.5">
                        <X className="w-3 h-3 text-blue-500" />
                      </button>
                    </div>
                  )}
                  {industryFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-xs text-amber-700 font-medium">{INDUSTRY_TYPE_LABELS[industryFilter as IndustryType]}</span>
                      <button onClick={() => setIndustryFilter('')} className="p-0.5">
                        <X className="w-3 h-3 text-amber-500" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={projectTypeFilter}
                  onChange={(e) => setProjectTypeFilter(e.target.value)}
                  className="px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-secondary"
                  data-testid="mobile-filter-project-type"
                >
                  <option value="">All Types</option>
                  {(Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-secondary"
                  data-testid="mobile-filter-industry"
                >
                  <option value="">All Industries</option>
                  {(Object.entries(INDUSTRY_TYPE_LABELS) as [IndustryType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-brand-primary text-purple-600 rounded-xl text-sm font-medium touch-target"
                  data-testid="mobile-share-form"
                >
                  <LinkIcon className="w-4 h-4" /> Share Form
                </button>
              </div>
            </div>
          )}

          {/* Desktop active filter tags */}
          {activeFilterCount > 0 && (
            <div className="hidden md:flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-light-200">
              {statusFilter && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-xs text-purple-700 font-medium">{LEAD_STATUS_LABELS[statusFilter as LeadStatus]}</span>
                  <button onClick={clearStatusFilter} className="p-0.5 hover:bg-purple-100 rounded" data-testid="clear-filter-desktop">
                    <X className="w-3.5 h-3.5 text-purple-500" />
                  </button>
                </div>
              )}
              {projectTypeFilter && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-xs text-blue-700 font-medium">{PROJECT_TYPE_LABELS[projectTypeFilter as ProjectType]}</span>
                  <button onClick={() => setProjectTypeFilter('')} className="p-0.5 hover:bg-blue-100 rounded" data-testid="clear-project-type-filter">
                    <X className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                </div>
              )}
              {industryFilter && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs text-amber-700 font-medium">{INDUSTRY_TYPE_LABELS[industryFilter as IndustryType]}</span>
                  <button onClick={() => setIndustryFilter('')} className="p-0.5 hover:bg-amber-100 rounded" data-testid="clear-industry-filter">
                    <X className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'sequences' ? (
          <SequencesDashboard />
        ) : viewMode === 'analytics' ? (
          <AnalyticsDashboard user={user} onFilterByStatus={handleFilterByStatus} />
        ) : viewMode === 'calendar' ? (
          <CalendarViewNew 
            user={user} 
            onLeadClick={(leadId) => {
              const lead = leads.find(l => l.id === leadId)
              if (lead) {
                setSelectedLead(lead)
              } else {
                leadsApi.getOne(leadId).then(result => {
                  if (result.data?.lead) setSelectedLead(result.data.lead)
                })
              }
            }}
          />
        ) : viewMode === 'portfolio' ? (
          <PortfolioPage user={user} />
        ) : filteredLeads.length === 0 && !loading ? (
          <div className="bg-light-50 rounded-xl border border-light-200 p-6 md:p-12">
            <EmptyState
              icon={UserPlus}
              headline="Your first lead is one click away."
              description="Add a potential client and track them from first inquiry to signed contract — all in one place."
              ctaLabel="+ Add Lead"
              onCta={() => setShowAddModal(true)}
            />
          </div>
        ) : viewMode === 'kanban' ? (
          <div data-tour="kanban-board">
            <KanbanBoard
              leads={filteredLeads}
              onLeadClick={setSelectedLead}
              onStatusChange={handleStatusChange}
              onLeadDelete={handleLeadDelete}
            />
          </div>
        ) : (
          /* List view with responsive table */
          <div className="bg-light-50 rounded-xl border border-light-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-surface-base border-b border-light-200">
                  <tr>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Client</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Project</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-200">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-light-100 cursor-pointer transition-all duration-200 active:bg-light-200"
                      onClick={() => setSelectedLead(lead)}
                      data-testid={`lead-row-${lead.id}`}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-5">
                        <p className="font-medium text-text-primary text-sm">{lead.clientName}</p>
                        <p className="text-xs text-text-secondary truncate max-w-[120px] md:max-w-none">{lead.clientEmail}</p>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-5">
                        <p className="font-medium text-text-primary text-sm truncate max-w-[120px] md:max-w-none">{lead.projectTitle}</p>
                        <p className="text-xs text-text-secondary">{lead.budget || 'No budget'}</p>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-5">
                        <StatusBadge status={lead.status} size="sm" />
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-5 text-sm text-text-secondary hidden sm:table-cell">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          </div>{/* /Left column */}

          {/* Right sidebar — visible on desktop for kanban/list views */}
          {(viewMode === 'kanban' || viewMode === 'list') && (
            <aside className="hidden lg:block space-y-4" data-testid="dashboard-right-sidebar">
              {/* Onboarding Checklist */}
              <OnboardingChecklist onOpenSettings={() => setShowSettings(true)} />

              {/* Activity Feed */}
              <div className="glass-card rounded-xl border border-light-200 p-4" data-testid="activity-feed-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-text-secondary">Recent Activity</h3>
                </div>
                <ActivityFeed onLeadClick={(leadId) => {
                  const lead = leads.find(l => l.id === leadId)
                  if (lead) setSelectedLead(lead)
                  else leadsApi.getOne(leadId).then(r => { if (r.data?.lead) setSelectedLead(r.data.lead) })
                }} />
              </div>

              {/* Quick Actions */}
              <QuickActions
                leads={leads}
                onSendQuote={handleQuickSendQuote}
                onFollowUpStale={handleQuickFollowUp}
                onCheckSchedule={handleQuickCheckSchedule}
                onAddLead={() => setShowAddModal(true)}
              />

              {/* Google Calendar Connection Widget */}
              {!calendarHintDismissed && (
                <div data-testid="calendar-widget-section">
                  <CalendarConnectionWidget
                    onStatusChange={(connected) => {
                      setCalendarConnected(connected)
                      if (connected) {
                        setCalendarHintDismissed(true)
                        localStorage.setItem('kolor_calendar_hint_dismissed', 'true')
                      }
                    }}
                  />
                  {!calendarConnected && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        onClick={() => {
                          setCalendarHintDismissed(true)
                          localStorage.setItem('kolor_calendar_hint_dismissed', 'true')
                        }}
                        className="text-[11px] text-text-tertiary hover:text-text-secondary transition"
                        data-testid="dismiss-calendar-widget"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>{/* /Two-column layout */}

        {/* Mobile-only: Onboarding + Activity Feed + Quick Actions (stacked below content) */}
        {(viewMode === 'kanban' || viewMode === 'list') && (
          <div className="lg:hidden mt-4 space-y-4">
            <OnboardingChecklist onOpenSettings={() => setShowSettings(true)} />
            <div className="glass-card rounded-xl border border-light-200 p-4" data-testid="activity-feed-card-mobile">
              <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-text-secondary mb-3">Recent Activity</h3>
              <ActivityFeed onLeadClick={(leadId) => {
                const lead = leads.find(l => l.id === leadId)
                if (lead) setSelectedLead(lead)
                else leadsApi.getOne(leadId).then(r => { if (r.data?.lead) setSelectedLead(r.data.lead) })
              }} />
            </div>
            <QuickActions
              leads={leads}
              onSendQuote={handleQuickSendQuote}
              onFollowUpStale={handleQuickFollowUp}
              onCheckSchedule={handleQuickCheckSchedule}
              onAddLead={() => setShowAddModal(true)}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav 
        viewMode={viewMode} 
        onViewChange={handleViewChange}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Modals */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => { setSelectedLead(null); setSelectedLeadInitialTab(undefined) }}
          onUpdate={handleLeadUpdate}
          onCelebrate={triggerCelebration}
          initialTab={selectedLeadInitialTab}
        />
      )}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onLeadCreated={() => {
            fetchLeads(); fetchStats()
            triggerCelebration('first_project', 'firstProject')
          }}
        />
      )}
      {showShareModal && <ShareFormModal onClose={() => setShowShareModal(false)} userId={user?.id} />}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSettingsUpdate={(newSettings) => {
            if (user) {
              setUser({
                ...user,
                currency: newSettings.currency,
                currencySymbol: newSettings.currencySymbol,
                currencyPosition: newSettings.currencyPosition as 'BEFORE' | 'AFTER',
                numberFormat: newSettings.numberFormat,
                defaultTaxRate: newSettings.defaultTaxRate,
              });
            }
          }}
          onRestartTutorial={resetWizard}
        />
      )}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showBookingModal && bookingLead && (
        <BookingModal
          lead={bookingLead}
          onClose={() => { setShowBookingModal(false); setBookingLead(null) }}
          onSaved={handleBookingSaved}
        />
      )}
      <div data-tour="help-button">
        <HelpButton onClick={() => setShowHelpPanel(true)} />
      </div>
      <HelpPanel open={showHelpPanel} onClose={() => setShowHelpPanel(false)} startTour={startTour} />
      <CelebrationModal
        achievement={celebration}
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </div>
    </div>
  )
}

export default Dashboard
