import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, SpinnerGap, ArrowSquareOut, WarningCircle } from '@phosphor-icons/react'
import { paymentsApi } from '../services/api'

interface PaymentTrackerProps {
  incomeId: string
  totalAmount: number
  currencySymbol?: string
}

export default function PaymentTracker({ incomeId, totalAmount, currencySymbol = '$' }: PaymentTrackerProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<'deposit' | 'final' | null>(null)
  const [error, setError] = useState('')

  const fetchStatus = async () => {
    try {
      const res = await paymentsApi.getStatus(incomeId)
      if (res.data) setStatus(res.data)
    } catch {
      // Income may not have payment data yet
    }
    setLoading(false)
  }

  useEffect(() => { fetchStatus() }, [incomeId])

  const handleSendDeposit = async () => {
    setActionLoading('deposit')
    setError('')
    try {
      const res = await paymentsApi.createDepositCheckout(incomeId)
      if (res.data?.url) {
        window.open(res.data.url, '_blank')
        // Refresh status after a moment
        setTimeout(fetchStatus, 2000)
      } else if (res.error) {
        setError(res.error)
      }
    } catch {
      setError('Failed to create payment link')
    }
    setActionLoading(null)
  }

  const handleSendFinal = async () => {
    setActionLoading('final')
    setError('')
    try {
      const res = await paymentsApi.createFinalCheckout(incomeId)
      if (res.data?.url) {
        window.open(res.data.url, '_blank')
        setTimeout(fetchStatus, 2000)
      } else if (res.error) {
        setError(res.error)
      }
    } catch {
      setError('Failed to create payment link')
    }
    setActionLoading(null)
  }

  if (loading) return null

  const depositAmt = Math.round(totalAmount * 0.3 * 100) / 100
  const finalAmt = Math.round(totalAmount * 0.7 * 100) / 100
  const isStripe = status?.paymentMethod === 'stripe'
  const depositPaid = status?.depositPaid
  const finalPaid = status?.finalPaid

  return (
    <div className="mt-3 bg-[#0F0F0F] rounded-xl border border-[#262626] p-3" data-testid="payment-tracker">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-[#FAFAFA] uppercase tracking-wider">Payment Collection</span>
        {finalPaid && (
          <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            PAID IN FULL
          </span>
        )}
      </div>

      {/* Payment Steps */}
      <div className="space-y-2">
        {/* Step 1: Deposit */}
        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
          depositPaid
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-[#333] bg-[#1A1A1A]'
        }`}>
          <div className="flex items-center gap-2.5">
            {depositPaid ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-medium text-[#FAFAFA]">
                Deposit (30%)
              </p>
              <p className="text-[10px] text-[#888]">
                {currencySymbol}{depositAmt.toLocaleString()}
                {depositPaid && status?.depositPaidAt && (
                  <span className="text-emerald-400 ml-1">
                    Paid {new Date(status.depositPaidAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          {!depositPaid && (
            <button
              onClick={handleSendDeposit}
              disabled={actionLoading === 'deposit'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
              data-testid="send-deposit-btn"
            >
              {actionLoading === 'deposit' ? (
                <SpinnerGap className="w-3 h-3 animate-spin" />
              ) : (
                <ArrowSquareOut className="w-3 h-3" />
              )}
              Collect Deposit
            </button>
          )}
        </div>

        {/* Step 2: Final Payment */}
        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
          finalPaid
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : depositPaid
              ? 'border-[#333] bg-[#1A1A1A]'
              : 'border-[#222] bg-[#151515] opacity-50'
        }`}>
          <div className="flex items-center gap-2.5">
            {finalPaid ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-[#666] shrink-0" />
            )}
            <div>
              <p className="text-xs font-medium text-[#FAFAFA]">
                Final Payment (70%)
              </p>
              <p className="text-[10px] text-[#888]">
                {currencySymbol}{finalAmt.toLocaleString()}
                {finalPaid && status?.finalPaidAt && (
                  <span className="text-emerald-400 ml-1">
                    Paid {new Date(status.finalPaidAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          {depositPaid && !finalPaid && (
            <button
              onClick={handleSendFinal}
              disabled={actionLoading === 'final'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
              data-testid="send-final-btn"
            >
              {actionLoading === 'final' ? (
                <SpinnerGap className="w-3 h-3 animate-spin" />
              ) : (
                <ArrowSquareOut className="w-3 h-3" />
              )}
              Collect Final
            </button>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="mt-2 pt-2 border-t border-[#262626] flex items-center justify-between">
        <span className="text-[10px] text-[#888]">Total project value</span>
        <span className="text-xs font-bold text-[#FAFAFA]">{currencySymbol}{totalAmount.toLocaleString()}</span>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400">
          <WarningCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  )
}
