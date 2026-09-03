// iter Settings v3-v3a W3 — Settings tab skeleton fallback (Suspense).
//
// Rendered while a lazy-loaded tab bundle downloads. Framework-calibrated:
// kolor-canvas-shade-1 shimmer rows matching typical tab structure (section
// eyebrow + 2-4 field placeholders).

export default function SettingsTabSkeleton() {
  return (
    <div
      className="space-y-6"
      data-testid="settings-tab-skeleton"
      role="status"
      aria-label="Loading settings"
    >
      <div
        className="ks-shimmer rounded"
        style={{ height: 12, width: 120 }}
      />
      <div className="space-y-3">
        <div
          className="ks-shimmer rounded"
          style={{ height: 14, width: 80 }}
        />
        <div
          className="ks-shimmer rounded"
          style={{ height: 40, width: '100%' }}
        />
      </div>
      <div className="space-y-3">
        <div
          className="ks-shimmer rounded"
          style={{ height: 14, width: 80 }}
        />
        <div
          className="ks-shimmer rounded"
          style={{ height: 40, width: '100%' }}
        />
      </div>
      <div className="space-y-3">
        <div
          className="ks-shimmer rounded"
          style={{ height: 14, width: 80 }}
        />
        <div
          className="ks-shimmer rounded"
          style={{ height: 40, width: '100%' }}
        />
      </div>
    </div>
  )
}
