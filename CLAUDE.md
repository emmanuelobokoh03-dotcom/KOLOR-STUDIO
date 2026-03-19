# KOLOR STUDIO CRM - PROJECT MEMORY
Last Updated: 2026-03-19
Status: Feature 5 Deployed, Starting 5-Day Beta Launch Sprint

---

## PROJECT IDENTIFICATION

**Name:** KOLOR STUDIO
**Type:** CRM for Creative Professionals (Photographers, Designers, Artists)
**Owner:** Emmanuel Obokoh
**Project Directory:** `kolor-studio-v2`
**GitHub Repo:** `emmanuelobokoh03-dotcom/KOLOR-STUDIO`
**Branch:** `main`

---

## DEPLOYMENT INFRASTRUCTURE

**Frontend:**
- Platform: Vercel
- URL: https://kolor-studio.vercel.app
- Auto-deploys from GitHub main branch
- Deploy time: 2-3 minutes

**Backend:**
- Platform: Railway
- URL: https://kolor-studio-production.up.railway.app
- Auto-deploys from GitHub main branch
- Deploy time: 3-5 minutes

**Database:**
- Platform: Supabase
- Project ID: ifqjboshlekselnlxcyh
- Connection: PostgreSQL via Prisma

**Domain:**
- Primary: kolorstudio.app
- Status: Verified on Resend
- Email: noreply@kolorstudio.app

**Email Service:**
- Provider: Resend
- Sender: noreply@kolorstudio.app
- Domain verified: ✅
- SPF/DKIM: Configured

---

## PROJECT STRUCTURE
```
kolor-studio-v2/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   │   └── email.ts     # 29+ email templates
│   │   ├── middleware/      # Auth, rate limiting
│   │   ├── cron/           # Scheduled jobs
│   │   └── server.ts        # Express app
│   ├── prisma/
│   │   └── schema.prisma    # Database models
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # React components
│   │   └── index.css       # Global styles
│   ├── tailwind.config.js  # Design system
│   └── package.json
│
└── README.md
```

---

## CURRENT STATUS (AS OF 2026-03-19)

**✅ COMPLETED FEATURES:**

1. **Core CRM Workflow**
   - Lead capture (inquiry form)
   - Quote generation (2-minute builder)
   - Contract management (e-signature)
   - Payment tracking (automated reminders)
   - Client portal (professional, generic)

2. **Timeline & Milestones** (Session 9)
   - Manual CRUD at `/api/leads/:leadId/milestones`
   - Auto-generate 4 milestones on contract signing
   - ProjectTimeline tab in LeadDetailModal

3. **Scheduled Review Emails** (Session 9)
   - ScheduledEmail model + cron processor (every 2hrs)
   - Testimonial request (3 days after BOOKED)
   - File review reminder (3 days after upload)

4. **Share Files with Comments** (Session 9)
   - Renamed "Upload Simple Files" → "Share Files"
   - Message/comment textarea
   - Messages logged as activity notes

5. **Project Categories** (Session 9)
   - Added `projectType` dropdown to inquiry form
   - Types: SERVICE/COMMISSION/PROJECT/PRODUCT_SALE

6. **Meeting Booking System** (Session 10 - JUST DEPLOYED)
   - Meeting types CRUD
   - Availability schedule management
   - Slot generation (buffers, conflicts, maxPerDay)
   - Public booking page `/book/:userId`
   - Multi-step flow (Type → Date → Time → Details → Confirm)
   - Automated confirmation + 24hr reminder emails
   - Settings > Scheduling tab
   - 19/19 backend tests passed ✅

7. **Email System**
   - 29+ email templates
   - Light theme design
   - Purple gradient headers
   - Professional styling
   - All templates use `emailBaseTemplate()` wrapper

8. **Accessibility**
   - WCAG 2.1 AA compliant
   - `useModalA11y` hook (focus trapping)
   - Applied to all 9 modals
   - Screen reader support
   - Keyboard navigation
   - `prefers-reduced-motion` support

9. **Quality & Performance**
   - Zero TypeScript errors
   - 100% backend test coverage
   - Rate limiting optimized (1000/hr API, 30/hr Auth)
   - Auto-refresh 60s with idle detection
   - Production deployed and stable

---

## DESIGN SYSTEM (CURRENT - TO BE UPDATED DAY 1)

**Typography:**
- Headings: Bricolage Grotesque
- Body/UI: Instrument Sans
- Fallback: Inter

**Type Scale:**
- H1: 48px/56px/700
- H2: 36px/44px/600
- H3: 28px/36px/600
- H4: 22px/30px/600
- H5: 18px/26px/500
- Body: 14px/22px/400

**Colors (Current):**
- Brand: #7C3AED (purple-600)
- Hover: #6D28D9 (purple-700)
- Accent: #A855F7 (purple-500)
- Success: #10B981
- Warning: #F59E0B
- Danger: #EF4444
- Info: #3B82F6

**Spacing:** 8pt grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

**Icons:** @phosphor-icons/react

---

## BRAND IDENTITY

**Positioning:** "Your CRM Should Work Harder Than You Do"

**Target Audience:**
- Photographers (wedding, portrait, commercial)
- Designers (brand, graphic, web)
- Artists (fine art, commissions)
- Revenue range: $30K-$150K/year

**Beta Pricing:**
- First 20 users: FREE FOREVER
- Users 21-50: $9/month (regular $29)
- After 50 users: $29/month standard

**Public Launch Pricing (Future):**
- Free: 3 projects
- Pro: $29/month
- Studio: $79/month

---

## 5-DAY BETA LAUNCH SPRINT (STARTING TOMORROW)

**CURRENT ITERATION:** 76
**GOAL:** Launch beta in 5 days

### DAY 1 (6.5-8 hours): UI SYSTEM V2.0 + FEATURE 6 START

**Morning (4-5 hours):**
1. UI System v2.0 - Web (2.5-3 hrs)
   - Tailwind config (colors, typography, spacing, shadows)
   - Global CSS variables
   - Component utility classes
   - Update existing components

2. UI System v2.0 - Email Templates (1.5-2 hrs)
   - Email design system
   - Update all 29+ email templates
   - Match web UI (fonts, colors, spacing)
   - Responsive layouts

**Afternoon (2-3 hours):**
3. Feature 6 Part 1 - File Notifications (2-3 hrs)
   - Backend webhook/notification
   - File upload email template
   - File categorization logic
   - Comments system foundation

### DAY 2 (5-7 hours): FEATURE 6 COMPLETE + GOOGLE CALENDAR

**Morning (3-4 hours):**
1. Feature 6 Part 2 (2 hrs)
   - File categorization (auto-detect)
   - Comments bidirectional
   - User upload for client review
   - UI for file management

2. Google Calendar Part 1 (1-2 hrs)
   - OAuth setup (requires credentials from Emmanuel)
   - API connection
   - Token storage

**Afternoon (2-3 hours):**
3. Google Calendar Part 2 (2-3 hrs)
   - Availability sync
   - Event creation on booking
   - Two-way sync
   - Testing

### DAY 3 (5-6 hours): MOBILE + LOADING STATES

**All Day:**
1. Mobile Responsiveness (3-4 hrs)
   - Dashboard mobile layout
   - Tables → card view
   - Forms mobile-friendly
   - Navigation hamburger
   - Booking page mobile
   - 44px touch targets
   - Test: iPhone SE, iPad, desktop

2. Loading & Error States (2 hrs)
   - Skeleton screens
   - Loading spinners
   - Error messages
   - Empty states
   - 404/500 pages

### DAY 4 (8-10 hours): DOCS + PERFORMANCE + LANDING PAGE + ANALYTICS

**Morning (4-5 hours):**
1. Component Documentation (1.5-2 hrs)
2. Performance Optimization (1 hr)
3. 10/10 Landing Page (1.5-2 hrs)

**Afternoon (4-5 hours):**
4. Landing Page Assets (1.5-2 hrs)
5. Analytics Setup (1-2 hrs)
6. Beta Signup Page (1 hr)

### DAY 5 (4-6 hours): TESTING + LAUNCH

**Morning (2-3 hours):**
1. Comprehensive Testing (2 hrs)
2. Final Polish (1 hr)

**Afternoon (2-3 hours):**
3. Launch Prep (1 hr)
4. Soft Launch (1 hr)

**Evening:**
5. PUBLIC BETA LAUNCH 🚀

---

## WHAT EMMANUEL NEEDS TO PROVIDE

**For Google Calendar (Day 2):**
- Google Cloud project
- OAuth 2.0 Client ID & Secret
- ~30 min for setup

**For Analytics (Day 4):**
- Google Analytics OR Plausible account
- Tracking ID
- Sentry account (optional)

**For Landing Page (Day 4):**
- Product screenshots (or use placeholders)
- Testimonials (or use placeholders)
- Final copy approval

---

## CRITICAL REMINDERS FOR CLAUDE

1. **PROJECT PATH:** `kolor-studio-v2` (NOT crowdsourcing_FINAL!)
2. **NEVER CONFUSE PROJECTS:** This is KOLOR STUDIO CRM, not research platform
3. **DEPLOYMENT:** Auto-deploys via Vercel + Railway from GitHub main
4. **TESTING:** Always run backend tests, verify TypeScript compiles
5. **BUILD INCREMENTALLY:** Add features, don't change existing code
6. **BACKUP BEFORE CHANGES:** Database backups before destructive operations
7. **CONSISTENT DESIGN:** UI System v2.0 must apply to web + emails + portal
8. **BRAND VOICE:** Professional but friendly, no jargon, specific outcomes
9. **TARGET AUDIENCE:** Creative professionals (photographers, designers, artists)
10. **LAUNCH GOAL:** Beta launch in 5 days with 40-60 signups

---

## PENDING TASKS (POST-BETA BACKLOG)

**P3 - Low Priority:**
- Booking widget embed code
- Visual sequence builder (drag-drop email automation)
- Contract editor (edit before sending)
- Dark mode
- Advanced reporting
- Portal blank page investigation (pre-existing)

---

## SESSION PATTERN

**Emmanuel's workflow:**
1. Returns home after being away
2. Reviews progress
3. Makes decisions on features/priorities
4. Pushes and deploys when satisfied
5. Moves to next phase

**Claude's workflow:**
1. Provide clear, actionable specs
2. Stay focused on current project
3. Don't reference wrong projects
4. Give specific implementation instructions
5. Track progress accurately
6. Celebrate wins

---

## SUCCESS METRICS

**By Beta Launch:**
- Complete UI System v2.0 (web + emails)
- Feature 6 working (file notifications)
- Google Calendar integrated
- Mobile-responsive
- 10/10 landing page live
- 40-60 beta signups target

**Product Quality:**
- Zero TypeScript errors
- 100% test coverage
- WCAG AA compliant
- Fast performance (Lighthouse > 90)
- Professional branding throughout

---

## LAST COMPLETED MILESTONE

**Feature 5 - Meeting Booking System**
- Deployed: 2026-03-19
- Status: Production-ready ✅
- Testing: 19/19 backend tests passed
- Location: https://kolor-studio.vercel.app/book/:userId

**Next Milestone:**
- Day 1 of 5-day sprint
- UI System v2.0 implementation
- Feature 6 foundation

---

## NOTES FOR FUTURE SESSIONS

- Emmanuel prefers Option C approach: Complete feature set before launch
- Expects 6-7.5 hours work per day over 5 days
- Values consistency across all touchpoints (web, email, portal)
- Appreciates detailed specs before implementation
- Likes to review and approve before moving forward

---

END OF MEMORY FILE
