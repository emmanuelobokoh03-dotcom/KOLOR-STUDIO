# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a comprehensive full-stack CRM ("KOLOR STUDIO") for creative professionals. The system automates the client workflow from inquiry to payment using an "Autopilot" pipeline.

## Core Architecture
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage
- **Email:** Resend
- **Payments:** Stripe (dual-mode: SDK + Python proxy fallback)

## What's Been Implemented

### Phase 1: Core CRM (Complete)
- User auth, Lead management with Kanban board, Client portal, Messaging system

### Phase 2: Autopilot Pipeline (Complete)
- Quote creation/sending/acceptance, Auto contract generation, Email notifications, Stripe payments, Revenue pipeline widget

### Phase 3: Pre-Beta Polish (Complete — March 9, 2026)
- Weekly Autopilot Digest Email (cron + preview API)
- Interactive Walkthrough/Setup Wizard (5-step OnboardingWizard)
- Color Branding Persistence (localStorage cache + API)
- Portal Background Readability (WCAG AA fixed purple colors)

### Phase 4: P2 Features (Complete — March 10, 2026)
- **Client Onboarding Email Drip:** 3-step automated sequence (Welcome → Portal Guide → Update Reminder). Triggers on contract signing. Cron processes every 6 hours. DB model: ClientOnboardingEnrollment.
- **Sequences Dashboard UI:** Card-based dashboard as new "Sequences" view mode in Dashboard. Shows 2 built-in sequences with stats, toggle, detail modal with sequence flow visualization and email preview. Custom sequences "Coming Soon" placeholder.

### Deployment Fixes (March 10, 2026)
- Added `app.set('trust proxy', true)` for Railway
- Removed unused TypeScript variables blocking build

## Key Test Accounts
- Test user: test@test.com / Test123456!
- Test Portal: /portal/gbi5z98i5sgz5txo6stgtb

## API URL
- https://studio-wizard-4.preview.emergentagent.com

## New API Endpoints (Phase 4)
- `GET /api/sequences/dashboard` — List built-in sequences with stats
- `GET /api/sequences/dashboard/stats` — Overview stats (total, active, emails this week, enrolled)
- `PATCH /api/sequences/dashboard/:id/toggle` — Toggle sequence active/inactive
- `GET /api/sequences/:seqId/enrollments` — List enrolled clients for a sequence
- `GET /api/sequences/:seqId/steps/:stepNumber/preview` — Preview email HTML

## Prioritized Backlog

### P2 — Remaining Tasks
- **(P2) Analytics Verification** — Verify revenue analytics accuracy and portal views tracking
- **(P2) Quote Follow-Up Sequence** — Implement the actual quote follow-up email drip (currently shows as "Paused" placeholder in Sequences Dashboard)
- **(P2) Project Timeline Modal** — Enhance existing timeline functionality

### P3 — Future Tasks
- Client Onboarding Email Drip enhancements (unsubscribe, A/B testing)
- Custom Sequence Builder (visual flow editor)
- Mobile-responsive optimization pass
- Dark mode for client portal
- File sharing in client portal
- Client feedback/rating system
