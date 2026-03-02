import { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  Trash2,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react'
import { Lead, Booking, CreateBookingData, bookingsApi, leadsApi, ServiceType } from '../services/api'

interface BookingModalProps {
  lead?: Lead | null;
  existingBooking?: Booking | null;
  selectedDate?: Date | null;
  onClose: () => void;
  onSaved: (booking: Booking) => void;
  onDeleted?: () => void;
}

// Service type colors for the color picker
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

export default function BookingModal({
  lead,
  existingBooking,
  selectedDate,
  onClose,
  onSaved,
  onDeleted
}: BookingModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Lead selector state (for when no lead is passed)
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [loadingLeads, setLoadingLeads] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState('')

  // Fetch available leads if no lead is passed
  useEffect(() => {
    if (!lead && !existingBooking) {
      const fetchLeads = async () => {
        setLoadingLeads(true)
        const result = await leadsApi.getAll()
        if (result.data?.leads) {
          // Filter to leads that make sense for booking (QUALIFIED, QUOTED, BOOKED, NEGOTIATING)
          const bookableLeads = result.data.leads.filter(l => 
            ['QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED'].includes(l.status)
          )
          setAvailableLeads(bookableLeads)
        }
        setLoadingLeads(false)
      }
      fetchLeads()
    }
  }, [lead, existingBooking])

  // Get the selected lead object
  const getSelectedLead = (): Lead | undefined => {
    if (lead) return lead
    if (selectedLeadId) return availableLeads.find(l => l.id === selectedLeadId)
    return undefined
  }

  // Initialize form
  useEffect(() => {
    if (existingBooking) {
      // Editing existing booking
      setTitle(existingBooking.title)
      const start = new Date(existingBooking.startTime)
      const end = new Date(existingBooking.endTime)
      setDate(start.toISOString().split('T')[0])
      setStartTime(start.toTimeString().slice(0, 5))
      setEndTime(end.toTimeString().slice(0, 5))
      setAllDay(existingBooking.allDay)
      setLocation(existingBooking.location || '')
      setNotes(existingBooking.notes || '')
      setColor(existingBooking.color || '')
    } else if (lead) {
      // Creating new booking from lead
      setTitle(lead.projectTitle || `Booking - ${lead.clientName}`)
      setColor(SERVICE_COLORS[lead.serviceType] || '')
      
      // Use selected date or lead's event date or tomorrow
      if (selectedDate) {
        setDate(selectedDate.toISOString().split('T')[0])
      } else if (lead.eventDate) {
        setDate(new Date(lead.eventDate).toISOString().split('T')[0])
      } else {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setDate(tomorrow.toISOString().split('T')[0])
      }
    } else if (selectedDate) {
      // Creating new booking from calendar click (no lead yet)
      setDate(selectedDate.toISOString().split('T')[0])
    }
  }, [existingBooking, lead, selectedDate])

  // Update title and color when lead is selected from dropdown
  useEffect(() => {
    if (selectedLeadId && !lead && !existingBooking) {
      const selectedLead = availableLeads.find(l => l.id === selectedLeadId)
      if (selectedLead) {
        setTitle(selectedLead.projectTitle || `Booking - ${selectedLead.clientName}`)
        setColor(SERVICE_COLORS[selectedLead.serviceType] || '')
      }
    }
  }, [selectedLeadId, availableLeads, lead, existingBooking])

  // Calculate duration
  const getDuration = (): number => {
    if (allDay) return 480 // 8 hours for all-day
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    return (endH * 60 + endM) - (startH * 60 + startM)
  }

  // Validate form
  const validate = (): boolean => {
    // Check if we have a lead (either passed or selected)
    const effectiveLeadId = existingBooking?.leadId || lead?.id || selectedLeadId
    if (!effectiveLeadId) {
      setError('Please select a lead for this booking')
      return false
    }
    if (!title.trim()) {
      setError('Title is required')
      return false
    }
    if (!date) {
      setError('Date is required')
      return false
    }
    if (!allDay && getDuration() <= 0) {
      setError('End time must be after start time')
      return false
    }
    return true
  }

  // Handle save
  const handleSave = async () => {
    if (!validate()) return

    setLoading(true)
    setError('')

    // Build start and end datetime
    const startDateTime = allDay 
      ? `${date}T00:00:00` 
      : `${date}T${startTime}:00`
    const endDateTime = allDay 
      ? `${date}T23:59:59` 
      : `${date}T${endTime}:00`

    // Get the lead ID from existing booking, passed lead, or selected lead
    const effectiveLeadId = existingBooking?.leadId || lead?.id || selectedLeadId

    const data: CreateBookingData = {
      leadId: effectiveLeadId,
      startTime: new Date(startDateTime).toISOString(),
      endTime: new Date(endDateTime).toISOString(),
      duration: getDuration(),
      allDay,
      title: title.trim(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      color: color || undefined,
    }

    const result = existingBooking
      ? await bookingsApi.update(existingBooking.id, data)
      : await bookingsApi.create(data)

    setLoading(false)

    if (result.error) {
      setError(result.message || 'Failed to save booking')
      return
    }

    if (result.data?.booking) {
      setSuccess(existingBooking ? 'Booking updated!' : 'Booking created!')
      setTimeout(() => {
        onSaved(result.data!.booking)
      }, 500)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!existingBooking) return
    if (!confirm('Are you sure you want to delete this booking?')) return

    setLoading(true)
    const result = await bookingsApi.delete(existingBooking.id)
    setLoading(false)

    if (result.error) {
      setError(result.message || 'Failed to delete booking')
      return
    }

    onDeleted?.()
  }

  // Handle complete
  const handleComplete = async () => {
    if (!existingBooking) return

    setLoading(true)
    const result = await bookingsApi.complete(existingBooking.id)
    setLoading(false)

    if (result.error) {
      setError(result.message || 'Failed to complete booking')
      return
    }

    if (result.data?.booking) {
      setSuccess('Booking marked as completed!')
      setTimeout(() => {
        onSaved(result.data!.booking)
      }, 500)
    }
  }

  // Handle cancel
  const handleCancel = async () => {
    if (!existingBooking) return
    const reason = prompt('Reason for cancellation (optional):')

    setLoading(true)
    const result = await bookingsApi.cancel(existingBooking.id, reason || undefined)
    setLoading(false)

    if (result.error) {
      setError(result.message || 'Failed to cancel booking')
      return
    }

    if (result.data?.booking) {
      setSuccess('Booking cancelled')
      setTimeout(() => {
        onSaved(result.data!.booking)
      }, 500)
    }
  }

  const leadInfo = existingBooking?.lead || lead || getSelectedLead()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl w-full max-w-lg border border-dark-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-900/50 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {existingBooking ? 'Edit Booking' : 'Create Booking'}
              </h2>
              {leadInfo && (
                <p className="text-sm text-gray-400">
                  {leadInfo.clientName} • {leadInfo.projectTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-bg-secondary rounded-lg transition text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-green-300 text-sm">
              <Check className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Lead Selector (only show if no lead was passed and not editing) */}
          {!lead && !existingBooking && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Select Lead <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                {loadingLeads ? (
                  <div className="w-full pl-9 pr-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-gray-400 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading leads...
                  </div>
                ) : availableLeads.length === 0 ? (
                  <div className="w-full pl-9 pr-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-gray-400 text-sm">
                    No leads available. Create a lead first, then book it.
                  </div>
                ) : (
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none cursor-pointer"
                    data-testid="booking-lead-select"
                  >
                    <option value="">Choose a lead...</option>
                    {availableLeads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.clientName} - {l.projectTitle || l.serviceType}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {availableLeads.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing leads in Qualified, Quoted, Negotiating, or Booked status
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Wedding Photography Shoot"
              className="w-full px-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              data-testid="booking-title-input"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              data-testid="booking-date-input"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded border-dark-border bg-dark-bg-secondary text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="allDay" className="text-sm text-gray-300">
              All day event
            </label>
          </div>

          {/* Time Range (if not all day) */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    data-testid="booking-start-time"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    data-testid="booking-end-time"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Duration Display */}
          {!allDay && getDuration() > 0 && (
            <p className="text-xs text-gray-500">
              Duration: {Math.floor(getDuration() / 60)}h {getDuration() % 60}m
            </p>
          )}

          {/* Location */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Location (optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Studio A, 123 Main St"
                className="w-full pl-9 pr-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                data-testid="booking-location-input"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                rows={3}
                className="w-full pl-9 pr-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                data-testid="booking-notes-input"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Calendar Color</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(SERVICE_COLORS).map(([name, c]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 transition ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  title={name.replace('_', ' ')}
                />
              ))}
              <button
                type="button"
                onClick={() => setColor('')}
                className={`w-8 h-8 rounded-lg border-2 transition bg-gray-600 ${
                  !color ? 'border-white scale-110' : 'border-transparent'
                }`}
                title="Default"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border space-y-3">
          {/* Status actions for existing bookings */}
          {existingBooking && existingBooking.status === 'CONFIRMED' && (
            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition text-sm font-medium disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Complete
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-900/50 text-red-300 rounded-lg hover:bg-red-900/70 transition text-sm font-medium disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}

          {/* Main actions */}
          <div className="flex gap-3">
            {existingBooking && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition"
                title="Delete booking"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-dark-border text-gray-300 rounded-lg hover:bg-dark-bg-secondary transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !!success}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm font-medium disabled:opacity-50"
              data-testid="save-booking-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  {existingBooking ? 'Update Booking' : 'Create Booking'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
