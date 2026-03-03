# KOLOR STUDIO v2 - Product Requirements Document

## Original Problem Statement
Build a CRM platform for creative professionals with JWT authentication, Lead Pipeline management, email notifications, and activity tracking. Evolving into a universal CRM for all creative professionals.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + react-big-calendar
- **Backend**: Node.js + Express + TypeScript + Prisma + Supabase PostgreSQL
- **Auth**: JWT + bcrypt | **Email**: Resend | **Storage**: Supabase Storage

## What's Been Implemented

### Core Features (Phases 1-24) — All DONE
- JWT Auth, Lead Pipeline (Kanban + List), Email Notifications, Activity Logging
- File Attachments, Client Portal, Quote/Proposal System, Dark Theme
- Revenue Analytics, Calendar + Booking System, Quote Templates
- Landing Page, Legal Pages, Support Infrastructure

### Phase 25: Portfolio System — DONE
### Phase 26: Schema Refactor (DB) — DONE
### Phase 27: Backend API Refactor — DONE (Mar 3, 2026)

New API endpoints:
- **Workflow Templates** (6 endpoints): GET/POST/PATCH/DELETE /api/workflow-templates, GET /api/workflow-templates/:id, GET /api/workflow-templates/industry/:industry
- **Deliverables** (7 endpoints): GET/POST /api/leads/:leadId/deliverables, GET/PATCH/DELETE /api/deliverables/:id, PATCH /api/deliverables/:id/status
- **Updated Leads**: GET with ?projectType & ?industry filters, POST/PATCH accept projectType/industry/deliverableType
- **Fixed**: Lead GET/:id and PATCH/:id now include unassigned leads (OR assignedToId)
- **Fixed**: Backend route prefixes (/api), files/quotes double-path bugs

## Test Credentials
- emmanuelobokoh03@gmail.com / successful26#
- User ID: 3aa2d156-aa26-48ef-8daf-e95641b68b3e

## Prioritized Backlog

### P0 — Big Refactor (In Progress)
- [x] Phase 1: Database Schema — DONE
- [x] Phase 2: Backend API — DONE
- [ ] Phase 3: Frontend UI (project type selectors, workflow views, deliverable tracker)
- [ ] Phase 4: System workflow templates (pre-built per industry)

### P1 — Next Up
- [ ] Mobile responsiveness
- [ ] UI/UX polish

### P2 — Medium Priority
- [ ] Portfolio sharing (link in emails/portal)
- [ ] Recurring events

### P3 — Backlog
- [ ] Invoice generation, Multi-user teams, Messaging
