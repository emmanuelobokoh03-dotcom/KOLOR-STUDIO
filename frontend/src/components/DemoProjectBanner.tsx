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
      className="relative rounded-xl p-4 md:p-5 mb-5"
      style={{
        background: 'var(--kolor-slate-tint, rgba(245, 240, 232, 0.6))',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
      }}
      data-testid="demo-project-banner"
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: 'var(--kolor-canvas, #F7F4EE)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            color: 'var(--kolor-terra, #B84A2C)',
          }}
        >
          <Sparkle className="w-5 h-5" weight="duotone" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm md:text-base mb-1"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--kolor-ink, #1A1613)',
              fontSize: 18,
              lineHeight: 1.2,
            }}
          >
            Welcome. We created a sample project for you.
          </h3>
          <p
            className="text-xs md:text-sm leading-relaxed mb-3"
            style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
          >
            Click on <strong style={{ color: 'var(--kolor-ink, #1A1613)' }}>"Sarah Johnson (Demo)"</strong> below to explore quotes, files, timeline, and more.
            Delete it anytime once you&apos;re ready to add your own clients.
          </p>
          {onExplore && (
            <button
              onClick={onExplore}
              className="mr-4 transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--kolor-terra, #B84A2C)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              data-testid="explore-demo-btn"
            >
              Click to explore →
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
            data-testid="delete-demo-btn"
          >
            {deleting ? <KolorSpinner size={14} /> : <Trash className="w-3.5 h-3.5" />}
            {deleting ? 'Deleting...' : 'Remove demo project'}
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
          data-testid="dismiss-demo-banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
