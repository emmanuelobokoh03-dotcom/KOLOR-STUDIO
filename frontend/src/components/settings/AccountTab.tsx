import UserContactInfo from '../UserContactInfo'
import AccountDangerZone from '../AccountDangerZone'

export default function AccountTab() {
  return (
    <div className="space-y-8" data-testid="account-tab">
      <UserContactInfo onUpdate={() => { /* self-managed save */ }} />
      <AccountDangerZone />
    </div>
  )
}
