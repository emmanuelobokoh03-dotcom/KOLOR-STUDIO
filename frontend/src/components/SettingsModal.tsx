import { useState, useEffect } from 'react'
import { 
  X, 
  Settings, 
  DollarSign, 
  Loader2, 
  Save,
  Check,
  Globe,
  Percent,
  Image as ImageIcon
} from 'lucide-react'
import { settingsApi, UserSettings, CurrencyOption } from '../services/api'
import { formatCurrency, NUMBER_FORMAT_OPTIONS } from '../utils/currency'
import PortfolioSettings from './PortfolioSettings'

interface SettingsModalProps {
  onClose: () => void;
  onSettingsUpdate?: (settings: UserSettings) => void;
}

type SettingsTab = 'currency' | 'portfolio';

export default function SettingsModal({ onClose, onSettingsUpdate }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('currency')
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
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-dark-card rounded-2xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-dark-border"
        onClick={e => e.stopPropagation()}
        data-testid="settings-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Settings</h2>
                <p className="text-violet-100 text-sm">Manage your preferences</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-6 px-1">
            <button
              onClick={() => setActiveTab('currency')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === 'currency'
                  ? 'bg-dark-card text-white'
                  : 'bg-white/10 text-violet-100 hover:bg-white/20'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Currency
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === 'portfolio'
                  ? 'bg-dark-card text-white'
                  : 'bg-white/10 text-violet-100 hover:bg-white/20'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Portfolio
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'portfolio' ? (
            <PortfolioSettings />
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

          {/* Currency Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Globe className="w-4 h-4 text-violet-400" />
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-violet-500"
              data-testid="currency-select"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.symbol} ({c.name})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Symbol Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="useCustomSymbol"
              checked={useCustomSymbol}
              onChange={(e) => setUseCustomSymbol(e.target.checked)}
              className="w-4 h-4 rounded border-dark-border bg-dark-bg-secondary text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="useCustomSymbol" className="text-sm text-gray-400">
              Use custom currency symbol
            </label>
          </div>

          {useCustomSymbol && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Custom Symbol
              </label>
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.slice(0, 5))}
                placeholder="e.g., $, €, ₦"
                className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-violet-500"
                maxLength={5}
                data-testid="custom-symbol-input"
              />
            </div>
          )}

          {/* Symbol Position */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 text-violet-400" />
              Symbol Position
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCurrencyPosition('BEFORE')}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition ${
                  currencyPosition === 'BEFORE'
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-dark-bg-secondary border-dark-border text-gray-300 hover:border-violet-500/50'
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
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-dark-bg-secondary border-dark-border text-gray-300 hover:border-violet-500/50'
                }`}
                data-testid="position-after"
              >
                After (100{effectiveSymbol})
              </button>
            </div>
          </div>

          {/* Number Format */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
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
                      ? 'bg-violet-900/30 border-violet-600 text-white'
                      : 'bg-dark-bg-secondary border-dark-border text-gray-300 hover:border-violet-500/50'
                  }`}
                  data-testid={`format-${opt.value.replace(/[,.]/g, '')}`}
                >
                  <span className="text-sm">{opt.label}</span>
                  <span className="text-gray-400 text-sm">Example: {opt.example}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Default Tax Rate */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Percent className="w-4 h-4 text-violet-400" />
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
                className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-violet-500 pr-12"
                placeholder="0"
                data-testid="tax-rate-input"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This will be pre-filled when creating new quotes
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-700/50 rounded-xl p-4">
            <p className="text-xs text-violet-400 font-medium mb-2 uppercase tracking-wide">Preview</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(previewAmount, {
                currencySymbol: effectiveSymbol,
                currencyPosition,
                numberFormat: numberFormat as any,
              })}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              This is how amounts will appear in quotes and the dashboard
            </p>
          </div>
            </div>
          )}
        </div>

        {/* Footer - only show for currency tab */}
        {activeTab === 'currency' && (
        <div className="p-6 border-t border-dark-border flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:bg-dark-card-hover rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-500'
            } disabled:opacity-50`}
            data-testid="save-settings-btn"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
        )}
      </div>
    </div>
  )
}
