import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

interface EmptyStateProps {
  icon: PhosphorIcon;
  headline: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyState({
  icon: Icon,
  headline,
  description,
  ctaLabel,
  onCta,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 md:py-24 px-6 text-center"
      data-testid="empty-state"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mb-6">
        <Icon weight="duotone" className="w-7 h-7 text-brand-600" />
      </div>

      <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
        {headline}
      </h3>

      <p className="text-sm text-text-secondary max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      <button
        onClick={onCta}
        className="w-full max-w-xs px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors duration-fast"
        data-testid="empty-state-cta"
      >
        {ctaLabel}
      </button>

      {secondaryLabel && onSecondary && (
        <button
          onClick={onSecondary}
          className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors duration-fast"
          data-testid="empty-state-secondary"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
