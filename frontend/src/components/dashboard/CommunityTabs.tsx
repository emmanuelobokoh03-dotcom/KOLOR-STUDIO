// iter 289-v3c3c — Extracted from Dashboard.tsx. Community sub-nav
// (Feed / Discover / Messages) with v3c3b framework calibration:
// mono UPPERCASE 11px 0.28em, Terra active bottom border, ink-subtle
// inactive. Pending-DM dot on the Messages tab from v3c3a.
//
// State remains in Dashboard.tsx. Tab clicks call `onTabChange` which
// updates communityTab state AND the ?subtab= URL param (Dashboard
// owns setSearchParams).

export type CommunityTab = 'feed' | 'discover' | 'dms'

interface CommunityTabsProps {
  activeTab: CommunityTab
  onTabChange: (tab: CommunityTab) => void
  pendingDMCount: number
}

export default function CommunityTabs({ activeTab, onTabChange, pendingDMCount }: CommunityTabsProps) {
  return (
    <div
      className="flex gap-0 border-b px-4 sticky top-0 z-10"
      style={{ borderColor: 'var(--kolor-hairline)', background: 'var(--kolor-canvas)' }}
    >
      {(['feed', 'discover', 'dms'] as const).map((tab) => {
        const active = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            data-testid={`community-tab-${tab}`}
            className="relative"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: active ? 'var(--kolor-ink)' : 'var(--kolor-ink-subtle)',
              background: 'transparent',
              border: 'none',
              padding: '14px 16px',
              cursor: 'pointer',
              borderBottom: active ? '1px solid var(--kolor-terra)' : '1px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {tab === 'dms' ? 'Messages' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'dms' && pendingDMCount > 0 && (
              <span
                data-testid="community-tab-dms-pending-dot"
                aria-label={`${pendingDMCount} pending message request${pendingDMCount === 1 ? '' : 's'}`}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--kolor-terra)',
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
