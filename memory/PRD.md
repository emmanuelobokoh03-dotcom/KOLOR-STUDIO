# KOLOR STUDIO — Product Requirements Document

## Original Problem Statement
A full-stack CRM for creative professionals (photographers, designers, fine artists) with features including lead management, quotes, contracts, booking, calendar integration, client portal, and industry-specific terminology.

## User Personas
- **Photographers** — Manage shoots, send quotes, track bookings
- **Designers** — Manage projects, proposals, contracts
- **Fine Artists** — Manage commissions, offers, deliveries

## Core Requirements
- Secure HTTP-Only cookie authentication with "Remember Me"
- Industry-specific UI language (via `industryLanguage.ts`)
- 2-step signup with industry selection
- Dashboard with Kanban, List, Analytics, Portfolio, Quotes, Contracts views
- Standalone Calendar page with Month/Week/List views
- Lead management with CRUD, status tracking, discovery calls
- Quote builder, contract management, file sharing
- Client portal with approval workflow, celebration states
- Email integration (Resend) with V2.0 branded design system
- Calendar integration (Google Calendar)
- Settings page with profile, notifications, integrations, account

## Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + Phosphor Icons
- **Backend**: Express.js + Prisma + PostgreSQL + node-cron
- **3rd Party**: Resend (email), Google Calendar, Sentry (stub), Plausible (stub)

## Architecture
```
/app/kolor-studio-v2/
├── backend/
│   ├── prisma/schema.prisma          ← CalendarEvent model added
│   ├── src/
│   │   ├── routes/
│   │   │   ├── calendar.ts           ← NEW: Calendar events API
│   │   │   ├── googleCalendar.ts     ← Google OAuth flows
│   │   │   ├── auth.ts
│   │   │   ├── contracts.ts
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── googleCalendarService.ts ← Token refresh logic
│   │   │   ├── email.ts
│   │   │   └── emailDesignSystem.ts
│   │   └── scheduler.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Calendar.tsx           ← NEW: Standalone calendar page
    │   │   ├── Dashboard.tsx
    │   │   ├── Contracts.tsx
    │   │   ├── Settings.tsx
    │   │   └── ...
    │   ├── App.tsx                    ← /calendar route added
    │   ├── components/
    │   │   └── MobileBottomNav.tsx    ← Calendar navigates to /calendar
    │   └── services/
    │       └── api.ts                 ← calendarApi added
    └── public/
```

---

## What's Been Implemented

### Iterations 100-102: Dashboard, Quick Actions, Landing Page Enhancements
### Iteration 103: Leads Page + Lead Detail Modal Full Rebuild
### Iteration 104: Quote Builder Premium UI + Quotes List View
### Iteration 105: Contracts Page + Client Portal Redesign + Automation Wiring (Mar 30)
### Iteration 106: Email Design System V2.0 + 29 Templates + Settings + Scheduler (Mar 30)
### Iteration 107: Calendar Page (Mar 30)

**Backend:**
- New `CalendarEvent` Prisma model (id, userId, leadId, title, eventType, date, startTime, endTime, allDay, notes, googleEventId)
- `GET /api/calendar/events` — Dynamically derives KOLOR events from Leads (keyDate, shootingDate, deliveryDate, editingDeadline, eventDate), Quotes (validUntil expiry), Contracts (sentAt), Bookings, and manual CalendarEvents
- `GET /api/calendar/google-events` — Fetches personal Google Calendar events with graceful token refresh; returns `{ connected: false, events: [] }` if not connected or token expired
- `POST /api/calendar/events` — Creates manual events in CalendarEvent table; auto-syncs to Google Calendar if connected
- `DELETE /api/calendar/events/:id` — Deletes manual events; also removes from Google Calendar if synced

**Frontend:**
- New standalone `/calendar` route with `Calendar.tsx` page
- Month view (grid with day cells showing events), Week view (7-column with time indicators), List view (events grouped by date)
- Side panel for event details (title, date, time, client, notes, meta info, actions)
- Event creation modal (title, date, all-day toggle, start/end time, notes)
- Google Calendar toggle (show/hide external events)
- Industry-aware event labels using `getIndustryLanguage()`
- Dashboard sidebar, toolbar, and MobileBottomNav all navigate to `/calendar` route

**Testing: 100% backend (11/11), 100% frontend — All tests passed**

---

## Prioritized Backlog

### P1
- Mobile responsiveness polish for Calendar + Contracts + Settings
- Launch Prep: Production domains, DNS (SPF/DKIM for Resend)

### P2
- Wire real historical trend data to StatCard sparklines
- Meeting booking widget embed
- "Smart Inbox" view for files needing review
- "File Request" feature
- Visual Sequence Builder
- A/B test landing page hero copy
- "Smart Scheduling" feature

## Test Credentials
- email: `bookingtest@test.com`, password: `password123`

## Key API Endpoints
- `GET /api/calendar/events` — Derived + manual calendar events
- `GET /api/calendar/google-events` — Google Calendar events (graceful fallback)
- `POST /api/calendar/events` — Create manual event
- `DELETE /api/calendar/events/:id` — Delete manual event
- `GET /api/settings` — User settings with notification prefs
- `PATCH /api/settings` — Save profile + notification prefs
- `POST /api/auth/change-password` — Change password (authenticated)
- `GET /api/contracts/all` — All contracts for user
