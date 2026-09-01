// iter 293-v3.1-v3a — Today card action content resolver.
//
// Purpose: given an AttentionItem from GET /api/today, decide whether the
// action button should:
//   (a) open BulkEmailModal single-recipient with contextual pre-fill, OR
//   (b) open ClientDetail at a specific section (structured workflow /
//       exploratory read)
//
// Rationale (Interpretation X per Q1.3=A):
//   Directive email-style actions ("Send reminder" / "Follow up" / "Reply" /
//   "Message") invoke the composer directly. Structured actions ("Send offer"
//   / "Mark done" / "Schedule" / "Review") open ClientDetail at the correct
//   tab for the workflow.
//
// Contextual pre-fill helpers are stage-aware and reference client name for
// warmth. Fallback subjects/bodies gracefully cover unrecognised action
// labels (per Q2b=b: log warning + fall back).

import type { AttentionItem } from '../components/dashboard/useTodayData'

export type TodayActionRoute =
  | { kind: 'email'; subject: string; body: string; titleOverride: string }
  | { kind: 'detail'; tab: string }

/**
 * Decides how to route a Today card action. Called from Dashboard.tsx
 * onLeadClick callback.
 */
export function resolveTodayAction(item: AttentionItem): TodayActionRoute {
  const label = (item.actionLabel || '').toLowerCase()
  const clientName = item.clientName || 'them'

  // Directive email actions — open BulkEmailModal single-recipient
  if (label === 'send reminder') {
    return {
      kind: 'email',
      subject: getReminderSubject(item),
      body: getReminderBody(item),
      titleOverride: `Send reminder to ${clientName}`,
    }
  }

  if (label === 'follow up') {
    return {
      kind: 'email',
      subject: getFollowUpSubject(item),
      body: getFollowUpBody(item),
      titleOverride: `Follow up with ${clientName}`,
    }
  }

  if (label === 'reply' || label === 'message') {
    return {
      kind: 'email',
      subject: `Re: your inquiry`,
      body: getReplyBody(item),
      titleOverride: `Reply to ${clientName}`,
    }
  }

  // Structured workflow / exploratory actions — open ClientDetail
  if (label === 'send offer') {
    return { kind: 'detail', tab: 'pipeline' }
  }

  if (label === 'mark done' || label === 'mark complete' || label === 'schedule') {
    return { kind: 'detail', tab: item.actionRoute || 'overview' }
  }

  if (label === 'review') {
    return { kind: 'detail', tab: item.actionRoute || 'overview' }
  }

  // Unknown label — log + fall back to ClientDetail with actionRoute
  console.warn(`[TodayAction] Unrecognised actionLabel "${item.actionLabel}" for type "${item.type}" — falling back to ClientDetail`)
  return { kind: 'detail', tab: item.actionRoute || 'overview' }
}

// ─── Contextual subject/body helpers ─────────────────────────────────────

function getReminderSubject(item: AttentionItem): string {
  if (item.type === 'contract_unsigned') return `Contract reminder`
  if (item.type === 'payment_overdue') return `Payment reminder`
  return `A quick reminder`
}

function getReminderBody(item: AttentionItem): string {
  const name = item.clientName || 'there'
  if (item.type === 'contract_unsigned') {
    const days = item.daysOverdue ?? 1
    return `Hi ${name},\n\nJust a friendly reminder — I sent over a contract ${days} day${days !== 1 ? 's' : ''} ago and wanted to check whether everything looks good on your end. Happy to walk through anything if it helps.\n\nLet me know when you have a moment.\n\nBest,`
  }
  if (item.type === 'payment_overdue') {
    const days = item.daysOverdue ?? 1
    return `Hi ${name},\n\nI hope things are well. A quick note — the payment on your project is ${days} day${days !== 1 ? 's' : ''} past due. Let me know if there's anything I can help clarify, or if a new invoice would be useful.\n\nThanks,`
  }
  return `Hi ${name},\n\nJust circling back on this. Let me know if you have any questions or if there's anything I can help move forward.\n\nBest,`
}

function getFollowUpSubject(item: AttentionItem): string {
  if (item.type === 'quote_expiring') return `Your quote expires soon`
  if (item.type === 'quote_viewed') return `Any questions on the quote?`
  if (item.type === 'stale_lead') return `Checking in`
  return `Following up`
}

function getFollowUpBody(item: AttentionItem): string {
  const name = item.clientName || 'there'
  if (item.type === 'quote_expiring') {
    return `Hi ${name},\n\nQuick heads-up — the quote I sent over is expiring soon. Wanted to check whether you'd like to move forward or if there's anything you'd like to adjust. Happy to extend or revise if that helps.\n\nLet me know your thoughts.\n\nBest,`
  }
  if (item.type === 'quote_viewed') {
    return `Hi ${name},\n\nSaw you had a chance to look at the quote — thanks for taking the time. Wanted to check in and see if there are any questions I can answer or details I can clarify.\n\nHappy to hop on a quick call if that's easier.\n\nBest,`
  }
  if (item.type === 'stale_lead') {
    return `Hi ${name},\n\nJust circling back — I know things get busy. Wanted to check in and see whether the timing is still right for your project, or if there's a better window we should aim for.\n\nHappy to pick up whenever it works.\n\nBest,`
  }
  return `Hi ${name},\n\nWanted to circle back on our conversation. Let me know if you have any questions or if there's a good time to talk next.\n\nBest,`
}

function getReplyBody(item: AttentionItem): string {
  const name = item.clientName || 'there'
  return `Hi ${name},\n\nThanks so much for reaching out — really appreciate you thinking of me for this. I'd love to hear more about what you're planning.\n\n[Add your reply here]\n\nLooking forward to it,`
}
