import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import KolorLogo from '../components/KolorLogo'
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { SquaresFour } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { List as ListIcon } from '@phosphor-icons/react/dist/csr/List'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise'
import { Users } from '@phosphor-icons/react/dist/csr/Users'
import { TrendUp } from '@phosphor-icons/react/dist/csr/TrendUp'
import { CurrencyDollar } from '@phosphor-icons/react/dist/csr/CurrencyDollar'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { Link as LinkIcon } from '@phosphor-icons/react/dist/csr/Link'
import { Copy } from '@phosphor-icons/react/dist/csr/Copy'
import { Envelope } from '@phosphor-icons/react/dist/csr/Envelope'
import { Crosshair } from '@phosphor-icons/react/dist/csr/Crosshair'
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix'
import { ChartBar } from '@phosphor-icons/react/dist/csr/ChartBar'
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Briefcase } from '@phosphor-icons/react/dist/csr/Briefcase'
import { Bell } from '@phosphor-icons/react/dist/csr/Bell'
import { Funnel } from '@phosphor-icons/react/dist/csr/Funnel'
import { authApi, leadsApi, Lead, LeadStatus, User as UserType, LEAD_STATUS_LABELS, Booking, ProjectType, IndustryType, PROJECT_TYPE_LABELS, INDUSTRY_TYPE_LABELS, contractsApi, analyticsApi, DashboardAnalytics, MonthlyTrendData } from '../services/api'
import MobileBottomNav from '../components/MobileBottomNav'
import HelpPanel, { HelpButton } from '../components/HelpPanel'
import { PhotographyWidgets, FineArtWidgets, DesignWidgets } from '../components/IndustryWidgets'
import { useOnboardingTour } from '../components/OnboardingTour'
import OnboardingWizard, { useOnboardingWizard } from '../components/OnboardingWizard'
import { SmartSuggestion } from '../components/SmartSuggestion'
import { CelebrationModal, checkCelebration, Achievement, achievements } from '../components/CelebrationModal'
// Iter 181 — lazify conditionally-rendered heavy components to shrink Dashboard chunk.
const CRMAlerts = lazy(() => import('../components/CRMAlerts'))
const RevenueDashboard = lazy(() => import('../components/RevenueDashboard'))
const NeedsAttentionSection = lazy(() => import('../components/NeedsAttentionSection'))
import { trackLogout, trackViewChanged } from '../utils/analytics'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { StatCard } from '../components/StatCard'
import { SmartNudgeBanner } from '../components/SmartNudgeBanner'
import { getIndustryLanguage } from '../utils/industryLanguage'
import { UserPlus } from '@phosphor-icons/react/dist/csr/UserPlus'
import { Receipt } from '@phosphor-icons/react/dist/csr/Receipt'
import { ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck'
import KolorSpinner from '../components/KolorSpinner'
import NumberFlow from '@number-flow/react'

// Iter 172 — lazy heavy sub-views to shrink initial Dashboard chunk.
// Each is only rendered when its viewMode/modal trigger is active.
const KanbanBoard = lazy(() => import('../components/KanbanBoard'))
const LeadDetailModal = lazy(() => import('../components/LeadDetailModal'))
const SettingsModal = lazy(() => import('../components/SettingsModal'))
const AnalyticsDashboard = lazy(() => import('../components/AnalyticsDashboard'))
const PortfolioPage = lazy(() => import('./Portfolio'))
const CommunityFeed = lazy(() => import('../components/CommunityFeed'))
const AddLeadModal = lazy(() => import('../components/AddLeadModal'))
const ShareFormModal = lazy(() => import('../components/ShareFormModal'))
const FeedbackModal = lazy(() => import('../components/FeedbackModal'))
const AnnouncementBanner = lazy(() => import('../components/AnnouncementBanner'))
const BookingModal = lazy(() => import('../components/BookingModal'))
const OnboardingChecklist = lazy(() => import('../components/OnboardingChecklist'))
const OnboardingFlow = lazy(() => import('../components/OnboardingFlow'))
const RevenueGoalWidget = lazy(() => import('../components/RevenueGoalWidget'))
const EmailVerificationBanner = lazy(() => import('../components/EmailVerificationBanner'))
const DemoProjectBanner = lazy(() => import('../components/DemoProjectBanner'))
const LeadsListView = lazy(() => import('../components/LeadsListView'))
const TodayScreen = lazy(() => import('../components/TodayScreen'))
import FloatingActionMenu from '../components/FloatingActionMenu'
const CommunityDiscover = lazy(() => import('../components/CommunityDiscover'))
const DMView = lazy(() => import('../components/DMView'))
const SequencesDashboard = lazy(() => import('./SequencesDashboard'))
const QuotesPage = lazy(() => import('./Quotes'))
const ContractsPage = lazy(() => import('./Contracts'))

type ViewMode = 'kanban' | 'list' | 'analytics' | 'calendar' | 'portfolio' | 'sequences' | 'quotes' | 'contracts' | 'community';

// Skeleton components for loading states
// Iter 177 — shimmer keyframe moved to global index.css (.ks-shimmer)

const StatCardSkeleton = () => (
  <div className="bg-light-50 rounded-xl p-4 md:p-6 border border-light-100">
    <div className="flex items-center gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 ks-shimmer rounded-xl" />
      <div className="space-y-2">
        <div className="h-6 md:h-7 w-12 md:w-16 ks-shimmer rounded-md" />
        <div className="h-3 md:h-4 w-16 md:w-24 ks-shimmer rounded-md opacity-60" />
      </div>
    </div>
  </div>
);

const KanbanSkeleton = () => (
  <div className="space-y-4 md:flex md:gap-5 md:space-y-0 overflow-x-auto pb-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex-shrink-0 w-full md:w-72 rounded-xl border-2 border-light-200 bg-light-50">
        <div className="h-12 bg-light-200 rounded-t-lg" />
        <div className="p-4 space-y-4">
          {[1, 2].map((j) => (
            <div key={j} className="bg-light-50 rounded-lg p-4 space-y-3 border border-light-200">
              <div className="h-24 md:h-32 ks-shimmer rounded-lg" />
              <div className="h-4 w-3/4 ks-shimmer rounded" />
              <div className="h-3 w-1/2 ks-shimmer rounded opacity-60" />
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
  const [searchParams, setSearchParams] = useSearchParams()
  // Deep-link support: read `?view=quotes|contracts|analytics|sequences|portfolio|list|kanban|calendar` from the URL so tabs can be bookmarked/shared.
  const VALID_VIEWS: ViewMode[] = ['kanban', 'list', 'analytics', 'calendar', 'portfolio', 'sequences', 'quotes', 'contracts', 'community']
  const initialViewFromUrl = searchParams.get('view') as ViewMode | null
  const initialView: ViewMode = (initialViewFromUrl && VALID_VIEWS.includes(initialViewFromUrl)) ? initialViewFromUrl : 'kanban'
  const [user, setUser] = useState<UserType | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedLeadInitialTab, setSelectedLeadInitialTab] = useState<string | undefined>(undefined)
  const leadModalModified = useRef(false)

  // Deep-link: ?leadId=xxx&section=contracts opens a lead to a specific tab
  useEffect(() => {
    const dlLeadId = searchParams.get('leadId')
    const dlSection = searchParams.get('section')
    if (!dlLeadId) return
    leadsApi.getOne(dlLeadId).then(r => {
      if (r.data?.lead) {
        if (dlSection) setSelectedLeadInitialTab(dlSection)
        setSelectedLead(r.data.lead)
      }
    }).catch(() => {})
    // Clear deep-link params from URL
    const cleaned = new URLSearchParams(searchParams)
    cleaned.delete('leadId')
    cleaned.delete('section')
    setSearchParams(cleaned, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<'currency' | 'brand' | 'testimonials' | 'email' | 'scheduling' | 'account' | undefined>(undefined)
  const [showFeedback, setShowFeedback] = useState(false)
  // Iter 146 — Task 1d: collapse industry widgets by default
  const [showIndustryWidgets, setShowIndustryWidgets] = useState(false)
  // Iter 146 — Task 2b: sidebar user block dropdown with Settings + Logout
  // userMenu removed in iter-211 — user block opens Settings directly
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [stats, setStats] = useState<{ total: number; statusCounts: Record<string, number> } | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [notifList, setNotifList] = useState<any[]>([])
  const [showBellDropdown, setShowBellDropdown] = useState(false)
  const [communityTab, setCommunityTab] = useState<'feed' | 'discover' | 'dms'>('feed')
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('')
  const [industryFilter, setIndustryFilter] = useState<string>('')

  // Only show filter options that are actually represented in the user's current leads
  // — avoids confusing "All Types" menus with 10+ internal/legacy categories
  const availableProjectTypes = useMemo(() => {
    const present = new Set(leads.map(l => l.projectType).filter(Boolean) as ProjectType[])
    return (Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).filter(([k]) => present.has(k))
  }, [leads])

  // Industry filter: collapse to the 3 canonical buckets that match the frontend's getIndustryLanguage()
  const CANONICAL_INDUSTRY_LABELS: Record<string, string> = {
    PHOTOGRAPHY: 'Photography',
    GRAPHIC_DESIGN: 'Design',
    FINE_ART: 'Fine Art',
  }
  const availableIndustries = useMemo(() => {
    const present = new Set(leads.map(l => l.industry).filter(Boolean) as string[])
    // Collapse WEB_DESIGN / ILLUSTRATION / BRANDING into the Design bucket for the UI
    const designAliases = ['GRAPHIC_DESIGN', 'WEB_DESIGN', 'ILLUSTRATION', 'BRANDING']
    const photoAliases = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'CONTENT_CREATION']
    const fineArtAliases = ['FINE_ART', 'SCULPTURE']
    const buckets: Array<{ key: string; label: string; matches: string[] }> = [
      { key: 'PHOTOGRAPHY', label: 'Photography', matches: photoAliases },
      { key: 'GRAPHIC_DESIGN', label: 'Design', matches: designAliases },
      { key: 'FINE_ART', label: 'Fine Art', matches: fineArtAliases },
    ]
    return buckets.filter(b => b.matches.some(m => present.has(m)))
  }, [leads])
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
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
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendData[]>([])
  const { startTour, tourComplete } = useOnboardingTour()
  const { showWizard, setShowWizard, resetWizard } = useOnboardingWizard(leads.length)
  const lang = getIndustryLanguage(
    user?.industry || user?.primaryIndustry as any
  )

  // Sparkline helper — last 7 months of trend data as sparkline points
  const toSparkline = (data: MonthlyTrendData[], key: 'count' | 'revenue', fallback: number) => {
    if (!data.length) return [{ value: fallback }]
    return data.slice(-7).map(d => ({ value: d[key] ?? 0 }))
  }

  // Booked card trend direction from analytics
  const bookedTrend: 'up' | 'down' | 'neutral' =
    (analytics?.overview.bookedThisMonth.changePercent ?? 0) > 0 ? 'up' :
    (analytics?.overview.bookedThisMonth.changePercent ?? 0) < 0 ? 'down' : 'neutral'

  // Needs Attention derivation — computed from existing leads
  const DAY = 86_400_000
  const needsAttention = leads
    .filter(l => !l.isDemoData && l.status !== 'LOST')
    .reduce<{ lead: Lead; reason: 'overdue_quote' | 'stale_contact' | 'awaiting_contract' | 'no_response' }[]>((acc, lead) => {
      const age = Date.now() - new Date(lead.updatedAt).getTime()
      if (lead.status === 'BOOKED' && (lead.contractsCount ?? 0) === 0) {
        acc.push({ lead, reason: 'awaiting_contract' })
        return acc
      }
      if (lead.status === 'QUOTED' && age > 7 * DAY) {
        acc.push({ lead, reason: 'overdue_quote' })
        return acc
      }
      if (lead.status === 'QUOTED' && age > 3 * DAY) {
        acc.push({ lead, reason: 'no_response' })
        return acc
      }
      if (['NEW', 'CONTACTED'].includes(lead.status) && age > 5 * DAY) {
        acc.push({ lead, reason: 'stale_contact' })
        return acc
      }
      return acc
    }, [])
    .slice(0, 5)

  // Read ?openLead=<id> URL param on mount — survives mobile Safari full-page reload
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlLeadId = params.get('openLead')
    const urlTab = params.get('openLeadTab') || undefined
    if (!urlLeadId) return
    // Clear param from URL without triggering navigation
    window.history.replaceState({}, '', '/dashboard')
    const tryOpen = () => {
      const lead = leads.find(l => l.id === urlLeadId)
      if (lead) {
        if (urlTab) setSelectedLeadInitialTab(urlTab)
        setSelectedLead(lead)
      } else {
        leadsApi.getOne(urlLeadId).then(r => {
          if (r.data?.lead) {
            if (urlTab) setSelectedLeadInitialTab(urlTab)
            setSelectedLead(r.data.lead)
          }
        })
      }
    }
    if (leads.length > 0) tryOpen()
    else setTimeout(tryOpen, 1000)
  }, [leads])

  // Iter 228 — poll community notification unread count
  useEffect(() => {
    if (!user) return
    const API_URL = (import.meta as any).env?.VITE_API_URL || ''
    const fetchUnread = () => {
      fetch(`${API_URL}/api/community/notifications`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) {
            setUnreadNotifs(d.unread || 0)
            setNotifList(d.notifications || [])
          }
        })
        .catch(() => {})
    }
    fetchUnread()
    const id = setInterval(fetchUnread, 60000)
    return () => clearInterval(id)
  }, [user])


  // Listen for lead-open requests from Calendar page and other entry points
  useEffect(() => {
    const handleOpenLead = (e: Event) => {
      const ce = e as CustomEvent<{ leadId: string; tab?: string }>
      const leadId = ce.detail?.leadId
      const tab = ce.detail?.tab
      if (!leadId) return
      // Try from already-loaded leads first
      const lead = leads.find(l => l.id === leadId)
      if (lead) {
        if (tab) setSelectedLeadInitialTab(tab)
        setSelectedLead(lead)
        return
      }
      // Leads may still be loading — fetch directly
      leadsApi.getOne(leadId).then(r => {
        if (r.data?.lead) {
          if (tab) setSelectedLeadInitialTab(tab)
          setSelectedLead(r.data.lead)
        }
      }).catch(() => {
        // Retry once after leads finish loading
        setTimeout(() => {
          const retryLead = leads.find(l => l.id === leadId)
          if (retryLead) {
            if (tab) setSelectedLeadInitialTab(tab)
            setSelectedLead(retryLead)
          }
        }, 1000)
      })
    }
    window.addEventListener('kolor:openLead', handleOpenLead)
    return () => window.removeEventListener('kolor:openLead', handleOpenLead)
  }, [leads])

  useEffect(() => {
    const init = async () => {
      let userResult = await authApi.getMe()
      // Iter 181 — retry once after 800ms before giving up. Handles cold Railway start
      // where the first request may return 500 and otherwise loops user back to /login.
      if (userResult.error) {
        await new Promise(r => setTimeout(r, 800))
        userResult = await authApi.getMe()
      }
      if (userResult.error) {
        localStorage.removeItem('user')
        navigate('/login')
        return
      }

      if (userResult.data?.user) {
        setUser(userResult.data.user)
        // Server-authoritative first-login detection via sessionStorage flag set by Login/Signup
        // (server returns isFirstLogin: true only on the very first successful login, based on lastLoginAt).
        // This eliminates the Desktop/Mobile session discrepancy caused by the old localStorage-only flag.
        const firstLoginSession = sessionStorage.getItem('kolor_first_login_session') === 'true'
        const ahaCompleted = localStorage.getItem('kolor_aha_completed') === 'true'
        if (firstLoginSession) {
          setIsFirstLogin(true)
          // Keep legacy flag in sync so older code paths that read it keep working
          localStorage.setItem('kolor_has_logged_in', 'true')
          sessionStorage.removeItem('kolor_first_login_session')
          // Only show onboarding once ever per device (flag is set in OnboardingFlow on send/dismiss)
          if (!ahaCompleted) {
            setTimeout(() => setShowOnboarding(true), 800)
          }
        }
      }

      await Promise.all([
        fetchLeads(),
        fetchStats(),
        fetchPendingContracts(),
      ])

      setLoading(false)

      // Fetch analytics and monthly trend AFTER initial render — non-blocking deferred fetch
      // so sparklines + revenue goal populate in the background without delaying TTI.
      setTimeout(() => {
        Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getMonthlyTrend(),
        ]).then(([analyticsResult, trendResult]) => {
          if (analyticsResult.data) setAnalytics(analyticsResult.data)
          if (trendResult.data?.trend) setMonthlyTrend(trendResult.data.trend)
        }).catch(e => console.error('[Dashboard] analytics fetch failed:', e))
      }, 0)

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
    if (!loading && user && !tourComplete && !showWizard && !showOnboarding) {
      const timer = setTimeout(() => startTour(), 1500)
      return () => clearTimeout(timer)
    }
  }, [loading, user, tourComplete, startTour, showWizard, showOnboarding])

  // Iter 162 — ? keyboard shortcut to toggle HelpPanel
  // Documented in HelpPanel Pro Tips — now implemented
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setShowHelpPanel(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    await Promise.all([
      fetchLeads(),
      fetchStats(),
      fetchPendingContracts(),
    ])
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
    // Iter 145 — Scroll to top so the new view is immediately visible, especially on mobile
    // where the user may be scrolled deep into a Kanban column. Respect prefers-reduced-motion.
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
    }
    // Sync deep-link: `kanban` is the default so it's represented by the absence of `?view=`.
    // Preserve other query params (e.g. `leadId`) while only mutating the `view` param.
    const next = new URLSearchParams(searchParams)
    if (view === 'kanban') next.delete('view')
    else next.set('view', view)
    setSearchParams(next, { replace: true })
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

  const handleLeadDelete = (leadId: string) => {
    // Iter 147 — Universal undo pattern
    const deletedLead = leads.find(l => l.id === leadId)
    if (!deletedLead) return

    setLeads(prev => prev.filter(l => l.id !== leadId))

    let undoTimeout: ReturnType<typeof setTimeout>

    const toastId = toast(
      <div className="flex items-center justify-between gap-3 w-full">
        <span className="text-sm">
          <span className="font-medium">{deletedLead.clientName}</span>
          <span className="text-text-secondary"> deleted</span>
        </span>
        <button
          onClick={() => {
            clearTimeout(undoTimeout)
            toast.dismiss(toastId)
            setLeads(prev => [deletedLead, ...prev])
          }}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition flex-shrink-0 underline"
          data-testid="undo-lead-delete"
        >
          Undo
        </button>
      </div>,
      { duration: 5000, position: 'bottom-right' }
    )

    undoTimeout = setTimeout(async () => {
      const result = await leadsApi.delete(leadId)
      if (result.error) {
        setLeads(prev => [deletedLead, ...prev])
        toast.error('Failed to delete lead — restored')
      } else {
        fetchStats()
      }
    }, 5000)
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
      setSelectedLeadInitialTab('pipeline')
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
    navigate('/calendar')
  }

  const activeFilterCount = [statusFilter, projectTypeFilter, industryFilter, staleFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center gap-4">
        <KolorSpinner size={40} />
        <p className="text-xs text-text-tertiary tracking-wide">Loading your studio…</p>
      </div>
    )
  }

  return (
    <>
      <AnnouncementBanner />
      <EmailVerificationBanner user={user} />
    <div className="min-h-screen bg-surface-base flex overflow-x-hidden" onClick={(e) => { if (showBellDropdown && !(e.target as Element).closest('[data-testid="bell-wrapper"]')) setShowBellDropdown(false) }}>

      {/* Onboarding Wizard for new users */}
      {showWizard && !showOnboarding && (
        <OnboardingWizard onComplete={() => setShowWizard(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col bg-surface-base border-r border-light-200 h-screen sticky top-0 overflow-y-auto" style={{ width: '220px', minWidth: '220px', padding: '16px 12px' }} data-testid="desktop-sidebar">
        {/* Logo */}
        <button
          onClick={() => { setViewMode('kanban'); setStatusFilter(null) }}
          className="block mb-4 px-1"
          data-testid="sidebar-logo"
          aria-label="Go to dashboard"
        >
          <KolorLogo variant="dark" size="md" markOnly={false} linkTo={null} />
        </button>

        {/* User block */}
        <div
          className="flex items-center gap-2.5 rounded-xl p-2.5 mb-1 cursor-pointer transition-all duration-150 border border-transparent hover:border-purple-200"
          style={{ background: 'var(--surface-background)' }}
          onClick={() => setShowSettings(true)}
          data-testid="sidebar-user-block"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-text-primary truncate">{user?.firstName} {user?.lastName}</div>
            <div className="text-xs text-text-secondary">Beta · Free plan</div>
          </div>
        </div>

        <div className="mb-3" />

        {/* Workspace nav */}
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-2 mb-1 mt-2">Workspace</div>
        <div className="group">
        {([
          { mode: 'kanban' as ViewMode, icon: SquaresFour, label: 'Today' },
          { mode: 'list' as ViewMode, icon: ListIcon, label: 'Clients', badge: stats?.total },
        ]).map(({ mode, icon: Icon, label, badge }) => (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-opacity duration-150 mb-0.5 relative ${
              viewMode === mode ? 'text-brand-600 font-semibold opacity-100' : 'text-text-secondary group-hover:opacity-60 hover:!opacity-100 hover:bg-surface-background hover:text-text-primary'
            }`}
            style={viewMode === mode ? { background: 'rgba(108,46,219,0.08)' } : undefined}
            data-testid={`sidebar-${mode}`}
          >
            {viewMode === mode && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-brand-600" />}
            <Icon weight={viewMode === mode ? 'fill' : 'regular'} className="w-[14px] h-[14px]" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="ml-auto text-[10px] font-bold rounded-full px-1.5 py-px" style={{ background: 'rgba(108,46,219,0.12)', color: '#6C2EDB' }}>{badge}</span>
            )}
          </button>
        ))}
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-2 mb-1 mt-3">Schedule</div>
        <div className="group">
        <button
          onClick={() => navigate('/calendar')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-opacity duration-150 mb-0.5 relative text-text-secondary group-hover:opacity-60 hover:!opacity-100 hover:bg-surface-background hover:text-text-primary"
          data-testid="sidebar-calendar"
        >
          <CalendarDots weight="regular" className="w-[14px] h-[14px]" />
          Calendar
        </button>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-2 mb-1 mt-3">Account</div>
        <div className="group">
        {([
          { mode: 'portfolio' as ViewMode, icon: Briefcase, label: 'Portfolio' },
          { mode: 'community' as ViewMode, icon: Users, label: 'Community' },
        ]).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-opacity duration-150 mb-0.5 relative ${
              viewMode === mode ? 'text-brand-600 font-semibold opacity-100' : 'text-text-secondary group-hover:opacity-60 hover:!opacity-100 hover:bg-surface-background hover:text-text-primary'
            }`}
            style={viewMode === mode ? { background: 'rgba(108,46,219,0.08)' } : undefined}
            data-testid={`sidebar-${mode}`}
          >
            {viewMode === mode && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-brand-600" />}
            <Icon weight={viewMode === mode ? 'fill' : 'regular'} className="w-[14px] h-[14px]" />
            {label}
          </button>
        ))}
        </div>

        <div className="flex-1" />

        {/* Beta plan card */}
        <div className="rounded-lg p-3 mb-2" style={{ background: 'linear-gradient(135deg, rgba(108,46,219,0.07), rgba(108,46,219,0.03))', border: '0.5px solid rgba(108,46,219,0.18)' }}>
          <div className="text-[10px] font-bold uppercase tracking-[0.06em]" style={{ color: '#6C2EDB' }}>Beta Access</div>
          <div className="text-xs font-bold text-text-primary">$97 one-time</div>
          <div className="text-[10px] text-text-secondary">Founding member &#10022;</div>
        </div>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-secondary hover:bg-surface-background transition-all duration-150 mb-0.5"
          data-testid="sidebar-settings"
        >
          <GearSix weight="regular" className="w-[14px] h-[14px]" />
          Settings
        </button>

        {/* Help */}
        <button
          onClick={() => setShowHelpPanel(true)}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-secondary hover:bg-surface-background transition-all duration-150"
          data-testid="sidebar-help-btn"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 6.2c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.3-1 1.7-.3.2-.5.4-.6.6-.1.2-.2.3-.2.5M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Help
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-secondary hover:bg-surface-background transition-all duration-150"
          data-testid="sidebar-logout-footer"
        >
          <SignOut className="w-[14px] h-[14px]" weight="regular" />
          Log out
        </button>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">

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
              className="flex items-center group transition-all duration-200 hover:opacity-80 lg:hidden"
              data-testid="header-logo-link"
              aria-label="Go to dashboard"
            >
              <KolorLogo variant="dark" size="md" linkTo={null} />
            </button>

            {/* Desktop greeting */}
            <div className="hidden lg:block">
              <h1 className="text-[17px] font-extrabold tracking-[-0.015em] text-text-primary">
                {getGreeting()}, {user?.firstName} <span style={{ color: '#a78bfa' }}>&#10022;</span>
              </h1>
              <p className="text-xs text-text-secondary">
                {(() => {
                  const awaitingCount = leads.filter(l => l.status === 'NEW' || l.status === 'REVIEWING').length
                  if (awaitingCount > 0) return `${awaitingCount} ${awaitingCount === 1 ? lang.lead.toLowerCase() : lang.leads.toLowerCase()} awaiting ${lang.quotes.toLowerCase()}`
                  if (leads.length === 0) return `Add your first ${lang.lead.toLowerCase()} to get started`
                  return 'Welcome back to your studio'
                })()} · {formatCurrentDate()}
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
                  className="w-[200px] h-8 rounded-lg border border-light-200 bg-surface-background text-xs pl-8 pr-3 text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-400"
                  data-testid="dashboard-search"
                />
              </div>
            </div>
              {/* Notification bell — dropdown on tap (iter-228c) */}
              <div className="relative" data-testid="bell-wrapper">
                <button
                  onClick={() => setShowBellDropdown(prev => !prev)}
                  className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-background)] active:scale-90 transition-all"
                  aria-label={unreadNotifs > 0 ? `${unreadNotifs} unread notifications` : 'Notifications'}
                  data-testid="header-notification-bell"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E8891A]" aria-hidden="true" />
                  )}
                </button>

                {showBellDropdown && (
                  <div
                    className="absolute right-0 top-10 z-50 rounded-2xl shadow-xl overflow-hidden"
                    style={{
                      width: '300px',
                      background: 'var(--surface-base)',
                      border: '0.5px solid var(--border)',
                    }}
                    data-testid="bell-dropdown"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b"
                      style={{ borderColor: 'var(--border)' }}>
                      <span className="text-xs font-bold text-text-primary">Notifications</span>
                      {unreadNotifs > 0 && (
                        <button
                          onClick={() => {
                            const API_URL = (import.meta as any).env?.VITE_API_URL || ''
                            fetch(`${API_URL}/api/community/notifications/read`, {
                              method: 'PATCH', credentials: 'include'
                            }).then(() => {
                              setUnreadNotifs(0)
                              setNotifList(prev => prev.map(n => ({ ...n, isRead: true })))
                            })
                          }}
                          data-testid="bell-mark-all-read"
                          className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifList.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[var(--text-tertiary)]">
                        No notifications yet
                      </div>
                    ) : (
                      notifList.slice(0, 5).map((n: any) => {
                        const labels: Record<string, string> = {
                          POST_LIKED: '♥ liked your post',
                          POST_COMMENTED: '○ commented on your post',
                          DM_RECEIVED: '→ sent you a message',
                          NEW_FOLLOWER: '+ started following you',
                        }
                        return (
                          <button
                            key={n.id}
                            onClick={() => {
                              const API_URL = (import.meta as any).env?.VITE_API_URL || ''
                              handleViewChange('community')
                              setCommunityTab(n.type === 'DM_RECEIVED' ? 'dms' : 'feed')
                              setShowBellDropdown(false)
                              fetch(`${API_URL}/api/community/notifications/read`, {
                                method: 'PATCH', credentials: 'include'
                              }).then(() => setUnreadNotifs(0))
                            }}
                            className="w-full text-left px-4 py-3 border-b flex items-center gap-2 hover:bg-[var(--surface-background)] transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: n.isRead ? 'transparent' : '#E8891A' }}
                            />
                            <span className="text-xs text-text-primary flex-1 truncate">
                              {labels[n.type] || 'New notification'}
                            </span>
                            <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
                              {(() => {
                                const diff = Date.now() - new Date(n.createdAt).getTime()
                                const mins = Math.floor(diff / 60000)
                                if (mins < 1) return 'just now'
                                if (mins < 60) return `${mins}m`
                                const hrs = Math.floor(mins / 60)
                                if (hrs < 24) return `${hrs}h`
                                return `${Math.floor(hrs / 24)}d`
                              })()}
                            </span>
                          </button>
                        )
                      })
                    )}
                    <button
                      onClick={() => { handleViewChange('community'); setCommunityTab('feed'); setShowBellDropdown(false) }}
                      className="w-full px-4 py-3 text-xs font-medium text-center hover:bg-[var(--surface-background)] transition-colors"
                      style={{ color: '#6C2EDB' }}
                    >
                      Go to Community →
                    </button>
                  </div>
                )}
              </div>
              {/* Iter 144 — HelpMenu + Settings gear removed from top header (kept in sidebar). */}
            {/* Iter 170 — header CTA removed; entry points: empty state, kanban "+" columns, keyboard shortcut, sidebar. */}
            {/* Iter 146 — Task 2b: Logout moved from header into sidebar user block dropdown. */}
          </div>
        </div>
      </header>

      {/* Mobile Slide-out List */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" data-testid="mobile-sidebar">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-light-50 border-r border-light-200 animate-slide-left flex flex-col" style={{ paddingBottom: "calc(65px + env(safe-area-inset-bottom))" }}>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-light-200">
              <KolorLogo variant="dark" size="md" linkTo={null} />
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
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingTop: "8px", paddingBottom: "8px" }}>
              {([
                { mode: 'kanban' as ViewMode, icon: SquaresFour, label: 'Today' },
                { mode: 'list' as ViewMode, icon: ListIcon, label: 'Clients' },
                { mode: 'portfolio' as ViewMode, icon: Briefcase, label: 'Portfolio' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => handleViewChange(mode)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 touch-target ${
                    viewMode === mode
                      ? 'text-brand-primary bg-brand-primary/10 border-r-2 border-brand-primary'
                      : 'text-text-secondary hover:bg-light-100 hover:text-text-primary'
                  }`}
                  data-testid={`mobile-menu-${mode}`}
                >
                  <Icon weight={viewMode === mode ? 'fill' : 'regular'} className="w-5 h-5" aria-hidden="true" />
                  {label}
                </button>
              ))}
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/calendar') }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 touch-target text-text-secondary hover:bg-light-100 hover:text-text-primary"
                data-testid="mobile-menu-calendar"
              >
                <CalendarDots weight="regular" className="w-5 h-5" aria-hidden="true" />
                Calendar & Booking
              </button>
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
                onClick={() => { setMobileMenuOpen(false); setTimeout(() => setShowHelpPanel(true), 200) }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-text-secondary hover:bg-light-100 rounded-xl transition-all duration-200 touch-target"
                data-testid="mobile-help-btn"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6.2c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.3-1 1.7-.3.2-.5.4-.6.6-.1.2-.2.3-.2.5M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                Help
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 touch-target"
                data-testid="mobile-menu-logout"
              >
                <SignOut className="w-5 h-5" aria-hidden="true" /> Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 md:px-8 py-4 md:py-8 pb-24 lg:pb-8">
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
        {viewMode === 'kanban' && showDemoBanner && leads.some(l => l.isDemoData) && (
          <DemoProjectBanner
            demoLeadId={leads.find(l => l.isDemoData)!.id}
            onDismiss={() => setShowDemoBanner(false)}
            onDeleted={() => { setShowDemoBanner(false); fetchLeads(); }}
            onExplore={() => {
              const demoLead = leads.find(l => l.isDemoData)
              if (demoLead) setSelectedLead(demoLead)
            }}
          />
        )}

        {/* Smart Nudge Banner — stale leads needing follow-up */}
        {viewMode === 'list' && <SmartNudgeBanner leads={leads} onLeadClick={setSelectedLead} />}

        {/* Smart Suggestion */}
        {viewMode === 'list' && (
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
            else if (action === 'view-portfolio') {
              // Iter 163 — always open the in-app portfolio management view.
              // The user can preview the public URL from inside the portfolio page.
              handleViewChange('portfolio')
            }
            else if (action === 'open-settings') setShowSettings(true)
            else if (action === 'open-brand-settings') { setSettingsInitialTab('email'); setShowSettings(true) }
          }}
        />
        )}

        {viewMode === 'quotes' ? (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><KolorSpinner size={32} /></div>}>
            <QuotesPage lang={lang} user={user} leads={leads} />
          </Suspense>
        ) : viewMode === 'contracts' ? (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><KolorSpinner size={32} /></div>}>
            <ContractsPage
              lang={lang}
              user={user}
              leads={leads}
              onLeadClick={setSelectedLead}
              onLeadClickTab={(lead, tab) => { setSelectedLeadInitialTab(tab); setSelectedLead(lead); }}
            />
          </Suspense>
        ) : (
        <>

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
                + {lang.newLead.replace('+ ', '')}
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
                      <img src={lead.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
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
        {viewMode === 'kanban' && pendingContracts.length > 0 && (
          <div className="mb-4 md:mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5" data-testid="pending-contract-banner">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase weight="duotone" className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-amber-900 mb-1">
                  Contract Awaiting Signature
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  <strong>{pendingContracts[0].lead?.clientName}</strong> has been sent a contract for <strong>"{pendingContracts[0].lead?.projectTitle}"</strong>. Awaiting their signature.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const lead = leads.find(l => l.id === pendingContracts[0].lead?.id)
                      if (lead) {
                        setSelectedLeadInitialTab('pipeline')
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

        {/* Iter 146 — Task 1a: RevenuePipelineWidget removed from kanban/list surface (to move to Analytics in a future iteration). */}

        {/* ═══ Two-column layout: Main + Right sidebar ═══ */}
        <div className={`${(viewMode === 'kanban' || viewMode === 'list') ? 'lg:grid lg:gap-6' : ''}`} style={(viewMode === 'kanban' || viewMode === 'list') ? { gridTemplateColumns: '1fr 280px' } : undefined}>
          {/* Left: Main content */}
          <div className="min-w-0">

        {/* Iter 146 — Task 1b: CRMAlerts + RevenueDashboard moved to right sidebar to declutter above-the-fold. */}

        {/* Iter 146 — Task 1d: Industry widget toggle (collapsed by default) */}
        {((user?.industry as string) === 'PHOTOGRAPHY' ||
          user?.primaryIndustry === 'PHOTOGRAPHY' ||
          (user?.industry as string) === 'FINE_ART' ||
          user?.primaryIndustry === 'FINE_ART' ||
          (user?.industry as string) === 'DESIGN' ||
          user?.primaryIndustry === 'DESIGN' as any ||
          user?.primaryIndustry === 'GRAPHIC_DESIGN' ||
          user?.primaryIndustry === 'WEB_DESIGN' ||
          user?.primaryIndustry === 'BRANDING' ||
          user?.primaryIndustry === 'ILLUSTRATION') && (
          <button
            onClick={() => setShowIndustryWidgets(v => !v)}
            className="flex items-center gap-1.5 text-[10px] text-text-tertiary hover:text-text-secondary transition mb-2 touch-target"
            data-testid="toggle-industry-widgets"
            aria-expanded={showIndustryWidgets}
          >
            <span>{showIndustryWidgets ? '▾' : '▸'}</span>
            {showIndustryWidgets ? 'Hide studio tools' : 'Show studio tools'}
          </button>
        )}

        {showIndustryWidgets && <>
        {/* Industry-Specific Widgets */}
        {/* AUDIT FIX [H1]: Dual-field industry check */}
        {((user?.industry as string) === 'PHOTOGRAPHY' ||
          user?.primaryIndustry === 'PHOTOGRAPHY') && (
          <PhotographyWidgets
            onViewCalendar={() => handleViewChange('calendar')}
            onLeadClick={setSelectedLead}
          />
        )}
        {/* AUDIT FIX [H1]: Dual-field industry check */}
        {((user?.industry as string) === 'FINE_ART' ||
          user?.primaryIndustry === 'FINE_ART') && (
          <FineArtWidgets
            onLeadClick={setSelectedLead}
            onAddLead={() => setShowAddModal(true)}
          />
        )}
        {/* AUDIT FIX [M2]: Check both industry fields — covers all DESIGN sub-types */}
        {((user?.industry as string) === 'DESIGN' ||
          user?.primaryIndustry === 'DESIGN' as any ||
          user?.primaryIndustry === 'GRAPHIC_DESIGN' || user?.primaryIndustry === 'WEB_DESIGN' || user?.primaryIndustry === 'BRANDING' || user?.primaryIndustry === 'ILLUSTRATION') && (
          <DesignWidgets
            onLeadClick={setSelectedLead}
            onAddLead={() => setShowAddModal(true)}
          />
        )}
        </>}
        {/* Defensive fallback: prompt user to complete onboarding if industry not set */}
        {!user?.primaryIndustry && (
          <div className="mb-4 md:mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 md:p-5 flex items-center justify-between gap-4" data-testid="complete-onboarding-banner">
            <div>
              <h3 className="text-sm font-semibold text-purple-900">Personalise your workspace</h3>
              <p className="text-xs text-purple-700 mt-0.5">Tell us your creative discipline to unlock tailored workflows and widgets.</p>
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              className="flex-shrink-0 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:brightness-110 transition"
              data-testid="complete-onboarding-btn"
            >
              Set up now
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {/* Hero metric — dominant pipeline stat */}
        {viewMode === 'list' && (
        <div
          className="mb-6 px-2"
          style={{
            borderLeft: '3px solid #6C2EDB',
            paddingLeft: '16px',
          }}
          data-testid="hero-pipeline-stat"
        >
          <p
            className="font-mono-kolor"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(108,46,219,0.6)', textTransform: 'uppercase', marginBottom: 4 }}
          >
            Active pipeline
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <NumberFlow
              value={leads.filter(l => !['BOOKED', 'LOST'].includes(l.status)).length}
              className="text-[32px] sm:text-[40px] font-bold leading-none"
              style={{ color: '#1A1A2E' }}
            />
            <span className="text-xs sm:text-sm" style={{ color: 'rgba(0,0,0,0.35)' }}>{lang.leads.toLowerCase()} in pipeline</span>
          </div>
        </div>
        )}

        {viewMode === 'list' && needsAttention.length > 0 && (
          <Suspense fallback={null}>
            <NeedsAttentionSection
              items={needsAttention}
              lang={lang}
              currencySymbol={user?.currencySymbol}
              onLeadClick={setSelectedLead}
            />
          </Suspense>
        )}

        {/* Lead-management chrome (stat cards + filter toolbar) — only visible for lead-focused views */}
        {viewMode === 'list' && (<>
        <div className="grid grid-cols-2 gap-3 md:gap-5 mb-4 md:mb-8">
          <StatCard
            icon={Users}
            label={`Active ${lang.leads}`}
            value={(stats?.total || 0) - (stats?.statusCounts?.BOOKED || 0) - (stats?.statusCounts?.LOST || 0)}
            trend={{ direction: 'neutral', label: 'in pipeline' }}
            sparkline={toSparkline(monthlyTrend, 'count', stats?.total || 0)}
            accentColor="brand"
            active={statusFilter === null}
            onClick={() => clearStatusFilter()}
            testId="stat-active-leads"
          />
          <StatCard
            icon={CurrencyDollar}
            label={`Booked`}
            value={stats?.statusCounts?.BOOKED || 0}
            trend={{ direction: bookedTrend, label: bookedTrend === 'neutral' ? 'confirmed' : `${Math.abs(analytics?.overview.bookedThisMonth.changePercent ?? 0)}% vs last month` }}
            sparkline={toSparkline(monthlyTrend, 'revenue', stats?.statusCounts?.BOOKED || 0)}
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

            {/* Mobile: share form icon button — always visible, not buried in filter panel */}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2.5 rounded-xl border border-brand-primary/30 text-purple-600 transition-all duration-200 touch-target md:hidden relative"
              style={{ background: 'rgba(108,46,219,0.08)' }}
              data-testid="mobile-share-form-toolbar"
              aria-label="Share inquiry form"
              title="Share inquiry form"
            >
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E8891A]" aria-hidden="true" />
              <LinkIcon className="w-4 h-4" aria-hidden="true" />
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
                { mode: 'kanban' as ViewMode, icon: SquaresFour, title: 'Today' },
                { mode: 'list' as ViewMode, icon: ListIcon, title: 'Clients' },
                { mode: 'portfolio' as ViewMode, icon: Briefcase, title: 'Portfolio' },
              ]).map(({ mode, icon: Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => handleViewChange(mode)}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${viewMode === mode ? 'bg-purple-50 shadow-sm text-purple-500' : 'text-text-secondary hover:text-text-primary'}`}
                  data-testid={`view-${mode}`}
                  data-tour={mode === 'portfolio' ? 'view-portfolio' : undefined}
                  title={title}
                  aria-label={title}
                  aria-pressed={viewMode === mode}
                >
                  <Icon weight={viewMode === mode ? 'fill' : 'regular'} className="w-4 h-4" aria-hidden="true" />
                </button>
              ))}
              <button
                onClick={() => navigate('/calendar')}
                className="p-2.5 rounded-lg transition-all duration-200 text-text-secondary hover:text-text-primary"
                data-testid="view-calendar"
                data-tour="view-calendar"
                title="Calendar"
                aria-label="Calendar"
              >
                <CalendarDots weight="regular" className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Desktop filters */}
            {availableProjectTypes.length > 0 && (
              <select
                value={projectTypeFilter}
                onChange={(e) => setProjectTypeFilter(e.target.value)}
                aria-label="Filter by project type"
                className="hidden md:block px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-secondary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                data-testid="filter-project-type"
              >
                <option value="">All Types</option>
                {availableProjectTypes.map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            )}
            {availableIndustries.length > 1 && (
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                aria-label="Filter by industry"
                className="hidden lg:block px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-secondary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                data-testid="filter-industry"
                title="Filter leads by industry"
              >
                <option value="">All Industries</option>
                {availableIndustries.map(b => (
                  <option key={b.key} value={b.key}>{b.label}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowShareModal(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold text-sm bg-brand-primary/10 text-purple-700 border border-brand-primary/30 hover:bg-brand-primary/15 hover:border-brand-primary/50 hover:shadow-sm relative group"
              data-testid="share-form-button"
              title="Share your public inquiry form to capture new leads"
            >
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E8891A] group-hover:scale-110 transition-transform motion-reduce:transition-none" aria-hidden="true" />
              <LinkIcon className="w-4 h-4" />
              <span>Share inquiry form</span>
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
                  aria-label="Filter by project type"
                  className="w-full px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-secondary"
                  data-testid="mobile-filter-project-type"
                >
                  <option value="">All Types</option>
                  {availableProjectTypes.map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  aria-label="Filter by industry"
                  className="w-full px-3 py-2.5 bg-surface-base border border-light-200 rounded-xl text-sm text-text-secondary"
                  data-testid="mobile-filter-industry"
                >
                  <option value="">All Industries</option>
                  {availableIndustries.map(b => (
                    <option key={b.key} value={b.key}>{b.label}</option>
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
        </>)}

        {/* Content */}
        {viewMode === 'sequences' ? (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><KolorSpinner size={32} /></div>}>
            <SequencesDashboard />
          </Suspense>
        ) : viewMode === 'analytics' ? (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><KolorSpinner size={32} /></div>}>
            <AnalyticsDashboard user={user} onFilterByStatus={handleFilterByStatus} />
          </Suspense>
        ) : viewMode === 'portfolio' ? (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><KolorSpinner size={32} /></div>}>
            <PortfolioPage user={user} />
          </Suspense>
        ) : viewMode === 'community' ? (
          <div className="flex flex-col" data-testid="community-view" style={{ height: 'calc(100dvh - 64px)', overflow: 'hidden' }}>
            <div className="flex gap-0 border-b px-4 sticky top-0 z-10"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-base)' }}>
              {(['feed', 'discover', 'dms'] as const).map(tab => (
                <button key={tab} onClick={() => setCommunityTab(tab)}
                  data-testid={`community-tab-${tab}`}
                  className="px-4 py-3 text-xs font-medium capitalize transition-colors relative"
                  style={{ color: communityTab === tab ? '#6C2EDB' : 'var(--text-tertiary)' }}>
                  {tab === 'dms' ? 'Messages' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {communityTab === tab && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#6C2EDB] rounded-full" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              <Suspense fallback={<div className="flex justify-center py-12"><KolorSpinner size={28} /></div>}>
                {communityTab === 'feed' && <CommunityFeed userIndustry={user?.primaryIndustry as any} userId={user?.id} onOpenSettings={(tab) => { setSettingsInitialTab(tab as any); setShowSettings(true) }} onNavigateToPortfolio={() => handleViewChange('portfolio')} />}
                {communityTab === 'discover' && <CommunityDiscover onStartDM={() => setCommunityTab('dms')} />}
                {communityTab === 'dms' && <DMView />}
              </Suspense>
            </div>
          </div>
        ) : filteredLeads.length === 0 && !loading ? (
          <div className="bg-light-50 rounded-xl border border-light-200 p-6 md:p-12">
            <EmptyState
              icon={UserPlus}
              headline={lang.emptyLeads}
              description={`Add a potential ${lang.client.toLowerCase()} and track them from first ${lang.lead.toLowerCase()} to signed ${lang.contract.toLowerCase()} — all in one place.`}
              ctaLabel={lang.newLead}
              onCta={() => setShowAddModal(true)}
            />
          </div>
        ) : viewMode === 'kanban' ? (
          <TodayScreen
            userIndustry={user?.primaryIndustry as any}
            currencySymbol={user?.currencySymbol || '$'}
            onLeadClick={(leadId, tab) => {
              const lead = leads.find(l => l.id === leadId)
              if (lead) {
                if (tab) setSelectedLeadInitialTab(tab)
                setSelectedLead(lead)
              } else {
                leadsApi.getOne(leadId).then(r => {
                  if (r.data?.lead) {
                    if (tab) setSelectedLeadInitialTab(tab)
                    setSelectedLead(r.data.lead)
                  }
                })
              }
            }}
            onAddLead={() => setShowAddModal(true)}
            onShareForm={() => setShowShareModal(true)}
            greeting={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.firstName || ''}`}
          />
        ) : (
          <LeadsListView
            leads={filteredLeads}
            lang={lang}
            currencySymbol={user?.currencySymbol}
            onLeadClick={setSelectedLead}
            onLeadClickTab={(lead, tab) => {
              setSelectedLeadInitialTab(tab)
              setSelectedLead(lead)
            }}
          />
        )}

          </div>{/* /Left column */}

          {/* Right sidebar — list view only (CRM Alerts + Revenue) */}
          {viewMode === 'list' && (
            <aside className="hidden lg:block space-y-4" data-testid="dashboard-right-sidebar">
              {/* Iter 146 — Task 1b: CRM Alerts + Revenue Dashboard moved into sidebar */}
              <div data-tour="crm-alerts">
                <Suspense fallback={<div className="bg-light-50 rounded-2xl border border-light-200 h-32 ks-shimmer" />}>
                  <CRMAlerts onLeadClick={(leadId) => {
                    const lead = leads.find(l => l.id === leadId)
                    if (lead) setSelectedLead(lead)
                  }} />
                </Suspense>
              </div>
              <div data-tour="revenue-dashboard">
                <Suspense fallback={<div className="bg-light-50 rounded-2xl border border-light-200 h-32 ks-shimmer" />}>
                  <RevenueDashboard />
                </Suspense>
              </div>

              {/* Revenue Goal Widget */}
              <RevenueGoalWidget
                bookedThisYear={analytics?.overview.bookedThisYear.value ?? 0}
                currencySymbol={user?.currencySymbol ?? '$'}
                lang={lang}
              />

              {/* Onboarding Checklist */}
              <OnboardingChecklist onOpenSettings={(tab) => { setSettingsInitialTab(tab as any); setShowSettings(true); }} />
            </aside>
          )}
        </div>{/* /Two-column layout */}
        </>
        )}

        {/* Mobile-only: Onboarding checklist */}
        {(viewMode === 'kanban' || viewMode === 'list') && (
          <div className="lg:hidden mt-4">
            <OnboardingChecklist onOpenSettings={(tab) => { setSettingsInitialTab(tab as any); setShowSettings(true); }} />
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav 
        viewMode={viewMode} 
        onViewChange={handleViewChange}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Mobile FAB — collapses to single + that expands to reveal
           Share form + New Lead actions. Only on kanban/list views. */}
      {(viewMode === 'kanban' || viewMode === 'list') && (
        <div className="lg:hidden">
          <FloatingActionMenu
            onShareForm={() => setShowShareModal(true)}
            onNewLead={() => setShowAddModal(true)}
            newLeadLabel={lang.newLead.replace('+ ', '')}
          />
        </div>
      )}

      {/* Modals */}
      {selectedLead && (
        <Suspense fallback={null}>
          <LeadDetailModal
            lead={selectedLead}
            onClose={() => {
              if (leadModalModified.current) { fetchLeads(); fetchStats() }
              leadModalModified.current = false
              setSelectedLead(null)
              setSelectedLeadInitialTab(undefined)
            }}
            onUpdate={(lead) => { leadModalModified.current = true; handleLeadUpdate(lead) }}
            onCelebrate={triggerCelebration}
            initialTab={selectedLeadInitialTab}
            userIndustry={user?.industry as any}
            currencySymbol={user?.currencySymbol || '$'}
          />
        </Suspense>
      )}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onLeadCreated={() => {
            fetchLeads(); fetchStats()
            triggerCelebration('first_project', 'firstProject')
          }}
          user={user || undefined}
        />
      )}
      {showShareModal && <ShareFormModal onClose={() => setShowShareModal(false)} userId={user?.id} />}
      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal
            onClose={() => { setShowSettings(false); setSettingsInitialTab(undefined); }}
            initialTab={settingsInitialTab}
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
        </Suspense>
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
        <HelpButton
          onClick={() => setShowHelpPanel(true)}
          hidden={showSettings || !!selectedLead || showAddModal || showShareModal || showFeedback}
        />
      </div>
      <HelpPanel
        open={showHelpPanel}
        onClose={() => setShowHelpPanel(false)}
        startTour={startTour}
        onAction={(action) => {
          if (action === 'settings') {
            setShowSettings(true)
          } else {
            handleViewChange(action as any)
          }
        }}
      />
      <CelebrationModal
        achievement={celebration}
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
      {showOnboarding && user && (
        <OnboardingFlow
          userFirstName={user.firstName}
          userEmail={user.email}
          userIndustry={(user as any).industry || user.primaryIndustry}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
    </div>
    </>
  )
}

export default Dashboard
