import { useUserSettings } from '../../hooks/useUserSettings'

export default function NotificationsTab() {
  const { settings } = useUserSettings()

  if (!settings) {
    return <div className="text-sm text-text-secondary">Loading notification preferences…</div>
  }

  return (
    <div className="space-y-6" data-testid="notifications-tab">
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Email notifications</h3>
        <p className="text-sm text-text-secondary">
          Notification preferences will be available in a future update.
        </p>
      </section>
    </div>
  )
}
