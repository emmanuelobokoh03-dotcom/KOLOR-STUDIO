# KOLOR STUDIO — Product Requirements Document

## Original Problem Statement
A full-stack CRM for creative professionals (Photography, Design, Fine Art) with lead management, quoting, contracts, scheduling, client portal, portfolio, email automation sequences, and a conversion-optimized landing page.

## Core Architecture
```
/app/kolor-studio-v2/
├── backend/     (Express + Prisma + PostgreSQL)
│   ├── prisma/schema.prisma
│   ├── src/routes/
│   ├── src/services/
│   └── src/scheduler.ts
└── frontend/    (React 19 canary + Vite + Tailwind + Shadcn)
    ├── src/pages/
    ├── src/components/
    └── src/index.css
```

## Tech Stack
- **Frontend**: React 19 (canary with ViewTransitions), Vite, Tailwind CSS, Shadcn/UI, @number-flow/react, Space Mono + Raleway + Fraunces fonts
- **Backend**: Express, Prisma ORM, PostgreSQL (Supabase)
- **Integrations**: Resend (email), Google Calendar (OAuth), Supabase Storage (files), Vercel Analytics (consent-gated)
- **Auth**: HTTP-Only cookie-based sessions with "Remember Me"

## What's Been Implemented

### Core CRM Features (Complete)
- Lead pipeline (Kanban + List views)
- Quote builder with PDF generation
- Contract/Booking Agreement management
- Calendar with Google Calendar sync
- Client portal with file delivery
- Portfolio management
- Email automation sequences
- Settings with brand customization
- Industry-specific language (Photography/Design/Fine Art)

### Design Elevation (Complete — Iteration 111)
- NumberFlow animated dashboard stats, bento grid, structural hovers
- React ViewTransitions, infinite CSS marquee testimonials

### Landing Page (Complete — LandingPageV2)
- 8-section conversion-optimized page with animated stats, countdown timer

### Mobile Responsiveness Polish (Complete — Iteration 113)
- Calendar 3-day mobile week view, Settings scrollable tabs, Contracts card layout
- 44px touch targets, zero horizontal overflow at 375px/768px

### Full-Stack Audit & Fix Pass (Complete — Iteration 114)
**CRITICAL:**
- [9.1] Vercel Analytics gated behind cookie consent (renders only after Accept All)
- [6.2/6.6] Supabase RLS: TODO — manual SQL documented in `SUPABASE_RLS_TODO.md`
- [6.9] Stripe webhook HMAC: Already implemented in paymentService.ts ✅

**HIGH:**
- [8.1] Open Graph + Twitter Card meta tags added to index.html
- [10.2] Custom KOLOR favicon.svg + manifest.webmanifest (replaced vite.svg)
- [3.5] Google Fonts: `display=swap` already present; all 6 families kept (used in brand picker)
- [2.4/U1.1] Contract signing loading state: Already implemented ✅

**MEDIUM:**
- [10.1] Custom 404 page (NotFound.tsx) with Back to home / Go back buttons
- [7.4] Input max-length validation: description 5000, message 2000, projectTitle 200 chars
- [8.3] robots.txt + sitemap.xml created
- [U3.1/U5.4] Destructive action confirmations: Two-tap delete in Contracts + KanbanBoard
- [U7.2/U5.3] SubmitTestimonial: htmlFor labels + scroll-to-error
- [U8.3] Contract signing trust signal: "E-SIGNATURE · LEGALLY BINDING · TIMESTAMPED AUDIT TRAIL"
- [U4.2] .env.example: Updated from SendGrid to Resend
- [5.2/5.3] Marquee keyboard accessibility: pause on hover/focus, sr-only-focusable button

**LOW:**
- [U8.5] MeetingType default color: #A855F7 → #6C2EDB (aligned with brand primary)
- [8.5] Footer social links: X, Instagram, TikTok — updated with real URLs ✅
- [U6.4] Onboarding resume: Already handled by auto-starting tour for new users

### Iteration 115 — Targeted Fixes (Complete)
- Title tag updated to `KOLOR Studio—CRM for Photographers, Designers & Artists`
- Footer social links: X (`x.com/kolor_studio`), Instagram (`instagram.com/kolorcreativestudio`), TikTok (`tiktok.com/@kolorcreativestudio`)
- `bg-white` → `bg-surface-base` sweep: 10 replacements across ClientPortal, QuoteBuilderModal, SmartNudgeBanner; intentional contrast elements preserved

### Google OAuth Login (Complete — Iteration 116)
- Added `googleId` field to User model (optional, unique)
- Created `/api/auth/google` (redirects to Google consent screen) and `/api/auth/google/callback` (handles token exchange, user creation/linking, cookie set, redirect)
- Wired "Continue with Google" buttons on Login + Signup pages
- New Google users → redirected to `/onboarding` (industry selection) before dashboard
- Existing Google users → redirected to `/dashboard` directly
- Dashboard defensive fallback: shows "Personalise your workspace" banner when `primaryIndustry` is null
- Error handling with user-friendly messages on login page for denied/failed flows

### Dashboard Layout Fix (Complete)
- Outer wrapper changed from `lg:grid` to `flex` layout — eliminates the narrow-strip rendering bug
- `AnnouncementBanner` and `EmailVerificationBanner` moved outside the flex container (rendered above via fragment)
- Sidebar `<aside>` gets explicit `width: 220px; minWidth: 220px`
- Main column wrapper set to `flex-1 min-w-0` to fill remaining space
- Removed `max-w-7xl mx-auto` from `<main>` — content fills the flex child properly

### Iteration 116 — P0/P1 Bug Fixes + Pricing + Copy (Complete)
- Verified login & signup endpoints work (no router-level authMiddleware blocking public routes)
- CalendarConnectionWidget: fixed overflow in 280px sidebar — always stacks vertically, button is `w-full`, connected grid is 1-column
- Verified Google Calendar auth-url returns JSON (not HTML redirect)
- Landing page pricing: $97 one-time (highlighted card), $19/month beta, $29/month ghost card
- Hero subheadline: added "fine artists" as first-class citizen
- FAQ answers updated for new pricing model ($97 one-time / $19/mo / $29/mo)
- FinalCTA copy updated — "No monthly SaaS trap. One payment, lifetime access."
### Landing Page Redesign — Stat + Workflow + Features Bento (Complete)
- ProblemSection: 78% stat with MIT/HBR Lead Response Study citation (replaced unverified 73% claim)
- WorkflowSection: Redesigned with gradient headings, purple connector line, and embedded UI mockups (lead card, quote breakdown, signed contract with signature)
- FeaturesSection: Rebuilt as bento grid — kanban hero card (full-width), quotes + contracts (medium), client portal + calendar sync + automation (small)
- Removed unused DashboardMock/QuoteMock/PortalMock imports and QuotePipelineBar helper

### Logo + Auth + Automation Fixes (Complete)
- Created `KolorLogo.tsx` SVG component with light/dark/auto variants, sm/md/lg sizes, optional mark-only mode
- Replaced text logos in Nav, Login.tsx, Signup.tsx with `<KolorLogo>` component (React Router `<Link>` internally)
- Fixed hardcoded `hardened-crm-2` preview URL in contracts.ts → `kolorstudio.app` (0 remaining)
- Fixed `scheduledEmailService.ts` portal URL from `?token=` (query) to `/${token}` (path param) matching App.tsx route
- Added BOOKED status to onboarding auto-stop (was only LOST) in both general PATCH and Kanban drag handlers
- Verified Google OAuth correctly sets `emailVerified: true` and redirects to `/onboarding` for new users

### Iteration 116b — Fine Art Workflow + Industry Language (Complete)
- `industryLanguage.ts`: Added `pipelineStages` to interface and all 3 industry blocks; `getIndustryLanguage` now safely maps GRAPHIC_DESIGN, WEB_DESIGN, ILLUSTRATION, BRANDING → DESIGN
- `AddLeadModal.tsx`: Fixed `name="material"` → `name="medium"` (schema-correct); added `edition` field for commissions; `CreateLeadData` type extended with medium/dimensions/edition
- `systemTemplates.ts`: Added "Reproduction Rights" stage (order 9, type AGREEMENT) to FINE_ART Portrait Commission template with full copyright/IP clause
- Landing page pricing + copy: Verified already applied ($97/$19/$29 cards, "fine artists" in hero, FAQ updated)

## Prioritized Backlog

### P0 — TODO: MANUAL
- **Supabase RLS**: Run SQL from `SUPABASE_RLS_TODO.md` in Supabase dashboard
- **OG Image**: Current generated image works; optionally replace with Figma-designed version
- **Favicon PNGs**: Generate 32x32, 180x180, 192x192, 512x512 PNGs from favicon.svg

### P1 — Upcoming
- Launch Prep: Production domains, DNS (SPF/DKIM for Resend)

### P2 — Future
- Wire real historical trend data to StatCard sparklines
- Meeting booking widget embed code
- "Smart Inbox" view for files needing review
- "File Request" feature
- Visual Sequence Builder
- A/B test landing page hero copy variants

## Test Credentials
- Email: bookingtest@test.com
- Password: password123

## Key API Endpoints
- `GET /api/health` — Health check
- `GET /api/unsubscribe/:token` — Public unsubscribe
- All `/api/` routes protected by auth middleware

## 3rd Party Integrations
- Resend (transactional emails)
- Google Calendar (OAuth scheduling)
- Supabase Storage (file uploads)
- Vercel Analytics (consent-gated)
- Stripe (webhook with HMAC verification)
