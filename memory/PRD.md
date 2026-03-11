# KOLOR STUDIO — Product Requirements Document

## Original Problem Statement
Build a comprehensive full-stack CRM, "KOLOR STUDIO," for creative professionals (photographers, videographers, designers, illustrators, visual artists). The platform manages leads, quotes, contracts, payments, client portals, and automated email sequences.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **Icons**: `@phosphor-icons/react` (app-level), `lucide-react` (shadcn/ui internal only)
- **Email**: Resend
- **Payments**: Stripe
- **Analytics**: Vercel Analytics
- **Tours**: Driver.js
- **Scheduling**: node-cron

## Architecture
```
/app/kolor-studio-v2/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/ (auth, crm, analytics, sequences, tracking, etc.)
│       ├── services/ (email, digest, onboarding, quoteFollowUp, emailTracking)
│       ├── middleware/ (auth)
│       └── server.ts
└── frontend/
    └── src/
        ├── components/ (40+ components)
        ├── pages/ (15+ pages)
        ├── services/api.ts
        ├── contexts/BrandThemeContext.tsx
        └── utils/ (analytics, currency)
```

## Completed Features
- Full CRM pipeline (leads, kanban, list view)
- Quote builder with templates, PDF export, public quote pages
- Contract management
- Deliverables tracking
- Client portal with messaging
- Calendar views (month, week, day, agenda)
- Email composer with CC/BCC
- Brand settings with live preview
- Portfolio management and public portfolio
- Revenue dashboard and analytics
- Email sequences (onboarding drip, quote follow-up)
- Sequences dashboard with open rate tracking
- Email open tracking via 1x1 pixel
- Weekly digest emails
- Interactive onboarding wizard and tours
- Mobile responsive with bottom nav
- Cookie consent, privacy policy, terms of service
- Industry-specific onboarding and widgets
- CRM alerts and smart suggestions
- Testimonials management
- Settings modal with currency configuration
- QR code sharing for inquiry forms

## Recently Completed (March 2026)
- **P0: Fixed Broken Frontend Build** — Resolved 1200+ TypeScript errors caused by corrupted icon migration script. Fixed icon imports, type name corruption, and text content corruption across 40+ files.
- **P1: Completed Phosphor Icon Migration** — All app-level icons migrated from `lucide-react` to `@phosphor-icons/react` with strategic weight hierarchy: `fill` for active states, `duotone` for stat cards/empty states, `bold` for primary CTAs, `regular` for default.

## Upcoming Tasks (P2)
- **UI for Custom Sequences**: Allow creatives to build and manage their own email follow-up sequences
- **Project Timeline Modal**: Enhance the functionality of the existing timeline modal

## Test Credentials
- Email: `test-user-a@test.com`
- Password: `password`

## Key API Endpoints
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login
- `GET /api/leads` — Get all leads
- `GET /api/analytics/dashboard` — Dashboard stats
- `GET /api/sequences` — Email sequences
- `GET /track/open/:trackingId` — Email open tracking pixel

## Icon Weight Strategy
- **`fill`**: Active/selected navigation states
- **`duotone`**: Stat cards, empty states, decorative headers
- **`bold`**: Primary CTAs (Send, Save, Add, Download)
- **`regular`**: Default navigation and informational icons
- **Note**: `lucide-react` kept ONLY for internal shadcn/ui components
