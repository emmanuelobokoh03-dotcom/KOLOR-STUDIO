import { Link } from 'react-router-dom'

/*
 * KolorLogo — Iteration 155 (Canva reference geometry)
 *
 * Mark construction (150x170px coordinate space):
 *   Pill stem:    rect x=0, y=0, w=70, h=170, rx=35 (fully rounded caps)
 *   Gap:          10px between pill right edge and right column (x=80)
 *   Upper right:  semicircle — flat left at x=80, arc bulges right, r=40, spans y=0 to y=80
 *                 path: M 80,0 A 40,40 0 0 1 80,80 Z
 *   Inner gap:    10px (y=80 to y=90)
 *   Lower right:  rect with bottom-right corner rounded only (r=20)
 *                 M 80,90 L 150,90 L 150,150 A 20,20 0 0 1 130,170 L 80,170 Z
 *   Amber sweep:  radial gradient blob behind mark, fades to transparent
 *
 * Props:
 *   variant   'light' | 'dark'   — light = on dark bg (white wordmark), dark = on light bg
 *   size      'sm' | 'md' | 'lg' — sm=28px, md=40px, lg=56px mark height
 *   markOnly  boolean            — omit wordmark
 *   animated  boolean            — entrance animation on mount (default: false)
 *   linkTo    string | null      — wrap in <Link> if provided
 *   className string
 */

interface KolorLogoProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  markOnly?: boolean
  animated?: boolean
  linkTo?: string | null
  className?: string
}

const SIZE_MAP = {
  sm: { scale: 28 / 170 },
  md: { scale: 40 / 170 },
  lg: { scale: 56 / 170 },
}

const MARK_W = 150
const MARK_H = 170
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const STYLE_ID = 'kolor-logo-keyframes'

function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes kolor-pill-in {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes kolor-semi-in {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes kolor-rect-in {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes kolor-sweep-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes kolor-word-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
}`.trim()
  document.head.appendChild(style)
}

function KMark({
  scale,
  animated,
  variant,
}: {
  scale: number
  animated: boolean
  variant: 'light' | 'dark'
}) {
  const w = Math.round(MARK_W * scale)
  const h = Math.round(MARK_H * scale)
  const sweepOpacity = variant === 'light' ? 0.38 : 0.58
  const gradId = `kolor-sweep-${variant}`

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${MARK_W} ${MARK_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={gradId} cx="62%" cy="82%" r="68%">
          <stop offset="0%" stopColor="#E8891A" stopOpacity={sweepOpacity} />
          <stop offset="100%" stopColor="#E8891A" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Amber sweep — behind all shapes */}
      <path
        d="M 4,118 Q 28,52 82,66 Q 128,76 146,18 L 154,18 L 154,182 Q 128,202 68,194 Q 22,186 4,168 Z"
        fill={`url(#${gradId})`}
        style={animated ? { animation: `kolor-sweep-in 0.45s ${EASE} 0.04s both` } : undefined}
      />

      {/* Pill stem */}
      <rect
        x="0" y="0" width="70" height="170" rx="35"
        fill="#6C2EDB"
        style={animated ? { animation: `kolor-pill-in 0.36s ${EASE} 0.08s both` } : undefined}
      />

      {/* Upper right — semicircle, flat left at x=80, arc right, r=40, y=0 to y=80 */}
      <path
        d="M 80,0 A 40,40 0 0 1 80,80 Z"
        fill="#6C2EDB"
        style={animated ? { animation: `kolor-semi-in 0.36s ${EASE} 0.18s both` } : undefined}
      />

      {/* Lower right — rect with bottom-right corner rounded r=20 */}
      <path
        d="M 80,90 L 150,90 L 150,150 A 20,20 0 0 1 130,170 L 80,170 Z"
        fill="#6C2EDB"
        style={animated ? { animation: `kolor-rect-in 0.36s ${EASE} 0.26s both` } : undefined}
      />
    </svg>
  )
}

function Wordmark({
  variant,
  size,
  animated,
}: {
  variant: 'light' | 'dark'
  size: 'sm' | 'md' | 'lg'
  animated: boolean
}) {
  const titleColor = variant === 'light' ? '#ffffff' : '#1a0a3d'
  const subtitleColor =
    variant === 'light' ? 'rgba(255,255,255,0.42)' : 'rgba(26,10,61,0.38)'
  const titleSize = size === 'lg' ? 22 : size === 'md' ? 17 : 13
  const subtitleSize = size === 'lg' ? 10 : size === 'md' ? 8.5 : 7
  const subtitleMt = size === 'lg' ? 3 : 2

  return (
    <div
      className="flex flex-col justify-center"
      style={animated ? { animation: `kolor-word-in 0.32s ${EASE} 0.42s both` } : undefined}
    >
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: titleSize,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: titleColor,
          lineHeight: 1,
        }}
      >
        KOLOR
      </span>
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: subtitleSize,
          fontWeight: 500,
          letterSpacing: '0.22em',
          color: subtitleColor,
          lineHeight: 1,
          marginTop: subtitleMt,
        }}
      >
        STUDIO
      </span>
    </div>
  )
}

export default function KolorLogo({
  variant = 'dark',
  size = 'md',
  markOnly = false,
  animated = false,
  linkTo,
  className = '',
}: KolorLogoProps) {
  if (animated) ensureKeyframes()

  const { scale } = SIZE_MAP[size]
  const gap = size === 'lg' ? 14 : size === 'md' ? 10 : 8

  const inner = (
    <div className={`inline-flex items-center ${className}`} style={{ gap }}>
      <KMark scale={scale} animated={animated} variant={variant} />
      {!markOnly && <Wordmark variant={variant} size={size} animated={animated} />}
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} aria-label="KOLOR Studio — home" className="inline-flex">
        {inner}
      </Link>
    )
  }

  return inner
}
