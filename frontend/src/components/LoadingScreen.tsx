/*
 * LoadingScreen — Iteration 155
 * Full-page loading using /kolor-mark.png.
 * Mark pulses gently (opacity + scale, 1.6s infinite).
 * prefers-reduced-motion: no animation.
 */

const STYLE_ID = 'kolor-loading-keyframes'

function ensureLoadingKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = [
    '@media (prefers-reduced-motion: no-preference) {',
    '  @keyframes kolor-mark-pulse {',
    '    0%, 100% { opacity: 0.7; transform: scale(0.97); }',
    '    50%       { opacity: 1;   transform: scale(1); }',
    '  }',
    '  .kolor-loading-mark {',
    '    animation: kolor-mark-pulse 1.6s ease-in-out infinite;',
    '  }',
    '}',
  ].join('\n')
  document.head.appendChild(style)
}

export default function LoadingScreen() {
  if (typeof window !== 'undefined') ensureLoadingKeyframes()

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#080612', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 9999 }}
      role="status"
      aria-label="Loading KOLOR Studio"
    >
      <img
        src="/kolor-mark.png"
        alt=""
        width={72}
        height={72}
        className="kolor-loading-mark"
        draggable={false}
        style={{ display: 'block' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '0.18em', color: '#ffffff', lineHeight: 1 }}>KOLOR</span>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.38)', lineHeight: 1 }}>STUDIO</span>
      </div>
    </div>
  )
}
