// iter Settings v3-v3a — SettingsModal framework calibration + Answer B
// restructure (Brand + Communications split) + Q1a=a (Community exposed)
// + W3 lazy-load all tabs + SettingsTabSkeleton Suspense fallback.

import { lazy, Suspense, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { SettingsProvider } from '../contexts/SettingsContext'
import { useModalA11y } from '../hooks/useModalA11y'
import SettingsTabSkeleton from './settings/SettingsTabSkeleton'

const AccountTab = lazy(() => import('./settings/AccountTab'))
const BrandTab = lazy(() => import('./settings/BrandStudioTab'))
const CommunicationsTab = lazy(() => import('./settings/CommunicationsTab'))
const MoneyTab = lazy(() => import('./settings/MoneyTab'))
const SchedulingTab = lazy(() => import('./settings/SchedulingTab'))
const NotificationsTab = lazy(() => import('./settings/NotificationsTab'))
const CommunityProfileSettings = lazy(() => import('./CommunityProfileSettings'))

export type SettingsTab =
  | 'account'
  | 'brand'
  | 'communications'
  | 'money'
  | 'scheduling'
  | 'notifications'
  | 'community'

const VISIBLE_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'brand', label: 'Brand' },
  { id: 'communications', label: 'Communications' },
  { id: 'money', label: 'Money' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'community', label: 'Community' },
]

interface SettingsModalProps {
  onClose: () => void
  initialTab?: SettingsTab
  onRestartTutorial?: () => void
}

export default function SettingsModal({ onClose, initialTab, onRestartTutorial }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab ?? 'account')
  const modalRef = useModalA11y(true, onClose)

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  return createPortal(
    <SettingsProvider>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
        style={{ background: 'rgba(26, 22, 19, 0.55)' }}
        data-testid="settings-modal"
        onClick={onClose}
        role="presentation"
      >
        <div
          ref={modalRef}
          className="rounded-2xl w-full max-w-4xl max-h-[90dvh] overflow-hidden flex flex-col animate-in fade-in duration-200"
          style={{
            background: 'var(--kolor-canvas, #F7F4EE)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            boxShadow: '0 24px 60px rgba(26, 22, 19, 0.18)',
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          <header
            className="flex items-center justify-between px-6 py-5"
            style={{
              background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
              borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
            }}
          >
            <div>
              <div
                className="text-[10px] font-mono uppercase tracking-[0.24em]"
                style={{ color: 'var(--kolor-ink-muted, #5F5751)', marginBottom: 4 }}
              >
                Preferences
              </div>
              <h2
                id="settings-modal-title"
                className="text-xl italic"
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 500,
                  color: 'var(--kolor-ink, #1A1613)',
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                Settings
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {onRestartTutorial && (
                <button
                  onClick={onRestartTutorial}
                  className="text-[10px] font-mono uppercase tracking-[0.14em] px-3 py-2 rounded transition-colors"
                  style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)' }}
                  data-testid="settings-modal-restart-tutorial"
                >
                  Restart tutorial
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors duration-150"
                style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--kolor-canvas, #F7F4EE)'
                  e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
                }}
                aria-label="Close settings"
                title="Close (Esc)"
                data-testid="settings-modal-close"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
          </header>

          <nav
            className="flex gap-1 px-4 pt-3 overflow-x-auto scroll-smooth"
            style={{ borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)' }}
            data-testid="settings-modal-tabs"
          >
            {VISIBLE_TABS.map((t) => {
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex-shrink-0 px-3 py-2.5 whitespace-nowrap transition-colors relative"
                  style={{
                    fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: isActive
                      ? 'var(--kolor-terra, #B84A2C)'
                      : 'var(--kolor-ink-muted, #5F5751)',
                    borderBottom: isActive
                      ? '2px solid var(--kolor-terra, #B84A2C)'
                      : '2px solid transparent',
                    marginBottom: -1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--kolor-ink, #1A1613)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--kolor-ink-muted, #5F5751)'
                  }}
                  data-testid={`${t.id}-tab-btn`}
                >
                  {t.label}
                </button>
              )
            })}
          </nav>

          <main className="flex-1 overflow-y-auto px-6 py-6">
            <Suspense fallback={<SettingsTabSkeleton />}>
              {activeTab === 'account' && <AccountTab />}
              {activeTab === 'brand' && <BrandTab />}
              {activeTab === 'communications' && <CommunicationsTab />}
              {activeTab === 'money' && <MoneyTab />}
              {activeTab === 'scheduling' && <SchedulingTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'community' && <CommunityProfileSettings />}
            </Suspense>
          </main>
        </div>
      </div>
    </SettingsProvider>,
    document.body
  )
}
