import { Link } from 'react-router-dom'

interface KolorLogoProps {
  variant?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md' | 'lg'
  markOnly?: boolean
  linkTo?: string
  className?: string
}

export default function KolorLogo({
  variant = 'light',
  size = 'md',
  markOnly = false,
  linkTo = '/',
  className = '',
}: KolorLogoProps) {
  const scales = { sm: 0.7, md: 1, lg: 1.4 }
  const scale = scales[size]
  const w = markOnly ? Math.round(26 * scale) : Math.round(112 * scale)
  const h = Math.round(28 * scale)

  const fillMark = variant === 'light' ? '#ffffff' : '#6C2EDB'
  const fillNotch = variant === 'light' ? 'rgba(255,255,255,0.32)' : 'rgba(108,46,219,0.25)'
  const fillText = variant === 'light' ? '#ffffff' : '#1a1a2e'

  const logo = (
    <svg
      width={w}
      height={h}
      viewBox={markOnly ? '0 0 26 28' : '0 0 112 28'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KOLOR Studio"
      role="img"
    >
      {/* K mark — geometric angular letterform */}
      <polygon
        points="2,1 2,27 8,27 8,17 15,27 23,27 14,14 22,1 15,1 8,12 8,1"
        fill={fillMark}
      />
      {/* Notch accent — triangular void at stem/arm junction */}
      <polygon
        points="8,1 8,12 15,1"
        fill={fillNotch}
      />
      {/* Wordmark — only rendered when not markOnly */}
      {!markOnly && (
        <text
          x="30"
          y="21"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800"
          fontSize="16"
          letterSpacing="0.08em"
          fill={fillText}
        >
          KOLOR
        </text>
      )}
    </svg>
  )

  if (!linkTo) return <div className={className}>{logo}</div>

  return (
    <Link
      to={linkTo}
      className={`inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-sm ${className}`}
      aria-label="Go to KOLOR Studio homepage"
    >
      {logo}
    </Link>
  )
}
