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

## Iteration 145 — Contract Preview Modal + Dashboard Scroll-to-Top (Feb 2026) — ✅ SHIPPED
- **T1 ContractsTab preview modal (P0)**: Full-screen `ContractPreviewModal` at z-[60] with header/scrollable body/sticky footer. Prominent 'Send to Client' (or 'Resend to Client') button always visible in footer. Closes on Escape, backdrop click. Triggered by new 'Preview' Eye button in action row and 'See full contract →' link under inline preview. Inline preview shrunk to 200px with fade gradient hinting more content below. Fixes the 'no Send button after review' bug caused by the old 300px max-height clipping.
- **T2 Dashboard scroll-to-top (P0)**: `handleViewChange` now calls `window.scrollTo({ top: 0, behavior: 'smooth' | 'auto' })` respecting `prefers-reduced-motion`. Applies to all desktop toolbar, sidebar, and mobile-hamburger nav buttons (they all route through `handleViewChange`).
- Testing: testing_agent_v3_fork verified 10/10 tasks (iteration_145.json). Desktop scroll: 1849px → 0px; mobile scroll: 1461px → 0px; sidebar closes on mobile.

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

## Test Credentials
- Email: bookingtest@test.com
- Password: password123

## 3rd Party Integrations
- Resend (transactional emails)
- Google Calendar (OAuth scheduling)
- Supabase Storage (file uploads)
- Vercel Analytics (consent-gated)
- Stripe (webhook with HMAC verification)
