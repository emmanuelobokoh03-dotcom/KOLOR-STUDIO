/*
 * LoadingScreen — Iteration 176
 * Parallax tilt on KolorSpinner: pointer-move (desktop) + gyroscope (mobile).
 * Max 4deg rotation. prefers-reduced-motion: static, no tilt.
 */

import { useEffect, useRef, useState } from 'react'
import KolorSpinner from './KolorSpinner'

export default function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    if (mq.matches) return

    const MAX_DEG = 4

    const onPointer = (e: PointerEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const rx = ((e.clientY - cy) / cy) * MAX_DEG
      const ry = ((e.clientX - cx) / cx) * -MAX_DEG
      setTilt({ x: rx, y: ry })
    }

    const onGyro = (e: DeviceOrientationEvent) => {
      const rx = Math.max(-MAX_DEG, Math.min(MAX_DEG, (e.beta ?? 0) * 0.08))
      const ry = Math.max(-MAX_DEG, Math.min(MAX_DEG, (e.gamma ?? 0) * 0.08))
      setTilt({ x: rx, y: ry })
    }

    window.addEventListener('pointermove', onPointer)
    window.addEventListener('deviceorientation', onGyro)
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('deviceorientation', onGyro)
    }
  }, [])

  const transform = reduced
    ? undefined
    : `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, background: '#080612',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, zIndex: 9999,
      }}
      role="status"
      aria-label="Loading KOLOR Studio"
    >
      <div
        style={{
          transition: 'transform 0.12s ease-out',
          transform,
          willChange: 'transform',
        }}
      >
        <KolorSpinner size={72} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '0.18em', color: '#ffffff', lineHeight: 1 }}>KOLOR</span>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.38)', lineHeight: 1 }}>STUDIO</span>
      </div>
    </div>
  )
}
