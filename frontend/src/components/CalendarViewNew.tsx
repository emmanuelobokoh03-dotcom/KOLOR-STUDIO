import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar'
import type { CalendarProps } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  Loader2,
  Camera,
  Video,
  Palette,
  Globe,
  Sparkles,
  FileText,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Filter
} from 'lucide-react'

// Cast to work around React 18 types issue
const Calendar = BigCalendar as React.ComponentType<CalendarProps<CalendarBookingEvent, object>>

import { 
  bookingsApi, 
  CalendarBookingEvent, 
  User, 
  ServiceType, 
  SERVICE_TYPE_LABELS,
  Booking 
} from '../services/api'
import BookingModal from './BookingModal'

// Date-fns localizer for react-big-calendar
const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarViewProps {
  user: User | null;
  onLeadClick?: (leadId: string) => void;
}

// Service type colors
const SERVICE_COLORS: Record<ServiceType, string> = {
  PHOTOGRAPHY: '#8b5cf6',
  VIDEOGRAPHY: '#3b82f6',
  GRAPHIC_DESIGN: '#ec4899',
  WEB_DESIGN: '#06b6d4',
  BRANDING: '#f97316',
  CONTENT_CREATION: '#22c55e',
  CONSULTING: '#eab308',
  OTHER: '#6b7280',
}

const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  PHOTOGRAPHY: <Camera className="w-3 h-3" />,
  VIDEOGRAPHY: <Video className="w-3 h-3" />,
  GRAPHIC_DESIGN: <Palette className="w-3 h-3" />,
  WEB_DESIGN: <Globe className="w-3 h-3" />,
  BRANDING: <Sparkles className="w-3 h-3" />,
  CONTENT_CREATION: <FileText className="w-3 h-3" />,
  CONSULTING: <MessageSquare className="w-3 h-3" />,
  OTHER: <Package className="w-3 h-3" />,
}

export default function CalendarView({ user, onLeadClick }: CalendarViewProps) {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CalendarBookingEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH)
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'all'>('all')
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarBookingEvent | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    
    const start = subMonths(currentDate, 2)
    const end = addMonths(currentDate, 4)
    
    const result = await bookingsApi.getCalendarEvents(
      start.toISOString(),
      end.toISOString()
    )
    
    if (result.data?.events) {
      // Convert date strings to Date objects
      const formattedEvents = result.data.events.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }))
      setEvents(formattedEvents)
    }
    
    setLoading(false)
  }, [currentDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Filter events by service type
  const filteredEvents = useMemo(() => {
    if (serviceFilter === 'all') return events
    return events.filter(e => e.resource.serviceType === serviceFilter)
  }, [events, serviceFilter])

  // Handle slot selection (clicking on empty space)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo.start)
    setSelectedEvent(null)
    setEditingBooking(null)
    setShowBookingModal(true)
  }, [])

  // Handle event selection (clicking on an event)
  const handleSelectEvent = useCallback(async (event: CalendarBookingEvent) => {
    setSelectedEvent(event)
    setSelectedSlot(null)
    
    // Fetch full booking details
    const result = await bookingsApi.getOne(event.resource.bookingId)
    if (result.data?.booking) {
      setEditingBooking(result.data.booking)
      setShowBookingModal(true)
    }
  }, [])

  // Handle booking saved
  const handleBookingSaved = (booking: Booking) => {
    setShowBookingModal(false)
    setSelectedSlot(null)
    setSelectedEvent(null)
    setEditingBooking(null)
    fetchEvents() // Refresh calendar
  }

  // Handle booking deleted
  const handleBookingDeleted = () => {
    setShowBookingModal(false)
    setSelectedSlot(null)
    setSelectedEvent(null)
    setEditingBooking(null)
    fetchEvents()
  }

  // Navigate
  const handleNavigate = (date: Date) => {
    setCurrentDate(date)
  }

  // Custom event styling
  const eventStyleGetter = (event: CalendarBookingEvent) => {
    const color = event.resource.color || SERVICE_COLORS[event.resource.serviceType] || '#6b7280'
    
    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        opacity: event.resource.status === 'COMPLETED' ? 0.6 : 1,
        color: 'white',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px',
      }
    }
  }

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-dark-border">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-lg hover:bg-dark-card transition text-gray-300"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('PREV')}
          className="p-1.5 bg-slate-800 border border-slate-600 rounded-lg hover:bg-dark-card transition text-gray-300"
        >
          ←
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-1.5 bg-slate-800 border border-slate-600 rounded-lg hover:bg-dark-card transition text-gray-300"
        >
          →
        </button>
        <h2 className="text-lg font-semibold text-white ml-2">{label}</h2>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Service Filter */}
        <div className="relative">
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as ServiceType | 'all')}
            className="pl-8 pr-3 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-lg text-gray-300 focus:ring-2 focus:ring-brand-primary"
          >
            <option value="all">All Services</option>
            {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        {/* View buttons */}
        <div className="flex bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
          {['month', 'week', 'day', 'agenda'].map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-3 py-1.5 text-sm capitalize transition ${
                view === v 
                  ? 'bg-brand-primary text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-dark-card'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        
        {/* Refresh */}
        <button
          onClick={() => fetchEvents()}
          disabled={loading}
          className="p-1.5 bg-slate-800 border border-slate-600 rounded-lg hover:bg-dark-card transition text-gray-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        
        {/* Add Booking */}
        <button
          onClick={() => {
            setSelectedSlot(new Date())
            setSelectedEvent(null)
            setEditingBooking(null)
            setShowBookingModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>
    </div>
  )

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarBookingEvent }) => {
    const icon = SERVICE_ICONS[event.resource.serviceType]
    return (
      <div className="flex items-center gap-1 overflow-hidden">
        {icon}
        <span className="truncate">{event.title}</span>
      </div>
    )
  }

  // Stats summary
  const stats = useMemo(() => {
    const now = new Date()
    const upcoming = filteredEvents.filter(e => e.start >= now && e.resource.status === 'CONFIRMED').length
    const completed = filteredEvents.filter(e => e.resource.status === 'COMPLETED').length
    const totalValue = filteredEvents.reduce((sum, e) => sum + (e.resource.value || 0), 0)
    return { total: filteredEvents.length, upcoming, completed, totalValue }
  }, [filteredEvents])

  return (
    <div className="h-full flex flex-col" data-testid="calendar-view">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-brand-primary-light">{stats.upcoming}</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-white">
            {user?.currencySymbol || '$'}{stats.totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-dark-card border border-dark-border rounded-xl p-4 min-h-[600px]">
        {loading && events.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary-light" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', minHeight: 500 }}
            view={view}
            onView={(v) => setView(v)}
            date={currentDate}
            onNavigate={handleNavigate}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
              event: EventComponent,
            }}
            popup
            views={['month', 'week', 'day', 'agenda']}
          />
        )}
      </div>

      {/* Service Legend */}
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs text-gray-500">Legend:</span>
        {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: SERVICE_COLORS[key as ServiceType] }}
            />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          existingBooking={editingBooking}
          selectedDate={selectedSlot}
          onClose={() => {
            setShowBookingModal(false)
            setSelectedSlot(null)
            setSelectedEvent(null)
            setEditingBooking(null)
          }}
          onSaved={handleBookingSaved}
          onDeleted={handleBookingDeleted}
        />
      )}

      {/* Custom CSS for dark theme */}
      <style>{`
        .rbc-calendar {
          background: transparent;
          color: #e5e5e5;
        }
        .rbc-header {
          background: #1a1a1a;
          border-color: #333 !important;
          padding: 8px;
          font-weight: 500;
          color: #a3a3a3;
        }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
          border-color: #333 !important;
        }
        .rbc-day-bg {
          background: #0f0f0f;
        }
        .rbc-off-range-bg {
          background: #0a0a0a;
        }
        .rbc-today {
          background: rgba(139, 92, 246, 0.1) !important;
        }
        .rbc-month-row, .rbc-day-slot {
          border-color: #333 !important;
        }
        .rbc-date-cell {
          padding: 4px 8px;
          color: #e5e5e5;
        }
        .rbc-date-cell.rbc-off-range {
          color: #525252;
        }
        .rbc-date-cell.rbc-now {
          font-weight: bold;
          color: #8b5cf6;
        }
        .rbc-event {
          border: none !important;
        }
        .rbc-event:focus {
          outline: 2px solid #8b5cf6 !important;
        }
        .rbc-show-more {
          background: #1f1f1f;
          color: #8b5cf6;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .rbc-time-header-content {
          border-color: #333 !important;
        }
        .rbc-time-content {
          border-color: #333 !important;
        }
        .rbc-timeslot-group {
          border-color: #333 !important;
        }
        .rbc-time-slot {
          border-color: #262626 !important;
        }
        .rbc-current-time-indicator {
          background-color: #8b5cf6;
        }
        .rbc-agenda-view table.rbc-agenda-table {
          border-color: #333 !important;
        }
        .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
          border-color: #333 !important;
          padding: 8px;
        }
        .rbc-agenda-view table.rbc-agenda-table tbody > tr > td + td {
          border-left-color: #333 !important;
        }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell {
          color: #a3a3a3;
        }
        .rbc-agenda-event-cell {
          color: #e5e5e5;
        }
        .rbc-overlay {
          background: #1f1f1f !important;
          border-color: #333 !important;
          border-radius: 8px;
        }
        .rbc-overlay-header {
          background: #1a1a1a;
          border-color: #333 !important;
          padding: 8px;
        }
      `}</style>
    </div>
  )
}
