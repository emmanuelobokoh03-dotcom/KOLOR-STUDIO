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

### Iteration 117 — Signup/Login Flow Fix + Copy Overhaul (Complete)
- **P0 Fix**: Email signup now calls `POST /api/auth/onboarding` after auto-login with mapped industry (PHOTOGRAPHY→PHOTOGRAPHY, DESIGN→GRAPHIC_DESIGN, FINE_ART→FINE_ART), then redirects to `/dashboard` — bypassing the duplicate `/onboarding` screen. Google OAuth users still use `/onboarding`.
- **Signup copy**: Left panel headline → "Every client. Every quote. One place.", sub-copy → "$97 lifetime access" pitch, 4 new checklist items (leads/quotes/contracts/calendar). Step 2 heading → "Choose your discipline", sub-copy → "KOLOR adapts its language and templates to how you actually work." Submit button → "Set up my studio →"
- **Login copy**: Left panel headline → "Your clients are waiting. Let's get to work.", updated sub-copy, new testimonial (Marcus T., Portrait photographer, New York), form heading → "Sign in to KOLOR"

### Iteration 118 — Full App Audit: Design, Typography, Automation & Client-Facing Fixes (Complete)
- **Email brand colours (P0)**: Replaced 36 instances of off-brand `#7c3aed`/`#7C3AED` → `#6C2EDB` KOLOR purple. Replaced blue gradient CTA buttons → flat `#6C2EDB`. Fixed blue info box backgrounds → purple-tinted `#F3EEFF`. 0 hardcoded preview URLs.
- **Portal studio branding (P1)**: Backend returns `brandPrimaryColor` + `brandLogoUrl` in portal response. Frontend uses dynamic brand colour for header gradient, shows studio logo/initial, personalised footer ("Thank you for working with {studioName}").
- **Space Mono fix (P1)**: Trust signal font → Inter (Space Mono not loaded in app).
- **PublicQuote header (P1)**: Quote number now `rgba(255,255,255,0.6)` (was invisible `text-purple-600`). Status labels → "Awaiting your review/response".
- **Dashboard sidebar (P2)**: Section headers `text-[9px]` → `text-[10px]`, user subtitle → `text-[11px]`, beta plan card → "$97 one-time" / "Founding member".
- **Kanban (P2)**: Client name `font-bold` for visual hierarchy.
- **SubmitInquiry (P2)**: Fixed duplicate `WEB_DESIGN` value (UI/UX → `GRAPHIC_DESIGN`).
- **LeadDetailModal (P2)**: `currencySymbol` prop replaces hardcoded `$`, passed from Dashboard.
- **PortfolioCategory (P2)**: Added `ILLUSTRATION` + `FINE_ART` to schema enum + frontend types + labels. DB migration applied.

### Iteration 119 — Logo System Rebuild + Bug Fixes + Fine Art Commission Form (Complete)
- **KolorLogo rewrite**: Reverse K mark with 3 tonal planes (stem `#2D1470`, mid `#6C2EDB`, blade `#9B6AEF`), amber accent pixel `#E8891A`. Supports `light`/`dark`/`purple` variants + `iconMode` for rounded-rect container.
- **Logo wiring**: Replaced gradient text and Sparkle icons in Dashboard (sidebar, mobile header, slide-out menu) and Calendar header with `<KolorLogo>` component. Removed unused Sparkle imports.
- **Login redirect fix**: `navigate('/dashboard')` → `window.location.href = '/dashboard'` to fix mobile Safari cookie timing issue.
- **Portfolio fixes**: `studioDisplayName` now prefers `firstName + lastName` over raw `name` field. Speciality styled as uppercase label (13px, `#9CA3AF`). Removed "Explore our creative work" paragraph.
- **Duplicate email fix**: Removed `sendAutoResponseEmail` from portal.ts inquiry handler. Clients now receive only the industry-adaptive `sendInquiryAcknowledgementEmail`.
- **Fine Art commission form**: SERVICE_TYPES now includes `FINE_ART` + `ILLUSTRATION`. Commission panel adapts header/labels/placeholders for Fine Art.
- **Lazy loading**: All 18 route components converted to `React.lazy()` with `<Suspense>` fallback. Bundle split into separate chunks (index 262KB down from monolithic).

### Iteration 120 — Pipeline Stages, Commission Gate, systemTemplates Fix (Complete)
- **systemTemplates fix (P0)**: Logo Design template `industry` → `'DESIGN'` (was invalid `'GRAPHIC_DESIGN'`). `INDUSTRY_TEMPLATE_MAP` reduced to 3 valid keys (PHOTOGRAPHY, DESIGN, FINE_ART). Fallback uses `PHOTOGRAPHY` not `OTHER`.
- **Pipeline stages**: Added `pipelineStageLabels` to all 3 industry branches in `industryLanguage.ts`. KanbanBoard accepts `user` prop and uses `stageLabel()` for column headers. PHOTOGRAPHY="Inquiry/Discovery Call/Quoted/Negotiating/Booked", DESIGN="Brief/Scoping Call/Proposal Sent/Revisions/Signed", FINE_ART="Inquiry/Portfolio Review/Offer Sent/Negotiating/Agreement Signed".
- **Commission gate**: Commission fields in AddLeadModal now only show when `projectType === 'COMMISSION'` AND user is `FINE_ART`. Header uses Space Mono uppercase tracking.

### Iteration 121 — systemTemplates: Photography Portrait, Design Broadening, Fine Art Fix (Complete)
- **Task A**: Added `Portrait & Commercial Photography` template (10 stages, PHOTOGRAPHY) for portrait/headshot/commercial/editorial photographers. PHOTOGRAPHY users now get 2 templates on onboarding.
- **Task B**: Renamed `Logo Design Project` → `Creative Design Project` with generalised stages (no logo/SVG/EPS-specific language). Covers brand, UI/UX, graphic, and motion design projects.
- **Task C**: Removed `Reproduction Rights` stage from Portrait Commission (legal clause, not a workflow step). `Installation Photo` renumbered to order 9. Template now has 10 stages.

### Iteration 122 — PrivacyPolicy: Name all 7 data processors (Complete)
- Updated Third-Party Data Processors section with all 7 processors: Supabase, Railway, Vercel, Resend, Sentry, Google LLC, Stripe. Each entry includes purpose and transfer mechanism (SCCs / DPF).
- Added Google Fonts IP disclosure note and SCCs/DPF explanatory paragraph.
- Closes GDPR audit gap 9.4.

### Iteration 123 — Dashboard Power Features: Sparklines + Needs Attention + Revenue Goal (Complete)
- **Real sparklines (Task A)**: All 4 StatCards now use `toSparkline()` from `analyticsApi.getMonthlyTrend()` — no more hardcoded placeholder arrays. Booked card trend direction wired to `changePercent`. All TODO comments removed.
- **Needs Attention (Task B)**: New `NeedsAttentionSection` component surfaces up to 5 leads needing action (overdue quotes, stale contacts, missing contracts). Rendered above StatCards in kanban/list views. Uses `lang` for industry-neutral copy. Clickable rows open `LeadDetailModal`.
- **Revenue Goal Widget (Task C)**: New `RevenueGoalWidget` in right sidebar. localStorage-based annual revenue goal with animated progress bar (respects `prefers-reduced-motion`). Three states: empty, progress, editing (inline). Color-coded: behind-pace=amber, on-track=purple, goal-hit=emerald.

### Iteration 121 — Inline Field Editing + Custom Pipeline Stage Names (Complete)
- **Inline Field Editing (Task 1)**: Added click-to-edit functionality for 6 fields (Project Title, Description, Status, Estimated Value, Budget, Timeline) on the LeadDetailModal Overview tab. New "Project Details" section with pencil icon on hover, inline save/cancel, Enter/Escape keyboard shortcuts. Saves via `leadsApi.update`. Full-panel "Edit Lead" button preserved on details tab.
- **Custom Pipeline Stage Names (Task 2)**: New "Pipeline" tab in Settings page with 5 stage name inputs (New, Contacted, Quoted, Negotiating, Booked). Save/Reset buttons. Overrides stored in `localStorage('kolor_stage_names')`. KanbanBoard reads custom names with priority: custom > industry-specific > default.

### Iteration 122 — Sidebar Dimming + User Accent Colour (Complete)
- **Sidebar Dimming (Task A)**: Linear-style focus effect on desktop sidebar. Three nav sections (Workspace, Schedule, Account) wrapped in `group` divs. Inactive items get `group-hover:opacity-60 hover:!opacity-100` — when hovering any group, all siblings dim except the hovered item. Active items always stay at `opacity-100`. User block, beta card, Settings, and Help buttons excluded. `transition-opacity duration-150` for smooth fading.
- **User Accent Colour (Task B)**: 8 curated colour swatches (KOLOR Purple, Midnight, Ocean, Forest, Ember, Rose, Slate, Crimson) in Settings > Profile tab. Clicking a swatch immediately updates `--brand-primary` CSS variable via `document.documentElement.style.setProperty`. Stored in `localStorage('kolor_app_accent')`. Applied on app boot in `main.tsx` before React mounts. "Reset to default" button appears only when non-default is active. Completely separate from brand colours (client-facing). No backend changes, no new packages.

### Iteration 123 — Landing Page: Founder Section + FAQ Fix + A/B Hero (Complete)
- **Founder Section (Task A)**: New `FounderSection` component between FAQSection and UrgencySection. SectionLabel "The builder", two-column layout (copy left, 3 credibility signal cards right). Headline: "Built by someone who lost clients to spreadsheets." 3 paragraphs covering all 3 industries. Attribution: "— Emmanuel, founder of KOLOR Studio". Signals: GDPR-native, Global-first, Built in public.
- **FAQ Corrections (Task B)**: Updated FAQ item 0 (pricing: $97 one-time / $19/mo beta / $29/mo launch) and item 7 (post-beta: single Pro plan at $29/mo, team features later). Removed stale "free forever" and three-tier references.
- **A/B Hero Copy (Task C)**: 50/50 localStorage-based split. Fine art variant: pill "For fine artists", headline "The CRM built for fine artists", subhead about commissions/collectors/reproduction rights. Control variant unchanged. `data-variant` attribute on hero section. Persists across reloads.

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
