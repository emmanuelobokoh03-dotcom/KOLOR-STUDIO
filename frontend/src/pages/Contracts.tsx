import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  PaperPlaneTilt,
  Eye,
  DotsThree,
  FileText,
  Copy,
  Trash,
  PencilSimple,
  SpinnerGap,
  CheckCircle,
  ShieldCheck,
  Clock,
  X,
  ArrowSquareOut,
  Confetti,
} from '@phosphor-icons/react'
import {
  Contract,
  ContractStatus,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  contractsApi,
  Lead,
} from '../services/api'
import { IndustryLanguage } from '../utils/industryLanguage'
import { EmptyState } from '../components/EmptyState'
import EmailComposer from '../components/EmailComposer'
import { trackEvent } from '../utils/analytics'

interface ContractsPageProps {
  lang: IndustryLanguage
  user?: any
  leads?: Lead[]
  onLeadClick?: (lead: Lead) => void
  onLeadClickTab?: (lead: Lead, tab: string) => void
}

// ── Helpers ──

function getDaysSince(dateStr?: string): number {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '\u2014'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_AVATAR_COLORS: Record<string, string> = {
  DRAFT: 'var(--border-dark, #6B7280)',
  SENT: '#6C2EDB',
  VIEWED: '#E8891A',
  AGREED: '#10B981',
}

const STATUS_BORDER_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  DRAFT: { border: 'var(--border-dark, #4B5563)', bg: 'rgba(107,114,128,0.06)', text: 'var(--text-secondary)' },
  SENT: { border: '#6C2EDB', bg: 'rgba(108,46,219,0.06)', text: '#4C1D95' },
  VIEWED: { border: '#E8891A', bg: 'rgba(232,137,26,0.06)', text: '#92400E' },
  AGREED: { border: '#10B981', bg: 'rgba(16,185,129,0.06)', text: '#065F46' },
}

const TAB_STATUS_MAP: Record<string, ContractStatus[]> = {
  all: [],
  draft: ['DRAFT'],
  sent: ['SENT'],
  viewed: ['VIEWED'],
  signed: ['AGREED'],
}

// ── Stats Strip ──

function StatsStrip({ contracts, lang }: { contracts: Contract[]; lang: IndustryLanguage }) {
  const stats = useMemo(() => {
    const total = contracts.length
    const draft = contracts.filter(c => c.status === 'DRAFT').length
    const awaiting = contracts.filter(c => c.status === 'SENT' || c.status === 'VIEWED').length
    const signed = contracts.filter(c => c.status === 'AGREED').length
    const sentForRate = Math.max(contracts.filter(c => c.status !== 'DRAFT').length, 1)
    const signRate = Math.round((signed / sentForRate) * 100)
    const thisMonth = contracts.filter(c => {
      const d = new Date(c.createdAt)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { total, draft, awaiting, signed, signRate, thisMonth }
  }, [contracts])

  const chips = [
    {
      label: 'Total',
      value: stats.total.toString(),
      trend: `${stats.thisMonth} this month`,
      trendColor: stats.thisMonth > 0 ? '#059669' : 'var(--text-secondary)',
    },
    {
      label: 'Awaiting signature',
      value: stats.awaiting.toString(),
      trend: stats.awaiting > 0 ? 'Follow up now' : 'All responded',
      trendColor: stats.awaiting > 0 ? '#D97706' : '#059669',
    },
    {
      label: 'Signed',
      value: stats.signed.toString(),
      trend: stats.signed > 0 ? 'Booked' : 'None yet',
      trendColor: stats.signed > 0 ? '#059669' : 'var(--text-secondary)',
    },
    {
      label: 'Sign rate',
      value: `${stats.signRate}%`,
      trend: `${stats.signed} of ${Math.max(contracts.filter(c => c.status !== 'DRAFT').length, 1)} signed`,
      trendColor: 'var(--text-secondary)',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4" data-testid="contracts-stats-strip">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="rounded-lg bg-[var(--surface-base)] px-3.5 py-3"
          style={{ border: '0.5px solid var(--border)' }}
          data-testid={`stat-${chip.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1">{chip.label}</p>
          <p className="text-xl font-extrabold tabular-nums text-text-primary" style={{ color: chip.label === 'Awaiting signature' && parseInt(chip.value) > 0 ? '#D97706' : undefined }}>{chip.value}</p>
          <p className="text-[10px] mt-0.5" style={{ color: chip.trendColor }}>{chip.trend}</p>
        </div>
      ))}
    </div>
  )
}

// ── Tab Row ──

function TabRow({ tabs, active, onTabChange, contracts }: {
  tabs: { key: string; label: string }[]
  active: string
  onTabChange: (key: string) => void
  contracts: Contract[]
}) {
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: contracts.length }
    c.draft = contracts.filter(ct => ct.status === 'DRAFT').length
    c.sent = contracts.filter(ct => ct.status === 'SENT').length
    c.viewed = contracts.filter(ct => ct.status === 'VIEWED').length
    c.signed = contracts.filter(ct => ct.status === 'AGREED').length
    return c
  }, [contracts])

  return (
    <div
      className="flex items-center gap-1 rounded-xl bg-[var(--surface-base)] p-1 mb-4 overflow-x-auto scrollbar-hide"
      style={{ border: '0.5px solid var(--border)' }}
      data-testid="contracts-tab-row"
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center gap-1.5 px-3 py-2.5 md:py-1.5 min-h-[44px] md:min-h-0 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
            active === tab.key
              ? 'font-bold text-[#6C2EDB]'
              : 'text-[var(--text-secondary)] hover:text-text-primary hover:bg-[var(--surface-background)]'
          }`}
          style={active === tab.key ? { background: 'rgba(108,46,219,0.10)', fontWeight: 700 } : undefined}
          data-testid={`contracts-tab-${tab.key}`}
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

// ── Contract Row ──

function ContractRow({ contract, lang, onEdit, onSend, onViewPortal, onDelete }: {
  contract: Contract
  lang: IndustryLanguage
  onEdit: (c: Contract) => void
  onSend: (c: Contract) => void
  onViewPortal: (c: Contract) => void
  onDelete: (c: Contract) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  // AUDIT FIX [U3.1]: Destructive action confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const clientName = contract.lead?.clientName || 'Unknown'
  const initials = getInitials(clientName)
  const avatarColor = STATUS_AVATAR_COLORS[contract.status] || '#9CA3AF'
  const statusStyle = STATUS_BORDER_STYLES[contract.status] || STATUS_BORDER_STYLES.DRAFT
  const isDraft = contract.status === 'DRAFT'
  const isSigned = contract.status === 'AGREED'
  const isViewed = contract.status === 'VIEWED'
  const daysSinceViewed = isViewed ? getDaysSince(contract.viewedAt) : 0
  const daysSinceSent = contract.sentAt ? getDaysSince(contract.sentAt) : 0
  const projectTitle = contract.lead?.projectTitle || ''
  const keyDate = formatShortDate(contract.lead?.keyDate || contract.lead?.eventDate)
  const subLabel = [projectTitle, keyDate !== '\u2014' ? keyDate : ''].filter(Boolean).join(' \u00b7 ') || '\u2014'

  return (
    <div
      className="flex flex-col gap-2.5 p-3.5 md:grid md:grid-cols-[1fr_120px_100px_72px] md:items-center md:px-3.5 md:py-[10px] cursor-pointer transition-all duration-150 group border-b last:border-b-0 hover:bg-[var(--surface-background)]"
      style={{ borderColor: 'var(--border)' }}
      onClick={() => onEdit(contract)}
      data-testid={`contract-row-${contract.id}`}
    >
      {/* Client cell */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={isDraft ? { border: '1.5px solid var(--border-dark, #6B7280)', background: 'transparent', color: 'var(--text-secondary)' } : { background: `${avatarColor}18`, color: avatarColor }}
        >
          {isSigned ? <CheckCircle weight="fill" className="w-3.5 h-3.5" style={{ color: '#10B981' }} /> : initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-primary truncate">{clientName}</span>
            {isViewed && daysSinceViewed > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700 flex-shrink-0" data-testid={`viewed-badge-${contract.id}`}>
                <span className="w-[5px] h-[5px] rounded-full bg-amber-500 animate-pulse" />
                Viewed {daysSinceViewed}d ago
              </span>
            )}
            {contract.status === 'SENT' && daysSinceSent > 3 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-medium text-red-600 flex-shrink-0" data-testid={`urgency-badge-${contract.id}`}>
                <Clock weight="bold" className="w-3 h-3" />
                {daysSinceSent}d no response
              </span>
            )}
            {isSigned && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-700 flex-shrink-0" data-testid={`signed-badge-${contract.id}`}>
                <Confetti weight="fill" className="w-3 h-3" />
                Signed
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] truncate">{subLabel}</p>
        </div>
      </div>

      {/* Status + type: inline on mobile, separate grid cells on desktop */}
      <div className="flex items-center gap-2 md:contents">
        <div>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
            style={{ borderLeft: `3px solid ${statusStyle.border}`, background: statusStyle.bg, color: statusStyle.text }}
          >
            {CONTRACT_STATUS_LABELS[contract.status]}
          </span>
        </div>
        <div className="text-xs text-[var(--text-secondary)] truncate">
          {CONTRACT_TYPE_LABELS[contract.templateType] || contract.templateType}
        </div>
        <span className="text-xs text-[var(--text-secondary)] tabular-nums ml-auto md:hidden">
          {contract.sentAt ? formatShortDate(contract.sentAt) : '\u2014'}
        </span>
      </div>

      {/* Actions: always visible on mobile, hover on desktop */}
      <div className="relative flex items-center justify-end">
        <span className="text-xs text-[var(--text-secondary)] tabular-nums hidden md:inline md:group-hover:hidden">
          {contract.sentAt ? formatShortDate(contract.sentAt) : '\u2014'}
        </span>
        <div className="flex md:hidden md:group-hover:flex items-center gap-1" data-testid={`contract-quick-actions-${contract.id}`}>
          {isDraft && (
            <button
              onClick={(e) => { e.stopPropagation(); onSend(contract) }}
              className="h-9 md:h-7 px-3 md:px-2 rounded-md text-xs md:text-[10px] font-semibold text-white whitespace-nowrap transition-colors"
              style={{ background: '#6C2EDB' }}
              data-testid={`contract-send-${contract.id}`}
            >
              Send
            </button>
          )}
          {(contract.status === 'SENT' || contract.status === 'VIEWED') && (
            <button
              onClick={(e) => { e.stopPropagation(); onSend(contract) }}
              className="h-9 md:h-7 px-3 md:px-2 rounded-md text-xs md:text-[10px] font-semibold text-white whitespace-nowrap transition-colors"
              style={{ background: '#6C2EDB' }}
              data-testid={`contract-resend-${contract.id}`}
            >
              Resend
            </button>
          )}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="h-9 w-9 md:h-7 md:w-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-text-primary hover:bg-[var(--surface-base)] transition-colors"
            >
              <DotsThree className="w-3.5 h-3.5" weight="bold" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-[var(--surface-base)] rounded-lg shadow-xl z-20 py-1 min-w-[130px]" style={{ border: '0.5px solid var(--border)' }}>
                {isDraft && (
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(contract) }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--surface-background)] text-[var(--text-secondary)] flex items-center gap-2">
                    <PencilSimple className="w-3 h-3" /> Edit
                  </button>
                )}
                {contract.lead?.portalToken && (
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onViewPortal(contract) }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--surface-background)] text-[var(--text-secondary)] flex items-center gap-2">
                    <ArrowSquareOut className="w-3 h-3" /> View portal
                  </button>
                )}
                {isDraft && (
                  deleteConfirm ? (
                    <div className="flex items-center gap-1.5 px-3 py-2" data-testid={`contract-delete-confirm-${contract.id}`}>
                      <span className="text-[10px] text-red-500 flex-1">Delete permanently?</span>
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setDeleteConfirm(false); onDelete(contract) }} className="px-2 py-1 text-[10px] font-semibold text-white bg-red-500 rounded">
                        Delete
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(false) }} className="px-2 py-1 text-[10px] text-[var(--text-secondary)] border border-[var(--border)] rounded">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(true) }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-500 flex items-center gap-2">
                      <Trash className="w-3 h-3" /> Delete
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──

export default function ContractsPage({ lang, user, leads, onLeadClick, onLeadClickTab }: ContractsPageProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [emailComposerContract, setEmailComposerContract] = useState<Contract | null>(null)
  const [userName, setUserName] = useState('')
  const [studioName, setStudioName] = useState('')

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    setLoading(true)
    const result = await contractsApi.getAll()
    if (result.data?.contracts) setContracts(result.data.contracts)
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      setUserName(`${user.firstName || ''} ${user.lastName || ''}`.trim())
      setStudioName(user.studioName || '')
    }
  }, [user])

  const tabs = [
    { key: 'all', label: `All ${lang.contracts}` },
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'viewed', label: 'Viewed' },
    { key: 'signed', label: 'Signed' },
  ]

  const filteredContracts = useMemo(() => {
    if (activeTab === 'all') return contracts
    const statuses = TAB_STATUS_MAP[activeTab]
    if (statuses && statuses.length > 0) return contracts.filter(c => statuses.includes(c.status))
    return contracts
  }, [contracts, activeTab])

  const handleEdit = (contract: Contract) => {
    if (contract.lead && onLeadClickTab) {
      const lead = leads?.find(l => l.id === contract.leadId) || { ...contract.lead, id: contract.leadId } as Lead
      onLeadClickTab(lead, 'contracts')
    }
  }

  const handleSend = (contract: Contract) => {
    setEmailComposerContract(contract)
  }

  const handleEmailSend = async (subject: string, message: string) => {
    if (!emailComposerContract) return
    const result = await contractsApi.send(emailComposerContract.id, { subject, message })
    if (result.error) throw new Error(result.message || 'Failed to send')
    trackEvent('Contract Sent', { contractId: emailComposerContract.id })
    setEmailComposerContract(null)
    fetchContracts()
  }

  const handleViewPortal = (contract: Contract) => {
    if (contract.lead?.portalToken) {
      window.open(`/portal/${contract.lead.portalToken}`, '_blank')
    }
  }

  // AUDIT FIX [U3.1]: Remove browser confirm() — confirmation now handled in ContractRow UI
  const handleDelete = async (contract: Contract) => {
    const result = await contractsApi.delete(contract.id)
    if (!result.error) fetchContracts()
  }

  const awaitingCount = contracts.filter(c => c.status === 'SENT' || c.status === 'VIEWED').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <SpinnerGap className="w-6 h-6 animate-spin text-[#6C2EDB]" />
      </div>
    )
  }

  return (
    <div data-testid="contracts-page" className="overflow-x-hidden">
      {/* Topbar */}
      <div className="flex items-start justify-between mb-5" data-testid="contracts-topbar">
        <div>
          <h1 className="text-base font-extrabold text-text-primary">{lang.contracts}</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {contracts.length} total &middot; {awaitingCount} awaiting signature
          </p>
        </div>
      </div>

      <StatsStrip contracts={contracts} lang={lang} />
      <TabRow tabs={tabs} active={activeTab} onTabChange={setActiveTab} contracts={contracts} />

      {/* Contracts list */}
      {filteredContracts.length === 0 ? (
        contracts.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            headline={`No ${lang.contracts.toLowerCase()} yet`}
            description={`${lang.contracts} are auto-generated when clients accept a ${lang.quote.toLowerCase()}. Send your first ${lang.quote.toLowerCase()} to get started.`}
            ctaLabel={`+ New ${lang.contract}`}
            onCta={() => {
              if (leads && leads.length > 0 && onLeadClickTab) {
                onLeadClickTab(leads[0], 'contracts')
              }
            }}
          />
        ) : (
          <div className="py-16 text-center rounded-xl bg-[var(--surface-base)]" style={{ border: '0.5px solid var(--border)' }} data-testid="contracts-empty-filter">
            <p className="text-sm text-[var(--text-secondary)] mb-1">No {lang.contracts.toLowerCase()} match this filter</p>
            <button onClick={() => setActiveTab('all')} className="text-xs text-[#6C2EDB] font-medium hover:underline">View all</button>
          </div>
        )
      ) : (
        <div className="rounded-xl bg-[var(--surface-base)] overflow-hidden" style={{ border: '0.5px solid var(--border)' }} data-testid="contracts-list-table">
          {/* Header - desktop only */}
          <div className="hidden md:grid items-center px-3.5 py-2.5 bg-[var(--surface-background)]" style={{ gridTemplateColumns: '1fr 120px 100px 72px', borderBottom: '0.5px solid var(--border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">{lang.client}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Type</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] text-right">Sent</span>
          </div>
          {filteredContracts.map(contract => (
            <ContractRow
              key={contract.id}
              contract={contract}
              lang={lang}
              onEdit={handleEdit}
              onSend={handleSend}
              onViewPortal={handleViewPortal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Email Composer */}
      {emailComposerContract && (
        <EmailComposer
          type="contract"
          recipientName={emailComposerContract.lead?.clientName || ''}
          recipientEmail={emailComposerContract.lead?.clientEmail || ''}
          projectTitle={emailComposerContract.lead?.projectTitle || ''}
          userName={userName}
          studioName={studioName}
          onSend={handleEmailSend}
          onCancel={() => setEmailComposerContract(null)}
        />
      )}
    </div>
  )
}
