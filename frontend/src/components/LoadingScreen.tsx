/*
 * LoadingScreen — Iteration 166
 * Full-page loading using the new SVG KolorSpinner (4-quadrant K assembly).
 * No PNG, no amber pulse. prefers-reduced-motion handled inside KolorSpinner.
 */

import KolorSpinner from './KolorSpinner'

export default function LoadingScreen() {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#080612', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 9999 }}
      role="status"
      aria-label="Loading KOLOR Studio"
    >
      <KolorSpinner size={72} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '0.18em', color: '#ffffff', lineHeight: 1 }}>KOLOR</span>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.38)', lineHeight: 1 }}>STUDIO</span>
      </div>
    </div>
  )
}
