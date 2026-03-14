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

## Architecture
```
/app/kolor-studio-v2/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/ (auth, leads, quotes, contracts, etc.)
│       ├── services/ (email, pdf, storage, audit, etc.)
│       ├── middleware/ (auth, rateLimiter)
│       └── server.ts
└── frontend/
    └── src/
        ├── components/ (modals, onboarding, settings, etc.)
        ├── pages/ (Landing, Dashboard, auth/)
        ├── services/api.ts
        └── utils/
```

## What's Been Implemented
- Landing page (6-section branded design)
- Full auth flow (signup, login, email verification, password reset)
- Lead management (CRUD, pipeline, status tracking)
- Quote builder (line items, tax, currency, PDF generation)
- Quote sending via email (with portal links)
- Client portal (public view of quotes/contracts)
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

## P0 Fix: Quote Email Sending (March 2026)
### Root Cause
Resend sandbox sender `onboarding@resend.dev` only allows sending to the account owner email (`emmanuelobokoh03@gmail.com`). Client emails to external addresses fail with 403.

### Fix Applied
1. **Trust proxy:** Changed `app.set('trust proxy', true)` to `app.set('trust proxy', 1)` — fixes Railway deployment crash
2. **Rate limiters:** Added `validate: { trustProxy: false }` to all 5 limiters — prevents ERR_ERL_PERMISSIVE_TRUST_PROXY
3. **Logging:** Added comprehensive `[QUOTE SEND]` and `[EMAIL]` diagnostic logs
4. **API response:** Quote send endpoint now returns `emailSent` boolean and error details
5. **Frontend:** QuotesTab shows clear warning when email delivery fails

### To Fully Resolve (User Action Required)
- Verify a domain at resend.com/domains (e.g., kolorstudio.app)
- Update `SENDER_EMAIL` in backend .env to verified domain email (e.g., noreply@kolorstudio.app)

## Prioritized Backlog

### P0 (Blockers) — RESOLVED
- [x] Quote emails not sending (Resend sandbox + trust proxy fix)

### P1 (Next Up)
- [ ] Re-verify contract auto-generation flow after domain verification
- [ ] Polish & mobile responsiveness review
- [ ] Email template update (old dark theme → new light theme for contract emails)

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend)
- [ ] Inquiry form contrast fixes
- [ ] Category dropdown fix ("service text" label, wrong categories)
- [ ] Dashboard project card text visibility
- [ ] Visual Sequence Builder (post-beta)

## Key Endpoints
- `POST /api/quotes/:id/send` — Send quote email (now with emailSent response)
- `POST /api/auth/signup` / `POST /api/auth/login`
- `POST /api/leads` / `GET /api/leads`
- `DELETE /api/user/account` — GDPR deletion
- `PATCH /api/user/profile` — User settings
- `GET /api/health` — Health check

## Test Credentials
- Create fresh users via signup (no hardcoded test accounts in this environment)
- Owner email for Resend: emmanuelobokoh03@gmail.com
