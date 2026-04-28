import { Link } from 'react-router-dom'

/*
 * KolorLogo — Iteration 155 (PNG mark asset)
 *
 * The K mark is served as /kolor-mark.png — includes the amber sweep.
 * variant prop controls wordmark colour only (mark PNG is unchanged).
 *
 * Props:
 *   variant   'light' | 'dark'   — wordmark colour
 *   size      'sm' | 'md' | 'lg' — sm=28px md=40px lg=56px mark height
 *   markOnly  boolean            — omit wordmark
 *   animated  boolean            — entrance animation (default: false)
 *   linkTo    string | null      — wrap in Link
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

const SIZE_MAP = { sm: 40, md: 56, lg: 72 }
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const STYLE_ID = 'kolor-logo-keyframes'

function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = [
    '@media (prefers-reduced-motion: no-preference) {',
    '  @keyframes kolor-mark-in {',
    '    from { opacity: 0; transform: translateY(5px); }',
    '    to   { opacity: 1; transform: translateY(0); }',
    '  }',
    '  @keyframes kolor-word-in {',
    '    from { opacity: 0; }',
    '    to   { opacity: 1; }',
    '  }',
    '}',
  ].join('\n')
  document.head.appendChild(style)
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
      style={animated ? { animation: 'kolor-word-in 0.32s ' + EASE + ' 0.38s both' } : undefined}
    >
      <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: titleSize, fontWeight: 700, letterSpacing: '0.18em', color: titleColor, lineHeight: 1 }}>KOLOR</span>
      <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: subtitleSize, fontWeight: 500, letterSpacing: '0.22em', color: subtitleColor, lineHeight: 1, marginTop: subtitleMt }}>STUDIO</span>
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
  const markSize = SIZE_MAP[size]
  const gap = size === 'lg' ? 14 : size === 'md' ? 10 : 8

  const inner = (
    <div className={'inline-flex items-center ' + className} style={{ gap }}>
      <img
        src="/kolor-mark.png"
        alt=""
        width={markSize}
        style={animated
          ? { animation: 'kolor-mark-in 0.36s ' + EASE + ' 0.06s both', display: 'block' }
          : { display: 'block' }
        }
        draggable={false}
      />
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
