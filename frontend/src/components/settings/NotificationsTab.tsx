import { useUserSettings } from '../../hooks/useUserSettings'

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function NotificationsTab() {
  const { settings, saving, saved, save } = useUserSettings()

  if (!settings) {
    return <div className="text-sm text-text-secondary">Loading notification preferences…</div>
  }

  return (
    <div className="space-y-6" data-testid="notifications-tab">
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Email notifications</h3>
        <div className="divide-y divide-border">
          <label className="flex items-start gap-3 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationsEmail}
              onChange={(e) => save({ notificationsEmail: e.target.checked })}
              disabled={saving}
              className="mt-1"
              data-testid="notifications-email-toggle"
            />
            <div>
              <div className="text-sm font-medium text-text-primary">Email notifications</div>
              <div className="text-xs text-text-secondary">Milestones, contract signatures, quote decisions.</div>
            </div>
          </label>

          <label className="flex items-start gap-3 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.weeklyDigest}
              onChange={(e) => save({ weeklyDigest: e.target.checked })}
              disabled={saving}
              className="mt-1"
              data-testid="notifications-weekly-digest-toggle"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">Weekly digest</div>
              <div className="text-xs text-text-secondary">A summary email at the start of your chosen day.</div>
              {settings.weeklyDigest && (
                <div className="mt-2">
                  <label className="text-xs text-text-secondary block mb-1">Day of week</label>
                  <select
                    value={settings.weeklyDigestDay ?? 'monday'}
                    onChange={(e) => save({ weeklyDigestDay: e.target.value as any })}
                    disabled={saving}
                    className="px-2 py-1 border border-border rounded bg-surface-elevated text-text-primary text-sm"
                    data-testid="notifications-weekly-digest-day-select"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d[0].toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </label>
        </div>
        {saved && <span className="text-xs text-brand-primary">Saved</span>}
      </section>
    </div>
  )
}
