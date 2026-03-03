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

## Architecture
```
/app/kolor-studio-v2/
├── backend/         # Node.js + Express + Prisma + TypeScript
│   ├── prisma/      # Schema & migrations
│   ├── src/routes/  # API endpoints
│   ├── src/services/# Storage, email
│   └── src/middleware/# Auth middleware
├── frontend/        # React + Vite + TypeScript + Tailwind CSS
│   ├── src/pages/   # Dashboard, Login, Signup, Portfolio
│   ├── src/components/# UI components
│   └── src/services/# API client
```

## Key DB Schema
- **User**: id, email, firstName, lastName, studioName, primaryIndustry, role, lastLoginAt
- **Lead**: id, clientName, clientEmail, projectTitle, status, serviceType, projectType, industry, deliverableType, coverImage, budget, timeline, portalToken, portalViews
- **WorkflowTemplate**: id, name, industry, projectType, isDefault, isSystem, userId, stages[]
- **Deliverable**: id, leadId, type, status, fileUrls, details

## Key API Endpoints
- `POST /api/auth/login` & `POST /api/auth/signup` - Authentication
- `POST /api/auth/onboarding` - Industry onboarding
- `GET/POST/PATCH/DELETE /api/leads` - Lead CRUD
- `POST /api/leads/upload-cover` - Upload cover image
- `GET/POST /api/leads/:id/activities` - Activity log
- `GET/POST/DELETE /api/leads/:id/files` - File management
- `/api/workflow-templates/*` - Workflow CRUD
- `/api/leads/:leadId/deliverables` - Deliverables CRUD

## Backlog (P2/P3)
- **(P2)** Email verification for signups
- **(P2)** Client file upload on public inquiry form
- **(P3)** Distinct icons for activity types in timeline
- **(P3)** "Your Links" section in user settings
- **(P3)** Keyboard Shortcuts modal
