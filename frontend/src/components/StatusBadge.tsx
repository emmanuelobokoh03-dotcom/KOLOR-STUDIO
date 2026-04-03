// Left-border accent badge for lead statuses.
// Follows the Linear-style pattern: colored left border, tinted background, dark text.

type LeadStatus =
  | 'NEW'
  | 'REVIEWING'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'QUOTED'
  | 'NEGOTIATING'
  | 'BOOKED'
  | 'LOST'
  | 'COMPLETED';

interface StatusConfig {
  label: string;
  border: string;   // border-l color
  bg: string;        // tinted background
  text: string;      // text color
}

const STATUS_CONFIG: Record<LeadStatus, StatusConfig> = {
  // Inquiry stage — slate / gray
  NEW: {
    label: 'New',
    border: 'border-l-slate-400',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
  },
  // Discovery stages — brand purple
  REVIEWING: {
    label: 'Reviewing',
    border: 'border-l-brand-600',
    bg: 'bg-brand-50',
    text: 'text-brand-700',
  },
  CONTACTED: {
    label: 'Contacted',
    border: 'border-l-brand-500',
    bg: 'bg-brand-50',
    text: 'text-brand-700',
  },
  QUALIFIED: {
    label: 'Qualified',
    border: 'border-l-brand-600',
    bg: 'bg-brand-50',
    text: 'text-brand-700',
  },
  // Quoted — accent warm (amber)
  QUOTED: {
    label: 'Quoted',
    border: 'border-l-accent-500',
    bg: 'bg-accent-50',
    text: 'text-accent-700',
  },
  // Negotiating — blue
  NEGOTIATING: {
    label: 'Negotiating',
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  // Contracted / Booked — green
  BOOKED: {
    label: 'Booked',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  // Completed — deep green
  COMPLETED: {
    label: 'Completed',
    border: 'border-l-green-600',
    bg: 'bg-green-50',
    text: 'text-green-800',
  },
  // Lost — muted slate
  LOST: {
    label: 'Lost',
    border: 'border-l-slate-300',
    bg: 'bg-slate-50/70',
    text: 'text-slate-500',
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as LeadStatus] || STATUS_CONFIG.NEW;

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center font-mono-kolor font-medium border-l-[3px] rounded-r-md uppercase tracking-[0.04em] ${config.border} ${config.bg} ${config.text} ${sizeClasses} ${className}`}
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      {config.label}
    </span>
  );
}
