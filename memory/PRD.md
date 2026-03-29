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
- Dashboard with Kanban, List, Analytics, Calendar, Portfolio views
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
├── backend/  (Express + Prisma)
│   ├── prisma/schema.prisma
│   └── src/
│       ├── middleware/
│       ├── routes/
│       └── server.ts
└── frontend/ (React + Vite)
    ├── src/
    │   ├── components/
    │   │   ├── LeadsListView.tsx     ← NEW (Iteration 103)
    │   │   ├── LeadDetailModal.tsx   ← REBUILT (Iteration 103)
    │   │   ├── QuickActions.tsx
    │   │   ├── StatCard.tsx
    │   │   └── StatusBadge.tsx
    │   ├── pages/
    │   │   ├── Dashboard.tsx
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
### Iteration 102: 7 Surgical Landing Page Enhancements ✅
### Iteration 102 Bonus: JSON-LD FAQ Schema ✅
### Iteration 103: Leads Page + Lead Detail Modal Full Rebuild ✅
- Extracted `LeadsListView.tsx` from Dashboard.tsx
- Stats strip (Total leads, Pipeline value, Needs attention, Avg value)
- Pill-style filter tabs (All, Needs action, Inquiry, Discovery, Quoted, Booked)
- Lead list grid with hover quick-actions
- Split-panel Lead Detail Modal (client details + discovery call + notes | relationship timeline)
- Status-colored gradient header with value chip
- 3-step vertical discovery call timeline
- Relationship timeline with colored dots and "next step" indicator
- Notes tab with add/view notes
- All existing logic, API calls, handlers preserved
- Industry language utility used throughout
- 20/20 tests passing (iteration_103.json)

---

## Prioritized Backlog

### P0 (None currently)

### P1
- Pipeline/Kanban view build (LeadsPipelineView.tsx sibling component)
- Industry language rollout to Quote Builder, Contracts, Calendar
- Mobile responsiveness polish for new modal/leads page
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
