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

## Arc closure status
- Community v3: **CLOSED** at iter 53 (peer-discovery)
- Portfolio v3: **CLOSED** at iter 56 (client-conversion)
- Dashboard v3: **CLOSED** at iter 61 (creator-command-center)
- **Clients v3: CLOSED** at iter 65 (operational spine) — pragmatic close; detail redesign deferred to v3.1

## Iteration 292-v3c (this session) — Pragmatic Clients v3 arc close
STEP 0 revealed LeadDetailModal is 1996 lines with non-framework `#6C2EDB` purple — a full progressive-disclosure redesign requires a proper dedicated iteration. User confirmed pragmatic close: ship polish + close arc + defer detail redesign to formal v3.1 iteration.

### Ships in v3c
- **`ClientsEmptyState.tsx`** — reusable Studio Wall echo helper (three hairline frames + Fraunces italic title + Inter body + Terra CTA + `compact` variant)
- **Empty states refreshed** in `ClientsListView` (Studio wall / No matches variants) and `ClientsCalendarView` (Quiet month)
- **Community mobile fix** — `PublicProfile.tsx` hero grid + actions column now use responsive CSS classes (`.pp-hero-grid` + `.pp-hero-actions`) with mobile-first defaults + `@media (min-width: 768px)` desktop layout. Buttons no longer overflow narrow viewports.
- **QuickViewsStrip mobile scroll** — `overflow-x: auto` with touch scrolling
- **Active Pipeline widget removal**: STEP 0 confirmed no such widget exists on Clients page. Zero action required.
- **Revenue Overview**: preserved per user decision (3-path product decision documented).

### Files changed
- New: `frontend/src/components/clients/ClientsEmptyState.tsx`
- Modified: `ClientsListView.tsx`, `ClientsCalendarView.tsx`, `pages/PublicProfile.tsx`, `index.css`

### Local commit
`e6bd059` on branch `main`. 5 files changed, 192+/81-. **Push blocked** — user syncs via "Save to GitHub".

### Formally deferred to Clients v3.1
- **LeadDetailModal → progressive disclosure redesign (Q5=A)** — full 1996-line refactor with its own STEP 0 diagnostic, adaptive Cases (full replacement vs in-place refactor decided at v3.1 STEP 0)
- Sidebar VIEWS section
- Backend user.preferences JSON persistence
- Custom stages, drag-drop, backend batch endpoints, week/agenda calendar, industry auto-populate + backfill, past-deposit-due preset, kanban multi-select, command palette modal, bulk email/export, full bulk reminder, comprehensive keyboard shortcuts, latest work thumbnail per client, LeadDetailModal purple color migration

### Revenue Overview — 3 documented paths (awaiting product decision)
1. Add Revenue card to Today Dashboard (Dashboard v3.1 scope)
2. Add Revenue section to sidebar (dedicated surface, more product weight)
3. Keep as right-sidebar widget only on Today (contextual visibility)

## Iteration 292-v3b (prior) — Saved views + bulk actions + keyboard shortcuts + calendar view
Second substantive iteration in Clients v3 arc. Four operational power workstreams.

### Selected paths (per user confirmation)
- **Saved views storage**: Case A — localStorage keyed by `userId`. Backend `user.preferences Json?` migration → v3.1.
- **Bulk actions**: 3 fully wired (Archive → status:LOST, Stage change → PATCH /:id/status, Tag → PATCH /:id) + Send Reminder as toast stub "Coming in v3.1".
- **Bulk selection surface**: list view only (kanban selection → v3.1).
- **Keyboard**: Case C — CMD+K + / focus existing header search input (no new command palette). J/K/ArrowUp/ArrowDown navigate list rows.
- **Calendar**: Case B — month view via `date-fns v4.1.0`. Week + agenda views → v3.1.
- **Sidebar VIEWS placement**: inline QuickViewsStrip above the filter bar (sidebar was too compact for a new section).

### Files created (5)
- `frontend/src/hooks/useClientsKeyboard.ts`
- `frontend/src/components/clients/savedViews.ts` (presets + storage helpers)
- `frontend/src/components/clients/QuickViewsStrip.tsx`
- `frontend/src/components/clients/ClientsBulkToolbar.tsx` (portaled to document.body)
- `frontend/src/components/clients/ClientsCalendarView.tsx`

### Files modified (3)
- `frontend/src/pages/Dashboard.tsx` — imports, v3b state, hydrate/persist useEffects, Dashboard-level keyboard hook, bulk action handlers (`bulkArchive/bulkStageChange/bulkTag/bulkReminder`), preset/saved-view apply/clear/save/delete handlers, `clientsScopedLeads` memo, `headerSearchRef`, QuickViewsStrip + Calendar + BulkToolbar wiring
- `frontend/src/components/clients/ClientsViewToggle.tsx` — added calendar option; ClientsViewMode expanded to 3 values
- `frontend/src/components/clients/ClientsListView.tsx` — added checkbox column + row selection + list-scoped J/K keyboard hook

### 5 shipped preset views
- All active (stage ∈ inquiry/discovery/quoted/contracted)
- Recent inquiries (inquiry + <14d)
- Awaiting response (quoted + >3d since updated)
- This month (eventDate in current month)
- Completed work (stage=completed)

*Past deposit due preset deferred (no deposit field on Lead schema).*

### Regression checks
- Backend TSC exit 0
- Frontend cold-cache build ✓ 6.92s
- Dashboard chunk 329→356 KB (+27 KB / +8% for 4 new workstreams)
- All v3a components, Dashboard v3, Community v3, Portfolio v3, framework primitives, Phase 2 baselines intact

### Local commit
`be9e331` on branch `main`. 8 files changed, 1559+/23-. **Push blocked** by container auth — user syncs via "Save to GitHub" UI.

## Iteration 292-v3a.2 (prior) — Industry-adaptive stage label refinement
Pure content edit. Refined `industryLanguage.ts` stage label VALUES for all 3 industries so labels feel native to each creator's discipline.

### Ratified labels (Emmanuel confirmed)
| key | Photography | Design | Fine Art |
|---|---|---|---|
| inquiry | Session inquiry | Project inquiry | Commission inquiry |
| discovery | Consultation | Scoping | In discussion |
| quoted | Quote sent | Proposal sent | Quote sent |
| contracted | Session booked | Project active | Commission active |
| completed | Session delivered | Project delivered | Delivered |

### Preservation
- Internal keys (`inquiry / discovery / quoted / contracted / completed` — lowercase per existing shape) UNCHANGED
- Filter comparison / sort / stage bucket logic UNTOUCHED
- Labels render as mono UPPERCASE via CSS `textTransform: 'uppercase'` (no case transformation helper needed)

### Local commit
`59735ce` on branch `main`. 1 file changed, 13+/13-. Push blocked — user syncs via "Save to GitHub".

## Iteration 292-v3a.1 (prior) — Industry filter data-adaptive + tag row chips
Root cause per STEP 0: filter UI shipped without data-reality awareness. Test user had 0/18 leads with industry populated. Case C fix: `ClientsFilterBar` auto-hides industry row when no visible lead has industry populated (mirrors tag-row conditional). Data counts added beside group labels (`Industry (N)` / `Tag (N)`). Up to 2 tag chips + `+N` overflow render on each list row.

Local commit `9fb1a25` (3 files, 108+/19-).

## Iteration 292-v3a (opener) — Clients v3 opens
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
