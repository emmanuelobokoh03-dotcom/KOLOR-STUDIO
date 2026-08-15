// iter 289-v3c3b Workstream 5 — Admin seed dashboard.
// Route: /admin/seed. Env-guarded OR email allowlist per backend
// /api/admin/requireAdmin middleware. Users without access see a 403
// message rather than a broken page.

import { useState } from 'react'
import { toast } from 'sonner'

const API = (import.meta as any).env?.VITE_API_URL || ''

type Result = { ok?: boolean; error?: string; [k: string]: unknown }

const ACTIONS: Array<{ key: string; label: string; endpoint: string; hint: string }> = [
  {
    key: 'seed-pending-thread',
    label: 'Seed pending thread',
    endpoint: '/api/admin/seed-pending-thread',
    hint: 'Creates a PENDING DMThread from a random synthetic profile + notification.',
  },
  {
    key: 'trigger-featured-work-cron',
    label: 'Trigger featured work cron',
    endpoint: '/api/admin/trigger-featured-work-cron',
    hint: 'Recomputes FeaturedWork rankings. Community feed banner should populate.',
  },
  {
    key: 'trigger-featured-creator-cron',
    label: 'Trigger creators of the week cron',
    endpoint: '/api/admin/trigger-featured-creator-cron',
    hint: 'Recomputes FeaturedCreator rankings for the Community rail.',
  },
  {
    key: 'trigger-peer-cron',
    label: 'Trigger peer suggestion cron',
    endpoint: '/api/admin/trigger-peer-cron',
    hint: 'Recomputes PeerSuggestion pairs. Appears on shot detail pages.',
  },
  {
    key: 'backfill-subheadlines',
    label: 'Backfill sub-headlines',
    endpoint: '/api/admin/backfill-subheadlines',
    hint: 'Assigns deterministic sub-chip taxonomy value to each synthetic profile.',
  },
]

export default function AdminSeed() {
  const [running, setRunning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, Result>>({})

  const run = async (key: string, endpoint: string) => {
    setRunning(key)
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }))
      setResults((prev) => ({ ...prev, [key]: { status: res.status, ...data } }))
      if (res.ok) toast.success(`${key} — OK`)
      else toast.error(`${key} — ${data.error || res.status}`)
    } catch (e: any) {
      setResults((prev) => ({ ...prev, [key]: { error: e?.message || 'network error' } }))
      toast.error(`${key} — network error`)
    }
    setRunning(null)
  }

  return (
    <div
      data-testid="admin-seed-page"
      style={{
        minHeight: '100vh',
        background: 'var(--kolor-canvas)',
        padding: '64px 32px',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--kolor-ink-subtle)',
            marginBottom: '8px',
          }}
        >
          Admin · Demo data
        </p>
        <h1
          style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontSize: '32px',
            fontWeight: 400,
            color: 'var(--kolor-ink)',
            marginBottom: '12px',
          }}
        >
          Seeding &amp; cron triggers
        </h1>
        <p style={{ color: 'var(--kolor-ink-muted)', fontSize: '14px', maxWidth: '640px' }}>
          Dev-only tooling. Endpoints require <code>ADMIN_ROUTES_ENABLED=true</code> in the backend
          environment or the caller&apos;s email in <code>ADMIN_EMAILS</code>.
        </p>

        <div style={{ marginTop: '48px', display: 'grid', gap: '24px' }}>
          {ACTIONS.map((action) => {
            const busy = running === action.key
            const result = results[action.key]
            return (
              <div
                key={action.key}
                data-testid={`admin-action-${action.key}`}
                style={{
                  border: '1px solid var(--kolor-hairline)',
                  padding: '20px 24px',
                  background: 'var(--kolor-canvas)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: 'Fraunces, serif',
                        fontStyle: 'italic',
                        fontSize: '18px',
                        color: 'var(--kolor-ink)',
                        marginBottom: '4px',
                      }}
                    >
                      {action.label}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--kolor-ink-muted)' }}>{action.hint}</p>
                  </div>
                  <button
                    data-testid={`admin-action-${action.key}-run`}
                    disabled={busy}
                    onClick={() => run(action.key, action.endpoint)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.28em',
                      textTransform: 'uppercase',
                      color: busy ? 'var(--kolor-ink-subtle)' : 'var(--kolor-terra)',
                      background: 'transparent',
                      border: '1px solid var(--kolor-terra)',
                      padding: '10px 18px',
                      borderRadius: '2px',
                      cursor: busy ? 'wait' : 'pointer',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    {busy ? 'Running…' : 'Run'}
                  </button>
                </div>
                {result && (
                  <pre
                    data-testid={`admin-action-${action.key}-result`}
                    style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: 'var(--kolor-canvas-shade-1)',
                      border: '1px solid var(--kolor-hairline)',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: 'var(--kolor-ink)',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
