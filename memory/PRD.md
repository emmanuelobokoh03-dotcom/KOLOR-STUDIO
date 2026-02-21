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

### Phase 8: Status Change Notifications ✅ (Feb 21, 2026)
- [x] Automatic email notification when lead status changes
- [x] Custom email templates for each status (REVIEWING, CONTACTED, QUALIFIED, QUOTED, NEGOTIATING, BOOKED)
- [x] Personalized messages with project title and client name
- [x] Portal link included in every status notification
- [x] Activity logged when notification is sent
- [x] Non-blocking async email sending
- [x] Works from both Kanban drag-and-drop and edit form
- [x] Note: Requires Resend domain verification for production emails

### Phase 9: Client Portal Management in Dashboard ✅ (Feb 21, 2026)
- [x] Client Portal section in Lead Details tab
- [x] Portal URL displayed with Copy and Open buttons
- [x] Portal Views counter showing client engagement
- [x] Last Viewed timestamp (or "Never" if not viewed)
- [x] Copy Link button for easy sharing
- [x] Email via App button - opens mailto with pre-filled message
- [x] **Send Portal Link to Client** button - sends email directly through Resend
- [x] POST /api/leads/:id/send-portal-link - API endpoint to send portal link email
- [x] Email attempt logged as activity regardless of success
- [x] Graceful handling when Resend domain not verified (shows warning)
- [x] portalViews and lastPortalView fields added to Lead API response

### Phase 10: Password Reset Feature ✅ (Feb 21, 2026)
- [x] POST /api/auth/forgot-password - Request password reset email
- [x] POST /api/auth/reset-password - Reset password with token
- [x] Secure crypto.randomBytes(32) token generation
- [x] SHA256 hashed tokens stored in database
- [x] 1-hour token expiry
- [x] Single-use tokens (cleared after successful reset)
- [x] Rate limiting: Max 3 requests per email per hour (in-memory)
- [x] Email enumeration attack prevention (same response for all emails)
- [x] /forgot-password page with email input
- [x] /reset-password/:token page with password inputs
- [x] Password strength indicator (Weak/Medium/Strong with colors)
- [x] Password match validation with visual feedback
- [x] "Forgot password?" link on login page
- [x] Branded KOLOR STUDIO email template with 1-hour expiry notice
- [x] Resend integration for sending reset emails
- [x] Auto-redirect to login after successful password reset

### Phase 11: Dark Theme Implementation ✅ (Feb 21, 2026)
- [x] Complete dark theme across entire application
- [x] Color palette: Background #0f0f0f, Cards #1f1f1f, Borders #333333
- [x] Secondary background #1a1a1a for inputs and hover states
- [x] White/off-white text (#ffffff, #f5f5f5) with gray accents (#a3a3a3)
- [x] Preserved purple/violet brand colors for buttons, CTAs, links
- [x] Landing page with dark hero section and feature cards
- [x] Login/Signup pages with dark form styling
- [x] Forgot Password/Reset Password pages with dark theme
- [x] Dashboard with dark stats cards and toolbar
- [x] Kanban board with colorful column headers on dark background
- [x] Lead cards with dark styling and proper contrast
- [x] Lead Detail Modal with dark tabs and sections
- [x] Add Lead Modal with dark form styling
- [x] Submit Inquiry page with dark theme
- [x] Client Portal intentionally kept light (client-facing)
- [x] Custom Tailwind colors defined in tailwind.config.js
- [x] Global dark base styles in index.css

### Phase 12: Share Inquiry Form Feature ✅ (Feb 21, 2026)
- [x] "Share Form" button in Dashboard toolbar (next to "Add Lead")
- [x] Share Form Modal with purple gradient header
- [x] Copyable inquiry form URL input field
- [x] "Copy Link" button with success feedback ("Copied!")
- [x] "Email Link" button (opens mailto with pre-filled message)
- [x] "Open Form" button (opens inquiry form in new tab)
- [x] QR Code generation using qrcode.react library
- [x] "Download QR Code" button (exports as PNG at 512x512)
- [x] Pro Tips section with helpful suggestions
- [x] Modal closes on X button or click outside
- [x] Enhanced empty state with share actions (Copy, Email Link, More Options)
- [x] Dark theme styling consistent with rest of app

### Phase 13: Quote/Proposal System with International Currency Settings ✅ (Feb 21, 2026)

#### Currency Settings (User Profile)
- [x] Currency field in User model (default: USD)
- [x] Currency symbol and position (BEFORE/AFTER amount)
- [x] Number format options: US (1,000.00), European (1.000,00), Space separator (1 000,00)
- [x] Default tax rate percentage (pre-fills new quotes)
- [x] GET /api/settings - Returns user currency settings + available currencies list
- [x] PATCH /api/settings - Updates currency preferences
- [x] Settings Modal accessible via gear icon in dashboard header
- [x] 10 supported currencies: USD, EUR, GBP, CAD, AUD, NGN, JPY, INR, ZAR, BRL

#### Quote Builder
- [x] "Quotes" tab in Lead Detail Modal with quote list
- [x] Quote Builder Modal with line items (description, qty, price, total)
- [x] Dynamic totals calculation (subtotal, tax amount, total)
- [x] formatCurrency() utility for consistent currency formatting
- [x] Currency override per-quote (for international clients)
- [x] Payment terms dropdown (Full Upfront, 50% Deposit, Net 30, etc.)
- [x] Valid Until date picker
- [x] Terms & Conditions text area
- [x] Save Draft, Preview, and Send to Client buttons

#### Quote Management
- [x] POST /api/leads/:leadId/quotes - Create quote (draft)
- [x] GET /api/leads/:leadId/quotes - Get all quotes for a lead
- [x] PATCH /api/quotes/:quoteId - Update draft quote
- [x] DELETE /api/quotes/:quoteId - Delete draft quote
- [x] POST /api/quotes/:quoteId/send - Send quote email to client
- [x] POST /api/quotes/:quoteId/duplicate - Duplicate quote as draft
- [x] Quote statuses: DRAFT, SENT, VIEWED, ACCEPTED, DECLINED, EXPIRED
- [x] Auto-generated quote numbers: Q-YYYY-NNN
- [x] Quote token for public access (UUID)

#### Public Quote Page
- [x] GET /api/quotes/public/:quoteToken - Public view with merged currency settings
- [x] Public Quote page at /quote/:quoteToken
- [x] Displays studio info, client info, line items, totals
- [x] Accept Quote button (status -> ACCEPTED, lead -> BOOKED)
- [x] Decline Quote button with optional reason
- [x] Expired quote notice
- [x] Currency formatting based on quote/user settings

#### Email Notifications
- [x] Quote sent email to client with view link
- [x] Quote accepted notification to studio owner
- [x] Quote declined notification to studio owner with reason

#### Activity Logging
- [x] QUOTE_CREATED - Quote created with total
- [x] QUOTE_SENT - Quote sent to client
- [x] QUOTE_VIEWED - Client viewed quote
- [x] QUOTE_ACCEPTED - Client accepted quote
- [x] QUOTE_DECLINED - Client declined quote

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
| POST | /api/auth/forgot-password | Request password reset | No |
| POST | /api/auth/reset-password | Reset password with token | No |

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
- Frontend: https://kolor-crm-2.preview.emergentagent.com
- Dashboard: https://kolor-crm-2.preview.emergentagent.com/dashboard
- Public Inquiry: https://kolor-crm-2.preview.emergentagent.com/inquiry
- Client Portal: https://kolor-crm-2.preview.emergentagent.com/portal/:token
- Forgot Password: https://kolor-crm-2.preview.emergentagent.com/forgot-password
- Reset Password: https://kolor-crm-2.preview.emergentagent.com/reset-password/:token
- API: https://kolor-crm-2.preview.emergentagent.com/api

## Prioritized Backlog

### P1 - High Priority (Next)
- [ ] Send custom emails to clients from dashboard
- [ ] Email templates management

### P2 - Medium Priority
- [ ] Calendar integration
- [ ] Quote generation
- [ ] Analytics dashboard

### P3 - Lower Priority
- [ ] Messaging system
- [ ] Multi-user team support
- [ ] Invoice generation
