/*
 * KolorSpinner — Iteration 170 (CSS-only, no vector paths)
 * Four quadrant divs animate in from corners then rotate as a group.
 * Pure DOM + CSS animation. prefers-reduced-motion: opacity pulse only.
 */

import { useEffect, useState } from 'react'

interface KolorSpinnerProps {
  size?: number
  color?: string
  className?: string
}

export default function KolorSpinner({ size = 48, color = '#6C2EDB', className = '' }: KolorSpinnerProps) {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const half = size / 2
  const gap = size * 0.06
  const pieceSize = half - gap

  const pieces = [
    { top: 0,          left: 0,          borderRadius: `${size * 0.35}px ${size * 0.08}px ${size * 0.08}px ${size * 0.08}px`, delay: '0ms',   tx: '-30%', ty: '-30%' },
    { top: 0,          left: half + gap,  borderRadius: `${size * 0.08}px ${size * 0.35}px ${size * 0.08}px ${size * 0.08}px`, delay: '100ms',  tx: '30%',  ty: '-30%' },
    { top: half + gap, left: 0,          borderRadius: `${size * 0.08}px ${size * 0.08}px ${size * 0.08}px ${size * 0.35}px`, delay: '200ms',  tx: '-30%', ty: '30%'  },
    { top: half + gap, left: half + gap,  borderRadius: `${size * 0.08}px ${size * 0.08}px ${size * 0.35}px ${size * 0.08}px`, delay: '300ms',  tx: '30%',  ty: '30%'  },
  ]

  const styleId = 'ks170-styles'
  useEffect(() => {
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @media (prefers-reduced-motion: no-preference) {
        @keyframes ks170-entry {
          0%   { opacity: 0; transform: translate(var(--ks-tx), var(--ks-ty)) scale(0.6); }
          30%  { opacity: 1; transform: translate(0,0) scale(1); }
          70%  { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--ks-tx), var(--ks-ty)) scale(0.6); }
        }
        @keyframes ks170-rot {
          0%   { transform: rotate(0deg); }
          60%  { transform: rotate(0deg); }
          90%  { transform: rotate(360deg); }
          100% { transform: rotate(360deg); }
        }
        .ks170-group { animation: ks170-rot 2s cubic-bezier(.4,0,.2,1) infinite; }
        .ks170-piece { animation: ks170-entry 2s cubic-bezier(.4,0,.2,1) infinite; }
      }
      @media (prefers-reduced-motion: reduce) {
        @keyframes ks170-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .ks170-group { animation: ks170-pulse 1.6s ease-in-out infinite; }
      }
    `
    document.head.appendChild(style)
  }, [])

  return (
    <div
      className={`ks170-group ${className}`}
      style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}
      role="img"
      aria-label="Loading"
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          className={reduced ? undefined : 'ks170-piece'}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: pieceSize,
            height: pieceSize,
            background: color,
            borderRadius: p.borderRadius,
            ['--ks-tx' as string]: p.tx,
            ['--ks-ty' as string]: p.ty,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}
