/*
 * LoadingScreen — Iteration 155
 *
 * Branded full-page loading state. Uses the KOLOR K-mark geometry from
 * KolorLogo.tsx with an amber channel that pulses while the app loads.
 *
 * Animation is strictly additive and gated by `prefers-reduced-motion: no-preference`.
 * No new npm packages — pure CSS keyframes injected once into <head>.
 */

import { useEffect } from 'react'

interface LoadingScreenProps {
  /** Optional caption rendered beneath the mark */
  label?: string
  /** Use full viewport height (default true). Set false to embed inline. */
  fullScreen?: boolean
}

const STYLE_ID = 'kolor-loading-keyframes'

function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes kolor-loading-mark-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes kolor-loading-amber-pulse {
    0%, 100% { opacity: 0.35; transform: scaleX(0.92); }
    50%      { opacity: 1;    transform: scaleX(1); }
  }
  @keyframes kolor-loading-caption-in {
    from { opacity: 0; }
    to   { opacity: 0.62; }
  }
  @keyframes kolor-loading-dots {
    0%, 20%   { opacity: 0.25; }
    50%       { opacity: 1; }
    80%, 100% { opacity: 0.25; }
  }
}
  `.trim()
  document.head.appendChild(style)
}

export default function LoadingScreen({
  label = 'Loading',
  fullScreen = true,
}: LoadingScreenProps) {
  useEffect(() => {
    ensureKeyframes()
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      data-testid="app-loading-screen"
      className={
        fullScreen
          ? 'fixed inset-0 z-[100] flex flex-col items-center justify-center'
          : 'flex flex-col items-center justify-center py-16'
      }
      style={{ background: fullScreen ? '#080612' : 'transparent' }}
    >
      {/* K mark — coordinates match KolorLogo.tsx exactly */}
      <svg
        width="72"
        height="78"
        viewBox="0 0 110 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        style={{
          animation: 'kolor-loading-mark-in 0.32s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        <rect x="0" y="0" width="36" height="120" fill="#6C2EDB" />
        <polygon points="36,0 110,0 110,14 36,50" fill="#6C2EDB" />
        <polygon points="36,64 110,28 110,84 36,120" fill="#6C2EDB" />
        {/* Amber channel — pulses while loading */}
        <polygon
          points="36,50 110,14 110,28 36,64"
          fill="#E8891A"
          style={{
            transformOrigin: '36px 39px',
            animation:
              'kolor-loading-amber-pulse 1.4s cubic-bezier(0.4,0,0.2,1) 280ms infinite',
          }}
        />
      </svg>

      {/* Caption — 'Loading' with three pulsing dots */}
      <div
        aria-hidden="true"
        style={{
          marginTop: 22,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.32em',
          color: 'rgba(255,255,255,0.62)',
          textTransform: 'uppercase',
          animation: 'kolor-loading-caption-in 0.4s ease-out 200ms both',
        }}
      >
        {label}
        <span style={{ display: 'inline-flex', marginLeft: 6, gap: 3 }}>
          <span
            style={{
              animation: 'kolor-loading-dots 1.2s ease-in-out infinite',
              animationDelay: '0ms',
            }}
          >
            .
          </span>
          <span
            style={{
              animation: 'kolor-loading-dots 1.2s ease-in-out infinite',
              animationDelay: '180ms',
            }}
          >
            .
          </span>
          <span
            style={{
              animation: 'kolor-loading-dots 1.2s ease-in-out infinite',
              animationDelay: '360ms',
            }}
          >
            .
          </span>
        </span>
      </div>
    </div>
  )
}
