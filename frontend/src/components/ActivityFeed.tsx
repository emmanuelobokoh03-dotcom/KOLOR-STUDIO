import { useState, useEffect } from 'react'
import {
  ArrowsClockwise,
  UserPlus,
  PaperPlaneTilt,
  FileText,
  CurrencyDollar,
  CalendarCheck,
  ChatCircle,
  Pencil,
  Eye,
  UploadSimple,
  Signature,
  Clock,
  X as XIcon,
} from '@phosphor-icons/react'

interface FeedActivity {
  id: string
  type: string
  description: string
  createdAt: string
  lead?: {
    id: string
    clientName: string
    projectTitle: string
    status: string
  } | null
  user?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

const ACTIVITY_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  STATUS_CHANGE:    { icon: ArrowsClockwise, color: 'text-purple-600',  bg: 'bg-purple-50'  },
  LEAD_CREATED:     { icon: UserPlus,        color: 'text-emerald-600', bg: 'bg-emerald-50'  },
  QUOTE_SENT:       { icon: PaperPlaneTilt,  color: 'text-blue-600',    bg: 'bg-blue-50'     },
  QUOTE_CREATED:    { icon: FileText,        color: 'text-indigo-600',  bg: 'bg-indigo-50'   },
  QUOTE_ACCEPTED:   { icon: CurrencyDollar,  color: 'text-emerald-600', bg: 'bg-emerald-50'  },
  QUOTE_DECLINED:   { icon: XIcon,           color: 'text-red-500',     bg: 'bg-red-50'      },
  BOOKING_CREATED:  { icon: CalendarCheck,   color: 'text-teal-600',    bg: 'bg-teal-50'     },
  NOTE_ADDED:       { icon: ChatCircle,      color: 'text-amber-600',   bg: 'bg-amber-50'    },
  LEAD_UPDATED:     { icon: Pencil,          color: 'text-slate-500',   bg: 'bg-slate-50'    },
  PORTAL_VIEWED:    { icon: Eye,             color: 'text-violet-500',  bg: 'bg-violet-50'   },
  FILE_UPLOADED:    { icon: UploadSimple,    color: 'text-cyan-600',    bg: 'bg-cyan-50'     },
  CONTRACT_CREATED: { icon: Signature,       color: 'text-orange-600',  bg: 'bg-orange-50'   },
  EMAIL_SENT:       { icon: PaperPlaneTilt,  color: 'text-blue-600',    bg: 'bg-blue-50'     },
}
const DEFAULT_ICON = { icon: Clock, color: 'text-text-tertiary', bg: 'bg-light-100' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ActivityFeedProps {
  onLeadClick?: (leadId: string) => void
}

export function ActivityFeed({ onLeadClick }: ActivityFeedProps) {
  const [activities, setActivities] = useState<FeedActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities/recent?limit=10', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch { /* silently fail */ }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-3" data-testid="activity-feed-loading">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-2.5 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-light-200 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 bg-light-200 rounded" />
              <div className="h-2.5 w-1/2 bg-light-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6" data-testid="activity-feed-empty">
        <Clock weight="duotone" className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
        <p className="text-xs text-text-secondary">No activity yet</p>
        <p className="text-[11px] text-text-tertiary mt-0.5">Activity will appear as you work with leads</p>
      </div>
    )
  }

  return (
    <div className="space-y-1" data-testid="activity-feed">
      {activities.map((a) => {
        const cfg = ACTIVITY_ICON[a.type] || DEFAULT_ICON
        const IconComp = cfg.icon
        return (
          <div
            key={a.id}
            className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
              a.lead && onLeadClick ? 'hover:bg-surface-background cursor-pointer' : ''
            }`}
            onClick={() => a.lead && onLeadClick?.(a.lead.id)}
            data-testid={`activity-item-${a.id}`}
          >
            <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <IconComp weight="duotone" className={`w-3.5 h-3.5 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary leading-relaxed line-clamp-2">
                {a.description}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {a.lead && (
                  <>
                    <span className="text-[10px] font-medium text-text-secondary truncate max-w-[100px]">
                      {a.lead.clientName}
                    </span>
                    <span className="text-[10px] text-text-tertiary">·</span>
                  </>
                )}
                <span className="text-[10px] text-text-tertiary">{timeAgo(a.createdAt)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
