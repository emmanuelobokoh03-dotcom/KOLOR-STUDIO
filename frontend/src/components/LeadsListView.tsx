import { useState, useMemo } from 'react'
import {
  PhoneCall,
  DotsThree,
  SquaresFour,
  ArrowLeft,
} from '@phosphor-icons/react'
import { Lead, LeadStatus } from '../services/api'
import { IndustryLanguage } from '../utils/industryLanguage'
import { StatusBadge } from './StatusBadge'

interface LeadsListViewProps {
  leads: Lead[]
  lang: IndustryLanguage
  currencySymbol?: string
  onLeadClick: (lead: Lead) => void
  onLeadClickTab?: (lead: Lead, tab: string) => void
  onEmailLead?: (lead: Lead) => void
}

// ── Helpers ──

const STATUS_AVATAR_COLORS: Record<string, string> = {
  NEW: '#D97706',
  REVIEWING: '#D97706',
  CONTACTED: '#6C2EDB',
  QUALIFIED: '#6C2EDB',
  QUOTED: '#D97706',
  NEGOTIATING: '#6C2EDB',
  BOOKED: '#059669',
  LOST: '#9CA3AF',
}

const TAB_STATUS_MAP: Record<string, LeadStatus[]> = {
  all: [],
  needs_action: [],
  inquiry: ['NEW', 'REVIEWING'],
  discovery: ['CONTACTED', 'QUALIFIED'],
  quoted: ['QUOTED', 'NEGOTIATING'],
  signed: ['BOOKED'],
}

function getDaysStale(updatedAt: string): number {
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000)
}

function formatCurrency(value: number | undefined, symbol = '$'): string {
  if (!value) return '—'
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return `${symbol}${value.toLocaleString()}`
}

function formatKeyDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '—' }
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getStatusContextLabel(lead: Lead, lang: IndustryLanguage): string {
  if (['NEW', 'REVIEWING'].includes(lead.status)) return `New ${lang.lead.toLowerCase()}`
  if (['CONTACTED', 'QUALIFIED'].includes(lead.status)) {
    if (lead.discoveryCallScheduled && !lead.discoveryCallCompletedAt) return `${lang.discoveryCall} scheduled`
    if (lead.discoveryCallCompletedAt) return `${lang.discoveryCall} done`
    return `In ${lang.stages.discovery.toLowerCase()}`
  }
  if (lead.status === 'QUOTED') return `${lang.quote} sent`
  if (lead.status === 'NEGOTIATING') return 'Negotiating'
  if (lead.status === 'BOOKED') return lang.bookingConfirmed
  if (lead.status === 'LOST') return 'Closed'
  return ''
}

function getPrimaryAction(lead: Lead, lang: IndustryLanguage): { label: string; tab: string } {
  if (['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED'].includes(lead.status)) {
    return { label: `Send ${lang.quote}`, tab: 'quotes' }
  }
  if (['QUOTED', 'NEGOTIATING'].includes(lead.status)) {
    return { label: `Send ${lang.contract}`, tab: 'contracts' }
  }
  return { label: 'View signed', tab: 'contracts' }
}

// ── Stats Strip ──

function StatsStrip({ leads, lang, currencySymbol = '$' }: { leads: Lead[]; lang: IndustryLanguage; currencySymbol?: string }) {
  const stats = useMemo(() => {
    const total = leads.length
    const pipeline = leads
      .filter(l => !['BOOKED', 'LOST'].includes(l.status))
      .reduce((sum, l) => sum + (l.estimatedValue || 0), 0)
    const needsAttention = leads.filter(l => {
      if (['BOOKED', 'LOST'].includes(l.status)) return false
      return getDaysStale(l.updatedAt) >= 7
    }).length
    const withValue = leads.filter(l => l.estimatedValue && l.estimatedValue > 0)
    const avgValue = withValue.length > 0 ? Math.round(withValue.reduce((s, l) => s + (l.estimatedValue || 0), 0) / withValue.length) : 0

    return { total, pipeline, needsAttention, avgValue }
  }, [leads])

  const chips = [
    { label: `Total ${lang.leads}`, value: stats.total.toString(), trend: 'all time', color: 'var(--text-secondary)' },
    { label: 'Pipeline value', value: formatCurrency(stats.pipeline, currencySymbol), trend: 'active', color: 'var(--text-secondary)' },
    { label: 'Needs attention', value: stats.needsAttention.toString(), trend: '7+ days stale', color: stats.needsAttention > 0 ? '#D97706' : 'var(--text-secondary)' },
    { label: 'Avg value', value: formatCurrency(stats.avgValue, currencySymbol), trend: 'per lead', color: 'var(--text-secondary)' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4" data-testid="leads-stats-strip">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="rounded-[9px] border border-[var(--border)] bg-[var(--surface-base)] px-3.5 py-3"
          style={{ borderWidth: '0.5px' }}
          data-testid={`stat-${chip.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1">{chip.label}</p>
          <p className="text-xl font-extrabold tabular-nums text-text-primary" style={{ color: chip.color === '#D97706' ? '#D97706' : undefined }}>{chip.value}</p>
          <p className="text-[10px] mt-0.5" style={{ color: chip.color }}>{chip.trend}</p>
        </div>
      ))}
    </div>
  )
}

// ── Tab Row ──

interface TabDef { key: string; label: string }

function TabRow({ tabs, active, onTabChange, leads, lang }: {
  tabs: TabDef[]
  active: string
  onTabChange: (key: string) => void
  leads: Lead[]
  lang: IndustryLanguage
}) {
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length }
    c.needs_action = leads.filter(l => !['BOOKED', 'LOST'].includes(l.status) && getDaysStale(l.updatedAt) >= 7).length
    c.inquiry = leads.filter(l => ['NEW', 'REVIEWING'].includes(l.status)).length
    c.discovery = leads.filter(l => ['CONTACTED', 'QUALIFIED'].includes(l.status)).length
    c.quoted = leads.filter(l => ['QUOTED', 'NEGOTIATING'].includes(l.status)).length
    c.signed = leads.filter(l => l.status === 'BOOKED').length
    return c
  }, [leads])

  return (
    <div
      className="flex items-center gap-1 rounded-[9px] border border-[var(--border)] bg-[var(--surface-base)] p-1 mb-4 overflow-x-auto scrollbar-hide"
      style={{ borderWidth: '0.5px' }}
      data-testid="leads-tab-row"
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-medium whitespace-nowrap transition-all duration-150 ${
            active === tab.key
              ? 'font-bold text-[#6C2EDB]'
              : 'text-[var(--text-secondary)] hover:text-text-primary hover:bg-[var(--surface-background)]'
          }`}
          style={active === tab.key ? { background: 'rgba(108,46,219,0.10)', fontWeight: 700 } : undefined}
          data-testid={`leads-tab-${tab.key}`}
        >
          {tab.label}
          {(counts[tab.key] ?? 0) > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              active === tab.key ? 'bg-purple-200/50 text-[#6C2EDB]' : 'bg-[var(--surface-background)] text-[var(--text-tertiary)]'
            }`}>
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Lead Row ──

function LeadRow({ lead, lang, currencySymbol, onLeadClick, onLeadClickTab }: {
  lead: Lead
  lang: IndustryLanguage
  currencySymbol: string
  onLeadClick: (lead: Lead) => void
  onLeadClickTab?: (lead: Lead, tab: string) => void
}) {
  const daysStale = getDaysStale(lead.updatedAt)
  const isStale = daysStale >= 7 && !['BOOKED', 'LOST'].includes(lead.status)
  const avatarColor = STATUS_AVATAR_COLORS[lead.status] || '#9CA3AF'
  const contextLabel = getStatusContextLabel(lead, lang)
  const primaryAction = getPrimaryAction(lead, lang)

  return (
    <div
      className="grid items-center px-4 py-[11px] cursor-pointer transition-all duration-150 group border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-background)]"
      style={{ gridTemplateColumns: '1fr 80px 96px 72px 80px' }}
      onClick={() => onLeadClick(lead)}
      data-testid={`lead-row-${lead.id}`}
    >
      {/* Client cell */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          style={{ background: avatarColor }}
        >
          {getInitials(lead.clientName)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-primary truncate">{lead.clientName}</span>
            {isStale && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700 flex-shrink-0" data-testid={`stale-badge-${lead.id}`}>
                <span className="w-[5px] h-[5px] rounded-full bg-amber-500 animate-pulse" />
                {daysStale}d
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] truncate">{contextLabel}</p>
        </div>
      </div>

      {/* Type cell */}
      <div className="text-[11px] text-[var(--text-secondary)] truncate">
        {lead.projectType ? lead.projectType.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()) : '—'}
      </div>

      {/* Key date cell */}
      <div className="text-[11px] text-[var(--text-secondary)] tabular-nums">
        {formatKeyDate(lead.keyDate || lead.eventDate)}
      </div>

      {/* Value cell */}
      <div className="text-[11px] font-semibold text-text-primary tabular-nums">
        {formatCurrency(lead.estimatedValue, currencySymbol)}
      </div>

      {/* Quick actions cell — visible on hover */}
      <div className="relative flex items-center justify-end">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150" data-testid={`quick-actions-${lead.id}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onLeadClickTab?.(lead, primaryAction.tab) }}
            className="h-8 px-2.5 rounded-md text-[10px] font-semibold text-white whitespace-nowrap transition-colors"
            style={{ background: '#6C2EDB' }}
            data-testid={`primary-action-${lead.id}`}
          >
            {primaryAction.label}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLeadClick(lead) }}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-text-primary hover:bg-[var(--surface-base)] transition-colors"
            title="Call"
            data-testid={`call-action-${lead.id}`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLeadClick(lead) }}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-text-primary hover:bg-[var(--surface-base)] transition-colors"
            title="More"
            data-testid={`more-action-${lead.id}`}
          >
            <DotsThree className="w-3.5 h-3.5" weight="bold" />
          </button>
        </div>
        {/* Fallback status badge visible when not hovered */}
        <div className="group-hover:hidden">
          <StatusBadge status={lead.status} size="sm" />
        </div>
      </div>
    </div>
  )
}

// ── Pipeline Placeholder ──

function PipelinePlaceholder({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-base)]" style={{ borderWidth: '0.5px' }} data-testid="pipeline-placeholder">
      <SquaresFour weight="duotone" className="w-12 h-12 text-[var(--text-tertiary)] mb-4 opacity-40" />
      <h3 className="text-base font-bold text-text-primary mb-1.5">Pipeline view is coming soon</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
        Drag-and-drop Kanban boards are on the way. For now, use the list view to manage your pipeline.
      </p>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#6C2EDB] bg-purple-50 hover:bg-purple-100 transition-colors"
        data-testid="pipeline-back-btn"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to list
      </button>
    </div>
  )
}

// ── Main Component ──

export default function LeadsListView({ leads, lang, currencySymbol = '$', onLeadClick, onLeadClickTab }: LeadsListViewProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [showPipeline, setShowPipeline] = useState(false)

  const tabs: TabDef[] = [
    { key: 'all', label: 'All' },
    { key: 'needs_action', label: 'Needs action' },
    { key: 'inquiry', label: lang.stages.inquiry },
    { key: 'discovery', label: lang.stages.discovery },
    { key: 'quoted', label: lang.stages.quoted },
    { key: 'signed', label: lang.stages.completed },
  ]

  const filteredLeads = useMemo(() => {
    if (activeTab === 'all') return leads
    if (activeTab === 'needs_action') {
      return leads.filter(l => !['BOOKED', 'LOST'].includes(l.status) && getDaysStale(l.updatedAt) >= 7)
    }
    const statuses = TAB_STATUS_MAP[activeTab]
    if (statuses && statuses.length > 0) return leads.filter(l => statuses.includes(l.status))
    return leads
  }, [leads, activeTab])

  if (showPipeline) {
    return <PipelinePlaceholder onBack={() => setShowPipeline(false)} />
  }

  return (
    <div data-testid="leads-list-view">
      <StatsStrip leads={leads} lang={lang} currencySymbol={currencySymbol} />
      <TabRow tabs={tabs} active={activeTab} onTabChange={setActiveTab} leads={leads} lang={lang} />

      {/* Lead list */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-base)] overflow-hidden"
        style={{ borderWidth: '0.5px' }}
        data-testid="leads-list-table"
      >
        {/* Header */}
        <div
          className="grid items-center px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-background)]"
          style={{ gridTemplateColumns: '1fr 80px 96px 72px 80px' }}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">{lang.client}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Type</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">{lang.keyDate}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Value</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] text-right">Status</span>
        </div>

        {/* Rows */}
        {filteredLeads.length === 0 ? (
          <div className="py-16 text-center" data-testid="leads-list-empty">
            <p className="text-sm text-[var(--text-secondary)] mb-1">No {lang.leads.toLowerCase()} match this filter</p>
            <button onClick={() => setActiveTab('all')} className="text-xs text-[#6C2EDB] font-medium hover:underline">
              View all
            </button>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <LeadRow
              key={lead.id}
              lead={lead}
              lang={lang}
              currencySymbol={currencySymbol}
              onLeadClick={onLeadClick}
              onLeadClickTab={onLeadClickTab}
            />
          ))
        )}
      </div>
    </div>
  )
}
