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
│   ├── prisma/schema.prisma         # AuditLog model added
│   └── src/
│       ├── routes/
│       │   ├── auth.ts              # Password reset hardened
│       │   ├── leads.ts             # Audit log on delete
│       │   ├── user.ts              # NEW: GDPR account deletion
│       │   └── ...
│       ├── services/
│       │   ├── auditService.ts      # NEW: Audit logging service
│       │   ├── email.ts             # Console.logs cleaned
│       │   └── ...
│       └── server.ts                # User routes registered
└── frontend/
    └── src/
        ├── components/
        │   ├── AccountDangerZone.tsx # NEW: GDPR delete UI
        │   ├── SettingsModal.tsx     # Account tab added
        │   └── ...
        ├── pages/
        │   ├── LandingPage.tsx       # Rewritten (6 sections)
        │   └── ...
        └── ...
```

## Design System (Visual Identity)
### Color System
- **Purple Scale**: #7C3AED (primary), #6D28D9 (hover), #5B21B6 (pressed)
- **Light Neutrals**: #FFFFFF, #FAFAFA, #F5F5F5, #E5E5E5, #D4D4D4
- **Text Hierarchy**: #1A1A2E (primary), #6B7280 (secondary), #9CA3AF (tertiary)
- **Workflow Status**: Amber (quote) → Indigo (contract) → Blue (deposit) → Cyan (progress) → Green (complete)
- **Semantic**: Success (#10B981), Warning (#F59E0B), Error (#EF4444), Info (#3B82F6)

## Completed Features (All Sessions)
- Full CRM pipeline (leads, kanban, list view)
- Quote builder with templates, PDF export, public quote pages
- Contract management, Deliverables tracking
- Client portal with messaging
- Calendar views (month, week, day, agenda)
- Email composer with CC/BCC
- Brand settings with live preview, Portfolio management
- Revenue dashboard and analytics
- Email sequences (onboarding drip, quote follow-up)
- Email open tracking via 1x1 pixel, Weekly digest emails
- Interactive onboarding wizard and tours
- Mobile responsive with bottom nav
- Cookie consent, privacy policy, terms of service
- Industry-specific onboarding and widgets
- CRM alerts, smart suggestions, testimonials management
- Settings modal with currency configuration
- QR code sharing for inquiry forms

## Recently Completed (March 2026)
### Icon Migration & Build Fix
- Fixed 1200+ TypeScript errors from corrupted icon migration
- Completed Phosphor icon migration with strategic weight hierarchy

### Complete Visual Redesign (Dark → Light)
- New Tailwind config with complete color/gradient/shadow design token system
- All 580+ hardcoded dark colors replaced with design tokens
- Updated email templates with brand voice
- New EmptyState, StatusBadge, Button components

### Landing Page Rewrite (P0) ✅
- 6-section layout: Hero, Problem, Solution, How It Works, Pricing, Final CTA
- Framer Motion animations, Phosphor icons, mobile responsive
- **Tested: 44/44 frontend tests passed (100%)**

### Security Audit (P1) ✅
- **Audit Logging System**: AuditLog Prisma model + auditService.ts
  - Logs: DELETE_LEAD, PAYMENT_RECEIVED, ACCOUNT_DELETED, PASSWORD_RESET, QUOTE_DELETED, FILE_DELETED
  - Captures userId, action, entity, entityId, metadata, ipAddress, userAgent
- **GDPR Account Deletion**: DELETE /api/user/account
  - Password verification required, audit log before cascade delete
  - Account tab in Settings modal with Danger Zone UI
- **Console.log Cleanup**: Removed ~115 debug console.logs from production paths
  - Only server startup logs and console.error remain
- **NPM Audit Fix**: Backend 0 vulnerabilities, frontend 2 moderate (react-quill dev dep)
- **Password Reset Hardening**:
  - Minimum 8 characters, common password rejection, same-password prevention
  - Audit logging on successful reset
- **Tested: 8/8 backend + 11/11 frontend tests passed (100%)**

### Bug Fix: Delete Account Cascade (March 2026) ✅
- **Root cause**: 5 Prisma User relations were missing `onDelete` rules (Activity.user, Booking.createdBy, Lead.assignedTo, Message.sender, Quote.createdBy)
- **Fix**: Added `onDelete: Cascade` for required relations, `onDelete: SetNull` for optional
- **Route audit**: All 15+ API routes verified as properly mounted and accessible
- **Tested: 10/10 backend + 11/11 frontend tests passed (100%)**

## Upcoming Tasks (Priority Order)
1. **(P2) Polish & Mobile:**
   - Thorough mobile responsiveness review across all pages
   - Refine loading/error/empty states
   - Add subtle CSS animations and transitions

2. **(P3) Domain & Launch Prep:**
   - Configure production domains (kolorstudio.app, api.kolorstudio.app)
   - Set up SPF/DKIM for email (Resend)

3. **(Backlog - Post-Beta) Visual Sequence Builder:**
   - Drag-and-drop email automation sequence builder

## Key DB Schema
- **User**: id, email, password, firstName, lastName, studioName, role, preferences, ...
- **Lead**: id, clientName, clientEmail, serviceType, projectTitle, status, ...
- **Quote**: id, quoteNumber, total, status, leadId, ...
- **Contract**: id, title, content, status, leadId, ...
- **AuditLog**: id, userId, action, entity, entityId, metadata, ipAddress, userAgent, createdAt

## Key API Endpoints
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/reset-password` — Reset password (hardened)
- `GET /api/leads` — Get all leads
- `DELETE /api/leads/:id` — Delete lead (audit logged)
- `DELETE /api/user/account` — GDPR account deletion
- `GET /api/analytics/dashboard` — Dashboard stats
- `GET /api/sequences` — Email sequences

## Test Credentials
- Email: `security@test.com`
- Password: `TestPass123!`
