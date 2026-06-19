import { useState } from 'react';
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Trash } from '@phosphor-icons/react/dist/csr/Trash'
import { leadsApi } from '../services/api';
import KolorSpinner from './KolorSpinner'
import { useConfirm } from './ConfirmProvider'

interface DemoProjectBannerProps {
  demoLeadId: string;
  onDismiss: () => void;
  onDeleted: () => void;
  onExplore?: () => void;
}

export default function DemoProjectBanner({ demoLeadId, onDismiss, onDeleted, onExplore }: DemoProjectBannerProps) {
  const [deleting, setDeleting] = useState(false);
  const { confirm } = useConfirm()

  const handleDelete = async () => {
    const yes = await confirm({ title: 'Delete demo project?', message: 'This cannot be undone.', confirmLabel: 'Delete', variant: 'danger' })
    if (!yes) return;
    setDeleting(true);
    try {
      await leadsApi.delete(demoLeadId);
      onDeleted();
    } catch {
      alert('Failed to delete demo project');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="relative bg-gradient-to-r from-brand-primary-dark/20 to-brand-accent-dark/20 border border-purple-200 rounded-xl p-4 md:p-5 mb-5"
      data-testid="demo-project-banner"
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className="w-9 h-9 bg-brand-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkle className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-purple-600 text-sm md:text-base mb-1">
            Welcome! We created a sample project for you
          </h3>
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed mb-3">
            Click on <strong className="text-text-primary">"Sarah Johnson (Demo)"</strong> below to explore quotes, files, timeline, and more.
            Delete it anytime once you're ready to add your own clients.
          </p>
          {onExplore && (
            <button
              onClick={onExplore}
              className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors underline"
              data-testid="explore-demo-btn"
            >
              Click to explore →
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-red-400 transition-colors disabled:opacity-50"
            data-testid="delete-demo-btn"
          >
            {deleting ? <KolorSpinner size={14} /> : <Trash className="w-3.5 h-3.5" />}
            {deleting ? 'Deleting...' : 'Remove demo project'}
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
          data-testid="dismiss-demo-banner"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
    </div>
  );
}
