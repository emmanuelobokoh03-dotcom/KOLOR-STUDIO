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

### Email Template Redesign v2.0 (Mar 19, 2026) - NEW
- **emailDesignSystem.ts:** Centralized email-safe design tokens (colors, fonts, spacing, radius, shadows, button styles, HTML block helpers)
- **Base Template:** Updated `getEmailTemplate()` with proper HTML5 email structure, MSO fallbacks, responsive media queries, Bricolage Grotesque + Instrument Sans fonts, v2.0 color system
- **Key Emails Updated:** sendNewLeadNotification, sendQuoteEmail, sendQuoteAcceptedNotification, sendContractAgreedNotification, sendVerificationEmail, sendMeetingConfirmationEmail, sendMeetingNotificationToOwner, sendMeetingReminderEmail
- **Bulk Color Update:** All 29+ emails now use consistent v2.0 text colors (#1A1A2E primary, #6B7280 secondary, #9CA3AF tertiary)
- **Shared Styles:** `primaryButtonStyle` and `successButtonStyle` replaced old gradient buttons across all autopilot emails
- **Reusable Components:** highlightBox, successBox, warningBox, infoBox, cardBlock, detailRow

### Email Preview Endpoint (Mar 19, 2026)
- **emailPreview.ts:** Dev-only route at `/api/preview-email` with gallery page and 23 individual template previews
- **Gallery:** Card-based UI with USER/CLIENT badges, click-to-preview
- **Guard:** `NODE_ENV !== 'production'` prevents exposure in production

### File Upload Notifications System - Part 1 (Mar 19, 2026)
- **Schema:** Added `FileCategory` enum (REFERENCE, LEGAL, PAYMENT, DELIVERABLE, REVISION, ASSET, OTHER), `FileComment` model, extended `File` model with `category`, `uploadedByType`, `uploadedByName`, `requiresReview`, `reviewStatus`, `reviewedAt`
- **Auto-categorization:** `fileCategorizationService.ts` classifies files by filename patterns (contract->LEGAL, invoice->PAYMENT, mood->REFERENCE, final->DELIVERABLE, etc.)
- **File comments:** CRUD endpoints at `/api/files/:fileId/comments` with ownership validation
- **Review workflow:** PATCH `/api/files/:fileId/category` and `/api/files/:fileId/review` for manual overrides
- **Email notification:** `sendFileUploadNotification` triggered when clients upload via portal
- **Activity logging:** FILE_COMMENT activity type added

## Prioritized Backlog

### P0 (Next Up)
- [ ] File Upload Notifications System - Part 2 (Frontend UI: file categories, comments UI, review workflow)
- [ ] Google Calendar integration for booking system

### P1
- [ ] Mobile responsiveness polish
- [ ] Landing page redesign (if user requests)

### P2 (Future)
- [ ] Domain & launch prep (SPF/DKIM for Resend)
- [ ] Visual Sequence Builder (post-beta)
- [ ] Meeting booking widget embed code
- [ ] Design Tokens Reference Page (live style guide)

## Test Reports
- iteration_76: Meeting Booking System (backend 19/19, frontend 100%)
- iteration_77: UI System v2.0 (frontend 100%)
- iteration_78: Email Template Redesign (backend 14/14, all API paths verified)
- iteration_79: File Upload Notifications Part 1 (backend 18/18, 100%)

## Test Credentials
- bookingtest@test.com / password123 (User ID: cmmw4gvhr0000msmu77aijfb9)
