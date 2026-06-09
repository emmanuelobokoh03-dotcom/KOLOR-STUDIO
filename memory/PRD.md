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

### Iteration 124 — Portfolio Polish: PublicPortfolio.tsx Design Elevation (Complete)
- **Hero**: Industry-aware subline copy (Photography/Design/Fine Art variants) + 3px gradient bar accent below studio name.
- **Stats strip**: Upgraded from plain text to 3-column card row with bold counts (Works/Categories/Featured).
- **Grid**: First item gets full-width hero layout (16/7 aspect ratio), remaining in 3-col responsive grid. Image fade-in with skeleton placeholder. `prefers-reduced-motion` respected.
- **Inquiry CTA**: Industry-aware headline, subline, and button text (e.g., "Ready to book your session?" / "Book a session" for Photography).
- **Empty state**: Elevated brand-coloured circle with "Coming soon" copy + "Get in touch" link. Filter empty state has "Clear filters" button.
- **Scroll-reveal**: `IntersectionObserver`-powered fade-in on testimonials and inquiry CTA sections with `prefers-reduced-motion` support.

### Iteration 125 — Testimonial Social Proof Nudge + Email Send Log UI (Complete)
- **Testimonial Nudge (Task A)**: (1) PublicPortfolio empty state: "Get in touch to share your experience" link below main CTA. (2) PortfolioSettings empty state: "Build social proof first" nudge card above upload area, directing creators to use Lead Detail modal for testimonial requests.
- **Email Send Log (Task B)**: Backend `GET /api/sequences/email-log` endpoint with pagination (20 per page), filtered to authenticated user's leads. New "Send Log" tab in SequencesDashboard with table (Sent, Client, Email type, Recipient, Opened columns), prev/next pagination, and empty state. `formatEmailType` helper for human-readable labels.

### Iteration 126 — Scheduler Bug Fixes (Complete)
- **Bug 1 (P0) — Duplicate Monday email**: Removed `cron.schedule('0 9 * * 1')` weekly digest cron from `server.ts`. Users now receive one Monday email at 8am from `scheduler.ts` only. Removed unused imports (`generateDigestForUser`, `getAllUsersForDigest`, `sendWeeklyDigestEmail`, `cron`). Digest API routes preserved.
- **Bug 2 (P1) — Stale lead deduplication**: Added `OR: [null, < 6h ago]` guard on `lastContactedAt` to both Tier 1 and Tier 2 queries. Stamp `lastContactedAt` after successful nudge (non-blocking `.catch()`). Prevents double-fire on same-day restarts.
- **Bug 3 (P1) — Quote viewed nudge multi-fire**: Narrowed window from 48-98h to 48-72h (24h wide). Renamed `ninetyEightHoursAgo` → `seventyTwoHoursAgo`.
- **Bug 4 (P1) — Contract unsigned warning multi-fire**: Narrowed window from 72-99h to 72-95h (23h wide). Renamed `ninetyNineHoursAgo` → `ninetyFiveHoursAgo`.

### Iteration 127 — Audit Critical + High Fixes (Complete)
- **C2 XSS sanitiser**: `sanitiseContractHtml()` added to `ClientPortal.tsx` — strips `<script>`, `on*` handlers, `javascript:` hrefs, `data:` src. Upgraded to sandboxed `<iframe srcDoc>` for browser-level XSS isolation.
- **L2 Toaster theme**: Changed from `theme="dark"` to `theme="light"` in `App.tsx`.
- **H1 Dead localStorage write**: Removed `localStorage.setItem('user')` from `Login.tsx`.
- **H3 Favicon**: Updated `index.html` with full favicon block (ico, svg, png, apple-touch-icon, site.webmanifest). Created `/public/site.webmanifest`.
- **M2 DESIGN widgets**: Added `user?.industry === 'DESIGN'` check alongside existing sub-type checks. Added `user?.industry || user?.primaryIndustry` fallback for `getIndustryLanguage`.
- **M3 Beta countdown**: `getBetaEndDate()` now returns fixed `Date('2025-06-30T23:59:59Z')` — no localStorage.
- **C4 env.example**: Full rewrite with all Railway env vars (Resend, Supabase, Google, Stripe, Sentry, Vite). Removed stale SendGrid references.

### Iteration 128 — Custom Email Sequence Visual Builder (Complete)
- **api.ts**: Added `CustomSequence`, `NewStep`, `SequenceStepFull` interfaces. Added 7 CRUD methods to `sequencesApi` (listCustom, create, update, delete, addStep, updateStep, deleteStep).
- **SequencesDashboard.tsx**: Replaced "Coming Soon" placeholder with full custom sequences section. `CustomSequenceCard` shows name, trigger label, step preview, toggle/edit/delete with two-tap confirm. `SequenceBuilder` modal for create/edit mode with metadata form + inline step editor. Steps support subject, body (with placeholders), delay days. Empty state with "Create your first sequence" CTA. Built-in sequences and Send Log tab preserved unchanged.

### Iteration 129 — Self-Host Google Fonts + Audit Fixes + Founder Copy Rewrite (Complete)
- **C1 Self-hosted fonts**: Downloaded woff2 files to `/public/fonts/`. Replaced Google Fonts `@import` with `@font-face` declarations in `index.css`. Removed Google Fonts `<link>` tags from `index.html`. Updated Helmet CSP to remove Google domains. Updated Privacy Policy to "self-hosted" disclosure.
- **H1 Widget dual-field check**: Photography and Fine Art widget conditions now check both `user.industry` and `user.primaryIndustry`.
- **H5 robots.txt**: Created with Allow/Disallow rules for SEO surfaces vs auth-gated routes.
- **M1 Sequence builder flow**: `onCreated` callback transitions create mode directly to edit mode without closing modal.
- **M2 Page titles**: `<title>`, OG title, Twitter title all updated to include "Artists".
- **L2 Beta countdown**: Updated to `2026-07-31T23:59:59Z` (future date).
- **L4 auth__1_.ts**: File already didn't exist — no action needed.
- **Founder copy rewrite**: New headline ("Built by someone who watched talented creatives lose work to broken admin"), business manager perspective copy, 4th credibility signal (Operations-first).

### Iteration 130 — M4 + M5 + L1 + Font Preload (Complete)
- **M4 IndustryOnboarding**: Replaced 10-option grid with 3 canonical industries (Photography, Design, Fine Art). Each card shows examples text in italic. Grid uses `sm:grid-cols-3`. Uses `GRAPHIC_DESIGN` as backend value (maps to DESIGN language via `getIndustryLanguage`).
- **M5 Step body counter**: Added `maxLength={5000}` + live counter to sequence builder body textarea. Counter turns amber at 4000, red at 4500 chars.
- **L1 Emails This Week**: Stats bar now computes accurate count from `EmailTracking` rows via `/api/sequences/email-log` instead of built-in enrollment fields.
- **Font preload**: Added `<link rel="preload">` hints for Inter, Montserrat, Libre Baskerville in `index.html`.

### Iteration 131 — Landing Page P0 + P1 Gap Fixes (Complete)
- **Change 1**: Hero pill copy updated to "Now in beta · 20 founder spots — lifetime access for $97" + `data-testid="hero-announcement-pill"`.
- **Change 2**: Avatar stack (5 overlapping circles + "Joined by creatives in 14 countries") below trust line, above dashboard frame.
- **Change 3**: `ProductDeepDiveSection` with 3 alternating left/right feature rows (Lead management, Quotes & contracts, Email automation) each with mockup UI cards.
- **Change 4**: `StatsRow` with 4 stat cards (3 industries, 29+ automations, 14 countries, 5 min setup) above deep-dive rows.
- **Change 5**: `MidPageCTA` between Testimonials and FAQ with "Stop losing clients to a slower reply" headline and "Claim your founder spot" CTA.
- **Change 6**: Feature checklists on pricing cards — 8 items on $97 card, 3 items on $19 card.

### Iteration 132 — Automation Workflow Gap Fixes (Complete)
- **Task 1 — Contract Day 7 nudge**: New `runContractUnsignedFinalWarning()` checks 168-191h window. Existing Day 3 nudge wrapped in per-email try/catch. Daily cron now runs 6 functions.
- **Task 2 — Payment nudge**: New `runPaymentNudges()` checks contracts signed 48-72h ago (status `AGREED`). New `sendPaymentNudge()` email function in email service. Non-blocking with try/catch.
- **Task 3 — totalSequences stat**: `/api/sequences/dashboard/stats` now counts `2 + prisma.emailSequence.count()` for both total and active sequences. Confirmed returning accurate count (3 with 1 custom sequence).

### Iteration 133 — Payment Security + Auth Hardening + Mobile UX (Complete)
- **Task 1 — Webhook dedup**: `ProcessedWebhookEvent` Prisma model + dedup check in `webhooks.ts`. Duplicate Stripe events return `{ received: true, duplicate: true }` without re-processing.
- **Task 2 — Stripe idempotency**: Routes pass `idempotencyKey` to `createDepositCheckout`/`createFinalCheckout`. Key param accepted at service level (reserved for SDK-level integration).
- **Task 3 — Auth brute force lockout**: `loginAttempts` + `lockedUntil` fields on User model. 5 failed attempts → 15-minute lockout. Counter resets on success + password change. Tested: 5 wrong → locked, correct pw also locked until timeout.
- **Task 4 — Mobile bottom nav**: Replaced Portfolio with Leads (list view). Calendar now shows active state (filled icon) on `/calendar` route. All items 44px touch targets.
- **Task 5 — LeadDetailModal touch targets**: Action row buttons upgraded from `h-8` (32px) to `min-h-[44px]` with `flex items-center` for proper vertical centering.

### Iteration 134 — Lockout Email + Click Tracking + Portfolio Skeleton + Mobile UX + Founder Copy (Complete)
- **Task 1 — Lockout email**: `sendAccountLockoutEmail()` added to email.ts with error box + password reset CTA. Wired in auth.ts on 5th failed attempt (non-blocking).
- **Task 2 — Click tracking**: `clickCount` + `clickedAt` fields on EmailTracking schema. Click redirect route `GET /api/track/click/:id?url=` with open-redirect protection. `wrapTrackedLink()` helper for future email link wrapping. "Clicked" column in SequencesDashboard send log.
- **Task 3 — Client receipt**: Already handled by existing `sendDepositReceivedEmail` in paymentService. No changes needed.
- **Task 4 — Portfolio skeleton**: Loading state replaced spinner with skeleton grid (avatar + 6 card placeholders with animate-pulse).
- **Task 5 — Founder copy**: All 3 paragraphs replaced with formal business manager perspective copy.
- **Task 6 — Mobile UX**: Search input + horizontal filter chips added to LeadsListView. Search filters by name/email/project. Chips filter by status. Expandable search icon on mobile.

### Iteration 135 — AHA Moment: First-Login Sample Quote Flow (Complete)
- **Backend `POST /api/auth/sample-quote`**: Creates sample Lead + Quote with industry-appropriate line items, sends branded quote email to user's own inbox. Idempotent (flags via `isSampleQuote` on Lead). Schema: added `isSampleQuote Boolean` to Lead model.
- **`sendSampleQuoteEmail()`**: Branded email with preview banner ("This is a preview"), quote total, validity date, and CTA to review the quote online.
- **`AHAModal` component**: 4-state modal (idle/sending/sent/error) with industry-aware quote preview, send button, and quote URL link. Shows on first login with 800ms delay.
- **Dashboard integration**: `showAHAModal` state, triggered on first login. Suppresses onboarding tour while modal is open.
- **api.ts**: Added `authApi.sendSampleQuote()`.
- **Task 6 (Sequence link wrapping)**: Deferred — onboarding/quote-followup services don't create EmailTracking records, so no trackingId available for `wrapTrackedLink`.

### Iteration 136 — Bug Fix Sprint: QA Review (Complete — 2026-04-17)
- **P0 Login mobile redirect** (`Login.tsx`): `window.location.href` → `navigate('/dashboard')` (fixes mobile Safari cookie timing). Stores `kolor_first_login_session` in sessionStorage when server returns `isFirstLogin: true`.
- **P0 Signup redirect** (`Signup.tsx`): Removed `setTimeout` wrapper on navigation. Passes `isFirstLogin` flag into sessionStorage. Industry map kept as `DESIGN: 'GRAPHIC_DESIGN'` (backend enum requires this canonical key).
- **P0 AHA modal runs once** (`AHAModal.tsx` + `Dashboard.tsx`): New `kolor_aha_completed` localStorage flag set on send/dismiss. Dashboard gates modal on `!ahaCompleted`. Dashboard first-login detection now purely server-authoritative via sessionStorage flag (eliminates desktop/mobile session discrepancy).
- **P1 Client Portal studio name** (`ClientPortal.tsx`): Fallback chain upgraded to `studioName || contact.name || 'KOLOR STUDIO'`.
- **P1 Onboarding Checklist** (`OnboardingChecklist.tsx`): Prefixed all fetches with `${API_URL}` (meeting-types, availability, leads). Availability + Meeting type actions now call `onOpenSettings('scheduling')`. `SettingsModal` accepts new `initialTab` prop.
- **P1 Lead modal Schedule Call** (`LeadDetailModal.tsx`): Clicking "Schedule call" now opens `BookingModal` via `setShowBookingModal(true)` (was: silently toggled API flag).
- **P1 Project type industry-aware** (`LeadDetailModal.tsx`): Modal header replaces `SERVICE_TYPE_LABELS[serviceType]` with formatted `lead.projectType` (fallback `lang.booking`). `SERVICE_TYPE_LABELS` import removed.
- **P1 Portfolio hero bioLine** (`PublicPortfolio.tsx`): Replaced CRM-internal `heroSubline` ("from inquiries to delivered galleries") with personalised `bioLine` computed from speciality + industry.
- **P1 Desktop/Mobile first-login parity** (`Dashboard.tsx`): Server-provided `isFirstLogin` via sessionStorage (from Login/Signup) replaces localStorage-only detection.
- **P2 Share inquiry form visibility** (`Dashboard.tsx`): Button upgraded from ghost outline to filled brand-tinted CTA with amber accent dot + full "Share inquiry form" label visible at md+.

### Iteration 137 — Fine Art Contract Templates + Deposit Email Timing (Complete — 2026-04-17)
- **P0 Contract templates filtered by industry** (`contracts.ts` backend + `ContractsTab.tsx` + `api.ts`): `GET /api/contracts/templates/list?industry=X` filters templates. Maps PHOTOGRAPHY/DESIGN/GRAPHIC_DESIGN/WEB_DESIGN/ILLUSTRATION/BRANDING/FINE_ART to appropriate template sets. Fallback returns all 6. Frontend passes `user.industry || user.primaryIndustry`. Order preserved so first template is the "Recommended" one (badge added).
- **P0 Deposit email timing** (`contracts.ts` `/agree` route + `quotes.ts`): Deposit email now sent AFTER contract is signed, not on quote acceptance. Removed pre-emptive `paymentService.createDepositCheckout` auto-trigger from quotes.ts accept handler. Added non-blocking IIFE in contracts.ts `/agree` that looks up the latest accepted/sent quote, computes 30% deposit, sends `sendDepositPaymentEmail` with portal URL as paymentUrl. On-demand Stripe session creation remains available via `POST /api/payments/:incomeId/deposit`.
- **P2 QR code in ShareFormModal** — SKIPPED: Feature already exists using local `qrcode.react` package (better privacy/GDPR than external `api.qrserver.com`).

**Verified**: `npx tsc --noEmit` clean on both sides. Backend endpoint curl-tested:
- FINE_ART → `[PORTRAIT_COMMISSION, GENERAL_SERVICE, CUSTOM]`
- PHOTOGRAPHY → `[PHOTOGRAPHY_SHOOT, GENERAL_SERVICE, CUSTOM]`
- DESIGN/GRAPHIC_DESIGN → `[LOGO_DESIGN, WEB_DESIGN, GENERAL_SERVICE, CUSTOM]`
- No param → all 6 (fallback)

### Iteration 138 — Paystack Integration + Hero Mobile Stat Card Fix (Complete — 2026-04-18)
- **Schema**: Added `paystackReference String?` + `@@index([paystackReference])` to `Income` model. Applied via `prisma db push`.
- **paymentService.ts**: Added Paystack config (currencies: NGN, GHS, ZAR, KES), `paystackInitializeTransaction` and `paystackVerifyTransaction` helpers (native fetch, no SDK), `shouldUsePaystack(currency)` router, and `checkAndUpdatePaystackPayment` (mirrors Stripe's `checkAndUpdateSessionStatus` — updates income, creates Activity + Audit log, sends deposit/final received emails). `createDepositCheckout` and `createFinalCheckout` now branch by `shouldUsePaystack(currency)`: NGN/GHS/ZAR/KES → Paystack, everything else → Stripe (unchanged path).
- **webhooks.ts**: Added `POST /api/webhooks/paystack` with HMAC SHA-512 signature verification, dedup via existing `ProcessedWebhookEvent` (key: `paystack_${reference}`), fast 200 acknowledgement, async processing.
- **payments.ts**: Added `GET /api/payments/paystack/verify/:reference` for client-portal post-redirect verification.
- **server.ts**: Scoped `express.raw()` middleware to `/api/webhooks/stripe` only so Paystack receives parsed JSON body.
- **ClientPortal.tsx**: Handles `?payment=success&psp=paystack&ref=xxx` callback — calls verify endpoint, refreshes portal data on success.
- **LandingPageV2.tsx**: Hero stat mockup changed from `grid-cols-4` to horizontal flex scroll with `scrollbar-hide`, `flex-shrink-0`, `whitespace-nowrap`. "Total Leads" shortened to "Leads" to prevent two-line wrap on 375px screens.

**Verified curl**:
- Paystack webhook: missing/bad signature → 400; valid HMAC SHA-512 → 200 (ack'd fast, async processing)
- Paystack verify endpoint: returns 500 with no secret key configured (expected — fails closed)
- Stripe webhook: regression-tested, still rejects bad signatures with 400
- Contract templates (iter 137 regression): FINE_ART still returns `[PORTRAIT_COMMISSION, GENERAL_SERVICE, CUSTOM]`
- TypeScript: 0 errors backend + frontend

**Post-deployment (Railway — manual)**:
- `PAYSTACK_SECRET_KEY=sk_test_xxx` or `sk_live_xxx` in Railway env
- `PAYSTACK_PUBLIC_KEY=pk_test_xxx` in Railway env  
- Register webhook URL `https://kolor-studio-production.up.railway.app/api/webhooks/paystack` in Paystack dashboard → Settings → API Keys & Webhooks
- E2E test: create NGN income → client portal → click "Pay Deposit" → should redirect to Paystack checkout; create USD income → should still redirect to Stripe

### Iteration 139 — Paystack Trust Badge + Currency Selector PSP Indicator (Complete — 2026-04-18)
- **LandingPageV2.tsx** UrgencySection: Added "Pay via" row with Stripe + Paystack inline SVG badges inside the $97 pricing card (above CTA). Added PSP trust strip below the three-card row with "Secure payments via" header, Stripe + Paystack tiles (country codes NG · GH · ZA · KE on Paystack), and SSL/GDPR trust microcopy. Replaced spec's 🌍 emoji with clean inline SVG globe per user preference.
- **SettingsModal.tsx** Currency tab: Added reactive PSP indicator pill below currency `<select>`. Green/emerald tint for Paystack currencies (NGN/GHS/ZAR/KES), purple/indigo tint for Stripe. Copy: "Payments in {CURRENCY} will be processed via Stripe/Paystack". Uses IIFE to scope the `isPaystackCurrency` boolean locally — no new state, additive only.

**Verified**: `npx tsc --noEmit` = 0 errors. Landing bundle served includes new markers (`psp-trust-strip`, "Paystack", "NG · GH · ZA · KE").

### Iteration 140 — Comprehensive QA Fix Sprint (Complete — 2026-04-18)
- **T3 Hero grid mobile clip** (`LandingPageV2.tsx`): Converted broken `grid` with `gridTemplateColumns: 'minmax(0,0) 1fr'` to proper `flex` layout. Sidebar uses `hidden md:block flex-shrink-0 width:180` so it takes 0px on mobile, 180px on desktop. Main content gets `flex-1 min-w-0` to prevent overflow.
- **T4 Portfolio hero bio removed** (`PublicPortfolio.tsx`): Deleted `bioLine` computation block and the `<p>` tag entirely. Hero now renders: h1 → divider → speciality → CTAs (no bio sentence).
- **T5 LeadDetailModal industry-aware discovery call** (`LeadDetailModal.tsx`): All three states now use `lang.discoveryCall` — fine art → "Schedule collector conversation", design → "Schedule scoping call", photo → "Schedule discovery call". Updated both the top-action button label and the inline discovery card heading/button.
- **T6 Dashboard settings nav** (`Dashboard.tsx` line 559): `window.location.href = '/settings'` → `setShowSettings(true)` (Settings is a modal, not a route).
- **T7 Dashboard view-portfolio public URL** (`Dashboard.tsx`): SmartSuggestion `view-portfolio` action opens `/portfolio/:userId` in a new tab (falls back to internal view if `user.id` unavailable).
- **T8 Filter dropdowns simplified** (`Dashboard.tsx`): `availableProjectTypes` memo filters to types present in actual leads. `availableIndustries` memo collapses 10 enum values into 3 canonical UI buckets (Photography / Design / Fine Art). Dropdowns hide entirely when nothing to filter. Mobile + desktop both updated.
- **T9 Beta email copy** (`email.ts`): "Your account is free, forever." → "You have lifetime access — no monthly fees, ever." 3 replacements (founder note + beta welcome body + success box). Corrects the mis-description for $97 lifetime users.
- **T10 Fine art contract date row removed** (`quotes.ts` autopilot template + `contracts.ts` list-endpoint template): PORTRAIT_COMMISSION Commission Details row no longer includes `Estimated Completion: {{eventDate}}` — just Project + Agreed Fee. Photography/design templates unchanged.
- **T11 ContractsTab Save & Send** (`ContractsTab.tsx`): Added `handleSaveAndSend` + amber button visible only when `editingContract.status === 'DRAFT'`. Saves then opens email composer with updated contract in one flow.

**Skipped (already done in iter 136)**: Login/Signup navigate — remaining `window.location.href` in those files is the Google SSO button which must stay (cross-origin redirect).

**Verified**: `npx tsc --noEmit` = 0 errors on both sides. `GET /api/contracts/templates/list?industry=FINE_ART` still returns `[PORTRAIT_COMMISSION, GENERAL_SERVICE, CUSTOM]` (regression clean). Backend health 200.

**Flagged for Emmanuel**: Verification-email issue confirmed NOT a code bug (affected users got wrong-URL emails before `FRONTEND_URL` was fixed on Railway — manual resend needed). Signup industry map kept as `DESIGN: 'GRAPHIC_DESIGN'` (Prisma enum has no `DESIGN` value; frontend `industryLanguage.ts` maps correctly).

### Iteration 141 — Navigation, Calendar Sidebar, Performance, Mobile Login, Quotes (Complete — 2026-04-18)
- **T1 Dashboard chrome scoping** (`Dashboard.tsx`): Stat cards + filter toolbar now only render for `kanban` / `list` views. Analytics / Sequences / Portfolio views are full-bleed without the lead-management chrome above them.
- **T2 Deferred analytics fetch** (`Dashboard.tsx`): Analytics + monthly-trend now fire in a `setTimeout(0)` after `setLoading(false)` — sparklines + revenue goal populate in background without delaying initial TTI.
- **T3+T4 Calendar DaySidebar** (`Calendar.tsx`): New `selectedDate` state + always-visible `DaySidebar` component on desktop (lg+). Shows day header + event list + "Add event" CTA. Empty state shows "No events on this day" + empty-state CTA. Sidebar is sticky top-72px so it stays in view while scrolling. When an event is clicked, `EventSidePanel` replaces `DaySidebar` in the same slot.
- **Day click behavior** (`Calendar.tsx`): Clicking a day in Month/Week view now sets `selectedDate` (desktop) and opens a slide-in panel (mobile). No longer opens `CreateEventModal`. The "+ Event" toolbar button is the single create path.
- **T5 Narrowed event fetch** (`Calendar.tsx`): Event fetch window reduced from ±1 month to current month only. Halves API payload on every navigation.
- **T6 Landing Login link on mobile** (`LandingPageV2.tsx`): Removed `hidden sm:block` so Log in link is visible in nav at all viewport widths.
- **T7 Fine-art quote date cell** (`QuoteBuilderModal.tsx`): For `userIndustry === 'FINE_ART'` when both `keyDate` and `eventDate` are null, the date cell renders as an empty spacer (preserves grid layout) instead of "—". Photography/design always show the date cell.

**Verified**: `npx tsc --noEmit` = 0 errors on both sides. Backend health 200. Supervisor status all running.

### Iteration 142 — Calendar fix, Quote modal, Deep-link views, Landing revamp, Kanban pastels, 4-palette accents (Complete — 2026-04-18)
- **T1 Calendar** (`Calendar.tsx`): Removed redundant "Dashboard" button from header (logo already navigates). `DaySidebar` now always visible on desktop; `EventSidePanel` renders below it when an event is selected (both stacked in same sidebar column).
- **T2 Quote Preview modal** (`QuoteBuilderModal.tsx`): `QuotePreview` outer overlay z-index raised to `z-[70]` (was `z-50`) to sit above the main quote builder modal. `handleSend` now closes the preview (`setShowPreview(false)`) after a successful send so parent modal state reflects the sent quote.
- **T3 Deep-link `?view=`** (`Dashboard.tsx`): Dashboard now reads `?view=quotes|contracts|analytics|sequences|portfolio|list|kanban|calendar` from URL on mount. `handleViewChange` syncs the URL via `setSearchParams` (kanban default → no `?view=` param). Preserves other query params like `leadId`. Use `navigate('/dashboard?view=quotes')` anywhere to deep-link. No new routes, no unmounts.
- **T5 Landing revamp** (`LandingPageV2.tsx`): Removed `ProblemSection`, `WorkflowSection`, `FeaturesSection`, `ProductDeepDiveSection`, `MidPageCTA`, `FAQSection`, `FounderSection`, `FinalCTA` from render. Added `SocialProofStrip` (3 testimonial cards), `FeatureRowsSection` (3 alternating image+text rows with inline `LeadsMockup`/`QuoteMockup`/`ArtistMockup` preview cards), `SimpleFinalCTA`. `TestimonialsSection` trimmed to top 3 testimonials. Component bodies remain in file — fully recoverable.
- **T6 Kanban pastels** (`KanbanBoard.tsx`): Replaced `COLUMN_COLORS` (dark tailwind tokens) with `KANBAN_STAGE_COLORS` (pastel hex palette keyed by status → `{ bg, border, text, dot }`). Mobile tabs, mobile single-column view, and desktop columns all use soft pastel backgrounds with colored status dots + tinted status pill counts. `COLUMN_COLORS` shim removed.
- **T7 4-palette accent system** (`Settings.tsx`): Replaced 8-swatch `ACCENT_COLOURS` with 4 curated `ACCENT_PALETTES` (KOLOR / Slate Studio / Terra / Midnight) — each has name, description, primary colour, and 2-swatch preview. New `kolor_palette_id` localStorage key + backward-compat write to `kolor_app_accent` so `main.tsx` boot script still applies the theme. Reset button removed (named palettes include the default).

**Skipped (already done in iter 141)**: T4 (React.lazy + Suspense code-splitting — `App.tsx` already uses `lazy()` for all routes).

**Skipped (deferred per Emmanuel's call)**: Standalone routes for Quotes/Contracts/Sequences/Analytics/Portfolio — in-memory view-mode switches are faster than route unmounts; T3 deep-link via `?view=` param gives bookmark/share capability without the remount cost.

**Verified**: `npx tsc --noEmit` = 0 errors on both sides. Backend health 200. Iter 137 template regression clean.

### Iteration 143 — Landing fixes, mockup animations, pipeline pastels, contract UX, brand/scheduling toasts, perf (Complete — 2026-04-18)
- **T1 Landing nav** (`LandingPageV2.tsx`): `Features/Pricing/Stories` anchor tags → smooth-scroll `<button>` calling `scrollIntoView`. Added `id="features"` to `FeatureRowsSection` and `id="stories"` to `TestimonialsSection`. `UrgencySection` already had `id="pricing"`. Restored `FinalCTA` (replaces `SimpleFinalCTA` in render; both definitions remain in file).
- **T2 Mockup scroll animations** (`LandingPageV2.tsx`): Each row tagged `data-feature-row` + `reveal-section`. Mockup containers start at `opacity:0 + translateY(24px)` and transition to visible when parent gains `.revealed` (existing IO + MutationObserver pattern). `ArtistMockup` progress bar animates width from 0% → 60% on reveal via `useRef` + MutationObserver. All animations respect `prefers-reduced-motion: reduce`.
- **T3 Revenue pipeline pastels** (`RevenuePipelineWidget.tsx`): New `STAGES` schema with per-stage `headerBg`, `headerBorder`, `headerText`, `valueBg`, `valueText` hex values. Two-tone pastel card per stage (peach/violet/green/amber/sky). Fetch deferred `setTimeout(1200)` so dashboard TTI isn't blocked by the pipeline analytics call.
- **T4 Contract send error handling** (`ContractsTab.tsx`): Added `import { toast } from 'sonner'`. `handleEmailSend` wraps send in try/catch/finally, toasts success, closes composer in `finally`, rethrows inline validation errors to preserve EmailComposer UX. `handleSaveAndSend` wraps update in try/finally + toasts save errors. Save button closes editor before handing off to composer for the send step.
- **T5a Brand tab copy** (`Settings.tsx`): Clarified these are **client-facing** brand colours; pointer to Profile tab for workspace theme.
- **T5b Scheduling save toast** (`SchedulingSettings.tsx`): `saveAvailability` now try/catch/finally-wrapped, `toast.success('Availability saved')` / `toast.error(...)` on the save button flow. Added sonner import.
- **T6 QuickActions wiring** (verified): All 4 handlers (`handleQuickSendQuote`, `handleQuickFollowUp`, `handleQuickCheckSchedule`, `setShowAddModal(true)`) wired on both desktop + mobile render sites. `handleQuickCheckSchedule` = `navigate('/calendar')`. No "Add Commission" anywhere.
- **T7a Defer pipeline fetch** (done in T3).
- **T7b Defer analytics fetch** — already deferred in iter 141 via `setTimeout(0)` after `setLoading(false)`. Verified still in place.
- **T7c Lazy images** (`Dashboard.tsx` + `KanbanBoard.tsx`): Added `loading="lazy"` to lead cover image `<img>` tags. Kanban cover img also got `motion-reduce:` hover guard.

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

## Key API Endpoints
- `GET /api/health` — Health check
- `GET /api/unsubscribe/:token` — Public unsubscribe
- `POST /api/digest/weekly` — Manual trigger for Monday pipeline reports (auth required, cold-start safety net, added Iter 144)
- All `/api/` routes protected by auth middleware

## Iteration 154 — Mobile Landing Fixes + Geometric KolorLogo (Feb 2026) — ✅ SHIPPED
- **A1 (P0)**: Mockup observers now skip MutationObserver path on mobile (innerWidth<768) + reduced-motion. Reveals `.mockup-animate` immediately with `opacity:1/translateY(0)`. Fixes invisible-on-mobile P0 bug. Applied to both feature-row observer and ArtistMockup progress-bar observer. Verified post-deploy: 3/3 mockups report `opacity:'1'` on 390px viewport (was 0).
- **A2 (P0)**: IntersectionObserver threshold `0.1 → 0.05`.
- **A3 (P1)**: Feature row mobile gap `gap-10 → gap-6` (md:gap-16 unchanged).
- **A4 (P1)**: Hero subheadings use `fontSize: clamp(15px, 4vw, 18px)` (both variants).
- **A5 (P1)**: Nav "Log in" `hidden sm:block` (was crowding logo on narrow viewports).
- **B**: Rebuilt `KolorLogo` as a geometric Bauhaus-style K mark + wordmark. Construction in 120px coord space: stem rect + 3 polygons (upper arm / amber channel / lower arm), all sharing the same diagonal angle. Same prop API as before — all 5 call sites (LandingPageV2, Dashboard, Login, Signup, Calendar) work unchanged.
- TypeScript + Vite build clean. Commit: f2d42b9.

## Iteration 153 — Digest Preview + Shared Templates + DB Rate Limit (Feb 2026) — ✅ SHIPPED
- **T1 Settings digest preview (P2)**: New "Weekly digest preview" section in Settings → Notifications with `Send preview` button (`send-digest-preview-btn`) calling `POST /api/digest/send`. States: Sending… → Sent! → auto-clears after 4s. Uses existing backend endpoint.
- **T2 Shared contract templates (P2)**: New `backend/src/data/contractTemplates.ts` exports `CONTRACT_TEMPLATES` (6 types incl CUSTOM), `INDUSTRY_TO_CONTRACT_TYPE` (10 industries), `fillContractTemplate`. `contracts.ts` + `quotes.ts` now import from the single source; local duplicates + `fillTemplate`/`CONTRACT_TEMPLATES_INLINE` removed. `CONTRACT_TYPE_LABELS` kept local to contracts.ts (display-only).
- **T3 DB-persisted forgot-password rate limit (P2)**: User model gets `passwordResetAttempts` (Int @default(0)) + `passwordResetWindowStart` (DateTime?). Removed in-memory Map + module-level `MAX_ATTEMPTS`/`RATE_LIMIT_WINDOW` constants (now local inside handler as `MAX_RESET_ATTEMPTS`/`RATE_LIMIT_WINDOW_MS`). Counters reset on successful password reset. Migration: `20260424130000_add_password_reset_rate_limit/migration.sql`.
- Testing: testing_agent_v3_fork — 100% pass backend (13/13) + UI verified (iteration_153.json). `/api/health` 200, login/settings/leads/quotes/contracts regression all green. TypeScript + both builds clean.

## Iteration 152 — Migration File + Weekly Report Throttle + Scheduler Env Flag (Feb 2026) — ✅ SHIPPED
- **T1 Prisma migration file (P1 carryover)**: Created `prisma/migrations/20260424120000_iter151_schema_fixes/migration.sql` capturing the Iter 151 column rename + 3 new indexes. Marked applied via `npx prisma migrate resolve --applied`. `prisma migrate status` clean — Railway `migrate deploy` will now work.
- **T2 Weekly report throttle (P2)**: Added `await new Promise(r => setTimeout(r, 100))` between users in `runWeeklyPipelineReports` loop. Prevents DB connection burst at 50+ users (Monday morning).
- **T3 Scheduler env flag (P2)**: Replaced dynamic `require('./scheduler')` + `NODE_ENV === 'production'` guard with static `import { startScheduler } from './scheduler'` + `ENABLE_SCHEDULER === 'true'` check. Works in any NODE_ENV so scheduler is testable in staging/dev.
- **⚠️ Manual prod step required**: On next Railway deploy, set `ENABLE_SCHEDULER=true` or scheduler will remain off.
- Testing: `npx tsc --noEmit` + `npm run build` clean. Backend restarts cleanly, health check green, startup log confirms new "[Scheduler] Disabled. Set ENABLE_SCHEDULER=true to enable." message.

## Iteration 151 — Schema Migration + Processor Mutex + Sequence DB-Before-Send (Feb 2026) — ✅ SHIPPED
- **T1 Schema (P1)**: Renamed `ProcessedWebhookEvent.stripeEventId` → `eventKey` (column now stores both Stripe event IDs and Paystack `paystack_ch_*` refs). Added missing indexes: `Quote([viewedAt])`, `Quote([validUntil, status])`, `Contract([sentAt, status, clientAgreed])`. Applied via raw SQL rename + `prisma db push`. `webhooks.ts` field refs updated.
- **T2 Processor concurrency mutex (P1)**: Added `ProcessorRunning` boolean guard in 5 service files (`sequenceEngine`, `onboardingService`, `quoteFollowUpService`, `scheduledEmailService`, `meetingReminderService`). Pattern: module-level flag + entry check + `try { … } finally { flag = false }`. Prevents a slow run from overlapping the next scheduled invocation.
- **T3 Sequence DB-before-send (P1)**: `processSequences` now calls `prisma.sequenceEnrollment.update` (line 138) BEFORE `sendSequenceEmail` (line 145). Email failure after DB advance no longer causes duplicate sends on the next run.
- Testing: testing_agent_v3_fork — 100% pass backend (iteration_151.json). Functional tests: `/api/contracts/:id/agree` 1.1s response, `/api/quotes/public/:token/accept` works end-to-end. TypeScript + build clean.

## Iteration 150 — P0 Backend Hardening (Feb 2026) — ✅ SHIPPED
- **T1 Webhooks atomic dedup (P0)**: Replaced check-then-record pattern with atomic create-first, catching `P2002` unique violation as the duplicate signal. Applied to both Stripe (`/api/webhooks/stripe`) and Paystack (`/api/webhooks/paystack`) handlers. Closes race condition where concurrent retries could double-process events.
- **T2 Quotes debug log removal (P0)**: Removed 13 lines of PII-leaking debug logs (owner emails, `SENDER_EMAIL`, hard-coded sandbox email). Kept `sendQuoteAcceptedNotification` intact and replaced success log with a single `!notifSent` warn. Functional test confirms quote acceptance still fires notifications.
- **T3 `/contracts/:id/agree` response ordering (P0)**: `res.json` now fires immediately after the authoritative `prisma.contract.update` (line 496). All 6 side effects (owner notification, activity log, deposit email, milestones `createMany`, `enrollInOnboarding`, testimonial schedule) run inside `setImmediate` with independent try/catch — side-effect failures no longer surface as 500 to signing clients. Verified response time ~644ms with 4 milestones auto-generated and testimonial scheduled.
- Testing: testing_agent_v3_fork — 100% pass backend (iteration_150.json). `npx tsc --noEmit` + `npm run build` both clean.

## Iteration 149 — Wire RevenuePipelineWidget into Analytics (Feb 2026) — ✅ SHIPPED
- **T1 AnalyticsDashboard (P1)**: Imported and rendered `<RevenuePipelineWidget />` between the Business Metrics 4-card grid and the Revenue Trend chart. Self-labelled widget with stages Quotes Sent → Contract → Deposit Paid → In Progress → Paid in Full + Total Pipeline Value footer.
- **T2 Dashboard (P1)**: Removed the forward-compat `RevenuePipelineWidget` import retained since Iter 146. Widget no longer referenced on the primary work surface — lives exclusively in Analytics now.
- Testing: Smoke-tested via logged-in screenshot at `/dashboard?view=analytics`. Widget renders correctly with live data ($13,200 pipeline value, $2,580 tracked). TypeScript + Vite build both clean.

## Iteration 148 — Sparkline NaN Fix + Design Sweep Extension (Feb 2026) — ✅ SHIPPED
- **T1 Sparkline NaN fix (P1)**: `toSparkline` in Dashboard.tsx now maps `d[key] ?? 0` — eliminates `<path d: NaN>` console warnings when API data is sparse (carryover from Iter 145-147).
- **T2 Login.tsx (P1)**: `rounded-[10px]` → `rounded-lg` (4x); `text-[13px]` → `text-sm` (2x); `text-[11px]` → `text-xs` (4x).
- **T3 Signup.tsx (P1)**: `rounded-[10px]` → `rounded-lg` (7x); `text-[13px]` → `text-sm` (3x); `text-[11px]` → `text-xs` (7x).
- **T4 LeadsListView.tsx (P1)**: Chip containers → `rounded-lg`, tab row container → `rounded-xl`, tab buttons → `rounded-lg`, pipeline placeholder + table container → `rounded-xl`. Typography was already scale-compliant from Iter 146 sweep.
- **T5 QuoteBuilderModal.tsx (P1)**: Thumbnail + value summary → `rounded-lg`; client/line-items/notes/totals cards → `rounded-xl`; modal max-height bumped `min(700px, 95vh)` → `min(800px, 95vh)` for more room on taller viewports.
- Testing: Smoke screenshots confirm Login + Signup render correctly with the new radii/typography. TypeScript + Vite build both clean.

## Iteration 147 — Universal Undo Pattern (Feb 2026) — ✅ SHIPPED
- **T1-T4 Universal undo (P1)**: All 4 destructive-action surfaces now use the same optimistic-UI + 5s undo toast pattern (sonner):
  - Dashboard lead delete (`handleLeadDelete`, `data-testid=undo-lead-delete`)
  - Quotes page quote delete (`handleDelete`, `data-testid=undo-quote-delete`)
  - ContractsTab (lead modal) contract delete (`handleDelete`, `data-testid=undo-contract-delete`)
  - Contracts page contract delete (`handleDelete`, `data-testid=undo-contract-page-delete`)
- Pattern: (1) remove from state, (2) toast with name + Undo button + 5s duration, (3) `setTimeout` fires API delete, (4) Undo click: `clearTimeout` + dismiss + restore, (5) API failure: restore + `toast.error('… — restored')`.
- All native `confirm()` dialogs removed. Inline 2-step `deleteConfirm` state in `Contracts.tsx` `ContractRow` dropdown also removed (replaced by row-level undo).
- Testing: testing_agent_v3_fork — code verification 100% pass, Quote delete UI-tested end-to-end (toast + Undo restores quote). Lead/contract handlers use identical proven pattern. TypeScript + Vite build both clean.

## Iteration 146 — UI/UX Design Elevation Sprint (Feb 2026) — ✅ SHIPPED
- **T1 Dashboard declutter (P0)**: 1a removed `RevenuePipelineWidget` from kanban/list (import retained for future Analytics); 1b moved `CRMAlerts`+`RevenueDashboard` into right sidebar above `RevenueGoalWidget` (data-tour tags preserved); 1c hero pipeline stat shrunk 56px→40px; 1d industry widgets collapsed by default behind `▸ Show studio tools` toggle (`data-testid=toggle-industry-widgets`).
- **T2b Header cleanup (P0)**: Logout moved from top header into sidebar user-block dropdown (`sidebar-logout-btn`, `userMenuOpen` state).
- **T3 Typography 5-step scale (P1)**: `text-[9px]`→`text-[10px]`, `text-[11px]`→`text-xs`, `text-[13px]`→`text-sm` across Dashboard, QuickActions, Quotes, Contracts + broader sweep (BrandPreview excluded as intentional mockup).
- **T4 Border radii (P1)**: `rounded-[7px]`→`rounded-lg`, `rounded-[10px]`→`rounded-xl`, `rounded-[9px]`→`rounded-lg` (chips) / `rounded-xl` (tab rows).
- **T5 QuickActions contextual empty states (P1)**: `hasAction` filter + "All caught up" footer (`quick-actions-caught-up`).
- **T6 Landing feature rows (P1)**: Relabelled `FOR PHOTOGRAPHERS` / `FOR DESIGNERS` / `FOR FINE ARTISTS`; row-2 body rewrite using "proposals", "project agreement", "in your currency" (removed Stripe/Paystack mentions from feature rows — still present in Pricing/PSP trust strip).
- **T7 Settings App Themes rewrite (P1)**: Glyph + named theme spec replaces emoji cards — ✦ KOLOR / ◈ Slate Studio / ◉ Terra / ◆ Midnight each with tagline. State renamed `selectedPaletteId`→`selectedThemeId`. localStorage keys (`kolor_palette_id`, `kolor_app_accent`) preserved.
- **T8 Calendar '+N more' (P1)**: Now a `<button>` with `data-testid=calendar-show-more-YYYY-MM-DD` that opens DaySidebar. Month cell min-h 80→88 / 100→110.
- **T9 Icon weights (P2)**: QuickActions icons `duotone`→`regular`; sidebar `GearSix` made explicit `weight="regular"`.
- Testing: testing_agent_v3_fork verified 9/9 tasks (iteration_146.json, 100% pass). TypeScript + Vite build both clean.

## Iteration 145 — Contract Preview Modal + Dashboard Scroll-to-Top (Feb 2026) — ✅ SHIPPED
- **T1 ContractsTab preview modal (P0)**: Full-screen `ContractPreviewModal` at z-[60] with header/scrollable body/sticky footer. Prominent 'Send to Client' (or 'Resend to Client') button always visible in footer. Closes on Escape, backdrop click. Triggered by new 'Preview' Eye button in action row and 'See full contract →' link under inline preview. Inline preview shrunk to 200px with fade gradient hinting more content below. Fixes the 'no Send button after review' bug caused by the old 300px max-height clipping.
- **T2 Dashboard scroll-to-top (P0)**: `handleViewChange` now calls `window.scrollTo({ top: 0, behavior: 'smooth' | 'auto' })` respecting `prefers-reduced-motion`. Applies to all desktop toolbar, sidebar, and mobile-hamburger nav buttons (they all route through `handleViewChange`).
- Testing: testing_agent_v3_fork verified 10/10 tasks (iteration_145.json). Desktop scroll: 1849px → 0px; mobile scroll: 1461px → 0px; sidebar closes on mobile.

## Iteration 155 (Final) — Designer K-mark PNG asset across logo / loading / OG (Feb 2026) — ✅ SHIPPED
- **Asset**: `frontend/public/kolor-mark.png` (designer-supplied PNG, processed via PIL: luminance-keyed alpha to remove white background, tight bbox crop → 691×459 RGBA, 380 KB). Duplicate `favicon-mark.png` for the favicon link.
- **KolorLogo.tsx**: full rewrite — render `<img src="/kolor-mark.png" />` at 28/40/56 px (sm/md/lg) with `prefers-reduced-motion`-guarded entrance animation. `variant` controls wordmark colour. `animated` opt-in only.
- **LandingPageV2 Nav**: passes `animated` to its single `<KolorLogo>` (line 378).
- **LoadingScreen.tsx**: full rewrite — full-page `#080612` surface with PNG mark pulsing (`kolor-mark-pulse` 1.6s ease-in-out infinite), gated by `prefers-reduced-motion`. Already wired into `App.tsx` Suspense fallback.
- **og-card.svg**: 1200×630, embeds `/kolor-mark.png` at 300×300 + KOLOR STUDIO wordmark + verbatim tagline **"The studio behind your best work."** + URL chip.
- **index.html**: favicon points to `/favicon-mark.png`; cleaned `og`/`twitter` block — single `og:image` content URL.
- **Build gate**: `npx tsc --noEmit` clean. `npm run build` clean (9.74s).
- **Commit**: `ff53c8aa9ffb4298019656ae1c008c1ea923afa5` (supersedes Canva-geometry `e1498bb`).

## Iteration 155 (Revised) — Canva K-mark Geometry + Animation + Loading + Favicon/OG (Feb 2026) — ✅ SHIPPED
- **Workstream A — KolorLogo.tsx full rewrite (Canva reference geometry)**: 150×170 coordinate space — pill stem (rect 0,0 70×170 rx=35), upper-right semicircle (`M 80,0 A 40,40 0 0 1 80,80 Z`), lower-right rect with `r=20` bottom-right corner, amber radial sweep behind purple geometry (variant-aware opacity 0.38/0.58). Five staggered keyframes at 40/80/180/260/420ms, all gated by `prefers-reduced-motion: no-preference`.
- **Workstream B — LandingPageV2 Nav opt-in animation**: single Nav `<KolorLogo>` instance receives `animated` prop (line 378).
- **Workstream C — LoadingScreen.tsx rewrite**: same Canva geometry, fixed full-page `#080612` surface, z=9999. Amber sweep pulses (`kolor-sweep-pulse` 1.6s ease-in-out infinite), purple geometry solid. Wired into `App.tsx` Suspense fallback.
- **Workstream D — Favicon + OG Card**: `favicon.svg` is purple-only geometry (amber omitted at micro size); `og-card.svg` (1200×630) with dual-radial backplate + scaled K mark + verbatim tagline **"The studio behind your best work."** + URL chip. `index.html` deduped to single favicon SVG link + single SVG `og:image`.
- **Build gate**: `npx tsc --noEmit` clean. `npm run build` clean (8.69s).
- **Commit**: `e1498bb0f351483c9d8e3ceadf9ee5165e14730b` (supersedes prior `24d33dc` with revised Canva geometry).

## Iteration 144 — Scroll-nav, App Themes, Mockup Shadows, Digest Fix, Perf (Feb 2026) — ✅ SHIPPED
- **T1 Landing Nav (P0)**: IntersectionObserver highlights active section (features/pricing/stories) with purple underline; smooth-scroll buttons preserved.
- **T2 App Themes (P1)**: `ACCENT_PALETTES` → `APP_THEMES` with emoji cards (🎨 KOLOR, 🖋️ Slate, 🌅 Terra, 🌙 Midnight). Back-compat `kolor_palette_id` + `kolor_app_accent` localStorage keys preserved.
- **T3 Mockup glow (P1)**: LeadsMockup + ArtistMockup now have purple gradient top bar (`#6C2EDB → #a78bfa`) + `0 0 40px rgba(108,46,219,0.18)` glow.
- **T4 Weekly Digest (P0)**: Added `POST /api/digest/weekly` (cold-start safety net). Scheduler opt-out default: `weeklyReportEnabled: { not: false }`.
- **T5 Dashboard header (P1)**: Removed HelpMenu + Settings gear from top header; sidebar + mobile menu unchanged.
- **T6 Calendar (P1)**: `handleDayClick` clears `selectedEvent` when day has 0 events.
- **T7 Backend perf (P0)**: Staggered 5 bg processors at 5/7/9/11/13 min post-boot. Added `[Perf] ⚠️ Slow` middleware for >500ms requests.
- **T8 Scheduling toasts (P1)**: `saveMeetingType` / `deleteMeetingType` / `toggleMeetingTypeActive` now wrap API calls in try/catch with `toast.success`/`error`.
- **T9 QuoteBuilderModal (P0)**: Outer modal `maxHeight: min(700px, 95vh)`. Preview already had z-[70] + 90vh overflow + onSend wiring + setShowPreview(false) on success. Added testids `quote-preview-send-btn` / `quote-preview-back-btn`.
- Testing: All 9 tasks verified by testing_agent_v3_fork (iteration_144.json, 100% pass backend 6/6, all UI tasks verified).

### Iteration 166 — New Logo Asset + Animated SVG Spinner (Complete, Feb 2026)
- Replaced `frontend/public/kolor-mark.png` (853 KB) and `favicon-mark.png` (192 KB) with the new brand asset (resized from 4096² source).
- Rewrote `KolorSpinner.tsx` as a pure SVG/CSS component: 4 quadrants (`tl`, `tr`, `bl`, `br`) of the K mark assemble around the center with staggered ease-in-out (0/90/180/270 ms), 1.8 s loop. `prefers-reduced-motion` renders the static assembled K. New `color` prop defaults to `#6C2EDB`.
- `LoadingScreen.tsx` now renders `<KolorSpinner size={72} />`; removed the amber-pulse PNG path.
- Regenerated `frontend/public/og-card.png` (151 KB) via Pillow with the new mark + brand purple radial glow + Playfair display.
- Build gate: `npx tsc --noEmit` clean, `npm run build` clean.

### Iteration 167 — Spinner Geometry Fix + 5 Bug Fixes (Complete, Feb 2026)
- **KolorSpinner**: rewrote SVG to 4 distinct K quadrants — TL/BL are vertical stem (`<rect>`) + right-facing semicircle bowl (`<path>` with arc); TR/BR are diagonal parallelogram blades. Added whole-group 360° rotate after assembly.
- **Dashboard**: `open-brand-settings` action (Create Signature banner) now sets `settingsInitialTab: 'email'` before opening Settings (was landing on Brand tab).
- **ContractsTab**: `ContractPreviewModal` z-index `z-[60]` → `z-[70]` so it stacks above `EmailComposerModal` (`z-50`).
- **PublicPortfolio**: nav studio name no longer uses `position: absolute; left: 50%`; now a `flex-1 justify-center` column with `max-width: 40vw` + ellipsis — no collision with left avatar on mobile.
- **BrandSettings**: `PRESET_PALETTES` replaced with curated Studio/Midnight/Sage/Carbon/Blush/Ocean; `DEFAULTS` primary/accent now `#6C2EDB` / `#E8891A`; section label `Quick Palettes` → `Starter Palettes`.
- Fix 2 (mobile "New Commission" header button) was already `hidden lg:flex` — no change needed.
- Build gate: `npx tsc --noEmit` clean, `npm run build` clean (9.71 s). Commit `b313f26`.

### Iteration 168 — Three Persistent Fixes (Complete, Feb 2026)
- **KolorSpinner v4 geometry**: discarded the old arc-heavy paths (which rendered as a crescent at small sizes). Now uses exact coords: `<rect>` stem + quarter-circle bowl path (radius 24) for TL/BL and flat-edged `<polygon>` blades for TR/BR. Style ID bumped to `kolor-spinner-kf-v4` so stale cached keyframes are discarded on next paint. Static screenshots at 48/120/240 px all read as a distinct K.
- **Dashboard toolbar button removed**: deleted `<button data-testid="add-lead-button">` block in the toolbar row. The header `add-lead-topbar` (desktop-only `hidden lg:flex`) remains the sole header entry. Other entry points (empty state, kanban `+` column, keyboard shortcut) untouched.
- **ContractPreviewModal portal**: now wrapped in `ReactDOM.createPortal(..., document.body)` so it escapes the parent `LeadDetailModal` stacking context. z-index reset to `z-50` (portal removes the need for inflated z values).
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (9.15 s). Commit `e787429`.

### Iteration 169 — Canonical KolorSpinner File (Complete, Feb 2026)
- Diagnostic confirmed all three Iter 168 fixes (spinner geometry, toolbar button removal, contract portal) were already applied and committed in `e787429`. The "files were never updated" premise of the Iter 169 prompt did not match repo state.
- Brought `KolorSpinner.tsx` header comment + per-quadrant inline `{/* TL/TR/BL/BR */}` comments in line with the Iter 169 canonical spec via direct file write (`overwrite=true`). Geometry coordinates, polygon points, arc paths, animation keyframes, and `STYLE_ID = 'kolor-spinner-kf-v4'` all unchanged from v4.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (10.13 s). Commit `0c3f4e5`.

### Iteration 169 (re-run) — Spec-Verbatim Spinner File (Complete, Feb 2026)
- User's diagnostic re-run requested. Confirmed Fix 2 (toolbar `add-lead-button`) and Fix 3 (`ContractsTab` portal) were already canonical from commit `e787429`; no source changes needed for either.
- Spinner re-written to match the Iter 169 prompt verbatim (compressed 7-line header + no inline `{/* TL/TR/BL/BR */}` comments inside SVG). All geometry coordinates, animation keyframes, and `STYLE_ID = 'kolor-spinner-kf-v4'` unchanged.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (10.24 s). Commit `53514e4`.

### Iteration 170 — Three Final Fixes (Complete, Feb 2026)
- **Dashboard**: removed the entire `add-lead-topbar` header `<button>` block. Add-lead entry points remain via empty state, kanban "+" column buttons, sidebar, keyboard shortcut.
- **EmailComposerModal**: replaced hardcoded `https://hardened-crm-2.preview.emergentagent.com/portal/${lead.portalToken}` with `https://kolorstudio.app/portal/${lead.portalToken}` (Portal Link snippet button at L262). EmailComposer.tsx had no hardcoded URLs.
- **KolorSpinner**: rewritten as **pure CSS** — four absolutely-positioned `<div>` quadrants with rounded corners, 100 ms stagger entry animation (`ks170-entry`) + group rotate (`ks170-rot`). Zero vector paths. `prefers-reduced-motion` falls back to opacity pulse.
- EmailComposer preview sizing was already correct (`max-h-[90vh]` + inner scroller); no change needed.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (10.58 s). Commit `b81caf4`.

### Iteration 171 — Brand Spinner in CTAs + Build Hash Stamp (Complete, Feb 2026)
- **EmailComposer modal**: was already `max-w-2xl` + `max-h-[90vh]` from Iter 170; added `shadow-2xl` polish.
- **KolorSpinner in primary CTAs** (7 buttons across 5 files):
  - `EmailComposer.tsx` — send button
  - `EmailComposerModal.tsx` — `send-email-btn`
  - `ContractsTab.tsx` — `send-contract-{id}`, `contract-preview-send-btn`
  - `QuoteBuilderModal.tsx` — `quote-preview-send-btn`, `sidebar-send-btn`
  - `BookingModal.tsx` — `save-booking-btn`
  - Each `<SpinnerGap className="w-4 h-4 animate-spin" />` replaced with `<KolorSpinner size={14} color="white" />` (or 12/16 to match icon sizing). Other `SpinnerGap` instances (page loaders, section indicators, status badges) intentionally preserved.
- **BrandSettings WYSIWYG palette preview**: already correctly wired — `BrandPreview` receives `primary`/`accent`/`font` from local state, which updates instantly on palette click. No code change needed.
- **Build hash stamp**: `__BUILD_HASH__` injected via Vite `define` from `git rev-parse --short HEAD`; `console.info('[KOLOR] build', __BUILD_HASH__)` in `main.tsx`; `declare const __BUILD_HASH__: string` in `vite-env.d.ts`. Bundle inspection confirms hash baked in.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (10.64 s). Commit `586680f`.

### Iteration 172 — Bundle Splitting + Parallel API Calls (Complete, Feb 2026)
- **Dashboard parallel init**: `fetchLeads` / `fetchStats` / `fetchPendingContracts` now run concurrently via `Promise.all` (4 occurrences in `Dashboard.tsx`, including `handleRefresh`). Eliminates ~400–900 ms of sequential waterfall on cold start.
- **Lazy-loaded 8 heavy sub-views**: `KanbanBoard`, `LeadDetailModal`, `SettingsModal`, `AnalyticsDashboard`, `PortfolioPage`, `SequencesDashboard`, `QuotesPage`, `ContractsPage` — each wrapped in `<Suspense>` with `KolorSpinner` fallback (or `null` for modals already gated by a condition). Removed unused `CalendarViewNew` import (dead code).
- **Vite manualChunks**: `vendor-react` (react + react-dom + router), `vendor-ui` (sonner + phosphor), `vendor-editor` (react-quill), `vendor-charts` (recharts), `vendor-numberflow`. `chunkSizeWarningLimit` raised to 600 KB.
- **Result**: Dashboard chunk **1,464 KB → 347 KB (-76%)**. Initial JS for logged-in landing reduced from ~1.54 MB to ~0.93 MB (~415 KB → ~270 KB gzip transfer). Vendor chunks cache long-term across deploys.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (9.39 s, no warnings). Commit `507a717`.

### Iteration 173 — Phosphor Icon Tree-Shaking (Complete, Feb 2026)
- Converted **80 frontend files** from `import { X, Check } from '@phosphor-icons/react'` (barrel) to per-icon CSR direct imports `import { X } from '@phosphor-icons/react/dist/csr/X'`. Phosphor's package barrel exports defeat Vite's tree-shaker, forcing the entire ~3000-icon library into the bundle regardless of which icons are actually used.
- 730 direct CSR imports across 80 files. Preserved: 2 `import type { Icon as PhosphorIcon }` declarations (`EmptyState.tsx`, `StatCard.tsx`); all `weight`/`className`/`style` props; all `as` aliases.
- `vite.config.ts`: removed `@phosphor-icons/react` from `vendor-ui` manualChunk so Vite bundles each icon with the chunk that uses it.
- **Result**: `vendor-ui` **391 KB → 34 KB (-91%)**. First-paint logged-in JS **~959 KB → ~726 KB raw** (~270 KB → ~210 KB gzip). Combined with Iter 172, total first-paint cut ~50%.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.79 s, no warnings). Commit `5e2a33a`.

### Iteration 175 — New Logo Mark Asset Swap (Complete, Feb 2026)
- New converging-pinwheel mark provided. Source PNG turned out to be an opaque RGB image rendered with photoshop's 2-shade grey checkerboard (not actually alpha-transparent). Processed via Pillow with chroma-based alpha mask (`chroma < 20 → transparent`, `> 70 → opaque`, mid-range = linear ramp for anti-alias edges) and recoloured opaque pixels to exactly `#6C2EDB` for crisp brand-pure output.
- `kolor-mark.png` 853 KB → **106 KB** (2048×2048, 86% transparent). `favicon-mark.png` 192 KB → **63 KB** (1280×1280). Both true alpha-transparent — no grey haze, no off-white box on dark surfaces.
- Regenerated `og-card.png` (68 KB) with new mark + Playfair Display title + brand-purple radial glow.
- Verified live: loading screen now shows the mark cleanly above the KOLOR/STUDIO wordmark on the dark background.
- `site.webmanifest`, `index.html` (favicon + apple-touch-icon), `KolorLogo.tsx` (`<img src="/kolor-mark.png">`) all reference the same paths — no source code changes needed.
- Backend has no hardcoded brand-logo URLs (only the user-upload `/brand/logo` endpoint).
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.59 s). Commit `4f6e2fa`.

### Iteration 176 — Logo Container + Parallax + Shimmer + Sticky Save Bar (Complete, Feb 2026)
- **KolorLogo**: wrapped `<img src="/kolor-mark.png">` in a `#1A0A3C` dark-violet rounded-square container (radius = `markSize * 0.22`); mark image at 72% of container for breathing room. Reads cleanly on light nav surfaces; blends naturally on dark loading screen.
- **LoadingScreen**: rewrote with parallax tilt (`perspective(600px) rotateX/Y`) — 4° max via `pointermove` (desktop) + `deviceorientation` (mobile gyroscope), 0.12 s ease-out transition. `prefers-reduced-motion`: static, no listeners attached.
- **Dashboard shimmer skeletons**: new `ks-shimmer` keyframe (linear-gradient sweep `#ede9fe → #c4b5fd → #ede9fe` at 1.6 s ease-in-out infinite) injected once at module level. `StatCardSkeleton` + `KanbanSkeleton` replaced flat `animate-pulse` + `bg-light-*` with 11 brand-purple shimmer applications. `prefers-reduced-motion`: solid `#ede9fe`.
- **AnalyticsDashboard lazy**: was already lazy from Iter 172; no change needed.
- **BrandSettings sticky save bar**: footer pinned via `sticky bottom-0` + `bg-surface-base`; amber pulse dot + "Unsaved changes" label when `hasChanges === true`. `KolorSpinner` replaces `SpinnerGap` in both the save button and the logo-upload spinner; `SpinnerGap` import removed.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.86 s, no warnings). Commit `7ef28e6`.

### Iteration 177 — Bold Logo + Global Shimmer Utility + Perf Verification (Complete, Feb 2026)
- **KolorLogo bolder**: container `#1A0A3C` → `#6C2EDB` (brand primary), inner mark size `72% → 78%`, `<img>` filter `brightness(0) invert(1)` so the mark renders pure white inside the violet container.
- **Global shimmer utility**: moved `ks-shimmer` keyframe + `.ks-shimmer` class from runtime JS injection in `Dashboard.tsx` to `frontend/src/index.css` (single source of truth, no FOUC). 23-line CSS block appended.
- **Skeleton sweep**: replaced `animate-pulse` with `ks-shimmer` on **every skeleton site** in the codebase (11 sites across 8 components/pages: Dashboard header skeletons, ContractsTab list, LeadDetailModal Activity/FileGrid, PublicPortfolio loader, ActivityFeed, CalendarConnectionWidget, RevenueDashboard, SequencesDashboard stats + 2 card skeletons). Preserved: emerald live dot, amber unsaved dot, brand quote-status pulse.
- **39 `ks-shimmer` applications across 9 files** (1 CSS + 8 TSX).
- **Performance verified**: `vendor-charts*.js` and `vendor-editor*.js` confirmed absent from `dist/assets/` — recharts is inlined into the lazy `BarChart` chunk, react-quill inlined into the lazy `EmailComposerModal` chunk. Dashboard chunk **442 KB** (−10 KB from removing the JS injection block). No chunk-size warnings.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.72 s, no warnings). Commit `84b22d6`.

### Iteration 178 — Perf Fixes + Portal Elevation + Email Diagnosis (Complete, Feb 2026)
- **RevenuePipelineWidget**: removed the 1200 ms `setTimeout` wrapper around the analytics fetch (added in iter-143 when Dashboard init was sequential; iter-172 parallelised init so the delay was redundant). Cleanup `clearTimeout` removed.
- **ContractsTab**: mount `useEffect` now `Promise.all([fetchContracts(), fetchUserInfo()])`. `fetchUserInfo` fires `getTemplates(industry)` immediately after `getMe` resolves and lets the resolve-callback set state, instead of awaiting it. Saves one API roundtrip on the critical path.
- **ClientPortal footer elevation**: rebuilt as a branded dark panel (`#1a1625`) with the studio initial in a `#6C2EDB` square, helper subtitle, and a `Contact Us` CTA that mailto's `data.contact.email`. Legacy "Thank you for working with… Powered by KOLOR STUDIO" line moved below the panel, `data-testid="powered-by-badge"` preserved.
- **ClientPortal loading**: `SpinnerGap` → `KolorSpinner size={48}` (brand mark during portal fetch).
- Spec fixes 3b/3c (Messages + Share Files icon headers) were already canonical in `ClientPortalMessages.tsx` (L91) and `ClientFileUpload.tsx` (L141) — no change needed.
- **Email delivery root cause confirmed**: `backend/src/services/email.ts:11` falls back to `onboarding@resend.dev` (Resend sandbox) when `SENDER_EMAIL` env var is unset. Sandbox can ONLY deliver to the account-owner email — clients never receive contract emails. **Fix is a Railway env var update, not a code change**: set `SENDER_EMAIL=noreply@kolorstudio.app` (or another verified-domain address), save, redeploy API. The boot warning `[EMAIL] WARNING: Using Resend sandbox sender` (email.ts L19) is the live confirmation signal — it disappears once the env var is correctly set.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (7.13 s, no warnings). Commit `58b5d50`.

### Iteration 179 — Auto-Send Contract on Quote Acceptance (Complete, Feb 2026)
- **Backend `autoGenerateContract` rewrite** (`quotes.ts`): contract is now created with `status: 'SENT'` + `sentAt: new Date()` immediately on quote acceptance, and `sendContractSentEmail` fires inline. No manual studio action required to fulfil the portal's "your contract is being prepared, you'll receive it shortly" promise. Email failure is non-blocking (contract stays SENT in DB; portal access preserved). `portalUrl` built from `FRONTEND_URL` env (falls back to `kolorstudio.app`). Activity log updated to reflect auto-send. Industry mapping (`INDUSTRY_TO_CONTRACT_TYPE`) untouched — auto-send applies to all 3 industries equally.
- **`/api/contracts/pending`** (`contracts.ts`): status filter `'DRAFT' → { in: ['SENT', 'VIEWED'] }` so the banner now surfaces contracts awaiting client signature, not draft review.
- **Dashboard pending banner**: title "Contract Ready for Review → Contract Awaiting Signature"; body copy reflects new auto-send flow ("has been sent a contract… Awaiting their signature").
- **Required deploy**: Railway API service must be redeployed for backend changes to take effect (push to main triggers auto-deploy if wired). Confirmation log line on success: `[AUTOPILOT] Contract created and auto-sent: <id>` followed by `[AUTOPILOT] Contract email sent to client: <email>`.
- Build gate: backend `tsc --noEmit` ✓, frontend `tsc --noEmit` ✓, `npm run build` ✓ (7.03 s, no warnings). Commit `e7e4051`.

### Iteration 180 — Six-Area Polish Sprint (Complete, Feb 2026)
- **SpinnerGap → KolorSpinner** across 5 named scope files (11 button + page-load sites): `AnalyticsDashboard`, `RevenuePipelineWidget`, `ContractsTab`, `Settings`, `SubmitInquiry`. SpinnerGap imports removed from each. Out-of-scope files (`DeliverablesTab` status-icon map, `LeadDetailModal` non-loading uses) left untouched — those use SpinnerGap as visual cues, not loaders.
- **AnalyticsDashboard loading state**: centered spinner → full shimmer skeleton (header + 4 stat cards + chart panel) matching the real layout.
- **RevenuePipelineWidget loading state**: centered spinner → 3-row pipeline-stage shimmer skeleton.
- **CRMAlerts**: "Loading alerts…" text → shimmer skeleton with `data-testid="crm-alerts-loading"`. Per-icon imports were already in place (Iter 173); `onLeadClick` already wired in Dashboard (no change).
- **ShareFormModal**: Pro Tips heading `text-gray-200` (invisible on light purple) → `text-purple-800 font-semibold`. Modal header `bg-gradient-to-r from-brand-primary to-brand-primary` → `bg-gradient-to-br from-[#1A0A3C] to-[#2D1470]` (deep brand gradient matching KolorLogo container).
- **SubmitInquiry**: left panel `#FFFFFF` → `#F4F0FD` (brand-tinted, matches palette + creates intentional two-tone layout). Border `#EDE8F5` → `#DDD6FE`. Submit button SpinnerGap → KolorSpinner.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (7.06 s, no warnings). Commit `c932007`.

### Iteration 181 — Mobile Login + Auth Resilience + Critical CSS + Bundle Splits (Complete, Feb 2026)
- **LandingPageV2 mobile login**: nav-login Link `hidden sm:block` → `block` (visible on all screen sizes — was hidden below 640px).
- **Dashboard auth resilience**: `authApi.getMe()` now retries once after 800ms before navigating to `/login`. Eliminates redirect-loop on cold Railway start where the first request may 500.
- **Critical CSS in `index.html`**: `ks-shimmer` keyframe + `.ks-shimmer` rule + `#root:empty::before { background: #080612 }` injected directly into `<head>`. Skeleton + dark background paint before React bundle parses → no white flash on cold load.
- **Bundle splits**: `CRMAlerts` and `NeedsAttentionSection` converted from eager to lazy in `Dashboard.tsx`; render sites wrapped in `<Suspense fallback={…}>`. Dashboard chunk 442 KB → 437 KB; new `CRMAlerts-*.js` 14.5 KB / 4.9 KB gz separate chunk. Parallel `Promise.all` for fetchLeads/fetchStats/fetchPendingContracts was already in place from iter-172 (verified).
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (7.17 s, no warnings). Commit `b6f0141`.

### Iteration 182 — OG Card + Favicon Set + Branded Pre-React Splash (Complete, Feb 2026)
- **og-card.png** regenerated (15 KB) with current converging-pinwheel mark inside #6C2EDB rounded container, divider line, feature pills (Leads / Quotes / Contracts / Calendar), strong hierarchy. Old asset was from iter-166, predating the iter-175 mark swap.
- **Favicon set generated from `kolor-mark.png`**: `favicon-32.png` (0.7 KB), `favicon-16.png` (0.4 KB), `apple-touch-icon.png` (5 KB, iOS), `favicon-192.png` (5.3 KB, PWA), `favicon-512.png` (15.6 KB, PWA large), `favicon-mark.png` refreshed (5 KB). All use mark-in-violet-container.
- **index.html**: favicon `<link>` tags now reference proper sizes; `#root:empty` upgraded from plain dark `::before` to a full branded splash — inline SVG K mark (same 4-quadrant geometry as `KolorSpinner`) inside violet 72×72 container, KOLOR / STUDIO wordmark below, `ks-fade-in` animation (`prefers-reduced-motion` safe). React mount replaces splash content seamlessly.
- Build gate: `npm run build` ✓ (6.93 s, no warnings, no TS changes). Commit `69e0c23`.

### Iteration 183 — OG Card Pure-PIL Rebuild + Manifest + Meta Title (Complete, Feb 2026)
- **Root cause of iter-182 blank OG card**: `kolor-mark.png` is violet (108,46,218) on transparent BG; pasted on violet container → blank result.
- **OG card fix**: Pure PIL drawing — K mark drawn from SVG polygon/arc coordinates as WHITE on violet container. Uses `LiberationSans-Bold/Regular` (DejaVu unavailable in container). AI image-analysis verified all elements visible: K mark, KOLOR/STUDIO wordmark, "The studio behind your best work." tagline, sub line, 4 feature pills, kolorstudio.app URL. File 29.5 KB (efficient compression on flat-color regions).
- **site.webmanifest**: replaced single legacy entry with full icon set (16/32/192/512 + apple-touch-icon), correct `purpose` flags, brand `background_color: #080612` + `theme_color: #6C2EDB`.
- **index.html titles**: `<title>` + `og:title` + `twitter:title` → "KOLOR Studio — CRM for Photographers, Designers & Artists" (58 chars, OG-optimal, all 3 disciplines).
- Build gate: `npm run build` ✓ (6.51 s, no warnings). Commit `e3bb33a`.

### OG Card Final Layout (Feb 2026) — `c9b2118`
- Installed `fonts-dejavu-core` (apt) so the spec script ran verbatim with DejaVuSans-Bold/Regular.
- Mark recolor: load `kolor-mark.png`, take alpha channel only, composite as WHITE over violet — fixes the violet-on-violet blank issue without redrawing geometry.
- Layout: 1200×630, 8px left bar, 120×120 violet container at (48,48), KOLOR/STUDIO brand text right of logo, 72px headline at y=208/290, 32px sub-line at y=400, 4 feature pills at y=462, kolorstudio.app URL at y=540.
- File size **40.8 KB** (script's 80 KB floor was a proxy heuristic; PIL `optimize=True` legitimately compresses flat-color regions below it). AI image analysis confirmed all 6 elements render correctly with no corruption.

### Iteration 184 — Favicon Recolor + OG Validation Guard (Feb 2026) — `f5f0be8`
- **Favicons regenerated** (same root cause as OG card bug): mark PNG is violet on transparent; pasted on violet container without recolor → invisible K. Applied the alpha-channel→white-mark composite fix from iter-183 to all 6 sizes (16/32/180/192/512 + favicon-mark). White pixels verified at expected K-stroke coords (relative 0.32/0.35 mapping).
- **`scripts/validate-og.mjs`** (new): size-range check (20 KB–500 KB) always; with optional `sharp` dep, samples 6 content pixels and fails if any equals background color. Wired into `frontend/package.json` as `yarn validate:og`.
- index.html: confirmed iter-182 favicon links + iter-183 "Designers & Artists" title still in place (no changes needed).
- Build gate: `npm run build` ✓ (6.66 s, no warnings). Validation script runs clean.

### Iteration 185 — Landing Page Elevation + Brand Asset Script (Feb 2026) — `8f950c7`
- **Sticky FeatureRowsSection** (HoneyBook-style): mockup panel pinned via `position: sticky`; text column scrolls past with `IntersectionObserver` tracking the active row. Inactive rows fade to 32 % opacity + muted text. Progress dots animate width on active. Mockup crossfades + scales between features. Mouse parallax tilt (3°) on the sticky mockup. Mobile preserves the original stacked layout.
- **CSS additions** (`index.css`): `.lp-spotlight-text` (animated gradient sweep on headings), `.lp-beam-container` (decorative light beam on dark sections), `.lp-mockup-tilt` (perspective+transform-style utility), `.lp-feature-card` (hover lift+glow). All inside `prefers-reduced-motion: no-preference` with safe fallbacks.
- **Spotlight applied** to 3 simple-white H2s: SimpleFinalCTA, "Built for every stage of your studio.", "Stop losing clients to a slower reply." **Beam applied** to ProblemSection + UrgencySection.
- **`scripts/generate-brand-assets.py`** (new): single-command regen of og-card + 6 favicons, with white-mark alpha compositing and multi-point pixel sampling to verify the K is visible. `yarn brand:rebuild` runs it then `validate-og.mjs`. Threshold lowered to 10 KB to match efficient PNG compression on flat-color regions.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.43 s, no warnings).

### Iteration 186 — Sticky Feature Bug Fixes + Hero Tab Switcher (Feb 2026) — `4876ad7`
Five bugs from iter-185 fixed:
- **Bug 1 — Mockup container collapse**: sticky panel had no `minHeight`; mockups 2/3 (position:absolute children) clipped to zero. Added `minHeight: 300`.
- **Bug 2 — Observer never fires**: threshold `0.55` + `rootMargin -5%` was unreachable for 72vh-tall items. Simplified to `{ threshold: 0.25 }`.
- **Bug 3 — ArtistMockup progress bar**: previously used `bar.closest('[data-feature-row]')` (legacy attr). Replaced with a direct `IntersectionObserver` on the bar element itself — animates to 60 % on first intersection.
- **Bug 4 — Beam blocks clicks**: `lp-beam-container::after` had `z-index: 0`, blocking children (CTAs in UrgencySection). Set to `-1`.
- **Bug 5 — Spotlight inline color**: verified no conflicts (already removed inline `color:#ffffff` during iter-185 spotlight wiring).

Hero dashboard tab switcher:
- `activeTab` state (`'leads' | 'quotes' | 'contracts'`), violet underline indicator, `text-[#a78bfa]` active label.
- **Leads** (existing): 4-stat row + mini table (Jessica / Marcus / Anika).
- **Quotes** (new): Recent Quotes list (Chiara / James / Lena) — Accepted / Sent / Draft pills.
- **Contracts** (new): Commission Agreements (Chiara / Marcus / Anika) — Signed / Sent / Draft pills.
- "Good morning, Sarah" header lifted above the tab strip so context persists across tabs. `data-testid="hero-tab-{tab}"` on each button.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (7.16 s, no warnings).

### Iteration 188 — Landing Page Mobile Experience (Feb 2026) — `d4d0ad6`
- **Hamburger menu**: animated 3-bar → X icon (`md:hidden`), mobile drawer with Features/Pricing/Stories scroll links that close on tap. `data-testid`s: `nav-hamburger`, `nav-mobile-drawer`, `nav-mobile-{id}`.
- **Scroll reveal — iOS Safari fix**: switched from `threshold: 0.05` to `threshold: 0` + `rootMargin '0px 0px -30px 0px'`. Added on-mount synchronous reveal for elements already in viewport (via `getBoundingClientRect`), plus a 2 s timeout fallback that force-reveals everything to catch iOS edge cases where IO never fires.
- **Beam mobile cap**: `@media (max-width: 768px) { .lp-beam-container::after { width: 40%; opacity: 0.6 } }` (desktop value left at 50 %, intensified in `d42f484`).
- **Hero padding**: `clamp(60px,10vw,100px) 0 clamp(40px,6vw,80px)` — saves ~40 px on small screens.
- **Tab switcher touch targets**: `py-2.5 text-[11px]` for comfortable 44 px+ touch targets.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (7.19 s, no warnings).

### Iteration 189 — Swipe-to-Dismiss + Idle Reveal + Prebuild OG Guard (Feb 2026) — `016b332`
- **Swipe-to-dismiss**: mobile drawer accepts `pointerDown`/`pointerUp` events; horizontal swipe of 60 px+ closes the menu. Pure pointer events — works on iOS Safari, Android Chrome, and desktop mouse drag.
- **Idle reveal**: 2 s blunt `setTimeout` replaced with `requestIdleCallback({ timeout: 1500 })` that reveals only sections within `window.innerHeight + 100 px`. Falls back to `setTimeout 800 ms` on Safari (no `requestIdleCallback`). Result: ~100 ms reveal on Chrome/Firefox instead of always waiting 2 s.
- **Prebuild OG guard**: `npm run build` now runs `node ../scripts/validate-og.mjs` first via the `prebuild` hook. Confirmed: build log shows `> kolor-studio-frontend@1.0.0 prebuild` → `og-card.png size validation PASSED` → `> kolor-studio-frontend@1.0.0 build` chain. Broken OG cards can no longer ship undetected.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.95 s including prebuild).

### Iteration 190 — Mobile Polish (Feb 2026) — `b30ae5b`
- **HelpButton**: `bottom-6` → `bottom-20 right-4` on mobile to clear the 64 px bottom nav. `md:bottom-6 md:right-6` restores desktop placement. Size 12 → 11 for tighter mobile feel.
- **SettingsModal header**: `bg-gradient-to-r from-brand-primary` → `linear-gradient(135deg, #1A0A3C 0%, #2D1470 100%)`. Header now always uses KOLOR's dark brand, never the user's custom palette.
- **SettingsModal loading**: SpinnerGap → KolorSpinner size=32 (SpinnerGap import retained for the button-internal use at line 464).
- **LeadsListView truncation**: client-name wrapper gains `flex-1` (was only `min-w-0`); inner flex row containing name + stale badge gains `min-w-0`. Long names now truncate properly through both flex levels on narrow screens.
- **iOS Safari splash**: `inset: 0` → explicit `top/left/right/bottom`, plus `-webkit-flex` prefixes on `display/align/justify` across both the CSS rule and the inline splash markup. Renders correctly on older iOS Safari that misses `inset` shorthand.
- Fix 6 (auth lockout: clear `loginAttempts` + `lockedUntil` on successful password reset) was **already shipped in iter-160** (lines 694–695 of `auth.ts`). No backend changes required.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.71 s, prebuild validation passed).

### Iteration 191 — Leads Mobile Grid Fix + Help Button Modal Hiding (Feb 2026) — `c989204`
- **Root cause of "EOice" overlap**: `LeadRow` rendered **5 children** into a **3-column** CSS grid (`minmax(0,1fr) 80px 90px`), so the value + status cells wrapped onto a second visual line and stacked over the avatar/name on narrow viewports. The `hidden sm:block` masking was insufficient because the grid template itself still allocated tracks for the hidden cells.
- **Fix**: lead row + header grid → `minmax(0,1fr) auto` (2 tracks). Type, key date, and value cells (rows + headers) now have `hidden md:block`. Status badge column always visible — primary mobile info. Desktop layout unchanged.
- **HelpButton**: gained `hidden?: boolean` prop, returns `null` when `true`. Dashboard now passes `hidden={showSettings || !!selectedLead}` — the floating help button vanishes whenever Settings or Lead Detail modal is open, eliminating overlap with their sticky footers (Save Settings button, etc.). On desktop the FAB still appears whenever no modal is open.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (7.18 s, prebuild OG validation passed).

### Iteration 192 — Mobile FAB + Contract→BOOKED + Reset Cookie Clear (Feb 2026) — `5df83f9`
- **Mobile FAB on Dashboard**: floating action button group above bottom nav (`bottom-[72px] right-4 z-40 lg:hidden`) — primary "+ {lang.newLead}" violet button opens `AddLeadModal`; secondary "Share form" glass-purple button opens `ShareFormModal`. Visible only on kanban/list views. All testids: `mobile-fab-group`, `mobile-fab-share`, `mobile-fab-add-lead`.
- **Mobile toolbar Share Form**: icon button next to the filter funnel (`mobile-share-form-toolbar`), `md:hidden`, amber dot indicator. No longer buried inside the collapsible filter panel — single-tap access.
- **Contract → BOOKED (CRITICAL)**: `POST /api/contracts/:id/agree` was firing email side-effects in `setImmediate` but never flipping the lead status. Added side-effect #0 inside the same `setImmediate` block: `prisma.lead.update({ where: { id: contract.leadId }, data: { status: 'BOOKED' } })`. Wrapped in try/catch, logs `[CONTRACT] Lead status set to BOOKED`. Fixes silently broken pipeline post-signing.
- **Password reset cookie clear**: `POST /api/auth/reset-password` now calls `res.clearCookie('auth_token', { httpOnly, secure: NODE_ENV==='production', sameSite: 'lax', path: '/' })` before sending the success JSON. Mirrors the existing logout endpoint pattern. Eliminates the 401 redirect loop where the stale cookie (with the pre-reset `tokenVersion`) caused `authMiddleware` to bounce the user back to `/login` even with the correct new password.
- Build gate: `tsc --noEmit` ✓ (frontend + backend), `npm run build` ✓ (6.96 s, prebuild OG validation passed).
- **Requires Railway redeploy** (both `auth.ts` and `contracts.ts` changed). Trigger commit `9e01227` added a no-op comment to force redeploy.

### Iteration 193 — Branded Loading Screen + FAB Positioning Fixes (Feb 2026) — `4c19f67`
- **Loading screen** (`if (loading) {...}` early-return in Dashboard.tsx): replaced raw shimmer skeleton (header + 4 stat cards + Kanban) with `KolorLogo size="lg"` + `KolorSpinner size={36}` + "Loading your studio…" tag centred on `bg-surface-base`. Mirrors the `#root:empty` branded splash from iter-182, so cold-load and post-mount loading state share one visual language.
- **Mobile FAB** (positioning + tap interception):
  - `z-40` → `z-30` (still above content, now below modals)
  - `bottom-[72px]` → `bottom-[80px]` (clears the bottom nav properly)
  - Wrapper `pointer-events-none` + buttons `pointer-events-auto` so the FAB region doesn't block taps on content behind the buttons themselves
  - Share form pill: opaque-glass `rgba(255,255,255,0.92)` + `backdrop-blur(12px)` so it reads as floating, not colliding with content
  - Primary pill padding `4/3` → `5/3` for stronger thumb target; share pill height `44 px` → `40 px` to enforce visual hierarchy
- **Toolbar share button bg**: `bg-brand-primary/[0.08]` → inline `style={{ background: 'rgba(108,46,219,0.08)' }}` for cross-Tailwind-version safety. The bracket form was valid in Tailwind 3, but the inline style is bulletproof.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.59 s, prebuild OG validation passed).

### Iteration 194 — Settings Header + Loading + Help Z-Index + AddLeadModal Mobile (Feb 2026) — `8089a5c`
- **Loading screen simplified**: removed `KolorLogo` from the Dashboard `if (loading)` block. Now just `KolorSpinner size={40}` + "Loading your studio…" caption on `bg-surface-base`. Logo still appears in header + mobile nav. Cleaner cold-load feel.
- **SettingsModal "Settings" invisible on mobile (root cause)**: global design-system CSS applies `color: var(--text-primary)` to every `h2`, overriding the parent div's `text-white`. Fix: added `text-white` directly on the `<h2 id="settings-title">`. The "Settings" heading is now legible on the `#1A0A3C → #2D1470` gradient header.
- **HelpButton hidden condition extended**: was `showSettings || !!selectedLead`, now `showSettings || !!selectedLead || showAddModal || showShareModal || showFeedback`. The "?" FAB no longer collides with the Add Lead / Share Form / Feedback modal layers.
- **AddLeadModal mobile scroll (Safari fix)**: `flex flex-col` added to the modal wrapper; content area replaced `md:max-h-[70vh]` cap with `min-h-0`. The previous `flex-1` child inside an unconstrained-height flex parent broke `overflow-y-auto` on iOS Safari. Now scrolls smoothly with no cut-off.
- **AddLeadModal submit spinner**: `SpinnerGap` → `KolorSpinner size={16} color="white"`. `SpinnerGap` import removed (no remaining usage in this file).
- **LoadingScreen.tsx audited**: already uses KolorSpinner (iter-176 parallax-tilt variant). No change needed.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (6.81 s, prebuild OG validation passed).

### Iteration 195 — Help Button Left + SettingsModal Spinner + Passive Refresh (Feb 2026) — `01c933a`
- **HelpButton repositioned**: mobile `bottom-24 right-4` → `bottom-[82px] left-4` (right-4 was directly under the FAB → collision). Desktop unchanged via `lg:left-auto lg:right-6 lg:bottom-8`. Help button now sits bottom-LEFT on mobile, FAB sits bottom-RIGHT — both visible without overlap.
- **SettingsModal Save button**: `SpinnerGap` → `KolorSpinner size={16} color="white"`. `SpinnerGap` import removed (no remaining usage in this file).
- **Dashboard passive refresh**: `LeadDetailModal onClose` now calls `fetchLeads() + fetchStats()` after `setSelectedLead(null)`. Contract-signed → BOOKED status flips appear in the lead list and stat cards on modal close without the user needing F5.
- Build gate: `tsc --noEmit` ✓, `npm run build` ✓ (7.11 s, prebuild OG validation passed).
- **SpinnerGap migration deferred items** (loading states still using SpinnerGap, candidates for next sweep): `ClientPortalMessages:101`, `CalendarViewNew:320`, `CalendarConnectionWidget:126/172`, `QuoteBuilderModal:378/381/467/755`, `MarkAsDeliveredButton:64`, `TestimonialsManagement:115`. **Intentional (keep)**: `DeliverablesTab:61` (IN_PROGRESS status icon, not a loading state).

## Iteration 196 — Portal Polish + SpinnerGap Sweep + wasModified Ref (Feb 2026) — ✅ SHIPPED
- **ClientPortal**: Footer copy "{studioName} is here to help" → "Questions about your project?" (avoids rendering studio owner's name as support copy). Header h1 added `leading-tight` for mobile line height. Studio name opacity /80 → /90 for legibility. SpinnerGap → KolorSpinner in both "Processing..." and "Signing..." buttons. SpinnerGap import removed.
- **SpinnerGap → KolorSpinner sweep (7 files, 11 loading states)**: ClientPortalMessages, CalendarViewNew, CalendarConnectionWidget (×2), QuoteBuilderModal (×4), MarkAsDeliveredButton, TestimonialsManagement. All KolorSpinner imports added, SpinnerGap imports removed.
- **AddLeadModal**: Already correct from iter-194 (`flex flex-col` + `min-h-0` confirmed in place).
- **Dashboard wasModified ref**: `useRef` added to react import. `leadModalModified = useRef(false)` declared after `selectedLeadInitialTab`. LeadDetailModal `onUpdate` wired to set `leadModalModified.current = true`. `onClose` gates `fetchLeads()` + `fetchStats()` on the ref, then resets it. Eliminates redundant `/api/leads` + `/api/stats` calls on peek-and-close interactions.
- **Note**: Broader SpinnerGap migration still pending in ~30 other files (LeadDetailModal, EmailComposerModal, SchedulingSettings, PortfolioSettings, Quotes, Contracts, ResetPassword, ForgotPassword, Signup, Login, etc). Deferred to keep iter focused.
- Build: `npx tsc --noEmit` clean. `npm run build` clean (7.06s). Commit `d58f74d` (local, pending push via "Save to GitHub").

## Iteration 206 — Phase 4: Nav Simplification + Quote Builder Fixes + statusColors Utility (Feb 2026) — ✅ SHIPPED
- **MobileBottomNav rewritten**: 5 items → 3 items. **Today · Clients · Settings**. "Today" maps to `kanban` view (Phase 4 will swap in TodayScreen), "Clients" to `list` view. Quotes/Calendar removed (now accessible from lead Pipeline tab and Settings). Unused imports removed (`CalendarDots`, `Receipt`, `useNavigate`, `useLocation`).
- **Dashboard desktop sidebar Workspace**: 5 items → 3 items. **Today · Clients · Analytics**. Quotes/Contracts removed. Labels: Dashboard→Today, Leads→Clients.
- **QuoteBuilderModal fixes**:
  - `projectType` badge: `"SERVICE"` / `"BRAND_DESIGN"` → `"Service"` / `"Brand Design"` via `.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())`.
  - **Valid-until + key date locale fix**: native `<input type="date">` uses device locale (German iPhones showed `"28. Jun 2026"`). Replaced with formatted `<span>` (en-US locale, `"Jun 28, 2026"`) + transparent overlay input that still pops the OS date picker on tap. Calendar SVG icon added as visual hint.
  - **Mobile value bar status pill** refactored to use `getQuoteStatusPillStyle` — eliminated 3 nested ternaries.
- **NEW `utils/statusColors.ts`** (single source of truth):
  - `getQuoteStatusPillStyle(status)`: centralised pill styles for all 6 quote statuses (DRAFT/SENT/VIEWED/ACCEPTED/DECLINED/EXPIRED).
  - `getLeadStatusPillStyle(status)`: same for 8 lead statuses.
  - `PillStyle` interface exports `{ background, color, dotColor, label }`. Ready for future drop-in migration in QuotesTab and LeadCard.
- Build: frontend tsc + Vite build clean (7.17s). `Dashboard` bundle -1 KB. Commit `ecd87b8` (+117 / -80 across 4 files including new utility).


## Iteration 205 — QuoteBuilderModal Mobile Definitive Fix + Lead Header Date (Feb 2026) — ✅ SHIPPED
- **QuoteBuilderModal root cause**: iter-203's `style={{ minHeight: 0 }}` inline on the flex-col body combined with `overflow-hidden` on the modal wrapper caused iOS Safari to collapse the `flex-1` left column to zero height. The `flex-shrink-0` right sidebar remained visible, giving the appearance that only the value summary rendered. **Definitive fix**:
  - Body container: inline `style={{ minHeight: 0 }}` → Tailwind `min-h-0` class (same CSS, avoids specificity conflict).
  - Left column: added `min-h-0` so `flex-1` grows correctly within the `min-h-0` flex parent in Safari.
  - Right sidebar: `w-full md:w-[220px]` → `hidden md:flex md:flex-col md:w-[220px]`. **Sidebar is now desktop-only.** Header already has Save draft + Send Quote on mobile so no actions lost.
  - **Mobile value bar (new)**: compact total + project title + status pill (Draft/Sent/Viewed/Approved color-coded) added below the pipeline step bar on mobile via `md:hidden`. Users still see quote value without the sidebar.
- **LeadDetailModal `formatTimeAgo` fix**: combined date+time options in `toLocaleDateString` produced `"Apr 18 at 5:40 PM"` — the word "at" was forced by the Intl formatter, causing awkward wrapping on narrow screens. Split into separate `toLocaleDateString` (date only) + `toLocaleTimeString` (time only) joined with a comma → `"Apr 18, 5:40 PM"` on a single line.
- Build: frontend tsc + Vite build clean (7.29s). Commit `f79f31e` (+29 / -11 across 2 files).


## Iteration 204 — EmailComposer Title + Quote Builder Audit (Feb 2026) — ✅ SHIPPED
- **EmailComposer title** (line 101): `"Send Quotes"` / `"Send Contract"` → `"Send Quote"` / `"Send Agreement"`. The button label at line 241 was already correctly fixed in iter-203.
- **QuoteBuilderModal design audit — 4 gaps closed**:
  - **Gap 1 (Valid-until)**: Added `min={today}` to the valid-until date input. Prevents selecting past dates that would create already-expired quotes.
  - **Gap 2 (Key date editable)**: Key date cell in the client card is now an editable `<input type="date">` (`defaultValue={lead.keyDate || lead.eventDate}`). The fine-art conditional that hid the cell was removed — artists may want to set a date too.
  - **Gap 3 (Responsive line items grid)**: Grid columns `1fr 72px 72px 28px` → `1fr minmax(48px,64px) minmax(56px,80px) 28px`. Description column gets more breathing room on iPhone SE (320px) and small Android. Applied to both header and rows via `replace_all`.
  - **Gap 4 (Overflow blocking iOS input focus)**: Line items card `overflow-hidden` → `overflow: visible`. iOS Safari was preventing input focus when an ancestor had `overflow:hidden` during virtual-keyboard resize.
- **Sidebar send button spinner**: `KolorSpinner color` now adapts — `white` when sending a new quote (purple bg), `var(--text-secondary)` when sending a reminder on an already-sent quote (transparent bg).
- **Deferred to P2 post-launch** (require schema changes): deposit due date, payment schedule due dates, note field repositioning, discount field.
- Build: frontend tsc + Vite build clean (6.91s). Commit `dad92a8` (+21 / -14 across 2 files).


## Iteration 203 — Send Button Label + iOS Mobile Inputs + Pipeline Skeleton + Header Cleanup (Feb 2026) — ✅ SHIPPED
- **EmailComposer**: Send button label `"PaperPlaneTilt Quotes/Contract"` (icon component name accidentally rendered as text) → `"Send Quote/Agreement/Email"` based on type. Was visible to every user sending a contract.
- **QuoteBuilderModal iOS Safari fixes**:
  - Description/qty/price inputs: `touchAction: manipulation` (prevents iOS double-tap zoom), `minHeight: 36px` (proper touch target), `background: transparent` moved from Tailwind class to style prop, `WebkitUserSelect: text` on text input.
  - Modal body: `minHeight: 0` flex strategy replaces `overflow-hidden` — iOS Safari was clipping child `overflow-y-auto` scroll areas inside the modal.
  - Left column: `WebkitOverflowScrolling: touch` for momentum scrolling.
- **LeadDetailModal header cleanup**:
  - `modal-schedule-call` button REMOVED from header (discovery call accessible only from Overview tab checklist now — single location per redesign).
  - Discovery notes input lifted out of the removed button's inline tooltip into a standalone centered overlay modal (still triggered by `handleCompleteDiscoveryCall` from Overview tab).
  - Work type / Project type / Source: raw enum strings (`"SERVICE"`, `"BRAND_DESIGN"`) now display title-case (`"Service"`, `"Brand Design"`) in Project Details metadata rows. 5 occurrences fixed.
- **QuotesTab loading skeleton**: 2 shimmer card placeholders (`ks-shimmer`) replace bare `SpinnerGap` — Pipeline tab no longer appears frozen during Railway cold-start fetch.
- Build: frontend tsc + Vite build clean (6.69s). Commit `060a968` (+44 / -41 across 4 files).


## Iteration 202 — Fix: One-Tap Quote Bugs (Wrong Quote / Always Triggers) (Feb 2026) — ✅ SHIPPED
- **Bug 1**: action bar "Send Quote" sometimes opened a previously-viewed quote instead of a blank one. **Fix**: `autoOpenBuilder` useEffect in `QuotesTab` now explicitly calls `setEditingQuote(null)` before `setShowBuilder(true)`.
- **Bug 2**: QuoteBuilder fired on every Pipeline tab render (e.g. "New Contract" navigation also triggered the quote builder). Root cause: `key={openQuoteBuilder ? 'auto-open' : 'normal'}` was permanently stuck as `'auto-open'` because the boolean was never reset → every Pipeline render remounted `QuotesTab` and re-fired the effect. **Fix**:
  - Replaced boolean key with a `openQuoteBuilderKey` counter that increments only on explicit "Send Quote" tap.
  - Added `onBuilderOpened?: () => void` callback prop to `QuotesTab`; called immediately after `autoOpenBuilder` fires. Parent uses it to reset `openQuoteBuilder` to `false` so the next Pipeline render passes `autoOpenBuilder={false}`.
  - Net: one tap = one blank new quote builder, flag cleanly reset, stable key between taps means no accidental remounts.
- Build: frontend tsc clean. Vite build clean (7.19s). Commit `9c9be36` (+12 / -4 across 2 files).


## Iteration 201 — Phase 3: One-Tap Quote + GET /api/leads/:id/timeline + ClientTimeline (Feb 2026) — ✅ SHIPPED
- **One-tap quote from action bar**:
  - `QuotesTab` accepts `autoOpenBuilder?: boolean` prop. `useEffect` sets `showBuilder=true` when flag flips.
  - `LeadDetailModal` action bar `Send Quote` button: `setActiveTab('pipeline')` + `setOpenQuoteBuilder(true)`. `QuotesTab` receives the flag and opens the builder in a single render. `key` prop forces remount when flag flips, guaranteeing the effect fires even when Pipeline tab was already mounted.
- **Backend `GET /api/leads/:id/timeline`** (new endpoint, ~120 lines in `backend/src/routes/leads.ts`):
  - Parallel query: lead + quotes + contracts.
  - Assembles chronological `TimelineEvent[]` with `status: 'done' | 'active' | 'pending'`.
  - Events: inquiry / discovery scheduled / discovery completed / quote sent / quote accepted / contract sent / contract signed / delivered.
  - Computed pending "next step" appended via `STATUS_NEXT_STEPS` map keyed by `lead.status`.
  - Schema-aware fixes: `discoveryCallScheduled` is a `Boolean` (not Date) — uses `lead.createdAt` as placement date; `DELIVERED` is NOT an `ActivityType` enum value — delivery derives from `pipelineStatus === 'COMPLETED'`.
- **`ClientTimeline.tsx` (new, 138 lines)**:
  - Renders vertical event list from new endpoint.
  - Done = purple `#6C2EDB` filled check (with solid purple connector line); Active = amber `#f59e0b` clock; Pending = dashed border circle (opacity-50).
  - Inline action buttons styled by status (active = amber tint, default = purple tint).
  - Routes via `onTabChange` callback when `actionRoute` present.
  - `VITE_API_URL` / `REACT_APP_BACKEND_URL` env fallback chain for fetch base URL.
- **Feature flag**: Activity tab now shows a "Timeline view" toggle button. URL `?timeline=1` opens with the view enabled by default. Existing activity log preserved side-by-side.
- **Bundle**: `LeadDetailModal` 129 → 132 KB (+3 KB).
- Build: backend tsc clean. Frontend tsc + build clean (6.71s). Commit `8462d4c` (+372 / -8 with new ClientTimeline.tsx).
- ⚠️ **Backend changed → Railway redeploy required** after push.


## Iteration 200 — Redesign Phase 2: Overview Reorder + Sticky Notes + Action Bar (Feb 2026) — ✅ SHIPPED
- **Overview tab split panel**: timeline (right panel) renders **first on mobile** (`order-1 md:order-2`), fields render below (`order-2 md:order-1`). Right panel gets `md:border-l` for vertical-stack visual separation. Solves "scroll past all editable fields to reach activity context" mobile UX bug.
- **Right panel polish**: Heading renamed `Timeline` → `Recent` (no conflict with removed Timeline tab). Item cap reduced 15 → 8. Added always-visible key facts row at top: `StatusBadge` + estimated value pill with `currencySymbol`.
- **Files & Notes — sticky note input on mobile**: Previous notes moved above textarea inside the scrollable area (so old notes don't get hidden by sticky bar). Textarea + Save button extracted into a sibling block with `sticky bottom-0 md:relative`, frosted glass background (`var(--surface-base)` + `backdrop-blur 12px`), top border. `pb-36 md:pb-6` on file content prevents last row hiding behind sticky bar. Fragment-wrapped Files tab to allow two siblings inside the conditional.
- **Three-button action bar**: persistent across ALL tabs, rendered between tab nav and content area. Buttons (each 32px, `active:scale-95` tap feedback, full-bleed):
  - **Send {lang.quote}** (primary, purple) — switches to Pipeline tab where `QuotesTab` handles the actual builder.
  - **Upload file** — switches to Files & Notes tab.
  - **Message** — switches to Messages tab.
  Eliminates header-button hunt; single consistent action surface.
- Step 5 in spec (remove header send-offer-btn / schedule-discovery-header-btn) was a no-op — those buttons no longer exist in the current header.
- **Bundle impact**: `LeadDetailModal` 127 → 129 KB (+2 KB / +1.6%) — net growth from new action bar JSX, worth the UX simplification.
- Build: frontend tsc clean. Vite build clean (6.92s). Commit `7de5ced` (+88 / -30 net add).


## Iteration 199 — Redesign Phase 1: Tab Reduction + Dashboard Simplification (Feb 2026) — ✅ SHIPPED
- **LeadDetailModal: 8 tabs → 5 tabs**. New layout: **Overview · Pipeline · Files & Notes · Messages · Activity**.
  - **Pipeline tab** merges Quotes + Contracts into one unified commercial view with section headers (`lang.quotes` / `lang.contracts`). No tab-switching between offer and agreement stages.
  - **Files & Notes tab** appends notes textarea + history below file list. One scroll surface, no switching between Files/Notes/Deliverables.
  - **Timeline tab REMOVED** (zero users need project milestones in a CRM for solo creatives).
  - **Deliverables tab REMOVED** — `MarkAsDeliveredButton` already lives at top of Files tab; the dedicated tab was redundant.
  - **Notes tab block** removed (unreachable after tab array reduction).
  - Dead imports removed (`ProjectTimeline`, `DeliverablesTab`).
  - `activeTab` union type narrowed to 5 valid values; `initialTab` map handles legacy `'quotes'/'contracts'/'notes'/'timeline'/'deliverables'` deep-links by routing to the appropriate new tab.
  - `getPrimaryActionTab` now returns `'pipeline'` (was conditional `'quotes'/'contracts'`).
- **Dashboard simplification**:
  - **4 stat cards → 2**: "Active leads" (Total − Booked − Lost) + "Booked". Removed Total and Quoted breakdowns — solo creatives need to know "how many am I working with" and "how many confirmed", not conversion math.
  - **QuickActions widget removed** (desktop sidebar + mobile stack). FAB on mobile and lead list on desktop already cover all the actions.
  - **Recent Activity feed removed** (desktop + mobile). Duplicated the activity tab inside each lead; an empty feed was worse than no feed.
  - **Calendar Connection widget removed** from sidebar — moves to Settings in Phase 4.
  - **Mobile-only section** now shows only `OnboardingChecklist`.
  - Dead imports removed (`CalendarConnectionWidget`, `ActivityFeed`, `QuickActions`).
- **Bundle impact**: `LeadDetailModal` 139 KB → 127 KB (-12 KB / -8.6%). `Dashboard` 437 KB → 408 KB (-29 KB / -6.6%). Total **~41 KB raw / ~13 KB gzipped** off primary work surfaces.
- Build: backend untouched. Frontend tsc clean. Vite build clean (6.49s). Commit `bb9d9ba` (+80 / -173 net deletion).
- **Phase 2+ deferred**: Today screen (`GET /api/today`), vertical timeline client view, nav simplification (Today/Clients/Settings), Calendar as Settings integration, 3-button action bar.


## Iteration 198 — Activity Tab Cleanup + Deliverables i18n + Quote Builder Mobile + Contract Titles + Portal + Parallel Scheduler (Feb 2026) — ✅ SHIPPED
- **LeadDetailModal Activity tab**: removed duplicate "Discovery Call Card" (3 states) and "Add Note" block — both already exist in the action row and Notes tab respectively. Activity timeline log only. Fixed stray "ClockCounterClockwise" word in heading. SpinnerGap → KolorSpinner in all 6 remaining loading states; SpinnerGap import removed.
- **DeliverablesTab**: interface accepts `userIndustry?: IndustryType`. Imports `getIndustryLanguage` and derives `lang` for industry-aware copy. LeadDetailModal passes `userIndustry={userIndustry}` when rendering.
- **QuoteBuilderModal mobile header**: two-row layout (title+close above, Save+Send `flex-1` full-width buttons below on mobile). Eliminates "New Q..." truncation on iPhone 375px.
- **ClientPortal**: h1 + "Project Portal" label now `relative z-10` to render above gradient overlay. Header + footer logo: 8-segment KOLOR pinwheel SVG replaces letter-initial fallback; `brandLogoUrl` still preferred when studio has set a custom logo.
- **contracts.ts SERVICE_TITLES**: extended with 17 `projectType` enum values (COMMISSION → "Art Commission Agreement", WEDDING → "Wedding Photography Agreement", MURAL/SCULPTURE/MIXED_MEDIA for fine art, etc.). Lookup order: `title → SERVICE_TITLES[serviceType] → SERVICE_TITLES[projectType] → template.title`. Fine Art commissions now titled correctly.
- **scheduler.ts**: daily 9am job parallelised with `Promise.allSettled` — six jobs (stale leads, quote viewed, contract unsigned warning + final warning, payment nudges, quote expiry) run concurrently. Per-job rejection logged; success count summary printed.
- **Diagnostic (no patch)**: Files API already sends `credentials: 'include'` via central `request()` helper (`api.ts:52`) — no patch needed. Resend `SENDER_EMAIL` defaults to `onboarding@resend.dev` sandbox; production must verify a domain.
- Build: backend tsc clean. Frontend tsc + build clean (7.38s). LeadDetailModal bundle -4.5 KB. Commit `e2a09fc` (+105 / -147 net code reduction).


## Iteration 228b — Notification hooks + DM names + Discover message btn (Feb 2026) — ✅ SHIPPED
- `community.ts`: Added `createNotification()` helper (non-blocking, self-notify guard) — hooked into 4 actions:
  - Like → POST_LIKED to post author
  - Comment → POST_COMMENTED to post author
  - DM message → DM_RECEIVED to other participant
  - Follow → NEW_FOLLOWER to followed profile
  - **Bell is now functional** (was decorative in 228)
- `community.ts` `/dms` query: includes `partA`/`partB` with first/last names (reused existing schema relations — no schema change required)
- `DMView.tsx`: thread list resolves other participant name + initials avatar instead of "Conversation" placeholder
- `CommunityDiscover.tsx`: added `onStartDM` prop + DM button per profile card
- `Dashboard.tsx`: wires `onStartDM` to switch to Messages sub-tab
- Build gates: backend `tsc --noEmit` 0 errors · frontend `tsc --noEmit` 0 errors · `vite build` ✅ (~7s)
- Local commit: `2a5aefc` — needs Save-to-GitHub push + Railway redeploy

## Iteration 228 — Community UI (Feed · DMs · Discover · Notifications) (Feb 2026) — ✅ SHIPPED
- Backend: `backend/src/routes/community.ts` — 17 REST endpoints mounted at `/api/community`
  - Feed (`/feed`, `/trending`), posts CRUD + like + comments, profile (`/profile/me`, `/profile`), discover, DMs (threads + messages + read receipts), follows, notifications, reports
  - Auto-creates `CommunityProfile` on first interaction
- Frontend components (5 new + 1 inline):
  - `CommunityFeed.tsx` — trending rail (smart enhancement: top-3 most-liked past 7 days), industry filter, compose with milestone keyword detection prompt, paginated post list
  - `PostCard.tsx` — like/comment/edit/delete/report, industry color border, optimistic like toggle, server-enforced 24h edit window
  - `CommentThread.tsx` — expandable below PostCard
  - `DMView.tsx` — thread list + conversation, 10s polling, mobile-first split layout with back button, read receipts
  - `CommunityDiscover.tsx` — 24-card grid, follow toggle, availability pill, industry filter
  - `CommunityProfileSettings` (inline in SettingsModal) — opt-in toggle, bio (150), city, availability
- Navigation:
  - MobileBottomNav: Portfolio tab → **Community tab** (Users icon)
  - Dashboard ViewMode: `community` added + sub-tabs (Feed / Discover / Messages)
  - Dashboard sidebar: Community nav item under Account
  - SettingsModal: Community tab
  - Header notification bell (60s polling, amber dot when unread > 0)
- Build gates: backend `tsc --noEmit` 0 errors · frontend `tsc --noEmit` 0 errors · `vite build` ✅
- Local commit: `2c6b1c4` — needs Save-to-GitHub push + Railway redeploy
- Backlog: Notification creation hooks (currently only consumed, not created — needs hooks on like/comment/DM/follow events)

## Iteration 227b — Synthetic community seed (Feb 2026) — ✅ SHIPPED
- `backend/scripts/seed-community.ts` — idempotent upsert seed
- 40 synthetic profiles across 3 industries & 12 cities (Lagos, Nairobi, Accra, Joburg, London, Berlin, São Paulo, Cape Town, Kampala, Paris, Dubai, Cairo, Lisbon, Toronto, Amsterdam)
- Live counts: 459 posts · 4166 likes · 798 comments · 335 follows
- All records flagged `isSynthetic=true` — excluded from analytics/emails/notifications
- Command: `npm run seed:community` (from backend/)
- Commit: d5648ad (local; needs Save to GitHub push)
- Next: iter-228 community UI (Feed, PostCard, CommentThread, DMView, Discover)

## Iteration 227a — Community schema silent infrastructure migration (Feb 2026) — ✅ SHIPPED
- Eight additive Prisma models: CommunityProfile, Post, Comment, PostLike, DMThread, DMMessage, Follow, Notification
- Two new enums: Availability (OPEN/BOOKED/UNAVAILABLE), NotificationType (4 values)
- User.communityProfile relation added (1:1, optional)
- Applied via `prisma db push` + `migrate resolve` (shadow DB drift pattern)
- Prisma client regenerated with 921 community references
- Zero UI, zero changes to existing tables, zero new TS errors
- All 8 tables verified queryable against live Supabase
- Migration file: backend/prisma/migrations/20260607000000_add_community_schema/
- Commit: 2d1663f (local). User must push via "Save to GitHub" and redeploy Railway.
- Next: iter-227b synthetic seed (40 users, 400+ posts) → iter-228 community UI

## Iteration 226 — Onboarding flow + waitlist counter (Feb 2026) — ✅ SHIPPED

**`OnboardingFlow.tsx` (new, 4-step modal)** replacing `AHAModal` as the first-login experience:
- **Step 1 — Welcome / Industry**: auto-skipped if the user already has `primaryIndustry`. Three equal options (Photography / Design / Fine Art) with one-line descs. Selection saves via the existing `authApi.onboarding(value)` (non-blocking try/catch).
- **Step 2 — First client**: name (required) + email (optional). On save creates a real `Lead` via `leadsApi.create` with `serviceType: OTHER`, placeholder description, and the chosen industry. Email defaults to `unknown@placeholder.local` if left blank so it satisfies the required-field schema; user can edit later. Skip button advances to step 3 without creating anything.
- **Step 3 — Sample offer**: existing aha moment via `authApi.sendSampleQuote` — sends to the user's own email. Success state shows the recipient inbox confirmation + a "Preview the [quote]" link to the public quote URL. Error state offers retry / skip.
- **Step 4 — Done**: "Your studio is ready" with a "Go to my studio" CTA. Sets `kolor_aha_completed` in localStorage on dismiss/finish (same flag the dashboard already checks).
- 4-pill progress bar at the top expands as steps complete. Industry-aware copy throughout via `getIndustryLanguage` (`lang.client`, `lang.quote`).

**`Dashboard.tsx`** wiring:
- `OnboardingFlow` replaces `AHAModal` at the `showAHAModal` render site; `AHAModal` import removed.
- `showAHAModal` state + all existing guards (tour, wizard, leads count) unchanged — non-breaking swap.
- `OnboardingWizard` render gated on `!showAHAModal` so the two flows can't overlap on first login.

**Waitlist counter (landing page)**:
- New `waitlistCount` state in `LandingPageV2.tsx`. Fetches `GET /api/waitlist/count` on mount (uses `VITE_API_URL`). Counter renders next to the founding-member badge as "X creatives already waiting" — singular form for 1, hidden when 0.
- New `GET /api/waitlist/count` endpoint in `backend/src/routes/waitlist.ts` — public (no auth), returns `{ count }` via `prisma.waitlistEntry.count()`, falls back to 0 on error.

Build gates: backend + frontend `tsc --noEmit` clean (4 GB heap), `npm run build` clean (6.3 s). Commit `6104bb6` (local — `git push` needs Emmanuel's auth). **Railway redeploy required** (new GET route).



## Iteration 225 — Landing page rebuild: The Studio Wall + conversion layer (Feb 2026) — ✅ SHIPPED

**Full rewrite of `frontend/src/pages/LandingPageV2.tsx`** (2407 → 850 lines net).

**Copy**:
- Hero: "Your talent is exceptional. Your admin is losing you money." (italic Fraunces, line-mask reveal, final line in outline → solid letter-spacing compress).
- Sub paragraph leads with the international differentiator, not the feature list.
- Loss section header: "costing you clients" (was "costs you jobs"); Berlin loss card uses €4,000 (was £); body rewritten US-centric → felt.
- Industries: "Photography. Design. Fine Art. Built for all three — not bolted on." Fine Art pill changed from "Blue ocean" to "No one else built this for you".
- Flow header: "From their first message to your final payment."
- Pricing: removed self-undermining future-pricing hint; founding-member count cut from **20 → 10 studios**.
- Global: "Built where most CRMs don't go."
- Close: three parallel "deserves a contract / a portal / to get paid" statements building to the CTA.
- All CTAs standardised to "Claim your studio".

**Motion**:
- Three easing tokens (`--ease-out` Expo, `--ease-settle`, `--ease-spring`) on `:root`.
- Hero: line-mask reveal (`overflow:hidden` containers, `translateY` only — no layout reflow); final "losing you money" line transitions both `transform` and `letter-spacing` (0.5em → -0.035em) and color (outline → solid) over 1s with `ease-settle`.
- Scroll: `requestAnimationFrame` lerp loop drives both the page background tint and the ghost-K rotation (0 → 3° over one viewport).
- Timeline mock: `scaleY(0→1)` connectors from `transform-origin: top` (correct technique, replaces the `max-height` hack). Per-event sequence: dot → label (+60ms) → connector (+160ms) → next dot.
- Industry panels: spring hover lift (`translateY(-2px)` with `--ease-spring`).
- CTA buttons: magnetic pull on `mousemove` (5px max displacement), 4 separate refs (`btn1..btn4`) to avoid the duplicate-ref TypeScript hazard. Returns to origin with `transition: transform 0.5s var(--ease-out)`.
- `prefers-reduced-motion` respected.

**Conversion additions (Studio Wall extension)**:
- Eylem Yentur testimonial slotted between industries and flow sections — italic Fraunces blockquote, DM Mono attribution (Designer · Berlin, Germany).
- Quote builder mockup as a second product surface alongside the timeline card — Naira line items, 10% discount in green, Send Offer button. Two-column grid (`.lp-mock-grid`) collapses to single column at ≤960 px.
- Email capture below the pricing CTA — single field, no name. `POST /api/waitlist` with success-state replacement copy. Uses `VITE_API_URL` for the API host.

**Backend (waitlist)**:
- New `backend/src/routes/waitlist.ts`: `POST /api/waitlist` validates email, upserts into `WaitlistEntry` via `executeRawUnsafe` ON CONFLICT DO NOTHING, fires non-blocking Resend confirmation (`SENDER_EMAIL` env honoured).
- New Prisma model `WaitlistEntry` (`id`, `email @unique`, `createdAt`) + migration `20260606000000_add_waitlist_entry` (db push + `migrate resolve --applied`).
- `server.ts`: route imported + mounted at `/api/waitlist`.

**Fonts**: Fraunces + DM Mono + DM Sans preconnected in `frontend/index.html`.

Build gates: backend + frontend `tsc --noEmit` clean (4 GB heap); `npm run build` clean (6.7 s). Commit `e0f57d6` (local — `git push` needs Emmanuel's auth). **Railway redeploy required** (waitlist route + schema). Vercel picks up frontend.



## Iteration 224 — Quote draft loading · Contract scroll · Discount in email (Feb 2026) — ✅ SHIPPED
- **`LeadDetailModal.tsx`**: new `timelineQuote` state + `fetchDraftQuote` helper. Send Offer in timeline mode now hits `/api/pipeline/:leadId`, finds the most recent `DRAFT` quote and passes it as `existingQuote` to `QuoteBuilderModalRoot` — no more lost-draft surprises. State resets on close/save/send. Added `scrollToContracts` state; Pipeline tab `Agreements` `<div>` now has a ref callback that calls `scrollIntoView({behavior:'smooth'})` once after mount and resets the flag.
- **`LeadTimelineView.tsx`**: `onTabChange` prop signature widened to `(tab, section?)`. Contract events (`CONTRACT_SENT`, `CONTRACT_VIEWED`, `CONTRACT_SIGNED`) pass `section="contracts"` so the parent knows to scroll to the agreements section on tab switch.
- **`email.ts` `sendQuoteEmail`**: `QuoteEmailData` extended with `discountPercent?` + `discountAmount?`. The Investment highlight box now renders a green `✓ Includes X% discount (-$Y.YY)` sub-line when `discountPercent > 0`. Currency-symbol position is honoured.
- **`quotes.ts` send route**: passes `discountPercent` + `discountAmount` from the DB row into the email payload.
- Build gates: backend + frontend `tsc --noEmit` + frontend `npm run build` all clean. Commit `68035a5` (local — `git push` needs Emmanuel's auth). **Railway redeploy required** (backend/email + quotes route changed).



## Iteration 223 — Discount persistence + Colour system refinement (Feb 2026) — ✅ SHIPPED

**Discount persistence (full stack)**:
- `schema.prisma`: added `discountPercent Float @default(0)` + `discountAmount Float @default(0)` to Quote model.
- Migration `20260605000000_add_quote_discount` applied via `prisma db push` (shadow DB blocked by historical drift; pattern matches Iter 151/152). Verified columns exist on Supabase via `information_schema.columns`.
- `quotes.ts` `calculateTotals` now takes `discountPercentage`: computes `discountAmount`, taxes the discounted subtotal, totals = subtotal − discount + tax (correct financial order). Create + update endpoints destructure `discountPercent` from body, persist `discountPercent` + `discountAmount`. Update branch handles tax-only / discount-only / line-items-changed.
- `api.ts`: `CreateQuoteData.discountPercent?: number`; `Quote` type gains `discountPercent?` + `discountAmount?`.
- `QuoteBuilderModal.tsx`: `discount` state hydrates from `existingQuote?.discountPercent ?? 0`; both `handleSave` and `handleSend` payloads include `discountPercent: discount`.
- `PublicQuote.tsx`: discount row renders between Subtotal and Tax (`Discount (X%)` label + green `-$X.XX`) when `discountPercent > 0`.

**Colour system refinement (3 moves)**:
- Surface hierarchy: `--surface-background` `#F4F1FA → #F0EDF8` (deeper purple tint). Cards on `#FDFCFF` now visibly separate from page. Body `background-color` synced. Tailwind `surface.background` + `surface.page` also `#F0EDF8`.
- Tonal primary range: added `--brand-pressed #4A1FA0`, `--brand-hover #9B6AEF`, `--brand-subtle #C4AAFA`, `--brand-fill #EDE9FE` (mirrors KOLOR mark's 3-stop range). Exposed as `brand.hover/pressed/subtle/fill` in Tailwind.
- Two-amber semantic system: `--amber-financial #E8891A / -bg #FFF6E8` (money) vs `--amber-urgency #F59E0B / -bg #FEF3C7` (time pressure). Tailwind `amber.{financial,financialBg,urgency,urgencyBg}`. `TodayScreen` warning tier updated to urgency amber (`#F59E0B` border, `#92400E` meta).

Build gates: `npx tsc --noEmit` (backend + frontend, with `NODE_OPTIONS=--max-old-space-size=4096`) + `npm run build` all clean. Commit `1aa9a24` (local — `git push` needs Emmanuel's auth).

**Railway redeploy required** for `schema.prisma` + `quotes.ts` changes.



## Iteration 222 — Tab chrome suppression · Note reposition · Discount field (Feb 2026) — ✅ SHIPPED
- **`LeadDetailModal.tsx`**: new `arrivedFromTimeline` `useState(false)` (state, not ref — needs re-render). Set true when Upload/Message is tapped from timeline mode; cleared when the `← Timeline` back link is tapped. Tab bar and header primary action button now gated on `!showTimelineView && !arrivedFromTimeline`, so the Files & Notes / Messages surface arrives via a clean back-link-only chrome when reached from the timeline.
- **`QuoteBuilderModal.tsx`**: (1) `Note to client` card moved to render AFTER the Totals card — secondary info now follows the financial summary. (2) Discount field becomes functional: `useState(0)`, inline % input matching the Tax pattern, clamped 0–100, shows `-$X.XX` in green when set / `—` when zero. Computation: `discountAmount = subtotal * discount/100`; tax now applies to `(subtotal - discountAmount)`; `total = subtotal - discountAmount + taxAmount`.
- Build gates: `npx tsc --noEmit` + `npm run build` both clean. Commit `0bb0184` (local — `git push` needs Emmanuel's auth).



## Iteration 221 — Send Offer works in timeline mode (Feb 2026) — ✅ SHIPPED
- **Root cause**: `QuoteBuilderModal` lives inside `QuotesTab` which only mounts when the Pipeline tab is rendered. In timeline mode (`showTimelineView=true`) the Pipeline tab never mounts, so `setOpenQuoteBuilder(true)` had nothing to trigger.
- **`LeadDetailModal.tsx`**: added a root-level lazy import `QuoteBuilderModalRoot = lazy(() => import('./QuoteBuilderModal'))`, plus a sibling `Suspense`-wrapped render at the modal's bottom that fires only when `showTimelineView && openQuoteBuilder`. Send Offer action-bar handler now skips `setActiveTab('pipeline')` in timeline mode and just sets `openQuoteBuilder=true`. Existing `QuoteBuilderModal` inside `QuotesTab` untouched for classic-tab mode.
- Build gates: `npx tsc --noEmit` + `npm run build` both clean. Commit `299f881` (local — `git push` needs Emmanuel's auth).



## Iteration 220 — Timeline polish: header btn + back nav + truncation (Feb 2026) — ✅ SHIPPED
- **`LeadDetailModal.tsx`**: (1) header primary action button (View Commission Agreement / Send quote) wrapped in `!showTimelineView &&` — hidden in timeline mode so the timeline stage cards are the canonical action surface. (2) Action-bar Upload + Message buttons now call `setShowTimelineView(false)` before switching tabs so the tab bar becomes visible. (3) Files & Notes and Messages tabs gained a `← Timeline` back link at the top (rendered only when `showTimelineView === false`) so the user can return to the timeline without closing the modal.
- **`LeadTimelineView.tsx`**: event label `<p>` now carries `truncate` (parent flex container already had `min-w-0`). Long quote numbers like `#SAMPLE-MO4I82K8` truncate with ellipsis on narrow viewports.
- Build gates: `npx tsc --noEmit` + `npm run build` both clean. Commit `591858c` (local — `git push` needs Emmanuel's auth).



## Iteration 219 (retry) — Additive timeline view alongside existing tabs (Feb 2026) — ✅ SHIPPED
- **`LeadTimelineView.tsx` (new)**: Consumes the existing `GET /api/leads/:id/timeline` endpoint's `{ events: TimelineEvent[] }` shape directly. Three visual states (done = purple check, active = amber clock, pending = dashed circle 50% opacity) with a vertical connector line between events. Action buttons (e.g. "Follow up") call `onTabChange` to jump to the relevant classic tab. Persistent note input at bottom — Enter submits via `leadsApi.addNote`. Loading, error and empty states each rendered explicitly so a fetch failure never blanks the modal.
- **`LeadDetailModal.tsx` (additive, zero removals)**: `showTimelineView` default flipped to `true`. Content wrapper now branches: `showTimelineView ? <LeadTimelineView /> : <existing 4-tab structure>`. The Overview / Pipeline / Files & Notes / Messages tab tree is left fully intact as the else branch. Action buttons in the timeline call `onTabChange(route)` which sets `showTimelineView=false`, mounts the target tab via `setMountedTabs`, and switches `activeTab` — instant fallback to classic tabs at any time.
- **Rollback path**: change `useState(true)` to `useState(false)` on the showTimelineView state to revert to classic tabs without removing any code.
- Build gates: `npx tsc --noEmit` clean (frontend + backend), `npm run build` clean. Commit `b92a072` (local — `git push origin main` requires Emmanuel's auth from chat input).



## Iteration 219 — Timeline transition: backend event feed + LeadDetailModal → LeadTimelineView (Feb 2026) — ✅ SHIPPED
- **Backend `GET /api/leads/:id/timeline`** (`backend/src/routes/leads.ts`): Single parallel Prisma query (quotes + contracts + activities) returns typed stage array — Inquiry → Offer → Agreement → Deposit → Delivery → Final payment → Complete. Per-stage status computed: done/active/warning/upcoming. Detects deposit overdue, contract unsigned-but-sent. Uses correct schema fields (`depositPaidAt`, `finalPaidAt`).
- **`LeadTimelineView.tsx` (new)**: Single scrollable stage list replacing the 4-tab modal body. Three visual tiers: green-check done (strikethrough), amber warning, purple active dot, muted dashed upcoming (55% opacity). Active + warning stages expand by default; expandable cards show offer total/status/valid-until, contract reminder button, deposit amount + payment link, final payment amount. Persistent note input at bottom (Enter to submit).
- **`LeadDetailModal.tsx`**: 4-tab bar (Overview · Pipeline · Files & Notes · Messages) and ~1000 lines of conditional tab body REMOVED. `activeTab`, `mountedTabs`, `getPrimaryActionTab` state/helpers deleted. Action bar buttons rewired: Send Offer → `QuoteBuilderModal` mounted directly; Upload → triggers `fileInputRef`; Message → opens `EmailComposerModal`. Header primary action button also opens QuoteBuilder directly.
- **Bundle impact**: LeadDetailModal bundle dropped to ~25 KB (was ~80 KB).
- Build gates: `npx tsc --noEmit` clean on backend + frontend; `npm run build` clean. Commit `7206813` (local — Railway push pending Emmanuel's `git push`).



## Iteration 218 — CRITICAL routing fix · Pipeline single endpoint · Railway keep-alive interval (Feb 2026) — ✅ SHIPPED
- **CRITICAL routing fix**: App.tsx maps `/` → `LandingPageV2` (public) and `/dashboard` → `Dashboard` (authenticated). Every `navigate('/')` in the authenticated codebase was routing users to the public landing page.
  - `Calendar` back button → `navigate('/dashboard')`.
  - `useOpenLead` hook: `isDashboard` check + URL-param navigation target updated to `/dashboard`.
  - `Dashboard` `replaceState` target hardcoded to `'/dashboard'` (was `window.location.pathname` which retained accidental subpaths).
  - `PublicQuote` + `NotFound` still navigate to `/` — those are public exits, correct.
- **NEW `GET /api/pipeline/:leadId`** (`backend/src/routes/pipeline.ts`): single authenticated endpoint returning `{ quotes (with embedded incomeRecords), contracts, userSettings, leadId }` via `Promise.all`. Replaces 3-5 separate API calls per Pipeline tab open. Eliminates N+1 `paymentsApi.getByQuote` lookups by inlining `incomeRecords` (id/amount/status/depositAmount/depositPaid/depositPaidAt/finalAmount/finalPaid/finalPaidAt/receivedDate/expectedDate). Registered as `app.use('/api/pipeline', pipelineRoutes)`.
- **`QuotesTab.fetchQuotes`** rewritten to call the pipeline endpoint and build `incomeMap` from embedded data. Falls back to `quotesApi.getByLead` on error.
- **App.tsx keep-alive ping**: was once-on-mount; now `setInterval(ping, 4 * 60 * 1000)`. Railway spins down at ~5min idle — 4min interval keeps the backend warm for active users, eliminating cold-start delays after tab inactivity.
- Build: backend `tsc --noEmit` clean. Frontend `tsc --noEmit` + `npm run build` clean (8.42s). Commit `996c0a4` (local, pending push via "Save to GitHub").


## Iteration 217 — Send Offer auto-open · Pipeline lazy mount on quick action · Calendar URL param (Feb 2026) — ✅ SHIPPED
- **`LeadDetailModal` mount-time `initialTab` reaction**: new useEffect that fires when the modal opens. If `initialTab === 'quotes'`, it pre-mounts the `pipeline` tab AND sets `openQuoteBuilder=true` (`openQuoteBuilderKey` bumped). If `initialTab === 'contracts' | 'pipeline'`, it pre-mounts the pipeline tab so `QuotesTab` + `ContractsTab` render. Fixes empty-tab UX when arriving from the "Send Offer" / "Review Contract" quick actions — the lazy-mount gate introduced in iter-208 was preventing render until the user manually tapped the tab.
- **`useOpenLead` URL-param fallback**: cross-route opens now navigate to `/?openLead=<id>(&openLeadTab=<tab>)` instead of plain `/`. Mobile Safari occasionally triggers a full-page reload on navigation, which destroys the in-memory CustomEvent listener; the URL param survives the reload. CustomEvent is still dispatched 400 ms later as the SPA-fast path. Same-route opens stay event-only (no URL noise).
- **Dashboard `?openLead=` reader**: new useEffect on mount reads the URL param, opens the lead via cache → `leadsApi.getOne` → 1s retry, and clears the param via `history.replaceState` without re-navigating. The existing CustomEvent listener stays as the SPA path.
- Build: frontend `tsc --noEmit` + `npm run build` clean (6.91s). Commit `ea5cffd` (local, pending push via "Save to GitHub").


## Iteration 216 — Lead list layout fix · Calendar View Lead timing (Feb 2026) — ✅ SHIPPED
- **LeadsListView quick action labels shortened**: `Send Commission Agreement` / `View Commission Agreement` were collapsing the lead row's text container to near-zero width on mobile (pushed flex beyond viewport). New mapping:
  - NEW / REVIEWING / CONTACTED / QUALIFIED → `` `Send ${lang.quote}` `` (kept — quote labels are short)
  - QUOTED / NEGOTIATING → `'Send'` (was the long contract label)
  - BOOKED → `'View'`
  Full industry-aware labels remain in the lead modal header where space exists.
- **Primary action button safety net**: `max-w-[120px] truncate` added to prevent any future label from re-introducing the row collapse.
- **`useOpenLead` delay**: 150ms → 400ms. The shorter delay wasn't enough when Railway backend is cold-starting and Dashboard's leads fetch hasn't resolved by the time `kolor:openLead` fires.
- **Dashboard `kolor:openLead` listener** rewritten:
  - Tries cached `leads.find()` first.
  - Falls through to direct `leadsApi.getOne(leadId)` fetch when cache misses (handles still-loading cold-start case).
  - 1s retry fallback after fetch failure catches the rare slow Railway response.
  - Reads optional `tab` from event detail so future callers (digest links, CRM Alerts, etc.) can target a specific tab on open.
- Build: frontend `tsc --noEmit` + `npm run build` clean (6.60s). Commit `2be8f12` (local, pending push via "Save to GitHub").


## Iteration 215 — View signed in list · Quick action tab · Archive native confirm (Feb 2026) — ✅ SHIPPED
- **`LeadsListView.getPrimaryAction`** (the real source of the "View signed" sighting): BOOKED branch `'View signed'` → `` `View ${lang.contract}` `` (matches modal header copy). All three branches now route to `tab: 'pipeline'` instead of the deprecated `'quotes'/'contracts'` tab names.
- **`Dashboard.handleQuickSendQuote`**: `setSelectedLeadInitialTab('quotes')` → `'pipeline'`. The `quotes` tab was unified into Pipeline back in iter-199; this callsite had been missed.
- **`LeadDetailModal` Archive button**: dropped `window.confirm('Mark this lead as Lost?…')`. Native dialog is blocked on iOS Safari PWA standalone and was double-prompting (browser dialog + two-tap state). Two-tap confirmation is now the sole flow — first tap turns the button red and shows `Confirm archive?`, second tap within 3s executes the LOST status update. Matches the pattern proven in iter-210.
- **No change to `industryLanguage.ts`** — already maps `keyDate` correctly per industry (`Shoot date` / `Deadline` / `Delivery date`). QuoteBuilderModal reads `lang.keyDate` driven by the user's primaryIndustry; per-account label tracking already works.
- Build: frontend `tsc --noEmit` + `npm run build` clean (6.47s). Commit `8e7c87f` (local, pending push via "Save to GitHub").


## Iteration 214 — Calendar View Lead route fix · View [contract] label · Portal z-index · useOpenLead hook (Feb 2026) — ✅ SHIPPED
- **Calendar back button** (`pages/Calendar.tsx`): `navigate('/dashboard')` → `navigate('/')`. The dashboard route is mounted at `/`, the old path fell through to the public landing page.
- **New `src/hooks/useOpenLead.ts`**: single reusable hook for "open lead modal from anywhere".
  - If `window.location.pathname !== '/'`: `navigate('/')` then dispatch `kolor:openLead` after 150 ms.
  - If already on `/`: dispatch immediately.
  - Accepts optional `tab` arg for direct tab targeting.
- **Calendar `EventSidePanel.onNavigateToLead`** (both desktop sidebar and mobile overlay) now call `openLead(leadId)` instead of inline `navigate('/') + setTimeout(dispatch)`. Removes two copies of the same logic.
- **LeadDetailModal `getPrimaryActionLabel`** for BOOKED status: `'View signed'` → `` `View ${lang.contract}` ``. Renders as "View contract" / "View booking agreement" / "View commission agreement" depending on the studio's primary industry. Matches the rest of the action-bar copy.
- **ClientPortal h1 + "Project Portal" label**: `relative z-10` → `relative z-20`. Gradient overlay also uses z-10; the title was being obscured on certain viewport widths.
- **No change to `industryLanguage.ts`**: investigation confirmed keyDate is already mapped per industry (Photography 'Shoot date', Design 'Deadline', Fine Art 'Delivery date'). QuoteBuilderModal already reads `lang.keyDate`, so the label tracks the user's primary industry automatically.
- Build: frontend `tsc --noEmit` + `npm run build` clean (6.75s). Commit `cd47318` (local, pending push via "Save to GitHub").


## Iteration 213 — Banner persistence · today.ts contract · FAB · shoot date · Calendar View Lead (Feb 2026) — ✅ SHIPPED
- **DemoBanner + Pending-Contract banner gated to `viewMode === 'kanban'`** — both were rendering above the viewMode conditional in Dashboard and showing on Clients/Portfolio views too. Now Today-only.
- **`backend/routes/today.ts` contract query fix**: removed `status: { in: ['SENT', 'VIEWED'] }` filter. Now uses `clientAgreed: false` + `sentAt: { not: null }` — the correct predicate. Contracts created without the email flow remain status `DRAFT` but have a `sentAt` timestamp; the old filter excluded them and made Today show "All clear" while contracts sat unsigned.
- **FAB positioning**: `bottom-[80px]` → `bottom-[calc(env(safe-area-inset-bottom,0px)+88px)]`. Eliminates overlap with Calendar shortcut on iPhone 14+ with dynamic safe area insets.
- **QuoteBuilderModal shoot date controlled**: new `shootDate` state initialised from `lead.keyDate || lead.eventDate`. `defaultValue` (uncontrolled) replaced with `value={shootDate}` + `onChange={e => setShootDate(e.target.value)}`. Visible span now reads from state, so it re-renders immediately after the iOS date picker selection.
- **Calendar View Lead bridge**: `EventSidePanel.onNavigateToLead` no longer routes to `/dashboard?leadId=…`. It navigates to `/` and dispatches `window.dispatchEvent(new CustomEvent('kolor:openLead', { detail: { leadId } }))` after a 100 ms timeout. Dashboard mounts a global listener that looks up the lead in local state (or fetches via `leadsApi.getOne`) and calls `setSelectedLead`. No page reload, no query-string parsing, modal opens directly.
- Build: backend `tsc --noEmit` clean. Frontend `tsc --noEmit` + `npm run build` clean (6.79s). Commit `e1daedc` (local, pending push via "Save to GitHub").


## Iteration 212 — Surface elevation · Today urgency hierarchy · Action bar (Feb 2026) — ✅ SHIPPED
- **Surface elevation (`index.css` + `tailwind.config.js`)**:
  - `--surface-background`: `#F9F7FE` → `#F4F1FA` (light-100 in the existing scale).
  - `body { background-color }`: `#F9F7FE` → `#F4F1FA` — cards on `#FDFCFF` now visually separate from page.
  - `surface.page = #F4F1FA` Tailwind token added.
  - `--surface-base` stays `#FDFCFF` — white cards/modal surfaces unchanged. Single CSS change gives the entire app new depth.
- **TodayScreen three-tier urgency hierarchy**:
  - New `URGENCY_CONFIG` (legacy `URGENCY_COLORS` retained for compat). Card background stays `#FDFCFF` across all tiers — urgency is communicated entirely via left border + tiny meta label.
  - **CRITICAL** (contract_unsigned, payment_overdue): 3px solid `#A32D2D` left border, red meta (`DAY N · CONTRACT`, `N DAYS OVERDUE · PAYMENT`), red chip on `#FCEBEB`.
  - **WARNING** (quote_expiring, quote_viewed): amber left border `#B45309`, amber meta (`EXPIRES SOON · OFFER`, `VIEWED · AWAITING DECISION`), amber chip on `#FEF3C7`.
  - **NEW** (new_inquiry): brand-purple `#6C2EDB` left border, `NEW INQUIRY` meta, purple chip on `#EDE9FE`.
  - **STALE**: 1px muted `#DDD6EA` border + 72% opacity — visually recedes.
  - Section label gains `N critical` red badge when any critical items exist.
  - In-progress rows now use `background: var(--surface-base)` so they pop against the elevated page bg.
- **LeadDetailModal action bar hierarchy**: Send [Quote] now `flex-[2]`, `h-9`, `rounded-xl`, with `boxShadow: 0 1px 4px rgba(108,46,219,0.35)` — visually dominant commercial CTA. Upload + Message: `flex-1`, `h-9`, `text-[11px]`, secondary text color. Label "Upload file" → "Upload" so the dominant button keeps room on narrow screens.
- Build: frontend `tsc --noEmit` + `npm run build` clean (6.85s). Commit `18a349d` (local, pending push via "Save to GitHub").


## Iteration 211 — Dropdown removal · Sidebar gating · Portal · Calendar mobile popover · Digest threshold · Two-tap confirm · Mobile menu (Feb 2026) — ✅ SHIPPED
- **User dropdown removed**: caret, dropdown panel, `userMenuOpen` state all retired. User block now opens Settings directly on click. `CaretDown` import removed.
- **Right sidebar gated to list view only**: `(viewMode === 'kanban' || viewMode === 'list')` → `viewMode === 'list'`. CRM Alerts + Revenue + Goal + Onboarding no longer pollute Today.
- **Mobile hamburger menu simplified**: Today · Clients · Portfolio · Calendar & Booking (was 7 items + separate Calendar). Old testids renamed `sidebar-*` → `mobile-menu-*`. Feedback button replaced with Log out (SignOut icon, red treatment).
- **Calendar mobile day sheet**: converted from right-side slide-in to a bottom sheet with drag-handle + `animate-slide-up`. DaySidebar rendered inside.
- **ClientPortal service type**: raw enum → title case (`PHOTOGRAPHY` → `Photography`, `FINE_ART` → `Fine Art`). h1 z-10 + pinwheel logo were already shipped in iter-197.
- **Digest threshold relaxed** (`backend/routes/digest.ts`): now sends if `hasActivity || nextActions.length > 0`. Previously skipped weeks where no fresh inbound activity existed even if contracts/quotes were stale; those items land in `nextActions`, so the digest now fires for them.
- **QuotesTab delete two-tap**: same pattern as Archive — first tap "Confirm delete?" in red with 3s auto-cancel; second tap executes.
- **⚠️ Still flagged**: `SENDER_EMAIL` env var on Railway still required for any of these emails to reach clients (see iter-210 flag).
- Build: backend `tsc --noEmit` clean. Frontend `tsc --noEmit` + `npm run build` clean (6.93s). Commit `e0bfd62` (local, pending push via "Save to GitHub").


## Iteration 210 — Review Contract route · Archive confirm · Activity tab removed · Calendar · AddLeadModal · Desktop UX · Analytics/Sequences hidden (Feb 2026) — ✅ SHIPPED
- **Dashboard Review Contract fix**: `setSelectedLeadInitialTab('contracts')` → `'pipeline'`. Tab was renamed in iter-199; button was routing to a non-existent tab and opening blank Overview.
- **DemoProjectBanner**: optional `onExplore?: () => void` prop + "Click to explore →" link. Dashboard wires it to open the demo lead modal directly.
- **LeadDetailModal Archive confirmation**: new `confirmArchive` state. First tap: button text becomes "Confirm archive?" in red (`#DC2626`). Second tap: `leadsApi.update(lead.id, { status: 'LOST' })` + close. Prevents accidental archival.
- **Activity tab fully removed**:
  - Removed from tab array (5 → 4 tabs: Overview · Pipeline · Files & Notes · Messages).
  - `activeTab` union narrowed to 4 values.
  - 84-line `activeTab === 'activity'` render branch deleted (was duplicate of Recent section in Overview).
  - LeadDetailModal bundle shrank ~16KB gzip (132.99 KB → 116.82 KB).
- **Calendar gear removed**: `calendar-settings-btn` and its unused `GearSix` import removed — redundant with Settings already in sidebar/nav.
- **AddLeadModal background fix**: `glass-modal` class (unresolved CSS custom class causing grey background) replaced with `bg-[var(--surface-base,#FDFCFF)]` inline fallback.
- **Desktop UX cleanup**:
  - Settings button removed from user dropdown (already in sidebar).
  - Sidebar footer Feedback button replaced with Log out button (`SignOut` icon) — Logout now always-visible.
- **Analytics + Sequences hidden** (deferred to Pro tier — routes intact):
  - Removed from Workspace sidebar section (Analytics).
  - Removed from Account sidebar section (Sequences).
  - Removed from desktop view-toggle icon strip. Strip now shows Today · Clients · Portfolio.
- **QuoteBuilderModal shoot date z-index fix**: container `zIndex: 1` + label overlay `position: relative; zIndex: 2` so the transparent hidden date input receives touch events correctly on iOS.
- **⚠️ FLAGGED for Emmanuel**: `SENDER_EMAIL` env var is NOT SET on Railway. Without it, all client emails (weekly digest, quote/contract notifications, portal invites) silently fall to Resend sandbox. Add `SENDER_EMAIL=noreply@kolorstudio.app` in Railway → backend → Variables. Cannot be set by Emergent.
- Build: frontend `tsc --noEmit` + `npm run build` clean (6.38s). Commit `da4e117` (local, pending push via "Save to GitHub").


## Iteration 209 — Payment plan timeline · Deposit date fields (Feb 2026) — ✅ SHIPPED
- **QuoteBuilderModal payment schedule card**: rendered below the payment terms selector when `paymentTerms !== 'FULL_PAYMENT'`. Three fields:
  - **Deposit %** — clamped 1-100 number input (default 50).
  - **Deposit Due** — formatted display (`Jun 28`) with hidden `<input type="date">` overlay (`min={today}`).
  - **Final Payment Due** — formatted display with hidden date overlay (`min={depositDueDate || today}`).
  - All three fields hydrate from `existingQuote` when editing.
- **backend/routes/quotes.ts**:
  - `POST /:leadId/quotes` (create): destructures and persists `depositDueDate`, `finalPaymentDueDate`, `depositPercent`.
  - `PATCH /:quoteId` (update): conditional `updateData` assignment for each field (`undefined` → not changed, `null` → cleared).
  - `GET /public/:quoteToken`: no change — uses `include` not `select`, so the new top-level Quote fields are returned by default.
- **PublicQuote.tsx payment plan widget**: rendered between totals and terms when `(depositDueDate || depositPercent)` and quote is not yet accepted/declined.
  - Step 1: brand-purple numbered badge, "Deposit (50%)", formatted due date, amount = `total × percent/100`.
  - Step 2: muted badge, "Final Payment (50%)", formatted due date (or "Due on completion"), amount = remaining.
  - Subtle CTA: "Accept the quote to receive your deposit payment link" — primes the existing accept-and-pay flow.
- **api.ts**: `Quote` interface extended with `depositDueDate?: string | null`, `finalPaymentDueDate?: string | null`, `depositPercent?: number | null`.
- Build: backend `tsc --noEmit` clean. Frontend `tsc --noEmit` + `npm run build` clean (6.58s). Commit `9708ef9` (local, pending push via "Save to GitHub").


## Iteration 208 — Today isolation · Calendar shortcut · Lazy Pipeline · SpinnerGap FINAL · Schema (Feb 2026) — ✅ SHIPPED
- **Dashboard isolation**: TodayScreen (kanban viewMode) now renders without any of the legacy dashboard chrome. Stat cards, SmartNudgeBanner, SmartSuggestion, needsAttention strip, pipeline counter — all gated to `viewMode === 'list'` only. Today screen is now a clean, focused surface.
- **TodayScreen calendar shortcut**: full-width "Calendar & Booking" button at the bottom of TodayScreen navigates to `/calendar` via `useNavigate`. Restores calendar access from mobile (kanban viewMode was the only Today entry point).
- **MobileBottomNav iOS fix**: Replaced `safe-bottom` class with inline `paddingBottom: env(safe-area-inset-bottom, 0px)` + `transform: translateZ(0)` to force GPU compositing layer. Eliminates the jitter/shift caused by iOS Safari's toolbar collapsing during scroll.
- **MobileBottomNav 4-item layout**: Today · Clients · **Portfolio** · Settings. Briefcase icon added. Per-item width reduced to `min-w-[60px] px-3` to fit comfortably on 375px screens.
- **LeadDetailModal lazy mount**:
  - New `mountedTabs: Set<string>` state initialised with `['overview']`.
  - QuotesTab and ContractsTab JSX wrapped in `{mountedTabs.has('pipeline') && (...)}` — they only mount (and fire their fetch APIs) when the Pipeline tab is first opened.
  - Tab click handler, Send Offer button, Upload button, Message button all add their target tab to `mountedTabs` before switching.
  - Eliminates 5-7 unnecessary API calls per lead modal open (previously QuotesTab + ContractsTab + their nested data always fetched on mount).
- **SpinnerGap → KolorSpinner — FINAL sweep**: 51 animate-spin loading state instances replaced across 29 files (DeliverablesTab, ProjectTimeline, AccountDangerZone, EmailVerificationBanner, PaymentTracker, BookingModal, FeedbackModal, EmailSignatureSettings, IndustryWidgets, ClientFileUpload, AHAModal, IndustryOnboarding, FileComments, DemoProjectBanner, QuotesTab, CalendarView, PortfolioSettings, SchedulingSettings, EmailComposerModal, ForgotPassword, Quotes, PublicBookingPage, Portfolio, PublicQuote, SequencesDashboard, VerifyEmail, Calendar, ResetPassword, Signup, Login, Contracts, PublicPortfolio). KolorSpinner imports added to all 26 files that needed them. **Kept intentionally**: `StatusIndicator.tsx:78` and `DeliverablesTab.tsx:63` IN_PROGRESS — spinner IS the status metaphor.
- **KanbanBoard.tsx**: `statusColors` utility import added (rounds out the migration sweep for files with inline hex status colors).
- **Schema (`add_quote_payment_schedule` migration `20260225000000`)**: Quote model gains `depositDueDate DateTime?`, `finalPaymentDueDate DateTime?`, `depositPercent Int?`. Migration file created manually (shadow DB failed on remote due to legacy migration drift — direct migration SQL committed to be applied on Railway deploy via `prisma migrate deploy`). Prisma client regenerated locally.
- Build: backend `tsc --noEmit` clean. Frontend `tsc --noEmit` + `npm run build` clean (7.15s). Commit `cb53651` (local, pending push via "Save to GitHub").
- **P2 backlog still open**: Quote Builder UI wiring for the new payment-schedule fields (depositDueDate input, finalPaymentDueDate input, discount field, note position after totals).


## Iteration 207 — TodayScreen + GET /api/today + Status Colors Migration (Feb 2026) — ✅ SHIPPED
- **NEW endpoint `GET /api/today`** (`backend/src/routes/today.ts`, registered in `server.ts`): single authenticated call returns `{ attention, inProgress, generatedAt }`.
  - `attention` (up to 8 items, priority-sorted): new inquiries (priority 70 base, -10/day age), unsigned contracts (80 + 3/day, max 100), expiring quotes within 3 days (75 + 5/day in window, max 100), viewed quotes 72h+ ago (60 + 2/day), stale leads 7d+ untouched (40 + days).
  - `inProgress` (up to 10): active leads (not BOOKED/LOST) sorted by `updatedAt` desc.
  - Uses `Promise.all` for 6 parallel Prisma queries.
- **NEW `TodayScreen.tsx`**: replaces KanbanBoard at the kanban viewMode slot. Three sections:
  1. Greeting header ("Good morning/afternoon/evening, [firstName]" + formatted date).
  2. **Needs attention**: urgency-coloured cards (purple=new_inquiry, amber=contract/quote_expiring, blue=quote_viewed, gray=stale_lead). Tapping routes to lead modal at correct tab.
  3. **In progress**: list of active leads with avatar, project type, estimatedValue, status pill via `getLeadStatusPillStyle`.
  4. **Empty state**: "All clear" + Add Client CTA.
  - Loading state: 3 shimmer skeleton cards.
- **Dashboard.tsx**: `viewMode === 'kanban'` branch swapped from `KanbanBoard` to `TodayScreen`. `onLeadClick` checks local `leads` array first, falls back to `leadsApi.getOne(leadId)` for uncached leads. Greeting computed from `new Date().getHours()`.
- **Status colors migration (Step 1)**: `import { getQuoteStatusPillStyle, getLeadStatusPillStyle } from '../utils/statusColors'` added to `LeadsListView.tsx`, `LeadDetailModal.tsx`, `Quotes.tsx`, `Contracts.tsx` — imports landed for future inline replacement.
- Build: backend `tsc --noEmit` clean. Frontend `tsc --noEmit` + `npm run build` clean (7.43s). Commit `cba556d` (local, pending push via "Save to GitHub").


## Iteration 196-206 — Phase 1-4 UX Redesign (see CHANGELOG)
- Iter 196: Footer polish, `SpinnerGap` sweep, `wasModified` ref fetching.
- Iter 197: Portal contact cleanup, scheduler audit.
- **ClientPortal**: Removed old "Have Questions? / {name} is here to help" contact section that was rendering as a duplicate dark block above the footer. Footer panel: removed Contact Us mailto button, simplified layout to left-aligned studio badge + "Questions about your project?" text.
- **Scheduler audit (NO backend changes needed)**:
  - `server.ts` line 414: `startScheduler()` is called and gated by `ENABLE_SCHEDULER=true` env flag (Iter 152 pattern).
  - `schema.prisma` lines 559-561: `weeklyReportEnabled`, `staleLeadEmailEnabled`, `quoteNudgeEmailEnabled` all present with `@default(true)`.
  - `scheduler.ts`: all 3 preference fields properly queried in their respective jobs (lines 50/82/115/272).
  - `scheduler.ts` line 243: `businessName` already included in quote expiry `assignedTo` select — `sendQuoteExpiryNoticeToClient` receives correct studio name.
- Build: `npx tsc --noEmit` clean on backend + frontend. `npm run build` clean in 7.99s. Commit `eb371d1` (local, pending push via "Save to GitHub").



## Test Credentials
- Email: bookingtest@test.com
- Password: password123

## 3rd Party Integrations
- Resend (transactional emails)
- Google Calendar (OAuth scheduling)
- Supabase Storage (file uploads)
- Vercel Analytics (consent-gated)
- Stripe (webhook with HMAC verification)
