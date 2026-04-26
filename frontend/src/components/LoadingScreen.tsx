/*
 * LoadingScreen — Iteration 155
 *
 * Full-page loading state using the KOLOR mark.
 * Amber sweep pulses (opacity 0.25 -> 0.7 -> 0.25, 1.6s infinite).
 * Purple geometry stays solid — communicates "working" without spinning.
 * prefers-reduced-motion: amber stays at full opacity, no animation.
 *
 * Usage: if (loading) return <LoadingScreen />
 */

const STYLE_ID = 'kolor-loading-keyframes'

function ensureLoadingKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes kolor-sweep-pulse {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 0.7; }
  }
  .kolor-loading-sweep {
    animation: kolor-sweep-pulse 1.6s ease-in-out infinite;
  }
}`.trim()
  document.head.appendChild(style)
}

export default function LoadingScreen() {
  if (typeof window !== 'undefined') ensureLoadingKeyframes()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#080612',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        zIndex: 9999,
      }}
      role="status"
      aria-label="Loading KOLOR Studio"
    >
      <svg
        width="64"
        height="72"
        viewBox="0 0 150 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="ls-sweep" cx="62%" cy="82%" r="68%">
            <stop offset="0%" stopColor="#E8891A" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#E8891A" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Amber sweep — pulses */}
        <path
          className="kolor-loading-sweep"
          d="M 4,118 Q 28,52 82,66 Q 128,76 146,18 L 154,18 L 154,182 Q 128,202 68,194 Q 22,186 4,168 Z"
          fill="url(#ls-sweep)"
        />

        {/* Pill stem */}
        <rect x="0" y="0" width="70" height="170" rx="35" fill="#6C2EDB" />

        {/* Upper right — semicircle */}
        <path d="M 80,0 A 40,40 0 0 1 80,80 Z" fill="#6C2EDB" />

        {/* Lower right — rect with bottom-right corner rounded */}
        <path d="M 80,90 L 150,90 L 150,150 A 20,20 0 0 1 130,170 L 80,170 Z" fill="#6C2EDB" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: '#ffffff',
            lineHeight: 1,
          }}
        >
          KOLOR
        </span>
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.38)',
            lineHeight: 1,
          }}
        >
          STUDIO
        </span>
      </div>
    </div>
  )
}
