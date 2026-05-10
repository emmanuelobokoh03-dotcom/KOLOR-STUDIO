import { useEffect, useState } from 'react';
import KolorSpinner from './KolorSpinner';
import { TrendUp } from '@phosphor-icons/react/dist/csr/TrendUp'
const API_URL = import.meta.env.VITE_API_URL || '';

interface PipelineStage {
  count: number;
  value: number;
  clients: Array<{ name: string; value: number }>;
}

interface PipelineData {
  quoteSent: PipelineStage;
  contractSigned: PipelineStage;
  depositPaid: PipelineStage;
  inProgress: PipelineStage;
  paidInFull: PipelineStage;
}

const STAGES = [
  { key: 'quoteSent', name: 'Quotes Sent', icon: '📋', headerBg: '#F5F0FF', headerBorder: '#DDD6FE', headerText: '#5B21B6', valueBg: '#FDFCFF', valueText: '#5B21B6' },
  { key: 'contractSigned', name: 'Contract', icon: '✍️', headerBg: '#FFF8F0', headerBorder: '#FDDCB5', headerText: '#92400E', valueBg: '#FFFBF7', valueText: '#92400E' },
  { key: 'depositPaid', name: 'Deposit Paid', icon: '💰', headerBg: '#F0FDF4', headerBorder: '#BBF7D0', headerText: '#14532D', valueBg: '#F7FDF9', valueText: '#14532D' },
  { key: 'inProgress', name: 'In Progress', icon: '🚀', headerBg: '#FFFBEB', headerBorder: '#FDE68A', headerText: '#78350F', valueBg: '#FFFDF5', valueText: '#92400E' },
  { key: 'paidInFull', name: 'Paid in Full', icon: '🎉', headerBg: '#F0F9FF', headerBorder: '#BAE6FD', headerText: '#0C4A6E', valueBg: '#F7FBFF', valueText: '#0C4A6E' },
] as const;

export default function RevenuePipelineWidget() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Iter 178 — Dashboard init now parallel (iter-172); no need to defer.
    fetch(`${API_URL}/api/analytics/revenue-pipeline`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        setPipeline(data.pipeline);
        setTotalValue(data.totalValue || 0);
        setCurrencySymbol(data.currencySymbol || '$');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-base border border-light-200 rounded-xl p-6 space-y-3">
        <div className="h-4 w-32 ks-shimmer rounded" />
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-24 ks-shimmer rounded opacity-70" />
              <div className="h-3 w-16 ks-shimmer rounded opacity-70" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!pipeline) return null;

  const hasData = Object.values(pipeline).some(s => s.count > 0);

  return (
    <div className="bg-surface-base border border-light-200 rounded-xl p-5" data-testid="revenue-pipeline-widget">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendUp weight="duotone" className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-semibold text-text-primary">Revenue Pipeline</h3>
        </div>
        <span className="text-xs text-text-tertiary">Autopilot Tracker</span>
      </div>

      {!hasData ? (
        <p className="text-sm text-text-tertiary text-center py-4">No pipeline data yet. Send your first quote to get started.</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2" data-testid="pipeline-stages">
            {STAGES.map(stage => {
              const data = pipeline[stage.key as keyof PipelineData];
              return (
                <div key={stage.key} className="min-w-[110px] flex-1 transition-transform hover:scale-[1.03] motion-reduce:hover:scale-100">
                  <div
                    className="rounded-t-lg py-3 px-2 text-center"
                    style={{ background: stage.headerBg, border: `1px solid ${stage.headerBorder}`, borderBottom: 'none' }}
                  >
                    <div className="text-2xl mb-1">{stage.icon}</div>
                    <div className="text-[10px] font-semibold leading-tight" style={{ color: stage.headerText }}>{stage.name}</div>
                  </div>
                  <div
                    className="rounded-b-lg py-3 px-2 text-center"
                    style={{ background: stage.valueBg, border: `1px solid ${stage.headerBorder}`, borderTop: 'none' }}
                  >
                    <div className="text-xl font-bold" style={{ color: stage.valueText }}>{data.count}</div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {currencySymbol}{data.value.toLocaleString()}
                    </div>
                    {data.clients.length > 0 && (
                      <div className="mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${stage.headerBorder}` }}>
                        <span className="text-[10px] text-text-tertiary truncate block">
                          {data.clients[0].name}{data.clients.length > 1 ? ` +${data.clients.length - 1}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-light-200 flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Total Pipeline Value</span>
            <span className="text-lg font-bold text-text-primary">{currencySymbol}{totalValue.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
}
