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
- Brand-adaptive public portfolio, inquiry form, and booking page (creator's brand tokens)
- Brand Settings tab: logo upload, color pickers, font selector, live preview
- Lead management with CRUD, status tracking, discovery calls
- Quote builder, contract management, file sharing
- Client portal with approval workflow, celebration states
- Email integration (Resend) with V2.0 branded design system
- Calendar integration (Google Calendar)
- Settings page: Profile, Brand, Notifications, Integrations, Account

## Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + Phosphor Icons
- **Backend**: Express.js + Prisma + PostgreSQL + node-cron
- **3rd Party**: Resend (email), Google Calendar, Sentry (stub), Plausible (stub)

## Architecture
```
/app/kolor-studio-v2/
├── backend/
│   ├── prisma/schema.prisma          ← Brand defaults: #6C2EDB / #E8891A
│   ├── src/
│   │   ├── routes/
│   │   │   ├── calendar.ts
│   │   │   ├── portfolio.ts          ← Brand fields in public endpoint
│   │   │   ├── settings.ts           ← PATCH accepts brand fields
│   │   │   ├── public-booking.ts     ← Returns brand tokens
│   │   │   └── ...
│   │   └── services/
└── frontend/
    ├── index.html                    ← Google Fonts: Inter, Fraunces, Playfair, Montserrat, Libre Baskerville
    ├── src/
    │   ├── pages/
    │   │   ├── PublicBookingPage.tsx  ← REDESIGNED: brand-adaptive, branded header
    │   │   ├── PublicPortfolio.tsx    ← REDESIGNED: brand-adaptive
    │   │   ├── SubmitInquiry.tsx      ← REDESIGNED: industry-adaptive
    │   │   ├── Settings.tsx          ← UPDATED: Brand tab with BrandPreview, PortfolioSettings, SharePortfolio
    │   │   ├── Calendar.tsx
    │   │   ├── Dashboard.tsx
    │   │   └── ...
    │   ├── components/
    │   │   ├── BrandPreview.tsx       ← Wired into Brand tab
    │   │   ├── PortfolioSettings.tsx  ← Bug fixes: modal bg, text artifacts
    │   │   └── SharePortfolio.tsx     ← Wired into Brand tab
    │   └── services/
    │       └── api.ts
    └── public/
```

---

## What's Been Implemented

### Iterations 100-104: Dashboard, Leads, Quote Builder
### Iteration 105: Contracts Page + Client Portal Redesign (Mar 30)
### Iteration 106: Email Design System V2.0 + 29 Templates + Scheduler (Mar 30)
### Iteration 107: Calendar Page (Mar 30)
### Iteration 108a: Public Portfolio + Inquiry Form — Brand-Adaptive Redesign (Mar 31)
### Iteration 108b: Public Booking Page — Brand Token Integration (Mar 31)

**Changes:**
- Branded header: logo/initials + studio name, always visible across all 4 booking steps
- Page background → `#F9F7FE` (warm off-white, consistent across all public surfaces)
- Step indicator: 4 minimal dots (filled=complete, ring=current, muted=future)
- All hardcoded `purple-*` Tailwind classes → inline styles using `primaryColor`
- Input focus: `focusedField` state with `borderColor: primaryColor` + `boxShadow`
- Time slot hover: React state `hoveredTime` + inline styles (no Tailwind hover classes)
- Timezone display on date step + confirmation screen
- Confirmation footer: "Powered by KOLOR Studio" (not studio name)
- `accentColor`, `brandLogoUrl` derived from API response
- 44px min touch targets, mobile stacking at ≤375px

### Iteration 108c: Brand Settings Tab (Mar 31)

**Backend:**
- `PATCH /api/settings` now accepts and persists: `brandPrimaryColor`, `brandAccentColor`, `brandFontFamily`, `brandLogoUrl`
- Prisma schema defaults updated: `#A855F7` → `#6C2EDB`, `#EC4899` → `#E8891A`
- `GET /api/settings/brand` default values updated to match

**Frontend — Settings.tsx:**
- 5 tabs: Profile → **Brand** → Notifications → Integrations → Account
- **Brand identity section**: Logo upload (via `/api/settings/brand/logo`), Primary/Accent color pickers (native color input + hex text input), Font picker (5 curated Google Fonts as pill radio buttons)
- **Live preview section**: BrandPreview component (Portfolio/Quotes/Portal tabs)
- **Portfolio management section**: PortfolioSettings (upload/manage works) + SharePortfolio (link + QR code)
- "Save brand" button reuses existing `saveSettings()` function

**Bug fixes:**
- PortfolioSettings: modal `bg-slate-900` → `bg-[var(--surface-base)]`
- PortfolioSettings: "UploadSimple Your First Work" → "Upload Your First Work"
- PortfolioSettings: "UploadSimple your best work..." → "Upload your best work..."

**Google Fonts added to index.html**: Playfair Display, Montserrat, Libre Baskerville

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
- `GET /api/book/:userId` — Public booking page data (brand tokens + meeting types)
- `PATCH /api/settings` — Save settings (now includes brand fields)
- `GET /api/settings/brand` — Get brand settings
- `POST /api/settings/brand/logo` — Upload brand logo
- `GET /api/calendar/events` — Derived + manual calendar events
- `GET /api/calendar/google-events` — Google Calendar events
- `POST /api/calendar/events` — Create manual event
- `DELETE /api/calendar/events/:id` — Delete manual event
