import { useState, useEffect } from 'react'
import AccountTab from './settings/AccountTab'
import BrandStudioTab from './settings/BrandStudioTab'
import MoneyTab from './settings/MoneyTab'
import SchedulingTab from './settings/SchedulingTab'
import NotificationsTab from './settings/NotificationsTab'
import CommunityProfileSettings from './CommunityProfileSettings'

export type SettingsTab = 'account' | 'brand' | 'money' | 'scheduling' | 'notifications' | 'community'

const VISIBLE_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'brand', label: 'Brand & Studio' },
  { id: 'money', label: 'Money' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'notifications', label: 'Notifications' },
]

interface SettingsModalProps {
  onClose: () => void
  initialTab?: SettingsTab
  onRestartTutorial?: () => void
}

export default function SettingsModal({ onClose, initialTab, onRestartTutorial }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab ?? 'account')

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/50"
      data-testid="settings-modal"
      onClick={onClose}
    >
      <div
        className="bg-surface-elevated rounded-lg shadow-xl w-full max-w-4xl max-h-[90dvh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
          {onRestartTutorial && (
            <button
              onClick={onRestartTutorial}
              className="text-xs text-text-secondary hover:text-text-primary mr-3 underline"
              data-testid="settings-modal-restart-tutorial"
            >
              Restart tutorial
            </button>
          )}
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Close settings"
            data-testid="settings-modal-close"
          >
            ✕
          </button>
        </header>

        <nav
          className="flex gap-1 px-4 pt-3 border-b border-border overflow-x-auto"
          data-testid="settings-modal-tabs"
        >
          {VISIBLE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 text-sm rounded-t-md whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-brand-primary/10 text-brand-primary font-medium border-b-2 border-brand-primary -mb-px'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              data-testid={`${t.id}-tab-btn`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'account' && <AccountTab />}
          {activeTab === 'brand' && <BrandStudioTab />}
          {activeTab === 'money' && <MoneyTab />}
          {activeTab === 'scheduling' && <SchedulingTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'community' && <CommunityProfileSettings />}
        </main>
      </div>
    </div>
  )
}
