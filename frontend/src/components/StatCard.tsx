import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

type AccentColor = 'brand' | 'green' | 'amber' | 'red'

interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  label: string;
}

interface SparklinePoint {
  value: number;
}

interface StatCardProps {
  icon: PhosphorIcon;
  label: string;
  value: string | number;
  trend: TrendData;
  sparkline: SparklinePoint[];
  accentColor: AccentColor;
  active?: boolean;
  onClick?: () => void;
  testId?: string;
}

const ACCENT = {
  brand: { line: '#6C2EDB', fill: 'rgba(108,46,219,0.12)', iconBg: 'bg-purple-50 border-purple-200', iconText: 'text-purple-500' },
  amber:  { line: '#D97706', fill: 'rgba(217,119,6,0.12)',  iconBg: 'bg-amber-50 border-amber-200',  iconText: 'text-amber-500'  },
  green:  { line: '#059669', fill: 'rgba(5,150,105,0.12)',   iconBg: 'bg-emerald-50 border-emerald-200', iconText: 'text-emerald-500' },
  red:    { line: '#DC2626', fill: 'rgba(220,38,38,0.12)',   iconBg: 'bg-red-50 border-red-200',     iconText: 'text-red-500'    },
} as const;

function Sparkline({ points, color }: { points: SparklinePoint[]; color: AccentColor }) {
  const W = 80, H = 28, PAD = 4;
  const vals = points.map(p => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const coords = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * W,
    y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const fillPath = `${linePath} L${W},${H} L0,${H} Z`;
  const { line, fill } = ACCENT[color];

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path d={fillPath} fill={fill} />
      <path d={linePath} fill="none" stroke={line} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendIndicator({ trend }: { trend: TrendData }) {
  if (trend.direction === 'neutral') {
    return <span className="text-[11px] text-text-tertiary leading-none">{trend.label}</span>;
  }

  const isUp = trend.direction === 'up';

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium leading-none ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
      <svg width="8" height="6" viewBox="0 0 8 6" aria-hidden="true" className={isUp ? '' : 'rotate-180'}>
        <path d="M4 0L8 6H0L4 0Z" fill="currentColor" />
      </svg>
      {trend.label}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  sparkline,
  accentColor,
  active = false,
  onClick,
  testId,
}: StatCardProps) {
  const accent = ACCENT[accentColor];

  return (
    <div
      className={`glass-card rounded-xl p-4 md:p-5 border cursor-pointer hover:border-purple-300 transition-all duration-fast group hover:shadow-lg hover:shadow-brand-primary/5 active:scale-[0.98] ${
        active ? 'border-brand-primary bg-brand-primary/10' : 'border-light-200'
      }`}
      onClick={onClick}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 md:p-2.5 ${accent.iconBg} rounded-xl border group-hover:scale-110 transition-all duration-fast`}>
            <Icon weight="duotone" className={`w-4 h-4 md:w-5 md:h-5 ${accent.iconText}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-bold text-text-primary tabular-nums">{value}</p>
            <p className="font-mono-kolor text-[10px] uppercase tracking-[0.08em] text-text-secondary mb-1">{label}</p>
            <TrendIndicator trend={trend} />
          </div>
        </div>
        <Sparkline points={sparkline} color={accentColor} />
      </div>
    </div>
  );
}
