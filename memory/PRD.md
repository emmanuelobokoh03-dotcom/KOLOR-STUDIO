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

### Google Calendar Integration (Complete)
- OAuth 2.0 flow, secure token management with refresh logic
- Auto-create calendar events on booking, real-time availability sync

### Design System v3.0 (Complete)
- Inter-only font system, Fraunces for display headings
- Deep brand purple #6C2EDB, surface tokens, shadow hierarchy
- StatusBadge, motion language, empty states, StatCard with sparklines
- Scroll reveal system, dark atmospheric landing page with React illustrations

### Premium Auth Screens (Complete)
- Split-panel layout: dark brand panel (left) + form (right)
- Login.tsx and Signup.tsx with testimonials, Google SSO button, trust indicators

### Dashboard Premium Upgrade (Complete)
- Persistent desktop sidebar, topbar with contextual greetings/nudges
- Smart Nudge Banner for stale leads, two-column layout
- Activity Feed with `/api/activities/recent` endpoint

### Iteration 101 — Quick Actions Panel + Industry Language Utility (Complete — Mar 27, 2026)

**Workstream 1: Quick Actions Panel**
- Persistent panel in right sidebar below Activity Feed with 4 contextualised actions:
  - **Send a quote**: Opens lead detail with Quotes tab for first lead without a quote
  - **Follow up on stale leads**: Switches to list view with stale filter (7+ days inactive, amber chip indicator)
  - **Check today's schedule**: Switches to calendar view
  - **Add a lead**: Opens new lead modal (reuses existing handler)
- All actions carry context (pre-filtered, pre-populated) rather than being simple navigation links
- Renders in both desktop right sidebar and mobile stacked layout
- Component: `QuickActions.tsx` with dynamic sub-labels, status dots (amber/green), Phosphor icons

**Workstream 2: Industry Language Utility**
- **Schema**: Added `CreativeIndustry` enum (PHOTOGRAPHY, DESIGN, FINE_ART) + User.industry field (default PHOTOGRAPHY) + Lead fields (keyDate, medium, dimensions, edition)
- **Backend**: Signup accepts `industry` field, login/me return it. Validated to only accept valid enum values.
- **Utility**: `industryLanguage.ts` — comprehensive mapping of all UI strings per industry (lead/quote/contract names, stages, empty states, email subjects, portal copy, quick action labels, onboarding steps, project types)
- **Dashboard integration**: All hardcoded strings replaced with `lang.*` references (topbar, stat cards, empty states, buttons)
- **Signup 2-step flow**: Step 1 = account details (name, email, password), Step 2 = industry selection (3 cards: Photography/Design/Fine Art with distinct colors and icons). Submit disabled until industry selected. Progress indicator (2-step bar).
- **Testing**: 100% pass rate (Backend 7/7, Frontend 100%) — iteration_101

### Production Hardening (Complete)
- Security: `validateSecrets()`, `helmet()`, HTTP-Only cookies
- Performance: `compression()`, composite DB indexes, WebP images
- Monitoring: Plausible analytics, Sentry stubs

## Prioritized Backlog

### P0 — All Done
- [x] All core CRM features
- [x] Google Calendar integration
- [x] Design System v3.0 elevation
- [x] Dark atmospheric landing page + illustrations
- [x] Premium auth screens (split-panel)
- [x] Dashboard Premium Upgrade (sidebar, two-column, activity feed)
- [x] Quick Actions Panel
- [x] Industry Language Utility (schema, utility, signup, dashboard integration)
- [x] Production hardening

### P1
- [ ] Mobile responsiveness polish (landing page + app on various sizes)
- [ ] Full industry language rollout across ALL screens (Lead Modal, Quotes, Contracts, Calendar, etc.)
- [ ] Launch prep — configure production domains, DNS records (SPF/DKIM) for Resend
- [ ] Push & Deploy to production

### P2 (Future)
- [ ] Wire real sparkline trend data from backend to StatCard
- [ ] Meeting booking widget embed code
- [ ] Design Tokens Reference Page (`/design-system`)
- [ ] "Smart Inbox" view for files needing review
- [ ] "File Request" feature
- [ ] "Smart Scheduling" feature (suggests optimal meeting times)
- [ ] Visual Sequence Builder
- [ ] A/B test landing page hero copy variants

## Test Reports
- iteration_87-99: All previous features (auth, landing page, design system, illustrations) — all 100%
- iteration_100: Dashboard Premium Upgrade — backend 7/7, frontend 100%
- iteration_101: Quick Actions + Industry Language — backend 7/7, frontend 100%

## Test Credentials
- bookingtest@test.com / password123

## Key Architecture Notes
- Auth cookie name: `auth_token`, httpOnly=true, secure=conditional, sameSite=lax
- Industry language: `getIndustryLanguage(user?.industry)` returns typed `IndustryLanguage` object
- Dashboard layout: CSS Grid — 220px sidebar + main (inner 2-col: 1fr + 280px right sidebar for kanban/list)
- Quick Actions derive data from existing `leads` state — no extra API calls
- Stale filter: `staleFilter` boolean state, clears on view change

## Key Files
- `/frontend/src/pages/Dashboard.tsx` — Dashboard with sidebar, topbar, quick actions, industry language
- `/frontend/src/components/QuickActions.tsx` — 4 contextual quick actions
- `/frontend/src/utils/industryLanguage.ts` — Industry language mapping utility
- `/frontend/src/pages/Signup.tsx` — 2-step signup with industry selection
- `/frontend/src/components/ActivityFeed.tsx` — Cross-lead activity feed
- `/frontend/src/components/SmartNudgeBanner.tsx` — Stale lead nudge banner
- `/backend/src/routes/auth.ts` — Signup/login/me with industry field
- `/backend/src/routes/recentActivities.ts` — GET /api/activities/recent
- `/backend/prisma/schema.prisma` — CreativeIndustry enum, User.industry, Lead fields
