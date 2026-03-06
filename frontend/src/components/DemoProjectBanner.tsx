import { useState } from 'react';
import { Sparkles, X, Trash2, Loader2 } from 'lucide-react';
import { leadsApi } from '../services/api';

interface DemoProjectBannerProps {
  demoLeadId: string;
  onDismiss: () => void;
  onDeleted: () => void;
}

export default function DemoProjectBanner({ demoLeadId, onDismiss, onDeleted }: DemoProjectBannerProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete the demo project? This cannot be undone.')) return;
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
      className="relative bg-gradient-to-r from-brand-primary-dark/20 to-brand-accent-dark/20 border border-brand-primary-dark/30 rounded-xl p-4 md:p-5 mb-5"
      data-testid="demo-project-banner"
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className="w-9 h-9 bg-brand-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-brand-primary-light" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brand-primary-light text-sm md:text-base mb-1">
            Welcome! We created a sample project for you
          </h3>
          <p className="text-xs md:text-sm text-[#A3A3A3] leading-relaxed mb-3">
            Click on <strong className="text-[#FAFAFA]">"Sarah Johnson (Demo)"</strong> below to explore quotes, files, timeline, and more.
            Delete it anytime once you're ready to add your own clients.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A3A3A3] hover:text-red-400 transition-colors disabled:opacity-50"
            data-testid="delete-demo-btn"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {deleting ? 'Deleting...' : 'Remove demo project'}
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
          data-testid="dismiss-demo-banner"
        >
          <X className="w-4 h-4 text-[#A3A3A3]" />
        </button>
      </div>
    </div>
  );
}
