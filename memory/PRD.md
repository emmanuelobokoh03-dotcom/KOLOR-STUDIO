# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a full-stack CRM, "KOLOR STUDIO," for creative professionals (photographers, designers, artists). The app manages leads, quotes, contracts, bookings, payments, and client communication through an elegant, branded experience.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Prisma + PostgreSQL (Supabase)
- **Email:** Resend (sandbox mode — verify domain for production)
- **Payments:** Stripe
- **Storage:** Supabase Storage
- **Icons:** @phosphor-icons/react
- **Tours:** Driver.js
- **Calendar:** googleapis (Google Calendar API)
- **Fonts:** Inter (app UI), Fraunces (marketing display headings)
- **Auth:** HTTP-Only cookie-based JWT (migrated from localStorage)

## What's Been Implemented

### Core CRM (Complete)
- Landing page, full auth, lead management, quote builder, email sending
- Client portal, contract auto-generation, booking management
- Portfolio, email sequences, Stripe deposits, dashboard analytics
- Security audit, GDPR, onboarding wizard, email signature settings
- Inquiry form, project timeline, scheduled review emails

### Meeting Booking System (Complete)
- MeetingType, AvailabilitySchedule, MeetingBooking models
- Full CRUD APIs, public booking page `/book/:userId`
- Slot generation with buffer/conflict detection, confirmation + reminder emails

### UI System v2.0 (Complete)
- Full brand palette, surface, border, text, semantic colors, typography scale
- Updated: Login, Signup, Dashboard, LandingPage, AddLeadModal, PublicBookingPage

### File Upload Notifications System (Complete)
- Auto-categorization by filename patterns
- File comments system
- Email notification on client upload
- Review workflow (approve/needs changes)

### Google Calendar Integration (Complete)
- OAuth 2.0 flow for calendar connection
- Secure token management with refresh logic
- Auto-create calendar events on booking
- Real-time availability sync on public booking page
- Dashboard widget for easy connection (CalendarConnectionWidget)
- Settings panel management

### Discovery Call Workflow (Mar 21, 2026)
- Added `discoveryCallScheduled`, `discoveryCallCompletedAt`, `discoveryCallNotes` fields to Lead model
- Backend endpoint `PATCH /api/leads/:id/discovery-call` with activity logging
- UI cards in LeadDetailModal Activity tab

### Liquid Glass Design System (Mar 21, 2026)
- CSS utility classes: `.glass`, `.glass-strong`, `.glass-subtle`, `.glass-dark`, `.glass-card`, `.glass-modal`, `.glass-header`
- Applied to: Dashboard header, stat cards, toolbar, SettingsModal, AddLeadModal, LeadDetailModal

### HTTP-Only Cookie Auth Migration (Mar 22, 2026) — VERIFIED
- **Backend:** cookie-parser installed, login sets `auth_token` HTTP-Only cookie (httpOnly, secure=conditional, sameSite=lax, maxAge=7d)
- **Backend:** Auth middleware reads cookie first, falls back to Bearer token for backward compat
- **Backend:** Logout clears cookie, /api/auth/me verified with cookie auth
- **Frontend:** All API calls use `credentials: 'include'`, localStorage token removed
- **Frontend:** Login/Signup no longer save tokens to localStorage
- **CORS:** credentials=true, origin whitelist configured
- **Testing:** 100% pass rate — Backend 10/10, Frontend 7/7 (iteration_87)

### Raleway Font Update (Mar 22, 2026) — VERIFIED
- Heading font changed from Bricolage Grotesque to Raleway
- CSS variable `--font-heading` updated, Tailwind config updated
- Verified: H1 font-family is 'Raleway, Inter, sans-serif'

### Remember Me Toggle (Mar 22, 2026) — VERIFIED
- Login page checkbox (default: checked) controls cookie persistence
- Checked: 7-day persistent cookie + 7d JWT expiry
- Unchecked: session-only cookie (no maxAge) + 24h JWT expiry
- All security attributes preserved (httpOnly, secure, sameSite=lax)
- Testing: 100% pass rate — Backend 9/9, Frontend 7/7 (iteration_88)

### Landing Page Screenshots (Mar 23, 2026) — Created
- 3 high-quality PNGs saved to `/frontend/public/screenshots/`
- `dashboard-overview.png` (80KB) — Clean dashboard with 5 professional mock leads
- `quote-builder.png` (100KB) — Quote builder modal for wedding photography
- `client-portal.png` (100KB) — Lead detail modal with activity timeline
- User name updated to "Sarah Mitchell" for professional appearance
- All onboarding banners dismissed via localStorage keys

### Landing Page V2 (Mar 23, 2026) — VERIFIED
- 8-section conversion-optimized landing page replacing old LandingPage.tsx
- Sections: Hero (with dashboard screenshot), Problem (5 pain points), Solution (3 steps), Features (6 cards with screenshots), Testimonials (6 reviews), Stats (animated counters), Urgency (countdown timer), Final CTA
- CountdownTimer component with 7-day beta end date persisted in localStorage
- Animated stat counters via IntersectionObserver
- Sticky frosted glass nav on scroll
- Mobile responsive (375px+)
- All CTAs → /signup
- Testing: 100% pass rate — Frontend 18/18 (iteration_89)

### KOLOR STUDIO Custom Skill (Mar 23, 2026) — Created
- `/mnt/skills/user/kolor-studio/README.md` — Skill overview
- `/mnt/skills/user/kolor-studio/SKILL.md` — Comprehensive dev reference (142 lines)
- Covers: auth, design system, API patterns, business logic, database, common gotchas

### Design System v3.0 — Inter Font + Token Consolidation (Mar 24, 2026) — VERIFIED
- **Font Consolidation:** Switched from Raleway+Instrument Sans to Inter-only (single font family, weight-based hierarchy). Removed all non-Inter font imports from index.html and CSS.
- **Hero Headline:** Increased from ~54px to 60px (text-6xl) on desktop for more impact.
- **Surface Tokens:** Added `surface-base`, `surface-background`, `surface-hover`, `surface-elevated` to Tailwind config.
- **Shadow Simplification:** 3-level hierarchy: `shadow-card`, `shadow-hover`, `shadow-modal`.
- **btn-secondary:** Changed from outline to light-purple fill (`bg-brand-100 text-brand-700`). Old outline style now `btn-outline`.
- **Accessibility:** `.btn` and `.input` classes enforced `min-height: 44px`.
- **Focus States:** Global `focus-visible` with brand-purple ring across all interactive elements.
- **Driver.js Tour:** Updated font references to Inter.
- Testing: 100% pass rate — All 13 tests passed (iteration_91)
- **Security:** `validateSecrets()` startup check — server exits if JWT_SECRET, DATABASE_URL, or FRONTEND_URL missing. `helmet()` middleware with CSP (allows plausible.io, fonts.googleapis.com), HSTS (1yr + preload), X-Frame-Options, X-Content-Type-Options.
- **Performance:** `compression()` middleware (gzip, level 6, threshold 1KB). 8 composite DB indexes on activities (leadId+createdAt, userId+createdAt), leads (assignedToId+status/pipelineStatus/createdAt), quotes (leadId+status, createdById+status/createdAt). Landing page screenshots converted to WebP (50-75% smaller).
- **Monitoring:** Plausible analytics script tag in index.html (data-domain="kolor-studio.vercel.app"). `analytics.ts` rewritten to use `window.plausible()` instead of Vercel Analytics. Sentry init stubs in main.tsx (frontend) and server.ts (backend) — reads from env vars, gracefully disabled when DSN absent.
- **Cleanup:** Deleted obsolete LandingPage.tsx, removed Vercel Analytics from App.tsx, cleaned up old PNG screenshots.
- Testing: 100% pass rate — Backend 14/14, Frontend 100% (iteration_90)

## Prioritized Backlog

### P0 — Done
- [x] Google Calendar integration (DONE)
- [x] Google Calendar Dashboard Widget (DONE)
- [x] Comprehensive Bug Fixes (DONE)
- [x] Discovery Call Workflow (DONE)
- [x] Liquid Glass Design System (DONE)
- [x] HTTP-Only Cookie Auth Migration (DONE — Mar 22, 2026)
- [x] Raleway Font Update (DONE — Mar 22, 2026)
- [x] Remember Me Toggle (DONE — Mar 22, 2026)
- [x] Landing Page V2 (DONE — Mar 23, 2026)
- [x] Production Hardening: Security + Performance + Monitoring (DONE — Mar 23, 2026)

### P0 — Design System Elevation (Mar 27, 2026)
- [x] Step 1: Deeper brand purple #6C2EDB + warm surface tints + amber accent (DONE)
- [x] Step 2: Fraunces display font for Landing Page H1/H2s (DONE)
- [x] Step 3: Shadow depth + global input focus ring glow (DONE)
- [x] Step 4: Features section redesign (browser chrome, floating pills, bento cards) (DONE)
- [x] Step 5: StatusBadge System — Linear-style left-border badges replacing hardcoded spans across Dashboard, LeadDetailModal, IndustryWidgets (DONE — 100% pass, iteration_94)
- [x] Step 6: Motion Language — 6 purposeful animations: card hover lift, modal entrance (spring), button press, toast slide-in, landing reveals (400ms standard), timing tokens (instant/fast/base/slow + standard/spring easings) + global smooth transitions. All wrapped in prefers-reduced-motion (DONE — 100% pass, iteration_95)
- [x] Step 7: Empty States — Reusable EmptyState component with Phosphor icon, headline, description, CTA. Integrated in Leads (UserPlus), Quotes (FileText), Contracts (Signature), Calendar (CalendarBlank). All CTAs wired to existing handlers. (DONE — 100% pass, iteration_96)
- [x] Step 8: Dashboard Intelligence Layer — StatCard component with trend indicator (up/down/neutral arrows) + sparkline micro-chart (inline SVG 80x28, 7-point line with fill area). Replaced all 4 stat cards. Accent colors: brand purple (leads), amber (quoted), green (booked). Placeholder sparkline data with TODO comments. (DONE — 100% pass, iteration_97)

### P1
- [ ] Mobile responsiveness polish (landing page + app on various sizes)
- [ ] Launch prep — configure production domains, DNS records (SPF/DKIM) for Resend email
- [ ] Push & Deploy to production

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend production email)
- [ ] Meeting booking widget embed code
- [ ] Design Tokens Reference Page (`/design-system`)
- [ ] "Smart Inbox" view for files needing review
- [ ] "File Request" feature
- [ ] "Smart Scheduling" feature
- [ ] Visual Sequence Builder

## Test Reports
- iteration_84: Google Calendar Dashboard Widget (100%)
- iteration_85: Comprehensive Update - Bug Fixes + Discovery Call + Liquid Glass (backend 15/15 100%, frontend 100%)
- iteration_87: HTTP-Only Cookie Auth Migration + Raleway Font (backend 10/10 100%, frontend 7/7 100%)
- iteration_88: Remember Me Toggle (backend 9/9 100%, frontend 7/7 100%)
- iteration_89: Landing Page V2 (frontend 18/18 100%)
- iteration_90: Production Hardening — Security + Performance + Monitoring (backend 14/14 100%, frontend 100%)
- iteration_91: Design System v3.0 — Inter Font + Token Consolidation (all 13 tests passed 100%)
- iteration_92: bg-white → bg-surface-base Migration (all 12 frontend tests passed 100%)
- iteration_93: Design System Elevation Steps 1-4 (100%)
- iteration_94: StatusBadge System Integration (frontend 100% — 7/7 tests passed)
- iteration_95: Motion Language — 6 animations (frontend 100% — 8/8 tests passed)
- iteration_96: Empty States — 4 views (frontend 100% — 9/9 tests passed)
- iteration_97: Dashboard Intelligence Layer — StatCard with sparklines (frontend 100% — 11/11 tests passed)

## Test Credentials
- bookingtest@test.com / password123

## Key Architecture Notes
- Auth cookie name: `auth_token`
- Cookie attributes: httpOnly=true, secure=conditional on protocol, sameSite=lax, maxAge=7 days, path=/
- Backend still accepts Bearer token in Authorization header for backward compatibility
- Frontend uses `credentials: 'include'` in all fetch calls via central `request()` function in api.ts
