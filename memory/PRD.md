# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a comprehensive full-stack CRM, "KOLOR STUDIO," for creative professionals. The AUTOPILOT phase automates the entire client workflow from inquiry to final payment and feedback.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Sonner (toasts)
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL on Supabase with RLS policies
- **Payment**: Dual-mode Stripe (direct SDK for production, Emergent proxy for preview)
- **Email**: Resend integration with 15+ email templates
- **Analytics**: Revenue pipeline tracking

## AUTOPILOT Flow (Complete & Working)
1. Client submits inquiry → Auto-response email
2. Creative sends quote → Quote email with portal link
3. Client views quote in portal → Status updated to VIEWED
4. Client accepts quote → Auto-contract generated + sent + deposit payment link
5. Client signs contract → Deposit payment email sent
6. Client pays deposit → Confirmation emails
7. Creative starts work → Progress notification to client
8. Creative delivers → Final payment link
9. Client pays final → Paid in full confirmation
10. Message notifications → Both directions (client↔creative)

## What's Been Implemented

### Core Features (Complete)
- Authentication and user management
- KanbanBoard for lead/project pipeline
- Lead CRUD with cover images, drag-and-drop status changes
- Quote creation, sending, viewing, acceptance/decline
- Auto-contract generation on quote acceptance
- Client Portal with quotes, contracts, files, messages
- File uploads and deliverables management
- Revenue dashboard and analytics
- Revenue Pipeline Widget (autopilot stages)
- Settings (currency, brand, testimonials)
- Public portfolio and inquiry form
- Cron-based email follow-up sequences
- Smart suggestions/onboarding banners
- Demo project for new users

### Notification System (Complete)
- Message notifications: Client → Creative (via portal)
- Message notifications: Creative → Client (via dashboard)
- Work progress notifications: Status changes to client
- Quote emails: Link to portal instead of broken /quotes/ path
- Contract auto-sent email: After auto-contract generation
- Deposit payment email: After Stripe checkout creation
- Quote acceptance notification: To studio owner

### Bug Fixes History
**Session 3 (March 9, 2026):**
- P0: Message notifications both directions (3 new email functions)
- P0: Work progress notifications for deliverable status changes
- P1: Quote modal selector visibility (bg-dark-card → proper dark theme)
- P2: Revenue Pipeline Widget added to dashboard
- P2: Revenue pipeline API endpoint (/api/analytics/revenue-pipeline)

**Session 2 (March 9, 2026):**
- P0: Auto-contract generation verified + comprehensive logging
- P0: Stripe dual-mode (SDK for production, proxy for preview)
- P0: Quote email portal link fixed
- P1: Celebration toast in portal
- P1: Currency settings used instead of hardcoded $
- P1: Start Work button visibility fixed
- P1: Settings tabs contrast improved

**Session 1 (Earlier):**
- Data isolation vulnerability patched (10+ routes)
- Email sending fixed (dotenv placement)
- Prisma schema restored (PascalCase + @@map)
- RLS policies applied to all tables
- Build errors resolved (250+ TypeScript errors)

## Key Technical Notes
- **DO NOT RUN `prisma db pull`** — breaks PascalCase model names
- Stripe proxy runs on port 8002 (Python FastAPI, supervisor-managed)
- Backend needs supervisor restart for changes (no hot reload)
- All backend routes prefixed with /api
- Dual-mode payment: STRIPE_API_KEY or STRIPE_SECRET_KEY checked

## Prioritized Backlog

### P1 (Upcoming)
- Interactive Walkthrough/Setup Wizard
- Color branding persistence across sessions
- Portal background color improvements (client-facing readability)

### P2 (Future)
- Client Onboarding Email Drip
- Sequences Dashboard UI
- Portal analytics tracking (page views, time spent)

## Test Credentials
- Test account: test@test.com / Test123456!
- Demo Portal: /portal/cmmidu5bw000ka2vcjcug5sw1
- Test EM Portal: /portal/gbi5z98i5sgz5txo6stgtb
