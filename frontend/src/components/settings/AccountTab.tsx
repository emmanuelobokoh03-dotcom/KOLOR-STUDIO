import AccountDangerZone from '../AccountDangerZone'

export default function AccountTab() {
  return (
    <div className="space-y-8" data-testid="account-tab">
      <section data-testid="account-contact-info-section">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Contact info</h3>
        <p className="text-sm text-text-secondary">
          Contact info editing will be available in a future update.
        </p>
      </section>
      <AccountDangerZone />
    </div>
  )
}
