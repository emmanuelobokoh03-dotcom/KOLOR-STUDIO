# KOLOR STUDIO v2 - Product Requirements Document

## Original Problem Statement
Build a CRM platform for creative professionals with JWT authentication, Lead Pipeline management, and email notifications.

## Project Overview
A CRM platform built for photographers, designers, and videographers. "The CRM that doesn't feel like a CRM."

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Email**: Resend for transactional emails

## What's Been Implemented

### Phase 1: Project Setup ✅ (Feb 18, 2026)
- [x] Project configured for Emergent environment
- [x] Backend server on port 8001, Frontend on port 3000
- [x] Supabase PostgreSQL connected via Prisma

### Phase 2: Authentication System ✅ (Feb 18, 2026)
- [x] POST /api/auth/signup - Create user with hashed password
- [x] POST /api/auth/login - Return JWT token (7-day expiry)
- [x] GET /api/auth/me - Protected route for user info
- [x] JWT middleware for route protection
- [x] Frontend signup/login forms
- [x] Protected dashboard with logout

### Phase 3: Lead Pipeline ✅ (Feb 20, 2026)
- [x] Full CRUD API for leads
- [x] Public lead submission endpoint
- [x] Dashboard with Kanban board and List view
- [x] Lead detail modal with editing
- [x] Public inquiry form at /inquiry
- [x] Search and filter leads
- [x] Stats cards

### Phase 4: Email Notifications ✅ (Feb 20, 2026)
- [x] Resend integration for transactional emails
- [x] Owner notification on new lead submission
- [x] Client confirmation email on inquiry
- [x] Professional KOLOR STUDIO branded templates
- [x] Non-blocking async email sending

## Email Templates
1. **New Lead Notification** (to owner)
   - Lead name, email, phone, company
   - Project title and service type
   - Budget and timeline
   - Full project description
   - Link to dashboard

2. **Client Confirmation** (to client)
   - Personalized greeting
   - Inquiry summary
   - Expected response time (24-48 hours)
   - Reply-to owner email

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/signup | Create account | No |
| POST | /api/auth/login | Login, get JWT | No |
| GET | /api/auth/me | Get current user | Yes |

### Leads
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/leads | Get all leads | Yes |
| GET | /api/leads/stats | Get stats | Yes |
| POST | /api/leads | Create lead | Yes |
| POST | /api/leads/submit | Public submit + emails | No |
| PATCH | /api/leads/:id | Update lead | Yes |
| PATCH | /api/leads/:id/status | Update status | Yes |
| DELETE | /api/leads/:id | Delete lead | Yes |

## Test Credentials
- test@example.com / test123456

## URLs
- Frontend: https://palette-editor-2.preview.emergentagent.com
- Dashboard: https://palette-editor-2.preview.emergentagent.com/dashboard
- Public Inquiry: https://palette-editor-2.preview.emergentagent.com/inquiry
- API: https://palette-editor-2.preview.emergentagent.com/api

## Prioritized Backlog

### P1 - High Priority (Next)
- [ ] Activity logging (track status changes, notes)
- [ ] Client portal (branded view for clients)
- [ ] Lead notes and comments

### P2 - Medium Priority
- [ ] File attachments
- [ ] Calendar integration
- [ ] Quote generation

### P3 - Lower Priority
- [ ] Messaging system
- [ ] Analytics dashboard
- [ ] Multi-user team support
