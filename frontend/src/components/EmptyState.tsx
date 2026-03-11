import { IconProps } from '@phosphor-icons/react';

interface EmptyStateProps {
  icon: React.ComponentType<IconProps>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4" data-testid="empty-state">
      <div className="w-24 h-24 mx-auto mb-6">
        <Icon weight="duotone" className="w-full h-full text-purple-500" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary mb-8 max-w-md mx-auto">{description}</p>
      <button 
        onClick={onAction}
        data-testid="empty-state-cta"
        className="bg-gradient-brand text-white px-6 py-3 rounded-lg font-semibold shadow-elevation-2 hover:shadow-elevation-3 transition-all inline-flex items-center gap-2"
      >
        {actionLabel}
      </button>
    </div>
  );
}
