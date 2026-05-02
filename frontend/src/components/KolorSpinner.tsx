/*
 * KolorSpinner — Iteration 166
 * Pure SVG/CSS animated K mark. Four quadrants assemble around the center
 * with a staggered fade + scale, then dissolve and loop. No PNG dependency.
 * Respects prefers-reduced-motion (renders the static assembled K).
 *
 * The K is decomposed into 4 quadrants matching the brand mark:
 *   tl — upper-left curved arc
 *   tr — upper-right diagonal arm
 *   bl — lower-left curved arc
 *   br — lower-right diagonal arm
 */

const STYLE_ID = 'kolor-spinner-keyframes-v2'

function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = [
    '.kolor-spinner-svg .kq {',
    '  transform-box: view-box;',
    '  transform-origin: 50% 50%;',
    '  opacity: 1;',
    '}',
    '@media (prefers-reduced-motion: no-preference) {',
    '  @keyframes kolor-q-tl {',
    '    0%, 100% { opacity: 0; transform: translate(-7px, -7px) scale(0.78); }',
    '    18%, 70% { opacity: 1; transform: translate(0, 0) scale(1); }',
    '  }',
    '  @keyframes kolor-q-tr {',
    '    0%, 100% { opacity: 0; transform: translate(7px, -7px) scale(0.78); }',
    '    18%, 70% { opacity: 1; transform: translate(0, 0) scale(1); }',
    '  }',
    '  @keyframes kolor-q-bl {',
    '    0%, 100% { opacity: 0; transform: translate(-7px, 7px) scale(0.78); }',
    '    18%, 70% { opacity: 1; transform: translate(0, 0) scale(1); }',
    '  }',
    '  @keyframes kolor-q-br {',
    '    0%, 100% { opacity: 0; transform: translate(7px, 7px) scale(0.78); }',
    '    18%, 70% { opacity: 1; transform: translate(0, 0) scale(1); }',
    '  }',
    '  .kolor-spinner-svg .kq.tl { animation: kolor-q-tl 1.8s ease-in-out infinite; animation-delay: 0ms; }',
    '  .kolor-spinner-svg .kq.tr { animation: kolor-q-tr 1.8s ease-in-out infinite; animation-delay: 90ms; }',
    '  .kolor-spinner-svg .kq.bl { animation: kolor-q-bl 1.8s ease-in-out infinite; animation-delay: 180ms; }',
    '  .kolor-spinner-svg .kq.br { animation: kolor-q-br 1.8s ease-in-out infinite; animation-delay: 270ms; }',
    '}',
  ].join('\n')
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
      className={`kolor-spinner-svg ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <g fill={color}>
        <path className="kq tl" d="M 50 8 A 42 42 0 0 0 8 50 L 26 50 A 24 24 0 0 1 50 26 Z" />
        <path className="kq tr" d="M 50 26 L 50 50 L 92 8 L 64 8 Z" />
        <path className="kq bl" d="M 8 50 A 42 42 0 0 0 50 92 L 50 74 A 24 24 0 0 1 26 50 Z" />
        <path className="kq br" d="M 50 50 L 50 74 L 92 92 L 64 92 Z" />
      </g>
    </svg>
  )
}
