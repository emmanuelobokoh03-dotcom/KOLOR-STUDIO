import { IndustryType } from '../../utils/industryLanguage'
import TodayCard from './TodayCard'
import NeedsAttentionCard from './NeedsAttentionCard'

interface DashboardCardsProps {
  userIndustry?: IndustryType
  currencySymbol?: string
  onLeadClick: (leadId: string, tab?: string) => void
}

/**
 * iter 291-v3a — DashboardCards container. Renders the v3 hero card taxonomy
 * across the dashboard.
 *
 * v3a ships: Today (hero) + Needs Attention (deep view)
 * v3b will add: Pipeline Pulse + Recent Work + Community Pulse
 * v3.1 backlog: Studio Pulse
 *
 * Layout: single column, stacked (per Q13=A mobile spec). Framework-calibrated
 * gap matches Community v3 + Portfolio v3 spacing rhythm.
 */
export function DashboardCards({
  userIndustry,
  currencySymbol,
  onLeadClick,
}: DashboardCardsProps) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      data-testid="dashboard-cards"
    >
      <TodayCard
        userIndustry={userIndustry}
        currencySymbol={currencySymbol}
        onLeadClick={onLeadClick}
      />
      <NeedsAttentionCard onLeadClick={onLeadClick} />

      {/* v3b placeholder — scaffold ready for Pipeline Pulse, Recent Work,
          Community Pulse cards. */}
    </div>
  )
}

export default DashboardCards
