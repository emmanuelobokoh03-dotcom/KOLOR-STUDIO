# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a comprehensive full-stack CRM, "KOLOR STUDIO," for creative professionals. The project includes an "AUTOPILOT" phase that automates the entire client workflow from inquiry to final payment and feedback.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL on Supabase with RLS policies
- **Payment Proxy**: Python FastAPI service using emergentintegrations (port 8002)
- **Integrations**: Stripe (payments via Emergent proxy), Resend (emails)

## What's Been Implemented

### Core Features (Complete)
- Authentication and user management
- KanbanBoard for lead/project pipeline
- Lead CRUD with cover images, drag-and-drop status changes
- Quote creation, sending, viewing, acceptance/decline
- Contract generation and client signing
- Client Portal with quotes, contracts, files, messages, timeline
- File uploads and deliverables management
- Email integration via Resend (auto-responses, notifications, follow-ups)
- Revenue dashboard and analytics
- Settings (currency, brand, testimonials)
- Public portfolio and inquiry form
- Cron-based email follow-up sequences
- Smart suggestions/onboarding banners
- Demo project for new users

### Bug Fixes (Session: March 9, 2026)
- **P0: Dashboard QuotesTab** - Working. Quotes display correctly in LeadDetailModal
- **P0: Client Portal Quotes** - Working. Quotes visible with Accept/Decline buttons
- **P0: Payment Links** - Fixed via Python Stripe proxy using emergentintegrations library
- **P1: "View Projects" button** - Fixed. Added quotesCount/contractsCount to leads API. Banner now correctly hides when quotes exist. Button scrolls to Kanban board
- **P1: Settings tabs visibility** - Fixed. Changed inactive tab colors for better contrast
- **Token inconsistency** - Fixed kolor_token → token in api.ts and BrandThemeContext.tsx
- **Data isolation vulnerability** - All routes patched with userId checks (previous session)
- **Email sending** - Fixed dotenv.config() placement (previous session)
- **Prisma schema** - Restored PascalCase models with @@map directives (previous session)
- **RLS policies** - Applied to all new tables (previous session)

### Stripe Payment Integration
- Created Python FastAPI proxy service at port 8002
- Uses emergentintegrations library with sk_test_emergent key
- Handles checkout session creation, status checking, webhooks
- Node.js paymentService.ts calls the proxy instead of direct Stripe SDK
- Full flow: Quote Accept → Income created → Stripe checkout URL generated → Email sent

## Prioritized Backlog

### P1 (Upcoming)
- Interactive Walkthrough/Setup Wizard for onboarding
- Color branding persistence across sessions

### P2 (Future)
- Client Onboarding Email Drip
- Sequences Dashboard UI (for creatives to build email sequences)

## Key Technical Notes
- **DO NOT RUN `prisma db pull`** - breaks PascalCase model names
- Backend uses `ts-node --transpile-only` (no hot reload - needs supervisor restart)
- Frontend uses Vite with hot reload
- All backend routes prefixed with /api
- Stripe proxy runs on port 8002 as separate supervisor service

## Test Credentials
- Email: emmanuelobokoh03@gmail.com / Password: successful26#
- Portal Token: gbi5z98i5sgz5txo6stgtb
- Lead ID: cmmie12k1000ua2vcnr0e3djz
- User ID: 3aa2d156-aa26-48ef-8daf-e95641b68b3e
