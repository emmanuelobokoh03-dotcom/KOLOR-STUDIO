import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sparkles, 
  LogOut, 
  Plus, 
  LayoutGrid, 
  List,
  Search,
  RefreshCw,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Link2,
  Copy,
  Mail,
  Target,
  Settings,
  BarChart3,
  CalendarDays,
  X,
  Briefcase,
  Menu,
  Filter,
  ChevronDown
} from 'lucide-react'
import { authApi, leadsApi, Lead, LeadStatus, User as UserType, LEAD_STATUS_LABELS, Booking, ProjectType, IndustryType, PROJECT_TYPE_LABELS, INDUSTRY_TYPE_LABELS } from '../services/api'
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
import { trackLogout, trackViewChanged } from '../utils/analytics'

type ViewMode = 'kanban' | 'list' | 'analytics' | 'calendar' | 'portfolio';

const DARK_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  REVIEWING: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  CONTACTED: 'bg-purple-900/50 text-purple-300 border border-purple-700/50',
  QUALIFIED: 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50',
  QUOTED: 'bg-orange-900/50 text-orange-300 border border-orange-700/50',
  NEGOTIATING: 'bg-pink-900/50 text-pink-300 border border-pink-700/50',
  BOOKED: 'bg-green-900/50 text-green-300 border border-green-700/50',
  LOST: 'bg-gray-800/50 text-gray-400 border border-gray-700/50',
};

// Skeleton components for loading states
const StatCardSkeleton = () => (
  <div className="bg-[#1A1A1A] rounded-xl p-4 md:p-6 border border-[#333] animate-pulse">
    <div className="flex items-center gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-[#333] rounded-xl" />
      <div className="space-y-2">
        <div className="h-6 md:h-7 w-12 md:w-16 bg-[#333] rounded-md" />
        <div className="h-3 md:h-4 w-16 md:w-24 bg-[#2a2a2a] rounded-md" />
      </div>
    </div>
  </div>
);

const KanbanSkeleton = () => (
  <div className="space-y-4 md:flex md:gap-5 md:space-y-0 overflow-x-auto pb-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex-shrink-0 w-full md:w-72 rounded-xl border-2 border-[#333] bg-[#1A1A1A] animate-pulse">
        <div className="h-12 bg-[#333] rounded-t-lg" />
        <div className="p-4 space-y-4">
          {[1, 2].map((j) => (
            <div key={j} className="bg-[#1f1f1f] rounded-lg p-4 space-y-3 border border-[#333]">
              <div className="h-24 md:h-32 bg-[#2a2a2a] rounded-lg" />
              <div className="h-4 w-3/4 bg-[#333] rounded" />
              <div className="h-3 w-1/2 bg-[#2a2a2a] rounded" />
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

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      if (!token) { navigate('/login'); return }

      const userResult = await authApi.getMe()
      if (userResult.error) {
        localStorage.removeItem('token')
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
      setLoading(false)
    }
    init()
  }, [navigate])

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

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLeads()
    await fetchStats()
    setRefreshing(false)
  }

  const handleLogout = () => {
    trackLogout()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleViewChange = (view: ViewMode) => {
    setViewMode(view)
    setMobileMenuOpen(false)
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

  const handleBookingSaved = (booking: Booking) => {
    setShowBookingModal(false)
    setBookingLead(null)
    fetchLeads()
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

  const activeFilterCount = [statusFilter, projectTypeFilter, industryFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F]">
        <header className="bg-[#1A1A1A] border-b border-[#333] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-[#333] rounded-lg animate-pulse" />
              <div className="w-28 md:w-32 h-6 bg-[#333] rounded-lg animate-pulse" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-24 lg:pb-8">
          <div className="space-y-2 animate-pulse">
            <div className="h-7 md:h-8 w-48 md:w-64 bg-[#333] rounded-lg" />
            <div className="h-4 md:h-5 w-36 md:w-48 bg-[#2a2a2a] rounded-lg" />
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
    <div className="min-h-screen bg-[#0F0F0F]">
      <AnnouncementBanner />

      {/* Header */}
      <header className="bg-[#1A1A1A] border-b border-[#333] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-xl transition-all duration-200 lg:hidden touch-target"
              data-testid="mobile-menu-button"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setViewMode('kanban'); setStatusFilter(null); }}
              className="flex items-center gap-2 md:gap-3 group transition-all duration-200 hover:opacity-80"
              data-testid="header-logo-link"
            >
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-violet-500 group-hover:text-violet-400 transition-colors duration-200" />
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                KOLOR STUDIO
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-sm text-[#A3A3A3] hidden lg:inline" data-testid="user-greeting">
              {user?.studioName || `${user?.firstName}'s Studio`}
            </span>
            <div className="hidden lg:flex items-center gap-2">
              <HelpMenu onOpenFeedback={() => setShowFeedback(true)} />
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-xl transition-all duration-200"
                data-testid="settings-button"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-xl transition-all duration-200 touch-target"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" data-testid="mobile-sidebar">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#1A1A1A] border-r border-[#333] animate-slide-left flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-violet-500" />
                <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  KOLOR STUDIO
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-xl touch-target"
                data-testid="close-mobile-menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* User */}
            <div className="px-4 py-4 border-b border-[#333]">
              <p className="text-sm font-medium text-[#FAFAFA]">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-[#A3A3A3] mt-0.5">{user?.studioName || `${user?.firstName}'s Studio`}</p>
            </div>
            {/* Nav items */}
            <div className="flex-1 overflow-y-auto py-2">
              {([
                { mode: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Pipeline' },
                { mode: 'list' as ViewMode, icon: List, label: 'List View' },
                { mode: 'analytics' as ViewMode, icon: BarChart3, label: 'Analytics' },
                { mode: 'calendar' as ViewMode, icon: CalendarDays, label: 'Calendar' },
                { mode: 'portfolio' as ViewMode, icon: Briefcase, label: 'Portfolio' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => handleViewChange(mode)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 touch-target ${
                    viewMode === mode
                      ? 'text-violet-400 bg-violet-900/20 border-r-2 border-violet-500'
                      : 'text-[#A3A3A3] hover:bg-[#262626] hover:text-white'
                  }`}
                  data-testid={`sidebar-${mode}`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
            {/* Sidebar Footer */}
            <div className="p-4 border-t border-[#333] space-y-2">
              <button
                onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-[#A3A3A3] hover:bg-[#262626] rounded-xl transition-all duration-200 touch-target"
              >
                <Settings className="w-5 h-5" /> Settings
              </button>
              <button
                onClick={() => { setShowFeedback(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-[#A3A3A3] hover:bg-[#262626] rounded-xl transition-all duration-200 touch-target"
              >
                <Mail className="w-5 h-5" /> Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Welcome Message */}
        <div className="mb-4 md:mb-8" data-testid="welcome-section">
          {isFirstLogin ? (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-[#FAFAFA]" data-testid="welcome-first-login">
                Welcome to KOLOR STUDIO, {user?.firstName}!
              </h1>
              <p className="text-sm md:text-base text-[#A3A3A3] mt-1 md:mt-2">
                Your creative workspace is ready. Start by adding your first lead or sharing your inquiry form.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-[#FAFAFA]" data-testid="welcome-back">
                {getGreeting()}, {user?.firstName}
              </h1>
              <p className="text-xs md:text-sm text-[#A3A3A3] mt-1">{formatCurrentDate()}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-4 md:mb-8">
          {([
            { key: null, label: 'Total Leads', count: stats?.total || 0, icon: Users, iconBg: 'bg-blue-900/50 border-blue-700/50', iconColor: 'text-blue-400', testId: 'stat-total-leads' },
            { key: 'NEW', label: 'New Leads', count: stats?.statusCounts?.NEW || 0, icon: TrendingUp, iconBg: 'bg-yellow-900/50 border-yellow-700/50', iconColor: 'text-yellow-400', testId: 'stat-new-leads' },
            { key: 'QUOTED', label: 'Quoted', count: stats?.statusCounts?.QUOTED || 0, icon: Calendar, iconBg: 'bg-orange-900/50 border-orange-700/50', iconColor: 'text-orange-400', testId: 'stat-quoted' },
            { key: 'BOOKED', label: 'Booked', count: stats?.statusCounts?.BOOKED || 0, icon: DollarSign, iconBg: 'bg-green-900/50 border-green-700/50', iconColor: 'text-green-400', testId: 'stat-booked' },
          ]).map(({ key, label, count, icon: Icon, iconBg, iconColor, testId }) => (
            <div
              key={testId}
              className={`bg-[#1A1A1A] rounded-xl p-4 md:p-6 border cursor-pointer hover:border-violet-500/50 transition-all duration-200 group hover:shadow-lg hover:shadow-violet-500/5 active:scale-[0.98] ${
                statusFilter === key ? `border-violet-500 bg-violet-900/10` : 'border-[#333]'
              }`}
              onClick={() => key === null ? clearStatusFilter() : handleFilterByStatus(statusFilter === key ? null : key)}
              data-testid={testId}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-2 md:p-3 ${iconBg} rounded-xl border group-hover:scale-110 transition-all duration-200`}>
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-[#FAFAFA]">{count}</p>
                  <p className="text-xs md:text-sm text-[#A3A3A3]">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-[#1A1A1A] rounded-xl border border-[#333] p-3 md:p-5 mb-4 md:mb-8">
          {/* Mobile toolbar */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 text-sm"
                data-testid="search-input"
              />
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`p-2.5 rounded-xl border transition-all duration-200 touch-target md:hidden relative ${
                activeFilterCount > 0 ? 'border-violet-500 bg-violet-900/20 text-violet-400' : 'border-[#333] text-[#A3A3A3]'
              }`}
              data-testid="mobile-filter-toggle"
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={handleRefresh}
              className="p-2.5 hover:bg-[#262626] rounded-xl transition-all duration-200 touch-target hidden md:flex"
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 text-[#A3A3A3] ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Desktop view toggles */}
            <div className="hidden md:flex bg-[#0F0F0F] rounded-xl p-1 border border-[#333]">
              {([
                { mode: 'kanban' as ViewMode, icon: LayoutGrid, title: 'Pipeline View' },
                { mode: 'list' as ViewMode, icon: List, title: 'List View' },
                { mode: 'analytics' as ViewMode, icon: BarChart3, title: 'Analytics' },
                { mode: 'calendar' as ViewMode, icon: CalendarDays, title: 'Calendar' },
                { mode: 'portfolio' as ViewMode, icon: Briefcase, title: 'Portfolio' },
              ]).map(({ mode, icon: Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => handleViewChange(mode)}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${viewMode === mode ? 'bg-[#1A1A1A] shadow-sm text-violet-400' : 'text-[#A3A3A3] hover:text-white'}`}
                  data-testid={`view-${mode}`}
                  title={title}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Desktop filters */}
            <select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              className="hidden md:block px-3 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-sm text-[#A3A3A3] focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
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
              className="hidden lg:block px-3 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-sm text-[#A3A3A3] focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              data-testid="filter-industry"
            >
              <option value="">All Industries</option>
              {(Object.entries(INDUSTRY_TYPE_LABELS) as [IndustryType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <button
              onClick={() => setShowShareModal(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 border border-violet-600 text-violet-400 rounded-xl hover:bg-violet-900/30 transition-all duration-200 font-medium text-sm"
              data-testid="share-form-button"
            >
              <Link2 className="w-4 h-4" />
              <span className="hidden lg:inline">Share Form</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-all duration-200 font-medium text-sm hover:shadow-lg hover:shadow-violet-500/20 touch-target"
              data-testid="add-lead-button"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </button>
          </div>

          {/* Mobile filters dropdown */}
          {showMobileFilters && (
            <div className="mt-3 pt-3 border-t border-[#333] space-y-3 md:hidden animate-fade-in">
              {/* Active filter tags */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {statusFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-900/30 border border-violet-700/50 rounded-lg">
                      <span className="text-xs text-violet-300 font-medium">{LEAD_STATUS_LABELS[statusFilter as LeadStatus]}</span>
                      <button onClick={clearStatusFilter} className="p-0.5 hover:bg-violet-800/50 rounded" data-testid="clear-filter">
                        <X className="w-3 h-3 text-violet-400" />
                      </button>
                    </div>
                  )}
                  {projectTypeFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                      <span className="text-xs text-blue-300 font-medium">{PROJECT_TYPE_LABELS[projectTypeFilter as ProjectType]}</span>
                      <button onClick={() => setProjectTypeFilter('')} className="p-0.5">
                        <X className="w-3 h-3 text-blue-400" />
                      </button>
                    </div>
                  )}
                  {industryFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                      <span className="text-xs text-amber-300 font-medium">{INDUSTRY_TYPE_LABELS[industryFilter as IndustryType]}</span>
                      <button onClick={() => setIndustryFilter('')} className="p-0.5">
                        <X className="w-3 h-3 text-amber-400" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={projectTypeFilter}
                  onChange={(e) => setProjectTypeFilter(e.target.value)}
                  className="px-3 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-sm text-[#A3A3A3]"
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
                  className="px-3 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-sm text-[#A3A3A3]"
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
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-violet-600 text-violet-400 rounded-xl text-sm font-medium touch-target"
                  data-testid="mobile-share-form"
                >
                  <Link2 className="w-4 h-4" /> Share Form
                </button>
              </div>
            </div>
          )}

          {/* Desktop active filter tags */}
          {activeFilterCount > 0 && (
            <div className="hidden md:flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[#333]">
              {statusFilter && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-900/30 border border-violet-700/50 rounded-lg">
                  <span className="text-xs text-violet-300 font-medium">{LEAD_STATUS_LABELS[statusFilter as LeadStatus]}</span>
                  <button onClick={clearStatusFilter} className="p-0.5 hover:bg-violet-800/50 rounded" data-testid="clear-filter-desktop">
                    <X className="w-3.5 h-3.5 text-violet-400" />
                  </button>
                </div>
              )}
              {projectTypeFilter && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                  <span className="text-xs text-blue-300 font-medium">{PROJECT_TYPE_LABELS[projectTypeFilter as ProjectType]}</span>
                  <button onClick={() => setProjectTypeFilter('')} className="p-0.5 hover:bg-blue-800/50 rounded" data-testid="clear-project-type-filter">
                    <X className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
              )}
              {industryFilter && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                  <span className="text-xs text-amber-300 font-medium">{INDUSTRY_TYPE_LABELS[industryFilter as IndustryType]}</span>
                  <button onClick={() => setIndustryFilter('')} className="p-0.5 hover:bg-amber-800/50 rounded" data-testid="clear-industry-filter">
                    <X className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'analytics' ? (
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
          <div className="bg-[#1A1A1A] rounded-xl border border-[#333] p-6 md:p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-violet-700/30">
                <Target className="w-7 h-7 md:w-8 md:h-8 text-violet-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-[#FAFAFA]">Ready to get your first lead?</h3>
              <p className="text-sm md:text-base text-[#A3A3A3] mb-6 md:mb-8">
                Share your inquiry form with potential clients to start receiving project requests.
              </p>
              <div className="bg-[#0F0F0F] rounded-xl p-4 md:p-5 mb-6 md:mb-8 border border-[#333]">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <input
                    type="text"
                    value={`${window.location.origin}/inquiry`}
                    readOnly
                    className="flex-1 px-3 md:px-4 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-[#A3A3A3] text-sm min-w-0"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/inquiry`)}
                    className="px-3 md:px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 text-sm font-medium flex items-center gap-1.5 flex-shrink-0 touch-target"
                    data-testid="empty-copy-link"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                </div>
                <div className="flex gap-2 md:gap-3">
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent('Submit Your Project Request');
                      const body = encodeURIComponent(`Hi,\n\nPlease submit your details through this form:\n\n${window.location.origin}/inquiry\n\nLooking forward to working with you!`);
                      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                    }}
                    className="flex-1 px-3 py-2.5 border border-[#333] text-[#A3A3A3] rounded-xl hover:bg-[#262626] text-sm font-medium flex items-center justify-center gap-1.5 touch-target"
                    data-testid="empty-email-link"
                  >
                    <Mail className="w-4 h-4 text-violet-400" />
                    <span className="hidden sm:inline">Email Link</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 px-3 py-2.5 border border-[#333] text-[#A3A3A3] rounded-xl hover:bg-[#262626] text-sm font-medium flex items-center justify-center gap-1.5 touch-target"
                    data-testid="empty-more-options"
                  >
                    <Link2 className="w-4 h-4 text-violet-400" />
                    <span className="hidden sm:inline">More Options</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 md:px-8 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 font-medium touch-target"
              >
                Add Your First Lead
              </button>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            leads={filteredLeads}
            onLeadClick={setSelectedLead}
            onStatusChange={handleStatusChange}
            onLeadDelete={handleLeadDelete}
          />
        ) : (
          /* List view with responsive table */
          <div className="bg-[#1A1A1A] rounded-xl border border-[#333] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-[#0F0F0F] border-b border-[#333]">
                  <tr>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Client</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Project</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Status</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-[#262626] cursor-pointer transition-all duration-200 active:bg-[#333]"
                      onClick={() => setSelectedLead(lead)}
                      data-testid={`lead-row-${lead.id}`}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-5">
                        <p className="font-medium text-[#FAFAFA] text-sm">{lead.clientName}</p>
                        <p className="text-xs text-[#A3A3A3] truncate max-w-[120px] md:max-w-none">{lead.clientEmail}</p>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-5">
                        <p className="font-medium text-[#FAFAFA] text-sm truncate max-w-[120px] md:max-w-none">{lead.projectTitle}</p>
                        <p className="text-xs text-[#A3A3A3]">{lead.budget || 'No budget'}</p>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-5">
                        <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium ${DARK_STATUS_COLORS[lead.status]}`}>
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-5 text-sm text-[#A3A3A3] hidden sm:table-cell">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
        />
      )}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onLeadCreated={() => { fetchLeads(); fetchStats() }}
        />
      )}
      {showShareModal && <ShareFormModal onClose={() => setShowShareModal(false)} />}
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
    </div>
  )
}

export default Dashboard
