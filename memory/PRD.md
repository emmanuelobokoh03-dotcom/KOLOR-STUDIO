# KOLOR Studio — PRD

## Original problem statement
Full-stack creator command center for photographers, designers, and fine artists. Community v3 (peer-discovery) + Portfolio v3 (client-conversion) + Dashboard v3 (creator-command-center) arcs comprise the intentional design trilogy. Clients v3 (operational spine) is fourth v3 arc.

## Product Requirements
- Strict manual "Smoke Test" verification (user QAs — testing agent DISABLED)
- STEP 0 bash state diagnostic mandatory before every iteration + explicit pause for Path confirmation
- Framework calibration: `kolor` tokens, Fraunces italic headings, mono UPPERCASE eyebrows
- Additive-over-breaking: rollback safety maintained per iteration
- Precise conditional guarding: `state === 'value'` explicit, no ambiguity
- Zero touches to preserved arcs unless explicitly in scope

## User personas
- Photographers, Designers, Fine Artists (multi-industry equally)
- Creators operating solo studios; scale gracefully from 2 to 200 clients

## Arc closure status
- Community v3: **CLOSED** at iter 53 (peer-discovery)
- Portfolio v3: **CLOSED** at iter 56 (client-conversion)
- Dashboard v3: **CLOSED** at iter 61 (creator-command-center) — awaiting user smoke test PASS on 291-v3c.2
- **Clients v3: OPEN** at iter 62 (operational spine) — v3a shipped

## Iteration 292-v3a (this session) — Clients v3 opens
Ships list + kanban view modes + basic filter/sort UX + avatar per client + framework calibration.

### STEP 0 findings + adaptive Paths applied
- No `view === 'clients'` conditional exists. Clients page IS the `viewMode === 'list'` branch. `clientsViewMode` state scoped inside that branch (orthogonal to outer viewMode).
- Case B applied: build new Clients v3 components alongside; LeadsListView.tsx preserved untouched as fallback (delete in v3b if unused).
- LeadStatus enum (8 values) mapped to 5-stage `industryLanguage.ts` keys (inquiry/discovery/quoted/contracted/completed). Q3 6-stage refinement (adding REVIEW + splitting CONTRACTED/ACTIVE) deferred to v3.1 backlog.
- COMPLETED heuristic: `status === 'BOOKED' && eventDate < now`. LOST excluded from pipeline columns.

### Stage bucket mapping (v3a)
- INQUIRY: NEW, REVIEWING
- DISCOVERY: CONTACTED, QUALIFIED
- QUOTED: QUOTED, NEGOTIATING
- CONTRACTED: BOOKED (future/no eventDate)
- COMPLETED: BOOKED (eventDate < now, heuristic)
- LOST: excluded from pipeline

### Files created
- `frontend/src/components/clients/stages.ts` (helpers)
- `frontend/src/components/clients/ClientAvatar.tsx` (Q7=B)
- `frontend/src/components/clients/ClientsViewToggle.tsx`
- `frontend/src/components/clients/ClientsFilterBar.tsx`
- `frontend/src/components/clients/ClientsListView.tsx`
- `frontend/src/components/clients/ClientsKanbanView.tsx`

### Files modified
- `frontend/src/pages/Dashboard.tsx` (imports + `clientsViewMode` + `clientsFilter` state + swap LeadsListView block for view toggle + list/kanban conditional)

### Regression checks
- Backend TSC exit 0
- Frontend cold-cache build ✓ 7.76s
- Dashboard chunk 309 → 328KB (~6% growth, expected from new surfaces)
- All 5 dashboard cards, NotificationBell, Community v3, Portfolio v3, Phase 2 baselines, framework primitives intact

### Local commit
- `c2b32df` on branch `main`. 7 files changed, 1186+/12-. **Push blocked** by container auth — user syncs via "Save to GitHub" UI.

## Prioritized backlog

### P0 — Immediate
- User verifies iter 292-v3a smoke tests (1-6) → closes v3a
- User taps "Save to GitHub" to sync `c2b32df` (plus `510c92d` from 291-v3c.2)

### P1 — Next arc (Clients v3 continuation)
- iter 292-v3b: Saved views + bulk actions + keyboard shortcuts + calendar view (per Q4/Q6/Q9/Q2)
- iter 292-v3c: Client detail page redesign (progressive disclosure per Q5=A) + polish + regression pass
- Estimated arc remaining: 4-8 hours

### P2 — Backlog (from prior arcs + this iteration)
- **iter 292-v3a.1 additions**: Auto-populate `lead.industry` from `user.primaryIndustry` on new lead creation (server-side default at write time); backfill migration for existing null-industry leads; filter UI reveal logic auto-shows when data becomes available
- LeadsListView.tsx deletion (v3b if unused)
- 6-stage refinement + REVIEW/ACTIVE split + LeadStatus enum extension (v3.1 backlog)
- Custom pipeline stages (v3.1 backlog per Q3 extension)
- Drag-drop kanban stage change (v3b or v3.1)
- Latest work thumbnail per client (v3.1 backlog per Q7=C)
- URL param reflection for saved views (v3b)
- Bulk email + bulk export (v3.1 backlog per Q6 extension)
- Comprehensive keyboard shortcuts (v3.1 backlog per Q9 extension)
- avatarUrl field on CommunityProfile schema (Dashboard v3.1 backlog)
- Studio Pulse card 6th dashboard card (Dashboard v3.1 backlog)
- Calendar v3, Portfolio Manager v3, Settings v3, Auth v3 arcs
- Email templates & Onboarding tutorials
- Beta launch preparation

## Tech stack (unchanged)
- Frontend: React 18 + Vite + TypeScript + custom kolor-design CSS variables
- Backend: Node/Express + TypeScript + Prisma + PostgreSQL
- Location: `/app/kolor-studio-v2/` (root); `/app/frontend`, `/app/backend` are Emergent stub scaffolds
- Deployment: Railway (backend), Vercel (frontend)

## Test credentials
- Standard test account: `bookingtest@test.com` / `password123`
