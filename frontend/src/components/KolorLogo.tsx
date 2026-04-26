import { Link } from 'react-router-dom'

/*
 * KolorLogo — Iteration 155
 *
 * Geometric K mark — constructivist/Bauhaus reference.
 * Construction (120px coordinate space):
 *   Stem:      rect x=0–36, y=0–120
 *   Upper arm: polygon 36,0 110,0 110,14 36,50
 *   Amber gap: polygon 36,50 110,14 110,28 36,64 (parallelogram, same diagonal as arms)
 *   Lower arm: polygon 36,64 110,28 110,84 36,120
 *
 * Props:
 *   variant   'light' | 'dark'   — light = on dark bg, dark = on light bg
 *   size      'sm' | 'md' | 'lg' — sm=28px, md=40px, lg=56px mark height
 *   markOnly  boolean            — omit wordmark
 *   animated  boolean            — play entrance animation on mount (default: false)
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
  sm: { scale: 28 / 120 },
  md: { scale: 40 / 120 },
  lg: { scale: 56 / 120 },
}

const MARK_W = 110
const MARK_H = 120

/* Keyframes injected once into <head> — guarded by prefers-reduced-motion */
const STYLE_ID = 'kolor-logo-keyframes'
function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes kolor-mark-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes kolor-amber-in {
    from { opacity: 0; transform: scaleX(0); transform-origin: left center; }
    to   { opacity: 1; transform: scaleX(1); transform-origin: left center; }
  }
  @keyframes kolor-word-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
}
  `.trim()
  document.head.appendChild(style)
}

function markStyle(delay: number, amber = false): React.CSSProperties {
  return {
    animation: amber
      ? `kolor-amber-in 0.28s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`
      : `kolor-mark-in 0.3s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
  }
}

function KMark({ scale, animated }: { scale: number; animated: boolean }) {
  const w = Math.round(MARK_W * scale)
  const h = Math.round(MARK_H * scale)
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
      <rect
        x="0" y="0" width="36" height="120"
        fill="#6C2EDB"
        style={animated ? markStyle(50) : undefined}
      />
      <polygon
        points="36,0 110,0 110,14 36,50"
        fill="#6C2EDB"
        style={animated ? markStyle(120) : undefined}
      />
      <polygon
        points="36,64 110,28 110,84 36,120"
        fill="#6C2EDB"
        style={animated ? markStyle(180) : undefined}
      />
      {/* Amber channel — drawn last, scaleX from left */}
      <polygon
        points="36,50 110,14 110,28 36,64"
        fill="#E8891A"
        style={animated ? markStyle(320, true) : undefined}
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
      style={
        animated
          ? { animation: 'kolor-word-in 0.3s cubic-bezier(0.22,1,0.36,1) 500ms both' }
          : undefined
      }
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
      <KMark scale={scale} animated={animated} />
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
