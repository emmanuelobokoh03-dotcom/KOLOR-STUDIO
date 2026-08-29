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
// iter 291-v3a — Crosshair removed (was only used by deleted Active
// Commissions widget)
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix'
import { ChartBar } from '@phosphor-icons/react/dist/csr/ChartBar'
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Briefcase } from '@phosphor-icons/react/dist/csr/Briefcase'
// iter 291-v3c — Bell icon removed; NotificationBell component owns the icon.
import UserAvatarMenu from '../components/community/UserAvatarMenu'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import CommunityTabs from '../components/dashboard/CommunityTabs'
// iter 291-v3a — StudioTools removed per Q2=A; DashboardCards is new hero.
import DashboardCards from '../components/dashboard/DashboardCards'
import NotificationBell from '../components/dashboard/NotificationBell'
// iter 292-v3a — Clients v3 surface (list + kanban + toggle + filter bar).
// LeadsListView.tsx preserved untouched for one iteration as fallback.
import ClientsListView from '../components/clients/ClientsListView'
import ClientsKanbanView from '../components/clients/ClientsKanbanView'
import ClientsViewToggle, { ClientsViewMode } from '../components/clients/ClientsViewToggle'
import { DEFAULT_CLIENTS_FILTER, ClientsFilterState } from '../components/clients/ClientsFilterBar'
// iter 292-v3b — Saved views + bulk actions + calendar view
import ClientsCalendarView from '../components/clients/ClientsCalendarView'
import QuickViewsStrip from '../components/clients/QuickViewsStrip'
import ClientsBulkToolbar from '../components/clients/ClientsBulkToolbar'
import BulkEmailModal from '../components/clients/BulkEmailModal'
import {
  PRESET_VIEWS,
  loadSavedViews,
  persistSavedViews,
  newSavedView,
  applyPresetToLeads,
} from '../components/clients/savedViews'
import type { PresetView, SavedView } from '../components/clients/savedViews'
import { useClientsKeyboard } from '../hooks/useClientsKeyboard'
import { Funnel } from '@phosphor-icons/react/dist/csr/Funnel'
import { authApi, leadsApi, Lead, LeadStatus, User as UserType, LEAD_STATUS_LABELS, Booking, ProjectType, IndustryType, PROJECT_TYPE_LABELS, INDUSTRY_TYPE_LABELS, contractsApi, analyticsApi, DashboardAnalytics, MonthlyTrendData } from '../services/api'
import MobileBottomNav from '../components/MobileBottomNav'
import HelpPanel, { HelpButton } from '../components/HelpPanel'
// iter 289-v3c3c — PhotographyWidgets/FineArtWidgets/DesignWidgets now
// imported inside components/dashboard/StudioTools.tsx.
import { useOnboardingTour } from '../components/OnboardingTour'
import OnboardingWizard, { useOnboardingWizard } from '../components/OnboardingWizard'
import { SmartSuggestion } from '../components/SmartSuggestion'
import { CelebrationModal, checkCelebration, Achievement, achievements } from '../components/CelebrationModal'
// Iter 181 — lazify conditionally-rendered heavy components to shrink Dashboard chunk.
// iter 291-v3b — CRMAlerts removed from Dashboard (Needs Attention card handles it).
const RevenueDashboard = lazy(() => import('../components/RevenueDashboard'))
// iter 291-v3b — NeedsAttentionSection removed from Dashboard (Needs Attention card handles it).
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
// iter 293-v3a — Clients v3.1 progressive-disclosure client detail (Case A).
// LeadDetailModal.tsx preserved as fallback until v3.1-v3b removes.
const LeadDetailModal = lazy(() => import('../components/clients/ClientDetail'))
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
// iter 291-v3a — TodayScreen import removed; hero now DashboardCards.
// TodayScreen.tsx file preserved for now (may be reused/deleted in v3b).
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
  // iter 292-v3a — Clients v3 view mode (list ↔ kanban). Scoped to the
  // `viewMode === 'list'` branch (Clients page). Orthogonal to outer
  // viewMode per Dashboard v3 v3a.1 codified conditional-guarding lesson.
  const [clientsViewMode, setClientsViewMode] = useState<ClientsViewMode>('list')
  const [clientsFilter, setClientsFilter] = useState<ClientsFilterState>(DEFAULT_CLIENTS_FILTER)
  // iter 292-v3b — saved views + bulk selection state
  const [clientsSelectedIds, setClientsSelectedIds] = useState<string[]>([])
  // iter 293-v3a — bulk email compose modal state
  const [showBulkEmail, setShowBulkEmail] = useState(false)
  const [clientsSavedViews, setClientsSavedViews] = useState<SavedView[]>([])
  const [clientsActivePresetId, setClientsActivePresetId] = useState<string | null>(null)
  const [clientsActiveSavedViewId, setClientsActiveSavedViewId] = useState<string | null>(null)
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
  const [settingsInitialTab, setSettingsInitialTab] = useState<'account' | 'brand' | 'money' | 'scheduling' | 'notifications' | 'community' | undefined>(undefined)
  const [showFeedback, setShowFeedback] = useState(false)
  // Iter 146 — Task 1d: collapse industry widgets by default
  // iter 291-v3a — showIndustryWidgets removed (StudioTools gone per Q2=A).
  // Iter 146 — Task 2b: sidebar user block dropdown with Settings + Logout
  // userMenu removed in iter-211 — user block opens Settings directly
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [stats, setStats] = useState<{ total: number; statusCounts: Record<string, number> } | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  // iter 291-v3c — Bell state extracted to NotificationBell component.
  const [communityTab, setCommunityTab] = useState<'feed' | 'discover' | 'dms'>(() => {
    // iter 289-v3c3a.1 — Deep-link: ?subtab=dms opens Messages tab directly
    const sub = new URLSearchParams(window.location.search).get('subtab')
    return sub === 'dms' || sub === 'discover' || sub === 'feed' ? sub : 'feed'
  })
  // iter 289-v3c3a.3 — Sync communityTab from URL on subsequent nav changes.
  // Without this, Discover's MESSAGE button (which navigate()s to
  // ?subtab=dms&thread=X) updates the URL but Dashboard's tab state stays
  // on 'discover' — user sees Discover while URL says dms.
  useEffect(() => {
    const sub = searchParams.get('subtab')
    if (sub === 'dms' || sub === 'discover' || sub === 'feed') {
      if (sub !== communityTab) setCommunityTab(sub)
    }
  }, [searchParams])
  const [pendingDMCount, setPendingDMCount] = useState(0)
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

  // iter 291-v3c — notification polling moved into NotificationBell component.


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

  // iter 287-v3c2b: pending DM request count for Messages sub-nav dot indicator
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const fetchPending = async () => {
      try {
        const API_URL = (import.meta as any).env?.VITE_API_URL || ''
        const res = await fetch(`${API_URL}/api/community/dms/pending-count`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setPendingDMCount(data.count || 0)
      } catch { /* silent */ }
    }
    fetchPending()
    const id = setInterval(fetchPending, 60000)
    return () => { cancelled = true; clearInterval(id) }
  }, [user, communityTab])

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

  // iter 292-v3b — hydrate saved views (backend-backed as of iter 293-v3b)
  // Migration is transparent: existing localStorage entries auto-migrate on first
  // successful backend load, then localStorage is cleared.
  const [savedViewsHydrated, setSavedViewsHydrated] = useState(false)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    loadSavedViews(user.id).then((views) => {
      if (!cancelled) {
        setClientsSavedViews(views)
        setSavedViewsHydrated(true)
      }
    })
    return () => { cancelled = true }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    // Skip persist until initial hydration completes (avoids overwriting backend
    // with an empty array before the load resolves).
    if (!savedViewsHydrated) return
    persistSavedViews(user.id, clientsSavedViews)
  }, [user?.id, clientsSavedViews, savedViewsHydrated])

  // iter 292-v3b — clear selection whenever leaving Clients page
  useEffect(() => {
    if (viewMode !== 'list') setClientsSelectedIds([])
  }, [viewMode])

  // iter 292-v3b — global keyboard shortcuts (CMD+K / ESC / /).
  // J/K row navigation lives inside ClientsListView.
  const headerSearchRef = useRef<HTMLInputElement | null>(null)
  const filterBarPillRef = useRef<HTMLButtonElement | null>(null)
  useClientsKeyboard(
    {
      onSearchOpen: () => headerSearchRef.current?.focus(),
      onFocusFilter: () => {
        // Focus first stage pill in the ClientsFilterBar
        const el = document.querySelector<HTMLButtonElement>(
          '[data-testid="clients-filter-stage-all"]',
        )
        el?.focus()
      },
      onEscape: () => {
        if (clientsSelectedIds.length > 0) setClientsSelectedIds([])
      },
    },
    viewMode === 'list',
  )

  // iter 292-v3b — bulk action handlers (Case C: frontend loops single
  // -lead calls via Promise.allSettled with toast summarization).
  // iter 293-v3a — Bulk actions now use backend batch endpoints
  // (POST /api/leads/bulk/*). Replaces v3b Promise.allSettled loops.
  const API_URL_BULK: string = (import.meta as any).env?.VITE_API_URL || ''

  const callBulk = async (
    path: string,
    body: Record<string, unknown>,
  ): Promise<{ successCount: number; failures: Array<{ leadId: string; error: string }> } | null> => {
    try {
      const res = await fetch(`${API_URL_BULK}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Bulk action failed')
        return null
      }
      return data
    } catch {
      toast.error('Bulk action failed')
      return null
    }
  }

  const bulkArchive = async () => {
    const ids = [...clientsSelectedIds]
    if (ids.length === 0) return
    // iter 293-v3b — capture pre-archive stages for undo restoration
    const preArchiveMap: Record<string, string> = {}
    ids.forEach((id) => {
      const lead = leads.find((l) => l.id === id)
      if (lead) preArchiveMap[id] = lead.status
    })
    const data = await callBulk('/api/leads/bulk/archive', { leadIds: ids })
    if (!data) return
    const { successCount, failures } = data
    // Backend also returns preArchiveMap; prefer backend snapshot if present
    const backendMap = (data as any).preArchiveMap
    const restoreMap: Record<string, string> = backendMap && typeof backendMap === 'object' ? backendMap : preArchiveMap

    // iter 293-v3b — Sonner action-button undo (8s window)
    toast.success(
      failures.length === 0
        ? `Archived ${successCount} client${successCount === 1 ? '' : 's'}.`
        : `Archived ${successCount} — ${failures.length} failed.`,
      {
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () => bulkUnarchive(ids, restoreMap),
        },
      },
    )
    setClientsSelectedIds([])
    fetchLeads()
    fetchStats()
  }

  const bulkUnarchive = async (leadIds: string[], stageRestoreMap?: Record<string, string>) => {
    if (leadIds.length === 0) return
    const data = await callBulk('/api/leads/bulk/unarchive', {
      leadIds,
      stageRestoreMap: stageRestoreMap || {},
      defaultStage: 'NEW',
    })
    if (!data) return
    const { successCount, failures } = data
    toast.success(
      failures.length === 0
        ? `Restored ${successCount} client${successCount === 1 ? '' : 's'}.`
        : `Restored ${successCount} — ${failures.length} failed.`,
    )
    setClientsSelectedIds([])
    fetchLeads()
    fetchStats()
  }

  // iter 293-v3b — Bulk restore from Archived preset (no undo captures pre-stage;
  // default to 'NEW' for all restored leads).
  const bulkRestoreFromArchive = async () => {
    const ids = [...clientsSelectedIds]
    if (ids.length === 0) return
    await bulkUnarchive(ids)
  }

  const bulkStageChange = async (newStatus: LeadStatus) => {
    const ids = [...clientsSelectedIds]
    if (ids.length === 0) return
    const data = await callBulk('/api/leads/bulk/stage', { leadIds: ids, status: newStatus })
    if (!data) return
    const { successCount, failures } = data
    toast.success(
      failures.length === 0
        ? `Updated ${successCount} client${successCount === 1 ? '' : 's'} to ${LEAD_STATUS_LABELS[newStatus]}.`
        : `Updated ${successCount} — ${failures.length} failed.`,
    )
    setClientsSelectedIds([])
    fetchLeads()
    fetchStats()
  }

  const bulkTag = async (tag: string) => {
    const ids = [...clientsSelectedIds]
    if (ids.length === 0) return
    const data = await callBulk('/api/leads/bulk/tag', { leadIds: ids, tag })
    if (!data) return
    const { successCount, failures } = data
    toast.success(
      failures.length === 0
        ? `Tagged ${successCount} client${successCount === 1 ? '' : 's'} with "${tag}".`
        : `Tagged ${successCount} — ${failures.length} failed.`,
    )
    setClientsSelectedIds([])
    fetchLeads()
  }

  const bulkReminder = async () => {
    const ids = [...clientsSelectedIds]
    if (ids.length === 0) return
    const data = await callBulk('/api/leads/bulk/reminder', { leadIds: ids })
    if (!data) return
    const { successCount, failures } = data
    toast.success(
      failures.length === 0
        ? `Reminder sent to ${successCount} client${successCount === 1 ? '' : 's'}.`
        : `Sent to ${successCount} — ${failures.length} failed.`,
    )
    setClientsSelectedIds([])
    fetchLeads()
  }

  // iter 292-v3b — preset / saved view application
  const applyPreset = (preset: PresetView) => {
    setClientsActivePresetId(preset.id)
    setClientsActiveSavedViewId(null)
    setClientsFilter(DEFAULT_CLIENTS_FILTER)
  }

  const applySavedView = (view: SavedView) => {
    setClientsActiveSavedViewId(view.id)
    setClientsActivePresetId(null)
    setClientsFilter(view.filter)
  }

  const clearActiveView = () => {
    setClientsActivePresetId(null)
    setClientsActiveSavedViewId(null)
    setClientsFilter(DEFAULT_CLIENTS_FILTER)
  }

  const saveCurrentAsView = (label: string) => {
    const created = newSavedView(label, clientsFilter)
    setClientsSavedViews((prev) => [...prev, created])
    setClientsActiveSavedViewId(created.id)
    setClientsActivePresetId(null)
    toast.success(`Saved view "${label}".`)
  }

  const deleteSavedView = (id: string) => {
    setClientsSavedViews((prev) => prev.filter((v) => v.id !== id))
    if (clientsActiveSavedViewId === id) setClientsActiveSavedViewId(null)
  }

  const toggleSelectClient = (id: string) => {
    setClientsSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleSelectAllClients = (ids: string[]) => {
    setClientsSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id))
      if (allSelected) return prev.filter((x) => !ids.includes(x))
      const set = new Set([...prev, ...ids])
      return Array.from(set)
    })
  }

  // Apply active preset matcher to filtered leads (v3a Dashboard-level
  // filtering already applied via filteredLeads below).
  const activePreset = useMemo(
    () => (clientsActivePresetId ? PRESET_VIEWS.find((p) => p.id === clientsActivePresetId) : null),
    [clientsActivePresetId],
  )
  const clientsViewingArchived = activePreset?.id === 'archived'
  const clientsScopedLeads = useMemo(() => {
    if (!activePreset) return filteredLeads
    return applyPresetToLeads(activePreset, filteredLeads)
  }, [activePreset, filteredLeads])

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
    <div className="min-h-screen bg-surface-base flex overflow-x-hidden">

      {/* Onboarding Wizard for new users */}
      {showWizard && !showOnboarding && (
        <OnboardingWizard onComplete={() => setShowWizard(false)} />
      )}

      {/* Desktop Sidebar — iter 293-v3c: framework calibration */}
      <aside
        className="hidden lg:flex flex-col h-screen sticky top-0 overflow-y-auto"
        style={{
          width: '220px',
          minWidth: '220px',
          padding: '16px 12px',
          background: 'var(--kolor-canvas, #F7F4EE)',
          borderRight: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
        data-testid="desktop-sidebar"
      >
        {/* Logo */}
        <button
          onClick={() => { setViewMode('kanban'); setStatusFilter(null) }}
          className="block mb-4 px-1"
          data-testid="sidebar-logo"
          aria-label="Go to dashboard"
        >
          <KolorLogo variant="dark" size="md" markOnly={false} linkTo={null} />
        </button>

        {/* User block — Q2b=b: canvas-shade-1 + hairline avatar with ink initials */}
        <div
          className="flex items-center gap-2.5 rounded-xl p-2.5 mb-1 cursor-pointer transition-colors duration-150"
          style={{
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
          onClick={() => setShowSettings(true)}
          data-testid="sidebar-user-block"
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              color: 'var(--kolor-ink, #1A1613)',
            }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="text-xs italic truncate"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 500,
                color: 'var(--kolor-ink, #1A1613)',
              }}
            >
              {user?.firstName} {user?.lastName}
            </div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.14em] mt-0.5"
              style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
            >
              Beta · Free plan
            </div>
          </div>
        </div>

        <div className="mb-3" />

        {/* Workspace nav */}
        <div
          className="text-[10px] font-mono uppercase tracking-[0.14em] px-2 mb-1 mt-2"
          style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
        >
          Workspace
        </div>
        <div className="group">
        {([
          { mode: 'kanban' as ViewMode, icon: SquaresFour, label: 'Today' },
          { mode: 'list' as ViewMode, icon: ListIcon, label: 'Clients', badge: stats?.total },
        ]).map(({ mode, icon: Icon, label, badge }) => {
          const isActive = viewMode === mode
          return (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 mb-0.5 relative"
            style={{
              background: isActive ? 'var(--kolor-terra-tint, rgba(184, 74, 44, 0.12))' : 'transparent',
              color: isActive ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-ink-muted, #5F5751)',
              fontWeight: isActive ? 600 : 500,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)'
                e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
              }
            }}
            data-testid={`sidebar-${mode}`}
          >
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r"
                style={{ background: 'var(--kolor-terra, #B84A2C)' }}
              />
            )}
            <Icon weight={isActive ? 'fill' : 'regular'} className="w-[14px] h-[14px]" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className="ml-auto text-[9px] font-mono uppercase tracking-[0.08em] rounded-full px-1.5 py-px"
                style={{
                  background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                  color: 'var(--kolor-ink, #1A1613)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                }}
              >
                {badge}
              </span>
            )}
          </button>
          )
        })}
        </div>

        <div
          className="text-[10px] font-mono uppercase tracking-[0.14em] px-2 mb-1 mt-3"
          style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
        >
          Schedule
        </div>
        <div className="group">
        <button
          onClick={() => navigate('/calendar')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 mb-0.5 relative"
          style={{ color: 'var(--kolor-ink-muted, #5F5751)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)'
            e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
          }}
          data-testid="sidebar-calendar"
        >
          <CalendarDots weight="regular" className="w-[14px] h-[14px]" />
          Calendar
        </button>
        </div>

        <div
          className="text-[10px] font-mono uppercase tracking-[0.14em] px-2 mb-1 mt-3"
          style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
        >
          Account
        </div>
        <div className="group">
        {([
          { mode: 'portfolio' as ViewMode, icon: Briefcase, label: 'Portfolio' },
          { mode: 'community' as ViewMode, icon: Users, label: 'Community' },
        ]).map(({ mode, icon: Icon, label }) => {
          const isActive = viewMode === mode
          return (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 mb-0.5 relative"
            style={{
              background: isActive ? 'var(--kolor-terra-tint, rgba(184, 74, 44, 0.12))' : 'transparent',
              color: isActive ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-ink-muted, #5F5751)',
              fontWeight: isActive ? 600 : 500,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)'
                e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
              }
            }}
            data-testid={`sidebar-${mode}`}
          >
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r"
                style={{ background: 'var(--kolor-terra, #B84A2C)' }}
              />
            )}
            <Icon weight={isActive ? 'fill' : 'regular'} className="w-[14px] h-[14px]" />
            {label}
          </button>
          )
        })}
        </div>

        <div className="flex-1" />

        {/* Beta plan card — Q2c=b: dark ink card with canvas text */}
        <div
          className="rounded-lg p-3 mb-2"
          style={{
            background: 'var(--kolor-ink, #1A1613)',
            border: '1px solid var(--kolor-ink, #1A1613)',
          }}
        >
          <div
            className="text-[10px] font-mono uppercase tracking-[0.14em]"
            style={{ color: 'var(--kolor-ink-whisper, #C4BFB8)' }}
          >
            Beta Access
          </div>
          <div
            className="italic text-sm mt-0.5"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 500,
              color: 'var(--kolor-canvas, #F7F4EE)',
            }}
          >
            $97 one-time
          </div>
          <div
            className="text-[10px] mt-0.5"
            style={{ color: 'var(--kolor-terra, #B84A2C)' }}
          >
            Founding member &#10022;
          </div>
        </div>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors duration-150 mb-0.5"
          style={{ color: 'var(--kolor-ink-muted, #5F5751)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)'
            e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
          }}
          data-testid="sidebar-settings"
        >
          <GearSix weight="regular" className="w-[14px] h-[14px]" />
          Settings
        </button>

        {/* Help */}
        <button
          onClick={() => setShowHelpPanel(true)}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors duration-150"
          style={{ color: 'var(--kolor-ink-muted, #5F5751)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)'
            e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
          }}
          data-testid="sidebar-help-btn"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 6.2c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.3-1 1.7-.3.2-.5.4-.6.6-.1.2-.2.3-.2.5M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Help
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors duration-150"
          style={{ color: 'var(--kolor-ink-muted, #5F5751)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--kolor-canvas-shade-1, #F1EDE5)'
            e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
          }}
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

            {/* Desktop greeting — iter 289-v3c3c: extracted to DashboardHeader */}
            <DashboardHeader
              viewMode={viewMode}
              firstName={user?.firstName || ''}
              greeting={getGreeting()}
              metaText={(() => {
                const awaitingCount = leads.filter(l => l.status === 'NEW' || l.status === 'REVIEWING').length
                if (awaitingCount > 0) return `${awaitingCount} ${awaitingCount === 1 ? lang.lead.toLowerCase() : lang.leads.toLowerCase()} awaiting ${lang.quotes.toLowerCase()}`
                if (leads.length === 0) return `Add your first ${lang.lead.toLowerCase()} to get started`
                return 'Welcome back to your studio'
              })()}
              currentDate={formatCurrentDate()}
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  ref={headerSearchRef}
                  type="text"
                  placeholder="Search anything…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-[200px] h-8 rounded-lg border border-light-200 bg-surface-background text-xs pl-8 pr-3 text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-400"
                  data-testid="dashboard-search"
                />
              </div>
            </div>
              {/* iter 289-v3c3a — Avatar dropdown menu for Community navigation */}
              <UserAvatarMenu firstName={user?.firstName} />
              {/* iter 291-v3c — NotificationBell extracted + sheet drawer archival view (Q3=C + Q12=C) */}
              <NotificationBell
                onNavigateCommunity={(tab) => {
                  handleViewChange('community')
                  setCommunityTab(tab)
                }}
              />
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
              ]).map(({ mode, icon: Icon, label }) => {
                const isActive = viewMode === mode
                return (
                <button
                  key={mode}
                  onClick={() => handleViewChange(mode)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-150 touch-target relative"
                  style={{
                    background: isActive ? 'var(--kolor-terra-tint, rgba(184, 74, 44, 0.12))' : 'transparent',
                    color: isActive ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-ink-muted, #5F5751)',
                    borderRight: isActive ? '2px solid var(--kolor-terra, #B84A2C)' : '2px solid transparent',
                    fontWeight: isActive ? 600 : 500,
                  }}
                  data-testid={`mobile-menu-${mode}`}
                >
                  <Icon weight={isActive ? 'fill' : 'regular'} className="w-5 h-5" aria-hidden="true" />
                  {label}
                </button>
                )
              })}
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
            else if (action === 'open-brand-settings') { setSettingsInitialTab('brand'); setShowSettings(true) }
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
        {/* iter 291-v3a — Active Commissions widget + Pending Contract banner
            + StudioTools invocation removed per Q2=A. Their content is now
            surfaced through the DashboardCards hero (Today + Needs Attention)
            below the greeting header. */}

        {/* Iter 146 — Task 1a: RevenuePipelineWidget removed from kanban/list surface (to move to Analytics in a future iteration). */}

        {/* iter 291-v3a — DashboardCards hero (Today + Needs Attention).
            iter 291-v3a.1 — Corrective: scoped to viewMode === 'kanban'
            (Today view) only. Previously rendered for every non-quotes /
            non-contracts branch which incorrectly placed cards above
            Community, Portfolio, Analytics, Sequences content. */}
        {viewMode === 'kanban' && (
          <Suspense fallback={null}>
            <DashboardCards
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
              onViewClients={() => handleViewChange('list')}
              onViewPortfolio={() => handleViewChange('portfolio')}
              onViewCommunity={() => handleViewChange('community')}
            />
          </Suspense>
        )}

        {/* ═══ Two-column layout: Main + Right sidebar ═══ */}
        <div className={`${(viewMode === 'kanban' || viewMode === 'list') ? 'lg:grid lg:gap-6' : ''}`} style={(viewMode === 'kanban' || viewMode === 'list') ? { gridTemplateColumns: '1fr 280px' } : undefined}>
          {/* Left: Main content */}
          <div className="min-w-0">

        {/* Iter 146 — Task 1b: CRMAlerts + RevenueDashboard moved to right sidebar to declutter above-the-fold. */}

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

        {/* iter 292-v3c.1 — Active Pipeline hero pill + StatCards grid removed.
             Duplicated Dashboard v3 Pipeline Pulse card + sidebar Clients count.
             Pipeline Pulse card on Today view remains sole treatment. */}

        {/* Lead-management chrome (filter toolbar) — only visible for lead-focused views */}
        {viewMode === 'list' && (<>

        {/* Toolbar */}
        {/* Toolbar — iter 292-v3c.1: framework-calibrated to KOLOR tokens */}
        <div
          className="rounded-xl p-3 md:p-5 mb-4 md:mb-8"
          style={{
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
          }}
        >
          {/* Mobile toolbar */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--kolor-ink-subtle, #928B84)' }} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm transition-all duration-fast focus:outline-none"
                style={{
                  background: 'var(--kolor-canvas, #F7F4EE)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  color: 'var(--kolor-ink, #1A1613)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)' }}
                data-testid="search-input"
              />
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="p-2.5 rounded-lg transition-all duration-200 touch-target md:hidden relative"
              style={{
                background: activeFilterCount > 0 ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-canvas, #F7F4EE)',
                border: `1px solid ${activeFilterCount > 0 ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-hairline, #E5E0D8)'}`,
                color: activeFilterCount > 0 ? 'var(--kolor-canvas, #F7F4EE)' : 'var(--kolor-ink-muted, #5F5751)',
              }}
              data-testid="mobile-filter-toggle"
              aria-label={`Toggle filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
            >
              <Funnel className="w-4 h-4" aria-hidden="true" />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: 'var(--kolor-ink, #1A1613)', color: 'var(--kolor-canvas, #F7F4EE)' }}
                  aria-hidden="true"
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Mobile: share form icon button — always visible, not buried in filter panel */}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2.5 rounded-lg transition-all duration-200 touch-target md:hidden relative"
              style={{
                background: 'var(--kolor-terra, #B84A2C)',
                border: '1px solid var(--kolor-terra, #B84A2C)',
                color: 'var(--kolor-canvas, #F7F4EE)',
              }}
              data-testid="mobile-share-form-toolbar"
              aria-label="Share inquiry form"
              title="Share inquiry form"
            >
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: 'var(--kolor-canvas, #F7F4EE)' }} aria-hidden="true" />
              <LinkIcon className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-lg transition-all duration-200 touch-target hidden md:flex items-center gap-2 hover:opacity-70"
              disabled={refreshing}
              data-testid="refresh-button"
              aria-label={refreshing ? 'Refreshing data' : 'Refresh data'}
            >
              <ArrowsClockwise
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
                aria-hidden="true"
              />
              <div className="flex items-center gap-1.5" role="status" aria-live="polite">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--kolor-terra, #B84A2C)' }} aria-hidden="true" />
                <span
                  className="font-mono-kolor"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                  }}
                >
                  Live
                </span>
              </div>
            </button>

            {/* iter 292-v3c.1 — Desktop view toggles removed.
                 Redundant with sidebar Workspace/Schedule nav.
                 ClientsViewToggle (LIST/KANBAN/CALENDAR) below is sole clients-data view control. */}

            {/* Desktop filters */}
            {availableProjectTypes.length > 0 && (
              <select
                value={projectTypeFilter}
                onChange={(e) => setProjectTypeFilter(e.target.value)}
                aria-label="Filter by project type"
                className="hidden md:block px-3 py-2.5 rounded-lg text-sm transition-all duration-200 focus:outline-none"
                style={{
                  background: 'var(--kolor-canvas, #F7F4EE)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  color: 'var(--kolor-ink-muted, #5F5751)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)' }}
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
                className="hidden lg:block px-3 py-2.5 rounded-lg text-sm transition-all duration-200 focus:outline-none"
                style={{
                  background: 'var(--kolor-canvas, #F7F4EE)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  color: 'var(--kolor-ink-muted, #5F5751)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-hairline, #E5E0D8)' }}
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
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-semibold text-sm hover:opacity-90 relative group"
              style={{
                background: 'var(--kolor-terra, #B84A2C)',
                border: '1px solid var(--kolor-terra, #B84A2C)',
                color: 'var(--kolor-canvas, #F7F4EE)',
              }}
              data-testid="share-form-button"
              title="Share your public inquiry form to capture new leads"
            >
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full group-hover:scale-110 transition-transform motion-reduce:transition-none"
                style={{ background: 'var(--kolor-canvas, #F7F4EE)' }}
                aria-hidden="true"
              />
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
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{
                    background: 'var(--kolor-canvas, #F7F4EE)',
                    border: '1px solid var(--kolor-hairline, #E5E0D8)',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                  }}
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
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{
                    background: 'var(--kolor-canvas, #F7F4EE)',
                    border: '1px solid var(--kolor-hairline, #E5E0D8)',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                  }}
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
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold touch-target hover:opacity-90"
                  style={{
                    background: 'var(--kolor-terra, #B84A2C)',
                    border: '1px solid var(--kolor-terra, #B84A2C)',
                    color: 'var(--kolor-canvas, #F7F4EE)',
                  }}
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
            {/* iter 289-v3c3c — extracted to CommunityTabs component.
                v3c3b calibration + v3c3a URL sync preserved via onTabChange. */}
            <CommunityTabs
              activeTab={communityTab}
              pendingDMCount={pendingDMCount}
              onTabChange={(tab) => {
                setCommunityTab(tab)
                // iter 289-v3c3a.3 — Keep URL in sync with community sub-nav
                // so refreshes + back/forward land on the right tab, and
                // switching tabs strips any stale ?thread= param.
                const next = new URLSearchParams(searchParams)
                next.set('subtab', tab)
                next.delete('thread')
                setSearchParams(next, { replace: true })
              }}
            />
            <div className="flex-1 overflow-y-auto">
              <Suspense fallback={<div className="flex justify-center py-12"><KolorSpinner size={28} /></div>}>
                {communityTab === 'feed' && <CommunityFeed userIndustry={user?.primaryIndustry as any} userId={user?.id} onOpenSettings={(tab) => { setSettingsInitialTab(tab as any); setShowSettings(true) }} onNavigateToPortfolio={() => handleViewChange('portfolio')} />}
                {communityTab === 'discover' && <CommunityDiscover onStartDM={() => setCommunityTab('dms')} />}
                {communityTab === 'dms' && <DMView />}
              </Suspense>
            </div>
          </div>
        ) : filteredLeads.length === 0 && !loading && viewMode === 'list' ? (
          <div className="bg-light-50 rounded-xl border border-light-200 p-6 md:p-12">
            <EmptyState
              icon={UserPlus}
              headline={lang.emptyLeads}
              description={`Add a potential ${lang.client.toLowerCase()} and track them from first ${lang.lead.toLowerCase()} to signed ${lang.contract.toLowerCase()} — all in one place.`}
              ctaLabel={lang.newLead}
              onCta={() => setShowAddModal(true)}
            />
          </div>
        ) : viewMode === 'list' ? (
          /* iter 292-v3a → v3b — Clients v3 surface with:
              • ClientsViewToggle (list / kanban / calendar)
              • QuickViewsStrip (5 presets + user saved views)
              • ClientsListView (with bulk selection checkboxes) or
                ClientsKanbanView or ClientsCalendarView
              • ClientsBulkToolbar (portal, appears when selectedIds > 0)
             LeadsListView.tsx preserved untouched as fallback (Case B).

             Precise conditional guarding per Dashboard v3 v3a.1 lesson:
               clientsViewMode === 'list'     -> ClientsListView
               clientsViewMode === 'kanban'   -> ClientsKanbanView
               clientsViewMode === 'calendar' -> ClientsCalendarView */
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 12,
              }}
              data-testid="clients-view-toggle-wrap"
            >
              <ClientsViewToggle
                mode={clientsViewMode}
                onChange={setClientsViewMode}
              />
            </div>
            <QuickViewsStrip
              activePresetId={clientsActivePresetId}
              activeSavedViewId={clientsActiveSavedViewId}
              savedViews={clientsSavedViews}
              onPresetClick={applyPreset}
              onSavedViewClick={applySavedView}
              onSaveCurrent={saveCurrentAsView}
              onDeleteSavedView={deleteSavedView}
              onClearActive={clearActiveView}
              canSave={
                clientsFilter.stage !== 'all' ||
                clientsFilter.industry !== 'ALL' ||
                clientsFilter.tag !== null
              }
            />
            {clientsViewMode === 'list' && (
              <ClientsListView
                leads={clientsScopedLeads}
                lang={lang}
                filter={clientsFilter}
                onFilterChange={setClientsFilter}
                onLeadClick={setSelectedLead}
                onAddClient={() => setShowAddModal(true)}
                selectedIds={clientsSelectedIds}
                onToggleSelect={toggleSelectClient}
                onToggleSelectAll={toggleSelectAllClients}
                keyboardEnabled={viewMode === 'list'}
                showLost={clientsViewingArchived}
              />
            )}
            {clientsViewMode === 'kanban' && (
              <ClientsKanbanView
                leads={clientsScopedLeads}
                lang={lang}
                filter={clientsFilter}
                onFilterChange={setClientsFilter}
                onLeadClick={setSelectedLead}
              />
            )}
            {clientsViewMode === 'calendar' && (
              <ClientsCalendarView
                leads={clientsScopedLeads}
                lang={lang}
                onLeadClick={setSelectedLead}
              />
            )}
          </div>
        ) : null}
        {viewMode === 'list' && clientsSelectedIds.length > 0 && (
          <ClientsBulkToolbar
            selectedCount={clientsSelectedIds.length}
            lang={lang}
            onArchive={bulkArchive}
            onStageChange={bulkStageChange}
            onTag={bulkTag}
            onSendReminder={bulkReminder}
            onSendEmail={() => setShowBulkEmail(true)}
            onClearSelection={() => setClientsSelectedIds([])}
            viewingArchived={clientsViewingArchived}
            onRestore={bulkRestoreFromArchive}
          />
        )}
        {viewMode === 'list' && showBulkEmail && (
          <BulkEmailModal
            selectedIds={clientsSelectedIds}
            clients={leads}
            onClose={() => setShowBulkEmail(false)}
            onSent={() => {
              setClientsSelectedIds([])
              fetchLeads()
            }}
          />
        )}

          </div>{/* /Left column */}

          {/* Right sidebar — list view only (Revenue) */}
          {viewMode === 'list' && (
            <aside className="hidden lg:block space-y-4" data-testid="dashboard-right-sidebar">
              {/* iter 291-v3b — CRMAlerts removed from sidebar; Needs
                   Attention card in DashboardCards (Today view) now surfaces
                   this info. Revenue Dashboard preserved. */}
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
