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
  Briefcase
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
  <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333] animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-[#333] rounded-xl" />
      <div className="space-y-2">
        <div className="h-7 w-16 bg-[#333] rounded-md" />
        <div className="h-4 w-24 bg-[#2a2a2a] rounded-md" />
      </div>
    </div>
  </div>
);

const KanbanSkeleton = () => (
  <div className="flex gap-5 overflow-x-auto pb-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex-shrink-0 w-72 rounded-xl border-2 border-[#333] bg-[#1A1A1A] animate-pulse">
        <div className="h-12 bg-[#333] rounded-t-lg" />
        <div className="p-4 space-y-4">
          {[1, 2].map((j) => (
            <div key={j} className="bg-[#1f1f1f] rounded-lg p-4 space-y-3 border border-[#333]">
              <div className="h-32 bg-[#2a2a2a] rounded-lg" />
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

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        navigate('/login')
        return
      }

      const userResult = await authApi.getMe()
      
      if (userResult.error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
        return
      }

      if (userResult.data?.user) {
        setUser(userResult.data.user)
        // Check first login from localStorage
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
    if (result.data?.leads) {
      setLeads(result.data.leads)
    }
  }

  const fetchStats = async () => {
    const result = await leadsApi.getStats()
    if (result.data) {
      setStats({ total: result.data.total, statusCounts: result.data.statusCounts })
    }
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
    if (status) {
      setViewMode('kanban')
    }
  }

  const clearStatusFilter = () => {
    setStatusFilter(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F]">
        <header className="bg-[#1A1A1A] border-b border-[#333] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#333] rounded-lg animate-pulse" />
              <div className="w-32 h-6 bg-[#333] rounded-lg animate-pulse" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          <div className="space-y-2 animate-pulse">
            <div className="h-8 w-64 bg-[#333] rounded-lg" />
            <div className="h-5 w-48 bg-[#2a2a2a] rounded-lg" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
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
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <button
            onClick={() => { setViewMode('kanban'); setStatusFilter(null); }}
            className="flex items-center gap-3 group transition-all duration-200 hover:opacity-80"
            data-testid="header-logo-link"
          >
            <Sparkles className="w-8 h-8 text-violet-500 group-hover:text-violet-400 transition-colors duration-200" />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#A3A3A3] hidden sm:inline" data-testid="user-greeting">
              {user?.studioName || `${user?.firstName}'s Studio`}
            </span>
            <HelpMenu onOpenFeedback={() => setShowFeedback(true)} />
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-xl transition-all duration-200"
              data-testid="settings-button"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-xl transition-all duration-200"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8" data-testid="welcome-section">
          {isFirstLogin ? (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-[#FAFAFA]" data-testid="welcome-first-login">
                Welcome to KOLOR STUDIO, {user?.firstName}!
              </h1>
              <p className="text-base text-[#A3A3A3] mt-2">
                Your creative workspace is ready. Start by adding your first lead or sharing your inquiry form.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-[#FAFAFA]" data-testid="welcome-back">
                {getGreeting()}, {user?.firstName}
              </h1>
              <p className="text-sm text-[#A3A3A3] mt-1">{formatCurrentDate()}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <div 
            className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333] cursor-pointer hover:border-violet-500/50 transition-all duration-200 group hover:shadow-lg hover:shadow-violet-500/5"
            onClick={clearStatusFilter}
            data-testid="stat-total-leads"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-900/50 rounded-xl border border-blue-700/50 group-hover:bg-blue-900/70 transition-all duration-200 group-hover:scale-110">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FAFAFA]" data-testid="total-leads">{stats?.total || 0}</p>
                <p className="text-sm text-[#A3A3A3]">Total Leads</p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-[#1A1A1A] rounded-xl p-6 border cursor-pointer hover:border-violet-500/50 transition-all duration-200 group hover:shadow-lg hover:shadow-violet-500/5 ${statusFilter === 'NEW' ? 'border-yellow-500 bg-yellow-900/10' : 'border-[#333]'}`}
            onClick={() => handleFilterByStatus(statusFilter === 'NEW' ? null : 'NEW')}
            data-testid="stat-new-leads"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-900/50 rounded-xl border border-yellow-700/50 group-hover:bg-yellow-900/70 transition-all duration-200 group-hover:scale-110">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FAFAFA]">{stats?.statusCounts?.NEW || 0}</p>
                <p className="text-sm text-[#A3A3A3]">New Leads</p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-[#1A1A1A] rounded-xl p-6 border cursor-pointer hover:border-violet-500/50 transition-all duration-200 group hover:shadow-lg hover:shadow-violet-500/5 ${statusFilter === 'QUOTED' ? 'border-orange-500 bg-orange-900/10' : 'border-[#333]'}`}
            onClick={() => handleFilterByStatus(statusFilter === 'QUOTED' ? null : 'QUOTED')}
            data-testid="stat-quoted"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-900/50 rounded-xl border border-orange-700/50 group-hover:bg-orange-900/70 transition-all duration-200 group-hover:scale-110">
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FAFAFA]">{stats?.statusCounts?.QUOTED || 0}</p>
                <p className="text-sm text-[#A3A3A3]">Quoted</p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-[#1A1A1A] rounded-xl p-6 border cursor-pointer hover:border-violet-500/50 transition-all duration-200 group hover:shadow-lg hover:shadow-violet-500/5 ${statusFilter === 'BOOKED' ? 'border-green-500 bg-green-900/10' : 'border-[#333]'}`}
            onClick={() => handleFilterByStatus(statusFilter === 'BOOKED' ? null : 'BOOKED')}
            data-testid="stat-booked"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-900/50 rounded-xl border border-green-700/50 group-hover:bg-green-900/70 transition-all duration-200 group-hover:scale-110">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FAFAFA]">{stats?.statusCounts?.BOOKED || 0}</p>
                <p className="text-sm text-[#A3A3A3]">Booked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-[#1A1A1A] rounded-xl border border-[#333] p-5 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200"
                  data-testid="search-input"
                />
              </div>
              {(statusFilter || projectTypeFilter || industryFilter) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {statusFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-900/30 border border-violet-700/50 rounded-lg">
                      <span className="text-xs text-violet-300 font-medium">{LEAD_STATUS_LABELS[statusFilter as LeadStatus]}</span>
                      <button onClick={clearStatusFilter} className="p-0.5 hover:bg-violet-800/50 rounded transition-colors duration-200" data-testid="clear-filter">
                        <X className="w-3.5 h-3.5 text-violet-400" />
                      </button>
                    </div>
                  )}
                  {projectTypeFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                      <span className="text-xs text-blue-300 font-medium">{PROJECT_TYPE_LABELS[projectTypeFilter as ProjectType]}</span>
                      <button onClick={() => setProjectTypeFilter('')} className="p-0.5 hover:bg-blue-800/50 rounded transition-colors duration-200" data-testid="clear-project-type-filter">
                        <X className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </div>
                  )}
                  {industryFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                      <span className="text-xs text-amber-300 font-medium">{INDUSTRY_TYPE_LABELS[industryFilter as IndustryType]}</span>
                      <button onClick={() => setIndustryFilter('')} className="p-0.5 hover:bg-amber-800/50 rounded transition-colors duration-200" data-testid="clear-industry-filter">
                        <X className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleRefresh}
                className="p-2.5 hover:bg-[#262626] rounded-xl transition-all duration-200"
                disabled={refreshing}
              >
                <RefreshCw className={`w-5 h-5 text-[#A3A3A3] ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex bg-[#0F0F0F] rounded-xl p-1 border border-[#333]">
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
              <select
                value={projectTypeFilter}
                onChange={(e) => setProjectTypeFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-sm text-[#A3A3A3] focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
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
                className="px-3 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-sm text-[#A3A3A3] focus:ring-2 focus:ring-violet-500 focus:border-transparent hidden md:block transition-all duration-200"
                data-testid="filter-industry"
              >
                <option value="">All Industries</option>
                {(Object.entries(INDUSTRY_TYPE_LABELS) as [IndustryType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-violet-600 text-violet-400 rounded-xl hover:bg-violet-900/30 transition-all duration-200 font-medium text-sm"
                data-testid="share-form-button"
              >
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share Form</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-all duration-200 font-medium text-sm hover:shadow-lg hover:shadow-violet-500/20"
                data-testid="add-lead-button"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>
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
                  if (result.data?.lead) {
                    setSelectedLead(result.data.lead)
                  }
                })
              }
            }}
          />
        ) : viewMode === 'portfolio' ? (
          <PortfolioPage user={user} />
        ) : filteredLeads.length === 0 && !loading ? (
          <div className="bg-[#1A1A1A] rounded-xl border border-[#333] p-8 md:p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-700/30">
                <Target className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#FAFAFA]">Ready to get your first lead?</h3>
              <p className="text-base text-[#A3A3A3] mb-8">
                Share your inquiry form with potential clients to start receiving project requests.
              </p>
              
              <div className="bg-[#0F0F0F] rounded-xl p-5 mb-8 border border-[#333]">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={`${window.location.origin}/inquiry`}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-[#A3A3A3] text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/inquiry`);
                    }}
                    className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-all duration-200 text-sm font-medium flex items-center gap-1.5"
                    data-testid="empty-copy-link"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent('Submit Your Project Request');
                      const body = encodeURIComponent(`Hi,\n\nI'd love to learn more about your project!\n\nPlease submit your details through this form, and I'll get back to you within 24 hours:\n\n${window.location.origin}/inquiry\n\nLooking forward to working with you!`);
                      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                    }}
                    className="flex-1 px-4 py-2.5 border border-[#333] text-[#A3A3A3] rounded-xl hover:bg-[#262626] transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
                    data-testid="empty-email-link"
                  >
                    <Mail className="w-4 h-4 text-violet-400" />
                    Email Link
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 px-4 py-2.5 border border-[#333] text-[#A3A3A3] rounded-xl hover:bg-[#262626] transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
                    data-testid="empty-more-options"
                  >
                    <Link2 className="w-4 h-4 text-violet-400" />
                    More Options
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">Or add a lead manually</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-8 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-all duration-200 font-medium hover:shadow-lg hover:shadow-violet-500/20"
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
          <div className="bg-[#1A1A1A] rounded-xl border border-[#333] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0F0F0F] border-b border-[#333]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-[#262626] cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedLead(lead)}
                    data-testid={`lead-row-${lead.id}`}
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-medium text-[#FAFAFA]">{lead.clientName}</p>
                        <p className="text-sm text-[#A3A3A3]">{lead.clientEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium text-[#FAFAFA]">{lead.projectTitle}</p>
                      <p className="text-sm text-[#A3A3A3]">{lead.budget || 'No budget specified'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${DARK_STATUS_COLORS[lead.status]}`}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#A3A3A3]">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

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
          onLeadCreated={() => {
            fetchLeads()
            fetchStats()
          }}
        />
      )}

      {showShareModal && (
        <ShareFormModal
          onClose={() => setShowShareModal(false)}
        />
      )}

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

      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}

      {showBookingModal && bookingLead && (
        <BookingModal
          lead={bookingLead}
          onClose={() => {
            setShowBookingModal(false)
            setBookingLead(null)
          }}
          onSaved={handleBookingSaved}
        />
      )}
    </div>
  )
}

export default Dashboard
