import { useNavigate, useLocation } from 'react-router-dom'
import { SquaresFour, CalendarDots, List, GearSix } from '@phosphor-icons/react'

type ViewMode = 'kanban' | 'list' | 'analytics' | 'calendar' | 'portfolio' | 'sequences' | 'quotes' | 'contracts';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenSettings: () => void;
}

export default function MobileBottomNav({ viewMode, onViewChange, onOpenSettings }: MobileBottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isCalendar = location.pathname === '/calendar'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-light-50 border-t border-light-200 z-50 lg:hidden safe-bottom"
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        <button
          onClick={() => onViewChange('kanban')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[64px] min-h-[44px] touch-target transition-all duration-200 ${
            viewMode === 'kanban' && !isCalendar ? 'text-purple-600' : 'text-text-tertiary active:text-purple-600'
          }`}
          aria-label="Dashboard"
          data-testid="bottom-nav-kanban"
        >
          <SquaresFour weight={viewMode === 'kanban' && !isCalendar ? 'fill' : 'regular'} className="w-5 h-5" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => onViewChange('list')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[64px] min-h-[44px] touch-target transition-all duration-200 ${
            viewMode === 'list' && !isCalendar ? 'text-purple-600' : 'text-text-tertiary active:text-purple-600'
          }`}
          aria-label="Leads"
          data-testid="bottom-nav-leads"
        >
          <List weight={viewMode === 'list' && !isCalendar ? 'fill' : 'regular'} className="w-5 h-5" />
          <span className="text-[10px] font-medium">Leads</span>
        </button>

        <button
          onClick={() => navigate('/calendar')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[64px] min-h-[44px] touch-target transition-all duration-200 ${
            isCalendar ? 'text-purple-600' : 'text-text-tertiary active:text-purple-600'
          }`}
          aria-label="Calendar"
          data-testid="bottom-nav-calendar"
        >
          <CalendarDots weight={isCalendar ? 'fill' : 'regular'} className="w-5 h-5" />
          <span className="text-[10px] font-medium">Calendar</span>
        </button>

        <button
          onClick={() => onOpenSettings()}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[64px] min-h-[44px] touch-target transition-all duration-200 text-text-tertiary active:text-purple-600"
          aria-label="Settings"
          data-testid="bottom-nav-settings"
        >
          <GearSix weight="regular" className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
}
