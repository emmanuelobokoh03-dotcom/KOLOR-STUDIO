import { useSettings } from '../../contexts/SettingsContext'

const fieldInputStyle = {
  background: 'var(--kolor-canvas, #F7F4EE)',
  border: '1px solid var(--kolor-hairline, #E5E0D8)',
  color: 'var(--kolor-ink, #1A1613)',
}
const labelStyle = { color: 'var(--kolor-ink, #1A1613)' }
const sectionEyebrowStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'var(--kolor-ink-muted, #5F5751)',
  marginBottom: 12,
}

export default function MoneyTab() {
  const { settings, availableCurrencies, saving, saved, save } = useSettings()

  if (!settings) {
    return (
      <div
        className="text-sm"
        style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
      >
        Loading money settings…
      </div>
    )
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
        <div style={sectionEyebrowStyle}>Currency</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 rounded-md"
              style={fieldInputStyle}
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
            <label className="block text-sm font-medium mb-1" style={labelStyle}>Symbol position</label>
            <select
              value={settings.currencyPosition}
              onChange={(e) => save({ currencyPosition: e.target.value as any })}
              disabled={saving}
              className="w-full px-3 py-2 rounded-md"
              style={fieldInputStyle}
              data-testid="money-currency-position-select"
            >
              <option value="before">Before amount</option>
              <option value="after">After amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>Number format</label>
            <select
              value={settings.numberFormat}
              onChange={(e) => save({ numberFormat: e.target.value as any })}
              disabled={saving}
              className="w-full px-3 py-2 rounded-md"
              style={fieldInputStyle}
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
        <div style={sectionEyebrowStyle}>Default tax</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>Rate (%)</label>
            <input
              type="number" step="0.01" min="0" max="100"
              value={settings.defaultTaxRate ?? 0}
              onChange={(e) => save({ defaultTaxRate: parseFloat(e.target.value) || 0 })}
              disabled={saving}
              className="w-full px-3 py-2 rounded-md"
              style={fieldInputStyle}
              data-testid="money-tax-rate-input"
            />
          </div>
        </div>
      </section>

      {saved && (
        <span
          className="text-xs"
          style={{ color: 'var(--kolor-terra, #B84A2C)' }}
        >
          Saved
        </span>
      )}
    </div>
  )
}
