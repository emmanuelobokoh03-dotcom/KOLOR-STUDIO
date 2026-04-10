import { Link } from 'react-router-dom'

interface KolorLogoProps {
  variant?: 'light' | 'dark' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  markOnly?: boolean
  iconMode?: boolean
  linkTo?: string | null
  className?: string
}

export default function KolorLogo({
  variant = 'light',
  size = 'md',
  markOnly = false,
  iconMode = false,
  linkTo = '/',
  className = '',
}: KolorLogoProps) {
  const scales = { sm: 0.72, md: 1, lg: 1.5 }
  const s = scales[size]

  const markW = Math.round(38 * s)
  const markH = Math.round(40 * s)
  const totalW = markOnly ? markW : Math.round(160 * s)
  const totalH = markH

  // Tonal plane fills -- shift for each variant
  const planes =
    variant === 'light'
      ? { stem: '#2D1470', mid: '#6C2EDB', blade: '#9B6AEF', word: '#ffffff', amber: '#E8891A' }
      : variant === 'purple'
      ? { stem: 'rgba(255,255,255,0.38)', mid: 'rgba(255,255,255,0.72)', blade: 'rgba(255,255,255,0.96)', word: '#ffffff', amber: '#E8891A' }
      : { stem: '#1A0A50', mid: '#5522C4', blade: '#8B5AEA', word: '#0D0820', amber: '#C46E0E' }

  // Reverse K polygons -- arms face LEFT
  const kMarkPolygons = (
    <g>
      {/* Stem -- darkest plane, vertical left column */}
      <polygon points="2,1 2,39 11,39 11,26" fill={planes.stem} />
      {/* Lower arm -- mid plane */}
      <polygon points="11,26 20,39 32,39 19,20" fill={planes.mid} />
      {/* Upper arm top edge -- mid plane triangle */}
      <polygon points="2,1 11,1 11,14 19,1" fill={planes.mid} />
      {/* Upper blade -- lightest plane, largest face */}
      <polygon points="11,14 19,1 32,1 19,20 11,26" fill={planes.blade} />
      {/* Amber accent -- junction sliver */}
      <polygon points="11,12 11,16 14,14" fill={planes.amber} />
    </g>
  )

  // Icon mode = mark inside a rounded purple square
  if (iconMode) {
    const box = Math.round(40 * s)
    return (
      <svg
        width={box}
        height={box}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="KOLOR Studio"
        role="img"
        className={className}
      >
        <rect width="40" height="40" rx="9" fill="#6C2EDB" />
        <g transform="translate(1,0)">
          {kMarkPolygons}
        </g>
      </svg>
    )
  }

  const logo = (
    <svg
      width={totalW}
      height={totalH}
      viewBox={markOnly ? '0 0 38 40' : '0 0 160 40'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KOLOR Studio"
      role="img"
    >
      {kMarkPolygons}
      {!markOnly && (
        <text
          x="46"
          y="29"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800"
          fontSize="22"
          letterSpacing="0.09em"
          fill={planes.word}
        >
          KOLOR
        </text>
      )}
    </svg>
  )

  if (linkTo === null) return <div className={className}>{logo}</div>

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
