# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a full-stack CRM, "KOLOR STUDIO," for creative professionals (photographers, designers, artists). The app manages leads, quotes, contracts, bookings, payments, and client communication through an elegant, branded experience.

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS + Shadcn/UI
- **Backend:** Node.js + Express + Prisma + PostgreSQL (Supabase)
- **Email:** Resend
- **Payments:** Stripe
- **Storage:** Supabase Storage
- **Icons:** @phosphor-icons/react
- **Tours:** Driver.js

## Core Workflow (Updated March 2026)
1. Create Lead → 2. Create Quote → 3. Send Quote to Client →
4. Client Accepts → 5. **Contract Auto-Generated as DRAFT** →
6. **User Gets Notification Email** → 7. **Dashboard Shows Banner** →
8. **User Reviews & Sends Contract** → 9. Client Signs → 10. Payment

## What's Been Implemented
- Landing page (6-section branded design)
- Full auth flow (signup, login, email verification, password reset)
- Lead management (CRUD, pipeline, status tracking)
- Quote builder (line items, tax, currency, PDF generation)
- Quote sending via email (with portal links)
- Client portal (public view of quotes/contracts)
- **Contract auto-generation as DRAFT (user must review before sending)**
- **Pending contracts dashboard banner with "Review Contract" button**
- **User notification email on quote acceptance**
- Manual contract send with email delivery
- Booking management with calendar
- Portfolio page
- Email sequences (onboarding, follow-up)
- Payment integration (Stripe deposits)
- Dashboard with analytics
- Security audit (audit logs, GDPR account deletion)
- Onboarding wizard + dashboard tour (sequential)
- Email signature settings
- Inquiry form (public, client-facing)

## Bug Fixes Applied (March 2026)

### Contract Workflow Overhaul
- **Auto-generated contracts now DRAFT** (was SENT): User reviews before sending
- **No auto-email to client**: Contract email only sent when user manually clicks Send
- **User notification email**: Updated to say "review and send" with "Review Contract Now" CTA
- **Dashboard pending banner**: Amber banner shows when DRAFT contracts exist
- **Pending contracts API**: `GET /api/contracts/pending` returns DRAFT contracts

### Previous Fixes
- Quote email: Trust proxy, rate limiter, emailSent response, comprehensive logging
- Contract email template: Updated from dark to light theme, Resend ID logging
- Inquiry form: Fixed contrast, label, dropdown colors
- TypeScript build error: Fixed emailSent type access
- ContractsTab: Auto-expand newest, light theme status badges
- **Add Lead form**: Labels → text-text-primary, inputs → border-2 + purple focus, selects → explicit text-text-primary bg-white options, header → bg-gradient-brand, placeholder "Wedding" → "Brand Photoshoot"

## User Action Required
- Verify a domain at resend.com/domains and update SENDER_EMAIL for external client emails

## Prioritized Backlog

### P0 (Blockers) — ALL RESOLVED
- [x] Quote emails not sending
- [x] Contract emails not arriving
- [x] Contract auto-sent without user review
- [x] No user notification on quote acceptance
- [x] Inquiry form contrast/label issues
- [x] Add Lead form UI contrast/typography (fixed Mar 15, 2026)

### P1 (Next Up)
- [ ] Polish & mobile responsiveness review
- [ ] Dashboard project card text visibility

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend)
- [ ] Visual Sequence Builder (post-beta)

## Key Endpoints
- `POST /api/quotes/:id/send` — Send quote email
- `POST /api/quotes/public/:quoteToken/accept` — Client accepts quote → DRAFT contract
- `GET /api/contracts/pending` — Fetch DRAFT contracts for dashboard
- `POST /api/contracts/:id/send` — User sends contract to client
- `POST /api/contracts/:id/agree` — Client signs contract
- `GET /api/portal/:token` — Client portal

## Test Reports
- iteration_67: Quote email fix
- iteration_68: Contract email + inquiry form
- iteration_69: Contract E2E + ContractsTab
- iteration_70: Contract workflow overhaul (DRAFT + pending + banner)
- iteration_72: Add Lead modal UI fix (20/20 tests passed, 100% frontend)
