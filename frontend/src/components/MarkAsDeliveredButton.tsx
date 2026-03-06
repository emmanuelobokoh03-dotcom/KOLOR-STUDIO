import { useState } from 'react'
import { CheckCircle, Package, Loader2 } from 'lucide-react'
import { leadsApi } from '../services/api'

interface Props {
  leadId: string
  leadStatus: string
  pipelineStatus?: string
  onSuccess: () => void
}

export default function MarkAsDeliveredButton({ leadId, leadStatus, pipelineStatus, onSuccess }: Props) {
  const [marking, setMarking] = useState(false)

  const handleDeliver = async () => {
    if (!confirm(
      'Mark this project as delivered?\n\n' +
      'This will:\n' +
      '- Share all your files with the client\n' +
      '- Send them a delivery notification\n' +
      '- Request a testimonial in 3 days\n' +
      '- Send final payment link (if applicable)\n' +
      '- Update project status to Completed'
    )) return

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
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">Project Delivered</span>
        </div>
        <p className="text-xs text-[#888]">
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
      {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
      {marking ? 'Delivering...' : 'Mark as Delivered'}
    </button>
  )
}
