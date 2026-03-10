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

### Phase 3: Pre-Beta Polish (Complete - March 9, 2026)
- Weekly Autopilot Digest Email, Interactive Walkthrough, Color Branding Persistence, Portal Readability

### Phase 4: P2 Features (Complete - March 10, 2026)
- **Client Onboarding Email Drip:** 3-step automated sequence on contract signing
- **Sequences Dashboard UI:** View mode showing built-in sequences with stats, toggle, detail modal, email preview
- **Quote Follow-Up Sequence:** 3-step automated conversion booster with smart-stop triggers

### Phase 5: Analytics Verification (Complete - March 10, 2026)
- **Revenue Analytics Fixed:** `getRevenueStats` now includes PAID_IN_FULL in received revenue, DEPOSIT_RECEIVED/OVERDUE in pending
- **Revenue Pipeline Fixed:** All 5 stages (quoteSent, contractSigned, depositPaid, inProgress, paidInFull) now populate correctly using both income status field and boolean flags
- **Sequences Stats Fixed:** Email counting now tracks individual emails (email1/2/3SentAt), not enrollments; active count excludes stopped enrollments
- **Digest Service Fixed:** totalRevenue now includes RECEIVED + PAID_IN_FULL income, not just deposits
- **Portal Views:** Verified working (increment + timestamp update)
- **Milestones CRUD:** Verified working (create, update, delete, portal timeline)

### Deployment Fixes
- Trust proxy for Railway, unused TypeScript variable fixes, ViewMode type fix for MobileBottomNav

## Key Test Accounts
- Test user: test@test.com / Test123456!
- Analytics test: analytics-test@test.com / Test1234!
- Test Portal: /portal/gbi5z98i5sgz5txo6stgtb

## API Endpoints (Phase 4)
- `GET /api/sequences/dashboard` - Built-in sequences with real enrollment data
- `GET /api/sequences/dashboard/stats` - Overview stats
- `PATCH /api/sequences/dashboard/:id/toggle` - Toggle sequence
- `GET /api/sequences/:seqId/enrollments` - Enrolled clients
- `GET /api/sequences/:seqId/steps/:stepNumber/preview` - Email HTML preview

## Revenue Analytics Endpoints
- `GET /api/crm/revenue` - Income-based revenue (RECEIVED/PAID_IN_FULL = received, EXPECTED/DEPOSIT_RECEIVED/OVERDUE = pending)
- `GET /api/analytics/revenue-pipeline` - Lead-based 5-stage pipeline
- `GET /api/analytics/dashboard` - Lead-based conversion/booking metrics
- `GET /api/analytics/monthly-trend` - 12-month revenue trend
- `GET /api/analytics/pipeline-by-status` - Lead status breakdown
- `GET /api/analytics/lead-sources` - Source performance
- `GET /api/digest/preview` - Weekly digest preview

## Cron Jobs
1. **Weekly Digest** - Mondays 9 AM (pipeline stats email)
2. **Client Onboarding** - Every 6h (3-step post-contract drip)
3. **Quote Follow-Up** - Every 6h (3-step unanswered quote drip)

## Prioritized Backlog

### P2 - Next Up
- Email Open Rate Tracking - Tracking pixels for automated emails, display on Sequences Dashboard

### P2 - Future
- UI for Custom Sequences (visual flow editor)
- Project Timeline Modal enhancements

### P3 - Backlog
- Mobile-responsive optimization pass
- Dark mode for client portal
- File sharing in client portal
- A/B testing for email sequences
