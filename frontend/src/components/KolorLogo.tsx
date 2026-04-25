import { Link } from 'react-router-dom'

/*
 * KolorLogo — Iteration 154
 *
 * Geometric K mark derived from constructivist/Bauhaus type specimen reference.
 * Construction (120px coordinate space):
 *   Stem:        rect  x=0–36,  y=0–120  (stroke weight = arm weight)
 *   Upper arm:   polygon  36,0  110,0  110,14  36,50   (42% height, steep diagonal)
 *   Amber gap:   polygon  36,50  110,14  110,28  36,64  (parallelogram, same diagonal angle as arms)
 *   Lower arm:   polygon  36,64  110,28  110,84  36,120
 *
 * Props:
 *   variant   'light' | 'dark'   — light = on dark bg (white wordmark), dark = on light bg (dark wordmark)
 *   size      'sm' | 'md' | 'lg' — sm ~28px, md ~40px, lg ~56px mark height
 *   markOnly  boolean            — omit wordmark
 *   linkTo    string | null      — wrap in <Link> if provided
 *   className string
 */

interface KolorLogoProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  markOnly?: boolean
  linkTo?: string | null
  className?: string
}

const SIZE_MAP = {
  sm: { markH: 28, scale: 28 / 120 },
  md: { markH: 40, scale: 40 / 120 },
  lg: { markH: 56, scale: 56 / 120 },
}

const MARK_NATURAL_W = 110
const MARK_NATURAL_H = 120

function KMark({ scale }: { scale: number }) {
  const w = MARK_NATURAL_W * scale
  const h = MARK_NATURAL_H * scale
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${MARK_NATURAL_W} ${MARK_NATURAL_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Stem */}
      <rect x="0" y="0" width="36" height="120" fill="#6C2EDB" />
      {/* Upper arm */}
      <polygon points="36,0 110,0 110,14 36,50" fill="#6C2EDB" />
      {/* Amber channel — parallelogram following same diagonal angle as arms */}
      <polygon points="36,50 110,14 110,28 36,64" fill="#E8891A" />
      {/* Lower arm */}
      <polygon points="36,64 110,28 110,84 36,120" fill="#6C2EDB" />
    </svg>
  )
}

function Wordmark({ variant, size }: { variant: 'light' | 'dark'; size: 'sm' | 'md' | 'lg' }) {
  const titleColor = variant === 'light' ? '#ffffff' : '#1a0a3d'
  const subtitleColor = variant === 'light' ? 'rgba(255,255,255,0.42)' : 'rgba(26,10,61,0.38)'

  const titleSize = size === 'lg' ? 22 : size === 'md' ? 17 : 13
  const subtitleSize = size === 'lg' ? 10 : size === 'md' ? 8.5 : 7
  const subtitleMt = size === 'lg' ? 3 : 2

  return (
    <div className="flex flex-col justify-center">
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
  linkTo,
  className = '',
}: KolorLogoProps) {
  const { scale } = SIZE_MAP[size]
  const gap = size === 'lg' ? 14 : size === 'md' ? 10 : 8

  const inner = (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap }}
    >
      <KMark scale={scale} />
      {!markOnly && <Wordmark variant={variant} size={size} />}
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
