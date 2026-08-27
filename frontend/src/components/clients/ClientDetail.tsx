// iter 293-v3a — Clients v3.1 progressive-disclosure client detail (Case A).
//
// Replaces the 1996-line LeadDetailModal tabs-warehouse anti-pattern
// with a focused progressive-disclosure surface:
//   - Hero: avatar + name + stage + last-activity + next-action card
//   - Recent activity timeline (top 5 + "View all" expander)
//   - Quick-access sidebar: Files / Pipeline / Notes / Messages panels
//     that expand inline on click and delegate to existing sub-components
//     (FileCategoryBadge, QuotesTab, ContractsTab) — reuses valuable
//     deep-detail views without inheriting the shell's dual-mode tangle.
//
// Framework-calibrated throughout: kolor tokens + Fraunces italic +
// Inter body + mono UPPERCASE eyebrows. Zero purple legacy.
//
// Drop-in interface: matches LeadDetailModalProps so Dashboard.tsx and
// useOpenLead wiring change one import only. Legacy LeadDetailModal.tsx
// preserved as fallback for one iteration per rollback safety.

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/csr/PaperPlaneTilt'
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple'
import { FileText } from '@phosphor-icons/react/dist/csr/FileText'
import { Note } from '@phosphor-icons/react/dist/csr/Note'
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { Link as LinkIcon } from '@phosphor-icons/react/dist/csr/Link'

import type { Activity, Lead, LeadFile, IndustryType } from '../../services/api'
import { leadsApi } from '../../services/api'
import { getIndustryLanguage } from '../../utils/industryLanguage'
import { useModalA11y } from '../../hooks/useModalA11y'
import { ClientAvatar } from './ClientAvatar'
import { getStageForLead, relativeTimeShort } from './stages'
// iter 293-v3a.1 — Take Action opens BulkEmailModal in single-recipient mode
import { BulkEmailModal } from './BulkEmailModal'

// Lazy imports — deep panels only mount when expanded
const QuotesTab = lazy(() => import('../QuotesTab'))
const ContractsTab = lazy(() => import('../ContractsTab'))

interface ClientDetailProps {
  lead: Lead
  onClose: () => void
  onUpdate: (updatedLead: Lead) => void
  onCelebrate?: (key: string, achievementKey: string) => void
  initialTab?: string
  userIndustry?: IndustryType
  currencySymbol?: string
}

type PanelKey = 'files' | 'pipeline' | 'notes' | 'messages'

// Map initialTab (legacy) to progressive-disclosure panel keys
const INITIAL_TAB_MAP: Record<string, PanelKey> = {
  files: 'files',
  notes: 'notes',
  deliverables: 'files',
  quotes: 'pipeline',
  contracts: 'pipeline',
  pipeline: 'pipeline',
  messages: 'messages',
}

// Contextual next-action derivation from current stage
function deriveNextAction(
  lead: Lead,
  stage: ReturnType<typeof getStageForLead>,
  lang: ReturnType<typeof getIndustryLanguage>,
): { label: string; description: string; actionKey: 'quote' | 'contract' | 'reminder' | 'testimonial' | 'nudge' | null } | null {
  if (stage === 'lost') return null
  if (stage === 'inquiry') {
    return {
      label: `Respond to inquiry`,
      description: `${lead.clientName} is waiting to hear back. Send a discovery message or schedule a call.`,
      actionKey: 'reminder',
    }
  }
  if (stage === 'discovery') {
    return {
      label: `Send ${lang.quote.toLowerCase()}`,
      description: `Turn this conversation into a signed ${lang.contract.toLowerCase()} — draft and send the ${lang.quote.toLowerCase()}.`,
      actionKey: 'quote',
    }
  }
  if (stage === 'quoted') {
    return {
      label: `Follow up on ${lang.quote.toLowerCase()}`,
      description: `Nudge ${lead.clientName} — the ${lang.quote.toLowerCase()} is pending their review.`,
      actionKey: 'nudge',
    }
  }
  if (stage === 'contracted') {
    return {
      label: `Send progress update`,
      description: `Keep ${lead.clientName} informed — share progress or upload deliverables.`,
      actionKey: 'nudge',
    }
  }
  if (stage === 'completed') {
    return {
      label: `Request testimonial`,
      description: `The ${lang.lead.toLowerCase()} is complete. Ask ${lead.clientName} for a testimonial.`,
      actionKey: 'testimonial',
    }
  }
  return null
}

// iter 293-v3a.1 — Contextual email pre-fill per stage for Take Action.
// Returns subject + body starter that opens BulkEmailModal in single-recipient
// mode. Creator edits before sending. Stage-adaptive language matches
// industry taxonomy via getIndustryLanguage.
function getTakeActionContent(
  lead: Lead,
  stage: ReturnType<typeof getStageForLead>,
  lang: ReturnType<typeof getIndustryLanguage>,
): { subject: string; body: string } | null {
  const clientName = lead.clientName || 'there'
  const leadWord = lang.lead.toLowerCase()

  if (stage === 'inquiry') {
    return {
      subject: `Re: Your ${leadWord} inquiry`,
      body: `Thanks so much for reaching out — I'd love to learn more about your ${leadWord}.

[Add your response here: ask a discovery question, share availability, or propose a call.]

Looking forward to hearing more.`,
    }
  }
  if (stage === 'discovery') {
    return {
      subject: `${lang.quote} for your ${leadWord}`,
      body: `Great connecting on your ${leadWord}. Attaching the ${lang.quote.toLowerCase()} we discussed.

[Add any context or highlights here.]

Let me know if you'd like to adjust anything — happy to walk through it.`,
    }
  }
  if (stage === 'quoted') {
    return {
      subject: `Following up on the ${lang.quote.toLowerCase()}`,
      body: `Just checking in on the ${lang.quote.toLowerCase()} I sent over — happy to answer any questions or adjust anything.

[Add a nudge, a helpful detail, or offer a call.]

Let me know your thoughts.`,
    }
  }
  if (stage === 'contracted') {
    return {
      subject: `Progress update on your ${leadWord}`,
      body: `Quick update on where we are with your ${leadWord}.

[Share progress details, upcoming milestones, or ask for input. Attach any deliverables or reference images below.]

Reach out anytime if you have questions.`,
    }
  }
  if (stage === 'completed') {
    return {
      subject: `Thank you — a small request`,
      body: `Thank you again for trusting me with your ${leadWord}. It was a real pleasure working together.

If you enjoyed the experience, I'd genuinely appreciate a short testimonial I could share on my portfolio. Even a sentence or two means a lot.

Thanks so much.`,
    }
  }
  return null
}

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

interface QuickAccessSectionProps {
  eyebrow: string
  title: string
  count?: number
  expanded: boolean
  onToggle: () => void
  testId: string
  children: React.ReactNode
}

function QuickAccessSection({ eyebrow, title, count, expanded, onToggle, testId, children }: QuickAccessSectionProps) {
  return (
    <div
      style={{
        background: 'var(--kolor-canvas, #F7F4EE)',
        border: '1px solid var(--kolor-hairline, #E5E0D8)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
      data-testid={`qa-section-${testId}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-80 transition-opacity"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        data-testid={`qa-section-${testId}-toggle`}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <p
            className="font-mono-kolor"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--kolor-ink-subtle, #928B84)',
              marginBottom: 2,
            }}
          >
            {eyebrow}
          </p>
          <div className="flex items-baseline gap-2">
            <h3
              className="fraunces-italic"
              style={{
                fontFamily: '"Fraunces", serif',
                fontStyle: 'italic',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--kolor-ink, #1A1613)',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h3>
            {typeof count === 'number' && (
              <span
                className="font-mono-kolor"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--kolor-ink-muted, #5F5751)',
                }}
              >
                {count}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <CaretDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--kolor-ink-muted, #5F5751)' }} />
        ) : (
          <CaretRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--kolor-ink-muted, #5F5751)' }} />
        )}
      </button>
      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--kolor-hairline, #E5E0D8)',
            padding: 16,
            background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Main ClientDetail component
// ═══════════════════════════════════════════════════════════════════

export default function ClientDetail({
  lead,
  onClose,
  onUpdate,
  initialTab,
  userIndustry,
  currencySymbol = '$',
}: ClientDetailProps) {
  const lang = getIndustryLanguage(userIndustry)
  const modalRef = useModalA11y(true, onClose)

  // Data state
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [files, setFiles] = useState<LeadFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [messages, setMessages] = useState<Array<{ id: string; content: string; from: 'CLIENT' | 'CREATIVE'; read: boolean; createdAt: string }>>([])
  const [loadingMessages, setLoadingMessages] = useState(true)

  // Progressive-disclosure state
  const initialPanel = initialTab && INITIAL_TAB_MAP[initialTab] ? INITIAL_TAB_MAP[initialTab] : null
  const [expandedPanels, setExpandedPanels] = useState<Set<PanelKey>>(initialPanel ? new Set([initialPanel]) : new Set())
  const [showAllActivity, setShowAllActivity] = useState(false)
  // iter 293-v3a.1 — Take Action opens BulkEmailModal single-recipient mode
  const [showTakeActionModal, setShowTakeActionModal] = useState(false)

  // Notes panel input
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // Messages panel input
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  // Portal link
  const [copiedLink, setCopiedLink] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const portalUrl = lead.portalToken ? `${baseUrl}/portal/${lead.portalToken}` : null

  // ─── Data fetching ───
  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true)
    try {
      const result = await leadsApi.getActivities(lead.id)
      if (result.data?.activities) setActivities(result.data.activities)
    } catch (e) {
      console.error('[ClientDetail] fetchActivities', e)
    }
    setLoadingActivities(false)
  }, [lead.id])

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true)
    try {
      const result = await leadsApi.getFiles(lead.id)
      if (result.data?.files) setFiles(result.data.files)
    } catch (e) {
      console.error('[ClientDetail] fetchFiles', e)
    }
    setLoadingFiles(false)
  }, [lead.id])

  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true)
    try {
      const result = await leadsApi.getMessages(lead.id)
      if (result.data?.messages) setMessages(result.data.messages)
    } catch (e) {
      console.error('[ClientDetail] fetchMessages', e)
    }
    setLoadingMessages(false)
  }, [lead.id])

  useEffect(() => {
    fetchActivities()
    fetchFiles()
    fetchMessages()
  }, [fetchActivities, fetchFiles, fetchMessages])

  // ─── Derived values ───
  const stage = getStageForLead(lead)
  const stageLabel = stage === 'lost' ? 'Lost' : lang.stages[stage]
  const nextAction = useMemo(() => deriveNextAction(lead, stage, lang), [lead, stage, lang])
  const lastActivity = activities[0]
  const notesCount = activities.filter((a) => a.type === 'NOTE_ADDED').length
  const unreadClientMessages = messages.filter((m) => m.from === 'CLIENT' && !m.read).length

  // ─── Panel toggle ───
  const togglePanel = useCallback((key: PanelKey) => {
    setExpandedPanels((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ─── Actions ───
  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setAddingNote(true)
    try {
      const result = await leadsApi.addNote(lead.id, newNote.trim())
      if (result.data?.activity) {
        setActivities([result.data.activity, ...activities])
        setNewNote('')
        toast.success('Note added')
      } else if (result.error) {
        toast.error(result.message || 'Failed to add note')
      }
    } catch {
      toast.error('Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMsg.trim() || sendingMsg) return
    setSendingMsg(true)
    try {
      const result = await leadsApi.sendMessage(lead.id, newMsg.trim())
      if (result.data?.message) {
        setNewMsg('')
        fetchMessages()
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSendingMsg(false)
    }
  }

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const arr = Array.from(fileList)
    try {
      const result = await leadsApi.uploadFiles(lead.id, arr)
      if (result.error) toast.error(result.message || 'Upload failed')
      else {
        toast.success(`Uploaded ${arr.length} file${arr.length === 1 ? '' : 's'}`)
        fetchFiles()
        fetchActivities()
      }
    } catch {
      toast.error('Upload failed')
    }
  }

  const handleCopyPortalLink = async () => {
    if (!portalUrl) return
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
      toast.success('Portal link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const executeNextAction = () => {
    if (!nextAction) return
    if (nextAction.actionKey === 'testimonial') {
      // Testimonial has a dedicated backend endpoint — keep existing behavior.
      const API_URL = (import.meta as any).env?.VITE_API_URL || ''
      fetch(`${API_URL}/api/testimonials/request/${lead.id}`, {
        method: 'POST',
        credentials: 'include',
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.testimonial) {
            const link = `${window.location.origin}/testimonial/${data.testimonial.publicToken}`
            navigator.clipboard.writeText(link).catch(() => {})
            toast.success('Testimonial requested — link copied')
          }
        })
        .catch(() => toast.error('Failed to request testimonial'))
      return
    }
    // iter 293-v3a.1 — All other actions (quote / nudge / reminder) open the
    // BulkEmailModal in single-recipient mode with contextual pre-fill per stage.
    // Replaces v3a placeholder that expanded off-screen panels.
    setShowTakeActionModal(true)
  }

  const takeActionPrefill = useMemo(
    () => getTakeActionContent(lead, stage, lang),
    [lead, stage, lang],
  )

  // ─── Render ───
  const displayActivities = showAllActivity ? activities : activities.slice(0, 5)

  const content = (
    <div
      ref={modalRef as any}
      className="fixed inset-0 z-[100] flex items-stretch md:items-center md:justify-end"
      style={{ background: 'rgba(26, 22, 19, 0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      data-testid="client-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Client detail: ${lead.clientName}`}
    >
      <div
        className="flex flex-col w-full h-full md:h-full md:max-w-[900px] overflow-hidden"
        style={{
          background: 'var(--kolor-canvas, #F7F4EE)',
          borderLeft: '1px solid var(--kolor-hairline, #E5E0D8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ Header ═══ */}
        <header
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <ClientAvatar name={lead.clientName} size={40} testId="client-detail-avatar" />
            <div className="min-w-0">
              <h1
                className="fraunces-italic truncate"
                style={{
                  fontFamily: '"Fraunces", serif',
                  fontStyle: 'italic',
                  fontSize: 22,
                  fontWeight: 500,
                  color: 'var(--kolor-ink, #1A1613)',
                  lineHeight: 1.2,
                }}
                data-testid="client-detail-name"
              >
                {lead.clientName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="font-mono-kolor"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: stage === 'lost' ? 'var(--kolor-ink-subtle, #928B84)' : 'var(--kolor-terra, #B84A2C)',
                  }}
                  data-testid="client-detail-stage"
                >
                  {stageLabel}
                </span>
                {lastActivity && (
                  <>
                    <span style={{ color: 'var(--kolor-ink-subtle, #928B84)' }}>·</span>
                    <span
                      className="font-mono-kolor"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--kolor-ink-subtle, #928B84)',
                      }}
                    >
                      {relativeTimeShort(lastActivity.createdAt)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--kolor-ink-muted, #5F5751)' }}
            aria-label="Close client detail"
            data-testid="client-detail-close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* ═══ Body ═══ */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[820px] mx-auto p-6 space-y-6">
            {/* ─── HERO: Next-action card ─── */}
            {nextAction && (
              <section
                className="p-5 rounded-xl"
                style={{
                  background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                }}
                data-testid="client-detail-next-action"
              >
                <p
                  className="font-mono-kolor mb-2"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--kolor-terra, #B84A2C)',
                  }}
                >
                  Suggested next
                </p>
                <h2
                  className="fraunces-italic mb-2"
                  style={{
                    fontFamily: '"Fraunces", serif',
                    fontStyle: 'italic',
                    fontSize: 24,
                    fontWeight: 500,
                    color: 'var(--kolor-ink, #1A1613)',
                    lineHeight: 1.2,
                  }}
                >
                  {nextAction.label}
                </h2>
                <p
                  className="mb-4"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: 14,
                    color: 'var(--kolor-ink-muted, #5F5751)',
                    lineHeight: 1.6,
                  }}
                >
                  {nextAction.description}
                </p>
                <button
                  onClick={executeNextAction}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{
                    background: 'var(--kolor-terra, #B84A2C)',
                    color: 'var(--kolor-canvas, #F7F4EE)',
                    border: '1px solid var(--kolor-terra, #B84A2C)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                  data-testid="client-detail-next-action-cta"
                >
                  <span>Take action</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </section>
            )}

            {/* ─── Client meta strip (email/phone/project value) ─── */}
            <section
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2"
              data-testid="client-detail-meta"
            >
              {lead.clientEmail && (
                <div>
                  <p
                    className="font-mono-kolor"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--kolor-ink-subtle, #928B84)',
                      marginBottom: 2,
                    }}
                  >
                    Email
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--kolor-ink, #1A1613)' }}>{lead.clientEmail}</p>
                </div>
              )}
              {lead.clientPhone && (
                <div>
                  <p
                    className="font-mono-kolor"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--kolor-ink-subtle, #928B84)',
                      marginBottom: 2,
                    }}
                  >
                    Phone
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--kolor-ink, #1A1613)' }}>{lead.clientPhone}</p>
                </div>
              )}
              {lead.estimatedValue && (
                <div>
                  <p
                    className="font-mono-kolor"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--kolor-ink-subtle, #928B84)',
                      marginBottom: 2,
                    }}
                  >
                    Estimated value
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--kolor-ink, #1A1613)', fontWeight: 600 }}>
                    {currencySymbol}
                    {lead.estimatedValue.toLocaleString()}
                  </p>
                </div>
              )}
            </section>

            {/* ─── Recent activity timeline ─── */}
            <section data-testid="client-detail-activity">
              <p
                className="font-mono-kolor mb-3"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-subtle, #928B84)',
                }}
              >
                Recent activity
              </p>
              {loadingActivities ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="ks-shimmer rounded-lg"
                      style={{ height: 56, border: '1px solid var(--kolor-hairline, #E5E0D8)' }}
                    />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div
                  className="p-6 text-center rounded-lg"
                  style={{
                    border: '1px dashed var(--kolor-hairline, #E5E0D8)',
                    color: 'var(--kolor-ink-muted, #5F5751)',
                  }}
                >
                  <p style={{ fontSize: 13 }}>No activity yet. Start with a note or send a message.</p>
                </div>
              ) : (
                <ul className="space-y-2" data-testid="activity-list">
                  {displayActivities.map((a) => (
                    <li
                      key={a.id}
                      className="flex gap-3 items-start p-3 rounded-lg"
                      style={{
                        background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                        border: '1px solid var(--kolor-hairline, #E5E0D8)',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                        style={{ background: 'var(--kolor-terra, #B84A2C)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 13, color: 'var(--kolor-ink, #1A1613)', lineHeight: 1.5 }}>
                          {a.description}
                        </p>
                        <p
                          className="font-mono-kolor mt-1"
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--kolor-ink-subtle, #928B84)',
                          }}
                        >
                          {relativeTimeShort(a.createdAt)}
                          {a.user && ` · ${a.user.firstName}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!showAllActivity && activities.length > 5 && (
                <button
                  onClick={() => setShowAllActivity(true)}
                  className="mt-3 inline-flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--kolor-terra, #B84A2C)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  data-testid="view-all-activity"
                >
                  View all {activities.length} activities
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </section>

            {/* ─── Quick-access panels ─── */}
            <section className="space-y-3" data-testid="client-detail-quick-access">
              <p
                className="font-mono-kolor"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-subtle, #928B84)',
                }}
              >
                Everything else
              </p>

              {/* Files */}
              <QuickAccessSection
                eyebrow="Deliverables & Assets"
                title="Files"
                count={files.length}
                expanded={expandedPanels.has('files')}
                onToggle={() => togglePanel('files')}
                testId="files"
              >
                <FilesPanel
                  files={files}
                  loading={loadingFiles}
                  onUpload={handleUploadFiles}
                  onRefresh={fetchFiles}
                />
              </QuickAccessSection>

              {/* Pipeline (Quotes + Contracts) */}
              <QuickAccessSection
                eyebrow={`${lang.quotes} + ${lang.contracts}`}
                title="Pipeline"
                expanded={expandedPanels.has('pipeline')}
                onToggle={() => togglePanel('pipeline')}
                testId="pipeline"
              >
                <Suspense fallback={<div style={{ padding: 16, color: 'var(--kolor-ink-muted, #5F5751)' }}>Loading…</div>}>
                  <div className="space-y-6">
                    <div>
                      <p
                        className="font-mono-kolor mb-2"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--kolor-ink-subtle, #928B84)',
                        }}
                      >
                        {lang.quotes}
                      </p>
                      <QuotesTab lead={lead} onQuoteUpdate={() => onUpdate(lead)} />
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid var(--kolor-hairline, #E5E0D8)',
                        paddingTop: 24,
                      }}
                    >
                      <p
                        className="font-mono-kolor mb-2"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--kolor-ink-subtle, #928B84)',
                        }}
                      >
                        {lang.contracts}
                      </p>
                      <ContractsTab leadId={lead.id} lead={lead} onContractSigned={() => onUpdate(lead)} />
                    </div>
                  </div>
                </Suspense>
              </QuickAccessSection>

              {/* Notes */}
              <QuickAccessSection
                eyebrow="Internal Notes"
                title="Notes"
                count={notesCount}
                expanded={expandedPanels.has('notes')}
                onToggle={() => togglePanel('notes')}
                testId="notes"
              >
                <NotesPanel
                  newNote={newNote}
                  setNewNote={setNewNote}
                  onAdd={handleAddNote}
                  adding={addingNote}
                  activities={activities.filter((a) => a.type === 'NOTE_ADDED')}
                />
              </QuickAccessSection>

              {/* Messages */}
              <QuickAccessSection
                eyebrow="Client Messages"
                title="Messages"
                count={messages.length || undefined}
                expanded={expandedPanels.has('messages')}
                onToggle={() => togglePanel('messages')}
                testId="messages"
              >
                <MessagesPanel
                  messages={messages}
                  loading={loadingMessages}
                  newMsg={newMsg}
                  setNewMsg={setNewMsg}
                  onSend={handleSendMessage}
                  sending={sendingMsg}
                  unreadCount={unreadClientMessages}
                />
              </QuickAccessSection>
            </section>

            {/* ─── Portal link footer ─── */}
            {portalUrl && (
              <section
                className="p-4 rounded-lg flex items-center justify-between gap-3"
                style={{
                  background: 'var(--kolor-canvas-shade-1, #F1EDE5)',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                }}
                data-testid="client-detail-portal"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="font-mono-kolor"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--kolor-ink-subtle, #928B84)',
                      marginBottom: 2,
                    }}
                  >
                    Client portal
                  </p>
                  <p
                    className="truncate"
                    style={{ fontSize: 12, color: 'var(--kolor-ink-muted, #5F5751)' }}
                  >
                    {portalUrl}
                  </p>
                </div>
                <button
                  onClick={handleCopyPortalLink}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold flex-shrink-0"
                  style={{
                    background: copiedLink ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-canvas, #F7F4EE)',
                    color: copiedLink ? 'var(--kolor-canvas, #F7F4EE)' : 'var(--kolor-ink, #1A1613)',
                    border: '1px solid var(--kolor-hairline, #E5E0D8)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  data-testid="copy-portal-link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {copiedLink ? 'Copied' : 'Copy link'}
                </button>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {createPortal(content, document.body)}
      {showTakeActionModal && takeActionPrefill && (
        <BulkEmailModal
          selectedIds={[lead.id]}
          clients={[lead]}
          initialSubject={takeActionPrefill.subject}
          initialBody={takeActionPrefill.body}
          titleOverride={nextAction?.label || 'Compose email'}
          onClose={() => setShowTakeActionModal(false)}
          onSent={() => {
            fetchActivities()
          }}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Panel components — Files, Notes, Messages
// ═══════════════════════════════════════════════════════════════════

interface FilesPanelProps {
  files: LeadFile[]
  loading: boolean
  onUpload: (fileList: FileList | null) => void
  onRefresh: () => void
}

function FilesPanel({ files, loading, onUpload }: FilesPanelProps) {
  return (
    <div>
      <label
        className="block p-4 text-center rounded-lg cursor-pointer hover:opacity-80 transition-opacity mb-3"
        style={{
          background: 'var(--kolor-canvas, #F7F4EE)',
          border: '1px dashed var(--kolor-hairline, #E5E0D8)',
          color: 'var(--kolor-ink-muted, #5F5751)',
        }}
        data-testid="files-upload-dropzone"
      >
        <UploadSimple className="w-6 h-6 mx-auto mb-2" />
        <p style={{ fontSize: 13 }}>Drop files or click to upload</p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
          data-testid="files-upload-input"
        />
      </label>
      {loading ? (
        <div style={{ padding: 16, color: 'var(--kolor-ink-muted, #5F5751)', fontSize: 13 }}>Loading files…</div>
      ) : files.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--kolor-ink-muted, #5F5751)', textAlign: 'center', padding: 12 }}>
          No files uploaded yet.
        </p>
      ) : (
        <ul className="space-y-2" data-testid="files-list">
          {files.slice(0, 20).map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: 'var(--kolor-canvas, #F7F4EE)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
              }}
            >
              <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--kolor-ink-subtle, #928B84)' }} />
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 13, color: 'var(--kolor-ink, #1A1613)' }}>
                  {f.originalName}
                </p>
                <p className="font-mono-kolor" style={{ fontSize: 10, color: 'var(--kolor-ink-subtle, #928B84)' }}>
                  {f.formattedSize || `${(f.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
            </li>
          ))}
          {files.length > 20 && (
            <p style={{ fontSize: 12, color: 'var(--kolor-ink-muted, #5F5751)', textAlign: 'center', padding: 6 }}>
              +{files.length - 20} more
            </p>
          )}
        </ul>
      )}
    </div>
  )
}

interface NotesPanelProps {
  newNote: string
  setNewNote: (v: string) => void
  onAdd: () => void
  adding: boolean
  activities: Activity[]
}

function NotesPanel({ newNote, setNewNote, onAdd, adding, activities }: NotesPanelProps) {
  return (
    <div>
      <div className="mb-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note…"
          rows={3}
          className="w-full p-3 rounded-lg resize-none focus:outline-none"
          style={{
            background: 'var(--kolor-canvas, #F7F4EE)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            color: 'var(--kolor-ink, #1A1613)',
            fontSize: 13,
            fontFamily: '"Inter", sans-serif',
          }}
          data-testid="notes-input"
        />
        <button
          onClick={onAdd}
          disabled={adding || !newNote.trim()}
          className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold"
          style={{
            background: newNote.trim() ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-canvas, #F7F4EE)',
            color: newNote.trim() ? 'var(--kolor-canvas, #F7F4EE)' : 'var(--kolor-ink-subtle, #928B84)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            fontSize: 12,
            cursor: adding || !newNote.trim() ? 'not-allowed' : 'pointer',
            opacity: adding ? 0.6 : 1,
          }}
          data-testid="notes-add"
        >
          <Note className="w-3.5 h-3.5" />
          {adding ? 'Adding…' : 'Add note'}
        </button>
      </div>
      {activities.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--kolor-ink-muted, #5F5751)', textAlign: 'center', padding: 6 }}>
          No notes yet.
        </p>
      ) : (
        <ul className="space-y-2" data-testid="notes-list">
          {activities.slice(0, 10).map((a) => (
            <li
              key={a.id}
              className="p-3 rounded-lg"
              style={{
                background: 'var(--kolor-canvas, #F7F4EE)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--kolor-ink, #1A1613)', lineHeight: 1.5 }}>{a.description}</p>
              <p
                className="font-mono-kolor mt-1"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-subtle, #928B84)',
                }}
              >
                {relativeTimeShort(a.createdAt)}
                {a.user && ` · ${a.user.firstName}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface MessagesPanelProps {
  messages: Array<{ id: string; content: string; from: 'CLIENT' | 'CREATIVE'; read: boolean; createdAt: string }>
  loading: boolean
  newMsg: string
  setNewMsg: (v: string) => void
  onSend: () => void
  sending: boolean
  unreadCount: number
}

function MessagesPanel({ messages, loading, newMsg, setNewMsg, onSend, sending, unreadCount }: MessagesPanelProps) {
  return (
    <div>
      {unreadCount > 0 && (
        <p
          className="mb-2 font-mono-kolor"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--kolor-terra, #B84A2C)',
          }}
        >
          {unreadCount} unread client message{unreadCount === 1 ? '' : 's'}
        </p>
      )}
      {loading ? (
        <div style={{ padding: 16, color: 'var(--kolor-ink-muted, #5F5751)', fontSize: 13 }}>Loading messages…</div>
      ) : messages.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--kolor-ink-muted, #5F5751)', textAlign: 'center', padding: 12 }}>
          No messages yet.
        </p>
      ) : (
        <ul className="space-y-2 mb-3 max-h-[280px] overflow-y-auto" data-testid="messages-list">
          {messages.slice(-20).map((m) => (
            <li
              key={m.id}
              className="p-3 rounded-lg"
              style={{
                background: m.from === 'CLIENT' ? 'var(--kolor-canvas, #F7F4EE)' : 'var(--kolor-ink, #1A1613)',
                color: m.from === 'CLIENT' ? 'var(--kolor-ink, #1A1613)' : 'var(--kolor-canvas, #F7F4EE)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
              }}
            >
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{m.content}</p>
              <p
                className="font-mono-kolor mt-1"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: m.from === 'CLIENT' ? 'var(--kolor-ink-subtle, #928B84)' : 'rgba(247,244,238,0.6)',
                }}
              >
                {m.from === 'CLIENT' ? 'Client' : 'You'} · {relativeTimeShort(m.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div>
        <textarea
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Send a message to the client…"
          rows={2}
          className="w-full p-3 rounded-lg resize-none focus:outline-none"
          style={{
            background: 'var(--kolor-canvas, #F7F4EE)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            color: 'var(--kolor-ink, #1A1613)',
            fontSize: 13,
            fontFamily: '"Inter", sans-serif',
          }}
          data-testid="messages-input"
        />
        <button
          onClick={onSend}
          disabled={sending || !newMsg.trim()}
          className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold"
          style={{
            background: newMsg.trim() ? 'var(--kolor-terra, #B84A2C)' : 'var(--kolor-canvas, #F7F4EE)',
            color: newMsg.trim() ? 'var(--kolor-canvas, #F7F4EE)' : 'var(--kolor-ink-subtle, #928B84)',
            border: '1px solid var(--kolor-hairline, #E5E0D8)',
            fontSize: 12,
            cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.6 : 1,
          }}
          data-testid="messages-send"
        >
          <PaperPlaneTilt className="w-3.5 h-3.5" />
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
