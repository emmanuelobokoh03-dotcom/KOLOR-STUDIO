# KOLOR STUDIO — Product Requirements Document

## Original Problem Statement
A full-stack CRM for creative professionals (Photography, Design, Fine Art) with lead management, quoting, contracts, scheduling, client portal, portfolio, email automation sequences, and a conversion-optimized landing page.

## Core Architecture
```
/app/kolor-studio-v2/
├── backend/     (Express + Prisma + PostgreSQL)
│   ├── prisma/schema.prisma
│   ├── src/routes/
│   ├── src/services/
│   └── src/scheduler.ts
└── frontend/    (React 19 canary + Vite + Tailwind + Shadcn)
    ├── src/pages/
    ├── src/components/
    └── src/index.css
```

## Tech Stack
- **Frontend**: React 19 (canary with ViewTransitions), Vite, Tailwind CSS, Shadcn/UI, @number-flow/react, Space Mono + Raleway fonts
- **Backend**: Express, Prisma ORM, PostgreSQL
- **Integrations**: Resend (email), Google Calendar (OAuth)
- **Auth**: HTTP-Only cookie-based sessions with "Remember Me"

## What's Been Implemented

### Core CRM Features (Complete)
- Lead pipeline (Kanban + List views)
- Quote builder with PDF generation
- Contract/Booking Agreement management
- Calendar with Google Calendar sync
- Client portal with file delivery
- Portfolio management
- Email automation sequences
- Settings with brand customization
- Industry-specific language (Photography/Design/Fine Art)

### Design Elevation (Complete — Iteration 111)
- Eliminated generic AI gradients
- NumberFlow animated dashboard stats
- Asymmetric bento grid for features
- Structural left-border card hovers
- Radial SVG hero background
- React ViewTransitions between views
- Infinite CSS marquee testimonials

### Landing Page (Complete — LandingPageV2)
- 8-section conversion-optimized page
- Animated stats, countdown timer
- Real screenshot mockups (WebP)
- Fine Art testimonial parity

### Automation Hardening (Complete — Iteration 110)
- Fixed Prisma connection leaks (singleton)
- Unsubscribe token endpoints
- Inquiry acknowledgement emails
- Quote reminder scheduling
- Stale lead nudge emails

### Mobile Responsiveness Polish (Complete — Iteration 113)
- **Calendar**: Month view 44px touch targets, Week view 3-day mobile mode with navigation, view switcher 44px buttons
- **Contracts**: Card layout on mobile (flex col), hidden table header, always-visible quick actions, 44px tab/button targets
- **Settings**: Scrollable mobile tabs, single-column industry buttons, 44px color pickers/toggles/font pills, responsive brand preview height
- **Dashboard**: Added Quotes + Contracts to mobile hamburger nav, fixed horizontal overflow at 375px and 768px
- **All pages**: Zero horizontal overflow at 375px (iPhone) and 768px (iPad), 44px minimum touch targets

## Prioritized Backlog

### P1 — Upcoming
- Launch Prep: Production domains, DNS (SPF/DKIM for Resend)

### P2 — Future
- Wire real historical trend data to StatCard sparklines
- Meeting booking widget embed code
- "Smart Inbox" view for files needing review
- "File Request" feature
- Visual Sequence Builder
- A/B test landing page hero copy variants

## Test Credentials
- Email: bookingtest@test.com
- Password: password123

## Key API Endpoints
- `GET /api/unsubscribe/:token` — Public unsubscribe
- `GET /health` — Health check
- All `/api/` routes protected by auth middleware

## 3rd Party Integrations
- Resend (transactional emails)
- Google Calendar (OAuth scheduling)
