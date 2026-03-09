# KOLOR STUDIO - Product Requirements Document

## Original Problem Statement
Build a comprehensive full-stack CRM ("KOLOR STUDIO") for creative professionals. The system automates the client workflow from inquiry to payment using an "Autopilot" pipeline.

## Core Architecture
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage
- **Email:** Resend
- **Payments:** Stripe (dual-mode: SDK + Python proxy fallback)
- **Hosting:** Preview on Emergent Platform

## What's Been Implemented

### Phase 1: Core CRM (Complete)
- User auth (register/login/JWT)
- Lead management with Kanban board
- Client portal with unique links
- Messaging system (client<->creative)

### Phase 2: Autopilot Pipeline (Complete)
- Quote creation, sending, and acceptance
- Automatic contract generation on quote acceptance
- Automatic email notifications on key events
- Stripe payment integration (deposit collection)
- Revenue pipeline dashboard widget

### Phase 3: Pre-Beta Polish (Complete — March 9, 2026)
- **Weekly Autopilot Digest Email:** Cron job (Mondays 9 AM) sends pipeline stats, revenue, action items. Skips if no activity. Preview/manual trigger at `/api/digest/preview` and `/api/digest/send`.
- **Interactive Walkthrough/Setup Wizard:** 5-step OnboardingWizard component for new users (0 leads). Skippable, completion saved to localStorage. "Restart Tutorial" option in Settings.
- **Color Branding Persistence:** BrandThemeContext caches to localStorage for instant load. API saves/loads brand colors via `/api/settings/brand`.
- **Portal Background Readability:** Fixed purple colors (#7c3aed, #9333ea) replace dynamic brand-primary for reliable WCAG AA contrast. Neutral slate/white background, visible card borders.

## Key Test Accounts
- Test user: test@test.com / Test123456!
- Test Portal: /portal/gbi5z98i5sgz5txo6stgtb

## API URL
- https://studio-wizard-4.preview.emergentagent.com

## Prioritized Backlog

### P2 — Future Tasks
- Client Onboarding Email Drip (automated email sequence for new clients)
- Sequences Dashboard UI (creatives build/manage email follow-up sequences)
- Project Timeline Modal (enhance existing timeline functionality)
- Verify Revenue Analytics accuracy
- Verify Portal Views Analytics

### P3 — Nice to Have
- Mobile-responsive optimization pass
- Dark mode for client portal
- File sharing in client portal
- Client feedback/rating system
