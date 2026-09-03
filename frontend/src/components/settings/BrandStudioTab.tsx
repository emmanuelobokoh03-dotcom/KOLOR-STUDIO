// iter Settings v3-v3a W2 (Answer B) — Brand tab (minimal, logo only).
//
// Path M2 deprecate-in-place: color + font override UI removed. Schema
// fields (brandPrimaryColor / brandAccentColor / brandFontFamily) preserved
// in the User model for API compatibility but no longer editable in the
// product surface. Framework calibration (kolor-terra / Fraunces / mono)
// governs every rendered surface going forward.
//
// Email signature migrated to CommunicationsTab per Answer B.

import { useState, useEffect, useRef } from 'react'
import { settingsApi } from '../../services/api'
import { useBrandTheme } from '../../contexts/BrandThemeContext'
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple'
import { X } from '@phosphor-icons/react/dist/csr/X'
import KolorSpinner from '../KolorSpinner'

export default function BrandStudioTab() {
  const brandTheme = useBrandTheme()
  const [logoUrl, setLogoUrl] = useState(brandTheme.logoUrl)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLogoUrl(brandTheme.logoUrl)
  }, [brandTheme])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('logo', file)
    const result = await settingsApi.uploadBrandLogo(fd)
    if (result.logoUrl) {
      setLogoUrl(result.logoUrl)
      await brandTheme.refresh()
    }
    setUploading(false)
  }

  const handleLogoDelete = async () => {
    await settingsApi.deleteBrandLogo()
    setLogoUrl(null)
    await brandTheme.refresh()
  }

  return (
    <div className="space-y-6" data-testid="brand-tab">
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--kolor-ink-muted, #5F5751)',
        }}
      >
        Studio logo
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--kolor-ink-muted, #5F5751)',
        }}
      >
        Appears on invoices, contracts, and the client portal. Framework
        typography and colour handle the rest — no manual overrides needed.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {logoUrl ? (
          <div style={{ position: 'relative' }}>
            <img
              src={logoUrl}
              alt="Studio logo"
              style={{
                width: 96,
                height: 96,
                objectFit: 'contain',
                background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                borderRadius: 8,
                padding: 8,
              }}
              data-testid="brand-logo-img"
            />
            <button
              type="button"
              onClick={handleLogoDelete}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--kolor-ink, #1A1613)',
                border: '1px solid var(--kolor-ink, #1A1613)',
                color: 'var(--kolor-canvas, #F7F4EE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              data-testid="delete-logo-btn"
              aria-label="Remove logo"
            >
              <X className="w-3 h-3" weight="bold" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              width: 96,
              height: 96,
              borderRadius: 8,
              background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
              border: '2px dashed var(--kolor-hairline-strong, #D0CBBF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 200ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-terra, #B84A2C)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--kolor-hairline-strong, #D0CBBF)' }}
            data-testid="upload-logo-area"
            aria-label="Upload logo"
          >
            {uploading ? (
              <KolorSpinner size={20} color="#B84A2C" />
            ) : (
              <UploadSimple
                weight="bold"
                className="w-6 h-6"
                style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
              />
            )}
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '8px 16px',
              background: 'var(--kolor-terra, #B84A2C)',
              color: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-terra, #B84A2C)',
              borderRadius: 4,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              alignSelf: 'flex-start',
            }}
            data-testid="upload-logo-btn"
          >
            {uploading ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
          </button>
          <p
            style={{
              margin: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 12,
              color: 'var(--kolor-ink-subtle, #928B84)',
              fontStyle: 'italic',
            }}
          >
            PNG, JPG, SVG, or WebP. Max 2MB.
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
          data-testid="brand-logo-file-input"
        />
      </div>
    </div>
  )
}
