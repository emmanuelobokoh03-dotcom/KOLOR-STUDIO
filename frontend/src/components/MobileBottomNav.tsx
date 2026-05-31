import { SquaresFour } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { List } from '@phosphor-icons/react/dist/csr/List'
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix'
import { Briefcase } from '@phosphor-icons/react/dist/csr/Briefcase'
type ViewMode = 'kanban' | 'list' | 'analytics' | 'calendar' | 'portfolio' | 'sequences' | 'quotes' | 'contracts';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenSettings: () => void;
}

export default function MobileBottomNav({ viewMode, onViewChange, onOpenSettings }: MobileBottomNavProps) {
  const isActive = (mode: ViewMode) => viewMode === mode

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-light-50 border-t border-light-200 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">

        {/* Today — dashboard home (Phase 4: will become TodayScreen) */}
        <button
          onClick={() => onViewChange('kanban')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 rounded-xl min-w-[72px] min-h-[44px] touch-target transition-all duration-200 ${
            isActive('kanban') ? 'text-purple-600' : 'text-text-tertiary active:text-purple-600'
          }`}
          aria-label="Today"
          data-testid="bottom-nav-today"
        >
          <SquaresFour weight={isActive('kanban') ? 'fill' : 'regular'} className="w-5 h-5" />
          <span className="text-[10px] font-medium">Today</span>
        </button>

        {/* Clients — lead list */}
        <button
          onClick={() => onViewChange('list')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 rounded-xl min-w-[72px] min-h-[44px] touch-target transition-all duration-200 ${
            isActive('list') ? 'text-purple-600' : 'text-text-tertiary active:text-purple-600'
          }`}
          aria-label="Clients"
          data-testid="bottom-nav-clients"
        >
          <List weight={isActive('list') ? 'fill' : 'regular'} className="w-5 h-5" />
          <span className="text-[10px] font-medium">Clients</span>
        </button>

        {/* Portfolio */}
        <button
          onClick={() => onViewChange('portfolio')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[60px] min-h-[44px] touch-target transition-all duration-200 ${
            isActive('portfolio') ? 'text-purple-600' : 'text-text-tertiary active:text-purple-600'
          }`}
          aria-label="Portfolio"
          data-testid="bottom-nav-portfolio"
        >
          <Briefcase weight={isActive('portfolio') ? 'fill' : 'regular'} className="w-5 h-5" />
          <span className="text-[10px] font-medium">Portfolio</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onOpenSettings()}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[60px] min-h-[44px] touch-target transition-all duration-200 text-text-tertiary active:text-purple-600"
          aria-label="Settings"
          data-testid="bottom-nav-settings"
        >
          <GearSix weight="regular" className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>

      </div>
    </nav>
  )
}
