# KOLOR STUDIO - Product Requirements Document

## Overview
A full-stack CRM application for creative professionals (photographers, designers, artists). Built with React/TypeScript frontend + Node.js/Express/Prisma backend + PostgreSQL (Supabase).

## Core Features (All Implemented)
- **Authentication**: JWT-based login/signup with industry onboarding for new users
- **Lead Management**: Full CRUD with Kanban board, list view, search, and filters
- **Booking & Calendar**: Booking system integrated with calendar view
- **Portfolio**: Public-facing portfolio page for showcasing work
- **Workflows**: Custom workflow templates with stages per industry
- **Deliverables**: Track deliverables per lead with status management
- **Analytics Dashboard**: Stats, charts, pipeline views
- **Client Portal**: Shareable portal links for clients to track project status
- **Email Integration**: Notifications via Resend for status changes, new leads
- **Quotes System**: Create and manage quotes for leads
- **Contracts & Consent**: Create contracts from templates, send to clients, client signs via portal
- **Personalized Brand Theme**: Customizable primary/accent colors, fonts, logo — applied app-wide
- **Celebration Modals**: Confetti celebrations for 6 key milestones

## Phase History

### Phase 1: Database Schema Refactor (DONE)
- Added ProjectType, IndustryType, DeliverableType, WorkflowTemplate, WorkflowStage, Deliverable models

### Phase 2: Backend API (DONE)
- CRUD APIs for workflow templates and deliverables
- Updated leads API with new fields and filters

### Phase 3: Frontend UI (DONE)
- Updated Add Lead modal with project/industry selectors
- Deliverables tab in lead detail view
- Dashboard filters for project type and industry

### Phase 4: System Templates & Onboarding (DONE)
- Seed script for default workflow templates
- Industry onboarding flow for new users
- Auto-generation of workflow templates based on selected industry

### Phase 5: UI/UX Polish (DONE - March 3, 2026)
- **Part A**: Personal welcome messages (first login + welcome back with date), clickable KOLOR STUDIO header
- **Part B**: Image-first project cards with coverImage field, upload endpoint, gradient placeholders
- **Part C**: Visual file gallery with responsive grid, image thumbnails, hover overlays with download/delete
- **Part D**: Typography scale (text-3xl titles, #0F0F0F bg, #1A1A1A cards, #FAFAFA headings, #A3A3A3 body)
- **Part E**: Micro-interactions (hover effects, transitions, skeleton loading states, entrance animations)
- **Part F**: Mobile Responsiveness (DONE - March 3, 2026)

### Phase 6B: Contracts & Consent System (DONE - March 4, 2026)
- Contract model with leadId, templateType, title, content, clientAgreed, clientAgreedAt, clientIP, status
- 6 contract templates, Backend API, Frontend ContractsTab, Client Portal, Email Notifications

### Dashboard Visual Polish - Status Colors (DONE - March 4, 2026)
- Updated Kanban column headers to violet-centric palette
- Updated status badges across Dashboard, LeadDetailModal

### Industry-Specific Dashboard Widgets (DONE - March 5, 2026)
- PhotographyWidgets, FineArtWidgets, DesignWidgets with conditional rendering

### User Education System Phase 1 (DONE - March 5, 2026)
- Educational Empty States, Inline Hints, Help Panel

### User Education System Phase 2 (DONE - March 5, 2026)
- Interactive Onboarding Tour (Driver.js), Smart Suggestions, Celebration Moments

### Personalized Brand Theme System (DONE - March 5, 2026)
- **Backend**: Brand settings fields on User model (primaryColor, accentColor, fontFamily, logoUrl)
- **Backend API**: GET/PATCH /api/settings/brand, POST/DELETE /api/settings/brand/logo
- **Frontend BrandThemeContext**: Converts hex to RGB channels, sets CSS variables on document root
- **Frontend BrandSettings UI**: Color pickers, 6 preset palettes, 6 font options, logo upload, live preview
- **Tailwind Config**: Brand colors use `rgb(var(--color-brand-primary-rgb) / <alpha-value>)` format for full opacity support
- **Global Application**: Replaced 820+ hardcoded violet/fuchsia/purple color classes across 41 files with brand-aware CSS variables
- **index.css**: Font uses `var(--font-brand)`, text selection uses brand color, Driver.js theme uses CSS variables
- **Testing**: 100% pass rate (9/9 backend, all frontend verified)

### Celebration Modal Triggers (DONE - March 5, 2026)
- **firstProject**: Fires in Dashboard after AddLeadModal creates first lead
- **firstQuote**: Fires via callback chain QuotesTab → LeadDetailModal → Dashboard after first quote sent
- **quoteAccepted**: Fires on Dashboard init when BOOKED status count > 0
- **firstBooking**: Fires in Dashboard after handleBookingSaved
- **portfolioPublished**: Fires in Portfolio page after first portfolio item creation
- **firstContract**: Fires via callback chain ContractsTab → LeadDetailModal → Dashboard when AGREED contract found
- **Deduplication**: Uses localStorage `celebrated_{key}` to fire each celebration only once
- **Testing**: 100% pass rate (all 6 triggers verified)

### Brand Preview System (DONE - March 5, 2026)
- Inline live preview panel in Brand Settings (settings left, preview right on desktop)
- 3 tabbed previews: Portfolio, Quote, Client Portal — each shows realistic mini mockups
- Live updates as user changes colors, fonts, or logo (no save required)
- Settings modal widens to max-w-5xl when Brand tab is active
- Uses inline styles for preview elements to avoid CSS variable feedback loops
- **Testing**: 100% pass rate (12/12 features verified)

### CRM + Revenue Dashboard — Phase 1 (DONE - March 5, 2026)
- **Database Schema**: Added PipelineStatus enum, Interaction model, Income model, CRM fields on Lead (pipelineStatus, lastContactedAt, nextFollowUpAt, followUpPriority, leadSource, crmNotes)
- **Backend CRM Service**: Alert generation (overdue follow-ups, new inquiries, hot leads, cold leads), pipeline auto-advancement, revenue stats aggregation
- **Backend Routes**: GET /api/crm/alerts, POST /api/crm/interactions, PATCH /api/crm/leads/:id/pipeline, GET /api/crm/revenue, POST/PATCH/GET /api/crm/income
- **Auto-integrations**: Quote acceptance auto-creates Income record + logs Interaction + updates pipelineStatus to BOOKED
- **Frontend CRMAlerts**: Priority-sorted alert list with lead click-through, show all toggle, refresh button
- **Frontend RevenueDashboard**: 4 stat cards (This Month, YTD, Pipeline, Goal%) + 12-month bar chart (recharts)
- **Dashboard Integration**: Side-by-side CRM + Revenue grid after SmartSuggestion
- **Testing**: 100% pass rate (13/13 backend, all frontend verified)

## Architecture
```
/app/kolor-studio-v2/
├── backend/         # Node.js + Express + Prisma + TypeScript
│   ├── prisma/      # Schema & migrations
│   ├── src/routes/  # API endpoints (contracts.ts, portal.ts, leads.ts, settings.ts)
│   ├── src/services/# Storage, email
│   └── src/middleware/# Auth middleware
├── frontend/        # React + Vite + TypeScript + Tailwind CSS
│   ├── src/pages/   # Dashboard, Login, Signup, Portfolio, ClientPortal
│   ├── src/components/# UI components (CelebrationModal, BrandSettings, etc.)
│   ├── src/contexts/ # BrandThemeContext
│   └── src/services/# API client
```

## Key DB Schema
- **User**: id, email, firstName, lastName, studioName, primaryIndustry, role, lastLoginAt, brandPrimaryColor, brandAccentColor, brandLogoUrl, brandFontFamily
- **Lead**: id, clientName, clientEmail, projectTitle, status, serviceType, projectType, industry, deliverableType, coverImage, budget, timeline, portalToken, portalViews
- **Contract**: id, leadId, templateType, title, content, clientAgreed, clientAgreedAt, clientIP, status (DRAFT/SENT/VIEWED/AGREED)

## Key API Endpoints
- `POST /api/auth/login` & `POST /api/auth/signup` - Authentication
- `POST /api/auth/onboarding` - Industry onboarding
- `GET/POST/PATCH/DELETE /api/leads` - Lead CRUD
- `GET /api/settings/brand` - Get brand settings
- `PATCH /api/settings/brand` - Update brand colors/font
- `POST /api/settings/brand/logo` - Upload brand logo
- `DELETE /api/settings/brand/logo` - Remove brand logo
- `GET/POST /api/leads/:leadId/contracts` - Lead-scoped contracts
- `POST /api/contracts/:id/send` - Send contract to client
- `POST /api/contracts/:id/agree` - Client signs contract

## Backlog (P2/P3)
- **(P1.5)** CRM Automation System — Lead status pipeline auto-triggers, smart dashboard alerts, email sequence templates, follow-up automation, client relationship timeline
- **(P2)** PWA Functionality - make app installable
- **(P2)** Email verification for signups
- **(P2)** Client file upload on public inquiry form
- **(P3)** Distinct icons for activity types in timeline
- **(P3)** "Your Links" section in user settings
- **(P3)** Keyboard Shortcuts modal
- **(P3)** Dashboard customization (drag/reorder/toggle widgets)
