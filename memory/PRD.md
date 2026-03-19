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
- **Fonts:** Bricolage Grotesque (headings), Instrument Sans (body)

## Core Workflow
1. Create Lead → 2. Create Quote → 3. Send Quote to Client →
4. Client Accepts → 5. Contract Auto-Generated as DRAFT →
6. User Gets Notification Email → 7. Dashboard Shows Banner →
8. User Reviews & Sends Contract → 9. Client Signs → 10. Payment

## What's Been Implemented

### Core CRM
- Landing page (6-section branded design)
- Full auth flow (signup, login, email verification, password reset)
- Lead management (CRUD, pipeline, status tracking)
- Quote builder (line items, tax, currency, PDF generation)
- Quote sending via email (with portal links)
- Client portal (public view of quotes/contracts)
- Contract auto-generation as DRAFT
- Booking management with calendar
- Portfolio page
- Email sequences (onboarding, follow-up)
- Payment integration (Stripe deposits)
- Dashboard with analytics (auto-refresh, live indicator)
- Security audit (audit logs, GDPR account deletion)
- Onboarding wizard + dashboard tour
- Email signature settings
- Inquiry form (public, client-facing)

### Accessibility (WCAG 2.1 AA)
- Focus trapping modals (useModalA11y hook)
- focus-visible styles, ARIA labels, screen-reader text
- Skip to navigation link

### Product Features 1-4 (Mar 17, 2026)
- Timeline Milestones: Auto-generated on contract signing
- Scheduled Review Emails: ScheduledEmail model + cron
- Share Files + Comment: Renamed tab, added message textarea
- Project Categories: projectType dropdown on inquiry form

### Meeting Booking System (Mar 18, 2026)
- MeetingType, AvailabilitySchedule, MeetingBooking models
- Full CRUD APIs for meeting types and availability
- Public booking page at /book/:userId with multi-step flow
- Slot generation with buffer times and conflict detection
- Confirmation + reminder emails (24hr cron)

### UI System v2.0 (Mar 19, 2026) - NEW
- **Color System**: Full brand palette (50-900), surface, border, text, semantic colors (success/warning/danger/info with light/hover/border/text variants)
- **Typography**: Bricolage Grotesque (headings) + Instrument Sans (body) via Google Fonts. Full type scale (h1-h6, body-lg/body/body-sm, caption, label, button, overline)
- **Spacing**: Semantic tokens (xs/sm/md/lg/xl/2xl/3xl)
- **Elevation**: 5-level shadow system (elevation-0 to elevation-4) + component-specific shadows (card, card-hover, button, input-focus, input-error)
- **Animations**: fadeIn, slideUp, slideDown, scaleIn + transition durations (fast/base/slow) + spring timing function
- **Border Radius**: Semantic tokens (button/input/card/modal/badge)
- **Component Classes**: .btn/.btn-primary/.btn-secondary/.btn-ghost/.btn-danger, .card/.card-hover, .input/.input-error/.input-label, .badge variants
- **Updated Pages**: Login, Signup, Dashboard, AddLeadModal, LandingPage, PublicBookingPage all using new design tokens

## Prioritized Backlog

### P0 (All Resolved)
- [x] Meeting Booking System
- [x] UI System v2.0 Design System

### P1 (Next Up)
- [ ] Google Calendar integration for booking system
- [ ] Mobile responsiveness polish
- [ ] Dashboard project card text visibility

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend)
- [ ] Visual Sequence Builder (post-beta)

## Key Endpoints
- `POST /api/quotes/:id/send` — Send quote email
- `GET /api/contracts/pending` — Fetch DRAFT contracts
- `POST /api/contracts/:id/send` — Send contract to client
- `GET/POST/PUT/DELETE /api/meeting-types` — Meeting types CRUD
- `GET/PUT /api/availability` — Availability schedule
- `GET /api/book/:userId` — Public booking page
- `GET /api/book/:userId/:mtId/slots` — Available time slots
- `POST /api/book/:userId/:mtId` — Create meeting booking

## Test Reports
- iteration_76: Meeting Booking System (backend 19/19, frontend 100%)
- iteration_77: UI System v2.0 (frontend 100%, all pages + responsive verified)

## Test Credentials
- bookingtest@test.com / password123 (User ID: cmmw4gvhr0000msmu77aijfb9)
