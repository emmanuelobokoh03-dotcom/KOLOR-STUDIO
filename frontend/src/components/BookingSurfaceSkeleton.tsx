// iter Calendar v3-v3a W3 — Booking surface skeleton fallback.
// Mirrors the SettingsTabSkeleton pattern established in Settings v3-v3a.
// Reuses the .ks-shimmer keyframes defined in index.css (kolor-canvas-
// shade-1 shimmer background).
//
// Rendered while booking data resolves via useUpcomingBookings /
// useLeadBookings hooks. Structure matches typical booking list surface:
// section eyebrow + 3-5 booking cards.

export default function BookingSurfaceSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      data-testid="booking-surface-skeleton"
      role="status"
      aria-label="Loading bookings"
      className="space-y-4"
    >
      {/* Section eyebrow shimmer */}
      <div
        className="ks-shimmer rounded"
        style={{ height: 12, width: 140 }}
      />

      {/* Booking card shimmers */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="ks-shimmer rounded-lg"
            style={{ height: 68 }}
          />
        ))}
      </div>
    </div>
  )
}
