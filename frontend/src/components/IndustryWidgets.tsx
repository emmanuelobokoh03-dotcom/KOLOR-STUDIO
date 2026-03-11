import { useState, useEffect } from 'react'
import {
  Camera,
  Clock,
  CalendarDots,
  MapPin,
  CurrencyDollar,
  Palette,
  Package,
  Truck,
  ArrowRight,
  PenNib,
  ChatText,
  CheckCircle,
  FileText,
  SpinnerGap,
  Plus,
  Eye,
  CaretRight,
  Sparkle
} from '@phosphor-icons/react'
import {
  bookingsApi, leadsApi, quotesApi,
  Booking, Lead, LeadStatus,
  LEAD_STATUS_LABELS, SERVICE_TYPE_LABELS,
} from '../services/api'

// ─── Shared helpers ────────────────────────────────────────

const formatRelativeDate = (d: string) => {
  const date = new Date(d)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7 && days > 0) return `In ${days} days`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

const WidgetCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#1A1A1A] rounded-xl border border-[#333] p-4 md:p-5 ${className}`}>
    {children}
  </div>
)

const WidgetHeader = ({ icon: Icon, title, iconColor = 'text-brand-primary-light', action }: {
  icon: React.ElementType; title: string; iconColor?: string;
  action?: { label: string; onClick: () => void }
}) => (
  <div className="flex items-center justify-between mb-3 md:mb-4">
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <h3 className="text-sm font-semibold text-[#FAFAFA]">{title}</h3>
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="text-xs text-brand-primary-light hover:text-brand-primary-light font-medium flex items-center gap-1 transition-colors"
      >
        {action.label} <CaretRight className="w-3 h-3" />
      </button>
    )}
  </div>
)

const EmptyWidget = ({ message }: { message: string }) => (
  <p className="text-xs text-gray-500 text-center py-4">{message}</p>
)

const LoadingDots = () => (
  <div className="flex items-center justify-center py-6">
    <SpinnerGap className="w-5 h-5 text-brand-primary-light animate-spin" />
  </div>
)

// ─── PHOTOGRAPHY DASHBOARD ────────────────────────────────

interface PhotographyWidgetsProps {
  onViewCalendar: () => void
  onLeadClick: (lead: Lead) => void
}

export function PhotographyWidgets({ onViewCalendar, onLeadClick }: PhotographyWidgetsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeProjects, setActiveProjects] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const now = new Date()
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const [bRes, lRes] = await Promise.all([
        bookingsApi.getAll({ start: now.toISOString(), end: weekEnd.toISOString(), status: 'CONFIRMED' }),
        leadsApi.getAll({}),
      ])

      if (bRes.data?.bookings) setBookings(bRes.data.bookings.slice(0, 5))
      if (lRes.data?.leads) {
        const active = lRes.data.leads.filter(l =>
          ['CONTACTED', 'QUOTED', 'NEGOTIATING'].includes(l.status)
        )
        setActiveProjects(active.slice(0, 4))
      }
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><LoadingDots /><LoadingDots /></div>

  const todayBookings = bookings.filter(b => {
    const d = new Date(b.startTime)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in" data-testid="photography-widgets">
      {/* Upcoming Shoots */}
      <WidgetCard>
        <WidgetHeader
          icon={Camera}
          title="Upcoming Shoots"
          iconColor="text-brand-primary-light"
          action={{ label: 'Calendar', onClick: onViewCalendar }}
        />
        {bookings.length === 0 ? (
          <EmptyWidget message="No upcoming shoots this week" />
        ) : (
          <div className="space-y-2.5">
            {bookings.map(b => (
              <div
                key={b.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0F0F0F] border border-[#262626] hover:border-brand-primary-dark/40 transition-all group cursor-pointer"
                data-testid={`upcoming-shoot-${b.id}`}
              >
                <div className="w-10 h-10 rounded-lg bg-brand-primary-dark/40 border border-brand-primary-dark/30 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-brand-primary-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#FAFAFA] truncate">{b.title}</p>
                  <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                    <CalendarDots className="w-3 h-3" />
                    <span>{formatRelativeDate(b.startTime)}</span>
                    <span className="text-gray-600">|</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(b.startTime)}</span>
                  </div>
                </div>
                {b.location && (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{b.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {todayBookings.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#333]">
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">
                {todayBookings.length} shoot{todayBookings.length > 1 ? 's' : ''} today
              </span>
            </div>
          </div>
        )}
      </WidgetCard>

      {/* Active Projects */}
      <WidgetCard>
        <WidgetHeader
          icon={Sparkle}
          title="Active Projects"
          iconColor="text-brand-primary-light"
        />
        {activeProjects.length === 0 ? (
          <EmptyWidget message="No active projects" />
        ) : (
          <div className="space-y-2.5">
            {activeProjects.map(lead => (
              <div
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0F0F0F] border border-[#262626] hover:border-brand-primary-dark/40 transition-all cursor-pointer group"
                data-testid={`active-project-${lead.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#FAFAFA] truncate group-hover:text-brand-primary-light transition-colors">{lead.projectTitle}</p>
                  <p className="text-xs text-[#A3A3A3]">{lead.clientName}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary-dark/30 text-brand-primary-light border border-brand-primary-dark/50 flex-shrink-0">
                  {LEAD_STATUS_LABELS[lead.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </WidgetCard>
    </div>
  )
}

// ─── FINE ART DASHBOARD ───────────────────────────────────

interface FineArtWidgetsProps {
  onLeadClick: (lead: Lead) => void
  onAddLead: () => void
}

export function FineArtWidgets({ onLeadClick, onAddLead }: FineArtWidgetsProps) {
  const [commissions, setCommissions] = useState<Lead[]>([])
  const [pendingQuotes, setPendingQuotes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [lRes, qRes] = await Promise.all([
        leadsApi.getAll({}),
        quotesApi.getByLead(''), // will get all accessible quotes
      ])

      if (lRes.data?.leads) {
        const active = lRes.data.leads.filter(l =>
          !['BOOKED', 'LOST'].includes(l.status)
        )
        setCommissions(active.slice(0, 6))
      }

      // Count pending quotes from leads stats
      const statsRes = await leadsApi.getStats()
      if (statsRes.data) {
        setPendingQuotes(statsRes.data.statusCounts?.QUOTED || 0)
      }

      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><LoadingDots /><LoadingDots /><LoadingDots /></div>

  const statusGroups: Record<string, Lead[]> = {}
  commissions.forEach(l => {
    if (!statusGroups[l.status]) statusGroups[l.status] = []
    statusGroups[l.status].push(l)
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in" data-testid="fineart-widgets">
      {/* Active Commissions */}
      <WidgetCard className="md:col-span-2">
        <WidgetHeader
          icon={Palette}
          title="Active Commissions"
          iconColor="text-amber-400"
          action={{ label: 'New Commission', onClick: onAddLead }}
        />
        {commissions.length === 0 ? (
          <EmptyWidget message="No active commissions" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {commissions.map(lead => (
              <div
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0F0F0F] border border-[#262626] hover:border-amber-700/40 transition-all cursor-pointer group"
                data-testid={`commission-${lead.id}`}
              >
                {lead.coverImage ? (
                  <img src={lead.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-amber-900/30 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                    <Palette className="w-4 h-4 text-amber-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#FAFAFA] truncate group-hover:text-amber-300 transition-colors">{lead.projectTitle}</p>
                  <p className="text-xs text-[#A3A3A3]">{lead.clientName}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-300 border border-amber-700/50 flex-shrink-0">
                  {LEAD_STATUS_LABELS[lead.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </WidgetCard>

      {/* Commission Pipeline */}
      <WidgetCard>
        <WidgetHeader
          icon={Package}
          title="Pipeline"
          iconColor="text-emerald-400"
        />
        <div className="space-y-3">
          {Object.entries(statusGroups).map(([status, leads]) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'NEW' ? 'bg-brand-primary-light' :
                  status === 'CONTACTED' ? 'bg-brand-primary-light' :
                  status === 'QUOTED' ? 'bg-brand-accent-light' :
                  status === 'NEGOTIATING' ? 'bg-blue-400' :
                  'bg-gray-400'
                }`} />
                <span className="text-xs text-[#A3A3A3]">{LEAD_STATUS_LABELS[status as LeadStatus]}</span>
              </div>
              <span className="text-sm font-semibold text-[#FAFAFA]">{leads.length}</span>
            </div>
          ))}
          {pendingQuotes > 0 && (
            <div className="pt-3 border-t border-[#333]">
              <div className="flex items-center gap-2 text-xs">
                <CurrencyDollar className="w-3.5 h-3.5 text-brand-accent-light" />
                <span className="text-brand-accent-light font-medium">{pendingQuotes} pending quote{pendingQuotes > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </WidgetCard>
    </div>
  )
}

// ─── DESIGN DASHBOARD ─────────────────────────────────────

interface DesignWidgetsProps {
  onLeadClick: (lead: Lead) => void
  onAddLead: () => void
}

export function DesignWidgets({ onLeadClick, onAddLead }: DesignWidgetsProps) {
  const [projects, setProjects] = useState<Lead[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<number>(0)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [lRes, sRes] = await Promise.all([
        leadsApi.getAll({}),
        leadsApi.getStats(),
      ])

      if (lRes.data?.leads) {
        const active = lRes.data.leads.filter(l => !['LOST'].includes(l.status))
        setProjects(active.slice(0, 5))
      }
      if (sRes.data) {
        setStats(sRes.data.statusCounts || {})
        setPendingApprovals(sRes.data.statusCounts?.QUOTED || 0)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><LoadingDots /><LoadingDots /><LoadingDots /></div>

  const phases = [
    { key: 'NEW', label: 'Brief', color: 'bg-brand-primary', count: stats.NEW || 0 },
    { key: 'CONTACTED', label: 'Discovery', color: 'bg-brand-primary', count: stats.CONTACTED || 0 },
    { key: 'QUOTED', label: 'Proposal', color: 'bg-brand-accent', count: stats.QUOTED || 0 },
    { key: 'NEGOTIATING', label: 'Revisions', color: 'bg-blue-500', count: stats.NEGOTIATING || 0 },
    { key: 'BOOKED', label: 'Delivered', color: 'bg-emerald-500', count: stats.BOOKED || 0 },
  ]
  const totalPhaseCount = phases.reduce((sum, p) => sum + p.count, 0) || 1

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in" data-testid="design-widgets">
      {/* Projects by Phase */}
      <WidgetCard className="md:col-span-2">
        <WidgetHeader
          icon={PenNib}
          title="Projects by Phase"
          iconColor="text-indigo-400"
          action={{ label: 'New Project', onClick: onAddLead }}
        />
        {/* Phase bar */}
        <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-[#0F0F0F]">
          {phases.map(p => p.count > 0 && (
            <div
              key={p.key}
              className={`${p.color} transition-all duration-500`}
              style={{ width: `${(p.count / totalPhaseCount) * 100}%` }}
              title={`${p.label}: ${p.count}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {phases.map(p => (
            <div key={p.key} className="text-center p-2 rounded-lg bg-[#0F0F0F] border border-[#262626]">
              <p className="text-lg font-bold text-[#FAFAFA]">{p.count}</p>
              <p className="text-[10px] text-[#A3A3A3] mt-0.5">{p.label}</p>
            </div>
          ))}
        </div>

        {/* Recent projects */}
        {projects.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#333] space-y-2">
            {projects.slice(0, 3).map(lead => (
              <div
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0F0F0F] transition-all cursor-pointer group"
                data-testid={`design-project-${lead.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#FAFAFA] truncate group-hover:text-indigo-300 transition-colors">{lead.projectTitle}</p>
                  <p className="text-xs text-[#A3A3A3]">{lead.clientName} &middot; {SERVICE_TYPE_LABELS[lead.serviceType]}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </WidgetCard>

      {/* Approvals & Status */}
      <WidgetCard>
        <WidgetHeader
          icon={ChatText}
          title="Awaiting Action"
          iconColor="text-brand-accent-light"
        />
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-brand-accent-dark/20 border border-brand-accent-dark/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-accent-light" />
                <span className="text-xs text-[#A3A3A3]">Pending Proposals</span>
              </div>
              <span className="text-lg font-bold text-brand-accent-light">{pendingApprovals}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-[#A3A3A3]">In Revisions</span>
              </div>
              <span className="text-lg font-bold text-blue-300">{stats.NEGOTIATING || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-[#A3A3A3]">Delivered</span>
              </div>
              <span className="text-lg font-bold text-emerald-300">{stats.BOOKED || 0}</span>
            </div>
          </div>
        </div>
      </WidgetCard>
    </div>
  )
}
