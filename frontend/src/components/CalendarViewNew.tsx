import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar'
import type { CalendarProps } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  SpinnerGap,
  Camera,
  Video,
  Palette,
  Globe,
  Sparkle,
  FileText,
  ChatText,
  Package,
  Plus,
  ArrowsClockwise,
  Funnel
} from '@phosphor-icons/react'

// Cast to work around React 18 types issue
const CalendarComponent = BigCalendar as React.ComponentType<CalendarProps<CalendarBookingEvent, object>>

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
  FINE_ART: '#e11d48',
  ILLUSTRATION: '#d97706',
}

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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-light-200">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 text-sm bg-surface-base border border-light-200 rounded-lg hover:bg-light-100 transition text-text-secondary"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('PREV')}
          className="p-1.5 bg-surface-base border border-light-200 rounded-lg hover:bg-light-100 transition text-text-secondary"
        >
          ←
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-1.5 bg-surface-base border border-light-200 rounded-lg hover:bg-light-100 transition text-text-secondary"
        >
          →
        </button>
        <h2 className="text-lg font-semibold text-text-primary ml-2">{label}</h2>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Service Filter */}
        <div className="relative">
          <Funnel className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as ServiceType | 'all')}
            className="pl-8 pr-3 py-1.5 text-sm bg-surface-base border border-light-200 rounded-lg text-text-secondary focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Services</option>
            {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        {/* View buttons */}
        <div className="flex bg-surface-base border border-light-200 rounded-lg overflow-hidden">
          {['month', 'week', 'day', 'agenda'].map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-3 py-1.5 text-sm capitalize transition ${
                view === v 
                  ? 'bg-brand-primary text-white' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-base'
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
          className="p-1.5 bg-surface-base border border-light-200 rounded-lg hover:bg-light-100 transition text-text-secondary disabled:opacity-50"
        >
          <ArrowsClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
          <Plus weight="bold" className="w-4 h-4" />
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
        <div className="bg-surface-base border border-light-200 rounded-xl p-4">
          <p className="text-xs text-text-tertiary mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
        </div>
        <div className="bg-surface-base border border-light-200 rounded-xl p-4">
          <p className="text-xs text-text-tertiary mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-purple-600">{stats.upcoming}</p>
        </div>
        <div className="bg-surface-base border border-light-200 rounded-xl p-4">
          <p className="text-xs text-text-tertiary mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-surface-base border border-light-200 rounded-xl p-4">
          <p className="text-xs text-text-tertiary mb-1">Total Value</p>
          <p className="text-2xl font-bold text-text-primary">
            {user?.currencySymbol || '$'}{stats.totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-surface-base border border-light-200 rounded-xl p-2 md:p-4 min-h-[600px] overflow-x-auto">
        <div className="min-w-[600px] h-full">
        {loading && events.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <SpinnerGap className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <CalendarComponent
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
      </div>

      {/* Service Legend */}
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs text-text-tertiary">Legend:</span>
        {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: SERVICE_COLORS[key as ServiceType] }}
            />
            <span className="text-xs text-text-secondary">{label}</span>
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
