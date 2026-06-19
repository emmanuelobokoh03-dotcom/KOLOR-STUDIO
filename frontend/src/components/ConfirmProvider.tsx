import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { Warning } from '@phosphor-icons/react/dist/csr/Warning'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

type ConfirmState = ConfirmOptions & { resolve: (v: boolean) => void }

const ConfirmContext = createContext<{ confirm: (opts: ConfirmOptions) => Promise<boolean> }>({
  confirm: () => Promise.resolve(false),
})

export function useConfirm() {
  return useContext(ConfirmContext)
}

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => setState({ ...opts, resolve }))
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => { state.resolve(false); setState(null) }}
          data-testid="confirm-overlay"
        >
          <div
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            style={{
              background: 'var(--surface-base)',
              borderRadius: 16,
              padding: '24px 20px',
              maxWidth: 360,
              width: '100%',
              border: '0.5px solid var(--border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {state.variant === 'danger' && (
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Warning weight="fill" style={{ width: 20, height: 20, color: '#DC2626' }} />
              </div>
            )}
            <h3 style={{
              fontSize: 15, fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: 8,
            }}>
              {state.title}
            </h3>
            <p style={{
              fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.6, marginBottom: 20, whiteSpace: 'pre-line',
            }}>
              {state.message}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { state.resolve(false); setState(null) }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  background: 'transparent', color: 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600,
                  border: '0.5px solid var(--border)', cursor: 'pointer',
                }}
                data-testid="confirm-cancel"
              >
                {state.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => { state.resolve(true); setState(null) }}
                onTouchStart={(e: React.TouchEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
                onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  background: state.variant === 'danger' ? '#DC2626' : '#6C2EDB',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                }}
                data-testid="confirm-action"
              >
                {state.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
