/*
 * KolorSpinner — Iteration 163
 * Inline loading indicator using the KOLOR K mark with amber pulse animation.
 * Use instead of SpinnerGap for full-page or section loading states.
 * For tiny inline spinners (button loading), SpinnerGap is still appropriate.
 */

const STYLE_ID = 'kolor-spinner-keyframes'

function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = [
    '@media (prefers-reduced-motion: no-preference) {',
    '  @keyframes kolor-spin-pulse {',
    '    0%, 100% { opacity: 0.55; transform: scale(0.95); }',
    '    50%       { opacity: 1;    transform: scale(1); }',
    '  }',
    '  .kolor-spinner-img {',
    '    animation: kolor-spin-pulse 1.4s ease-in-out infinite;',
    '  }',
    '}',
  ].join('\n')
  document.head.appendChild(style)
}

interface KolorSpinnerProps {
  size?: number
  className?: string
}

export default function KolorSpinner({ size = 48, className = '' }: KolorSpinnerProps) {
  ensureKeyframes()
  return (
    <img
      src="/kolor-mark.png"
      alt=""
      width={size}
      height={size}
      className={`kolor-spinner-img ${className}`}
      draggable={false}
      aria-hidden="true"
    />
  )
}
