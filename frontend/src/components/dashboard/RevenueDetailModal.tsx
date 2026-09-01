// iter 293-v3.1-v3a — Revenue detail modal.
//
// Opened by clicking the RevenueHero metric or goal on Today view (Q1a=a).
// Wraps existing RevenueDashboard (recharts BarChart + monthly stats) +
// RevenueGoalWidget (goal editing) in a framework-calibrated modal shell.

import { lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { useModalA11y } from '../../hooks/useModalA11y'

const RevenueDashboard = lazy(() => import('../RevenueDashboard'))
const RevenueGoalWidget = lazy(() => import('../RevenueGoalWidget'))

interface RevenueDetailModalProps {
  onClose: () => void
  bookedThisYear: number
  currencySymbol: string
  lang: { leads: string }
}

export default function RevenueDetailModal({
  onClose,
  bookedThisYear,
  currencySymbol,
  lang,
}: RevenueDetailModalProps) {
  const modalRef = useModalA11y(true, onClose)

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(26, 22, 19, 0.55)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="rounded-2xl w-full max-w-2xl max-h-[90dvh] overflow-hidden animate-in fade-in duration-200 flex flex-col"
        style={{
          background: 'var(--kolor-canvas, #F7F4EE)',
          border: '1px solid var(--kolor-hairline, #E5E0D8)',
          boxShadow: '0 24px 60px rgba(26, 22, 19, 0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="revenue-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="revenue-detail-title"
      >
        {/* Header */}
        <div
          className="p-6 flex items-center justify-between"
          style={{
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
            borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
          }}
        >
          <div>
            <div
              className="text-[10px] font-mono uppercase tracking-[0.14em] mb-1"
              style={{ color: 'var(--kolor-ink-muted, #5F5751)' }}
            >
              Revenue
            </div>
            <h2
              id="revenue-detail-title"
              className="text-xl italic"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 500,
                color: 'var(--kolor-ink, #1A1613)',
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              Your earnings, close-up
            </h2>
          </div>
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
            data-testid="revenue-detail-close"
            aria-label="Close revenue detail"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <Suspense
            fallback={
              <div
                className="rounded-2xl h-40 ks-shimmer"
                style={{
                  background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                }}
              />
            }
          >
            <RevenueDashboard />
          </Suspense>
          <Suspense
            fallback={
              <div
                className="rounded-xl h-24 ks-shimmer"
                style={{
                  background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                }}
              />
            }
          >
            <RevenueGoalWidget
              bookedThisYear={bookedThisYear}
              currencySymbol={currencySymbol}
              lang={lang}
            />
          </Suspense>
        </div>
      </div>
    </div>,
    document.body
  )
}
