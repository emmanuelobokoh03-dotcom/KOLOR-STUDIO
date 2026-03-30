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
- Dashboard with Kanban, List, Analytics, Calendar, Portfolio, Quotes views
- Lead management with CRUD, status tracking, discovery calls
- Quote builder, contract management, file sharing
- Client portal with approval workflow
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
│       │   ├── quotes.ts       ← Added GET /api/quotes/all (Iter 104)
│       │   └── ...
│       └── server.ts
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LeadsListView.tsx     (Iter 103)
    │   │   ├── LeadDetailModal.tsx   (Iter 103)
    │   │   ├── QuoteBuilderModal.tsx ← REBUILT (Iter 104)
    │   │   ├── QuotesTab.tsx
    │   │   ├── QuickActions.tsx
    │   │   ├── StatCard.tsx
    │   │   └── StatusBadge.tsx
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Quotes.tsx            ← NEW (Iter 104)
    │   │   ├── LandingPageV2.tsx
    │   │   └── Signup.tsx
    │   └── utils/
    │       └── industryLanguage.ts
    └── public/
```

---

## What's Been Implemented

### Iteration 100: Dashboard Premium Upgrade ✅
### Iteration 101: Quick Actions + Industry Language Utility ✅
### Iteration 102: 7 Surgical Landing Page Enhancements + JSON-LD ✅
### Iteration 103: Leads Page + Lead Detail Modal Full Rebuild ✅
- Extracted LeadsListView.tsx, stats strip, pill tabs, hover quick-actions
- Split-panel Lead Detail Modal with relationship timeline
- 20/20 tests passing

### Iteration 104: Quote Builder Premium UI + Quotes List View ✅
**Workstream 1 — Quotes List View:**
- Created full-page `Quotes.tsx` with sidebar navigation
- Added `GET /api/quotes/all` backend endpoint (with lead join data)
- Stats strip: Sent, Total value, Awaiting approval, Acceptance rate
- Pill tabs: All/Draft/Sent/Viewed/Approved/Declined with count badges
- Quote list table with hover quick-actions, "Viewed · Nd ago" urgency badges
- Empty state with EmptyState component
- Client-side filtering, no new API calls on tab switch

**Workstream 2 — Quote Builder:**
- Rebuilt QuoteBuilderModal with two-column layout (left builder + right 220px sidebar)
- Status pipeline bar: 4-step visual indicator (Client → Line items → Review → Send)
- Premium client card with avatar, 3-col details grid, project type badge
- Line items card with inline editing, add/remove, "Load package" template system
- Totals card: subtotal, discount, tax (editable), total with real-time recalculation
- Right sidebar: value summary (live total + status pill), "Send to [name] →" button, client preview thumbnail, saved packages panel
- Industry language integration throughout (`lang.quote`, `lang.client`, `lang.keyDate`, etc.)
- All existing save/send/template handlers preserved
- 24/24 tests passing

---

## Prioritized Backlog

### P0 (None currently)

### P1
- Pipeline/Kanban view build (LeadsPipelineView.tsx sibling component)
- Industry language rollout to Contracts, Calendar screens
- Mobile responsiveness polish for Quotes page + builder
- Launch Prep: Production domains, DNS records (SPF/DKIM for Resend)

### P2
- Wire real historical trend data to StatCard sparklines
- Quote "Viewed · Nd ago" badge testing with real viewed quotes
- Meeting booking widget embed code
- "Smart Inbox" view for files needing review
- "File Request" feature
- Smart Scheduling (suggests optimal meeting times)
- Visual Sequence Builder
- A/B test landing page hero copy variants

## Test Credentials
- email: `bookingtest@test.com`, password: `password123`

## Key API Endpoints
- `GET /api/quotes/all` — All quotes for authenticated user (with lead data)
- `GET /api/leads/:leadId/quotes` — Quotes for a specific lead
- `POST /api/leads/:leadId/quotes` — Create quote
- `PUT /api/quotes/:id` — Update quote
- `POST /api/quotes/:id/send` — Send quote
- `GET /api/quote-templates` — Get saved packages/templates
