// iter 292-v3a — Clients v3 avatar (Q7=B initial-based default).
//
// Fraunces italic initials on kolor-canvas-shade-1 with kolor-hairline
// border. Sizes: 24 (kanban), 32 (list default), 40 (compact detail),
// 48 (detail hero).
//
// Uploaded photo optional via photoUrl prop (schema extension deferred
// to Dashboard v3.1 backlog).

import { getInitials } from './stages'

interface ClientAvatarProps {
  name: string
  size?: 24 | 32 | 40 | 48
  photoUrl?: string | null
  testId?: string
}

export function ClientAvatar({ name, size = 32, photoUrl, testId }: ClientAvatarProps) {
  const initials = getInitials(name)
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
      {photoUrl ? (
        <img
          src={photoUrl}
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
