# KOLOR STUDIO — Product Requirements Document

## Original Problem Statement
A full-stack CRM for creative professionals (photographers, designers, fine artists) with features including lead management, quotes, contracts, booking, calendar integration, client portal, and industry-specific terminology.

## User Personas
- **Photographers** — Manage shoots, send quotes, track bookings
- **Designers** — Manage projects, proposals, contracts
- **Fine Artists** — Manage commissions, offers, deliveries

## Core Requirements
- Secure HTTP-Only cookie authentication with "Remember Me"
- Industry-specific UI language (via `industryLanguage.ts`)
- 2-step signup with industry selection
- Dashboard with Kanban, List, Analytics, Portfolio, Quotes, Contracts views
- Standalone Calendar page with Month/Week/List views
- Brand-adaptive public portfolio, inquiry form, and booking page (creator's brand tokens)
- Brand Settings tab: logo upload, color pickers, font selector, live preview
- Lead management with CRUD, status tracking, discovery calls
- Quote builder, contract management, file sharing
- Client portal with approval workflow, celebration states
- Email integration (Resend) with V2.0 branded design system
- Calendar integration (Google Calendar)
- Settings page: Profile, Brand, Notifications, Integrations, Account

## Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + Phosphor Icons
- **Backend**: Express.js + Prisma + PostgreSQL + node-cron
- **3rd Party**: Resend (email), Google Calendar, Sentry (stub), Plausible (stub)

## Architecture
```
/app/kolor-studio-v2/
├── backend/
│   ├── prisma/schema.prisma          ← Brand defaults: #6C2EDB / #E8891A
│   ├── src/
│   │   ├── routes/
│   │   │   ├── calendar.ts
│   │   │   ├── portfolio.ts          ← Brand fields in public endpoint
│   │   │   ├── settings.ts           ← PATCH accepts brand fields
│   │   │   ├── public-booking.ts     ← Returns brand tokens
│   │   │   └── ...
│   │   └── services/
└── frontend/
    ├── index.html                    ← Google Fonts: Inter, Fraunces, Playfair, Montserrat, Libre Baskerville
    ├── src/
    │   ├── pages/
    │   │   ├── PublicBookingPage.tsx  ← REDESIGNED: brand-adaptive, branded header
    │   │   ├── PublicPortfolio.tsx    ← REDESIGNED: brand-adaptive
    │   │   ├── SubmitInquiry.tsx      ← REDESIGNED: industry-adaptive
    │   │   ├── Settings.tsx          ← UPDATED: Brand tab with BrandPreview, PortfolioSettings, SharePortfolio
    │   │   ├── Calendar.tsx
    │   │   ├── Dashboard.tsx
    │   │   └── ...
    │   ├── components/
    │   │   ├── BrandPreview.tsx       ← Wired into Brand tab
    │   │   ├── PortfolioSettings.tsx  ← Bug fixes: modal bg, text artifacts
    │   │   └── SharePortfolio.tsx     ← Wired into Brand tab
    │   └── services/
    │       └── api.ts
    └── public/
```

---

## What's Been Implemented

### Iterations 100-104: Dashboard, Leads, Quote Builder
### Iteration 105: Contracts Page + Client Portal Redesign (Mar 30)
### Iteration 106: Email Design System V2.0 + 29 Templates + Scheduler (Mar 30)
### Iteration 107: Calendar Page (Mar 30)
### Iteration 108a: Public Portfolio + Inquiry Form — Brand-Adaptive Redesign (Mar 31)
### Iteration 108b: Public Booking Page — Brand Token Integration (Mar 31)

**Changes:**
- Branded header: logo/initials + studio name, always visible across all 4 booking steps
- Page background → `#F9F7FE` (warm off-white, consistent across all public surfaces)
- Step indicator: 4 minimal dots (filled=complete, ring=current, muted=future)
- All hardcoded `purple-*` Tailwind classes → inline styles using `primaryColor`
- Input focus: `focusedField` state with `borderColor: primaryColor` + `boxShadow`
- Time slot hover: React state `hoveredTime` + inline styles (no Tailwind hover classes)
- Timezone display on date step + confirmation screen
- Confirmation footer: "Powered by KOLOR Studio" (not studio name)
- `accentColor`, `brandLogoUrl` derived from API response
- 44px min touch targets, mobile stacking at ≤375px

### Iteration 108c: Brand Settings Tab (Mar 31)

**Backend:**
- `PATCH /api/settings` now accepts and persists: `brandPrimaryColor`, `brandAccentColor`, `brandFontFamily`, `brandLogoUrl`
- Prisma schema defaults updated: `#A855F7` → `#6C2EDB`, `#EC4899` → `#E8891A`
- `GET /api/settings/brand` default values updated to match

**Frontend — Settings.tsx:**
- 5 tabs: Profile → **Brand** → Notifications → Integrations → Account
- **Brand identity section**: Logo upload (via `/api/settings/brand/logo`), Primary/Accent color pickers (native color input + hex text input), Font picker (5 curated Google Fonts as pill radio buttons)
- **Live preview section**: BrandPreview component (Portfolio/Quotes/Portal tabs)
- **Portfolio management section**: PortfolioSettings (upload/manage works) + SharePortfolio (link + QR code)
- "Save brand" button reuses existing `saveSettings()` function

**Bug fixes:**
- PortfolioSettings: modal `bg-slate-900` → `bg-[var(--surface-base)]`
- PortfolioSettings: "UploadSimple Your First Work" → "Upload Your First Work"
- PortfolioSettings: "UploadSimple your best work..." → "Upload your best work..."

**Google Fonts added to index.html**: Playfair Display, Montserrat, Libre Baskerville

**Testing: 100% backend (10/10), 100% frontend — All tests passed**

### Iteration 109: Security Hardening (Mar 31)
- JWT token removal from response body
- Session invalidation via `tokenVersion` on password change
- `sameSite: 'none'` cookies for cross-origin access

### Iteration 110: Automation System Improvements (Apr 1)

**WS1: Prisma Connection Leak Fix**
- Replaced `new PrismaClient()` in `scheduledEmailService.ts` with singleton `import prisma from '../lib/prisma'`

**WS2: Public Unsubscribe Endpoint (CAN-SPAM Compliance)**
- Added `unsubscribeToken` (String? @unique @default(cuid())) to `SequenceEnrollment`, `QuoteFollowUpEnrollment`, `ClientOnboardingEnrollment`
- Created `GET /api/unsubscribe/:token` — public, no auth, searches all 3 enrollment tables, renders HTML confirmation page
- Injected unsubscribe footer links into all automated email templates (sequences, onboarding, quote follow-ups)

**WS3: Inquiry Acknowledgement Email**
- Already implemented via `sendClientConfirmation` in `POST /api/leads/submit`

**WS4: Post-Discovery-Call Quote Reminder**
- `PATCH /api/leads/:id/discovery-call` now schedules `POST_CALL_QUOTE_REMINDER` 24h after call completion
- `scheduledEmailService.ts` handles the new type, sending reminder to studio owner
- New `sendPostCallQuoteReminderEmail` function in `email.ts`

**WS5: Auto-Stop Onboarding on LOST**
- Both `PATCH /api/leads/:id` and `PATCH /api/leads/:id/status` call `stopOnboardingForLead('lead_lost')` when status changes to LOST
- New `stopOnboardingForLead()` function in `onboardingService.ts`

**WS6: Multi-Tier Stale Lead Nudges**
- Scheduler `runStaleLeadNudges()` expanded to Tier 1 (7-day) and Tier 2 (14-day) checks with proper date range filtering

**Testing: 100% backend (14/14) — All tests passed (iteration_110.json)**

### Iteration 111: Industry-Parity Fixes — Email Copy + Landing Page (Apr 1)

**Task 1: `sendPostCallQuoteReminderEmail` industry adaptation**
- Added `ownerIndustry` param, inline `industryQuoteWord` map (PHOTOGRAPHY→quote, DESIGN→proposal, FINE_ART→offer)
- All hardcoded "quote" in headline, body, CTA, subject replaced with dynamic `quoteWord`
- `scheduledEmailService.ts` caller updated to pass `owner.industry`

**Task 2: `sendClientOnboardingEmail` industry adaptation**
- Added `industry` to `OnboardingEmailParams`, inline `industryLang` map with `quote/update/files/call` per industry
- Email 1 (Welcome): bullets use `iLang.call` and `iLang.files`
- Email 2 (Portal Guide): "View Files" card uses `iLang.files`
- Email 3 (Update Reminder): bullets use `iLang.update` and `iLang.files`
- All 4 call sites in `onboardingService.ts` updated to pass `industry`, queries include `industry: true` in select

**Task 3: Landing page copy fix**
- Hero subheading: "photographers and designers" → "photographers, designers, and artists"
- Social proof: "photographers and designers lose bookings...double-booked a shoot" → "photographers, designers, and fine artists lose commissions...missed a deadline"

**Validation: TSC 0 errors, Vite build clean, all search verifications pass**

### Iteration 112: Automation Wiring + File Delivery Hardening (Apr 1)

**Task 2: Wire Testimonial Request to Contract Signing**
- `POST /api/contracts/:id/agree` now schedules `TESTIMONIAL_REQUEST` 7 days after signing
- Dedup guard prevents duplicate scheduling

**Task 4: File Review Reminder — Deliverables Only**
- `FILE_REVIEW_REMINDER` now only scheduled when uploaded files have `requiresReview=true` (DELIVERABLE/REVISION category)

**Task 5: Industry-Adaptive Inquiry Acknowledgement Email**
- New `sendInquiryAcknowledgementEmail()` in email.ts with per-industry copy (inquiry/brief/commission inquiry)
- Wired into both `POST /api/leads/submit` and `POST /portal/submit` (non-blocking)
- Sent from `${studioName} via KOLOR` — creator's studio identity, not generic KOLOR

**Task 6: Post-Call Quote Reminder — Dedup Guard Added**
- Dedup check prevents double-scheduling when discovery call is updated multiple times

**Tasks 1, 3, 7, 8, 9: Verified already complete from prior iteration**

**Testing: 100% backend (15/15) — All tests passed (iteration_111.json)**

### Iteration 113: Design Elevation — 8 Visual Steps (Apr 3)

**Step 1: Kill Gradient Text** — All `WebkitBackgroundClip: 'text'` instances removed from LandingPageV2.tsx. Headings use solid white (#ffffff) and solid brand purple (#6C2EDB)

**Step 2A: Dashboard Dominant Stat** — Added hero-pipeline-stat with NumberFlow animated counter above the stat grid, showing active pipeline count with Space Mono label

**Step 2B: Bento Grid Features** — Replaced 3-equal-card grid with asymmetric bento layout: full-width DashboardMock hero card + two half-width supporting cards (QuotePipelineBar + PortalMock)

**Step 3: Space Mono Metadata Font** — Added 'Space Mono' to Google Fonts, created `.font-mono-kolor` CSS class. Applied to: SectionLabel, workflow step numbers, browser URL bar, StatCard labels, StatusBadge, LeadsListView stat chips

**Step 4: Staggered Word Reveal** — Hero H1 words animate in with 80ms stagger, `prefers-reduced-motion` respected

**Step 5: Structural Hover** — Landing cards and LeadsListView rows use CSS `.landing-feature-card` / `.lead-card-hover` class with left-border accent on hover (no JS handlers)

**Step 6: Rotating Radial Grid** — SVG with 5 circles + 12 spokes behind hero at 0.04 opacity, 45s rotation

**Step 7: SubmitTestimonial Redesign** — Fraunces headline, Space Mono metadata, flat #F9F7FE background, primary color fallback corrected to #6C2EDB

**Step 8: Empty States** — EmptyState component redesigned with Space Mono uppercase labels, minimal copy + CTA

**Step 9: ViewTransition** — Skipped (requires react@canary upgrade from React 18.3, which risks breaking all existing deps and violates "no breaking changes" constraint)

**Testing: 95% frontend verified (iteration_112.json)**

---

## Prioritized Backlog

### P1
- Mobile responsiveness polish for Calendar + Contracts + Settings
- Launch Prep: Production domains, DNS (SPF/DKIM for Resend)

### P2
- Wire real historical trend data to StatCard sparklines
- Meeting booking widget embed
- "Smart Inbox" view for files needing review
- "File Request" feature
- Visual Sequence Builder
- A/B test landing page hero copy
- "Smart Scheduling" feature

## Test Credentials
- email: `bookingtest@test.com`, password: `password123`
- userId: `cmn0umxwx0000k8sy48g5le5u`

## Key API Endpoints
- `GET /api/portfolio/public/:userId` — Public portfolio with brand fields
- `POST /api/portal/submit` — Submit inquiry (creates lead)
- `GET /api/book/:userId` — Public booking page data (brand tokens + meeting types)
- `PATCH /api/settings` — Save settings (now includes brand fields)
- `GET /api/settings/brand` — Get brand settings
- `POST /api/settings/brand/logo` — Upload brand logo
- `GET /api/calendar/events` — Derived + manual calendar events
- `GET /api/calendar/google-events` — Google Calendar events
- `POST /api/calendar/events` — Create manual event
- `DELETE /api/calendar/events/:id` — Delete manual event
- `GET /api/unsubscribe/:token` — Public CAN-SPAM unsubscribe (no auth)
- `PATCH /api/leads/:id/discovery-call` — Update discovery call (schedules quote reminder)
