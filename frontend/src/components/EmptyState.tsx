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
      style={{ textAlign: 'center', padding: '64px 24px' }}
      data-testid="empty-state"
    >
      <p
        className="font-mono-kolor"
        style={{
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.25)',
          marginBottom: 8,
        }}
      >
        {headline}
      </p>

      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 20, lineHeight: 1.6, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
        {description}
      </p>

      <button
        onClick={onCta}
        style={{
          background: '#6C2EDB',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
        data-testid="empty-state-cta"
      >
        {ctaLabel}
      </button>

      {secondaryLabel && onSecondary && (
        <button
          onClick={onSecondary}
          className="block mx-auto mt-3 text-sm font-medium transition-colors duration-fast"
          style={{ color: '#6C2EDB' }}
          data-testid="empty-state-secondary"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
