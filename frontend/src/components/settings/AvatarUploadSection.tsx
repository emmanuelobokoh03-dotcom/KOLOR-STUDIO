// iter 293-v3.1-v3b W3 — Avatar upload section for AccountTab.
//
// Renders at TOP of AccountTab (Q3c=a). Wraps POST /api/user/avatar +
// DELETE /api/user/avatar. Uses existing 40px+ ClientAvatar component
// pattern (rendered inline at 80px). 2MB cap, JPG/PNG/WebP only.

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { authApi } from '../../services/api'

const API = (import.meta as any).env?.VITE_API_URL || ''

interface CurrentUser {
  firstName?: string
  lastName?: string
  avatarUrl?: string | null
}

function getInitials(user: CurrentUser | null): string {
  const first = user?.firstName?.[0] || ''
  const last = user?.lastName?.[0] || ''
  return (first + last).toUpperCase() || '·'
}

export default function AvatarUploadSection() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false
    authApi
      .getMe()
      .then((r) => {
        if (!cancelled && r.data?.user) setUser(r.data.user as CurrentUser)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar exceeds 2MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images are supported')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch(`${API}/api/user/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error || 'Upload failed')
      } else {
        const json = await res.json()
        setUser((prev) => ({ ...(prev || {}), avatarUrl: json.avatarUrl }))
        toast.success('Photo updated')
      }
    } catch (err) {
      console.error('Avatar upload failed:', err)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!user?.avatarUrl) return
    setRemoving(true)
    try {
      const res = await fetch(`${API}/api/user/avatar`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setUser((prev) => ({ ...(prev || {}), avatarUrl: null }))
        toast.success('Photo removed')
      } else {
        toast.error('Failed to remove photo')
      }
    } catch (err) {
      console.error('Avatar remove failed:', err)
      toast.error('Failed to remove photo')
    } finally {
      setRemoving(false)
    }
  }

  const initials = getInitials(user)

  return (
    <section
      style={{
        paddingBottom: 24,
        borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
      }}
      data-testid="avatar-upload-section"
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--kolor-ink-muted, #5F5751)',
          marginBottom: 12,
        }}
      >
        Profile photo
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
          data-testid="avatar-upload-preview"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 34,
                lineHeight: 1,
                color: 'var(--kolor-ink, #1A1613)',
                letterSpacing: '-0.02em',
              }}
            >
              {initials}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
              data-testid="avatar-upload-btn"
              style={{
                padding: '8px 16px',
                background: 'var(--kolor-terra, #B84A2C)',
                color: 'var(--kolor-canvas, #F7F4EE)',
                border: '1px solid var(--kolor-terra, #B84A2C)',
                borderRadius: 4,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                cursor: uploading || removing ? 'not-allowed' : 'pointer',
                opacity: uploading || removing ? 0.6 : 1,
                transition: 'background 200ms',
              }}
            >
              {uploading ? 'Uploading…' : user?.avatarUrl ? 'Change photo' : 'Upload photo'}
            </button>
            {user?.avatarUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading || removing}
                data-testid="avatar-remove-btn"
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: 'var(--kolor-ink-muted, #5F5751)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  borderRadius: 4,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: uploading || removing ? 'not-allowed' : 'pointer',
                  opacity: uploading || removing ? 0.6 : 1,
                }}
              >
                {removing ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 12,
              color: 'var(--kolor-ink-subtle, #928B84)',
              fontStyle: 'italic',
            }}
          >
            JPG, PNG, or WebP. Max 2MB.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          data-testid="avatar-file-input"
        />
      </div>
    </section>
  )
}
