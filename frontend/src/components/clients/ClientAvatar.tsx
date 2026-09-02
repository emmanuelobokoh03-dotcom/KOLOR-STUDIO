// iter 292-v3a — Clients v3 avatar (Q7=B initial-based default).
//
// Fraunces italic initials on kolor-canvas-shade-1 with kolor-hairline
// border. Sizes: 24 (kanban), 32 (list default), 40 (compact detail),
// 48 (detail hero).
//
// iter 293-v3.1-v3b — User avatarUrl support (Supabase-backed custom photo).
// Both `photoUrl` (client photo, deferred to future arc) and `avatarUrl`
// (user own photo, ships this iter) render an image when present. Falls
// back to Fraunces italic initials.

import { getInitials } from './stages'

interface ClientAvatarProps {
  name: string
  size?: 24 | 32 | 40 | 48
  photoUrl?: string | null
  avatarUrl?: string | null
  testId?: string
}

export function ClientAvatar({ name, size = 32, photoUrl, avatarUrl, testId }: ClientAvatarProps) {
  const initials = getInitials(name)
  const imageSrc = avatarUrl || photoUrl
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      aria-label={`${name} avatar`}
      data-testid={testId || `client-avatar-${initials.toLowerCase()}`}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: Math.round(size * 0.42),
            lineHeight: 1,
            color: 'var(--kolor-ink, #1A1613)',
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}

export default ClientAvatar
