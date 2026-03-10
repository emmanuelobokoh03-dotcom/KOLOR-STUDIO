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
- Weekly Autopilot Digest Email, Interactive Walkthrough, Color Branding Persistence, Portal Readability

### Phase 4: P2 Features (Complete — March 10, 2026)
- **Client Onboarding Email Drip:** 3-step automated sequence (Welcome → Portal Guide → Update Reminder) on contract signing. Cron every 6h.
- **Sequences Dashboard UI:** "Sequences" view mode in Dashboard showing built-in sequences with stats, toggle, detail modal, email preview.
- **Quote Follow-Up Sequence:** 3-step automated conversion booster (Day 3: Gentle Reminder, Day 7: Answer Questions, Day 10: Final Follow-Up). Triggers on quote sent, stops on accept/decline/client message. Cron every 6h.

### Deployment Fixes
- Trust proxy for Railway, unused TypeScript variable fixes, ViewMode type fix for MobileBottomNav

## Key Test Accounts
- Test user: test@test.com / Test123456!
- Test Portal: /portal/gbi5z98i5sgz5txo6stgtb

## API Endpoints (Phase 4)
- `GET /api/sequences/dashboard` — Built-in sequences with real enrollment data
- `GET /api/sequences/dashboard/stats` — Overview stats (2 active, emails/week, enrolled)
- `PATCH /api/sequences/dashboard/:id/toggle` — Toggle sequence
- `GET /api/sequences/:seqId/enrollments` — Enrolled clients
- `GET /api/sequences/:seqId/steps/:stepNumber/preview` — Email HTML preview

## Cron Jobs
1. **Weekly Digest** — Mondays 9 AM (pipeline stats email)
2. **Client Onboarding** — Every 6h (3-step post-contract drip)
3. **Quote Follow-Up** — Every 6h (3-step unanswered quote drip)

## Prioritized Backlog

### P2 — Remaining
- Analytics Verification — Verify revenue analytics accuracy, portal views tracking
- Project Timeline Modal enhancements

### P3 — Future
- Custom Sequence Builder (visual flow editor)
- Email open rate tracking
- Mobile-responsive optimization pass
- Dark mode for client portal
- File sharing in client portal
- Client feedback/rating system
