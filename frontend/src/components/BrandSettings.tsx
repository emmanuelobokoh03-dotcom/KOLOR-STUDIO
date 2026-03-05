import { useState, useEffect, useRef } from 'react'
import { HexColorPicker } from 'react-colorful'
import { settingsApi } from '../services/api'
import { useBrandTheme } from '../contexts/BrandThemeContext'
import {
  Palette, Type, Upload, Trash2, RotateCcw, Save,
  Loader2, Check, X,
} from 'lucide-react'
import BrandPreview from './BrandPreview'

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', style: 'Modern & Clean' },
  { value: 'Poppins', label: 'Poppins', style: 'Friendly & Round' },
  { value: 'Montserrat', label: 'Montserrat', style: 'Bold & Geometric' },
  { value: 'Playfair Display', label: 'Playfair Display', style: 'Elegant & Serif' },
  { value: 'DM Sans', label: 'DM Sans', style: 'Minimal & Sleek' },
  { value: 'Space Grotesk', label: 'Space Grotesk', style: 'Techy & Unique' },
]

const PRESET_PALETTES = [
  { name: 'Violet', primary: '#A855F7', accent: '#EC4899' },
  { name: 'Indigo', primary: '#6366F1', accent: '#F59E0B' },
  { name: 'Emerald', primary: '#10B981', accent: '#6366F1' },
  { name: 'Rose', primary: '#F43F5E', accent: '#8B5CF6' },
  { name: 'Sky', primary: '#0EA5E9', accent: '#F97316' },
  { name: 'Amber', primary: '#F59E0B', accent: '#8B5CF6' },
]

const DEFAULTS = { primary: '#A855F7', accent: '#EC4899', font: 'Inter' }

export default function BrandSettings() {
  const brandTheme = useBrandTheme()
  const [primary, setPrimary] = useState(brandTheme.primaryColor)
  const [accent, setAccent] = useState(brandTheme.accentColor)
  const [font, setFont] = useState(brandTheme.fontFamily)
  const [logoUrl, setLogoUrl] = useState(brandTheme.logoUrl)
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false)
  const [showAccentPicker, setShowAccentPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPrimary(brandTheme.primaryColor)
    setAccent(brandTheme.accentColor)
    setFont(brandTheme.fontFamily)
    setLogoUrl(brandTheme.logoUrl)
  }, [brandTheme])

  // Live preview: apply changes to DOM immediately
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-brand-primary', primary)
    root.style.setProperty('--color-brand-accent', accent)
    root.style.setProperty('--font-brand', font)
  }, [primary, accent, font])

  const handleSave = async () => {
    setSaving(true)
    await settingsApi.updateBrand({ primaryColor: primary, accentColor: accent, fontFamily: font })
    await brandTheme.refresh()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = async () => {
    setPrimary(DEFAULTS.primary)
    setAccent(DEFAULTS.accent)
    setFont(DEFAULTS.font)
    await settingsApi.updateBrand({ primaryColor: DEFAULTS.primary, accentColor: DEFAULTS.accent, fontFamily: DEFAULTS.font })
    await brandTheme.refresh()
  }

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

  const hasChanges = primary !== brandTheme.primaryColor || accent !== brandTheme.accentColor || font !== brandTheme.fontFamily

  return (
    <div className="flex flex-col lg:flex-row gap-6" data-testid="brand-settings">
      {/* Left Column: Settings */}
      <div className="flex-1 space-y-5 min-w-0">
      {/* Color Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Primary Color */}
        <div>
          <label className="text-sm font-medium text-[#A3A3A3] mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Primary Color
          </label>
          <div className="relative">
            <button
              onClick={() => { setShowPrimaryPicker(!showPrimaryPicker); setShowAccentPicker(false) }}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-[#0F0F0F] border border-[#333] hover:border-[#444] transition-colors"
              data-testid="primary-color-btn"
            >
              <div className="w-8 h-8 rounded-lg border-2 border-white/20 flex-shrink-0" style={{ background: primary }} />
              <span className="text-sm font-mono text-[#FAFAFA]">{primary.toUpperCase()}</span>
            </button>
            {showPrimaryPicker && (
              <div className="absolute top-full left-0 mt-2 z-20 p-3 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-xl" data-testid="primary-picker">
                <HexColorPicker color={primary} onChange={setPrimary} />
                <input
                  type="text"
                  value={primary}
                  onChange={(e) => /^#[0-9A-Fa-f]{6}$/.test(e.target.value) && setPrimary(e.target.value)}
                  className="mt-2 w-full px-2 py-1.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-sm font-mono text-center text-[#FAFAFA]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="text-sm font-medium text-[#A3A3A3] mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Accent Color
          </label>
          <div className="relative">
            <button
              onClick={() => { setShowAccentPicker(!showAccentPicker); setShowPrimaryPicker(false) }}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-[#0F0F0F] border border-[#333] hover:border-[#444] transition-colors"
              data-testid="accent-color-btn"
            >
              <div className="w-8 h-8 rounded-lg border-2 border-white/20 flex-shrink-0" style={{ background: accent }} />
              <span className="text-sm font-mono text-[#FAFAFA]">{accent.toUpperCase()}</span>
            </button>
            {showAccentPicker && (
              <div className="absolute top-full left-0 mt-2 z-20 p-3 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-xl" data-testid="accent-picker">
                <HexColorPicker color={accent} onChange={setAccent} />
                <input
                  type="text"
                  value={accent}
                  onChange={(e) => /^#[0-9A-Fa-f]{6}$/.test(e.target.value) && setAccent(e.target.value)}
                  className="mt-2 w-full px-2 py-1.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-sm font-mono text-center text-[#FAFAFA]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preset Palettes */}
      <div>
        <label className="text-sm font-medium text-[#A3A3A3] mb-2 block">Quick Palettes</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_PALETTES.map(p => (
            <button
              key={p.name}
              onClick={() => { setPrimary(p.primary); setAccent(p.accent); setShowPrimaryPicker(false); setShowAccentPicker(false) }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                primary === p.primary && accent === p.accent
                  ? 'border-white/30 bg-[#1A1A1A]'
                  : 'border-[#333] hover:border-[#444] bg-[#0F0F0F]'
              }`}
              data-testid={`palette-${p.name.toLowerCase()}`}
            >
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full border border-black/30" style={{ background: p.primary }} />
                <div className="w-4 h-4 rounded-full border border-black/30" style={{ background: p.accent }} />
              </div>
              <span className="text-xs text-[#CCCCCC]">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div>
        <label className="text-sm font-medium text-[#A3A3A3] mb-2 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> Font Family
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FONT_OPTIONS.map(f => (
            <button
              key={f.value}
              onClick={() => setFont(f.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                font === f.value
                  ? 'border-brand-primary bg-brand-primary/10'
                  : 'border-[#333] hover:border-[#444] bg-[#0F0F0F]'
              }`}
              data-testid={`font-${f.value.toLowerCase().replace(/\s/g, '-')}`}
            >
              <span className="text-sm font-semibold text-[#FAFAFA] block" style={{ fontFamily: f.value }}>
                {f.label}
              </span>
              <span className="text-[10px] text-[#A3A3A3]">{f.style}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <label className="text-sm font-medium text-[#A3A3A3] mb-2 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Studio Logo
        </label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative group">
              <img src={logoUrl} alt="Brand logo" className="h-16 w-16 rounded-xl object-contain bg-[#0F0F0F] border border-[#333] p-1" data-testid="brand-logo-img" />
              <button
                onClick={handleLogoDelete}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid="delete-logo-btn"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="h-16 w-16 rounded-xl border-2 border-dashed border-[#333] flex items-center justify-center cursor-pointer hover:border-[#555] transition-colors bg-[#0F0F0F]"
              data-testid="upload-logo-area"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-[#A3A3A3] animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-[#A3A3A3]" />
              )}
            </div>
          )}
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-brand-primary hover:underline font-medium"
              data-testid="upload-logo-btn"
            >
              {logoUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
            <p className="text-xs text-gray-500 mt-0.5">PNG, JPG, SVG up to 2MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-[#262626]">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: hasChanges ? primary : undefined }}
          data-testid="save-brand-btn"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Brand'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#333] text-[#A3A3A3] hover:text-[#FAFAFA] hover:border-[#444] transition-colors text-sm font-medium"
          data-testid="reset-brand-btn"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
      </div>

      {/* Right Column: Live Preview */}
      <div className="lg:w-[320px] flex-shrink-0">
        <BrandPreview primary={primary} accent={accent} font={font} logoUrl={logoUrl} />
      </div>
    </div>
  )
}
