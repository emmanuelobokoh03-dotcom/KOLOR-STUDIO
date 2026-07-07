import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const TABS = [
  { path: 'account', label: 'Account' },
  { path: 'brand', label: 'Brand & Studio' },
  { path: 'money', label: 'Money' },
  { path: 'scheduling', label: 'Scheduling' },
  { path: 'notifications', label: 'Notifications' },
] as const

export default function Settings() {
  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary" data-testid="settings-page-title">
            Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Account, brand, money, scheduling, and notifications.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          <nav className="space-y-1" data-testid="settings-nav">
            {TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary font-medium'
                      : 'text-text-primary hover:bg-surface-muted'
                  }`
                }
                data-testid={`settings-nav-${tab.path}`}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <main className="min-w-0">
            <Suspense fallback={<div className="text-sm text-text-secondary">Loading…</div>}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
