import { useUserSettings } from '../../hooks/useUserSettings'
import BrandSettings from '../BrandSettings'
import EmailSignatureSettings from '../EmailSignatureSettings'
import PortfolioSettings from '../PortfolioSettings'

export default function BrandStudioTab() {
  const { settings, saving, save } = useUserSettings()

  if (!settings) {
    return <div className="text-sm text-text-secondary">Loading brand settings…</div>
  }

  return (
    <div className="space-y-8" data-testid="brand-studio-tab">
      <BrandSettings userSettings={settings} onSave={save} isSaving={saving} />
      <EmailSignatureSettings />
      <PortfolioSettings userSettings={settings} onSave={save} isSaving={saving} />
    </div>
  )
}
