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
- **Fonts:** Bricolage Grotesque (headings), Instrument Sans (body)

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

### Discovery Call Workflow (Mar 21, 2026) — NEW
- Added `discoveryCallScheduled`, `discoveryCallCompletedAt`, `discoveryCallNotes` fields to Lead model
- Backend endpoint `PATCH /api/leads/:id/discovery-call` with activity logging
- UI cards in LeadDetailModal Activity tab:
  - **Schedule**: Purple gradient CTA for leads with status NEW/REVIEWING/CONTACTED/QUALIFIED
  - **Scheduled**: Blue info card with "Mark Complete" button
  - **Completed**: Green success card with date, notes, and "Send Quote" CTA
- Activity types: DISCOVERY_CALL_SCHEDULED, DISCOVERY_CALL_COMPLETED

### Liquid Glass Design System (Mar 21, 2026) — NEW
- CSS utility classes: `.glass`, `.glass-strong`, `.glass-subtle`, `.glass-dark`, `.glass-card`, `.glass-modal`, `.glass-header`
- Applied to: Dashboard header, stat cards, toolbar, SettingsModal, AddLeadModal, LeadDetailModal
- Performance: Reduced blur on mobile, fallback for unsupported browsers
- Accessibility: Updated text-secondary to #4B5563, text-tertiary to #6B7280 for better contrast

### Comprehensive Bug Fixes (Mar 21, 2026) — NEW
1. Google Calendar connect: Added config-check endpoint, error handling, user-friendly alerts
2. Email verification: Detailed error messages for invalid/expired/already-used tokens
3. Subheading contrast: text-secondary darkened to #4B5563, text-tertiary to #6B7280
4. Fine Art category: Added FINE_ART and ILLUSTRATION to ServiceType enum
5. Duplicate footer: Fixed ClientPortal to show single "Powered by KOLOR STUDIO"

## Prioritized Backlog

### P0 — Done
- [x] Google Calendar integration (DONE)
- [x] Google Calendar Dashboard Widget (DONE)
- [x] Comprehensive Bug Fixes (DONE)
- [x] Discovery Call Workflow (DONE)
- [x] Liquid Glass Design System (DONE)

### P1
- [ ] Mobile responsiveness polish
- [ ] Landing page full-bleed background verification
- [ ] Landing page redesign (if user requests)

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

## Test Credentials
- bookingtest@test.com / password123
