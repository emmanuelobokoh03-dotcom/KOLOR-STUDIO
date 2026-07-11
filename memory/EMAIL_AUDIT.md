# KOLOR Studio — Email Audit Report (Iteration 262, June 2026)
READ-ONLY audit. HEAD `850de46`, working tree clean, zero code changes.

## 1. Infrastructure
| File | Lines | Role |
|---|---|---|
| `backend/src/services/email.ts` | 3,840 | ALL 58 send functions + `getEmailTemplate` legacy wrapper |
| `backend/src/services/emailDesignSystem.ts` | 303 | Shared design system: `buildEmailTemplate`, colors/fonts/spacing tokens, button styles, highlight/success/warning/error/info boxes, `detailRow`, `statRow`, currency/date formatters |
| `backend/src/services/emailTracking.ts` | 70 | Open-tracking pixel (`/api/track/open/:id`), open-rate per sequence step |
| `backend/src/services/scheduledEmailService.ts` | 95 | Processes `scheduledEmail` table → testimonial request, file review reminder, post-call quote reminder |
| `backend/src/services/sequenceEngine.ts` | 168 | Drip sequences; cron in `server.ts:379-381` + `worker.ts` |
| `backend/src/routes/emailPreview.ts` | 421 | `/api/preview-email` gallery of 23 templates (dev/QA tool) |

- **Resend integration**: `resend` SDK, guarded (`if (!resend) return false`). Sandbox detection warns when `SENDER_EMAIL` contains `resend.dev` (sandbox can only email the account owner).
- **Env vars**: `RESEND_API_KEY`, `SENDER_EMAIL` (fallback `onboarding@resend.dev`), `OWNER_NOTIFICATION_EMAIL`, `ADMIN_EMAIL`, `FRONTEND_URL` (fallback `https://kolorstudio.app`).
- **From addresses**: `KOLOR STUDIO <sender>` (most), `${studioName} via KOLOR <sender>` (inquiry ack — good personalization), `KOLOR System <sender>` (admin alerts).
- **No template files** (.hbs/.ejs/.mjml) — all HTML built in TS. Table-based layout, 478 inline styles: correct approach for email clients.
- **Unsubscribe**: 13 references incl. `List-Unsubscribe` headers; dedicated `routes/unsubscribe.ts` checks SequenceEnrollment.

## 2. Design pattern consistency — GOOD (1 outlier)
- 36 functions use `getEmailTemplate()` (legacy wrapper that delegates to `buildEmailTemplate` with a headline-strip hack).
- 22 use `buildEmailTemplate()` directly (modern path, e.g. `sendWelcomeEmail` with industry-aware copy + founder highlight box).
- **1 raw-HTML outlier: `sendPaymentNudge`** (line 3523) — sends without any shared template. Fix candidate.
- The `getEmailTemplate` `.replace()` hack strips an empty `<h1>` by exact-string match — brittle; if `buildEmailTemplate`'s h1 style string ever changes, 36 emails get an empty heading artifact.

## 3. Function inventory — 58 send functions, 53 wired, 5 ORPHANS
### TRUE ORPHANS (defined, never called — only stale `dist/` build artifacts reference them)
| Function | Line | Intended trigger (inferred) |
|---|---|---|
| `sendNewDeviceLoginEmail` | 3020 | Login from unrecognized device (security) |
| `sendCalendarDisconnectedAlert` | 3287 | Google Calendar OAuth token expiry |
| `sendContractReminderToClient` | 3354 | Unsigned contract nudge → client |
| `sendDiscoveryCallInviteToClient` | 3392 | Invite client to schedule a call |
| `sendBetaFullAlert` | 3467 | Admin alert when 10/10 beta spots filled |

### Wired functions by category (caller counts verified)
- **Auth/security (user)**: welcome (auth.ts:155, founder note ≤10 users), verification (x2 call sites), password reset, password changed, account lockout.
- **Lead pipeline (owner)**: new lead notification (4 sites), quote accepted/declined, contract signed, payment received (5 sites), new message, client message, quote viewed nudge, lead stale nudge (scheduler.ts), contract unsigned warning, quote expiry warning, post-call quote reminder, weekly digest (digest.ts), weekly pipeline report (scheduler.ts).
- **Client-facing**: client confirmation, inquiry acknowledgement (status-aware, 6 status subjects incl. localized `iLang`), status change, portal link, quote delivery, booking confirmation, contract sent, auto-response, deposit request/received, delivery, final payment request/received, testimonial request, file review reminder, meeting confirmation/reminder, quote expiry notice, onboarding (3-email series), quote follow-up (3-email series), sample quote preview.
- **Community**: DM / like / comment / follow notifications (all wired x2).
- **Admin**: new signup alert (`ADMIN_EMAIL`), health-check failure (webhooks.ts:155 — wired, contrary to the "scaffold TODO" comment at line 3497).
- **Automation**: sequences (sequenceEngine + cron), scheduled emails (testimonial/file-review/post-call), payment nudge (Stripe-signed-but-unpaid).

## 4. Copy quality — mostly strong
- Subjects are specific and personalized (`${clientName} accepted your quote! ($X)`, `${clientName} hasn't heard from you in N days`). Industry-aware language (`getIndustryLanguage`: photography/design/fine-art terms). Good urgency framing on nudges.
- **Weak subjects**: `'Booking Confirmed!'` (deposit received, line 1642 — no project context), `'How Was Your Experience?'` (1800 — generic, title-case), `'Thanks for reaching out!'` (1557 auto-response — dupes 263's subject; a client could receive both `sendClientConfirmation` and `sendAutoResponseEmail` with near-identical subjects → possible double-send confusion, worth tracing in iter 263).
- One emoji subject (`🎉` on quote accepted) — fine; deliverability impact negligible.

## 5. Test coverage
- Python pytest files exist (`test_email_light_theme.py`, `test_email_tracking.py`, `test_quote_email_send_p0_fix.py`, `test_contract_email_send.py`, `test_day12_email_notifications.py`, `test_file_upload_notifications.py`) — Section 9's TS-oriented grep missed them; coverage exists for tracking, theme, quote/contract sends.

## 6. Priority recommendations for iter 263+
1. **P0 — Wire or delete the 5 orphans.** `sendNewDeviceLoginEmail` (security value, needs device fingerprint at login), `sendCalendarDisconnectedAlert` (Google OAuth refresh-failure hook), `sendBetaFullAlert` (1-line call in signup route next to `sendNewUserSignupAlert`). `sendContractReminderToClient` + `sendDiscoveryCallInviteToClient` → wire to scheduler or delete (iter 261 delete-over-orphan pattern).
2. **P1 — Trace double auto-reply risk**: `sendClientConfirmation` vs `sendAutoResponseEmail` vs `sendInquiryAcknowledgementEmail` — 3 "we got your inquiry" emails; verify only one fires per inquiry path.
3. **P1 — Migrate `sendPaymentNudge`** to `buildEmailTemplate` (last raw-HTML email).
4. **P2 — Retire `getEmailTemplate` legacy wrapper** (36 call sites) → direct `buildEmailTemplate` with real headlines; removes the brittle `.replace()` h1-strip hack.
5. **P2 — Subject polish**: 'Booking Confirmed!' → add project title; 'How Was Your Experience?' → personalize.
6. **P2 — Sandbox guard**: production must set `SENDER_EMAIL` to a verified domain; consider failing loudly (not just console.warn) in production env.
