import { useState, useEffect } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'
import {
  X,
  GearSix,
  CurrencyDollar,
  SpinnerGap,
  FloppyDisk,
  Check,
  Globe,
  Percent,
  Palette,
  ChatText,
  ArrowCounterClockwise,
  Warning,
  UserCircleMinus,
  EnvelopeSimple,
  CalendarBlank,
} from '@phosphor-icons/react'
import { settingsApi, UserSettings, CurrencyOption } from '../services/api'
import { formatCurrency, NUMBER_FORMAT_OPTIONS } from '../utils/currency'
import BrandSettings from './BrandSettings'
import TestimonialsManagement from './TestimonialsManagement'
import AccountDangerZone from './AccountDangerZone'
import EmailSignatureSettings from './EmailSignatureSettings'
import SchedulingSettings from './SchedulingSettings'

interface SettingsModalProps {
  onClose: () => void;
  onSettingsUpdate?: (settings: UserSettings) => void;
  onRestartTutorial?: () => void;
  initialTab?: SettingsTab;
}

type SettingsTab = 'currency' | 'brand' | 'testimonials' | 'email' | 'scheduling' | 'account';

export default function SettingsModal({ onClose, onSettingsUpdate, onRestartTutorial, initialTab }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'currency')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  
  const [_settings, setSettings] = useState<UserSettings | null>(null)
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([])
  
  // Form state
  const [currency, setCurrency] = useState('USD')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [currencyPosition, setCurrencyPosition] = useState<'BEFORE' | 'AFTER'>('BEFORE')
  const [numberFormat, setNumberFormat] = useState('1,000.00')
  const [defaultTaxRate, setDefaultTaxRate] = useState(0)
  const [customSymbol, setCustomSymbol] = useState('')
  const [useCustomSymbol, setUseCustomSymbol] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    const result = await settingsApi.get()
    
    if (result.data) {
      const s = result.data.settings
      setSettings(s)
      setCurrency(s.currency)
      setCurrencySymbol(s.currencySymbol)
      setCurrencyPosition(s.currencyPosition as 'BEFORE' | 'AFTER')
      setNumberFormat(s.numberFormat)
      setDefaultTaxRate(s.defaultTaxRate)
      setCurrencies(result.data.availableCurrencies)
      
      // Check if symbol is custom
      const matchingCurrency = result.data.availableCurrencies.find(c => c.code === s.currency)
      if (matchingCurrency && matchingCurrency.symbol !== s.currencySymbol) {
        setUseCustomSymbol(true)
        setCustomSymbol(s.currencySymbol)
      }
    } else {
      setError('Failed to load settings')
    }
    
    setLoading(false)
  }

  const handleCurrencyChange = (code: string) => {
    setCurrency(code)
    if (!useCustomSymbol) {
      const selected = currencies.find(c => c.code === code)
      if (selected) {
        setCurrencySymbol(selected.symbol)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    
    const symbol = useCustomSymbol ? customSymbol : currencySymbol
    
    const result = await settingsApi.update({
      currency,
      currencySymbol: symbol,
      currencyPosition,
      numberFormat,
      defaultTaxRate: Number(defaultTaxRate) || 0,
    })
    
    setSaving(false)
    
    if (result.error) {
      setError(result.message || 'Failed to save settings')
      return
    }
    
    if (result.data?.settings) {
      setSettings(result.data.settings)
      onSettingsUpdate?.(result.data.settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  // Preview amount
  const previewAmount = 2500.00
  const effectiveSymbol = useCustomSymbol ? customSymbol : currencySymbol

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" role="presentation">
        <div className="bg-surface-base rounded-2xl p-6 md:p-8" role="status" aria-label="Loading settings">
          <SpinnerGap className="w-8 h-8 animate-spin text-brand-primary" aria-hidden="true" />
          <span className="sr-only">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={onClose} role="presentation">
      <div 
        className={`glass-modal md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col border-t md:border border-light-200 transition-all duration-300 ${
          activeTab === 'brand' || activeTab === 'testimonials' || activeTab === 'scheduling' ? 'md:max-w-5xl' : 'md:max-w-2xl'
        }`}
        onClick={e => e.stopPropagation()}
        data-testid="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary text-white p-4 md:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GearSix weight="duotone" className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
              <div>
                <h2 id="settings-title" className="text-xl font-bold">Settings</h2>
                <p className="text-purple-600 text-sm">Manage your preferences</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Close settings" title="Close (Esc)"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-6 px-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('currency')}
              className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === 'currency'
                  ? 'bg-surface-base text-text-primary'
                  : 'bg-white/20 text-white/90 hover:text-white hover:bg-white/30'
              }`}
            >
              <CurrencyDollar weight="duotone" className="w-4 h-4" />
              Currency
            </button>
            <button
              onClick={() => setActiveTab('brand')}
              className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === 'brand'
                  ? 'bg-surface-base text-text-primary'
                  : 'bg-white/20 text-white/90 hover:text-white hover:bg-white/30'
              }`}
              data-testid="brand-tab"
            >
              <Palette className="w-4 h-4" />
              Brand
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === 'testimonials'
                  ? 'bg-surface-base text-text-primary'
                  : 'bg-white/20 text-white/90 hover:text-white hover:bg-white/30'
              }`}
              data-testid="testimonials-tab"
              data-tour="settings-reviews"
            >
              <ChatText className="w-4 h-4" />
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('scheduling')}
              className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === 'scheduling'
                  ? 'bg-surface-base text-text-primary'
                  : 'bg-white/20 text-white/90 hover:text-white hover:bg-white/30'
              }`}
              data-testid="scheduling-tab"
            >
              <CalendarBlank className="w-4 h-4" />
              Scheduling
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === 'email'
                  ? 'bg-surface-base text-text-primary'
                  : 'bg-white/20 text-white/90 hover:text-white hover:bg-white/30'
              }`}
              data-testid="email-tab"
            >
              <EnvelopeSimple className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === 'account'
                  ? 'bg-surface-base text-text-primary'
                  : 'bg-white/20 text-white/90 hover:text-white hover:bg-white/30'
              }`}
              data-testid="account-tab"
            >
              <UserCircleMinus className="w-4 h-4" />
              Account
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'brand' ? (
            <BrandSettings />
          ) : activeTab === 'testimonials' ? (
            <TestimonialsManagement />
          ) : activeTab === 'scheduling' ? (
            <SchedulingSettings />
          ) : activeTab === 'email' ? (
            <EmailSignatureSettings />
          ) : activeTab === 'account' ? (
            <AccountDangerZone />
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

          {/* Currency Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
              <Globe className="w-4 h-4 text-purple-600" />
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-4 py-3 bg-light-100 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500"
              data-testid="currency-select"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.symbol} ({c.name})
                </option>
              ))}
            </select>
            {/* PSP indicator — updates when currency changes */}
            {(() => {
              const isPaystackCurrency = new Set(['NGN', 'GHS', 'ZAR', 'KES']).has(currency)
              return (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg mt-2"
                  style={{
                    background: isPaystackCurrency ? 'rgba(0,196,140,0.08)' : 'rgba(99,91,255,0.08)',
                    border: `1px solid ${isPaystackCurrency ? 'rgba(0,196,140,0.2)' : 'rgba(99,91,255,0.2)'}`,
                  }}
                  data-testid="psp-indicator"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isPaystackCurrency ? '#10b981' : '#818cf8' }}
                  />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {isPaystackCurrency
                      ? `Payments in ${currency} will be processed via Paystack`
                      : `Payments in ${currency} will be processed via Stripe`}
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Custom Symbol Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="useCustomSymbol"
              checked={useCustomSymbol}
              onChange={(e) => setUseCustomSymbol(e.target.checked)}
              className="w-4 h-4 rounded border-light-200 bg-light-100 text-brand-primary focus:ring-purple-500"
            />
            <label htmlFor="useCustomSymbol" className="text-sm text-text-secondary">
              Use custom currency symbol
            </label>
          </div>

          {useCustomSymbol && (
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Custom Symbol
              </label>
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.slice(0, 5))}
                placeholder="e.g., $, €, ₦"
                className="w-full px-4 py-3 bg-light-100 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500"
                maxLength={5}
                data-testid="custom-symbol-input"
              />
            </div>
          )}

          {/* Symbol Position */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
              <CurrencyDollar className="w-4 h-4 text-purple-600" />
              Symbol Position
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCurrencyPosition('BEFORE')}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition ${
                  currencyPosition === 'BEFORE'
                    ? 'bg-brand-primary border-brand-primary text-white'
                    : 'bg-light-100 border-light-200 text-text-secondary hover:border-purple-300'
                }`}
                data-testid="position-before"
              >
                Before ({effectiveSymbol}100)
              </button>
              <button
                type="button"
                onClick={() => setCurrencyPosition('AFTER')}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition ${
                  currencyPosition === 'AFTER'
                    ? 'bg-brand-primary border-brand-primary text-white'
                    : 'bg-light-100 border-light-200 text-text-secondary hover:border-purple-300'
                }`}
                data-testid="position-after"
              >
                After (100{effectiveSymbol})
              </button>
            </div>
          </div>

          {/* Number Format */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">
              Number Format
            </label>
            <div className="space-y-2">
              {NUMBER_FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNumberFormat(opt.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-left transition flex items-center justify-between ${
                    numberFormat === opt.value
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-light-100 border-light-200 text-text-secondary hover:border-purple-300'
                  }`}
                  data-testid={`format-${opt.value.replace(/[,.]/g, '')}`}
                >
                  <span className="text-sm">{opt.label}</span>
                  <span className="text-text-secondary text-sm">Example: {opt.example}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Default Tax Rate */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
              <Percent className="w-4 h-4 text-purple-600" />
              Default Tax Rate
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                className="w-full px-4 py-3 bg-light-100 border border-light-200 rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 pr-12"
                placeholder="0"
                data-testid="tax-rate-input"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">%</span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              This will be pre-filled when creating new quotes
            </p>
          </div>

          {/* Preview */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-xs text-purple-600 font-medium mb-2 uppercase tracking-wide">Preview</p>
            <p className="text-3xl font-bold text-purple-700">
              {formatCurrency(previewAmount, {
                currencySymbol: effectiveSymbol,
                currencyPosition,
                numberFormat: numberFormat as any,
              })}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              This is how amounts will appear in quotes and the dashboard
            </p>
          </div>
            </div>
          )}
        </div>

        {/* Footer - only show for currency tab */}
        {activeTab === 'currency' && (
        <div className="p-6 border-t border-light-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:bg-light-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-brand-primary text-white hover:bg-brand-primary'
            } disabled:opacity-50`}
            data-testid="save-settings-btn"
          >
            {saving ? (
              <SpinnerGap className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <FloppyDisk className="w-4 h-4" />
            )}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
        )}

        {/* Restart Tutorial */}
        {onRestartTutorial && (
          <div className="px-6 pb-4 border-t border-light-200 pt-4 flex-shrink-0">
            <button
              onClick={() => { onRestartTutorial(); onClose(); }}
              className="flex items-center gap-2 text-sm text-text-tertiary hover:text-purple-400 transition-colors"
              data-testid="restart-tutorial-btn"
            >
              <ArrowCounterClockwise className="w-4 h-4" />
              Restart Setup Tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
