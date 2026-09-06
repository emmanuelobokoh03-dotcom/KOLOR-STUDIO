import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOpenLead } from '../hooks/useOpenLead'
import KolorLogo from '../components/KolorLogo'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots'
import { List as ListIcon } from '@phosphor-icons/react/dist/csr/List'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { User as UserIcon } from '@phosphor-icons/react/dist/csr/User'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut'
import { Trash } from '@phosphor-icons/react/dist/csr/Trash'
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut'
import { Camera } from '@phosphor-icons/react/dist/csr/Camera'
import { Video } from '@phosphor-icons/react/dist/csr/Video'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { Globe } from '@phosphor-icons/react/dist/csr/Globe'
import { FileText } from '@phosphor-icons/react/dist/csr/FileText'
import { ChatText } from '@phosphor-icons/react/dist/csr/ChatText'
import { Package } from '@phosphor-icons/react/dist/csr/Package'
import { Warning } from '@phosphor-icons/react/dist/csr/Warning'
import { GoogleLogo } from '@phosphor-icons/react/dist/csr/GoogleLogo'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import {
  addMonths, subMonths, addWeeks, subWeeks,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  parseISO, getDay, addDays,
  startOfDay, endOfDay,
} from 'date-fns'
import { authApi, calendarApi, CalendarDerivedEvent, User as UserType } from '../services/api'
import { getIndustryLanguage } from '../utils/industryLanguage'
import KolorSpinner from '../components/KolorSpinner'
import { toast } from 'sonner'
import { useConfirm } from '../components/ConfirmProvider'

type CalendarView = 'month' | 'week' | 'agenda'

// Event type labels and icons
const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  key_date: { label: 'Key Date', icon: <Camera className="w-3.5 h-3.5" /> },
  event_date: { label: 'Event', icon: <CalendarBlank className="w-3.5 h-3.5" /> },
  shooting: { label: 'Shoot', icon: <Camera className="w-3.5 h-3.5" /> },
  delivery: { label: 'Delivery', icon: <Package className="w-3.5 h-3.5" /> },
  editing_deadline: { label: 'Editing', icon: <FileText className="w-3.5 h-3.5" /> },
  booking: { label: 'Booking', icon: <CalendarDots className="w-3.5 h-3.5" /> },
  quote_expiry: { label: 'Quote Expiry', icon: <Warning className="w-3.5 h-3.5" /> },
  contract: { label: 'Contract', icon: <FileText className="w-3.5 h-3.5" /> },
  manual: { label: 'Event', icon: <CalendarBlank className="w-3.5 h-3.5" /> },
  google: { label: 'Google', icon: <GoogleLogo className="w-3.5 h-3.5" /> },
}

export default function Calendar() {
  const navigate = useNavigate()
  const openLead = useOpenLead()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [events, setEvents] = useState<CalendarDerivedEvent[]>([])
  const [googleEvents, setGoogleEvents] = useState<CalendarDerivedEvent[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarDerivedEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showMobileDaySheet, setShowMobileDaySheet] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createDate, setCreateDate] = useState<string>('')
  const [showGoogle, setShowGoogle] = useState(true)

  const lang = useMemo(() => getIndustryLanguage(user?.industry), [user?.industry])
  const { confirm } = useConfirm()

  // Mobile detection for responsive layout
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auth check
  useEffect(() => {
    const init = async () => {
      const result = await authApi.getMe()
      if (result.error) {
        navigate('/login')
        return
      }
      if (result.data?.user) setUser(result.data.user)
      setLoading(false)
    }
    init()
  }, [navigate])

  // Fetch events when date changes
  const fetchEvents = useCallback(async () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const startStr = start.toISOString()
    const endStr = end.toISOString()

    const [kolorResult, googleResult] = await Promise.all([
      calendarApi.getEvents(startStr, endStr),
      calendarApi.getGoogleEvents(startStr, endStr),
    ])

    if (kolorResult.data?.events) setEvents(kolorResult.data.events)
    if (googleResult.data) {
      setGoogleConnected(googleResult.data.connected)
      setGoogleEvents(googleResult.data.events || [])
    }
  }, [currentDate])

  useEffect(() => {
    if (!loading) fetchEvents()
  }, [loading, fetchEvents])

  // Combined events
  const allEvents = useMemo(() => {
    const combined = [...events]
    if (showGoogle) combined.push(...googleEvents)
    return combined
  }, [events, googleEvents, showGoogle])

  // Navigate
  const goNext = () => setCurrentDate(view === 'week' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))
  const goPrev = () => setCurrentDate(view === 'week' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))
  const goToday = () => setCurrentDate(new Date())

  // Month view helpers
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Week view helpers
  const weekStart = startOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Get events for a specific day
  const getEventsForDay = useCallback((day: Date) => {
    return allEvents.filter(evt => {
      const evtDate = parseISO(evt.date)
      return isSameDay(evtDate, day)
    })
  }, [allEvents])

  // List view: events sorted by date for current month
  const listEvents = useMemo(() => {
    return allEvents
      .filter(evt => {
        const evtDate = parseISO(evt.date)
        return evtDate >= monthStart && evtDate <= monthEnd
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [allEvents, monthStart, monthEnd])

  // Header title
  const headerTitle = view === 'week'
    ? `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
    : format(currentDate, 'MMMM yyyy')

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    // Iter 144 — If the clicked day has no events, clear any selected event so
    // the EventSidePanel collapses instead of showing stale data from a prior day.
    const dayEvents = getEventsForDay(day)
    if (dayEvents.length === 0) {
      setSelectedEvent(null)
    }
    // On mobile, show the day's events in a slide-in panel
    if (isMobile) {
      setShowMobileDaySheet(true)
    }
  }

  const openCreateForSelectedDay = () => {
    setCreateDate(format(selectedDate || new Date(), 'yyyy-MM-dd'))
    setShowCreateModal(true)
  }

  const handleEventCreated = () => {
    setShowCreateModal(false)
    fetchEvents()
  }

  const handleDeleteEvent = async (eventId: string) => {
    const yes = await confirm({ title: 'Delete event?', message: 'This event will be permanently removed.', confirmLabel: 'Delete', variant: 'danger' })
    if (!yes) return
    // Extract the real ID (strip "manual-" prefix)
    const realId = eventId.replace('manual-', '')
    const result = await calendarApi.deleteEvent(realId)
    if (result.data?.success) {
      toast.success('Event deleted')
      setSelectedEvent(null)
      fetchEvents()
    } else {
      toast.error('Failed to delete event')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--kolor-canvas,#F7F4EE)] flex items-center justify-center">
        <KolorSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[color:var(--kolor-canvas,#F7F4EE)]" data-testid="calendar-page">
      {/* Top bar */}
      <header className="glass-header sticky top-0 z-40 border-b border-[color:var(--kolor-hairline,#E5E0D8)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
              data-testid="calendar-back-to-dashboard"
              aria-label="Back to dashboard"
            >
              <KolorLogo variant="dark" size="sm" linkTo={null} />
            </button>
            <span className="text-[color:var(--kolor-ink-whisper,#B8AFA6)] hidden md:inline">|</span>
            <h1 className="text-sm md:text-base font-semibold text-[color:var(--kolor-ink,#1A1613)] hidden md:block">Calendar</h1>
          </div>
          <div className="flex items-center gap-2">

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
        {/* Calendar toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={goPrev} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)] rounded-lg transition" data-testid="calendar-prev">
              <CaretLeft className="w-5 h-5 text-[color:var(--kolor-ink-muted,#5F5751)]" />
            </button>
            <h2 className="text-base md:text-xl font-semibold text-[color:var(--kolor-ink,#1A1613)] min-w-[120px] md:min-w-[180px] text-center italic" style={{ fontFamily: 'Fraunces, Georgia, serif' }} data-testid="calendar-title">
              {headerTitle}
            </h2>
            <button onClick={goNext} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)] rounded-lg transition" data-testid="calendar-next">
              <CaretRight className="w-5 h-5 text-[color:var(--kolor-ink-muted,#5F5751)]" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-2 md:py-1.5 min-h-[44px] md:min-h-0 text-xs font-medium text-[color:var(--kolor-terra,#B84A2C)] border border-[color:var(--kolor-terra,#B84A2C)]/40 rounded-lg hover:bg-[color:var(--kolor-terra,#B84A2C)]/10 transition flex items-center justify-center"
              data-testid="calendar-today"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Calendar toggle */}
            {googleConnected && (
              <button
                onClick={() => setShowGoogle(!showGoogle)}
                className={`flex items-center gap-1.5 px-3 py-2 md:py-1.5 min-h-[44px] md:min-h-0 text-xs font-medium rounded-lg border transition ${
                  showGoogle ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-[color:var(--kolor-hairline,#E5E0D8)] text-[color:var(--kolor-ink-subtle,#928B84)]'
                }`}
                data-testid="calendar-toggle-google"
              >
                <GoogleLogo className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Google</span>
              </button>
            )}

            {/* View toggles */}
            <div className="flex bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-lg border border-[color:var(--kolor-hairline,#E5E0D8)] p-0.5">
              {([
                { mode: 'month' as CalendarView, icon: CalendarBlank, label: 'Month' },
                { mode: 'week' as CalendarView, icon: CalendarDots, label: 'Week' },
                { mode: 'agenda' as CalendarView, icon: ListIcon, label: 'Agenda' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 min-h-[44px] md:min-h-0 min-w-[44px] rounded-md text-xs font-medium transition ${
                    view === mode ? 'bg-[color:var(--kolor-terra,#B84A2C)]/10 text-[color:var(--kolor-terra,#B84A2C)] shadow-sm' : 'text-[color:var(--kolor-ink-muted,#5F5751)] hover:text-[color:var(--kolor-ink,#1A1613)]'
                  }`}
                  data-testid={`calendar-view-${mode}`}
                >
                  <Icon className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setCreateDate(format(new Date(), 'yyyy-MM-dd')); setShowCreateModal(true) }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 min-h-[44px] md:min-h-0 bg-[color:var(--kolor-terra,#B84A2C)] text-white text-xs font-semibold rounded-lg hover:brightness-110 transition"
              data-testid="calendar-add-event"
            >
              <Plus weight="bold" className="w-4 h-4 md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">Event</span>
            </button>
          </div>
        </div>

        <div className="flex gap-4 md:gap-6">
          {/* Calendar grid */}
          <div className="flex-1 min-w-0">
            {view === 'month' && (
              <MonthView
                days={calendarDays}
                currentDate={currentDate}
                getEventsForDay={getEventsForDay}
                onDayClick={handleDayClick}
                onEventClick={setSelectedEvent}
              />
            )}
            {view === 'week' && (
              <WeekView
                days={weekDays}
                getEventsForDay={getEventsForDay}
                onDayClick={handleDayClick}
                onEventClick={setSelectedEvent}
                isMobile={isMobile}
              />
            )}
            {view === 'agenda' && (
              <ListView
                events={listEvents}
                onEventClick={setSelectedEvent}
                emptyLabel={lang.emptyCalendar}
              />
            )}
          </div>

          {/* Side panel - always visible on desktop. Day sidebar always renders; EventSidePanel appears below when an event is selected. */}
          <div className="hidden lg:block w-[320px] flex-shrink-0 space-y-3">
            <DaySidebar
              selectedDate={selectedDate}
              events={getEventsForDay(selectedDate)}
              onEventClick={setSelectedEvent}
              onAddEvent={openCreateForSelectedDay}
            />
            {selectedEvent && (
              <EventSidePanel
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onDelete={handleDeleteEvent}
                onNavigateToLead={(leadId) => openLead(leadId)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile event detail overlay (click on an event) */}
      {selectedEvent && (
        <div className="lg:hidden fixed inset-0 z-50" data-testid="calendar-event-mobile-panel">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[color:var(--kolor-canvas,#F7F4EE)] border-l border-[color:var(--kolor-hairline,#E5E0D8)] overflow-y-auto animate-slide-left">
            <EventSidePanel
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onDelete={handleDeleteEvent}
              onNavigateToLead={(leadId) => openLead(leadId)}
            />
          </div>
        </div>
      )}

      {/* Mobile day bottom sheet (click on a day) — shows day's events list */}
      {showMobileDaySheet && !selectedEvent && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end" data-testid="calendar-day-mobile-panel">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileDaySheet(false)} />
          <div className="relative bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-t-2xl border-t border-[color:var(--kolor-hairline,#E5E0D8)] max-h-[75dvh] overflow-y-auto animate-slide-up">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[color:var(--kolor-ink-whisper,#B8AFA6)] rounded-full" />
            </div>
            <DaySidebar
              selectedDate={selectedDate}
              events={getEventsForDay(selectedDate)}
              onEventClick={(evt) => { setSelectedEvent(evt); setShowMobileDaySheet(false) }}
              onAddEvent={() => { setShowMobileDaySheet(false); openCreateForSelectedDay() }}
              onClose={() => setShowMobileDaySheet(false)}
            />
          </div>
        </div>
      )}

      {/* Create event modal */}
      {showCreateModal && (
        <CreateEventModal
          initialDate={createDate}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleEventCreated}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// MONTH VIEW
// ═══════════════════════════════════════
function MonthView({
  days, currentDate, getEventsForDay, onDayClick, onEventClick,
}: {
  days: Date[]
  currentDate: Date
  getEventsForDay: (day: Date) => CalendarDerivedEvent[]
  onDayClick: (day: Date) => void
  onEventClick: (event: CalendarDerivedEvent) => void
}) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-xl border border-[color:var(--kolor-hairline,#E5E0D8)] overflow-hidden" data-testid="calendar-month-view">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[color:var(--kolor-hairline,#E5E0D8)]">
        {dayNames.map(d => (
          <div key={d} className="py-2 text-center text-[10px] md:text-xs font-semibold text-[color:var(--kolor-ink-subtle,#928B84)] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const today = isToday(day)

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`min-h-[88px] md:min-h-[110px] border-b border-r border-[color:var(--kolor-hairline,#E5E0D8)] p-1 md:p-1.5 cursor-pointer transition-colors hover:bg-[color:var(--kolor-terra,#B84A2C)]/5 ${
                !isCurrentMonth ? 'bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)]/50' : ''
              }`}
              data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
            >
              <div className={`text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${
                today ? 'bg-[color:var(--kolor-terra,#B84A2C)] text-white' : isCurrentMonth ? 'text-[color:var(--kolor-ink,#1A1613)]' : 'text-[color:var(--kolor-ink-subtle,#928B84)]'
              }`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(evt => (
                  <button
                    key={evt.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(evt) }}
                    className="w-full text-left px-1.5 py-1 md:py-0.5 rounded text-[10px] md:text-xs font-medium truncate transition-opacity hover:opacity-80"
                    style={{ backgroundColor: `${evt.color}18`, color: evt.color, borderLeft: `2px solid ${evt.color}` }}
                    data-testid={`calendar-event-${evt.id}`}
                  >
                    {evt.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDayClick(day); }}
                    className="text-[10px] text-[color:var(--kolor-terra,#B84A2C)] font-semibold pl-1 hover:underline transition min-h-[20px] text-left bg-transparent border-0 cursor-pointer"
                    data-testid={`calendar-show-more-${format(day, 'yyyy-MM-dd')}`}
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// WEEK VIEW
// ═══════════════════════════════════════
function WeekView({
  days, getEventsForDay, onDayClick, onEventClick, isMobile,
}: {
  days: Date[]
  getEventsForDay: (day: Date) => CalendarDerivedEvent[]
  onDayClick: (day: Date) => void
  onEventClick: (event: CalendarDerivedEvent) => void
  isMobile: boolean
}) {
  const [mobileStart, setMobileStart] = useState(0)
  const visibleDays = isMobile ? days.slice(mobileStart, mobileStart + 3) : days

  return (
    <div className="bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-xl border border-[color:var(--kolor-hairline,#E5E0D8)] overflow-hidden" data-testid="calendar-week-view">
      {/* Mobile 3-day navigation */}
      {isMobile && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[color:var(--kolor-hairline,#E5E0D8)] bg-[color:var(--kolor-canvas,#F7F4EE)]">
          <button
            onClick={() => setMobileStart(Math.max(0, mobileStart - 1))}
            disabled={mobileStart === 0}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)] transition disabled:opacity-30"
            data-testid="week-mobile-prev"
          >
            <CaretLeft className="w-4 h-4 text-[color:var(--kolor-ink-muted,#5F5751)]" />
          </button>
          <span className="text-xs font-medium text-[color:var(--kolor-ink-muted,#5F5751)]">
            {format(visibleDays[0], 'EEE d')} — {format(visibleDays[visibleDays.length - 1], 'EEE d')}
          </span>
          <button
            onClick={() => setMobileStart(Math.min(4, mobileStart + 1))}
            disabled={mobileStart >= 4}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)] transition disabled:opacity-30"
            data-testid="week-mobile-next"
          >
            <CaretRight className="w-4 h-4 text-[color:var(--kolor-ink-muted,#5F5751)]" />
          </button>
        </div>
      )}
      <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-7'}`}>
        {visibleDays.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          const today = isToday(day)

          return (
            <div
              key={i}
              className={`border-r border-[color:var(--kolor-hairline,#E5E0D8)] last:border-r-0 ${today ? 'bg-[color:var(--kolor-terra,#B84A2C)]/5' : ''}`}
            >
              {/* Day header */}
              <div
                onClick={() => onDayClick(day)}
                className="p-2 md:p-3 border-b border-[color:var(--kolor-hairline,#E5E0D8)] text-center cursor-pointer hover:bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)] transition min-h-[44px]"
              >
                <div className="text-xs text-[color:var(--kolor-ink-subtle,#928B84)] font-medium uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-base md:text-lg font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                  today ? 'bg-[color:var(--kolor-terra,#B84A2C)] text-white' : 'text-[color:var(--kolor-ink,#1A1613)]'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
              {/* Events */}
              <div className="p-1.5 space-y-1 min-h-[200px] md:min-h-[400px]">
                {dayEvents.map(evt => (
                  <button
                    key={evt.id}
                    onClick={() => onEventClick(evt)}
                    className="w-full text-left p-2 rounded-lg text-xs font-medium transition-all hover:shadow-sm min-h-[44px]"
                    style={{ backgroundColor: `${evt.color}15`, borderLeft: `3px solid ${evt.color}` }}
                    data-testid={`calendar-week-event-${evt.id}`}
                  >
                    <div className="truncate" style={{ color: evt.color }}>{evt.title}</div>
                    {evt.startTime && (
                      <div className="text-[color:var(--kolor-ink-subtle,#928B84)] mt-0.5 text-[10px]">
                        {format(parseISO(evt.startTime), 'h:mm a')}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════
function ListView({
  events, onEventClick, emptyLabel,
}: {
  events: CalendarDerivedEvent[]
  onEventClick: (event: CalendarDerivedEvent) => void
  emptyLabel: string
}) {
  if (events.length === 0) {
    return (
      <div className="bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-xl border border-[color:var(--kolor-hairline,#E5E0D8)] p-8 md:p-12 text-center" data-testid="calendar-agenda-empty">
        <CalendarBlank className="w-10 h-10 text-[color:var(--kolor-ink-subtle,#928B84)] mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-[color:var(--kolor-ink,#1A1613)] mb-1">{emptyLabel}</h3>
        <p className="text-xs text-[color:var(--kolor-ink-muted,#5F5751)]">No events scheduled for this month.</p>
      </div>
    )
  }

  // Group events by date
  const grouped: Record<string, CalendarDerivedEvent[]> = {}
  events.forEach(evt => {
    const dateKey = format(parseISO(evt.date), 'yyyy-MM-dd')
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(evt)
  })

  return (
    <div className="space-y-3" data-testid="calendar-agenda-view">
      {Object.entries(grouped).map(([dateKey, dayEvents]) => (
        <div key={dateKey} className="bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-xl border border-[color:var(--kolor-hairline,#E5E0D8)] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[color:var(--kolor-hairline,#E5E0D8)] flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isToday(parseISO(dateKey)) ? 'bg-[color:var(--kolor-terra,#B84A2C)]' : 'bg-[color:var(--kolor-ink-whisper,#B8AFA6)]'}`} />
            <span className="text-xs font-semibold text-[color:var(--kolor-ink,#1A1613)]">
              {format(parseISO(dateKey), 'EEEE, MMMM d')}
            </span>
            {isToday(parseISO(dateKey)) && (
              <span className="text-[10px] px-2 py-0.5 bg-[color:var(--kolor-terra,#B84A2C)]/10 text-[color:var(--kolor-terra,#B84A2C)] rounded-full font-medium">Today</span>
            )}
          </div>
          <div className="divide-y divide-[color:var(--kolor-hairline,#E5E0D8)]">
            {dayEvents.map(evt => {
              const config = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.manual
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick(evt)}
                  className="w-full text-left px-4 py-3 hover:bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)] transition flex items-center gap-3"
                  data-testid={`calendar-agenda-event-${evt.id}`}
                >
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${evt.color}15`, color: evt.color }}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[color:var(--kolor-ink,#1A1613)] truncate">{evt.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${evt.color}12`, color: evt.color }}>
                        {config.label}
                      </span>
                      {evt.startTime && (
                        <span className="text-[10px] text-[color:var(--kolor-ink-subtle,#928B84)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(evt.startTime), 'h:mm a')}
                          {evt.endTime && ` - ${format(parseISO(evt.endTime), 'h:mm a')}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {evt.clientName && (
                    <span className="text-[10px] text-[color:var(--kolor-ink-subtle,#928B84)] flex items-center gap-1 flex-shrink-0">
                      <UserIcon className="w-3 h-3" /> {evt.clientName}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════
// DAY SIDEBAR — always-visible day summary
// ═══════════════════════════════════════
function DaySidebar({
  selectedDate,
  events,
  onEventClick,
  onAddEvent,
  onClose,
}: {
  selectedDate: Date
  events: CalendarDerivedEvent[]
  onEventClick: (event: CalendarDerivedEvent) => void
  onAddEvent: () => void
  onClose?: () => void
}) {
  const date = selectedDate
  const isDateToday = isToday(date)

  return (
    <div className="bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-xl border border-[color:var(--kolor-hairline,#E5E0D8)] overflow-hidden lg:sticky lg:top-[72px]" data-testid="day-sidebar">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[color:var(--kolor-hairline,#E5E0D8)] flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--kolor-ink-subtle,#928B84)] mb-0.5">
            {isDateToday ? 'Today' : format(date, 'EEEE')}
          </p>
          <h3 className="text-lg font-bold text-[color:var(--kolor-ink,#1A1613)]">
            {format(date, 'MMMM d, yyyy')}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-[color:var(--kolor-ink-subtle,#928B84)] hover:text-[color:var(--kolor-ink,#1A1613)] hover:bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)] rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close day panel"
            data-testid="day-sidebar-close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Events list or empty state */}
      <div className="p-3">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <CalendarBlank className="w-8 h-8 text-[color:var(--kolor-ink-subtle,#928B84)] mx-auto mb-2" />
            <p className="text-xs text-[color:var(--kolor-ink-muted,#5F5751)] mb-3">No events on this day</p>
            <button
              onClick={onAddEvent}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[color:var(--kolor-terra,#B84A2C)] border border-[color:var(--kolor-terra,#B84A2C)] rounded-lg hover:bg-[color:var(--kolor-terra,#B84A2C)]/10 transition mx-auto min-h-[44px]"
              data-testid="day-sidebar-add-empty"
            >
              <Plus weight="bold" className="w-3.5 h-3.5" /> Add event
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map(evt => {
              const config = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.manual
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick(evt)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-[color:var(--kolor-hairline,#E5E0D8)] hover:border-[color:var(--kolor-terra,#B84A2C)] hover:bg-[color:var(--kolor-terra,#B84A2C)]/5 transition"
                  data-testid={`day-sidebar-event-${evt.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[color:var(--kolor-terra,#B84A2C)]">{config.icon}</span>
                    <span className="text-[10px] font-semibold text-[color:var(--kolor-ink-subtle,#928B84)] uppercase tracking-wider">{config.label}</span>
                    {evt.startTime && (
                      <span className="text-[10px] text-[color:var(--kolor-ink-subtle,#928B84)] ml-auto">
                        {format(parseISO(evt.startTime), 'h:mm a')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[color:var(--kolor-ink,#1A1613)] truncate">{evt.title}</p>
                  {evt.clientName && (
                    <p className="text-[10px] text-[color:var(--kolor-ink-muted,#5F5751)] mt-0.5 truncate">{evt.clientName}</p>
                  )}
                </button>
              )
            })}
            <button
              onClick={onAddEvent}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[color:var(--kolor-ink-muted,#5F5751)] border border-dashed border-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg hover:border-[color:var(--kolor-terra,#B84A2C)] hover:text-[color:var(--kolor-terra,#B84A2C)] transition mt-1 min-h-[44px]"
              data-testid="day-sidebar-add"
            >
              <Plus weight="bold" className="w-3 h-3" /> Add event
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// EVENT SIDE PANEL
// ═══════════════════════════════════════
function EventSidePanel({
  event, onClose, onDelete, onNavigateToLead,
}: {
  event: CalendarDerivedEvent
  onClose: () => void
  onDelete: (id: string) => void
  onNavigateToLead: (leadId: string) => void
}) {
  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.manual
  const isManual = event.type === 'manual'
  const isGoogle = event.type === 'google'

  return (
    <div className="bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-xl border border-[color:var(--kolor-hairline,#E5E0D8)] overflow-hidden" data-testid="calendar-event-panel">
      {/* Header */}
      <div className="p-4 border-b border-[color:var(--kolor-hairline,#E5E0D8)]" style={{ backgroundColor: `${event.color}08` }}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${event.color}18`, color: event.color }}>
              {config.icon}
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${event.color}15`, color: event.color }}>
              {config.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg transition"
            data-testid="calendar-panel-close"
          >
            <X className="w-4 h-4 text-[color:var(--kolor-ink-subtle,#928B84)]" />
          </button>
        </div>
        <h3 className="text-base font-bold text-[color:var(--kolor-ink,#1A1613)] leading-tight" data-testid="calendar-panel-title">
          {event.title}
        </h3>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Date & time */}
        <div className="flex items-center gap-2.5 text-sm text-[color:var(--kolor-ink-muted,#5F5751)]">
          <CalendarBlank className="w-4 h-4 text-[color:var(--kolor-ink-subtle,#928B84)] flex-shrink-0" />
          <span>{format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}</span>
        </div>
        {event.startTime && (
          <div className="flex items-center gap-2.5 text-sm text-[color:var(--kolor-ink-muted,#5F5751)]">
            <Clock className="w-4 h-4 text-[color:var(--kolor-ink-subtle,#928B84)] flex-shrink-0" />
            <span>
              {format(parseISO(event.startTime), 'h:mm a')}
              {event.endTime && ` - ${format(parseISO(event.endTime), 'h:mm a')}`}
            </span>
          </div>
        )}

        {/* Client */}
        {event.clientName && (
          <div className="flex items-center gap-2.5 text-sm text-[color:var(--kolor-ink-muted,#5F5751)]">
            <UserIcon className="w-4 h-4 text-[color:var(--kolor-ink-subtle,#928B84)] flex-shrink-0" />
            <span>{event.clientName}</span>
          </div>
        )}

        {/* Location (Google events) */}
        {event.location && (
          <div className="flex items-center gap-2.5 text-sm text-[color:var(--kolor-ink-muted,#5F5751)]">
            <MapPin className="w-4 h-4 text-[color:var(--kolor-ink-subtle,#928B84)] flex-shrink-0" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="pt-2 border-t border-[color:var(--kolor-hairline,#E5E0D8)]">
            <p className="text-xs text-[color:var(--kolor-ink-subtle,#928B84)] font-medium mb-1">Notes</p>
            <p className="text-sm text-[color:var(--kolor-ink-muted,#5F5751)] whitespace-pre-wrap">{event.notes}</p>
          </div>
        )}

        {/* Description (Google) */}
        {event.description && (
          <div className="pt-2 border-t border-[color:var(--kolor-hairline,#E5E0D8)]">
            <p className="text-xs text-[color:var(--kolor-ink-subtle,#928B84)] font-medium mb-1">Description</p>
            <p className="text-sm text-[color:var(--kolor-ink-muted,#5F5751)] whitespace-pre-wrap line-clamp-4">{event.description}</p>
          </div>
        )}

        {/* Meta info */}
        {event.meta && (
          <div className="pt-2 border-t border-[color:var(--kolor-hairline,#E5E0D8)] space-y-1.5">
            {event.meta.status && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[color:var(--kolor-ink-subtle,#928B84)]">Status</span>
                <span className="text-xs font-medium text-[color:var(--kolor-ink,#1A1613)]">{event.meta.status}</span>
              </div>
            )}
            {event.meta.value && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[color:var(--kolor-ink-subtle,#928B84)]">Value</span>
                <span className="text-xs font-medium text-[color:var(--kolor-ink,#1A1613)]">${event.meta.value.toLocaleString()}</span>
              </div>
            )}
            {event.meta.quoteNumber && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[color:var(--kolor-ink-subtle,#928B84)]">Quote</span>
                <span className="text-xs font-medium text-[color:var(--kolor-ink,#1A1613)]">#{event.meta.quoteNumber}</span>
              </div>
            )}
            {event.meta.total && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[color:var(--kolor-ink-subtle,#928B84)]">Amount</span>
                <span className="text-xs font-medium text-[color:var(--kolor-ink,#1A1613)]">${event.meta.total.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 space-y-2">
          {event.leadId && (
            <button
              onClick={() => onNavigateToLead(event.leadId!)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[color:var(--kolor-terra,#B84A2C)] border border-[color:var(--kolor-terra,#B84A2C)]/40 rounded-lg hover:bg-[color:var(--kolor-terra,#B84A2C)]/10 transition"
              data-testid="calendar-panel-view-lead"
            >
              <ArrowSquareOut className="w-3.5 h-3.5" /> View Lead
            </button>
          )}
          {isGoogle && event.meta?.htmlLink && (
            <a
              href={event.meta.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
              data-testid="calendar-panel-open-google"
            >
              <GoogleLogo className="w-3.5 h-3.5" /> Open in Google Calendar
            </a>
          )}
          {isManual && (
            <button
              onClick={() => onDelete(event.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
              data-testid="calendar-panel-delete"
            >
              <Trash className="w-3.5 h-3.5" /> Delete Event
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// CREATE EVENT MODAL
// ═══════════════════════════════════════
function CreateEventModal({
  initialDate, onClose, onCreated,
}: {
  initialDate: string
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate)
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return

    setSaving(true)
    const data: any = {
      title: title.trim(),
      date: new Date(date + 'T00:00:00').toISOString(),
      allDay,
      notes: notes.trim() || undefined,
    }
    if (!allDay) {
      data.startTime = new Date(`${date}T${startTime}:00`).toISOString()
      data.endTime = new Date(`${date}T${endTime}:00`).toISOString()
      data.allDay = false
    }

    const result = await calendarApi.createEvent(data)
    setSaving(false)

    if (result.data?.event) {
      toast.success(result.data.googleSynced ? 'Event created & synced to Google Calendar' : 'Event created')
      onCreated()
    } else {
      toast.error('Failed to create event')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="calendar-create-modal">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[color:var(--kolor-canvas,#F7F4EE)] rounded-2xl border border-[color:var(--kolor-hairline,#E5E0D8)] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-[color:var(--kolor-hairline,#E5E0D8)] flex items-center justify-between">
          <h2 className="text-base font-bold text-[color:var(--kolor-ink,#1A1613)]">New Event</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg transition" data-testid="calendar-modal-close">
            <X className="w-4 h-4 text-[color:var(--kolor-ink-subtle,#928B84)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[color:var(--kolor-ink-muted,#5F5751)] mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Client shoot, Gallery opening..."
              className="w-full px-3 py-2.5 bg-[color:var(--kolor-canvas,#F7F4EE)] border border-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg text-sm text-[color:var(--kolor-ink,#1A1613)] placeholder:text-[color:var(--kolor-ink-subtle,#928B84)] focus:border-[color:var(--kolor-terra,#B84A2C)] focus:ring-1 focus:ring-[color:var(--kolor-terra,#B84A2C)] outline-none transition"
              required
              autoFocus
              data-testid="calendar-event-title-input"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[color:var(--kolor-ink-muted,#5F5751)] mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[color:var(--kolor-canvas,#F7F4EE)] border border-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg text-sm text-[color:var(--kolor-ink,#1A1613)] focus:border-[color:var(--kolor-terra,#B84A2C)] focus:ring-1 focus:ring-[color:var(--kolor-terra,#B84A2C)] outline-none transition"
              required
              data-testid="calendar-event-date-input"
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={e => setAllDay(e.target.checked)}
                className="sr-only peer"
                data-testid="calendar-event-allday-toggle"
              />
              <div className="w-9 h-5 bg-[color:var(--kolor-ink-whisper,#B8AFA6)] rounded-full peer peer-checked:bg-[color:var(--kolor-terra,#B84A2C)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
            <span className="text-xs font-medium text-[color:var(--kolor-ink-muted,#5F5751)]">All day</span>
          </div>

          {/* Time fields */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[color:var(--kolor-ink-muted,#5F5751)] mb-1.5">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[color:var(--kolor-canvas,#F7F4EE)] border border-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg text-sm text-[color:var(--kolor-ink,#1A1613)] focus:border-[color:var(--kolor-terra,#B84A2C)] outline-none transition"
                  data-testid="calendar-event-start-time"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[color:var(--kolor-ink-muted,#5F5751)] mb-1.5">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[color:var(--kolor-canvas,#F7F4EE)] border border-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg text-sm text-[color:var(--kolor-ink,#1A1613)] focus:border-[color:var(--kolor-terra,#B84A2C)] outline-none transition"
                  data-testid="calendar-event-end-time"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[color:var(--kolor-ink-muted,#5F5751)] mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any details..."
              className="w-full px-3 py-2.5 bg-[color:var(--kolor-canvas,#F7F4EE)] border border-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg text-sm text-[color:var(--kolor-ink,#1A1613)] placeholder:text-[color:var(--kolor-ink-subtle,#928B84)] focus:border-[color:var(--kolor-terra,#B84A2C)] outline-none transition resize-none"
              data-testid="calendar-event-notes-input"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-[color:var(--kolor-ink-muted,#5F5751)] border border-[color:var(--kolor-hairline,#E5E0D8)] rounded-lg hover:bg-[color:var(--kolor-canvas-shade-1,#F1EDE5)] transition"
              data-testid="calendar-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[color:var(--kolor-terra,#B84A2C)] rounded-lg hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="calendar-modal-save"
            >
              {saving ? <KolorSpinner size={16} /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
