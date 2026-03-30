# KOLOR STUDIO — Product Requirements Document

## Original Problem Statement
A full-stack CRM for creative professionals (photographers, designers, fine artists) with features including lead management, quotes, contracts, booking, calendar integration, client portal, and industry-specific terminology.

## User Personas
- **Photographers** — Manage shoots, send quotes, track bookings
- **Designers** — Manage projects, proposals, contracts
- **Fine Artists** — Manage commissions, offers, deliveries

## Core Requirements
- Secure HTTP-Only cookie authentication with "Remember Me"
- Industry-specific UI language (via `industryLanguage.ts`)
- 2-step signup with industry selection
- Dashboard with Kanban, List, Analytics, Calendar, Portfolio, Quotes, Contracts views
- Lead management with CRUD, status tracking, discovery calls
- Quote builder, contract management, file sharing
- Client portal with approval workflow, celebration states
- Email integration (Resend) with V2.0 branded design system
- Calendar integration (Google Calendar)
- Settings page with profile, notifications, integrations, account

## Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + Phosphor Icons
- **Backend**: Express.js + Prisma + PostgreSQL + node-cron
- **3rd Party**: Resend (email), Google Calendar, Sentry (stub), Plausible (stub)

## Architecture
```
/app/kolor-studio-v2/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── scheduler.ts              ← node-cron daily 9am + Monday 8am
│   │   ├── routes/
│   │   │   ├── auth.ts               ← change-password, welcome/beta emails wired
│   │   │   ├── contracts.ts          ← GET /all, celebration flag, PATCH /viewed
│   │   │   ├── portal.ts             ← auto viewedAt, studioName
│   │   │   ├── settings.ts           ← notification prefs in PATCH
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── email.ts              ← 29+ email functions, V2.0 templates
│   │   │   └── emailDesignSystem.ts  ← V2.0: buildEmailTemplate, box helpers, statRow
│   │   └── utils/
│   │       └── industryLanguage.ts   ← Backend industry language utility
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.tsx          ← Contracts + Settings sidebar
    │   │   ├── Contracts.tsx          ← Premium contracts list view
    │   │   ├── ClientPortal.tsx       ← Redesigned with celebration overlay
    │   │   ├── Settings.tsx           ← NEW: 4-tab settings page
    │   │   ├── Quotes.tsx
    │   │   └── ...
    │   ├── App.tsx                    ← /settings route added
    │   └── utils/
    │       └── industryLanguage.ts
    └── public/
```

---

## What's Been Implemented

### Iterations 100-102: Dashboard, Quick Actions, Landing Page Enhancements
### Iteration 103: Leads Page + Lead Detail Modal Full Rebuild
### Iteration 104: Quote Builder Premium UI + Quotes List View
### Iteration 105: Contracts Page + Client Portal Redesign + Automation Wiring (Mar 30)
### Iteration 106: Email Design System V2.0 + 29 Templates + Settings + Scheduler (Mar 30)

**Workstream 1 — Email Design System V2.0:**
- Complete rewrite of `emailDesignSystem.ts` with premium dark-header/warm-body design
- All HTML tables, inline styles, no CSS variables — Gmail/Outlook compatible
- Exported: `buildEmailTemplate()`, `highlightBox()`, `successBox()`, `warningBox()`, `errorBox()`, `infoBox()`, `cardBlock()`, `detailRow()`, `statRow()`, `formatCurrency()`, `formatDate()`, `formatDateShort()`
- All existing function signatures preserved (backward compatible)

**Workstream 2 — All 29 Email Templates:**
- Updated `getEmailTemplate()` wrapper to use V2.0 `buildEmailTemplate()` — auto-upgrades all existing emails
- Updated #01 `sendVerificationEmail` and #03 `sendPasswordResetEmail` with V2.0 design
- Added 16 new functions: #02 `sendWelcomeEmail` (industry-adaptive), #04 `sendPasswordChangedEmail`, #05 `sendNewDeviceLoginEmail` (scaffold), #06 `sendBetaWelcomeEmail`, #08 `sendLeadStaleNudge`, #13 `sendQuoteViewedNudge`, #14 `sendContractUnsignedWarning`, #16 `sendWeeklyPipelineReport`, #17 `sendQuoteExpiryWarning`, #18 `sendCalendarDisconnectedAlert`, #21 `sendQuoteExpiryNoticeToClient`, #23 `sendContractReminderToClient`, #24 `sendDiscoveryCallInviteToClient`, #27 `sendNewUserSignupAlert`, #28 `sendBetaFullAlert`, #29 `sendHealthCheckFailureAlert`
- Client-facing emails use `replyTo: photographer.email` (replies go to photographer)
- All sends wrapped in try-catch (failures never crash callers)

**Workstream 3 — Settings Page:**
- Created `/settings` route with 4-tab layout (Profile, Notifications, Integrations, Account)
- Profile: firstName, businessName, industry selector (3-card), email (read-only)
- Notifications: 3 toggles (weekly report, stale lead reminders, quote viewed nudge)
- Integrations: Google Calendar connect/disconnect, email domain info, Stripe/Zapier coming soon
- Account: Change password form (wired to new POST /api/auth/change-password), Danger zone scaffold
- Schema: Added `weeklyReportEnabled`, `staleLeadEmailEnabled`, `quoteNudgeEmailEnabled` to User model
- Dashboard sidebar: Added "Settings" link with GearSix icon

**Workstream 4 — node-cron Scheduler:**
- Created `scheduler.ts` with `startScheduler()` function
- Daily 9am UTC: stale lead nudges (7d), quote viewed nudges (48-98hr), contract unsigned warnings (72-99hr), quote expiry warnings (3 days before)
- Monday 8am UTC: weekly pipeline report (stats + stale leads)
- Production-only: `NODE_ENV=production` gate
- Per-user error handling: one failing user never stops others

**Wiring:**
- `sendWelcomeEmail` / `sendBetaWelcomeEmail` called in onboarding endpoint
- `sendNewUserSignupAlert` called on signup
- `sendPasswordChangedEmail` called on password change + password reset
- Scheduler wired into server.ts

**Testing: 100% frontend, 100% backend (12/12 + change-password fix)**

---

## Prioritized Backlog

### P1
- Mobile responsiveness polish for Contracts + Settings + Portal
- Pipeline/Kanban view for Leads
- Industry language rollout to Calendar
- Launch Prep: Production domains, DNS (SPF/DKIM for Resend)

### P2
- Wire real historical trend data to StatCard sparklines
- Meeting booking widget embed
- "Smart Inbox" view for files needing review
- "File Request" feature
- Visual Sequence Builder
- A/B test landing page hero copy

## Test Credentials
- email: `bookingtest@test.com`, password: `password123`

## Key API Endpoints
- `GET /api/settings` — User settings with notification prefs
- `PATCH /api/settings` — Save profile + notification prefs
- `POST /api/auth/change-password` — Change password (authenticated)
- `GET /api/contracts/all` — All contracts for user
- `POST /api/contracts/:id/agree` — Sign contract (returns celebration: true)
- `GET /api/portal/:token` — Portal data (auto-marks contracts viewed)
