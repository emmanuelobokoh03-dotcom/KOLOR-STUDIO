import { useState, useEffect, useMemo } from 'react'
import {
  CaretLeft,
  CaretRight,
  SpinnerGap,
  Camera,
  Video,
  Palette,
  Globe,
  Sparkle,
  FileText,
  ChatText,
  Package,
  CalendarBlank as CalendarIcon,
  ArrowsClockwise,
  List,
  CalendarDots,
  Clock,
  MapPin,
  Funnel,
  Eye,
  EyeSlash,
  Plus
} from '@phosphor-icons/react'
import { leadsApi, CalendarEvent, User, ServiceType, SERVICE_TYPE_LABELS } from '../services/api'
import { formatCurrency, CurrencySettings } from '../utils/currency'

interface CalendarViewProps {
  user: User | null;
  onLeadClick?: (leadId: string) => void;
}

type ViewType = 'month' | 'week' | 'day' | 'agenda';

// Service type colors
const SERVICE_COLORS: Record<ServiceType, { bg: string; border: string; text: string; dot: string }> = {
  PHOTOGRAPHY: { bg: 'bg-brand-primary-dark/60', border: 'border-brand-primary', text: 'text-purple-600', dot: 'bg-brand-primary' },
  VIDEOGRAPHY: { bg: 'bg-blue-900/60', border: 'border-blue-500', text: 'text-blue-200', dot: 'bg-blue-500' },
  GRAPHIC_DESIGN: { bg: 'bg-pink-900/60', border: 'border-pink-500', text: 'text-pink-200', dot: 'bg-pink-500' },
  WEB_DESIGN: { bg: 'bg-cyan-900/60', border: 'border-cyan-500', text: 'text-cyan-200', dot: 'bg-cyan-500' },
  BRANDING: { bg: 'bg-orange-900/60', border: 'border-orange-500', text: 'text-orange-200', dot: 'bg-orange-500' },
  CONTENT_CREATION: { bg: 'bg-green-900/60', border: 'border-green-500', text: 'text-green-200', dot: 'bg-green-500' },
  CONSULTING: { bg: 'bg-yellow-900/60', border: 'border-yellow-500', text: 'text-yellow-200', dot: 'bg-yellow-500' },
  OTHER: { bg: 'bg-light-100', border: 'border-gray-500', text: 'text-text-secondary', dot: 'bg-gray-500' },
  FINE_ART: { bg: 'bg-rose-900/60', border: 'border-rose-500', text: 'text-rose-200', dot: 'bg-rose-500' },
  ILLUSTRATION: { bg: 'bg-amber-900/60', border: 'border-amber-500', text: 'text-amber-200', dot: 'bg-amber-500' },
};

const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  PHOTOGRAPHY: <Camera className="w-3 h-3" />,
  VIDEOGRAPHY: <Video className="w-3 h-3" />,
  GRAPHIC_DESIGN: <Palette className="w-3 h-3" />,
  WEB_DESIGN: <Globe className="w-3 h-3" />,
  BRANDING: <Sparkle className="w-3 h-3" />,
  CONTENT_CREATION: <FileText className="w-3 h-3" />,
  CONSULTING: <ChatText className="w-3 h-3" />,
  OTHER: <Package className="w-3 h-3" />,
  FINE_ART: <Palette className="w-3 h-3" />,
  ILLUSTRATION: <Palette className="w-3 h-3" />,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarView({ user, onLeadClick }: CalendarViewProps) {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('month')
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'all'>('all')
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false)

  // Get user currency settings
  const currencySettings: CurrencySettings = {
    currency: user?.currency || 'USD',
    currencySymbol: user?.currencySymbol || '$',
    currencyPosition: (user?.currencyPosition as 'BEFORE' | 'AFTER') || 'BEFORE',
    numberFormat: (user?.numberFormat as any) || '1,000.00',
  }

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  const fetchEvents = async () => {
    setLoading(true)
    
    // Get 6-month range for more data
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 4, 0)
    
    const result = await leadsApi.getCalendarEvents(
      start.toISOString(),
      end.toISOString()
    )
    
    if (result.data?.events) {
      // Filter to only show BOOKED leads with event dates
      const bookedEvents = result.data.events.filter(
        e => e.status === 'BOOKED' && e.type === 'event'
      )
      setEvents(bookedEvents)
    }
    
    setLoading(false)
  }

  // Filtered events based on service type and upcoming toggle
  const filteredEvents = useMemo(() => {
    let filtered = events
    
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(e => e.serviceType === serviceFilter)
    }
    
    if (showUpcomingOnly) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filtered = filtered.filter(e => new Date(e.date) >= today)
    }
    
    return filtered
  }, [events, serviceFilter, showUpcomingOnly])

  // Get calendar grid data
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const totalDays = lastDay.getDate()
    
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[] }[] = []
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({ date, isCurrentMonth: false, events: [] })
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true, events: [] })
    }
    
    // Next month days to fill grid
    const remaining = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false, events: [] })
    }
    
    // Map events to days
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.date)
      const dayIndex = days.findIndex(d => 
        d.date.getFullYear() === eventDate.getFullYear() &&
        d.date.getMonth() === eventDate.getMonth() &&
        d.date.getDate() === eventDate.getDate()
      )
      if (dayIndex !== -1) {
        days[dayIndex].events.push(event)
      }
    })
    
    return days
  }, [currentDate, filteredEvents])

  // Week view data
  const weekDays = useMemo(() => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay()) // Start of week (Sunday)
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date)
        return (
          eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate()
        )
      })
      
      return { date, events: dayEvents }
    })
  }, [currentDate, filteredEvents])

  // Day view data
  const dayEvents = useMemo(() => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getDate() === currentDate.getDate()
      )
    })
  }, [currentDate, filteredEvents])

  // Agenda view data (next 30 days)
  const agendaEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 30)
    
    return filteredEvents
      .filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= today && eventDate <= endDate
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredEvents])

  const goToToday = () => setCurrentDate(new Date())
  const goToPrev = () => {
    const newDate = new Date(currentDate)
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (viewType === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }
  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const handleEventClick = (event: CalendarEvent) => {
    if (onLeadClick) {
      onLeadClick(event.leadId)
    }
  }

  const getServiceColor = (serviceType?: ServiceType) => {
    return SERVICE_COLORS[serviceType || 'OTHER']
  }

  const getServiceIcon = (serviceType?: ServiceType) => {
    return SERVICE_ICONS[serviceType || 'OTHER']
  }

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Stats
  const upcomingCount = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return filteredEvents.filter(e => new Date(e.date) >= today).length
  }, [filteredEvents])

  const totalValue = useMemo(() => {
    return filteredEvents.reduce((sum, e) => sum + (e.value || 0), 0)
  }, [filteredEvents])

  // Empty state check
  const hasNoBookings = events.length === 0

  return (
    <div className="space-y-4" data-testid="calendar-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Calendar</h2>
          <p className="text-text-secondary text-sm">View your booked projects and upcoming events</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Service Type Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as ServiceType | 'all')}
            className="px-3 py-2 bg-light-100 border border-light-200 rounded-lg text-sm text-text-secondary min-w-[140px]"
            data-testid="calendar-service-filter"
          >
            <option value="all">All Services</option>
            <option value="PHOTOGRAPHY">Photography</option>
            <option value="VIDEOGRAPHY">Videography</option>
            <option value="GRAPHIC_DESIGN">Graphic Design</option>
            <option value="WEB_DESIGN">Web Design</option>
            <option value="BRANDING">Branding</option>
            <option value="CONTENT_CREATION">Content Creation</option>
            <option value="CONSULTING">Consulting</option>
            <option value="OTHER">Other</option>
          </select>
          
          {/* Upcoming Toggle */}
          <button
            onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition border ${
              showUpcomingOnly 
                ? 'bg-brand-primary text-white border-brand-primary' 
                : 'bg-light-100 text-text-secondary border-light-200 hover:text-text-primary'
            }`}
            data-testid="upcoming-toggle"
          >
            {showUpcomingOnly ? <Eye className="w-4 h-4" /> : <EyeSlash className="w-4 h-4" />}
            <span className="hidden sm:inline">{showUpcomingOnly ? 'Upcoming' : 'All'}</span>
          </button>
          
          {/* View Toggle */}
          <div className="flex bg-light-100 rounded-lg p-1 border border-light-200">
            <button
              onClick={() => setViewType('month')}
              className={`p-2 rounded text-sm font-medium transition ${
                viewType === 'month' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
              data-testid="view-month"
              title="Month View"
            >
              <CalendarDots className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`p-2 rounded text-sm font-medium transition ${
                viewType === 'week' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
              data-testid="view-week"
              title="Week View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('day')}
              className={`p-2 rounded text-sm font-medium transition ${
                viewType === 'day' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
              data-testid="view-day"
              title="Day View"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('agenda')}
              className={`p-2 rounded text-sm font-medium transition ${
                viewType === 'agenda' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
              data-testid="view-agenda"
              title="Agenda View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={fetchEvents}
            className="p-2 bg-light-100 border border-light-200 rounded-lg text-text-secondary hover:text-text-primary transition"
            title="Refresh"
            data-testid="calendar-refresh"
          >
            <ArrowsClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      {viewType !== 'agenda' && (
        <div className="flex items-center justify-between bg-surface-base rounded-xl p-4 border border-light-200">
          <button
            onClick={goToPrev}
            className="p-2 hover:bg-light-100 rounded-lg transition text-text-secondary hover:text-text-primary"
            data-testid="calendar-prev"
          >
            <CaretLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-text-primary">
              {viewType === 'month' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {viewType === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              {viewType === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition"
              data-testid="calendar-today"
            >
              Today
            </button>
          </div>
          
          <button
            onClick={goToNext}
            className="p-2 hover:bg-light-100 rounded-lg transition text-text-secondary hover:text-text-primary"
            data-testid="calendar-next"
          >
            <CaretRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Service Legend */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {Object.entries(SERVICE_COLORS).slice(0, 6).map(([key, colors]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
            <span className="text-text-secondary text-xs">{SERVICE_TYPE_LABELS[key as ServiceType]}</span>
          </div>
        ))}
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <SpinnerGap className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : hasNoBookings ? (
        /* Empty State */
        <div className="bg-surface-base rounded-xl border border-light-200 p-6 md:p-12">
          <div className="flex flex-col items-center justify-center py-8 md:py-12 px-6 text-center" data-testid="bookings-empty-state">
            <div className="text-5xl md:text-6xl mb-5 md:mb-6 opacity-40 select-none">&#x1F4C5;</div>
            <h3 className="text-xl md:text-2xl font-semibold text-text-primary mb-2 md:mb-3">No bookings scheduled</h3>
            <p className="text-sm md:text-base text-text-secondary max-w-md mb-5 md:mb-6 leading-relaxed">
              Create your first booking to manage shoot dates, meetings, or deadlines in one place.
            </p>
            <p className="text-xs text-text-tertiary max-w-sm">
              <strong>Pro tip:</strong> Set a lead's status to "Booked" and add an event date — it'll appear here automatically.
            </p>
          </div>
        </div>
      ) : viewType === 'month' ? (
        /* Month View */
        <div className="bg-surface-base rounded-xl border border-light-200 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-light-200">
            {DAYS.map(day => (
              <div key={day} className="px-2 py-3 text-center text-sm font-medium text-text-secondary">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarGrid.map((day, index) => (
              <div
                key={index}
                className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border-b border-r border-light-200 ${
                  !day.isCurrentMonth ? 'bg-light-100/30' : ''
                } ${isToday(day.date) ? 'bg-purple-50' : ''}`}
              >
                <div className={`text-xs sm:text-sm font-medium mb-1 ${
                  isToday(day.date) 
                    ? 'text-purple-600' 
                    : day.isCurrentMonth ? 'text-text-primary' : 'text-gray-600'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-0.5 sm:space-y-1">
                  {day.events.slice(0, 2).map((event) => {
                    const colors = getServiceColor(event.serviceType as ServiceType)
                    return (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs truncate border-l-2 transition hover:opacity-80 ${colors.bg} ${colors.border} ${colors.text}`}
                        title={`${event.clientName} - ${event.title}`}
                        data-testid={`calendar-event-${event.id}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="hidden sm:inline-flex">{getServiceIcon(event.serviceType as ServiceType)}</span>
                          <span className="truncate">{event.clientName}</span>
                        </div>
                      </button>
                    )
                  })}
                  {day.events.length > 2 && (
                    <div className="text-xs text-text-tertiary px-1 sm:px-2">
                      +{day.events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewType === 'week' ? (
        /* Week View */
        <div className="bg-surface-base rounded-xl border border-light-200 overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-light-200">
            {weekDays.map((day, index) => (
              <div key={index} className="min-h-[300px] sm:min-h-[400px]">
                <div className={`p-2 sm:p-3 border-b border-light-200 text-center ${
                  isToday(day.date) ? 'bg-purple-50' : ''
                }`}>
                  <div className="text-xs sm:text-sm text-text-secondary">{DAYS[day.date.getDay()]}</div>
                  <div className={`text-lg sm:text-xl font-semibold ${
                    isToday(day.date) ? 'text-purple-600' : 'text-text-primary'
                  }`}>
                    {day.date.getDate()}
                  </div>
                </div>
                
                <div className="p-1 sm:p-2 space-y-1 sm:space-y-2">
                  {day.events.map((event) => {
                    const colors = getServiceColor(event.serviceType as ServiceType)
                    return (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`w-full text-left p-1.5 sm:p-2 rounded-lg border-l-2 transition hover:opacity-80 ${colors.bg} ${colors.border}`}
                        data-testid={`calendar-event-${event.id}`}
                      >
                        <div className={`flex items-center gap-1 text-xs ${colors.text}`}>
                          {getServiceIcon(event.serviceType as ServiceType)}
                          <span className="uppercase font-medium truncate hidden sm:inline">
                            {SERVICE_TYPE_LABELS[event.serviceType as ServiceType] || 'Other'}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-text-primary mt-1 font-medium truncate">
                          {event.clientName}
                        </div>
                        <div className="text-xs text-text-secondary truncate hidden sm:block">
                          {event.title}
                        </div>
                        {event.value && (
                          <div className="text-xs text-purple-600 mt-1 hidden sm:block">
                            {formatCurrency(event.value, currencySettings)}
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {day.events.length === 0 && (
                    <div className="text-center text-gray-600 text-xs sm:text-sm py-4">
                      No events
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewType === 'day' ? (
        /* Day View */
        <div className="bg-surface-base rounded-xl border border-light-200 p-4 sm:p-6">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon weight="duotone" className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-text-secondary">No events scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayEvents.map((event) => {
                const colors = getServiceColor(event.serviceType as ServiceType)
                return (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={`w-full text-left p-4 rounded-xl border-l-4 transition hover:opacity-90 ${colors.bg} ${colors.border}`}
                    data-testid={`calendar-event-${event.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 mb-2 ${colors.text}`}>
                          {getServiceIcon(event.serviceType as ServiceType)}
                          <span className="text-sm font-medium uppercase">
                            {SERVICE_TYPE_LABELS[event.serviceType as ServiceType] || 'Other'}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-text-primary mb-1">{event.clientName}</h4>
                        <p className="text-text-secondary">{event.title}</p>
                      </div>
                      {event.value && (
                        <div className="text-lg font-bold text-purple-600">
                          {formatCurrency(event.value, currencySettings)}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Agenda View */
        <div className="bg-surface-base rounded-xl border border-light-200 overflow-hidden">
          <div className="p-4 border-b border-light-200">
            <h3 className="text-lg font-semibold text-text-primary">Upcoming Events</h3>
            <p className="text-sm text-text-secondary">Next 30 days</p>
          </div>
          
          {agendaEvents.length === 0 ? (
            <div className="text-center py-12">
              <List weight="duotone" className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-text-secondary">No upcoming events in the next 30 days</p>
            </div>
          ) : (
            <div className="divide-y divide-light-200">
              {agendaEvents.map((event) => {
                const colors = getServiceColor(event.serviceType as ServiceType)
                return (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="w-full text-left p-4 hover:bg-light-100 transition flex items-center gap-4"
                    data-testid={`calendar-event-${event.id}`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.border} border`}>
                      {getServiceIcon(event.serviceType as ServiceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-text-primary">{event.clientName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {SERVICE_TYPE_LABELS[event.serviceType as ServiceType] || 'Other'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary truncate">{event.title}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-text-secondary">{formatEventDate(event.date)}</div>
                      {event.value && (
                        <div className="text-sm font-medium text-purple-600">
                          {formatCurrency(event.value, currencySettings)}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-light-100 rounded-xl p-4 border border-light-200">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDots className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-text-secondary">Total Bookings</span>
          </div>
          <p className="text-2xl font-bold text-text-primary" data-testid="total-bookings">
            {events.length}
          </p>
        </div>
        
        <div className="bg-light-100 rounded-xl p-4 border border-light-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-sm text-text-secondary">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-text-primary" data-testid="upcoming-bookings">
            {upcomingCount}
          </p>
        </div>
        
        <div className="bg-light-100 rounded-xl p-4 border border-light-200 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-text-secondary">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-text-primary" data-testid="total-value">
            {formatCurrency(totalValue, currencySettings)}
          </p>
        </div>
      </div>
    </div>
  )
}
