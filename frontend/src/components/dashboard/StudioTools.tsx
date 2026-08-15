// iter 289-v3c3c — Extracted from Dashboard.tsx. Studio-tools toggle +
// industry-specific widget conditionals. Widgets themselves live in
// components/IndustryWidgets.tsx and remain unchanged.
//
// Toggle state (`expanded`) is owned by Dashboard.tsx. Widget callbacks
// arrive as props to preserve upstream state ownership.

import { Suspense } from 'react'
import { PhotographyWidgets, FineArtWidgets, DesignWidgets } from '../IndustryWidgets'

type Lead = Parameters<typeof PhotographyWidgets>[0]['onLeadClick'] extends
  (lead: infer L) => void
  ? L
  : never

interface StudioToolsProps {
  user: {
    industry?: string | null
    primaryIndustry?: string | null
  } | null
  expanded: boolean
  onToggle: () => void
  onLeadClick: (lead: Lead) => void
  onAddLead: () => void
  onViewCalendar: () => void
}

const DESIGN_ALIASES = ['DESIGN', 'GRAPHIC_DESIGN', 'WEB_DESIGN', 'BRANDING', 'ILLUSTRATION']

function matchesAny(user: StudioToolsProps['user'], values: string[]): boolean {
  if (!user) return false
  const ind = (user.industry as string) || ''
  const primary = (user.primaryIndustry as string) || ''
  return values.includes(ind) || values.includes(primary)
}

export default function StudioTools({
  user,
  expanded,
  onToggle,
  onLeadClick,
  onAddLead,
  onViewCalendar,
}: StudioToolsProps) {
  const isPhoto = matchesAny(user, ['PHOTOGRAPHY'])
  const isFineArt = matchesAny(user, ['FINE_ART'])
  const isDesign = matchesAny(user, DESIGN_ALIASES)
  const hasIndustry = isPhoto || isFineArt || isDesign

  if (!hasIndustry) return null

  return (
    <Suspense fallback={null}>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[10px] text-text-tertiary hover:text-text-secondary transition mb-2 touch-target"
        data-testid="toggle-industry-widgets"
        aria-expanded={expanded}
      >
        <span>{expanded ? '▾' : '▸'}</span>
        {expanded ? 'Hide studio tools' : 'Show studio tools'}
      </button>

      {expanded && (
        <>
          {isPhoto && (
            <PhotographyWidgets onViewCalendar={onViewCalendar} onLeadClick={onLeadClick} />
          )}
          {isFineArt && <FineArtWidgets onLeadClick={onLeadClick} onAddLead={onAddLead} />}
          {isDesign && <DesignWidgets onLeadClick={onLeadClick} onAddLead={onAddLead} />}
        </>
      )}
    </Suspense>
  )
}
