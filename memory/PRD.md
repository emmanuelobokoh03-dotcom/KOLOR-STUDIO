# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a comprehensive full-stack CRM, "KOLOR STUDIO," for creative professionals. The AUTOPILOT phase automates the entire client workflow from inquiry to final payment and feedback.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL on Supabase with RLS policies
- **Payment**: Dual-mode Stripe integration (direct SDK for production, Emergent proxy for preview)
- **Email**: Resend integration
- **Toast**: Sonner for notifications

## What's Been Implemented

### Core Features (Complete)
- Authentication and user management
- KanbanBoard for lead/project pipeline
- Lead CRUD with cover images, drag-and-drop status changes
- Quote creation, sending, viewing, acceptance/decline
- Auto-contract generation on quote acceptance (AUTOPILOT)
- Auto-email notifications at each step
- Client Portal with quotes, contracts, files, messages
- File uploads and deliverables management
- Revenue dashboard and analytics
- Settings (currency, brand, testimonials)
- Public portfolio and inquiry form
- Cron-based email follow-up sequences
- Smart suggestions/onboarding banners
- Demo project for new users

### AUTOPILOT Flow (Working)
1. Client submits inquiry → Auto-response email
2. Creative sends quote → Quote email to client with portal link
3. Client views quote in portal → Quote status updated
4. Client accepts quote → Auto-contract generated + sent + deposit payment link created
5. Client signs contract → Deposit payment email sent
6. Client pays deposit → Confirmation + final payment scheduled
7. Creative delivers → Final payment link sent
8. Client pays final → Paid in full confirmation

### Bug Fixes (Session: March 9, 2026 - Round 2)
All 8 user-reported issues fixed and verified:
- **#1 P0**: Quote email now links to portal (was using broken /quotes/ path)
- **#2 P0**: Auto-contract generation verified working with [AUTOPILOT] logging
- **#3 P0**: Contract email auto-sent to client after quote acceptance
- **#4 P0**: Stripe dual-mode: real SDK for production, proxy for preview
- **#5 P1**: Celebration toast in portal after quote acceptance
- **#6 P1**: Currency uses quote settings instead of hardcoded $
- **#7 P1**: Start Work button now always visible (was hidden with opacity-0)
- **#8 P1**: Demo banner correctly shows when isDemoData lead exists

### Previous Session Fixes
- Data isolation vulnerability patched across 10+ routes
- Email sending fixed (dotenv.config placement)
- Prisma schema restored (PascalCase + @@map)
- RLS policies applied to all tables
- Build errors resolved (250+ TypeScript errors)
- Quote display in dashboard and portal
- Payment link generation via Stripe proxy
- Settings tabs visibility
- Smart suggestion banner logic (quotesCount/contractsCount)

## Key Technical Notes
- **DO NOT RUN `prisma db pull`** — breaks PascalCase model names
- Stripe proxy runs on port 8002 (Python FastAPI, supervisor-managed)
- Backend needs supervisor restart for changes (no hot reload)
- Frontend uses Vite with hot reload
- All backend routes prefixed with /api

## Prioritized Backlog

### P1 (Upcoming)
- Interactive Walkthrough/Setup Wizard
- Color branding persistence across sessions

### P2 (Future)
- Client Onboarding Email Drip
- Sequences Dashboard UI

## Test Credentials
- Email: emmanuelobokoh03@gmail.com / Password: successful26#
- Demo Portal: /portal/cmmidu5bw000ka2vcjcug5sw1
- Test EM Portal: /portal/gbi5z98i5sgz5txo6stgtb
