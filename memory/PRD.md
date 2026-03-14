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

## What's Been Implemented
- Landing page (6-section branded design)
- Full auth flow (signup, login, email verification, password reset)
- Lead management (CRUD, pipeline, status tracking)
- Quote builder (line items, tax, currency, PDF generation)
- Quote sending via email (with portal links) — FIXED March 2026
- Client portal (public view of quotes/contracts)
- Contract creation & sending via email — FIXED March 2026
- Contract auto-generation on quote acceptance
- Booking management with calendar
- Portfolio page
- Email sequences (onboarding, follow-up)
- Payment integration (Stripe deposits)
- Dashboard with analytics
- Security audit (audit logs, GDPR account deletion)
- Onboarding wizard + dashboard tour (sequential)
- Email signature settings
- Weekly digest cron
- Inquiry form (public, client-facing)

## Recent Bug Fixes (March 2026)

### P0: Quote Email Sending
- **Root Cause:** Resend sandbox `onboarding@resend.dev` only allows emails to account owner
- **Fix:** Trust proxy `true`→`1`, rate limiter `validate: { trustProxy: false }`, comprehensive logging, `emailSent` in API response
- **Status:** RESOLVED

### P0: Contract Email Not Arriving
- **Root Cause:** `sendContractSentEmail` was silently catching errors and returning false, endpoint didn't check return value or report email status
- **Fix:** Added comprehensive `[CONTRACT SEND]` and `[EMAIL]` logging, endpoint now returns `emailSent` boolean, updated contract email template from dark to light theme, `to` field changed to array format
- **Status:** RESOLVED

### HIGH: Inquiry Form Issues
- **Root Cause:** White text (`text-white`) on light backgrounds, label typo "Service TextT *"
- **Fix:** Changed all headings to `text-gray-900`, label to "Project Category *", dropdowns to `text-text-primary`, success state icons to light theme colors
- **Status:** RESOLVED

## User Action Required
- Verify a domain at resend.com/domains and update `SENDER_EMAIL` to send emails to external clients (non-owner emails)

## Prioritized Backlog

### P0 (Blockers) — ALL RESOLVED
- [x] Quote emails not sending
- [x] Contract emails not arriving
- [x] Trust proxy / rate limiter deployment crash
- [x] Frontend TypeScript build error (emailSent type)
- [x] Inquiry form contrast/label issues

### P1 (Next Up)
- [ ] Re-verify contract auto-generation flow end-to-end (quote accept → contract auto-create → email)
- [ ] Polish & mobile responsiveness review
- [ ] Dashboard project card text visibility

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend)
- [ ] Visual Sequence Builder (post-beta)

## Key Endpoints
- `POST /api/quotes/:id/send` — Send quote email (returns emailSent)
- `POST /api/contracts/:id/send` — Send contract email (returns emailSent)
- `POST /api/contracts/:id/agree` — Client signs contract (public)
- `POST /api/auth/signup` / `POST /api/auth/login`
- `POST /api/leads` / `GET /api/leads`
- `DELETE /api/user/account` — GDPR deletion
- `GET /api/health` — Health check

## Test Credentials
- `emailtest@test.com` / `password123`
- Owner email for Resend: `emmanuelobokoh03@gmail.com`
