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
- Quote sending via email (with portal links)
- Client portal (public view of quotes/contracts)
- Contract creation & sending via email
- Contract auto-generation on quote acceptance (with 3s email delay)
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

## Bug Fixes Applied (March 2026)

### P0: Quote Email Sending — RESOLVED
- Root Cause: Resend sandbox only allows emails to account owner
- Fix: Trust proxy, rate limiter validation, comprehensive logging, emailSent in response

### P0: Contract Email Not Arriving — RESOLVED
- Root Cause: Multiple emails firing simultaneously during quote acceptance caused rate-limit collision
- Fix: Added 3-second delay before contract email, await instead of fire-and-forget, full Resend response logging with email ID
- Files: quotes.ts (autoGenerateContract), email.ts (sendContractSentEmail)

### HIGH: Wrong Contract Displayed — RESOLVED
- Root Cause: ContractsTab didn't auto-expand newest contract, user saw collapsed list
- Fix: Auto-expand first (newest) contract on load, fixed dark-theme status badges to light theme

### HIGH: Inquiry Form Issues — RESOLVED
- Fix: text-white → text-gray-900 for headings, "Service TextT *" → "Project Category *", dropdown text colors fixed

### P0: TypeScript Build Error — RESOLVED
- Fix: result.emailSent → result.data?.emailSent in QuotesTab.tsx

### P0: Trust Proxy Deployment Crash — RESOLVED
- Fix: trust proxy true → 1, rate limiters validate: { trustProxy: false }

## User Action Required
- Verify a domain at resend.com/domains and update SENDER_EMAIL to send to non-owner client emails

## Prioritized Backlog

### P0 (Blockers) — ALL RESOLVED
- [x] Quote emails not sending
- [x] Contract emails not arriving
- [x] Trust proxy / rate limiter deployment crash
- [x] TypeScript build error
- [x] Inquiry form contrast/label issues
- [x] Wrong contract displayed / dark theme badges

### P1 (Next Up)
- [ ] Polish & mobile responsiveness review
- [ ] Dashboard project card text visibility

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend)
- [ ] Visual Sequence Builder (post-beta)

## Key Endpoints
- `POST /api/quotes/:id/send` — Send quote email (returns emailSent)
- `POST /api/contracts/:id/send` — Send contract email (returns emailSent)
- `POST /api/contracts/:id/agree` — Client signs contract (public)
- `POST /api/quotes/public/:quoteToken/accept` — Client accepts quote, auto-generates contract
- `GET /api/portal/:token` — Client portal with quotes + contracts
- `POST /api/auth/signup` / `POST /api/auth/login`
- `DELETE /api/user/account` — GDPR deletion
- `GET /api/health` — Health check

## Test Credentials
- `emailtest@test.com` / `password123`
- Owner email for Resend: `emmanuelobokoh03@gmail.com`

## Test Reports
- iteration_67.json: Quote email fix verification
- iteration_68.json: Contract email + inquiry form fix
- iteration_69.json: Contract auto-generation E2E + ContractsTab UI fixes
