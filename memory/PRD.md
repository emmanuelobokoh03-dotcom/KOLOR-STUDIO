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

### Google Calendar Integration (Complete)
- OAuth 2.0 flow, secure token management with refresh logic
- Auto-create calendar events on booking, real-time availability sync

### Design System v3.0 (Complete)
- Inter-only font system, Fraunces for display headings
- Deep brand purple #6C2EDB, surface tokens, shadow hierarchy
- StatusBadge system, motion language (6 animations), empty states
- StatCard with sparklines, scroll reveal system

### Dark Atmospheric Landing Page (Complete)
- 8-section dark landing page with React-based UI illustrations
- DashboardMock, QuoteMock, PortalMock inline illustration components
- Scroll reveal, marquee, floating pills, countdown timer

### Premium Auth Screens (Complete)
- Split-panel layout: dark brand panel (left) + form (right)
- Login.tsx and Signup.tsx with testimonials, Google SSO button, trust indicators

### Dashboard Premium Upgrade (Complete — Mar 27, 2026)
- **Persistent Desktop Sidebar:** KOLOR branding, user block (initials avatar, name, plan), Workspace/Schedule/Account nav sections, active view indicator (purple bar), lead count badge, Beta Plan card, Help & feedback link
- **Topbar:** Contextual greeting ("Good evening, Sarah ✦"), lead status nudge ("X leads awaiting quotes · date"), search, settings, New Lead button
- **Smart Nudge Banner:** Amber alert for stale leads (not updated in 7+ days), shows lead names with days-stale count, dismissible
- **Two-Column Layout:** Main content (left) + 280px right sidebar (desktop only), stacks on mobile
- **Activity Feed:** New `/api/activities/recent` endpoint returns cross-lead activities. Right sidebar shows recent activities with type-specific icons, descriptions, client names, time-ago labels. Items clickable to open lead detail modal.
- **Mobile Responsiveness:** Desktop sidebar hidden, hamburger drawer nav, right sidebar stacks below content
- **Testing:** 100% pass rate — Backend 7/7, Frontend 100% (iteration_100)

### Production Hardening (Complete)
- Security: `validateSecrets()`, `helmet()`, HTTP-Only cookies
- Performance: `compression()`, composite DB indexes, WebP images
- Monitoring: Plausible analytics, Sentry stubs

## Prioritized Backlog

### P0 — All Done
- [x] All core CRM features
- [x] Google Calendar integration
- [x] Design System v3.0 elevation (Steps 1-8)
- [x] Dark atmospheric landing page + illustrations
- [x] Premium auth screens (split-panel)
- [x] Dashboard Premium Upgrade (sidebar, two-column, activity feed)
- [x] Production hardening (security, performance, monitoring)

### P1
- [ ] Mobile responsiveness polish (landing page + app on various sizes)
- [ ] Launch prep — configure production domains, DNS records (SPF/DKIM) for Resend email
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
- iteration_87-89: Auth, Remember Me, Landing Page V2 (all 100%)
- iteration_90-91: Production Hardening, Design System v3.0 (all 100%)
- iteration_92-99: Design elevation steps, landing page rebuild, illustrations (all 100%)
- iteration_100: Dashboard Premium Upgrade (backend 7/7 100%, frontend 100%)

## Test Credentials
- bookingtest@test.com / password123

## Key Architecture Notes
- Auth cookie name: `auth_token`
- Cookie attributes: httpOnly=true, secure=conditional, sameSite=lax, maxAge=7 days
- Backend still accepts Bearer token for backward compatibility
- Frontend uses `credentials: 'include'` in all fetch calls
- Dashboard layout: CSS Grid — 220px sidebar + main column (with inner 2-col grid: 1fr + 280px right sidebar for kanban/list views)

## Key Files
- `/frontend/src/pages/Dashboard.tsx` — Main dashboard with sidebar, topbar, two-column layout
- `/frontend/src/components/ActivityFeed.tsx` — Cross-lead activity feed
- `/frontend/src/components/SmartNudgeBanner.tsx` — Stale lead nudge banner
- `/backend/src/routes/recentActivities.ts` — GET /api/activities/recent endpoint
