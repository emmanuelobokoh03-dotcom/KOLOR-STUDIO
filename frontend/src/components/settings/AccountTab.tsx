import UserContactInfo from '../UserContactInfo'
import AccountDangerZone from '../AccountDangerZone'
import AvatarUploadSection from './AvatarUploadSection'

/**
 * Account tab (iter 259).
 *
 * Real UserContactInfo restores name/studio/phone/website editing that
 * the iter 258b placeholder had deferred. AccountDangerZone unchanged.
 *
 * iter 293-v3.1-v3b — AvatarUploadSection added at TOP (Q3c=a). Supabase
 * `avatars` bucket, 2MB cap, JPG/PNG/WebP.
 */
export default function AccountTab() {
  return (
    <div className="space-y-8" data-testid="account-tab">
      <AvatarUploadSection />
      <UserContactInfo />
      <AccountDangerZone />
    </div>
  )
}
