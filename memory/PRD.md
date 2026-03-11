# KOLOR STUDIO — Product Requirements Document

## Original Problem Statement
Build a comprehensive full-stack CRM, "KOLOR STUDIO," for creative professionals (photographers, videographers, designers, illustrators, visual artists). The platform manages leads, quotes, contracts, payments, client portals, and automated email sequences.

**Brand Positioning:** "Your CRM Should Work Harder Than You Do"
**Design Philosophy:** First CRM that creatives are PROUD to use, not just tolerate.

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
        ├── components/ (40+ components including EmptyState, StatusBadge)
        ├── pages/ (15+ pages)
        ├── services/api.ts
        ├── contexts/BrandThemeContext.tsx
        └── utils/ (analytics, currency)
```

## Design System (Visual Identity)
### Color System
- **Purple Scale**: #7C3AED (primary), #6D28D9 (hover), #5B21B6 (pressed)
- **Light Neutrals**: #FFFFFF, #FAFAFA, #F5F5F5, #E5E5E5, #D4D4D4
- **Text Hierarchy**: #1A1A2E (primary), #6B7280 (secondary), #9CA3AF (tertiary)
- **Workflow Status**: Amber (quote) → Indigo (contract) → Blue (deposit) → Cyan (progress) → Green (complete)
- **Semantic**: Success (#10B981), Warning (#F59E0B), Error (#EF4444), Info (#3B82F6)

### Gradients
- Brand: purple-500 → purple-400 → purple-300 (CTAs, heroes)
- Creative: purple → cyan → green (pipeline progression)
- Hero: dark-900 → purple-500 (landing pages)

### Elevation System
- elevation-1: Subtle (default cards)
- elevation-2: Hover (interactive cards)
- elevation-3: Elevated (modals, important)

### Icon Weight Hierarchy
- `fill`: Active/selected states
- `duotone`: Stat cards, empty states, decorative
- `bold`: Primary CTAs
- `regular`: Default navigation

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
- **P0: Fixed Broken Frontend Build** — Resolved 1200+ TypeScript errors from corrupted icon migration
- **P1: Completed Phosphor Icon Migration** — Strategic weight hierarchy applied
- **Complete Visual Redesign** — Dark-to-light theme transformation:
  - New Tailwind config with complete color system
  - All 580+ hardcoded dark colors replaced with design tokens
  - Light, sophisticated theme (not dark/techy)
  - Workflow status colors (amber→indigo→blue→cyan→green)
  - Brand gradient CTA buttons
  - Elevation shadow system
  - Updated email templates with brand voice
  - New EmptyState and StatusBadge components

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
