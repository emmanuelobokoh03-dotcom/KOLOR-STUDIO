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
- Contract auto-generation as DRAFT (user must review before sending)
- Pending contracts dashboard banner with "Review Contract" button
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
- **Timeline Milestones**: Auto-generated milestones on contract signing
- **Scheduled Review Emails**: ScheduledEmail model + cron processor
- **Share Files + Comment**: Renamed tab, added message textarea
- **Project Categories**: projectType dropdown on inquiry form

### Meeting Booking System (Mar 18, 2026) - NEW
- **MeetingType model**: Configurable meeting types (name, duration, color, location, buffer times, max per day)
- **AvailabilitySchedule model**: Weekly availability windows (day of week, start/end times)
- **MeetingBooking model**: Client bookings with status tracking, confirmation/reminder emails
- **Backend APIs**:
  - `GET/POST/PUT/DELETE /api/meeting-types` - CRUD for meeting types (auth required)
  - `GET/PUT /api/availability` - Availability schedule management (auth required)
  - `GET /api/book/:userId` - Public booking page data
  - `GET /api/book/:userId/:meetingTypeId/slots?date=YYYY-MM-DD` - Slot generation algorithm
  - `POST /api/book/:userId/:meetingTypeId` - Create booking with conflict detection
  - `GET /api/meeting-bookings` - Authenticated user's bookings
  - `PATCH /api/meeting-bookings/:id/cancel` - Cancel a booking
- **Slot Generation**: Generates 30-min increment slots from availability, excluding past times, existing bookings (with buffer), and respecting maxPerDay limits
- **Email Notifications**: Confirmation email to client, notification to studio owner
- **Reminder Cron**: Hourly check for meetings in 24 hours, sends reminder emails
- **Frontend - Public Booking Page** (`/book/:userId`): Multi-step flow (Select Type → Calendar → Time → Details → Confirmed) with studio branding
- **Frontend - Settings**: New "Scheduling" tab in Settings modal with meeting types CRUD, availability editor, and copyable booking link

## User Action Required
- Verify a domain at resend.com/domains and update SENDER_EMAIL for external client emails

## Prioritized Backlog

### P0 (All Resolved)
- [x] All critical bugs fixed
- [x] Meeting Booking System implemented

### P1 (Next Up)
- [ ] Google Calendar integration for booking system
- [ ] Polish & mobile responsiveness review
- [ ] Dashboard project card text visibility

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend)
- [ ] Visual Sequence Builder (post-beta)

## Key Endpoints
- `POST /api/quotes/:id/send` — Send quote email
- `POST /api/quotes/public/:quoteToken/accept` — Client accepts quote
- `GET /api/contracts/pending` — Fetch DRAFT contracts
- `POST /api/contracts/:id/send` — Send contract to client
- `POST /api/contracts/:id/agree` — Client signs contract
- `GET /api/portal/:token` — Client portal
- `GET/POST/PUT/DELETE /api/meeting-types` — Meeting types CRUD
- `GET/PUT /api/availability` — Availability schedule
- `GET /api/book/:userId` — Public booking page
- `GET /api/book/:userId/:mtId/slots` — Available time slots
- `POST /api/book/:userId/:mtId` — Create meeting booking

## Test Reports
- iteration_75: Product Features 1-4 (backend 17/17, frontend 4/5)
- iteration_76: Meeting Booking System (backend 19/19, frontend 100%)

## Test Credentials
- bookingtest@test.com / password123 (User ID: cmmw4gvhr0000msmu77aijfb9)
