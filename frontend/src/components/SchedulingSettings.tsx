import { useState, useEffect } from 'react'
import {
  Clock, Plus, Trash, FloppyDisk, SpinnerGap, Copy, Check,
  CalendarBlank, MapPin, Timer, CaretDown, CaretUp, ToggleLeft, ToggleRight,
  GoogleLogo, Link as LinkIcon, LinkBreak
} from '@phosphor-icons/react'
import { meetingTypesApi, availabilityApi, MeetingType, AvailabilitySlot } from '../services/api'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORTS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]
const COLOR_OPTIONS = ['#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6']
const DEFAULT_HOURS = { startTime: '09:00', endTime: '17:00' }

interface EditingMeetingType {
  id?: string
  name: string
  description: string
  duration: number
  color: string
  location: string
  bufferBefore: number
  bufferAfter: number
  maxPerDay: number | null
}

export default function SchedulingSettings() {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [editingType, setEditingType] = useState<EditingMeetingType | null>(null)
  const [savingType, setSavingType] = useState(false)
  const [copied, setCopied] = useState(false)
  const [userId, setUserId] = useState('')
  const [expandedSection, setExpandedSection] = useState<'types' | 'hours' | 'link'>('types')
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [typesRes, availRes] = await Promise.all([
      meetingTypesApi.getAll(),
      availabilityApi.get(),
    ])
    if (typesRes.data) setMeetingTypes(typesRes.data.meetingTypes)
    if (availRes.data) setAvailability(availRes.data.availability)

    // Get user ID from /api/auth/me
    try {
      const meResp = await fetch('/api/auth/me', { credentials: 'include' })
      if (meResp.ok) {
        const meData = await meResp.json()
        setUserId(meData.user?.id || '')
      }
    } catch { /* ignore */ }

    // Check Google Calendar status
    try {
      const resp = await fetch('/api/google-calendar/status', { credentials: 'include' })
      if (resp.ok) {
        const data = await resp.json()
        setCalendarConnected(data.connected)
      }
    } catch { /* ignore */ }
    setLoading(false)

    // Check URL for calendar connection result
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar') === 'connected') {
      setCalendarConnected(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  // Availability helpers
  const getAvailabilityForDay = (day: number) => availability.filter(s => s.dayOfWeek === day)
  const isDayActive = (day: number) => getAvailabilityForDay(day).length > 0

  const toggleDay = (day: number) => {
    if (isDayActive(day)) {
      setAvailability(prev => prev.filter(s => s.dayOfWeek !== day))
    } else {
      setAvailability(prev => [...prev, {
        id: `new-${day}`,
        dayOfWeek: day,
        startTime: DEFAULT_HOURS.startTime,
        endTime: DEFAULT_HOURS.endTime,
        isActive: true,
      }])
    }
  }

  const updateSlotTime = (day: number, index: number, field: 'startTime' | 'endTime', value: string) => {
    const daySlots = getAvailabilityForDay(day)
    const slot = daySlots[index]
    if (!slot) return
    setAvailability(prev => prev.map(s => s === slot ? { ...s, [field]: value } : s))
  }

  const saveAvailability = async () => {
    setSavingAvailability(true)
    const slots = availability.map(s => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: s.isActive,
    }))
    const res = await availabilityApi.save(slots)
    if (res.data) setAvailability(res.data.availability)
    setSavingAvailability(false)
  }

  // Meeting type helpers
  const openNewType = () => {
    setEditingType({
      name: '', description: '', duration: 30, color: '#A855F7',
      location: '', bufferBefore: 0, bufferAfter: 15, maxPerDay: null,
    })
    setShowMeetingForm(true)
  }

  const openEditType = (mt: MeetingType) => {
    setEditingType({
      id: mt.id, name: mt.name, description: mt.description || '',
      duration: mt.duration, color: mt.color, location: mt.location || '',
      bufferBefore: mt.bufferBefore, bufferAfter: mt.bufferAfter, maxPerDay: mt.maxPerDay ?? null,
    })
    setShowMeetingForm(true)
  }

  const saveMeetingType = async () => {
    if (!editingType || !editingType.name) return
    setSavingType(true)
    const payload = {
      name: editingType.name,
      description: editingType.description || undefined,
      duration: editingType.duration,
      color: editingType.color,
      location: editingType.location || undefined,
      bufferBefore: editingType.bufferBefore,
      bufferAfter: editingType.bufferAfter,
      maxPerDay: editingType.maxPerDay,
    }
    if (editingType.id) {
      await meetingTypesApi.update(editingType.id, payload as any)
    } else {
      await meetingTypesApi.create(payload)
    }
    setShowMeetingForm(false)
    setEditingType(null)
    setSavingType(false)
    fetchData()
  }

  const deleteMeetingType = async (id: string) => {
    await meetingTypesApi.delete(id)
    fetchData()
  }

  const toggleMeetingTypeActive = async (mt: MeetingType) => {
    await meetingTypesApi.update(mt.id, { isActive: !mt.isActive } as any)
    fetchData()
  }

  const copyBookingLink = () => {
    const url = `${window.location.origin}/book/${userId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const connectGoogleCalendar = async () => {
    setCalendarLoading(true)
    try {
      const configResp = await fetch('/api/google-calendar/config-check', { credentials: 'include' })
      if (configResp.ok) {
        const config = await configResp.json()
        if (!config.configured) {
          alert('Google Calendar is not configured on the server. Please contact support.')
          setCalendarLoading(false)
          return
        }
      }

      const resp = await fetch('/api/google-calendar/auth-url', { credentials: 'include' })
      if (resp.ok) {
        const data = await resp.json()
        if (data.authUrl) {
          window.location.href = data.authUrl
        } else {
          alert('Failed to get authorization URL.')
        }
      } else {
        alert(`Failed to connect calendar (${resp.status}).`)
      }
    } catch (err: any) {
      console.error('[CALENDAR] Connect error:', err)
      alert(`Calendar connection error: ${err.message || 'Unknown error'}`)
    }
    setCalendarLoading(false)
  }

  const disconnectGoogleCalendar = async () => {
    setCalendarLoading(true)
    try {
      const resp = await fetch('/api/google-calendar/disconnect', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (resp.ok) setCalendarConnected(false)
    } catch { /* ignore */ }
    setCalendarLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerGap className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="scheduling-settings">
      {/* Booking Link */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedSection('link')}>
          <div className="flex items-center gap-2">
            <CalendarBlank weight="duotone" className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-text-primary">Your Booking Link</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 bg-surface-base border border-purple-200 rounded-lg px-3 py-2 text-sm text-text-secondary truncate" data-testid="booking-link">
            {window.location.origin}/book/{userId}
          </code>
          <button
            onClick={copyBookingLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
            data-testid="copy-booking-link"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Google Calendar Connection */}
      <div className={`border rounded-xl p-4 ${calendarConnected ? 'border-emerald-200 bg-emerald-50/50' : 'border-light-200 bg-surface-base'}`} data-testid="google-calendar-section">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${calendarConnected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
              <GoogleLogo weight="bold" className={`w-5 h-5 ${calendarConnected ? 'text-emerald-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Google Calendar</p>
              <p className="text-xs text-text-secondary">
                {calendarConnected
                  ? 'Connected — bookings sync automatically'
                  : 'Sync availability & auto-create events'}
              </p>
            </div>
          </div>
          {calendarConnected ? (
            <button
              onClick={disconnectGoogleCalendar}
              disabled={calendarLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
              data-testid="disconnect-google-calendar"
            >
              {calendarLoading ? <SpinnerGap className="w-3.5 h-3.5 animate-spin" /> : <LinkBreak className="w-3.5 h-3.5" />}
              Disconnect
            </button>
          ) : (
            <button
              onClick={connectGoogleCalendar}
              disabled={calendarLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              data-testid="connect-google-calendar"
            >
              {calendarLoading ? <SpinnerGap className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
              Connect
            </button>
          )}
        </div>
        {calendarConnected && (
          <div className="mt-3 flex items-center gap-4 text-xs text-emerald-700">
            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Availability sync</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Auto-create events</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Conflict detection</span>
          </div>
        )}
        {!calendarConnected && (
          <p className="mt-2 text-[11px] text-text-tertiary">
            Tip: You can also connect from the main Dashboard for quick access.
          </p>
        )}
      </div>

      {/* Meeting Types Section */}
      <div className="border border-light-200 rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-light-50 transition"
          onClick={() => setExpandedSection(expandedSection === 'types' ? 'hours' : 'types')}
          data-testid="meeting-types-section"
        >
          <div className="flex items-center gap-2">
            <Timer weight="duotone" className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-text-primary">Meeting Types</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{meetingTypes.length}</span>
          </div>
          {expandedSection === 'types' ? <CaretUp className="w-4 h-4 text-text-secondary" /> : <CaretDown className="w-4 h-4 text-text-secondary" />}
        </button>

        {expandedSection === 'types' && (
          <div className="border-t border-light-200 p-4 space-y-3">
            {meetingTypes.map(mt => (
              <div key={mt.id} className="flex items-center gap-3 p-3 bg-light-50 rounded-lg group" data-testid={`meeting-type-${mt.id}`}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: mt.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${mt.isActive ? 'text-text-primary' : 'text-text-secondary line-through'}`}>{mt.name}</span>
                    <span className="text-xs text-text-secondary">{mt.duration}min</span>
                    {mt.location && (
                      <span className="text-xs text-text-secondary flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {mt.location}
                      </span>
                    )}
                  </div>
                  {mt.description && <p className="text-xs text-text-secondary mt-0.5 truncate">{mt.description}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => toggleMeetingTypeActive(mt)}
                    className="p-1.5 rounded-md hover:bg-light-200 transition"
                    title={mt.isActive ? 'Deactivate' : 'Activate'}
                    data-testid={`toggle-meeting-type-${mt.id}`}
                  >
                    {mt.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-600" />
                      : <ToggleLeft className="w-5 h-5 text-text-secondary" />}
                  </button>
                  <button
                    onClick={() => openEditType(mt)}
                    className="p-1.5 text-text-secondary hover:text-purple-600 rounded-md hover:bg-light-200 transition"
                    title="Edit"
                    data-testid={`edit-meeting-type-${mt.id}`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMeetingType(mt.id)}
                    className="p-1.5 text-text-secondary hover:text-red-600 rounded-md hover:bg-light-200 transition"
                    title="Delete"
                    data-testid={`delete-meeting-type-${mt.id}`}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {meetingTypes.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-4">No meeting types yet. Create one to start accepting bookings.</p>
            )}

            <button
              onClick={openNewType}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-purple-300 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition"
              data-testid="add-meeting-type"
            >
              <Plus className="w-4 h-4" /> Add Meeting Type
            </button>
          </div>
        )}
      </div>

      {/* Meeting Type Form Modal */}
      {showMeetingForm && editingType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => { setShowMeetingForm(false); setEditingType(null) }}>
          <div className="bg-surface-base rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="meeting-type-form">
            <div className="p-5 border-b border-light-200">
              <h3 className="text-lg font-bold text-text-primary">
                {editingType.id ? 'Edit Meeting Type' : 'New Meeting Type'}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  value={editingType.name}
                  onChange={e => setEditingType({ ...editingType, name: e.target.value })}
                  placeholder="e.g., 30-min Consultation"
                  className="w-full px-3 py-2 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-testid="meeting-type-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea
                  value={editingType.description}
                  onChange={e => setEditingType({ ...editingType, description: e.target.value })}
                  placeholder="Brief description of this meeting type"
                  rows={2}
                  className="w-full px-3 py-2 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  data-testid="meeting-type-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Duration</label>
                  <select
                    value={editingType.duration}
                    onChange={e => setEditingType({ ...editingType, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-light-200 rounded-lg text-text-primary bg-surface-base focus:ring-2 focus:ring-purple-500"
                    data-testid="meeting-type-duration"
                  >
                    {DURATION_OPTIONS.map(d => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Location</label>
                  <input
                    type="text"
                    value={editingType.location}
                    onChange={e => setEditingType({ ...editingType, location: e.target.value })}
                    placeholder="Zoom, Studio..."
                    className="w-full px-3 py-2 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    data-testid="meeting-type-location"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditingType({ ...editingType, color: c })}
                      className={`w-7 h-7 rounded-full transition-all ${editingType.color === c ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                      data-testid={`color-${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Buffer before (min)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={editingType.bufferBefore}
                    onChange={e => setEditingType({ ...editingType, bufferBefore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500"
                    data-testid="meeting-type-buffer-before"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Buffer after (min)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={editingType.bufferAfter}
                    onChange={e => setEditingType({ ...editingType, bufferAfter: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500"
                    data-testid="meeting-type-buffer-after"
                  />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-light-200 flex gap-3 justify-end">
              <button
                onClick={() => { setShowMeetingForm(false); setEditingType(null) }}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-light-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={saveMeetingType}
                disabled={savingType || !editingType.name}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                data-testid="save-meeting-type"
              >
                {savingType ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
                {editingType.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Hours Section */}
      <div className="border border-light-200 rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-light-50 transition"
          onClick={() => setExpandedSection(expandedSection === 'hours' ? 'types' : 'hours')}
          data-testid="availability-section"
        >
          <div className="flex items-center gap-2">
            <Clock weight="duotone" className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-text-primary">Availability Hours</span>
          </div>
          {expandedSection === 'hours' ? <CaretUp className="w-4 h-4 text-text-secondary" /> : <CaretDown className="w-4 h-4 text-text-secondary" />}
        </button>

        {expandedSection === 'hours' && (
          <div className="border-t border-light-200 p-4 space-y-2">
            {DAY_NAMES.map((dayName, dayIndex) => {
              const isActive = isDayActive(dayIndex)
              const daySlots = getAvailabilityForDay(dayIndex)

              return (
                <div key={dayIndex} className="flex items-center gap-3 py-2" data-testid={`day-${dayIndex}`}>
                  <button
                    onClick={() => toggleDay(dayIndex)}
                    className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${isActive ? 'bg-purple-600' : 'bg-light-200'}`}
                    data-testid={`toggle-day-${dayIndex}`}
                    aria-label={`Toggle ${dayName}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-surface-base rounded-full shadow transition-transform ${isActive ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                  <span className={`w-12 text-sm font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {DAY_SHORTS[dayIndex]}
                  </span>
                  {isActive && daySlots.map((slot, slotIdx) => (
                    <div key={slotIdx} className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={e => updateSlotTime(dayIndex, slotIdx, 'startTime', e.target.value)}
                        className="px-2 py-1 border border-light-200 rounded-md text-sm text-text-primary bg-surface-base focus:ring-1 focus:ring-purple-500"
                        data-testid={`start-time-${dayIndex}-${slotIdx}`}
                      />
                      <span className="text-text-secondary text-xs">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={e => updateSlotTime(dayIndex, slotIdx, 'endTime', e.target.value)}
                        className="px-2 py-1 border border-light-200 rounded-md text-sm text-text-primary bg-surface-base focus:ring-1 focus:ring-purple-500"
                        data-testid={`end-time-${dayIndex}-${slotIdx}`}
                      />
                    </div>
                  ))}
                  {!isActive && <span className="text-sm text-text-secondary">Unavailable</span>}
                </div>
              )
            })}

            <button
              onClick={saveAvailability}
              disabled={savingAvailability}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition mt-4"
              data-testid="save-availability"
            >
              {savingAvailability ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
              Save Availability
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
