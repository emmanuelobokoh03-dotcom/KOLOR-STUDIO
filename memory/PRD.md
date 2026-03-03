# KOLOR STUDIO v2 - Product Requirements Document

## Original Problem Statement
Build a CRM platform for creative professionals with JWT authentication, Lead Pipeline management, email notifications, and activity tracking.

## Project Overview
A CRM platform built for photographers, designers, and videographers. "The CRM that doesn't feel like a CRM."

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + react-big-calendar
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Email**: Resend for transactional emails
- **Storage**: Supabase Storage for file/image uploads

## What's Been Implemented (All Phases Complete)

### Core Features (Phases 1-13) - All DONE
- JWT Authentication (signup, login, password reset)
- Lead Pipeline (CRUD, Kanban board, List view, public inquiry form)
- Email Notifications (Resend integration, branded templates)
- Activity Logging System
- File Attachments (Supabase Storage)
- Client Portal (token-based public access)
- Status Change Notifications
- Quote/Proposal System with PDF export and international currency
- Dark Theme
- Share Inquiry Form (QR code generation)

### Advanced Features (Phases 14-24) - All DONE
- Revenue Analytics Dashboard (Recharts)
- Calendar View (react-big-calendar)
- Quote Templates
- Custom Email Composer (react-quill)
- Legal Pages (Privacy, Terms, Cookie Consent)
- Vercel Analytics
- Support Infrastructure (Help menu, Feedback modal)
- Landing Page Enhancements (Testimonials, FAQ, etc.)
- Analytics Interactivity (clickable stats filter Kanban)
- Professional Booking System (full CRUD with calendar integration)

### Phase 25: Portfolio System DONE (Mar 3, 2026)
- [x] Portfolio model in Prisma schema
- [x] Full CRUD API: GET/POST/PATCH/DELETE /api/portfolio
- [x] Public portfolio API: GET /api/portfolio/public/:userId
- [x] Toggle featured: PATCH /api/portfolio/:id/featured
- [x] Reorder: PATCH /api/portfolio/reorder
- [x] Image upload to Supabase Storage (portfolio-images bucket)
- [x] Portfolio management page in Dashboard (Portfolio tab)
- [x] Public portfolio page at /portfolio/:userId
- [x] Category filters, Featured toggle
- [x] Image lightbox with keyboard navigation
- [x] Copy link sharing, Preview button
- [x] Masonry grid layout

### Bug Fixes (Mar 3, 2026)
- [x] Fixed DATABASE_URL (password updated)
- [x] Fixed backend route prefixes (all routes now use /api prefix)
- [x] Fixed double-path bug in files.ts routes (/files/:fileId → /:fileId)
- [x] Fixed double-path bug in quotes.ts routes (/quotes/public → /public)
- [x] Fixed frontend deleteFile API call (removed double /api prefix)
- [x] Reset user password hash for test credentials

## Test Credentials
- emmanuelobokoh03@gmail.com / successful26#
- User ID: 3aa2d156-aa26-48ef-8daf-e95641b68b3e

## URLs
- App: https://booking-system-166.preview.emergentagent.com
- Dashboard: /dashboard
- Public Inquiry: /inquiry
- Client Portal: /portal/:token
- Public Quote: /quote/:quoteToken
- Public Portfolio: /portfolio/:userId
- Forgot Password: /forgot-password

## API Endpoints (all prefixed with /api)
- Auth: /api/auth/signup, /api/auth/login, /api/auth/me, /api/auth/forgot-password, /api/auth/reset-password
- Leads: /api/leads (CRUD), /api/leads/stats, /api/leads/submit, /api/leads/:id/status
- Activities: /api/leads/:id/activities, /api/leads/:id/notes
- Files: /api/leads/:id/files, /api/files/:id, /api/files/:id/download
- Portal: /api/portal/:token
- Settings: /api/settings
- Quotes: /api/leads/:id/quotes, /api/quotes/:id, /api/quotes/public/:token
- Analytics: /api/analytics/dashboard, /api/analytics/monthly-trend
- Bookings: /api/bookings (CRUD), /api/bookings/calendar
- Portfolio: /api/portfolio (CRUD), /api/portfolio/public/:userId, /api/portfolio/:id/featured

## Prioritized Backlog

### P1 - Next Up
- [ ] Mobile responsiveness improvements
- [ ] UI/UX polish across all views
- [ ] Big refactor for all creative professional project types & workflows

### P2 - Medium Priority
- [ ] Portfolio sharing integration (link in quote emails, client portal)
- [ ] Recurring calendar events
- [ ] Email verification for signups
- [ ] Logo Upload in Settings

### P3 - Lower Priority
- [ ] Invoice generation from accepted quotes
- [ ] Multi-user team support
- [ ] Messaging/chat system
- [ ] Configurable owner email for lead submission
