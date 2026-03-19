import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ id: string; startTime: string; endTime: string } | null>(null)

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
    const res = await publicBookingApi.getSlots(userId, selectedType.id, date)
    if (res.data) {
      setSlots(res.data.slots)
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

  const primaryColor = userInfo?.brandPrimaryColor || '#A855F7'
  const studioName = userInfo?.studioName || (userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : '')

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

    // Empty cells for days before start
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const selectable = isDateSelectable(dateStr)
      const isSelected = dateStr === selectedDate
      const isToday = dateStr === new Date().toISOString().split('T')[0]

      days.push(
        <button
          key={day}
          onClick={() => selectable && handleDateSelect(dateStr)}
          disabled={!selectable}
          className={`aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
            ${isSelected ? 'text-white shadow-md' : ''}
            ${!isSelected && selectable ? 'hover:bg-purple-50 text-text-primary' : ''}
            ${!selectable ? 'text-light-200 cursor-not-allowed' : 'cursor-pointer'}
            ${isToday && !isSelected ? 'ring-1 ring-purple-300' : ''}
          `}
          style={isSelected ? { backgroundColor: primaryColor } : undefined}
          data-testid={`date-${dateStr}`}
        >
          {day}
        </button>
      )
    }

    return days
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error && !userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <CalendarBlank className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">Booking Unavailable</h1>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50" data-testid="public-booking-page">
      {/* Header */}
      <div className="border-b border-light-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          {userInfo?.brandLogoUrl && (
            <img src={userInfo.brandLogoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="text-lg font-bold text-text-primary" data-testid="studio-name">{studioName}</h1>
            <p className="text-xs text-text-secondary">Schedule a meeting</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicator */}
        {step !== 'confirmed' && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto" data-testid="step-indicator">
            {[
              { key: 'select-type', label: 'Meeting Type' },
              { key: 'select-date', label: 'Date' },
              { key: 'select-time', label: 'Time' },
              { key: 'enter-details', label: 'Details' },
            ].map((s, i) => {
              const steps: Step[] = ['select-type', 'select-date', 'select-time', 'enter-details']
              const currentIdx = steps.indexOf(step)
              const stepIdx = i
              const isActive = stepIdx === currentIdx
              const isComplete = stepIdx < currentIdx

              return (
                <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
                  {i > 0 && <div className={`w-8 h-0.5 ${isComplete || isActive ? 'bg-purple-400' : 'bg-light-200'}`} />}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    isActive ? 'bg-purple-100 text-purple-700' : isComplete ? 'bg-purple-600 text-white' : 'bg-light-100 text-text-secondary'
                  }`}>
                    {isComplete ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Step 1: Select Meeting Type */}
        {step === 'select-type' && (
          <div data-testid="step-select-type">
            <h2 className="text-xl font-bold text-text-primary mb-1">Choose a Meeting Type</h2>
            <p className="text-sm text-text-secondary mb-6">Select the type of meeting you'd like to schedule.</p>

            {meetingTypes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <CalendarBlank className="w-10 h-10 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No meeting types available at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {meetingTypes.map(mt => (
                  <button
                    key={mt.id}
                    onClick={() => { setSelectedType(mt); setStep('select-date') }}
                    className="bg-white rounded-xl shadow-sm border border-light-200 p-5 text-left hover:shadow-md hover:border-purple-200 transition-all group"
                    data-testid={`select-meeting-type-${mt.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-1.5 h-full min-h-[48px] rounded-full flex-shrink-0" style={{ backgroundColor: mt.color }} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary group-hover:text-purple-700 transition">{mt.name}</h3>
                        {mt.description && <p className="text-sm text-text-secondary mt-1">{mt.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {mt.duration} min
                          </span>
                          {mt.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {mt.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-secondary group-hover:text-purple-600 transition flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date */}
        {step === 'select-date' && selectedType && (
          <div data-testid="step-select-date">
            <button
              onClick={() => { setStep('select-type'); setSelectedType(null) }}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mb-4"
              data-testid="back-to-types"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: selectedType.color }} />
              <div>
                <h2 className="text-xl font-bold text-text-primary">{selectedType.name}</h2>
                <p className="text-sm text-text-secondary">{selectedType.duration} min{selectedType.location ? ` · ${selectedType.location}` : ''}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-light-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                  className="p-2 hover:bg-light-100 rounded-lg transition"
                  data-testid="prev-month"
                >
                  <CaretLeft className="w-4 h-4" />
                </button>
                <h3 className="font-semibold text-text-primary">
                  {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                  className="p-2 hover:bg-light-100 rounded-lg transition"
                  data-testid="next-month"
                >
                  <CaretRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-text-secondary py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Time */}
        {step === 'select-time' && selectedType && selectedDate && (
          <div data-testid="step-select-time">
            <button
              onClick={() => { setStep('select-date'); setSelectedTime('') }}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mb-4"
              data-testid="back-to-date"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-text-primary mb-1">Select a Time</h2>
              <p className="text-sm text-text-secondary">
                {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {' · '}{selectedType.name} ({selectedType.duration} min)
              </p>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <SpinnerGap className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : slots.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Clock className="w-10 h-10 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No available time slots on this day.</p>
                <button
                  onClick={() => setStep('select-date')}
                  className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Choose another date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map(time => {
                  const [h, m] = time.split(':').map(Number)
                  const ampm = h >= 12 ? 'PM' : 'AM'
                  const displayH = h % 12 || 12
                  const displayTime = `${displayH}:${String(m).padStart(2, '0')} ${ampm}`

                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`py-3 px-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedTime === time
                          ? 'text-white border-transparent shadow-md'
                          : 'bg-white border-light-200 text-text-primary hover:border-purple-300 hover:bg-purple-50'
                      }`}
                      style={selectedTime === time ? { backgroundColor: primaryColor } : undefined}
                      data-testid={`time-slot-${time}`}
                    >
                      {displayTime}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Enter Details */}
        {step === 'enter-details' && selectedType && selectedDate && selectedTime && (
          <div data-testid="step-enter-details">
            <button
              onClick={() => setStep('select-time')}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mb-4"
              data-testid="back-to-time"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-xl font-bold text-text-primary mb-1">Enter Your Details</h2>
            <p className="text-sm text-text-secondary mb-6">
              {selectedType.name} · {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' at '}{(() => { const [h, m] = selectedTime.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` })()}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="booking-error">
                {error}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-light-200 p-5 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1.5">
                  <User className="w-4 h-4" /> Name *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2.5 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-testid="client-name"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1.5">
                  <EnvelopeSimple className="w-4 h-4" /> Email *
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2.5 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-testid="client-email"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1.5">
                  <Phone className="w-4 h-4" /> Phone (optional)
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2.5 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-testid="client-phone"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1.5">
                  <ChatText className="w-4 h-4" /> Notes (optional)
                </label>
                <textarea
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  placeholder="Anything you'd like us to know before the meeting"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  data-testid="client-notes"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !clientName || !clientEmail}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: primaryColor }}
                data-testid="confirm-booking"
              >
                {submitting ? <SpinnerGap className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmed */}
        {step === 'confirmed' && bookingResult && selectedType && (
          <div className="text-center py-8" data-testid="step-confirmed">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primaryColor }}>
              <Check className="w-8 h-8 text-white" weight="bold" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Meeting Confirmed!</h2>
            <p className="text-text-secondary mb-6">A confirmation email has been sent to {clientEmail}</p>

            <div className="bg-white rounded-xl shadow-sm border border-light-200 p-6 max-w-sm mx-auto text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: selectedType.color }} />
                  <div>
                    <p className="font-semibold text-text-primary">{selectedType.name}</p>
                    <p className="text-sm text-text-secondary">{selectedType.duration} min{selectedType.location ? ` · ${selectedType.location}` : ''}</p>
                  </div>
                </div>
                <div className="border-t border-light-200 pt-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <CalendarBlank className="w-4 h-4" />
                    {new Date(bookingResult.startTime).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(bookingResult.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                    {' — '}
                    {new Date(bookingResult.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary mt-6">
              Powered by {studioName}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
