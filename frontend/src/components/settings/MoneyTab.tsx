import { useSettings } from '../../contexts/SettingsContext'

export default function MoneyTab() {
  const { settings, availableCurrencies, saving, saved, save } = useSettings()

  if (!settings) {
    return <div className="text-sm text-text-secondary">Loading money settings…</div>
  }

  const onCurrencyChange = (code: string) => {
    const c = availableCurrencies.find((c) => c.code === code)
    save({
      currency: code,
      currencySymbol: c?.symbol ?? settings.currencySymbol,
    })
  }

  return (
    <div className="space-y-8" data-testid="money-tab">
      <section data-testid="money-currency-section">
        <h3 className="text-lg font-semibold text-text-primary mb-3">Currency</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
              data-testid="money-currency-select"
            >
              {availableCurrencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Symbol position</label>
            <select
              value={settings.currencyPosition}
              onChange={(e) => save({ currencyPosition: e.target.value as any })}
              disabled={saving}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
              data-testid="money-currency-position-select"
            >
              <option value="before">Before amount</option>
              <option value="after">After amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Number format</label>
            <select
              value={settings.numberFormat}
              onChange={(e) => save({ numberFormat: e.target.value as any })}
              disabled={saving}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
              data-testid="money-number-format-select"
            >
              <option value="1,234.56">1,234.56</option>
              <option value="1.234,56">1.234,56</option>
              <option value="1 234.56">1 234.56</option>
            </select>
          </div>
        </div>
      </section>

      <section data-testid="money-tax-section">
        <h3 className="text-lg font-semibold text-text-primary mb-3">Default tax</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Rate (%)</label>
            <input
              type="number" step="0.01" min="0" max="100"
              value={settings.defaultTaxRate ?? 0}
              onChange={(e) => save({ defaultTaxRate: parseFloat(e.target.value) || 0 })}
              disabled={saving}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-text-primary"
              data-testid="money-tax-rate-input"
            />
          </div>
        </div>
      </section>

      {saved && <span className="text-xs text-brand-primary">Saved</span>}
    </div>
  )
}
