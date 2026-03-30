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
} from '@phosphor-icons/react'

const API_URL = import.meta.env.VITE_API_URL || ''

type Tab = 'profile' | 'notifications' | 'integrations' | 'account'

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

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Calendar status
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarEmail, setCalendarEmail] = useState('')

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
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'integrations', label: 'Integrations', icon: Plugs },
    { key: 'account', label: 'Account', icon: Shield },
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
            <div className="md:hidden flex gap-1 rounded-lg bg-[var(--surface-base)] p-1 mb-4" style={{ border: '0.5px solid var(--border)' }}>
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition ${
                      activeTab === tab.key
                        ? 'bg-[rgba(108,46,219,0.10)] text-[#6C2EDB] font-bold'
                        : 'text-[var(--text-secondary)]'
                    }`}
                    data-testid={`settings-tab-${tab.key}`}
                  >
                    <Icon weight={activeTab === tab.key ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
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
                      <div className="grid grid-cols-3 gap-2">
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
                          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                            (settings as any)?.[item.key] ? 'bg-[#6C2EDB]' : 'bg-gray-300'
                          }`}
                          data-testid={`toggle-${item.key}`}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              (settings as any)?.[item.key] ? 'translate-x-[18px]' : 'translate-x-0.5'
                            }`}
                          />
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
          </div>
        </div>
      </div>
    </div>
  )
}
