import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  PaperPlaneTilt,
  Eye,
  DotsThree,
  FileText,
  ArrowSquareOut,
  Copy,
  Trash,
  PencilSimple,
  SpinnerGap,
  CheckCircle,
  DownloadSimple,
} from '@phosphor-icons/react'
import {
  Quote,
  QuoteStatus,
  QUOTE_STATUS_LABELS,
  quotesApi,
  authApi,
  Lead,
} from '../services/api'
import { formatCurrency, CurrencySettings } from '../utils/currency'
import { IndustryLanguage } from '../utils/industryLanguage'
import QuoteBuilderModal from '../components/QuoteBuilderModal'
import EmailComposer from '../components/EmailComposer'
import { EmptyState } from '../components/EmptyState'
import {
  trackQuoteSent,
  trackQuoteDuplicated,
} from '../utils/analytics'

interface QuotesPageProps {
  lang: IndustryLanguage
  user?: any
  leads?: Lead[]
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
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtCurrencyCompact(value: number, symbol = '$'): string {
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return `${symbol}${value.toLocaleString()}`
}

const STATUS_AVATAR_COLORS: Record<string, string> = {
  DRAFT: 'var(--border-dark, #6B7280)',
  SENT: '#6C2EDB',
  VIEWED: '#E8891A',
  ACCEPTED: '#10B981',
  DECLINED: '#EF4444',
  EXPIRED: '#9CA3AF',
}

const STATUS_BORDER_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  DRAFT: { border: 'var(--border-dark, #4B5563)', bg: 'rgba(107,114,128,0.06)', text: 'var(--text-secondary)' },
  SENT: { border: '#6C2EDB', bg: 'rgba(108,46,219,0.06)', text: '#4C1D95' },
  VIEWED: { border: '#E8891A', bg: 'rgba(232,137,26,0.06)', text: '#92400E' },
  ACCEPTED: { border: '#10B981', bg: 'rgba(16,185,129,0.06)', text: '#065F46' },
  DECLINED: { border: '#EF4444', bg: 'rgba(239,68,68,0.06)', text: '#991B1B' },
  EXPIRED: { border: '#9CA3AF', bg: 'rgba(156,163,175,0.06)', text: '#6B7280' },
}

const TAB_STATUS_MAP: Record<string, QuoteStatus[]> = {
  all: [],
  draft: ['DRAFT'],
  sent: ['SENT'],
  viewed: ['VIEWED'],
  approved: ['ACCEPTED'],
  declined: ['DECLINED'],
}

function getPrimaryAction(status: QuoteStatus, lang: IndustryLanguage): { label: string; action: string } {
  switch (status) {
    case 'DRAFT': return { label: `Send ${lang.quote}`, action: 'send' }
    case 'SENT': return { label: 'Send reminder', action: 'resend' }
    case 'VIEWED': return { label: 'Follow up', action: 'resend' }
    case 'ACCEPTED': return { label: `Send ${lang.contract}`, action: 'contract' }
    case 'DECLINED': return { label: 'Archive', action: 'archive' }
    default: return { label: 'View', action: 'view' }
  }
}

// ── Stats Strip ──

function StatsStrip({ quotes, lang, currencySymbol }: { quotes: Quote[]; lang: IndustryLanguage; currencySymbol: string }) {
  const stats = useMemo(() => {
    const sent = quotes.filter(q => q.status !== 'DRAFT').length
    const totalValue = quotes.reduce((sum, q) => sum + (q.total || 0), 0)
    const awaiting = quotes.filter(q => q.status === 'SENT' || q.status === 'VIEWED').length
    const approved = quotes.filter(q => q.status === 'ACCEPTED').length
    const sentForRate = Math.max(sent, 1)
    const acceptanceRate = Math.round((approved / sentForRate) * 100)
    const thisMonth = quotes.filter(q => {
      const d = new Date(q.createdAt)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { sent: quotes.length, totalValue, awaiting, acceptanceRate, approved, sentForRate: sent, thisMonth }
  }, [quotes])

  const chips = [
    {
      label: 'Sent',
      value: stats.sent.toString(),
      trend: `${stats.thisMonth} this month`,
      trendColor: stats.thisMonth > 0 ? '#059669' : 'var(--text-secondary)',
    },
    {
      label: 'Total value',
      value: fmtCurrencyCompact(stats.totalValue, currencySymbol),
      trend: `${stats.sent} ${lang.quotes.toLowerCase()}`,
      trendColor: 'var(--text-secondary)',
    },
    {
      label: 'Awaiting approval',
      value: stats.awaiting.toString(),
      trend: stats.awaiting > 0 ? 'Follow up now' : 'All responded',
      trendColor: stats.awaiting > 0 ? '#D97706' : '#059669',
    },
    {
      label: 'Acceptance rate',
      value: `${stats.acceptanceRate}%`,
      trend: `${stats.approved} of ${stats.sentForRate} approved`,
      trendColor: 'var(--text-secondary)',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4" data-testid="quotes-stats-strip">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="rounded-[9px] bg-[var(--surface-base)] px-3.5 py-3"
          style={{ border: '0.5px solid var(--border)' }}
          data-testid={`stat-${chip.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1">{chip.label}</p>
          <p className="text-xl font-extrabold tabular-nums text-text-primary" style={{ color: chip.label === 'Awaiting approval' && stats.awaiting > 0 ? '#D97706' : undefined }}>{chip.value}</p>
          <p className="text-[10px] mt-0.5" style={{ color: chip.trendColor }}>{chip.trend}</p>
        </div>
      ))}
    </div>
  )
}

// ── Tab Row ──

function TabRow({ tabs, active, onTabChange, quotes }: {
  tabs: { key: string; label: string }[]
  active: string
  onTabChange: (key: string) => void
  quotes: Quote[]
}) {
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: quotes.length }
    c.draft = quotes.filter(q => q.status === 'DRAFT').length
    c.sent = quotes.filter(q => q.status === 'SENT').length
    c.viewed = quotes.filter(q => q.status === 'VIEWED').length
    c.approved = quotes.filter(q => q.status === 'ACCEPTED').length
    c.declined = quotes.filter(q => q.status === 'DECLINED').length
    return c
  }, [quotes])

  return (
    <div
      className="flex items-center gap-1 rounded-[9px] bg-[var(--surface-base)] p-1 mb-4 overflow-x-auto scrollbar-hide"
      style={{ border: '0.5px solid var(--border)' }}
      data-testid="quotes-tab-row"
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
          data-testid={`quotes-tab-${tab.key}`}
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

// ── Quote Row ──

function QuoteRow({ quote, lang, currencySymbol, onEdit, onSend, onPreview, onDuplicate, onDelete, onCopyLink }: {
  quote: Quote
  lang: IndustryLanguage
  currencySymbol: string
  onEdit: (q: Quote) => void
  onSend: (q: Quote) => void
  onPreview: (q: Quote) => void
  onDuplicate: (q: Quote) => void
  onDelete: (q: Quote) => void
  onCopyLink: (q: Quote) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const clientName = quote.lead?.clientName || 'Unknown'
  const initials = getInitials(clientName)
  const avatarColor = STATUS_AVATAR_COLORS[quote.status] || '#9CA3AF'
  const statusStyle = STATUS_BORDER_STYLES[quote.status] || STATUS_BORDER_STYLES.DRAFT
  const primaryAction = getPrimaryAction(quote.status, lang)
  const isDraft = quote.status === 'DRAFT'
  const isViewed = quote.status === 'VIEWED'
  const daysSinceViewed = isViewed ? getDaysSince(quote.viewedAt) : 0
  const projectType = quote.lead?.projectType?.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || ''
  const keyDate = formatShortDate(quote.lead?.keyDate || quote.lead?.eventDate)
  const subLabel = [projectType, keyDate !== '—' ? keyDate : ''].filter(Boolean).join(' · ') || '—'

  return (
    <div
      className="grid items-center px-3.5 py-[10px] cursor-pointer transition-all duration-150 group border-b last:border-b-0 hover:bg-[var(--surface-background)]"
      style={{ gridTemplateColumns: '1fr 88px 120px 72px 88px', borderColor: 'var(--border)' }}
      onClick={() => onEdit(quote)}
      data-testid={`quote-row-${quote.id}`}
    >
      {/* Client cell */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          style={isDraft ? { border: '1.5px solid var(--border-dark, #6B7280)', background: 'transparent', color: 'var(--text-secondary)' } : { background: `${avatarColor}18`, color: avatarColor }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-primary truncate">{clientName}</span>
            {isViewed && daysSinceViewed > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700 flex-shrink-0" data-testid={`viewed-badge-${quote.id}`}>
                <span className="w-[5px] h-[5px] rounded-full bg-amber-500 animate-pulse" />
                Viewed · {daysSinceViewed}d ago
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] truncate">{subLabel}</p>
        </div>
      </div>

      {/* Quote number cell */}
      <div className="text-[11px] font-mono text-[var(--text-secondary)] truncate">
        {quote.quoteNumber || `QT-${(quote.id || '').slice(-4).toUpperCase()}`}
      </div>

      {/* Status cell */}
      <div>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
          style={{ borderLeft: `3px solid ${statusStyle.border}`, background: statusStyle.bg, color: statusStyle.text }}
        >
          {QUOTE_STATUS_LABELS[quote.status]}
        </span>
      </div>

      {/* Sent date cell */}
      <div className="text-[11px] text-[var(--text-secondary)] tabular-nums">
        {quote.sentAt ? formatShortDate(quote.sentAt) : '—'}
      </div>

      {/* Value cell + hover actions */}
      <div className="relative flex items-center justify-end">
        {/* Default: show value */}
        <span className={`text-[11px] font-bold text-text-primary tabular-nums group-hover:hidden ${isDraft ? 'opacity-60' : ''}`}>
          {fmtCurrencyCompact(quote.total, currencySymbol)}
        </span>
        {/* Hover: show quick-actions */}
        <div className="hidden group-hover:flex items-center gap-1" data-testid={`quote-quick-actions-${quote.id}`}>
          <button
            onClick={(e) => { e.stopPropagation(); primaryAction.action === 'send' || primaryAction.action === 'resend' ? onSend(quote) : onEdit(quote) }}
            className="h-7 px-2 rounded-md text-[10px] font-semibold text-white whitespace-nowrap transition-colors"
            style={{ background: '#6C2EDB' }}
            data-testid={`quote-primary-${quote.id}`}
          >
            {primaryAction.label}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(quote) }}
            className="h-7 px-1.5 rounded-md text-[10px] text-[var(--text-tertiary)] hover:text-text-primary hover:bg-[var(--surface-base)] transition-colors"
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="h-7 w-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-text-primary hover:bg-[var(--surface-base)] transition-colors"
            >
              <DotsThree className="w-3.5 h-3.5" weight="bold" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-[var(--surface-base)] rounded-lg shadow-xl z-20 py-1 min-w-[130px]" style={{ border: '0.5px solid var(--border)' }}>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(quote) }} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-[var(--surface-background)] text-[var(--text-secondary)] flex items-center gap-2">
                  <PencilSimple className="w-3 h-3" /> Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate(quote) }} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-[var(--surface-background)] text-[var(--text-secondary)] flex items-center gap-2">
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onCopyLink(quote) }} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-[var(--surface-background)] text-[var(--text-secondary)] flex items-center gap-2">
                  <ArrowSquareOut className="w-3 h-3" /> Copy link
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); quotesApi.downloadPdf(quote.id) }} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-[var(--surface-background)] text-[var(--text-secondary)] flex items-center gap-2">
                  <DownloadSimple className="w-3 h-3" /> PDF
                </button>
                {isDraft && (
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(quote) }} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-red-50 text-red-500 flex items-center gap-2">
                    <Trash className="w-3 h-3" /> Delete
                  </button>
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

export default function QuotesPage({ lang, user, leads }: QuotesPageProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [emailComposerQuote, setEmailComposerQuote] = useState<Quote | null>(null)
  const [userName, setUserName] = useState('')
  const [studioName, setStudioName] = useState('')
  const [userCurrencySettings, setUserCurrencySettings] = useState<Partial<CurrencySettings>>({})

  const currencySymbol = user?.currencySymbol || '$'

  useEffect(() => {
    fetchQuotes()
    fetchUserSettings()
  }, [])

  const fetchQuotes = async () => {
    setLoading(true)
    const result = await quotesApi.getAll()
    if (result.data?.quotes) setQuotes(result.data.quotes)
    setLoading(false)
  }

  const fetchUserSettings = async () => {
    const result = await authApi.getMe()
    if (result.data?.user) {
      setUserCurrencySettings({
        currency: result.data.user.currency,
        currencySymbol: result.data.user.currencySymbol,
        currencyPosition: result.data.user.currencyPosition as 'BEFORE' | 'AFTER',
        numberFormat: result.data.user.numberFormat as any,
      })
      setUserName(`${result.data.user.firstName} ${result.data.user.lastName}`.trim())
      setStudioName(result.data.user.studioName || '')
    }
  }

  const tabs = [
    { key: 'all', label: `All ${lang.quotes}` },
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'viewed', label: 'Viewed' },
    { key: 'approved', label: 'Approved' },
    { key: 'declined', label: 'Declined' },
  ]

  const filteredQuotes = useMemo(() => {
    if (activeTab === 'all') return quotes
    const statuses = TAB_STATUS_MAP[activeTab]
    if (statuses && statuses.length > 0) return quotes.filter(q => statuses.includes(q.status))
    return quotes
  }, [quotes, activeTab])

  // Handlers
  const handleEdit = (quote: Quote) => {
    const lead = leads?.find(l => l.id === quote.leadId) || { id: quote.leadId, clientName: quote.lead?.clientName || '', clientEmail: quote.lead?.clientEmail || '', projectTitle: quote.lead?.projectTitle || '' } as Lead
    setEditingLead(lead)
    setEditingQuote(quote)
    setShowBuilder(true)
  }

  const handleNewQuote = () => {
    if (leads && leads.length > 0) {
      setEditingLead(leads[0])
      setEditingQuote(null)
      setShowBuilder(true)
    }
  }

  const handleSend = (quote: Quote) => {
    setEmailComposerQuote(quote)
  }

  const handleEmailSend = async (subject: string, message: string) => {
    if (!emailComposerQuote) return
    const result = await quotesApi.send(emailComposerQuote.id, { subject, message })
    if (result.error) throw new Error(result.message || 'Failed to send')
    if (result.data?.emailSent === false) {
      fetchQuotes()
      setEmailComposerQuote(null)
      throw new Error('Quote saved but email delivery failed.')
    }
    trackQuoteSent(emailComposerQuote.total)
    setEmailComposerQuote(null)
    fetchQuotes()
  }

  const handlePreview = (quote: Quote) => {
    window.open(`/quote/${quote.quoteToken}`, '_blank')
  }

  const handleDuplicate = async (quote: Quote) => {
    const result = await quotesApi.duplicate(quote.id)
    if (!result.error) {
      trackQuoteDuplicated()
      fetchQuotes()
    }
  }

  const handleDelete = async (quote: Quote) => {
    if (!confirm(`Delete this ${lang.quote.toLowerCase()}?`)) return
    const result = await quotesApi.delete(quote.id)
    if (!result.error) fetchQuotes()
  }

  const handleCopyLink = async (quote: Quote) => {
    const url = `${window.location.origin}/quote/${quote.quoteToken}`
    try { await navigator.clipboard.writeText(url) } catch {}
  }

  const handleQuoteSaved = () => {
    setShowBuilder(false)
    setEditingQuote(null)
    setEditingLead(null)
    fetchQuotes()
  }

  // Derived topbar subtitle
  const totalSentValue = quotes.filter(q => q.status !== 'DRAFT').reduce((s, q) => s + (q.total || 0), 0)
  const awaitingCount = quotes.filter(q => q.status === 'SENT' || q.status === 'VIEWED').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <SpinnerGap className="w-6 h-6 animate-spin text-[#6C2EDB]" />
      </div>
    )
  }

  return (
    <div data-testid="quotes-page">
      {/* Topbar */}
      <div className="flex items-start justify-between mb-5" data-testid="quotes-topbar">
        <div>
          <h1 className="text-base font-extrabold text-text-primary">{lang.quotes}</h1>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            {quotes.length} total · {fmtCurrencyCompact(totalSentValue, currencySymbol)} sent · {awaitingCount} awaiting approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewQuote}
            className="h-8 px-3.5 rounded-lg text-[11px] font-semibold text-white transition-colors flex items-center gap-1.5"
            style={{ background: '#6C2EDB' }}
            data-testid="new-quote-btn"
          >
            <Plus weight="bold" className="w-3.5 h-3.5" />
            {lang.newQuote}
          </button>
        </div>
      </div>

      <StatsStrip quotes={quotes} lang={lang} currencySymbol={currencySymbol} />
      <TabRow tabs={tabs} active={activeTab} onTabChange={setActiveTab} quotes={quotes} />

      {/* Quote list */}
      {filteredQuotes.length === 0 ? (
        quotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            headline={lang.emptyQuotes}
            description={`Build a professional ${lang.quote.toLowerCase()} with your packages and rates. Clients approve it online.`}
            ctaLabel={lang.newQuote}
            onCta={handleNewQuote}
          />
        ) : (
          <div className="py-16 text-center rounded-[10px] bg-[var(--surface-base)]" style={{ border: '0.5px solid var(--border)' }} data-testid="quotes-empty-filter">
            <p className="text-sm text-[var(--text-secondary)] mb-1">No {lang.quotes.toLowerCase()} match this filter</p>
            <button onClick={() => setActiveTab('all')} className="text-xs text-[#6C2EDB] font-medium hover:underline">View all</button>
          </div>
        )
      ) : (
        <div className="rounded-[10px] bg-[var(--surface-base)] overflow-hidden" style={{ border: '0.5px solid var(--border)' }} data-testid="quotes-list-table">
          {/* Header */}
          <div className="grid items-center px-3.5 py-2.5 bg-[var(--surface-background)]" style={{ gridTemplateColumns: '1fr 88px 120px 72px 88px', borderBottom: '0.5px solid var(--border)' }}>
            <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">{lang.client}</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">{lang.quote} #</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Status</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Sent</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] text-right">Value</span>
          </div>
          {filteredQuotes.map(quote => (
            <QuoteRow
              key={quote.id}
              quote={quote}
              lang={lang}
              currencySymbol={currencySymbol}
              onEdit={handleEdit}
              onSend={handleSend}
              onPreview={handlePreview}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onCopyLink={handleCopyLink}
            />
          ))}
        </div>
      )}

      {/* Quote Builder Modal */}
      {showBuilder && editingLead && (
        <QuoteBuilderModal
          lead={editingLead}
          existingQuote={editingQuote}
          userCurrencySettings={userCurrencySettings}
          onClose={() => { setShowBuilder(false); setEditingQuote(null); setEditingLead(null) }}
          onSaved={handleQuoteSaved}
          onSent={handleQuoteSaved}
        />
      )}

      {/* Email Composer */}
      {emailComposerQuote && (
        <EmailComposer
          type="quote"
          recipientName={emailComposerQuote.lead?.clientName || ''}
          recipientEmail={emailComposerQuote.lead?.clientEmail || ''}
          projectTitle={emailComposerQuote.lead?.projectTitle || ''}
          userName={userName}
          studioName={studioName}
          onSend={handleEmailSend}
          onCancel={() => setEmailComposerQuote(null)}
        />
      )}
    </div>
  )
}
