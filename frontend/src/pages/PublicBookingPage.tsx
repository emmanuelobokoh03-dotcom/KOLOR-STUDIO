import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Clock, MapPin, CalendarBlank, ArrowLeft, ArrowRight,
  SpinnerGap, Check, User, EnvelopeSimple, Phone, ChatText, CaretLeft, CaretRight
} from '@phosphor-icons/react'
import { publicBookingApi } from '../services/api'

type Step = 'select-type' | 'select-date' | 'select-time' | 'enter-details' | 'confirmed'

interface MeetingTypeOption {
  id: string
  name: string
  description?: string | null
  duration: number
  color: string
  location?: string | null
}

interface UserInfo {
  id: string
  firstName: string
  lastName: string
  studioName?: string | null
  speciality?: string | null
  brandPrimaryColor: string
  brandAccentColor: string
  brandLogoUrl?: string | null
  timezone: string
}

export default function PublicBookingPage() {
  const { userId } = useParams<{ userId: string }>()
  const [step, setStep] = useState<Step>('select-type')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [meetingTypes, setMeetingTypes] = useState<MeetingTypeOption[]>([])
  const [selectedType, setSelectedType] = useState<MeetingTypeOption | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [calendarSynced, setCalendarSynced] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ id: string; startTime: string; endTime: string } | null>(null)

  // UI state
  const [hoveredTime, setHoveredTime] = useState<string | null>(null)
  const [hoveredType, setHoveredType] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // Calendar state
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Form state
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientNotes, setClientNotes] = useState('')

  useEffect(() => {
    if (!userId) return
    fetchPageData()
  }, [userId])

  const fetchPageData = async () => {
    setLoading(true)
    const res = await publicBookingApi.getPageData(userId!)
    if (res.data) {
      setUserInfo(res.data.user)
      setMeetingTypes(res.data.meetingTypes)
    } else {
      setError('Could not load booking page')
    }
    setLoading(false)
  }

  const fetchSlots = async (date: string) => {
    if (!selectedType || !userId) return
    setLoadingSlots(true)
    setSlots([])
    setCalendarSynced(false)
    const res = await publicBookingApi.getSlots(userId, selectedType.id, date)
    if (res.data) {
      setSlots(res.data.slots)
      setCalendarSynced(!!res.data.calendarSynced)
    }
    setLoadingSlots(false)
  }

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    setSelectedTime('')
    fetchSlots(dateStr)
    setStep('select-time')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('enter-details')
  }

  const handleSubmit = async () => {
    if (!userId || !selectedType || !selectedDate || !selectedTime || !clientName || !clientEmail) return
    setSubmitting(true)
    setError('')

    const startTimeISO = `${selectedDate}T${selectedTime}:00Z`
    const res = await publicBookingApi.createBooking(userId, selectedType.id, {
      clientName,
      clientEmail,
      clientPhone: clientPhone || undefined,
      clientNotes: clientNotes || undefined,
      startTime: startTimeISO,
    })

    if (res.data) {
      setBookingResult(res.data.booking)
      setStep('confirmed')
    } else {
      setError(res.error || 'Failed to book meeting')
    }
    setSubmitting(false)
  }

  // Brand tokens
  const primaryColor = userInfo?.brandPrimaryColor || '#A855F7'
  const accentColor = userInfo?.brandAccentColor || '#EC4899'
  const brandLogoUrl = userInfo?.brandLogoUrl || null
  const studioName = userInfo?.studioName || (userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : '')
  const initials = (userInfo?.studioName?.[0] || userInfo?.firstName?.[0] || 'K').toUpperCase()
  const displayTimezone = userInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  // Step index for dot indicator
  const STEPS: Step[] = ['select-type', 'select-date', 'select-time', 'enter-details']
  const currentStepIdx = STEPS.indexOf(step)

  // Input styling helper
  const inputFocusStyle = (field: string): React.CSSProperties => (
    focusedField === field
      ? { outline: 'none', borderColor: primaryColor, boxShadow: `0 0 0 3px ${primaryColor}20` }
      : { outline: 'none' }
  )

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const isDateSelectable = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00Z')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewMonth)
    const firstDay = getFirstDayOfMonth(viewMonth)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const selectable = isDateSelectable(dateStr)
      const isSelected = dateStr === selectedDate
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      const isHovered = hoveredDate === dateStr && selectable && !isSelected

      days.push(
        <button
          key={day}
          onClick={() => selectable && handleDateSelect(dateStr)}
          disabled={!selectable}
          onMouseEnter={() => setHoveredDate(dateStr)}
          onMouseLeave={() => setHoveredDate(null)}
          className="aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center"
          style={{
            backgroundColor: isSelected ? primaryColor : isHovered ? `${primaryColor}10` : undefined,
            color: isSelected ? '#fff' : !selectable ? '#E5E7EB' : '#1A1A2E',
            boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.12)' : undefined,
            cursor: !selectable ? 'not-allowed' : 'pointer',
            border: isToday && !isSelected ? `1px solid ${primaryColor}40` : 'none',
            minWidth: 44, minHeight: 44,
          }}
          data-testid={`date-${dateStr}`}
        >
          {day}
        </button>
      )
    }

    return days
  }

  // Format time helper
  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h % 12 || 12
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`
  }

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpinnerGap className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  // Error (no user)
  if (error && !userInfo) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 32, textAlign: 'center', maxWidth: 400 }}>
          <CalendarBlank className="w-12 h-12 mx-auto mb-4" style={{ color: '#F87171' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Booking Unavailable</h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7FE' }} data-testid="public-booking-page">
      {/* ─── Branded Header ─── */}
      <div style={{ background: '#FFFFFF', borderBottom: '0.5px solid #EDE8F5', padding: '16px 24px' }} data-testid="booking-header">
        <div className="booking-header-inner" style={{ maxWidth: 768, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo / initials */}
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt="" style={{ height: 36, objectFit: 'contain', flexShrink: 0 }} data-testid="booking-brand-logo" />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: primaryColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }} data-testid="booking-brand-initials">
              {initials}
            </div>
          )}
          {/* Studio name + speciality */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }} data-testid="studio-name">{studioName}</h1>
            {userInfo?.speciality && (
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{userInfo.speciality}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 16px' }}>
        {/* ─── Step Dots ─── */}
        {step !== 'confirmed' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '20px 0' }} data-testid="step-dots">
            {STEPS.map((s, i) => {
              const isComplete = i < currentStepIdx
              const isCurrent = i === currentStepIdx
              return (
                <div
                  key={s}
                  style={{
                    width: isCurrent ? 10 : 8,
                    height: isCurrent ? 10 : 8,
                    borderRadius: '50%',
                    background: isComplete || isCurrent ? primaryColor : '#EDE8F5',
                    boxShadow: isCurrent ? `0 0 0 3px ${primaryColor}25` : 'none',
                    transition: 'all 200ms',
                  }}
                />
              )
            })}
          </div>
        )}

        <div style={{ paddingBottom: 32 }}>
          {/* ═══ Step 1: Select Meeting Type ═══ */}
          {step === 'select-type' && (
            <div data-testid="step-select-type">
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>Choose a Meeting Type</h2>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Select the type of meeting you'd like to schedule.</p>

              {meetingTypes.length === 0 ? (
                <div style={{ background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #EDE8F5', padding: 32, textAlign: 'center' }}>
                  <CalendarBlank className="w-10 h-10 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                  <p style={{ color: '#6B7280' }}>No meeting types available at the moment.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {meetingTypes.map(mt => (
                    <button
                      key={mt.id}
                      onClick={() => { setSelectedType(mt); setStep('select-date') }}
                      onMouseEnter={() => setHoveredType(mt.id)}
                      onMouseLeave={() => setHoveredType(null)}
                      style={{
                        background: '#FFFFFF', borderRadius: 12, padding: 20, textAlign: 'left',
                        border: `0.5px solid ${hoveredType === mt.id ? primaryColor : '#EDE8F5'}`,
                        boxShadow: hoveredType === mt.id ? '0 2px 12px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
                        cursor: 'pointer', transition: 'all 200ms', display: 'block', width: '100%',
                        minHeight: 44,
                      }}
                      data-testid={`select-meeting-type-${mt.id}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 6, minHeight: 48, borderRadius: 999, background: mt.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontWeight: 600, color: hoveredType === mt.id ? primaryColor : '#1A1A2E', transition: 'color 200ms', fontSize: 15, margin: 0 }}>{mt.name}</h3>
                          {mt.description && <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{mt.description}</p>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 12, color: '#6B7280' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock className="w-3.5 h-3.5" /> {mt.duration} min
                            </span>
                            {mt.location && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MapPin className="w-3.5 h-3.5" /> {mt.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: hoveredType === mt.id ? primaryColor : '#9CA3AF', transition: 'color 200ms' }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ Step 2: Select Date ═══ */}
          {step === 'select-date' && selectedType && (
            <div data-testid="step-select-date">
              <button
                onClick={() => { setStep('select-type'); setSelectedType(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: primaryColor, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 16, minHeight: 44 }}
                data-testid="back-to-types"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 6, height: 32, borderRadius: 999, background: selectedType.color }} />
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{selectedType.name}</h2>
                  <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>{selectedType.duration} min{selectedType.location ? ` · ${selectedType.location}` : ''}</p>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #EDE8F5', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    style={{ padding: 8, cursor: 'pointer', background: 'none', border: 'none', borderRadius: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    data-testid="prev-month"
                  >
                    <CaretLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
                  </button>
                  <h3 style={{ fontWeight: 600, color: '#1A1A2E', fontSize: 15 }}>
                    {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    style={{ padding: 8, cursor: 'pointer', background: 'none', border: 'none', borderRadius: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    data-testid="next-month"
                  >
                    <CaretRight className="w-4 h-4" style={{ color: '#6B7280' }} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#6B7280', padding: '4px 0' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {renderCalendar()}
                </div>
              </div>

              {/* Timezone indicator */}
              <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }} data-testid="timezone-indicator">
                Times shown in {displayTimezone}
              </p>
            </div>
          )}

          {/* ═══ Step 3: Select Time ═══ */}
          {step === 'select-time' && selectedType && selectedDate && (
            <div data-testid="step-select-time">
              <button
                onClick={() => { setStep('select-date'); setSelectedTime('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: primaryColor, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 16, minHeight: 44 }}
                data-testid="back-to-date"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>Select a Time</h2>
                <p style={{ fontSize: 14, color: '#6B7280' }}>
                  {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {' · '}{selectedType.name} ({selectedType.duration} min)
                </p>
                {calendarSynced && !loadingSlots && (
                  <p style={{ marginTop: 8, fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }} data-testid="calendar-synced-indicator">
                    <Check className="w-3.5 h-3.5" weight="bold" />
                    Showing real-time availability from Google Calendar
                  </p>
                )}
              </div>

              {loadingSlots ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
                  <SpinnerGap className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                </div>
              ) : slots.length === 0 ? (
                <div style={{ background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #EDE8F5', padding: 32, textAlign: 'center' }}>
                  <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                  <p style={{ color: '#6B7280', marginBottom: 16 }}>No available time slots on this day.</p>
                  <button
                    onClick={() => setStep('select-date')}
                    style={{ fontSize: 14, fontWeight: 500, color: primaryColor, background: 'none', border: 'none', cursor: 'pointer', minHeight: 44 }}
                  >
                    Choose another date
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {slots.map(time => {
                    const isSelected = selectedTime === time
                    const isHovered = hoveredTime === time && !isSelected
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        onMouseEnter={() => setHoveredTime(time)}
                        onMouseLeave={() => setHoveredTime(null)}
                        style={{
                          padding: '12px 8px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                          transition: 'all 200ms', minHeight: 44,
                          backgroundColor: isSelected ? primaryColor : isHovered ? `${primaryColor}10` : '#FFFFFF',
                          color: isSelected ? '#fff' : '#1A1A2E',
                          border: `0.5px solid ${isSelected ? 'transparent' : isHovered ? primaryColor : '#EDE8F5'}`,
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                        }}
                        data-testid={`time-slot-${time}`}
                      >
                        {formatTime(time)}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Timezone */}
              <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }} data-testid="timezone-time-indicator">
                Times shown in {displayTimezone}
              </p>
            </div>
          )}

          {/* ═══ Step 4: Enter Details ═══ */}
          {step === 'enter-details' && selectedType && selectedDate && selectedTime && (
            <div data-testid="step-enter-details">
              <button
                onClick={() => setStep('select-time')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: primaryColor, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 16, minHeight: 44 }}
                data-testid="back-to-time"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>Enter Your Details</h2>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
                {selectedType.name} · {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' at '}{formatTime(selectedTime)}
              </p>

              {error && (
                <div style={{ marginBottom: 16, padding: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 14, color: '#DC2626' }} data-testid="booking-error">
                  {error}
                </div>
              )}

              <div style={{ background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #EDE8F5', padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
                      <User className="w-4 h-4" /> Name *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Your full name"
                      className="w-full px-3 py-2.5 border border-light-200 rounded-lg text-text-primary transition"
                      style={{ ...inputFocusStyle('name'), minHeight: 44 }}
                      data-testid="client-name"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
                      <EnvelopeSimple className="w-4 h-4" /> Email *
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 border border-light-200 rounded-lg text-text-primary transition"
                      style={{ ...inputFocusStyle('email'), minHeight: 44 }}
                      data-testid="client-email"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
                      <Phone className="w-4 h-4" /> Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2.5 border border-light-200 rounded-lg text-text-primary transition"
                      style={{ ...inputFocusStyle('phone'), minHeight: 44 }}
                      data-testid="client-phone"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
                      <ChatText className="w-4 h-4" /> Notes (optional)
                    </label>
                    <textarea
                      value={clientNotes}
                      onChange={e => setClientNotes(e.target.value)}
                      onFocus={() => setFocusedField('notes')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Anything you'd like us to know before the meeting"
                      rows={3}
                      className="w-full px-3 py-2.5 border border-light-200 rounded-lg text-text-primary transition"
                      style={{ ...inputFocusStyle('notes'), resize: 'none' }}
                      data-testid="client-notes"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !clientName || !clientEmail}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px 16px', color: '#fff', fontWeight: 600, borderRadius: 10, border: 'none',
                      cursor: (submitting || !clientName || !clientEmail) ? 'not-allowed' : 'pointer',
                      opacity: (submitting || !clientName || !clientEmail) ? 0.5 : 1,
                      background: primaryColor, transition: 'opacity 200ms', minHeight: 48,
                    }}
                    data-testid="confirm-booking"
                  >
                    {submitting ? <SpinnerGap className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Step 5: Confirmed ═══ */}
          {step === 'confirmed' && bookingResult && selectedType && (
            <div style={{ textAlign: 'center', padding: '32px 0' }} data-testid="step-confirmed">
              <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: primaryColor }}>
                <Check className="w-8 h-8" weight="bold" style={{ color: '#fff' }} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Meeting Confirmed!</h2>
              <p style={{ color: '#6B7280', marginBottom: 24, fontSize: 14 }}>A confirmation email has been sent to {clientEmail}</p>

              <div style={{ background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #EDE8F5', padding: 24, maxWidth: 384, margin: '0 auto', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 4, height: 32, borderRadius: 999, background: selectedType.color }} />
                    <div>
                      <p style={{ fontWeight: 600, color: '#1A1A2E', fontSize: 15 }}>{selectedType.name}</p>
                      <p style={{ fontSize: 14, color: '#6B7280' }}>{selectedType.duration} min{selectedType.location ? ` · ${selectedType.location}` : ''}</p>
                    </div>
                  </div>
                  <div style={{ borderTop: '0.5px solid #EDE8F5', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6B7280' }}>
                      <CalendarBlank className="w-4 h-4" />
                      {new Date(bookingResult.startTime).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
                      })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                      <Clock className="w-4 h-4" />
                      {new Date(bookingResult.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      {' — '}
                      {new Date(bookingResult.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>({displayTimezone})</span>
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 24 }}>
                Powered by <Link to="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}>KOLOR Studio</Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 375px) {
          .booking-header-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  )
}
