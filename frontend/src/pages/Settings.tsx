import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  User,
  Bell,
  Plugs,
  Shield,
  ArrowLeft,
  Camera,
  PaintBrush,
  Palette,
  GoogleLogo,
  CheckCircle,
  SpinnerGap,
  Eye,
  EyeSlash,
  WarningCircle,
  Funnel,
} from '@phosphor-icons/react'
import BrandPreview from '../components/BrandPreview'
import PortfolioSettings from '../components/PortfolioSettings'
import SharePortfolio from '../components/SharePortfolio'

const API_URL = import.meta.env.VITE_API_URL || ''

type Tab = 'profile' | 'brand' | 'notifications' | 'integrations' | 'account' | 'pipeline'

interface UserSettings {
  id: string
  email: string
  firstName: string
  lastName: string
  studioName?: string
  businessName?: string
  primaryIndustry?: string
  phone?: string
  website?: string
  weeklyReportEnabled: boolean
  staleLeadEmailEnabled: boolean
  quoteNudgeEmailEnabled: boolean
}

const INDUSTRY_OPTIONS = [
  { value: 'PHOTOGRAPHY', label: 'Photography', icon: Camera, desc: 'Shoots, sessions, weddings' },
  { value: 'DESIGN', label: 'Design', icon: PaintBrush, desc: 'Branding, web, UI/UX' },
  { value: 'FINE_ART', label: 'Fine Art', icon: Palette, desc: 'Commissions, galleries' },
]

interface AccentPalette {
  id: string
  name: string
  description: string
  primary: string
  preview: [string, string]
}

const ACCENT_PALETTES: AccentPalette[] = [
  { id: 'kolor',    name: 'KOLOR',         description: 'Default — deep violet',     primary: '#6C2EDB', preview: ['#6C2EDB', '#E8891A'] },
  { id: 'slate',    name: 'Slate Studio',  description: 'Dark & editorial',          primary: '#1E293B', preview: ['#1E293B', '#D97706'] },
  { id: 'terra',    name: 'Terra',         description: 'Warm & earthy',             primary: '#92400E', preview: ['#92400E', '#6EE7B7'] },
  { id: 'midnight', name: 'Midnight',      description: 'Deep indigo & coral',       primary: '#3730A3', preview: ['#3730A3', '#FB7185'] },
]

export default function Settings() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'profile'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile form
  const [firstName, setFirstName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')

  // App accent palette (workspace theme)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(() => {
    return localStorage.getItem('kolor_palette_id') || 'kolor'
  })
  // Keep a derived primary value for backward compat readers of `kolor_app_accent`
  const selectedAccent = ACCENT_PALETTES.find(p => p.id === selectedPaletteId)?.primary || '#6C2EDB'

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Calendar status
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarEmail, setCalendarEmail] = useState('')

  // Brand state
  const [brandPrimary, setBrandPrimary] = useState('#6C2EDB')
  const [brandAccent, setBrandAccent] = useState('#E8891A')
  const [brandFont, setBrandFont] = useState('Inter')
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingBrand, setSavingBrand] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchCalendarStatus()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, { credentials: 'include' })
      if (!res.ok) { navigate('/login'); return }
      const data = await res.json()
      const s = data.settings
      setSettings(s)
      setFirstName(s.firstName || '')
      setBusinessName(s.businessName || s.studioName || '')
      setIndustry(s.primaryIndustry || 'PHOTOGRAPHY')
      setBrandPrimary(s.brandPrimaryColor || '#6C2EDB')
      setBrandAccent(s.brandAccentColor || '#E8891A')
      setBrandFont(s.brandFontFamily || 'Inter')
      setBrandLogoUrl(s.brandLogoUrl || null)
    } catch {
      navigate('/login')
    }
    setLoading(false)
  }

  const fetchCalendarStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/calendar/status`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCalendarConnected(data.connected)
        setCalendarEmail(data.email || '')
      }
    } catch { /* ignore */ }
  }

  const saveSettings = async (patch: Record<string, any>) => {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        toast.success('Settings saved')
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Connection error')
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    setChangingPassword(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password changed successfully')
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      } else {
        toast.error(data.message || 'Failed to change password')
      }
    } catch {
      toast.error('Connection error')
    }
    setChangingPassword(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-background)] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 text-[#6C2EDB] animate-spin" />
      </div>
    )
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'brand', label: 'Brand', icon: PaintBrush },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'integrations', label: 'Integrations', icon: Plugs },
    { key: 'account', label: 'Account', icon: Shield },
    { key: 'pipeline', label: 'Pipeline', icon: Funnel },
  ]

  return (
    <div className="min-h-screen bg-[var(--surface-background)]" data-testid="settings-page">
      {/* Header */}
      <div className="bg-[var(--surface-base)] border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-background)] text-[var(--text-secondary)] transition"
            data-testid="settings-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-extrabold text-text-primary">Settings</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <nav className="md:w-48 flex-shrink-0">
            {/* Mobile: horizontal tabs */}
            <div className="md:hidden flex gap-1 rounded-lg bg-[var(--surface-base)] p-1 mb-4 overflow-x-auto scrollbar-hide" style={{ border: '0.5px solid var(--border)' }}>
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 min-h-[44px] rounded-md text-xs font-medium transition ${
                      activeTab === tab.key
                        ? 'bg-[rgba(108,46,219,0.10)] text-[#6C2EDB] font-bold'
                        : 'text-[var(--text-secondary)]'
                    }`}
                    data-testid={`settings-tab-${tab.key}`}
                  >
                    <Icon weight={activeTab === tab.key ? 'fill' : 'regular'} className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Desktop: vertical tabs */}
            <div className="hidden md:flex flex-col gap-0.5">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left ${
                      activeTab === tab.key
                        ? 'bg-[rgba(108,46,219,0.10)] text-[#6C2EDB] font-bold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-base)] hover:text-text-primary'
                    }`}
                    data-testid={`settings-tab-${tab.key}`}
                  >
                    <Icon weight={activeTab === tab.key ? 'fill' : 'regular'} className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Brand tab renders outside the card wrapper — it has its own sections */}
            {activeTab === 'brand' && (
              <BrandTab
                settings={settings}
                brandPrimary={brandPrimary}
                setBrandPrimary={setBrandPrimary}
                brandAccent={brandAccent}
                setBrandAccent={setBrandAccent}
                brandFont={brandFont}
                setBrandFont={setBrandFont}
                brandLogoUrl={brandLogoUrl}
                setBrandLogoUrl={setBrandLogoUrl}
                uploadingLogo={uploadingLogo}
                setUploadingLogo={setUploadingLogo}
                savingBrand={savingBrand}
                saveBrand={async () => {
                  setSavingBrand(true)
                  await saveSettings({
                    brandPrimaryColor: brandPrimary,
                    brandAccentColor: brandAccent,
                    brandFontFamily: brandFont,
                    brandLogoUrl: brandLogoUrl,
                  })
                  setSavingBrand(false)
                }}
              />
            )}

            {activeTab !== 'brand' && activeTab !== 'pipeline' && (
            <div className="bg-[var(--surface-base)] rounded-xl p-5 sm:p-6" style={{ border: '0.5px solid var(--border)' }}>

              {/* ── Profile Tab ── */}
              {activeTab === 'profile' && (
                <div data-testid="settings-profile-tab">
                  <h2 className="text-base font-bold text-text-primary mb-1">Profile</h2>
                  <p className="text-xs text-[var(--text-secondary)] mb-6">Your personal and business information</p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Display Name</label>
                      <input
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-[var(--surface-background)] text-text-primary border focus:ring-2 focus:ring-[#6C2EDB]/20 focus:border-[#6C2EDB] transition"
                        style={{ borderColor: 'var(--border)' }}
                        data-testid="settings-firstname-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Business Name</label>
                      <input
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-[var(--surface-background)] text-text-primary border focus:ring-2 focus:ring-[#6C2EDB]/20 focus:border-[#6C2EDB] transition"
                        style={{ borderColor: 'var(--border)' }}
                        data-testid="settings-businessname-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Industry</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {INDUSTRY_OPTIONS.map(opt => {
                          const Icon = opt.icon
                          const isActive = industry === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setIndustry(opt.value)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition ${
                                isActive
                                  ? 'border-[#6C2EDB] bg-[rgba(108,46,219,0.06)]'
                                  : 'hover:bg-[var(--surface-background)]'
                              }`}
                              style={!isActive ? { borderColor: 'var(--border)' } : undefined}
                              data-testid={`settings-industry-${opt.value.toLowerCase()}`}
                            >
                              <Icon weight={isActive ? 'fill' : 'regular'} className={`w-5 h-5 ${isActive ? 'text-[#6C2EDB]' : 'text-[var(--text-secondary)]'}`} />
                              <span className={`text-xs font-semibold ${isActive ? 'text-[#6C2EDB]' : 'text-text-primary'}`}>{opt.label}</span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">{opt.desc}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Email</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={settings?.email || ''}
                          readOnly
                          className="flex-1 px-3 py-2.5 rounded-lg text-sm bg-[var(--surface-background)] text-[var(--text-secondary)] border cursor-not-allowed"
                          style={{ borderColor: 'var(--border)' }}
                        />
                        {/* TODO: Change email flow */}
                      </div>
                    </div>

                    <button
                      onClick={() => saveSettings({ firstName, businessName, primaryIndustry: industry })}
                      disabled={saving}
                      className="px-5 py-2.5 bg-[#6C2EDB] text-white rounded-lg text-sm font-semibold hover:bg-[#5B27B5] disabled:opacity-50 transition flex items-center gap-2"
                      data-testid="settings-save-profile-btn"
                    >
                      {saving ? <><SpinnerGap className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                    </button>

                    {/* ── Workspace Theme (4 curated palettes) ── */}
                    <div className="border-t pt-5 mt-5" style={{ borderColor: 'var(--border)' }} data-testid="accent-colour-section">
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-0.5 uppercase tracking-wide">Workspace Theme</label>
                      <p className="text-[11px] text-[var(--text-tertiary)] mb-4">Choose a colour theme for your workspace. Your client-facing brand colours are in the Brand tab.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ACCENT_PALETTES.map(palette => {
                          const isActive = selectedPaletteId === palette.id
                          return (
                            <button
                              key={palette.id}
                              onClick={() => {
                                document.documentElement.style.setProperty('--brand-primary', palette.primary)
                                localStorage.setItem('kolor_palette_id', palette.id)
                                localStorage.setItem('kolor_app_accent', palette.primary)
                                setSelectedPaletteId(palette.id)
                              }}
                              className="flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all min-h-[44px]"
                              style={{
                                borderColor: isActive ? palette.primary : 'var(--border)',
                                background: isActive ? `${palette.primary}08` : 'var(--surface-base)',
                              }}
                              data-testid={`palette-${palette.id}`}
                              aria-pressed={isActive}
                            >
                              <div className="flex-shrink-0 flex gap-1">
                                {palette.preview.map((color, i) => (
                                  <div key={i} className="w-5 h-5 rounded-full border border-white/20" style={{ background: color }} />
                                ))}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-text-primary">{palette.name}</p>
                                <p className="text-[10px] text-[var(--text-tertiary)] truncate">{palette.description}</p>
                              </div>
                              {isActive && (
                                <div className="ml-auto flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: palette.primary }} aria-hidden="true">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Notifications Tab ── */}
              {activeTab === 'notifications' && (
                <div data-testid="settings-notifications-tab">
                  <h2 className="text-base font-bold text-text-primary mb-1">Notifications</h2>
                  <p className="text-xs text-[var(--text-secondary)] mb-6">Choose which email notifications you receive</p>

                  <div className="space-y-4">
                    {[
                      {
                        key: 'weeklyReportEnabled' as const,
                        label: 'Weekly report',
                        desc: 'Every Monday morning \u2014 leads, quotes, acceptance rate, upcoming dates.',
                      },
                      {
                        key: 'staleLeadEmailEnabled' as const,
                        label: 'Stale lead reminders',
                        desc: 'When a lead hasn\'t been contacted in 7 days.',
                      },
                      {
                        key: 'quoteNudgeEmailEnabled' as const,
                        label: 'Quote viewed nudge',
                        desc: 'When a client views your quote but doesn\'t respond after 48 hours.',
                      },
                    ].map(item => (
                      <div
                        key={item.key}
                        className="flex items-start justify-between gap-4 p-4 rounded-lg border"
                        style={{ borderColor: 'var(--border)' }}
                        data-testid={`notification-toggle-${item.key}`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            const newVal = !(settings as any)?.[item.key]
                            saveSettings({ [item.key]: newVal })
                          }}
                          className="flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px]"
                          data-testid={`toggle-${item.key}`}
                        >
                          <div className={`relative w-10 h-6 rounded-full transition-colors ${
                            (settings as any)?.[item.key] ? 'bg-[#6C2EDB]' : 'bg-gray-300'
                          }`}>
                            <span
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                (settings as any)?.[item.key] ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`}
                            />
                          </div>
                        </button>
                      </div>
                    ))}

                    <p className="text-[10px] text-[var(--text-tertiary)] mt-2">
                      Transactional emails (quote sent, contract signed, etc.) are always on and cannot be disabled.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Integrations Tab ── */}
              {activeTab === 'integrations' && (
                <div data-testid="settings-integrations-tab">
                  <h2 className="text-base font-bold text-text-primary mb-1">Integrations</h2>
                  <p className="text-xs text-[var(--text-secondary)] mb-6">Connect your tools</p>

                  <div className="space-y-4">
                    {/* Google Calendar */}
                    <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border)' }} data-testid="integration-google-calendar">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <GoogleLogo className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-text-primary">Google Calendar</p>
                            {calendarConnected && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-200">
                                <CheckCircle weight="fill" className="w-3 h-3" /> Connected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {calendarConnected ? `Connected as ${calendarEmail}` : 'Sync bookings to your calendar'}
                          </p>
                        </div>
                        {calendarConnected ? (
                          <button
                            onClick={async () => {
                              await fetch(`${API_URL}/api/calendar/disconnect`, { method: 'POST', credentials: 'include' })
                              setCalendarConnected(false)
                              toast.success('Calendar disconnected')
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <a
                            href={`${API_URL}/api/calendar/auth`}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#6C2EDB] rounded-lg hover:bg-[#5B27B5] transition"
                          >
                            Connect
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Email domain */}
                    <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-sm font-semibold text-text-primary">Email delivery</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Emails sent from: <span className="font-mono text-text-primary">noreply@kolorstudio.app</span>
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Contact support to use your own domain.</p>
                    </div>

                    {/* Coming soon */}
                    {['Stripe Payments', 'Zapier'].map(name => (
                      <div key={name} className="p-4 rounded-lg border opacity-50" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Plugs className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Coming soon</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Account Tab ── */}
              {activeTab === 'account' && (
                <div data-testid="settings-account-tab">
                  <h2 className="text-base font-bold text-text-primary mb-1">Account</h2>
                  <p className="text-xs text-[var(--text-secondary)] mb-6">Security and account management</p>

                  {/* Change Password */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-text-primary mb-4">Change Password</h3>
                    <div className="space-y-3 max-w-sm">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg text-sm bg-[var(--surface-background)] text-text-primary border focus:ring-2 focus:ring-[#6C2EDB]/20 focus:border-[#6C2EDB] transition pr-10"
                            style={{ borderColor: 'var(--border)' }}
                            data-testid="settings-current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-2.5 top-2.5 text-[var(--text-tertiary)]"
                          >
                            {showPasswords ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">New Password</label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-[var(--surface-background)] text-text-primary border focus:ring-2 focus:ring-[#6C2EDB]/20 focus:border-[#6C2EDB] transition"
                          style={{ borderColor: 'var(--border)' }}
                          data-testid="settings-new-password"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Confirm New Password</label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-[var(--surface-background)] text-text-primary border focus:ring-2 focus:ring-[#6C2EDB]/20 focus:border-[#6C2EDB] transition"
                          style={{ borderColor: 'var(--border)' }}
                          data-testid="settings-confirm-password"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword}
                        className="px-5 py-2.5 bg-[#6C2EDB] text-white rounded-lg text-sm font-semibold hover:bg-[#5B27B5] disabled:opacity-50 transition flex items-center gap-2"
                        data-testid="settings-change-password-btn"
                      >
                        {changingPassword ? <><SpinnerGap className="w-4 h-4 animate-spin" /> Changing...</> : 'Change Password'}
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1.5">
                      <WarningCircle weight="fill" className="w-4 h-4" /> Danger Zone
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-3">
                      Permanently delete your account and all data. This action cannot be undone.
                    </p>
                    {/* TODO: Wire to account deletion endpoint */}
                    <button
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition"
                      onClick={() => toast.error('Account deletion is not yet available. Contact support.')}
                      data-testid="settings-delete-account-btn"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {activeTab === 'pipeline' && (
              <div className="bg-[var(--surface-base)] rounded-xl p-5 sm:p-6" style={{ border: '0.5px solid var(--border)' }}>
                <div data-testid="settings-pipeline-tab">
                  <h2 className="text-base font-bold text-text-primary mb-1">Pipeline</h2>
                  <p className="text-xs text-[var(--text-secondary)] mb-6">Customize your pipeline stage names. These appear as column headers on your Kanban board.</p>
                  <PipelineStageSettings />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Fraunces', label: 'Fraunces' },
  { value: 'Playfair Display', label: 'Playfair' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Libre Baskerville', label: 'Libre Bask.' },
]

function BrandTab({
  settings, brandPrimary, setBrandPrimary, brandAccent, setBrandAccent,
  brandFont, setBrandFont, brandLogoUrl, setBrandLogoUrl,
  uploadingLogo, setUploadingLogo, savingBrand, saveBrand,
}: {
  settings: UserSettings | null
  brandPrimary: string
  setBrandPrimary: (v: string) => void
  brandAccent: string
  setBrandAccent: (v: string) => void
  brandFont: string
  setBrandFont: (v: string) => void
  brandLogoUrl: string | null
  setBrandLogoUrl: (v: string | null) => void
  uploadingLogo: boolean
  setUploadingLogo: (v: boolean) => void
  savingBrand: boolean
  saveBrand: () => void
}) {
  const initials = (settings?.studioName || settings?.firstName || 'K')[0].toUpperCase()

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return }
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const res = await fetch(`${API_URL}/api/settings/brand/logo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setBrandLogoUrl(data.logoUrl)
        toast.success('Logo updated')
      } else {
        toast.error('Failed to upload logo')
      }
    } catch {
      toast.error('Upload failed')
    }
    setUploadingLogo(false)
  }

  return (
    <div data-testid="settings-brand-tab">
      {/* Section 1 — Brand identity */}
      <div className="bg-[var(--surface-base)] rounded-xl p-5 sm:p-6" style={{ border: '0.5px solid var(--border)', marginBottom: 16 }}>
        <h2 className="text-sm font-bold text-text-primary mb-1">Brand identity</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-5">
          These colours and logo appear on your public portfolio, inquiry form, and booking page.
        </p>

        {/* Logo upload */}
        <label className="block text-[11px] font-semibold uppercase text-[var(--text-secondary)] mb-2">Logo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, border: '0.5px solid var(--border)', background: 'var(--surface-background)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} data-testid="brand-logo-preview" />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: brandPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{initials}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ cursor: 'pointer' }} data-testid="brand-logo-upload-btn">
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface-base)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                {uploadingLogo ? <SpinnerGap style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
                {uploadingLogo ? 'Uploading...' : 'Upload logo'}
              </span>
            </label>
            {brandLogoUrl && (
              <button
                onClick={() => setBrandLogoUrl(null)}
                style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                data-testid="brand-logo-remove-btn"
              >
                Remove logo
              </button>
            )}
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
              PNG or SVG · Max 5MB · Appears on portfolio, forms, and booking page
            </p>
          </div>
        </div>

        {/* Colour pickers */}
        {[
          { label: 'Primary colour', value: brandPrimary, setter: setBrandPrimary, id: 'primary' },
          { label: 'Accent colour', value: brandAccent, setter: setBrandAccent, id: 'accent' },
        ].map(({ label, value, setter, id }) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', width: 120, flexShrink: 0 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <input
                type="color"
                value={value}
                onChange={e => setter(e.target.value)}
                style={{ width: 44, height: 44, borderRadius: 8, border: '0.5px solid var(--border)', cursor: 'pointer', padding: 2 }}
                data-testid={`brand-color-${id}`}
              />
              <input
                type="text"
                value={value}
                onChange={e => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setter(v) }}
                maxLength={7}
                style={{ width: 96, height: 44, borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface-background)', padding: '0 10px', fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}
                data-testid={`brand-hex-${id}`}
              />
            </div>
          </div>
        ))}

        {/* Font picker */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Font</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FONT_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => setBrandFont(f.value)}
                style={{
                  padding: '10px 14px', borderRadius: 999, fontSize: 12, cursor: 'pointer', minHeight: 44,
                  fontFamily: f.value, fontWeight: brandFont === f.value ? 600 : 400,
                  border: `0.5px solid ${brandFont === f.value ? '#6C2EDB' : 'var(--border)'}`,
                  background: brandFont === f.value ? 'rgba(108,46,219,0.08)' : 'transparent',
                  color: brandFont === f.value ? '#6C2EDB' : 'var(--text-secondary)',
                  transition: 'all 150ms',
                }}
                data-testid={`brand-font-${f.value}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save brand button */}
        <button
          onClick={saveBrand}
          disabled={savingBrand}
          style={{
            marginTop: 20, height: 40, padding: '0 20px',
            background: '#6C2EDB', color: '#fff',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: savingBrand ? 0.6 : 1,
          }}
          data-testid="brand-save-btn"
        >
          {savingBrand ? <><SpinnerGap style={{ width: 14, height: 14 }} className="animate-spin" /> Saving...</> : 'Save brand'}
        </button>
      </div>

      {/* Section 2 — Live preview */}
      <div className="bg-[var(--surface-base)] rounded-xl p-5 sm:p-6" style={{ border: '0.5px solid var(--border)', marginBottom: 16 }}>
        <h2 className="text-sm font-bold text-text-primary mb-1">Live preview</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          This is how your portfolio, quote, and booking page look with your brand.
        </p>
        <div className="h-[300px] sm:h-[380px] md:h-[420px]">
          <BrandPreview
            primary={brandPrimary}
            accent={brandAccent}
            font={brandFont}
            logoUrl={brandLogoUrl}
          />
        </div>
      </div>

      {/* Section 3 — Portfolio management */}
      <div className="bg-[var(--surface-base)] rounded-xl p-5 sm:p-6" style={{ border: '0.5px solid var(--border)' }}>
        <h2 className="text-sm font-bold text-text-primary mb-1">Portfolio</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Upload and manage the work that appears on your public portfolio page.
        </p>
        <PortfolioSettings />
        <div style={{ borderTop: '0.5px solid var(--border)', marginTop: 24, paddingTop: 24 }}>
          <SharePortfolio />
        </div>
      </div>
    </div>
  )
}


const PIPELINE_STAGES = ['NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATING', 'BOOKED'] as const
const DEFAULT_STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUOTED: 'Quoted',
  NEGOTIATING: 'Negotiating',
  BOOKED: 'Booked',
}

function PipelineStageSettings() {
  const [stageNames, setStageNames] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('kolor_stage_names')
      return stored ? { ...DEFAULT_STAGE_LABELS, ...JSON.parse(stored) } : { ...DEFAULT_STAGE_LABELS }
    } catch { return { ...DEFAULT_STAGE_LABELS } }
  })

  const handleSave = () => {
    const overrides: Record<string, string> = {}
    for (const stage of PIPELINE_STAGES) {
      const val = stageNames[stage]?.trim()
      if (val && val !== DEFAULT_STAGE_LABELS[stage]) {
        overrides[stage] = val
      }
    }
    if (Object.keys(overrides).length > 0) {
      localStorage.setItem('kolor_stage_names', JSON.stringify(overrides))
    } else {
      localStorage.removeItem('kolor_stage_names')
    }
    toast.success('Pipeline stage names saved')
  }

  const handleReset = () => {
    setStageNames({ ...DEFAULT_STAGE_LABELS })
    localStorage.removeItem('kolor_stage_names')
    toast.success('Stage names reset to defaults')
  }

  return (
    <div className="space-y-4">
      {PIPELINE_STAGES.map(stage => (
        <div key={stage} className="flex items-center gap-4" data-testid={`pipeline-stage-${stage.toLowerCase()}`}>
          <label className="w-28 text-xs font-semibold text-[var(--text-secondary)] flex-shrink-0">{DEFAULT_STAGE_LABELS[stage]}</label>
          <input
            value={stageNames[stage] || ''}
            onChange={e => setStageNames(prev => ({ ...prev, [stage]: e.target.value }))}
            placeholder={DEFAULT_STAGE_LABELS[stage]}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm bg-[var(--surface-background)] text-text-primary border focus:ring-2 focus:ring-[#6C2EDB]/20 focus:border-[#6C2EDB] transition"
            style={{ borderColor: 'var(--border)' }}
            data-testid={`pipeline-input-${stage.toLowerCase()}`}
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#6C2EDB] text-white rounded-lg text-sm font-semibold hover:bg-[#5B27B5] transition"
          data-testid="pipeline-save-btn"
        >
          Save Stage Names
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-background)] rounded-lg transition"
          data-testid="pipeline-reset-btn"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
