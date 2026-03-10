import { LayoutGrid, CalendarDays, Briefcase, Settings } from 'lucide-react'

type ViewMode = 'kanban' | 'list' | 'analytics' | 'calendar' | 'portfolio' | 'sequences';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenSettings: () => void;
}

const NAV_ITEMS: { mode: ViewMode | 'settings'; icon: React.ElementType; label: string }[] = [
  { mode: 'kanban', icon: LayoutGrid, label: 'Dashboard' },
  { mode: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { mode: 'portfolio', icon: Briefcase, label: 'Portfolio' },
  { mode: 'settings', icon: Settings, label: 'Settings' },
];

export default function MobileBottomNav({ viewMode, onViewChange, onOpenSettings }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#333] z-50 lg:hidden safe-bottom"
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV_ITEMS.map(({ mode, icon: Icon, label }) => {
          const isSettings = mode === 'settings';
          const isActive = !isSettings && viewMode === mode;

          return (
            <button
              key={mode}
              onClick={() => isSettings ? onOpenSettings() : onViewChange(mode as ViewMode)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[64px] touch-target transition-all duration-200 ${
                isActive
                  ? 'text-brand-primary-light'
                  : 'text-[#666] active:text-white'
              }`}
              data-testid={`bottom-nav-${mode}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
