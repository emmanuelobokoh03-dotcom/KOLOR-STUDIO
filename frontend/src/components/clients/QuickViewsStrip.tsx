// iter 292-v3b — Quick Views strip (presets + user-defined saved views).
//
// Sidebar VIEWS placement: sidebar is compact (Today / Clients /
// Portfolio only). Adding VIEWS as top-level nav would clutter.
// Instead: inline horizontal strip on the Clients page above the
// filter bar — matches Q10=B operational density.

import { useState } from 'react'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { X } from '@phosphor-icons/react/dist/csr/X'
import type { PresetView, SavedView } from './savedViews'
import { PRESET_VIEWS } from './savedViews'

interface QuickViewsStripProps {
  activePresetId: string | null
  activeSavedViewId: string | null
  savedViews: SavedView[]
  onPresetClick: (preset: PresetView) => void
  onSavedViewClick: (view: SavedView) => void
  onSaveCurrent: (label: string) => void
  onDeleteSavedView: (id: string) => void
  onClearActive: () => void
  canSave: boolean
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  minHeight: 26,
  background: active ? 'var(--kolor-terra, #B84A2C)' : 'transparent',
  color: active
    ? 'var(--kolor-canvas, #F7F4EE)'
    : 'var(--kolor-ink-muted, #5F5751)',
  border: `1px solid ${
    active ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-hairline, #E5E0D8)'
  }`,
  borderRadius: 2,
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background 200ms ease-out, color 200ms ease-out',
  flexShrink: 0,
})

const eyebrowLabelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink-subtle, #928B84)',
  flexShrink: 0,
}

export function QuickViewsStrip({
  activePresetId,
  activeSavedViewId,
  savedViews,
  onPresetClick,
  onSavedViewClick,
  onSaveCurrent,
  onDeleteSavedView,
  onClearActive,
  canSave,
}: QuickViewsStripProps) {
  const [savingLabel, setSavingLabel] = useState<string | null>(null)

  const handleSaveSubmit = () => {
    const label = (savingLabel || '').trim()
    if (!label) {
      setSavingLabel(null)
      return
    }
    onSaveCurrent(label)
    setSavingLabel(null)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        marginBottom: 10,
        background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
        borderRadius: 2,
        flexWrap: 'wrap',
      }}
      data-testid="clients-quick-views-strip"
    >
      <span style={{ ...eyebrowLabelStyle, minWidth: 44 }}>Views</span>

      {PRESET_VIEWS.map((preset) => {
        const active = activePresetId === preset.id
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPresetClick(preset)}
            style={chipStyle(active)}
            data-testid={`clients-preset-${preset.id}`}
          >
            <span aria-hidden style={{ opacity: 0.7 }}>{preset.eyebrow}</span>
            {preset.label}
          </button>
        )
      })}

      {savedViews.length > 0 && (
        <span
          aria-hidden
          style={{
            width: 1,
            height: 16,
            background: 'var(--kolor-hairline, #E5E0D8)',
            margin: '0 2px',
            flexShrink: 0,
          }}
        />
      )}

      {savedViews.map((view) => {
        const active = activeSavedViewId === view.id
        return (
          <div
            key={view.id}
            style={{ position: 'relative', display: 'inline-flex' }}
            data-testid={`clients-saved-view-${view.id}`}
          >
            <button
              type="button"
              onClick={() => onSavedViewClick(view)}
              style={{
                ...chipStyle(active),
                paddingRight: 24,
              }}
            >
              {view.label}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm(`Delete saved view "${view.label}"?`)) {
                  onDeleteSavedView(view.id)
                }
              }}
              aria-label={`Delete ${view.label}`}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                padding: 2,
                cursor: 'pointer',
                color: active
                  ? 'var(--kolor-canvas, #F7F4EE)'
                  : 'var(--kolor-ink-subtle, #928B84)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              data-testid={`clients-saved-view-delete-${view.id}`}
            >
              <X size={10} weight="bold" />
            </button>
          </div>
        )
      })}

      {savingLabel !== null ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            autoFocus
            value={savingLabel}
            onChange={(e) => setSavingLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveSubmit()
              if (e.key === 'Escape') setSavingLabel(null)
            }}
            placeholder="View name…"
            style={{
              padding: '4px 8px',
              minHeight: 26,
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              borderRadius: 2,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 12,
              color: 'var(--kolor-ink, #1A1613)',
              outline: 'none',
              width: 140,
            }}
            data-testid="clients-saved-view-name-input"
          />
          <button
            type="button"
            onClick={handleSaveSubmit}
            style={chipStyle(false)}
            data-testid="clients-saved-view-confirm"
          >
            Save
          </button>
        </div>
      ) : (
        canSave && (
          <button
            type="button"
            onClick={() => setSavingLabel('')}
            style={{
              ...chipStyle(false),
              marginLeft: 'auto',
              color: 'var(--kolor-terra, #B84A2C)',
              borderColor: 'var(--kolor-terra, #B84A2C)',
            }}
            data-testid="clients-save-current-view"
          >
            <Plus size={10} weight="bold" />
            Save view
          </button>
        )
      )}

      {(activePresetId || activeSavedViewId) && (
        <button
          type="button"
          onClick={onClearActive}
          style={{
            padding: '4px 8px',
            background: 'transparent',
            border: 'none',
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-subtle, #928B84)',
            cursor: 'pointer',
          }}
          data-testid="clients-quick-views-clear"
        >
          Clear
        </button>
      )}
    </div>
  )
}

export default QuickViewsStrip
