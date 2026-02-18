# KOLOR STUDIO v2 - Product Requirements Document

## Original Problem Statement
Setup kolor-studio-v2 project with backend and frontend servers running in Emergent environment.

## Project Overview
A CRM platform built for photographers, designers, and videographers. "The CRM that doesn't feel like a CRM."

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Authentication**: JWT (planned)

## User Personas
1. **Creative Professionals** - Photographers, designers, videographers
2. **Studio Owners** - Managing client leads and projects

## Core Requirements
- Visual Kanban pipeline for lead management
- Client portal with branded experience
- Activity tracking and notes
- Messaging system
- Analytics dashboard

## What's Been Implemented (Feb 18, 2026)
- [x] Project extracted and configured for Emergent environment
- [x] Backend server running on port 8001 (Express + TypeScript)
- [x] Frontend server running on port 3000 (Vite + React)
- [x] Supabase PostgreSQL connected via Prisma
- [x] Database schema deployed (Users, Leads, Activities, Messages, Files)
- [x] Landing page functional
- [x] API health endpoint working

## Prioritized Backlog

### P0 - Critical (Next)
- [ ] JWT Authentication (signup/login endpoints)
- [ ] User registration flow
- [ ] Protected routes

### P1 - High Priority
- [ ] Lead CRUD API
- [ ] Lead submission form
- [ ] Dashboard with lead list

### P2 - Medium Priority
- [ ] Kanban pipeline (drag & drop)
- [ ] Lead detail modal
- [ ] Activity logging

### P3 - Lower Priority
- [ ] Client portal
- [ ] Messaging system
- [ ] File uploads
- [ ] Analytics dashboard

## Architecture
```
/app/kolor-studio-v2/
├── backend/           # Express + TypeScript API
│   ├── src/server.ts  # Main entry point (port 8001)
│   ├── prisma/        # Database schema
│   └── .env           # Supabase connection
├── frontend/          # React + Vite
│   ├── src/           # Components, pages, hooks
│   └── vite.config.ts # Dev server config (port 3000)
```

## Environment Configuration
- Backend: PORT=8001, DATABASE_URL=Supabase PostgreSQL
- Frontend: VITE_API_URL for API calls
- Vite proxy: /api -> localhost:8001
