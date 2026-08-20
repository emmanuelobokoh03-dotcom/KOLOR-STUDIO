import { IndustryType } from '../../utils/industryLanguage'
import TodayCard from './TodayCard'
import NeedsAttentionCard from './NeedsAttentionCard'
import PipelinePulseCard from './PipelinePulseCard'
import RecentWorkCard from './RecentWorkCard'
import CommunityPulseCard from './CommunityPulseCard'

interface DashboardCardsProps {
  userIndustry?: IndustryType
  currencySymbol?: string
  onLeadClick: (leadId: string, tab?: string) => void
  onViewClients: () => void
  onViewPortfolio: () => void
  onViewCommunity: () => void
}

/**
 * iter 291-v3a — DashboardCards container. Renders the v3 hero card taxonomy
 * across the dashboard.
 *
 * iter 291-v3b — Full 5-card taxonomy shipped:
 *   1. Today (hero)
 *   2. Needs Attention (deep view)
 *   3. Pipeline Pulse (stage counts)
 *   4. Recent Work (portfolio items)
 *   5. Community Pulse (engagement activity)
 *
 * v3.1 backlog: Studio Pulse (6th card, deferred per Q8=B).
 *
 * Layout: single column, stacked (per Q13=A mobile spec). Framework-calibrated
 * gap matches Community v3 + Portfolio v3 spacing rhythm.
 */
export function DashboardCards({
  userIndustry,
  currencySymbol,
  onLeadClick,
  onViewClients,
  onViewPortfolio,
  onViewCommunity,
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
      <PipelinePulseCard onViewClients={onViewClients} />
      <RecentWorkCard onViewPortfolio={onViewPortfolio} />
      <CommunityPulseCard onViewCommunity={onViewCommunity} />
    </div>
  )
}

export default DashboardCards
