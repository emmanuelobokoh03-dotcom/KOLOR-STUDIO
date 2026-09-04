// iter Calendar v3-v3a W3 — React Query hooks for booking data.
// Extends the pattern established for the RevenueHero component in the
// cross-arc corrective. Booking data now flows through
// @tanstack/react-query cache so it survives view mount cycles and page
// refreshes.
//
// Query keys are structured so cache invalidation via
// invalidateQueries({ queryKey: ['bookings'] }) covers all booking list
// surfaces after a mutation.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  bookingsApi,
  availabilityApi,
  type Booking,
  type CreateBookingData,
  type BookingStatus,
} from '../services/api'

// ─────────────────────────────────────────────────────────────────────
// Upcoming bookings — future confirmed bookings only. Reads /api/bookings
// with start=now filter so only forward-looking meetings surface.
// ─────────────────────────────────────────────────────────────────────
export function useUpcomingBookings() {
  return useQuery<Booking[]>({
    queryKey: ['bookings', 'upcoming'],
    queryFn: async () => {
      const res = await bookingsApi.getAll({
        start: new Date().toISOString(),
        status: 'CONFIRMED',
      })
      return res.data?.bookings ?? []
    },
    staleTime: 60 * 1000,           // 60s
    gcTime: 5 * 60 * 1000,          // 5min retention
  })
}

// ─────────────────────────────────────────────────────────────────────
// Bookings for a specific lead — used by ClientDetail meetings section.
// ─────────────────────────────────────────────────────────────────────
export function useLeadBookings(leadId: string | null | undefined) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', 'lead', leadId],
    queryFn: async () => {
      if (!leadId) return []
      const res = await bookingsApi.getAll({ leadId })
      return res.data?.bookings ?? []
    },
    enabled: Boolean(leadId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// ─────────────────────────────────────────────────────────────────────
// Availability windows — changes rarely, longer stale window.
// ─────────────────────────────────────────────────────────────────────
export function useAvailability() {
  return useQuery({
    queryKey: ['availability'],
    queryFn: async () => {
      const res = await availabilityApi.get()
      return res.data?.availability ?? []
    },
    staleTime: 5 * 60 * 1000,       // 5min (availability changes rarely)
    gcTime: 15 * 60 * 1000,         // 15min retention
  })
}

// ─────────────────────────────────────────────────────────────────────
// Mutations — invalidate booking cache on success.
// ─────────────────────────────────────────────────────────────────────
export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (booking: CreateBookingData) => bookingsApi.create(booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CreateBookingData> & { status?: BookingStatus } }) =>
      bookingsApi.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}
