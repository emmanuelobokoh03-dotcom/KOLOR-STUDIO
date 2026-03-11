import { IconProps } from '@phosphor-icons/react';
import { 
  Envelope, 
  FileText, 
  PencilSimple, 
  CurrencyDollar, 
  Camera, 
  CheckCircle,
  User,
  Clock
} from '@phosphor-icons/react';

type LeadStatus = 
  | 'NEW' 
  | 'CONTACTED' 
  | 'QUOTED' 
  | 'BOOKED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'LOST';

const STATUS_CONFIG: Record<string, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<IconProps>;
}> = {
  NEW: {
    label: 'New Lead',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: User,
  },
  CONTACTED: {
    label: 'Contacted',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Envelope,
  },
  QUOTED: {
    label: 'Quote Sent',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: FileText,
  },
  BOOKED: {
    label: 'Booked',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    icon: Camera,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  LOST: {
    label: 'Lost',
    bg: 'bg-gray-50',
    text: 'text-text-tertiary',
    border: 'border-gray-200',
    icon: Clock,
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  const Icon = config.icon;
  
  return (
    <div 
      className={`px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-medium flex items-center gap-1.5 border ${config.border} ${className}`}
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      <Icon weight="fill" className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}
