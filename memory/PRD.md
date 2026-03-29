# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a full-stack CRM, "KOLOR STUDIO," for creative professionals (photographers, designers, artists). The app manages leads, quotes, contracts, bookings, payments, and client communication through an elegant, branded experience.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Prisma + PostgreSQL (Supabase)
- **Email:** Resend (sandbox mode), **Payments:** Stripe, **Storage:** Supabase Storage
- **Icons:** @phosphor-icons/react, **Tours:** Driver.js, **Calendar:** googleapis
- **Fonts:** Inter (app UI), Fraunces (marketing display headings)
- **Auth:** HTTP-Only cookie-based JWT

## What's Been Implemented

### Core CRM (Complete)
Landing page, full auth, lead management, quote builder, email sending, client portal, contract auto-generation, booking management, portfolio, email sequences, Stripe deposits, dashboard analytics, security audit, GDPR, onboarding wizard, inquiry form, project timeline, scheduled review emails

### Meeting Booking System (Complete)
MeetingType, AvailabilitySchedule, MeetingBooking models, public booking page, slot generation

### Google Calendar Integration (Complete)
OAuth 2.0, auto-create events on booking, real-time availability sync

### Design System v3.0 (Complete)
Inter/Fraunces fonts, deep purple #6C2EDB, StatusBadge, motion language, empty states, StatCard sparklines, scroll reveal

### Premium Auth Screens (Complete)
Split-panel layout, Login + Signup with industry selection (2-step), trust indicators

### Dashboard Premium Upgrade (Complete)
Persistent sidebar, topbar with contextual greetings, Smart Nudge Banner, two-column layout, Activity Feed, Quick Actions Panel

### Iteration 101 — Quick Actions + Industry Language (Complete)
QuickActions.tsx (4 contextual actions), industryLanguage.ts (3-industry mapping), 2-step signup with industry selection, Dashboard uses industry language

### Iteration 102 — Landing Page Enhancements (Complete — Mar 29, 2026)

**7 surgical upgrades, all additive:**

1. **Hero Perspective Tilt** — CSS 3D perspective transform on browser chrome frame wrapper (rotateX(2deg) rotateY(-1.5deg), hover: near-flat). Disabled on mobile. `.hero-frame-tilt` class.
2. **Third Ambient Glow** — Low-opacity purple radial gradient at bottom-center of hero (rgba(108,46,219,0.08)), grounding the product frame in the space.
3. **Within-Section Stagger** — `.stagger-children` CSS class applied to card grids in Problem, Features, Testimonials, and Workflow sections. Children stagger by 80ms intervals when parent `.reveal-section` enters viewport. All wrapped in `prefers-reduced-motion` media query.
4. **Workflow Connector Lines** — Animated horizontal lines between workflow steps using CSS `scaleX(0)→scaleX(1)` with 400ms/800ms delay. `.workflow-connector-line` class.
5. **Star Ratings + Verified Label** — 5 amber SVG stars and "Verified KOLOR user" micro-label on featured testimonial (Sophie L.) only. Non-featured cards untouched.
6. **FAQ Accordion Section** — NEW 8-question section between Testimonials and Urgency. Accordion uses `useState<number|null>`, only one item open at a time. Questions address: free pricing, industry support, legal binding, data ownership, contract templates, Google Calendar sync, mobile portal, post-beta pricing. `.reveal-section` + `.stagger-children` applied.
7. **Dot Grid Texture on Final CTA** — `radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)` background with `mask-image` gradient fade at edges.

**Testing:** 100% pass rate — 24/24 frontend tests (iteration_102).

### Production Hardening (Complete)
Security: `validateSecrets()`, `helmet()`, HTTP-Only cookies. Performance: `compression()`, composite DB indexes, WebP images. Monitoring: Plausible, Sentry stubs.

## Prioritized Backlog

### P0 — All Done
- [x] Core CRM, Google Calendar, Design System v3.0
- [x] Landing page rebuild + 7 enhancements (FAQ, stars, tilt, stagger, glows, connectors, dots)
- [x] Premium auth (split-panel + industry selection)
- [x] Dashboard upgrade (sidebar, activity feed, quick actions, industry language)
- [x] Production hardening

### P1
- [ ] Full industry language rollout across ALL screens (Lead Modal, Quotes, Contracts, Calendar, etc.)
- [ ] Mobile responsiveness polish (landing page + app)
- [ ] Launch prep — production domains, DNS/SPF/DKIM for Resend
- [ ] Push & Deploy

### P2 (Future)
- [ ] Wire real sparkline trend data from backend to StatCard
- [ ] Meeting booking widget embed code
- [ ] "Smart Inbox" view, "File Request" feature, "Smart Scheduling"
- [ ] Visual Sequence Builder, A/B test hero copy

## Test Reports
- iteration_100: Dashboard upgrade — 100%
- iteration_101: Quick Actions + Industry Language — 100%
- iteration_102: Landing Page 7 Enhancements — 24/24 100%

## Test Credentials
- bookingtest@test.com / password123

## Key Files
- `/frontend/src/pages/LandingPageV2.tsx` — 9-section landing page (hero, problem, features, workflow, testimonials, FAQ, urgency, final CTA, footer)
- `/frontend/src/index.css` — hero-frame-tilt, stagger-children, workflow-connector-line CSS
- `/frontend/src/pages/Dashboard.tsx` — Dashboard with sidebar, topbar, quick actions, industry language
- `/frontend/src/components/QuickActions.tsx` — 4 contextual quick actions
- `/frontend/src/utils/industryLanguage.ts` — Industry language mapping
- `/frontend/src/pages/Signup.tsx` — 2-step signup with industry selection
