import { useEffect, useState } from 'react';
import { SpinnerGap, TrendUp } from '@phosphor-icons/react';

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
  { key: 'quoteSent', name: 'Quotes Sent', icon: '📋', bg: 'bg-blue-500', text: 'text-blue-600' },
  { key: 'contractSigned', name: 'Contract', icon: '✍️', bg: 'bg-purple-500', text: 'text-purple-400' },
  { key: 'depositPaid', name: 'Deposit Paid', icon: '💰', bg: 'bg-green-500', text: 'text-green-400' },
  { key: 'inProgress', name: 'In Progress', icon: '🚀', bg: 'bg-orange-500', text: 'text-orange-400' },
  { key: 'paidInFull', name: 'Paid in Full', icon: '🎉', bg: 'bg-emerald-500', text: 'text-emerald-600' },
] as const;

export default function RevenuePipelineWidget() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <div className="bg-white border border-light-200 rounded-xl p-6 flex items-center justify-center h-40">
        <SpinnerGap className="w-5 h-5 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (!pipeline) return null;

  const hasData = Object.values(pipeline).some(s => s.count > 0);

  return (
    <div className="bg-white border border-light-200 rounded-xl p-5" data-testid="revenue-pipeline-widget">
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
                <div key={stage.key} className="min-w-[110px] flex-1 transition-transform hover:scale-[1.03]">
                  <div className={`${stage.bg} text-white rounded-t-lg py-3 px-2 text-center`}>
                    <div className="text-2xl mb-1">{stage.icon}</div>
                    <div className="text-[10px] font-medium leading-tight">{stage.name}</div>
                  </div>
                  <div className="bg-light-100 border border-t-0 border-light-200 rounded-b-lg py-3 px-2 text-center">
                    <div className={`text-xl font-bold ${stage.text}`}>{data.count}</div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {currencySymbol}{data.value.toLocaleString()}
                    </div>
                    {data.clients.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-light-200">
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
