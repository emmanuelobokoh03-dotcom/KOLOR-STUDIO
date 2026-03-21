# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a full-stack CRM, "KOLOR STUDIO," for creative professionals (photographers, designers, artists). The app manages leads, quotes, contracts, bookings, payments, and client communication through an elegant, branded experience.

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS + Shadcn/UI
- **Backend:** Node.js + Express + Prisma + PostgreSQL (Supabase)
- **Email:** Resend (sandbox mode — verify domain for production)
- **Payments:** Stripe
- **Storage:** Supabase Storage
- **Icons:** @phosphor-icons/react
- **Tours:** Driver.js
- **Fonts:** Bricolage Grotesque (headings), Instrument Sans (body)

## What's Been Implemented

### Core CRM (Complete)
- Landing page, full auth, lead management, quote builder, email sending
- Client portal, contract auto-generation, booking management
- Portfolio, email sequences, Stripe deposits, dashboard analytics
- Security audit, GDPR, onboarding wizard, email signature settings
- Inquiry form, project timeline, scheduled review emails

### Meeting Booking System (Mar 18, 2026)
- MeetingType, AvailabilitySchedule, MeetingBooking models
- Full CRUD APIs, public booking page `/book/:userId`
- Slot generation with buffer/conflict detection, confirmation + reminder emails

### UI System v2.0 (Mar 19, 2026)
- **Tailwind Config:** Full brand palette (50-900), surface, border, text, semantic colors, typography scale, spacing tokens, elevation shadows, animations, border radius
- **Global CSS:** Google Fonts import, CSS variables, component classes (.btn, .card, .input, .badge variants)
- **Updated Pages:** Login, Signup, Dashboard, LandingPage, AddLeadModal, PublicBookingPage

### Email Template Redesign v2.0 (Mar 19, 2026)
- **emailDesignSystem.ts:** Centralized email-safe design tokens
- **Base Template:** Updated `getEmailTemplate()` with proper HTML5 email structure
- **Key Emails Updated:** All 29+ emails use consistent v2.0 text colors
- **Shared Styles:** `primaryButtonStyle` and `successButtonStyle` replaced old gradient buttons

### Email Preview Endpoint (Mar 19, 2026)
- **emailPreview.ts:** Dev-only route at `/api/preview-email` with gallery page and 23 individual template previews

### File Upload Notifications System (Mar 19, 2026)
- **Schema:** Added `FileCategory` enum, `FileComment` model, extended `File` model
- **Auto-categorization:** `fileCategorizationService.ts` classifies files by filename patterns
- **File comments:** CRUD endpoints at `/api/files/:fileId/comments`
- **Review workflow:** PATCH endpoints for manual overrides
- **Email notification:** `sendFileUploadNotification` triggered when clients upload via portal
- **Frontend:** FileCategoryBadge, FileComments components, enhanced LeadDetailModal Files tab

### Google Calendar Integration (Mar 20, 2026)
- **CalendarConnection model:** Stores OAuth tokens per user with auto-refresh
- **googleCalendarService.ts:** OAuth flow, freebusy availability check, event CRUD
- **Routes:** `/api/google-calendar/auth-url`, `/callback`, `/status`, `/disconnect`
- **Booking integration:** Availability check, auto-creates calendar event on booking

### Google Calendar Sync Enhancement (Mar 20, 2026)
- **getBusySlots:** Freebusy API fetches busy time ranges
- **Slot generation:** Merges Google Calendar busy slots into available times
- **Frontend indicator:** Green sync indicator on booking page

### Comprehensive 11-Issue Fix (Mar 21, 2026)
1. Landing page: Full-screen dark bg `#1A1A2E`
2. KanbanBoard cards: Service badge visible text
3. QuotesTab: Singular labels
4. Review Contract: Button opens lead modal on contracts tab
5. DeliverablesTab: Emerald colors for READY/DELIVERED
6. Active Commissions: Shows all non-BOOKED/LOST leads
7. Client Portal footer: "Powered by KOLOR STUDIO"
8. Contract titles: Industry-specific titles
9. Loading spinner: Brand-colored animation
10. Skip link: Hidden off-screen by default

### Google Calendar Dashboard Widget (Mar 21, 2026) - NEW
- **CalendarConnectionWidget.tsx:** Prominent dashboard widget with two states:
  - **NOT CONNECTED:** Purple gradient CTA with Google logo, benefits list (Real-time sync, Auto-create events, Prevent conflicts), and "Connect Calendar" button
  - **CONNECTED:** Green border card with CalendarCheck icon, sync status, benefits confirmed, and subtle "Disconnect" option
- **Dashboard integration:** Widget placed after Revenue Pipeline for maximum visibility
- **Dismissible:** Users can dismiss the CTA with localStorage persistence
- **OAuth callback handling:** Dashboard detects `?calendar=connected` and shows success state
- **Settings kept:** SchedulingSettings still has Google Calendar section with tip text pointing to dashboard

## Prioritized Backlog

### P0 (Next Up)
- [x] Google Calendar integration for booking system (DONE)
- [x] Google Calendar sync to booking page (DONE)
- [x] Google Calendar Dashboard Widget (DONE)

### P1
- [ ] Mobile responsiveness polish
- [ ] Landing page redesign (if user requests)

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend)
- [ ] Visual Sequence Builder (post-beta)
- [ ] Meeting booking widget embed code
- [ ] Design Tokens Reference Page (live style guide)
- [ ] "Smart Inbox" view for files needing review
- [ ] "File Request" feature
- [ ] "Smart Scheduling" feature

## Test Reports
- iteration_76: Meeting Booking System (backend 19/19, frontend 100%)
- iteration_77: UI System v2.0 (frontend 100%)
- iteration_78: Email Template Redesign (backend 14/14)
- iteration_79: File Upload Notifications Part 1 (backend 18/18, 100%)
- iteration_80: File Management Frontend UI (backend 100%, frontend 100%)
- iteration_81: Google Calendar Integration (backend 14/14, frontend 100%)
- iteration_82: Google Calendar Sync to Booking Page (backend 13/13, 100%)
- iteration_83: Comprehensive 11-Issue Fix (backend 100%, frontend 100%)
- iteration_84: Google Calendar Dashboard Widget (backend 7/7 100%, frontend 100%)

## Test Credentials
- bookingtest@test.com / password123 (User ID: cmmw4gvhr0000msmu77aijfb9)
