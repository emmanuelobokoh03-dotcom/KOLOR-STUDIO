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

### Dashboard Functionality Fixes (Mar 15, 2026)
- **Auto-refresh**: 30s polling with smart idle detection (skips when inactive > 5min). Live green indicator in toolbar
- **Active Commissions widget**: Universal for ALL users, shows COMMISSION leads with clickable cards and status badges
- **Quote price input**: font-mono, text-right, hidden spinners, wider grid columns (3/12 instead of 2/12)
- **Client Portal email**: Removed hardcoded `emmanuelobokoh03@gmail.com`, replaced with generic message
- **Industry filter**: Default option now says "Filter: All Industries" with title tooltip

### Accessibility (WCAG 2.1 AA) (Mar 15, 2026)
- **Global CSS**: sr-only class, focus-visible purple ring, prefers-reduced-motion support
- **Skip navigation**: "Skip to main content" link visible on keyboard focus
- **Modal a11y (9 modals)**: `useModalA11y` hook for focus trapping, Escape-to-close, focus restoration. All modals have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- **Form a11y**: Login/Signup/AddLead forms with `htmlFor`/`id` pairing, `aria-required`, `role="alert"` on errors
- **Icon buttons**: `aria-label` on interactive icon-only buttons, `aria-hidden="true"` on decorative icons
- **Live regions**: `role="status"` + `aria-live="polite"` on Live indicator, loading states

### Rate Limiter Fix (Mar 15, 2026)
- **Root cause**: Auto-refresh (3 endpoints x every 30s = 360 req/hr) exceeded 100 req/hr API limit
- **Fix**: Increased API limit to 1000 req/hr, auth to 30/hr, portal to 200/hr, uploads to 50/hr, email to 5/hr
- **Also**: Reduced auto-refresh interval from 30s to 60s (halves API load)
- **Health endpoint**: Excluded from rate limiting

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
- [x] Dashboard auto-refresh with Live indicator (fixed Mar 15, 2026)
- [x] Active Commissions widget visible for ALL users (fixed Mar 15, 2026)
- [x] Quote price input overflow for large numbers (fixed Mar 15, 2026)
- [x] Client Portal hardcoded email removed (fixed Mar 15, 2026)
- [x] Industry filter labeled clearly (fixed Mar 15, 2026)

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
- iteration_73: Dashboard functionality fixes - all 6 issues (20/20 tests passed, 100%)
- iteration_74: Accessibility (WCAG 2.1 AA) - all 31 features verified (100%)
