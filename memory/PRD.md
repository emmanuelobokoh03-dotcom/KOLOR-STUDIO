# KOLOR STUDIO v2 - Product Requirements Document

## Original Problem Statement
Setup kolor-studio-v2 project with backend and frontend servers, then implement JWT authentication system.

## Project Overview
A CRM platform built for photographers, designers, and videographers. "The CRM that doesn't feel like a CRM."

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Authentication**: JWT (bcrypt password hashing)

## User Personas
1. **Creative Professionals** - Photographers, designers, videographers
2. **Studio Owners** - Managing client leads and projects

## Core Requirements
- [x] Visual Kanban pipeline for lead management
- [x] Client portal with branded experience
- [ ] Activity tracking and notes
- [ ] Messaging system
- [ ] Analytics dashboard

## What's Been Implemented (Feb 18, 2026)

### Phase 1: Project Setup ✅
- [x] Project extracted and configured for Emergent environment
- [x] Backend server running on port 8001 (Express + TypeScript)
- [x] Frontend server running on port 3000 (Vite + React)
- [x] Supabase PostgreSQL connected via Prisma
- [x] Database schema deployed (Users, Leads, Activities, Messages, Files)
- [x] Landing page functional
- [x] API health endpoint working

### Phase 2: Authentication System ✅
- [x] POST /api/auth/signup - Create new user with hashed password
- [x] POST /api/auth/login - Authenticate user, return JWT token
- [x] GET /api/auth/me - Protected route, get current user info
- [x] JWT middleware for route protection
- [x] Email validation on signup
- [x] Frontend signup form connected to API
- [x] Frontend login form connected to API
- [x] JWT token stored in localStorage
- [x] Protected dashboard route
- [x] User profile display on dashboard
- [x] Logout functionality

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/signup | Create new user account | No |
| POST | /api/auth/login | Login, get JWT token | No |
| GET | /api/auth/me | Get current user info | Yes |

## Test Credentials
- Email: test@example.com
- Password: test123456

## Prioritized Backlog

### P0 - Critical (COMPLETED)
- [x] JWT Authentication (signup/login endpoints)
- [x] User registration flow
- [x] Protected routes

### P1 - High Priority (Next)
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
├── backend/                    # Express + TypeScript API
│   ├── src/
│   │   ├── server.ts          # Main entry point (port 8001)
│   │   ├── routes/auth.ts     # Auth endpoints
│   │   └── middleware/auth.ts # JWT middleware
│   ├── prisma/                # Database schema
│   └── .env                   # Supabase connection
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── pages/             # Signup, Login, Dashboard
│   │   └── services/api.ts    # API service layer
│   └── vite.config.ts         # Dev server config (port 3000)
```

## URLs
- Frontend: https://palette-editor-2.preview.emergentagent.com
- Backend API: https://palette-editor-2.preview.emergentagent.com/api
