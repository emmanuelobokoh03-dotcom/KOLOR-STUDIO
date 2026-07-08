import UserContactInfo from '../UserContactInfo'
import AccountDangerZone from '../AccountDangerZone'

/**
 * Account tab (iter 259).
 *
 * Real UserContactInfo restores name/studio/phone/website editing that
 * the iter 258b placeholder had deferred. AccountDangerZone unchanged.
 */
export default function AccountTab() {
  return (
    <div className="space-y-8" data-testid="account-tab">
      <UserContactInfo />
      <AccountDangerZone />
    </div>
  )
}
