import { useState } from 'react'
import KolorSpinner from './KolorSpinner'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Package } from '@phosphor-icons/react/dist/csr/Package'
import { leadsApi } from '../services/api'
import { useConfirm } from './ConfirmProvider'

interface Props {
  leadId: string
  leadStatus: string
  pipelineStatus?: string
  onSuccess: () => void
}

export default function MarkAsDeliveredButton({ leadId, leadStatus, pipelineStatus, onSuccess }: Props) {
  const [marking, setMarking] = useState(false)
  const { confirm } = useConfirm()

  const handleDeliver = async () => {
    const yes = await confirm({
      title: 'Mark as delivered?',
      message: 'This will share all files with the client, send a delivery notification, request a testimonial in 3 days, send the final payment link, and update the project status to Completed.',
      confirmLabel: 'Mark delivered',
    })
    if (!yes) return

    setMarking(true)
    try {
      const res = await leadsApi.markAsDelivered(leadId)
      if (res.data) {
        alert(`Project delivered! ${res.data.filesShared} file(s) shared with client.`)
        onSuccess()
      } else {
        alert(res.error || 'Failed to mark as delivered')
      }
    } catch {
      alert('Failed to mark as delivered. Please try again.')
    }
    setMarking(false)
  }

  if (pipelineStatus === 'COMPLETED') {
    return (
      <div className="bg-emerald-950/30 border border-emerald-700/30 rounded-xl p-4" data-testid="delivery-complete-banner">
        <div className="flex items-center gap-2 text-emerald-600 mb-1">
          <CheckCircle weight="fill" className="w-5 h-5" />
          <span className="font-semibold text-sm">Project Delivered</span>
        </div>
        <p className="text-xs text-text-secondary">
          All files shared with client. Testimonial request will be sent automatically.
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={handleDeliver}
      disabled={marking}
      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
      data-testid="mark-delivered-btn"
    >
      {marking ? <KolorSpinner size={16} /> : <Package weight="bold" className="w-4 h-4" />}
      {marking ? 'Delivering...' : 'Mark as Delivered'}
    </button>
  )
}
