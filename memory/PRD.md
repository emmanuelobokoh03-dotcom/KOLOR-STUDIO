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
- Brand-adaptive public portfolio + inquiry form (creator's brand, not KOLOR's)
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
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   │   ├── calendar.ts           ← Calendar events API
│   │   │   ├── portfolio.ts          ← UPDATED: brand fields in public endpoint
│   │   │   ├── googleCalendar.ts
│   │   │   ├── auth.ts
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── googleCalendarService.ts
│   │   │   ├── email.ts
│   │   │   └── emailDesignSystem.ts
│   │   └── scheduler.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── PublicPortfolio.tsx     ← REDESIGNED: brand-adaptive
    │   │   ├── SubmitInquiry.tsx       ← REDESIGNED: industry-adaptive forms
    │   │   ├── Calendar.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Contracts.tsx
    │   │   ├── Settings.tsx
    │   │   └── ...
    │   ├── App.tsx
    │   └── services/
    │       └── api.ts
    └── public/
```

---

## What's Been Implemented

### Iterations 100-104: Dashboard, Leads, Quote Builder
### Iteration 105: Contracts Page + Client Portal Redesign + Automation Wiring (Mar 30)
### Iteration 106: Email Design System V2.0 + 29 Templates + Settings + Scheduler (Mar 30)
### Iteration 107: Calendar Page (Mar 30)

- Full calendar with Month/Week/List views, event creation modal, side panel
- Backend: Dynamic KOLOR event derivation + manual CalendarEvent model
- Google Calendar integration with graceful token refresh
- Testing: 100% backend (11/11), 100% frontend

### Iteration 108a: Public Portfolio + Inquiry Form — Brand-Adaptive Redesign (Mar 31)

**Backend:**
- `GET /api/portfolio/public/:userId` now returns brand fields: `brandPrimaryColor`, `brandAccentColor`, `brandFontFamily`, `brandLogoUrl`, `industry`, `speciality`, `studioName`, `businessName`, `firstName`, `lastName`

**Frontend — PublicPortfolio.tsx (complete redesign):**
- Warm light background (#F9F7FE) replaces dark theme
- All colors use creator's brand tokens via inline styles (no hardcoded KOLOR purple)
- Sticky nav bar with brand logo/initials, Work/Contact links, mobile hamburger
- Hero section: studio name, speciality, "Work with me" + "Book a call" CTAs
- Filter bar: category pills + Featured toggle with brand-colored active states
- Portfolio grid: cards with hover border color in brandPrimary, featured badges
- Testimonials section: industry-aware heading ("What clients/collectors say")
- Inquiry CTA section: "Send an inquiry" → /inquiry?studio=:userId
- Footer: "Powered by KOLOR Studio" — mailto:contact@example.com REMOVED (P0 fix)
- Lightbox: brand-colored category pills
- hasMeetingTypes fetch to conditionally show "Book a call" CTA

**Frontend — SubmitInquiry.tsx (complete redesign):**
- Two-column layout: left panel (creator identity + 3-step timeline), right panel (form)
- Fetches creator brand info on mount via /api/portfolio/public/:studioId
- Industry-adaptive form fields:
  - PHOTOGRAPHY: Type of shoot, Shoot date, Location, How did you find us
  - DESIGN: Type of project, Desired deadline, Budget, Company name
  - FINE_ART: Commission type, Medium, Size, Delivery timeline, Budget
  - Generic fallback: Project Category, Project Type, Project Title, Budget, Timeline
- Industry-adaptive labels ("Tell me about your shoot/project/commission")
- Success state: "Inquiry sent!" / "Brief received!" / "Commission inquiry sent!"
- Success back link goes to /portfolio/:studioId (not "/" home)
- "Book a discovery call" link on success page if meeting types available

**Connected system:**
- `/portfolio/:userId` → `/inquiry?studio=:userId` → lead created in KOLOR
- `/portfolio/:userId` → `/book/:userId` → meeting booked in KOLOR

**Testing: 100% backend (10/10), 100% frontend — All tests passed**

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
- userId: `cmn0umxwx0000k8sy48g5le5u`

## Key API Endpoints
- `GET /api/portfolio/public/:userId` — Public portfolio with brand fields
- `POST /api/portal/submit` — Submit inquiry (creates lead)
- `GET /api/calendar/events` — Derived + manual calendar events
- `GET /api/calendar/google-events` — Google Calendar events
- `POST /api/calendar/events` — Create manual event
- `DELETE /api/calendar/events/:id` — Delete manual event
- `GET /api/settings` — User settings with notification prefs
- `PATCH /api/settings` — Save profile + notification prefs
- `POST /api/auth/change-password` — Change password
- `GET /api/contracts/all` — All contracts for user
