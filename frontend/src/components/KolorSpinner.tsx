/*
 * KolorSpinner — Iteration 167 (geometry fix)
 * Four-quadrant K mark — corrected SVG paths.
 * TL/BL: vertical stem + right-facing semicircle arc.
 * TR/BR: diagonal parallelogram blades.
 * Animation: each quadrant assembles from its corner, hold, whole mark rotates 360°.
 * prefers-reduced-motion: opacity pulse only.
 */

const STYLE_ID = 'kolor-spinner-kf-v3'

function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .ks-svg .kq { transform-box: fill-box; transform-origin: center; }
    @media (prefers-reduced-motion: no-preference) {
      @keyframes ks-tl { 0%,100%{opacity:0;transform:translate(-6px,-6px) scale(.8)} 20%,65%{opacity:1;transform:translate(0,0) scale(1)} }
      @keyframes ks-tr { 0%,100%{opacity:0;transform:translate(6px,-6px) scale(.8)}  20%,65%{opacity:1;transform:translate(0,0) scale(1)} }
      @keyframes ks-bl { 0%,100%{opacity:0;transform:translate(-6px,6px) scale(.8)}  20%,65%{opacity:1;transform:translate(0,0) scale(1)} }
      @keyframes ks-br { 0%,100%{opacity:0;transform:translate(6px,6px) scale(.8)}   20%,65%{opacity:1;transform:translate(0,0) scale(1)} }
      @keyframes ks-whole { 0%{transform:rotate(0deg);opacity:1} 65%{transform:rotate(0deg);opacity:1} 88%{transform:rotate(360deg);opacity:1} 95%{opacity:.7} 100%{transform:rotate(360deg);opacity:1} }
      .ks-svg .kq.tl { animation: ks-tl 2s cubic-bezier(.4,0,.2,1) infinite; animation-delay:0ms }
      .ks-svg .kq.tr { animation: ks-tr 2s cubic-bezier(.4,0,.2,1) infinite; animation-delay:100ms }
      .ks-svg .kq.bl { animation: ks-bl 2s cubic-bezier(.4,0,.2,1) infinite; animation-delay:200ms }
      .ks-svg .kq.br { animation: ks-br 2s cubic-bezier(.4,0,.2,1) infinite; animation-delay:300ms }
      .ks-svg .ks-group { animation: ks-whole 2s cubic-bezier(.4,0,.2,1) infinite; transform-origin: 50px 50px }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes ks-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      .ks-svg .ks-group { animation: ks-pulse 1.6s ease-in-out infinite }
    }
  `
  document.head.appendChild(style)
}

interface KolorSpinnerProps {
  size?: number
  color?: string
  className?: string
}

export default function KolorSpinner({ size = 48, color = '#6C2EDB', className = '' }: KolorSpinnerProps) {
  ensureKeyframes()
  return (
    <svg
      className={`ks-svg ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <g className="ks-group" fill={color}>
        {/* TL: vertical stem up + right-facing semicircle bowl */}
        <rect className="kq tl" x="44" y="6" width="8" height="40" rx="2" />
        <path className="kq tl" d="M 44 18 A 26 26 0 0 0 18 44 L 18 48 L 44 48 Z" />
        {/* TR: upper diagonal blade */}
        <path className="kq tr" d="M 52 6 L 94 6 L 94 28 L 52 48 L 44 38 Z" />
        {/* BL: vertical stem down + right-facing semicircle bowl */}
        <rect className="kq bl" x="44" y="54" width="8" height="40" rx="2" />
        <path className="kq bl" d="M 44 52 L 18 52 L 18 56 A 26 26 0 0 0 44 82 Z" />
        {/* BR: lower diagonal blade */}
        <path className="kq br" d="M 44 62 L 52 52 L 94 72 L 94 94 L 52 94 Z" />
      </g>
    </svg>
  )
}
