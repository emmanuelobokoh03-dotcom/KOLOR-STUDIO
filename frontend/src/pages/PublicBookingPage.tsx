import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import KolorSpinner from '../components/KolorSpinner'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { publicBookingApi } from '../services/api'
import { FrameworkNotice } from '../kolor-design/components/FrameworkNotice'

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

  // Input styling helper (Framework Move 2 — bottom-border-only, Terra on focus)
  const inputFocusStyle = (field: string): React.CSSProperties => (
    focusedField === field
      ? { outline: 'none', borderBottomColor: 'var(--kolor-terra, #B84A2C)' }
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
          className="aspect-square transition-colors flex items-center justify-center"
          style={{
            backgroundColor: 'transparent',
            color: isSelected
              ? 'var(--kolor-terra, #B84A2C)'
              : !selectable
              ? 'var(--kolor-hairline, #E5E0D8)'
              : isHovered
              ? 'var(--kolor-ink, #1A1613)'
              : 'var(--kolor-ink, #1A1613)',
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.04em',
            boxShadow: 'none',
            cursor: !selectable ? 'not-allowed' : 'pointer',
            border: isSelected
              ? '1px solid var(--kolor-terra, #B84A2C)'
              : isToday
              ? '1px solid var(--kolor-ink-muted, #5F5751)'
              : isHovered
              ? '1px solid var(--kolor-hairline, #E5E0D8)'
              : '1px solid transparent',
            borderRadius: 2,
            minWidth: 44,
            minHeight: 44,
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
      <div style={{ minHeight: '100vh', background: 'var(--kolor-canvas, #F7F4EE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <KolorSpinner size={32} />
      </div>
    )
  }

  // Error (no user)
  if (error && !userInfo) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--kolor-canvas, #F7F4EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: 'transparent', border: '1px solid var(--kolor-hairline, #E5E0D8)', borderRadius: 2, padding: 40, textAlign: 'center', maxWidth: 480 }}>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--kolor-ink, #1A1613)', marginBottom: 16 }}>Booking unavailable.</h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--kolor-ink-muted, #5F5751)', fontSize: 15, lineHeight: 1.7 }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kolor-canvas, #F7F4EE)' }} data-testid="public-booking-page">
      {/* ─── Branded Header ─── */}
      <div style={{ background: 'var(--kolor-canvas, #F7F4EE)', borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)', padding: '24px 24px' }} data-testid="booking-header">
        <div className="booking-header-inner" style={{ maxWidth: 768, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo / initials */}
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt="" style={{ height: 36, objectFit: 'contain', flexShrink: 0 }} data-testid="booking-brand-logo" />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--kolor-ink, #1A1613)', color: 'var(--kolor-canvas, #F7F4EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', flexShrink: 0 }} data-testid="booking-brand-initials">
              {initials}
            </div>
          )}
          {/* Studio name + speciality */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.01em', color: 'var(--kolor-ink, #1A1613)', margin: 0 }} data-testid="studio-name">{studioName}</h1>
            {userInfo?.speciality && (
              <p style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', margin: '4px 0 0 0' }}>{userInfo.speciality}</p>
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
                    background: isComplete || isCurrent ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-hairline, #E5E0D8)',
                    boxShadow: 'none',
                    transition: 'background-color 200ms',
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
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: 'clamp(32px, 5vw, 44px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--kolor-ink, #1A1613)', marginBottom: 12 }}>Choose a meeting type.</h2>
              <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: 'var(--kolor-ink-muted, #5F5751)', lineHeight: 1.7, marginBottom: 40 }}>Select the type of meeting you would like to schedule.</p>

              {meetingTypes.length === 0 ? (
                <div style={{ background: 'transparent', borderRadius: 2, border: '1px solid var(--kolor-hairline, #E5E0D8)', padding: 40, textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--kolor-ink-muted, #5F5751)', fontSize: 15, lineHeight: 1.7 }}>No meeting types available at the moment.</p>
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
                        background: 'transparent',
                        borderRadius: 2,
                        padding: 24,
                        textAlign: 'left' as const,
                        border: `1px solid ${hoveredType === mt.id ? 'var(--kolor-ink, #1A1613)' : 'var(--kolor-hairline, #E5E0D8)'}`,
                        cursor: 'pointer',
                        transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'block',
                        width: '100%',
                        minHeight: 44,
                      }}
                      data-testid={`select-meeting-type-${mt.id}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 6, minHeight: 48, borderRadius: 999, background: mt.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 400, color: 'var(--kolor-ink, #1A1613)', fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>{mt.name}</h3>
                          {mt.description && <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: 'var(--kolor-ink-muted, #5F5751)', marginTop: 8, lineHeight: 1.6 }}>{mt.description}</p>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16, fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)' }}>
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
                        <ArrowRight className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: hoveredType === mt.id ? 'var(--kolor-ink, #1A1613)' : 'var(--kolor-ink-subtle, #928B84)', transition: 'color 200ms' }} />
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
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 32, minHeight: 44 }}
                data-testid="back-to-types"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 6, height: 32, borderRadius: 999, background: selectedType.color }} />
                <div>
                  <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: 28, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--kolor-ink, #1A1613)', margin: 0 }}>{selectedType.name}</h2>
                  <p style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', margin: '6px 0 0 0' }}>{selectedType.duration} min{selectedType.location ? ` · ${selectedType.location}` : ''}</p>
                </div>
              </div>

              <div style={{ background: 'transparent', borderRadius: 2, border: '1px solid var(--kolor-hairline, #E5E0D8)', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    style={{ padding: 10, cursor: 'pointer', background: 'transparent', border: '1px solid var(--kolor-hairline, #E5E0D8)', borderRadius: 2, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 200ms' }}
                    data-testid="prev-month"
                  >
                    <CaretLeft className="w-4 h-4" style={{ color: 'var(--kolor-ink-muted, #5F5751)' }} />
                  </button>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: 24, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--kolor-ink, #1A1613)' }}>
                    {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    style={{ padding: 10, cursor: 'pointer', background: 'transparent', border: '1px solid var(--kolor-hairline, #E5E0D8)', borderRadius: 2, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 200ms' }}
                    data-testid="next-month"
                  >
                    <CaretRight className="w-4 h-4" style={{ color: 'var(--kolor-ink-muted, #5F5751)' }} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', padding: '8px 0' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {renderCalendar()}
                </div>
              </div>

              {/* Timezone indicator */}
              <p style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', textAlign: 'center' as const, marginTop: 20 }} data-testid="timezone-indicator">
                Times shown in {displayTimezone}
              </p>
            </div>
          )}

          {/* ═══ Step 3: Select Time ═══ */}
          {step === 'select-time' && selectedType && selectedDate && (
            <div data-testid="step-select-time">
              <button
                onClick={() => { setStep('select-date'); setSelectedTime('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-muted, #5F5751)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 24, minHeight: 44 }}
                data-testid="back-to-date"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--kolor-ink, #1A1613)', margin: 0, marginBottom: 8 }}>Select a time</h2>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, lineHeight: 1.7, color: 'var(--kolor-ink-muted, #5F5751)' }}>
                  {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {' · '}{selectedType.name} ({selectedType.duration} min)
                </p>
                {calendarSynced && !loadingSlots && (
                  <p style={{ marginTop: 16, fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-slate, #3B4A3F)', display: 'flex', alignItems: 'center', gap: 8 }} data-testid="calendar-synced-indicator">
                    <Check className="w-3.5 h-3.5" weight="bold" />
                    Showing real-time availability from Google Calendar
                  </p>
                )}
              </div>

              {loadingSlots ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
                  <KolorSpinner size={24} />
                </div>
              ) : slots.length === 0 ? (
                <div style={{ background: 'transparent', borderRadius: 2, border: '1px solid var(--kolor-hairline, #E5E0D8)', padding: 32, textAlign: 'center' }}>
                  <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--kolor-ink-subtle, #928B84)' }} />
                  <p style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', marginBottom: 24 }}>No available time slots on this day</p>
                  <button
                    onClick={() => setStep('select-date')}
                    style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: 'var(--kolor-terra, #B84A2C)', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, padding: '4px 0' }}
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
                          padding: '14px 8px',
                          borderRadius: 2,
                          minHeight: 44,
                          cursor: 'pointer',
                          transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                          background: 'transparent',
                          color: isSelected ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-ink, #1A1613)',
                          border: `1px solid ${isSelected ? 'var(--kolor-terra, #B84A2C)' : isHovered ? 'var(--kolor-ink, #1A1613)' : 'var(--kolor-hairline, #E5E0D8)'}`,
                          boxShadow: 'none',
                          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase' as const,
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
              <p style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', textAlign: 'center', marginTop: 16 }} data-testid="timezone-time-indicator">
                Times shown in {displayTimezone}
              </p>
            </div>
          )}

          {/* ═══ Step 4: Enter Details ═══ */}
          {step === 'enter-details' && selectedType && selectedDate && selectedTime && (
            <div data-testid="step-enter-details">
              <button
                onClick={() => setStep('select-time')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-muted, #5F5751)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 24, minHeight: 44 }}
                data-testid="back-to-time"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--kolor-ink, #1A1613)', margin: 0, marginBottom: 8 }}>Your details</h2>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
                {selectedType.name} · {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' at '}{formatTime(selectedTime)}
              </p>

              {error && (
                <div style={{ marginBottom: 16, padding: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 14, color: '#DC2626' }} data-testid="booking-error">
                  {error}
                </div>
              )}

              <div style={{ background: 'transparent', border: 'none', padding: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', marginBottom: 10 }}>
                      Name (required)
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Your full name"
                      className="w-full transition-colors"
                      style={{ width: '100%', padding: '14px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: 'var(--kolor-ink, #1A1613)', outline: 'none', transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1)', minHeight: 48, ...inputFocusStyle('name') }}
                      data-testid="client-name"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', marginBottom: 10 }}>
                      Email (required)
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your@email.com"
                      className="w-full transition-colors"
                      style={{ width: '100%', padding: '14px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: 'var(--kolor-ink, #1A1613)', outline: 'none', transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1)', minHeight: 48, ...inputFocusStyle('email') }}
                      data-testid="client-email"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', marginBottom: 10 }}>
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full transition-colors"
                      style={{ width: '100%', padding: '14px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: 'var(--kolor-ink, #1A1613)', outline: 'none', transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1)', minHeight: 48, ...inputFocusStyle('phone') }}
                      data-testid="client-phone"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', marginBottom: 10 }}>
                      Notes (optional)
                    </label>
                    <textarea
                      value={clientNotes}
                      onChange={e => setClientNotes(e.target.value)}
                      onFocus={() => setFocusedField('notes')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Anything you'd like us to know before the meeting"
                      rows={3}
                      className="w-full transition-colors"
                      style={{ width: '100%', padding: '14px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: 'var(--kolor-ink, #1A1613)', outline: 'none', transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1)', resize: 'none', ...inputFocusStyle('notes') }}
                      data-testid="client-notes"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !clientName || !clientEmail}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      padding: '18px 32px',
                      background: 'transparent',
                      color: 'var(--kolor-terra, #B84A2C)',
                      border: '1px solid var(--kolor-terra, #B84A2C)',
                      borderRadius: 2,
                      fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '0.28em',
                      textTransform: 'uppercase' as const,
                      cursor: (submitting || !clientName || !clientEmail) ? 'not-allowed' : 'pointer',
                      opacity: (submitting || !clientName || !clientEmail) ? 0.4 : 1,
                      transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), color 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms',
                      minHeight: 56,
                    }}
                    data-testid="confirm-booking"
                  >
                    {submitting ? <KolorSpinner size={16} /> : <Check className="w-4 h-4" />}
                    Confirm booking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Step 5: Confirmed ═══ */}
          {step === 'confirmed' && bookingResult && selectedType && (
            <div style={{ textAlign: 'center', padding: '48px 0' }} data-testid="step-confirmed">
              <FrameworkNotice
                title="Meeting confirmed."
                metadata={`A confirmation has been sent to ${clientEmail}`}
                icon={<Check className="w-6 h-6" weight="fill" style={{ color: 'var(--kolor-slate, #3B4A3F)' }} />}
                data-testid="booking-success-notice"
              />

              <div style={{ background: 'transparent', borderRadius: 2, border: '1px solid var(--kolor-hairline, #E5E0D8)', padding: 32, maxWidth: 480, margin: '32px auto 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic', color: 'var(--kolor-ink, #1A1613)', fontSize: 22, letterSpacing: '-0.01em', margin: 0 }}>{selectedType.name}</p>
                      <p style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', margin: '6px 0 0 0' }}>{selectedType.duration} min{selectedType.location ? ` · ${selectedType.location}` : ''}</p>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--kolor-hairline, #E5E0D8)', paddingTop: 20, marginTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: 'var(--kolor-ink-muted, #5F5751)' }}>
                      <CalendarBlank className="w-4 h-4" />
                      {new Date(bookingResult.startTime).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
                      })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: 'var(--kolor-ink-muted, #5F5751)', marginTop: 8 }}>
                      <Clock className="w-4 h-4" />
                      {new Date(bookingResult.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      {' · '}
                      {new Date(bookingResult.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      <span style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)' }}>({displayTimezone})</span>
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'var(--kolor-ink-subtle, #928B84)', marginTop: 32 }}>
                Powered by <Link to="/" style={{ color: 'var(--kolor-ink-subtle, #928B84)', textDecoration: 'none' }}>KOLOR Studio</Link>
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
