import { useState, useEffect } from 'react'
import {
  Warning,
  Clock,
  Phone,
  Envelope,
  Flame,
  Snowflake,
  CaretRight,
  Bell,
  ArrowsClockwise
} from '@phosphor-icons/react'

interface CRMAlert {
  id: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  type: 'FOLLOW_UP' | 'NEW_LEAD' | 'HOT_LEAD' | 'COLD_LEAD'
  message: string
  leadId: string
  leadName: string
  projectTitle: string
  action: string
}

interface CRMApiResponse {
  alerts: CRMAlert[]
}

const ALERT_CONFIG: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  FOLLOW_UP: { icon: Clock, colorClass: 'text-amber-700', bgClass: 'bg-amber-400/10' },
  NEW_LEAD: { icon: Warning, colorClass: 'text-red-400', bgClass: 'bg-red-400/10' },
  HOT_LEAD: { icon: Flame, colorClass: 'text-orange-400', bgClass: 'bg-orange-400/10' },
  COLD_LEAD: { icon: Snowflake, colorClass: 'text-blue-600', bgClass: 'bg-blue-400/10' },
}

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
  LOW: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
}

export default function CRMAlerts({ onLeadClick }: { onLeadClick?: (leadId: string) => void }) {
  const [alerts, setAlerts] = useState<CRMAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || ''
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/crm/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data: CRMApiResponse = await res.json()
        setAlerts(data.alerts)
      }
    } catch (err) {
      console.error('Failed to fetch CRM alerts:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAlerts() }, [])

  const displayed = showAll ? alerts : alerts.slice(0, 5)
  const highCount = alerts.filter(a => a.priority === 'HIGH').length

  return (
    <div className="bg-light-50 rounded-2xl border border-light-200 overflow-hidden" data-testid="crm-alerts">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-light-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">CRM Alerts</h3>
            <p className="text-xs text-text-tertiary">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
              {highCount > 0 && <span className="text-red-400 ml-1">({highCount} urgent)</span>}
            </p>
          </div>
        </div>
        <button onClick={fetchAlerts} className="p-2 rounded-lg hover:bg-light-100 transition-colors" data-testid="refresh-alerts">
          <ArrowsClockwise className={`w-4 h-4 text-text-tertiary ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-[#262626] max-h-[320px] overflow-y-auto">
        {loading && alerts.length === 0 ? (
          <div className="p-4 md:p-8 text-center text-text-tertiary text-sm">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-4 md:p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
              <Bell className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-text-secondary">All caught up! No alerts.</p>
          </div>
        ) : (
          displayed.map(alert => {
            const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.FOLLOW_UP
            const Icon = config.icon
            return (
              <div
                key={alert.id}
                className="px-5 py-3 flex items-center gap-3 hover:bg-light-100 transition-colors cursor-pointer group"
                onClick={() => onLeadClick?.(alert.leadId)}
                data-testid={`alert-${alert.id}`}
              >
                <div className={`w-8 h-8 rounded-lg ${config.bgClass} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.colorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-text-primary truncate">{alert.leadName}</span>
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${PRIORITY_BADGE[alert.priority]}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{alert.message}</p>
                </div>
                <CaretRight className="w-4 h-4 text-text-primary group-hover:text-text-secondary transition-colors flex-shrink-0" />
              </div>
            )
          })
        )}
      </div>

      {/* Show More */}
      {alerts.length > 5 && (
        <div className="px-5 py-3 border-t border-light-200">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-brand-primary hover:text-purple-600 transition-colors font-medium"
            data-testid="show-all-alerts"
          >
            {showAll ? 'Show Less' : `Show All ${alerts.length} Alerts`}
          </button>
        </div>
      )}
    </div>
  )
}
