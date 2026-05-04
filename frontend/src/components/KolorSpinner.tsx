/*
 * KolorSpinner — Iteration 169 (geometry v4 — final)
 * TL/BL: rect stem + quarter-circle arc bowl.
 * TR/BR: flat polygon blades. No arc-only paths.
 */

const STYLE_ID = 'kolor-spinner-kf-v4'

function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .ks4 .kq { transform-box: fill-box; transform-origin: center; }
    @media (prefers-reduced-motion: no-preference) {
      @keyframes ks4-tl { 0%,100%{opacity:0;transform:translate(-5px,-5px) scale(.85)} 20%,65%{opacity:1;transform:translate(0,0) scale(1)} }
      @keyframes ks4-tr { 0%,100%{opacity:0;transform:translate(5px,-5px) scale(.85)}  20%,65%{opacity:1;transform:translate(0,0) scale(1)} }
      @keyframes ks4-bl { 0%,100%{opacity:0;transform:translate(-5px,5px) scale(.85)}  20%,65%{opacity:1;transform:translate(0,0) scale(1)} }
      @keyframes ks4-br { 0%,100%{opacity:0;transform:translate(5px,5px) scale(.85)}   20%,65%{opacity:1;transform:translate(0,0) scale(1)} }
      @keyframes ks4-rot { 0%{transform:rotate(0deg)} 65%{transform:rotate(0deg)} 88%{transform:rotate(360deg)} 100%{transform:rotate(360deg)} }
      .ks4 .kq.tl { animation: ks4-tl 2s cubic-bezier(.4,0,.2,1) infinite; animation-delay:0ms }
      .ks4 .kq.tr { animation: ks4-tr 2s cubic-bezier(.4,0,.2,1) infinite; animation-delay:100ms }
      .ks4 .kq.bl { animation: ks4-bl 2s cubic-bezier(.4,0,.2,1) infinite; animation-delay:200ms }
      .ks4 .kq.br { animation: ks4-br 2s cubic-bezier(.4,0,.2,1) infinite; animation-delay:300ms }
      .ks4 .ks4-g { animation: ks4-rot 2s cubic-bezier(.4,0,.2,1) infinite; transform-origin: 50px 50px }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes ks4-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      .ks4 .ks4-g { animation: ks4-pulse 1.6s ease-in-out infinite }
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
      className={`ks4 ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <g className="ks4-g" fill={color}>
        <rect className="kq tl" x="44" y="6" width="8" height="40" rx="1" />
        <path className="kq tl" d="M 44 22 A 24 24 0 0 0 20 46 L 44 46 Z" />
        <polygon className="kq tr" points="52,6 94,6 94,30 52,48 44,36" />
        <rect className="kq bl" x="44" y="54" width="8" height="40" rx="1" />
        <path className="kq bl" d="M 44 54 L 20 54 A 24 24 0 0 0 44 78 Z" />
        <polygon className="kq br" points="52,52 94,70 94,94 52,94 44,64" />
      </g>
    </svg>
  )
}
