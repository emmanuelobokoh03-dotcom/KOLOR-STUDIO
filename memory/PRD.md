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
- Email integration (Resend)
- Calendar integration (Google Calendar)

## Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + Phosphor Icons
- **Backend**: Express.js + Prisma + PostgreSQL
- **3rd Party**: Resend (email), Google Calendar, Vercel Analytics, Sentry (stub)

## Architecture
```
/app/kolor-studio-v2/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/
│       │   ├── quotes.ts
│       │   ├── contracts.ts    ← GET /all, PATCH /viewed, POST /agree (celebration flag)
│       │   ├── portal.ts       ← Auto viewedAt on portal load
│       │   └── ...
│       └── services/
│           ├── email.ts        ← sendQuoteAcceptedNotification, sendContractAgreedNotification
│           └── emailDesignSystem.ts
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LeadsListView.tsx
    │   │   ├── LeadDetailModal.tsx
    │   │   ├── QuoteBuilderModal.tsx
    │   │   ├── ContractsTab.tsx
    │   │   └── ...
    │   ├── pages/
    │   │   ├── Dashboard.tsx       ← ViewMode includes 'contracts'
    │   │   ├── Contracts.tsx       ← NEW (Iter 105)
    │   │   ├── Quotes.tsx
    │   │   ├── ClientPortal.tsx    ← REDESIGNED (Iter 105)
    │   │   └── ...
    │   └── utils/
    │       └── industryLanguage.ts
    └── public/
```

---

## What's Been Implemented

### Iteration 100: Dashboard Premium Upgrade
### Iteration 101: Quick Actions + Industry Language Utility
### Iteration 102: 7 Surgical Landing Page Enhancements + JSON-LD
### Iteration 103: Leads Page + Lead Detail Modal Full Rebuild
### Iteration 104: Quote Builder Premium UI + Quotes List View

### Iteration 105: Contracts Page + Client Portal Redesign + Automation Wiring (Mar 30, 2026)
**Workstream 1 — Contracts Page:**
- Created full-page `Contracts.tsx` with sidebar navigation (`sidebar-contracts`)
- Added `GET /api/contracts/all` backend endpoint (with lead join data)
- Stats strip: Total, Awaiting Signature, Signed, Sign Rate
- Pill tabs: All/Draft/Sent/Viewed/Signed with count badges
- Contract rows with client avatar, status badges, urgency badges ("Viewed Nd ago", "Nd no response")
- Celebration badge for signed contracts (green Confetti icon)
- Empty state explaining contracts are auto-generated from accepted quotes
- Industry language integration (`lang.contracts`, `lang.contract`)

**Workstream 2 — Client Portal Redesign:**
- Complete UI overhaul of `ClientPortal.tsx` with dark header, minimal card-based layout
- Studio branding with `contact.studioName` from backend
- Premium quote approval view with accept/decline buttons
- `QuoteAcceptedConfirmation` component for post-approval state
- `CelebrationOverlay` full-screen celebration for contract signing (triggered by `celebration: true` API flag)
- Contract signing view with checkbox and sign button
- Signed contract confirmation state

**Workstream 3 — Automation Wiring:**
- Quote approval → `sendQuoteAcceptedNotification` already wired in quotes.ts
- Contract signing → `sendContractAgreedNotification` already wired in contracts.ts, added `celebration: true` to response
- Portal load → auto-marks SENT contracts as VIEWED with `viewedAt` timestamp
- `PATCH /api/contracts/:id/viewed` endpoint for explicit viewedAt marking
- `logActivity` called for contract viewed and signed events

**Testing: 100% pass — 9 backend tests, full frontend verification**

---

## Prioritized Backlog

### P1
- Weekly Pipeline Report auto-email
- Pipeline/Kanban view build (LeadsPipelineView.tsx sibling component)
- Industry language rollout to Calendar screen
- Mobile responsiveness polish for Contracts page + Client Portal
- Launch Prep: Production domains, DNS records (SPF/DKIM for Resend)

### P2
- Wire real historical trend data to StatCard sparklines
- Meeting booking widget embed code
- "Smart Inbox" view for files needing review
- "File Request" feature
- Smart Scheduling (suggests optimal meeting times)
- Visual Sequence Builder
- A/B test landing page hero copy variants

## Test Credentials
- email: `bookingtest@test.com`, password: `password123`

## Key API Endpoints
- `GET /api/contracts/all` — All contracts for authenticated user (with lead data)
- `GET /api/contracts/pending` — DRAFT contracts for authenticated user
- `POST /api/contracts/:id/agree` — Sign contract (returns celebration: true)
- `PATCH /api/contracts/:id/viewed` — Mark contract as viewed (public, needs portalToken)
- `GET /api/quotes/all` — All quotes for authenticated user
- `POST /api/quotes/public/:quoteToken/accept` — Client accepts quote (triggers notification)
- `GET /api/portal/:token` — Portal data (auto-marks contracts viewed)
