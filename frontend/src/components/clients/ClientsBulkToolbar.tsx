// iter 292-v3b — Bulk actions floating toolbar.
// iter 293-v3a — Send Reminder + Send Email completed via backend batch
// endpoints (POST /api/leads/bulk/{archive,stage,tag,reminder,email}).
//
// Per Q6=B standard bulk actions:
//   - Archive:       POST /api/leads/bulk/archive → sets status='LOST'
//   - Stage change:  POST /api/leads/bulk/stage
//   - Tag:           POST /api/leads/bulk/tag
//   - Send Reminder: POST /api/leads/bulk/reminder (contextual per-stage body)
//   - Send Email:    POST /api/leads/bulk/email (creator-composed compose modal)
//
// Portaled to document.body to escape any backdrop-filter containing-block
// trap (Dashboard v3c.2 codified lesson).

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Archive } from '@phosphor-icons/react/dist/csr/Archive'
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
import { Tag as TagIcon } from '@phosphor-icons/react/dist/csr/Tag'
import { Bell } from '@phosphor-icons/react/dist/csr/Bell'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/csr/PaperPlaneTilt'
import { X } from '@phosphor-icons/react/dist/csr/X'
import type { LeadStatus } from '../../services/api'
import type { IndustryLanguage } from '../../utils/industryLanguage'
import { useConfirm } from '../ConfirmProvider'

const V3_TO_LEAD_STATUS: Record<string, LeadStatus> = {
  inquiry: 'NEW',
  discovery: 'CONTACTED',
  quoted: 'QUOTED',
  contracted: 'BOOKED',
  completed: 'BOOKED', // BOOKED with past eventDate is the "completed" heuristic
}

interface ClientsBulkToolbarProps {
  selectedCount: number
  lang: IndustryLanguage
  onArchive: () => Promise<void> | void
  onStageChange: (status: LeadStatus) => Promise<void> | void
  onTag: (tag: string) => Promise<void> | void
  onSendReminder: () => Promise<void> | void
  onSendEmail: () => void
  onClearSelection: () => void
  // iter 293-v3b — Archived preset context. When true, toolbar shows a
  // single 'Restore' action instead of the standard bulk actions.
  viewingArchived?: boolean
  onRestore?: () => Promise<void> | void
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  minHeight: 36,
  background: 'transparent',
  border: 'none',
  color: 'var(--kolor-canvas, #F7F4EE)',
  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background 200ms ease-out',
  borderRadius: 2,
}

export function ClientsBulkToolbar({
  selectedCount,
  lang,
  onArchive,
  onStageChange,
  onTag,
  onSendReminder,
  onSendEmail,
  onClearSelection,
  viewingArchived = false,
  onRestore,
}: ClientsBulkToolbarProps) {
  const [stageMenuOpen, setStageMenuOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [pending, setPending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) {
        setStageMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const { confirm } = useConfirm()

  const handleArchive = async () => {
    if (pending) return
    const ok = await confirm({
      title: `Archive ${selectedCount} client${selectedCount === 1 ? '' : 's'}?`,
      message: selectedCount === 1
        ? `This client will be moved to the Lost stage. You can restore them anytime.`
        : `These ${selectedCount} clients will be moved to the Lost stage. You can restore them anytime.`,
      confirmLabel: 'Archive',
      cancelLabel: 'Cancel',
      variant: 'danger',
    })
    if (!ok) return
    setPending(true)
    try {
      await onArchive()
    } finally {
      setPending(false)
    }
  }

  const handleStageChange = async (status: LeadStatus) => {
    if (pending) return
    setStageMenuOpen(false)
    setPending(true)
    try {
      await onStageChange(status)
    } finally {
      setPending(false)
    }
  }

  const handleTagSubmit = async () => {
    const t = tagInput.trim()
    if (!t || pending) return
    setPending(true)
    try {
      await onTag(t)
      setTagInput('')
      setTagModalOpen(false)
    } finally {
      setPending(false)
    }
  }

  return createPortal(
    <>
      <div
        ref={rootRef}
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 6px',
          background: 'var(--kolor-ink, #1A1613)',
          border: '1px solid var(--kolor-ink, #1A1613)',
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(26, 22, 19, 0.24)',
          minWidth: 320,
          maxWidth: 'calc(100vw - 32px)',
        }}
        data-testid="clients-bulk-toolbar"
      >
        <span
          style={{
            padding: '8px 12px',
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--kolor-terra, #B84A2C)',
            borderRight: '1px solid rgba(255,255,255,0.12)',
          }}
          data-testid="clients-bulk-count"
        >
          {selectedCount} selected
        </span>

        {viewingArchived ? (
          <button
            type="button"
            onClick={async () => {
              if (pending || !onRestore) return
              setPending(true)
              try { await onRestore() } finally { setPending(false) }
            }}
            disabled={pending || !onRestore}
            style={btnStyle}
            data-testid="clients-bulk-restore"
            title="Restore selected clients from archive"
          >
            <Archive size={11} weight="regular" />
            Restore
          </button>
        ) : (
        <>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setStageMenuOpen((v) => !v)}
            style={btnStyle}
            data-testid="clients-bulk-stage"
          >
            Stage
            <CaretDown size={10} weight="bold" />
          </button>
          {stageMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--kolor-canvas, #F7F4EE)',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                borderRadius: 2,
                minWidth: 200,
                boxShadow: '0 4px 16px rgba(26, 22, 19, 0.18)',
              }}
            >
              {(['inquiry', 'discovery', 'quoted', 'contracted', 'completed'] as const).map(
                (stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => handleStageChange(V3_TO_LEAD_STATUS[stage])}
                    style={{
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--kolor-hairline, #E5E0D8)',
                      textAlign: 'left',
                      fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'var(--kolor-ink, #1A1613)',
                      cursor: 'pointer',
                    }}
                    data-testid={`clients-bulk-stage-${stage}`}
                  >
                    {lang.stages[stage]}
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setTagModalOpen(true)}
          style={btnStyle}
          data-testid="clients-bulk-tag"
        >
          <TagIcon size={11} weight="regular" />
          Tag
        </button>

        <button
          type="button"
          onClick={async () => {
            if (pending) return
            setPending(true)
            try { await onSendReminder() } finally { setPending(false) }
          }}
          disabled={pending}
          style={btnStyle}
          data-testid="clients-bulk-reminder"
          title="Send contextual reminder to selected clients"
        >
          <Bell size={11} weight="regular" />
          Remind
        </button>

        <button
          type="button"
          onClick={onSendEmail}
          style={btnStyle}
          data-testid="clients-bulk-email"
          title="Compose bulk email to selected clients"
        >
          <PaperPlaneTilt size={11} weight="regular" />
          Email
        </button>

        <button
          type="button"
          onClick={handleArchive}
          disabled={pending}
          style={btnStyle}
          data-testid="clients-bulk-archive"
        >
          <Archive size={11} weight="regular" />
          Archive
        </button>
        </>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          aria-label="Clear selection"
          style={{ ...btnStyle, padding: '8px 10px', color: 'var(--kolor-ink-subtle, #928B84)' }}
          data-testid="clients-bulk-clear"
        >
          <X size={12} weight="bold" />
        </button>
      </div>

      {tagModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 210,
            background: 'rgba(26, 22, 19, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setTagModalOpen(false)}
          data-testid="clients-bulk-tag-modal"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--kolor-canvas, #F7F4EE)',
              border: '1px solid var(--kolor-hairline, #E5E0D8)',
              borderRadius: 2,
              padding: 24,
              minWidth: 340,
              maxWidth: 480,
              width: '90vw',
            }}
          >
            <h3
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 22,
                color: 'var(--kolor-ink, #1A1613)',
                margin: 0,
                marginBottom: 8,
              }}
            >
              Add tag to {selectedCount} client{selectedCount === 1 ? '' : 's'}
            </h3>
            <p
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                color: 'var(--kolor-ink-muted, #5F5751)',
                margin: 0,
                marginBottom: 16,
              }}
            >
              Applied to every selected client. Existing tags are preserved.
            </p>
            <input
              autoFocus
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTagSubmit()
                if (e.key === 'Escape') setTagModalOpen(false)
              }}
              placeholder="wedding, outdoor, editorial…"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'transparent',
                border: '1px solid var(--kolor-hairline, #E5E0D8)',
                borderRadius: 2,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                color: 'var(--kolor-ink, #1A1613)',
                outline: 'none',
                marginBottom: 16,
              }}
              data-testid="clients-bulk-tag-input"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setTagModalOpen(false)}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid var(--kolor-hairline, #E5E0D8)',
                  borderRadius: 2,
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--kolor-ink-muted, #5F5751)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTagSubmit}
                disabled={pending || !tagInput.trim()}
                style={{
                  padding: '8px 14px',
                  background: 'var(--kolor-terra, #B84A2C)',
                  color: 'var(--kolor-canvas, #F7F4EE)',
                  border: 'none',
                  borderRadius: 2,
                  fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  cursor: pending ? 'not-allowed' : 'pointer',
                  opacity: pending || !tagInput.trim() ? 0.5 : 1,
                }}
                data-testid="clients-bulk-tag-submit"
              >
                Apply tag
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  )
}

export default ClientsBulkToolbar
