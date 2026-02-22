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
  X
} from 'lucide-react'
import { authApi, leadsApi, Lead, LeadStatus, User as UserType, LEAD_STATUS_LABELS } from '../services/api'
import KanbanBoard from '../components/KanbanBoard'
import LeadDetailModal from '../components/LeadDetailModal'
import AddLeadModal from '../components/AddLeadModal'
import ShareFormModal from '../components/ShareFormModal'
import SettingsModal from '../components/SettingsModal'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import CalendarView from '../components/CalendarView'
import HelpMenu from '../components/HelpMenu'
import FeedbackModal from '../components/FeedbackModal'
import AnnouncementBanner from '../components/AnnouncementBanner'
import { trackLogout, trackViewChanged } from '../utils/analytics'

type ViewMode = 'kanban' | 'list' | 'analytics' | 'calendar';

// Dark theme status colors
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
      }

      await fetchLeads()
      await fetchStats()
      setLoading(false)
    }

    init()
  }, [navigate])

  const fetchLeads = async () => {
    const result = await leadsApi.getAll()
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

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const result = await leadsApi.updateStatus(leadId, newStatus)
    if (result.data?.lead) {
      setLeads(leads.map(l => l.id === leadId ? result.data!.lead : l))
      fetchStats()
    }
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
    // Status filter
    if (statusFilter && lead.status !== statusFilter) return false
    
    // Search filter
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lead.clientName.toLowerCase().includes(query) ||
      lead.clientEmail.toLowerCase().includes(query) ||
      lead.projectTitle.toLowerCase().includes(query)
    )
  })

  // Handler to filter by status and switch to kanban view
  const handleFilterByStatus = (status: string | null) => {
    setStatusFilter(status)
    if (status) {
      setViewMode('kanban')
    }
  }

  // Clear filter handler
  const clearStatusFilter = () => {
    setStatusFilter(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-violet-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden sm:inline" data-testid="user-greeting">
              {user?.studioName || `${user?.firstName}'s Studio`}
            </span>
            <HelpMenu onOpenFeedback={() => setShowFeedback(true)} />
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-dark-card-hover rounded-lg transition"
              data-testid="settings-button"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-card-hover rounded-lg transition"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div 
            className="bg-dark-card rounded-xl p-4 shadow-sm border border-dark-border cursor-pointer hover:border-violet-500/50 transition group"
            onClick={clearStatusFilter}
            data-testid="stat-total-leads"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/50 rounded-lg border border-blue-700/50 group-hover:bg-blue-900/70 transition">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white" data-testid="total-leads">{stats?.total || 0}</p>
                <p className="text-sm text-gray-400">Total Leads</p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-dark-card rounded-xl p-4 shadow-sm border cursor-pointer hover:border-violet-500/50 transition group ${statusFilter === 'NEW' ? 'border-yellow-500 bg-yellow-900/10' : 'border-dark-border'}`}
            onClick={() => handleFilterByStatus(statusFilter === 'NEW' ? null : 'NEW')}
            data-testid="stat-new-leads"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-900/50 rounded-lg border border-yellow-700/50 group-hover:bg-yellow-900/70 transition">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.statusCounts?.NEW || 0}</p>
                <p className="text-sm text-gray-400">New Leads</p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-dark-card rounded-xl p-4 shadow-sm border cursor-pointer hover:border-violet-500/50 transition group ${statusFilter === 'QUOTED' ? 'border-orange-500 bg-orange-900/10' : 'border-dark-border'}`}
            onClick={() => handleFilterByStatus(statusFilter === 'QUOTED' ? null : 'QUOTED')}
            data-testid="stat-quoted"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-900/50 rounded-lg border border-orange-700/50 group-hover:bg-orange-900/70 transition">
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.statusCounts?.QUOTED || 0}</p>
                <p className="text-sm text-gray-400">Quoted</p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-dark-card rounded-xl p-4 shadow-sm border cursor-pointer hover:border-violet-500/50 transition group ${statusFilter === 'BOOKED' ? 'border-green-500 bg-green-900/10' : 'border-dark-border'}`}
            onClick={() => handleFilterByStatus(statusFilter === 'BOOKED' ? null : 'BOOKED')}
            data-testid="stat-booked"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-900/50 rounded-lg border border-green-700/50 group-hover:bg-green-900/70 transition">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.statusCounts?.BOOKED || 0}</p>
                <p className="text-sm text-gray-400">Booked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-gray-500"
                  data-testid="search-input"
                />
              </div>
              {/* Active Filter Indicator */}
              {statusFilter && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-900/30 border border-violet-700/50 rounded-lg">
                  <span className="text-sm text-violet-300">
                    Filtering: <span className="font-medium">{LEAD_STATUS_LABELS[statusFilter as LeadStatus]}</span>
                  </span>
                  <button
                    onClick={clearStatusFilter}
                    className="p-0.5 hover:bg-violet-800/50 rounded transition"
                    data-testid="clear-filter"
                  >
                    <X className="w-4 h-4 text-violet-400" />
                  </button>
                </div>
              )}
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-dark-card-hover rounded-lg transition"
                disabled={refreshing}
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex bg-dark-bg-secondary rounded-lg p-1 border border-dark-border">
                <button
                  onClick={() => handleViewChange('kanban')}
                  className={`p-2 rounded-md transition ${viewMode === 'kanban' ? 'bg-dark-card shadow-sm text-violet-400' : 'text-gray-400'}`}
                  data-testid="view-kanban"
                  title="Pipeline View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewChange('list')}
                  className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-dark-card shadow-sm text-violet-400' : 'text-gray-400'}`}
                  data-testid="view-list"
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewChange('analytics')}
                  className={`p-2 rounded-md transition ${viewMode === 'analytics' ? 'bg-dark-card shadow-sm text-violet-400' : 'text-gray-400'}`}
                  data-testid="view-analytics"
                  title="Analytics"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewChange('calendar')}
                  className={`p-2 rounded-md transition ${viewMode === 'calendar' ? 'bg-dark-card shadow-sm text-violet-400' : 'text-gray-400'}`}
                  data-testid="view-calendar"
                  title="Calendar"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-violet-600 text-violet-400 rounded-lg hover:bg-violet-900/30 transition font-medium"
                data-testid="share-form-button"
              >
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share Form</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition font-medium"
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
          <CalendarView 
            user={user} 
            onLeadClick={(leadId) => {
              const lead = leads.find(l => l.id === leadId)
              if (lead) {
                setSelectedLead(lead)
              } else {
                // Fetch lead if not in current list
                leadsApi.getOne(leadId).then(result => {
                  if (result.data?.lead) {
                    setSelectedLead(result.data.lead)
                  }
                })
              }
            }}
          />
        ) : filteredLeads.length === 0 && !loading ? (
          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-8 md:p-12">
            {/* Empty State with Share Helper */}
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-700/30">
                <Target className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Ready to get your first lead?</h3>
              <p className="text-gray-400 mb-6">
                Share your inquiry form with potential clients to start receiving project requests.
              </p>
              
              {/* Quick Share Actions */}
              <div className="bg-dark-bg-secondary rounded-xl p-4 mb-6 border border-dark-border">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={`${window.location.origin}/inquiry`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-400 text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/inquiry`);
                    }}
                    className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm font-medium flex items-center gap-1"
                    data-testid="empty-copy-link"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent('Submit Your Project Request');
                      const body = encodeURIComponent(`Hi,\n\nI'd love to learn more about your project!\n\nPlease submit your details through this form, and I'll get back to you within 24 hours:\n\n${window.location.origin}/inquiry\n\nLooking forward to working with you!`);
                      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                    }}
                    className="flex-1 px-3 py-2 border border-dark-border text-gray-300 rounded-lg hover:bg-dark-card-hover transition text-sm font-medium flex items-center justify-center gap-2"
                    data-testid="empty-email-link"
                  >
                    <Mail className="w-4 h-4 text-violet-400" />
                    Email Link
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 px-3 py-2 border border-dark-border text-gray-300 rounded-lg hover:bg-dark-card-hover transition text-sm font-medium flex items-center justify-center gap-2"
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
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition font-medium"
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
          /* List View */
          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-bg-secondary border-b border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-dark-card-hover cursor-pointer transition"
                    onClick={() => setSelectedLead(lead)}
                    data-testid={`lead-row-${lead.id}`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{lead.clientName}</p>
                        <p className="text-sm text-gray-400">{lead.clientEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{lead.projectTitle}</p>
                      <p className="text-sm text-gray-400">{lead.budget || 'No budget specified'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${DARK_STATUS_COLORS[lead.status]}`}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
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
            // Update local user state with new currency settings
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
    </div>
  )
}

export default Dashboard
