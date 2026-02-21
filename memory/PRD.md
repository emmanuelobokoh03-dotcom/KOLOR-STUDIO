# KOLOR STUDIO v2 - Product Requirements Document

## Original Problem Statement
Build a CRM platform for creative professionals with JWT authentication, Lead Pipeline management, email notifications, and activity tracking.

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

### Phase 5: Activity Logging System ✅ (Feb 21, 2026)
- [x] Activity model in database schema
- [x] GET /api/leads/:leadId/activities - Fetch activity timeline
- [x] POST /api/leads/:leadId/notes - Add notes to leads
- [x] LeadDetailModal with tabs: Activity Timeline & Lead Details
- [x] Activity Timeline UI with icons and timestamps
- [x] Add Note form with real-time timeline update
- [x] Auto-logging for lead creation (manual & public)
- [x] Auto-logging for status changes (Kanban drag)
- [x] Auto-logging for email sends (owner notification & client confirmation)
- [x] User attribution for activities
- [x] Time-ago formatting (Just now, X min ago, etc.)
- [x] Backfilled "Lead created" activities for existing leads
- [x] Error handling with console logging for debugging
- [x] Alert notifications for failed note additions

### Phase 6: File Attachments ✅ (Feb 21, 2026)
- [x] Supabase Storage integration for cloud file storage
- [x] POST /api/leads/:leadId/files - Upload files (up to 10 at once)
- [x] GET /api/leads/:leadId/files - List files with signed URLs
- [x] DELETE /api/files/:fileId - Delete files
- [x] GET /api/files/:fileId/download - Get fresh download URL
- [x] Files tab in LeadDetailModal with file count badge
- [x] Drag-and-drop file upload area
- [x] Multiple file upload support
- [x] File type icons (image, PDF, document, spreadsheet, text)
- [x] File size formatting (KB, MB)
- [x] Download button with signed URL
- [x] Delete button with confirmation dialog
- [x] FILE_UPLOADED activity auto-logged
- [x] FILE_DELETED activity auto-logged
- [x] Supported: PDF, DOCX, XLSX, JPG, PNG, GIF, WEBP, TXT, CSV (50MB max)

### Phase 7: Client Portal ✅ (Feb 21, 2026)
- [x] GET /api/portal/:token - Token-based portal access (no login required)
- [x] Portal view tracking (portalViews count, lastPortalView timestamp)
- [x] Client-safe activity filtering (hides internal notes)
- [x] Sanitized activity descriptions for client view
- [x] Frontend /portal/:token page with beautiful design
- [x] KOLOR STUDIO branded header with status badge
- [x] Visual progress bar: Received → In Contact → Quoted → Finalizing → Confirmed
- [x] Status message with description
- [x] Project details: service type, description, budget, timeline, submitted date
- [x] Activity timeline with client-friendly updates
- [x] Contact section with team member name and "Contact Us" button
- [x] Mobile responsive design (vertical progress bar on mobile)
- [x] Error state for invalid tokens
- [x] Email template updated with portal link

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

### Activities
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/leads/:id/activities | Get activity timeline | Yes |
| POST | /api/leads/:id/notes | Add note to lead | Yes |

### Files
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/leads/:id/files | List files for lead | Yes |
| POST | /api/leads/:id/files | Upload files (multipart) | Yes |
| GET | /api/files/:id/download | Get download URL | Yes |
| DELETE | /api/files/:id | Delete file | Yes |

### Portal (Public)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/portal/:token | Get lead portal data | Token |

## Activity Types
- NOTE_ADDED - Manual notes by users
- STATUS_CHANGED - Status changes via Kanban or edit
- EMAIL_SENT - Client confirmation and owner notification emails
- FILE_UPLOADED - File uploaded to lead
- FILE_DELETED - File deleted from lead

## Test Credentials
- emmanuelobokoh03@gmail.com / successful26#

## URLs
- Frontend: https://kolor-crm-1.preview.emergentagent.com
- Dashboard: https://kolor-crm-1.preview.emergentagent.com/dashboard
- Public Inquiry: https://kolor-crm-1.preview.emergentagent.com/inquiry
- Client Portal: https://kolor-crm-1.preview.emergentagent.com/portal/:token
- API: https://kolor-crm-1.preview.emergentagent.com/api

## Prioritized Backlog

### P1 - High Priority (Next)
- [ ] Password reset functionality
- [ ] Send custom emails to clients from dashboard

### P2 - Medium Priority
- [ ] Calendar integration
- [ ] Quote generation
- [ ] Analytics dashboard

### P3 - Lower Priority
- [ ] Messaging system
- [ ] Multi-user team support
- [ ] Invoice generation
