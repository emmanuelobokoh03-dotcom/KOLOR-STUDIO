import { useUserSettings } from '../../hooks/useUserSettings'
import SchedulingSettings from '../SchedulingSettings'

export default function SchedulingTab() {
  const { settings, saving, save } = useUserSettings()

  if (!settings) {
    return <div className="text-sm text-text-secondary">Loading scheduling settings…</div>
  }

  return (
    <div className="space-y-8" data-testid="scheduling-tab">
      <SchedulingSettings userSettings={settings} onSave={save} isSaving={saving} />

      <section
        data-testid="scheduling-email-delivery-info"
        className="bg-surface-muted border border-border rounded-md p-4"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-1">Email delivery</h3>
        <p className="text-xs text-text-secondary">
          Emails send from <code className="font-mono">noreply@kolorstudio.app</code>.
          Contact support to use your own domain.
        </p>
      </section>
    </div>
  )
}
