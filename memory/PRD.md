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

## Arc closure status
- Community v3: **CLOSED** at iter 53 (peer-discovery)
- Portfolio v3: **CLOSED** at iter 56 (client-conversion)
- Dashboard v3: **CLOSED** at iter 61 (creator-command-center)
- **Clients v3: CLOSED** at iter 66 (operational spine)
- **Clients v3.1: CLOSED** at iter ~68-69 (deep-work surface + operational polish + backlog resolution + universal chrome calibration)
- **Dashboard v3.1: CLOSED** at iter ~71-72 (revenue redesign + Today card actions + Community subchips fix + Studio Pulse + avatarUrl + revenue query optimization)

## Iteration 293-v3.1-v3b (this session) — Studio Pulse + avatarUrl + Revenue Optimization — Dashboard v3.1 ARC CLOSER

### Ships in v3.1-v3b
- **`StudioPulseCard.tsx`** (new, ~250 LOC) — 6th card in DashboardCards region. Hybrid design: Fraunces italic 40px weekly total + "+X% vs last" delta indicator + 7-day mini bars (today = terra fill) + editorial insight ("Busy week — strong momentum" / "Steady rhythm" / "Quiet week — space for deep work" / etc.). Q1b=b filter — meaningful ActivityTypes only (excludes PORTAL_VIEWED).
- **`GET /api/activities/pulse?days=7`** (new backend endpoint) — single findMany + in-memory bucketing over 2×days window for week-over-week delta. Backed by existing `@@index([userId, createdAt])` on Activity.
- **User card reordering (W2)**: SKIPPED per Q2a=e — no clear backlog intent found; honest scope discipline. Deferred until concrete intent lands.
- **`User.avatarUrl String?`** Prisma schema addition (applied via `prisma db push` — shadow DB validation blocked `migrate dev` on pre-existing migration).
- **`POST/DELETE /api/user/avatar`** (new backend routes) — Supabase `avatars` bucket (Q3a=a), stable path `{userId}-avatar.{ext}` with `upsert:true` (Q3b=b), 2MB cap, JPG/PNG/WebP, cache-bust query string on public URL.
- **`AvatarUploadSection.tsx`** (new) — 80px preview + Upload/Change photo (terra CTA) + Remove secondary + Inter body hint. Placed at TOP of AccountTab (Q3c=a).
- **`ClientAvatar`** extended: `avatarUrl` prop alongside existing `photoUrl` (both render image, falls back to Fraunces italic initials).
- **Sidebar user card** in Dashboard.tsx now conditionally renders `<img>` when `user.avatarUrl` present.
- **`GET /api/auth/me`** now returns `avatarUrl` in User selection (auth.ts).
- **W4 Revenue endpoint optimization (Sub-A bundled)**: `getRevenueStats` refactored from **13 sequential queries** (4 aggregates + 12-loop for monthlyTrend) → **5 parallel queries** (4 aggregates + 1 findMany with in-memory bucketing via new `buildMonthlyTrendFromRows` helper). New `@@index([userId, status, receivedDate])` composite on Income supports both aggregate WHEREs and trend scan.

### Regression checks
- Backend TSC exit 0
- Frontend cold-cache build ✓ 6.52s
- Dashboard chunk 372.79 → 378.87 KB (~2% growth expected from StudioPulseCard + AvatarUploadSection)
- All Clients v3.0/v3.1 (v3a/v3a.1/v3b/v3c) components intact
- Dashboard v3.1-v3a intact (RevenueHero + RevenueDetailModal + Today action wiring + Community subchips)
- Dashboard v3 / Community v3 / Portfolio v3 arcs intact
- Framework primitives UNCHANGED
- Sidebar calibration (v3c) preserved (81 framework tokens)
- Phase 2 baselines (iter 280 / 281) intact

### Local commit
- `933386f` on branch `main`. 11 files changed, +806/-29. **Push blocked** by container auth — user syncs via "Save to GitHub" UI.

### Adaptive branches ratified
- Q1a=c: Studio Pulse hybrid mini bars + prominent Fraunces total
- Q1b=b: Meaningful activities only (excludes PORTAL_VIEWED)
- Q2a=e: User card reordering SKIPPED (honest scope discipline)
- Q3a=a: Avatar bucket `avatars`
- Q3b=b: Stable single-file path `{userId}-avatar.{ext}` with upsert
- Q3c=a: Avatar upload UI at TOP of AccountTab
- Sub-A: Revenue endpoint optimization bundled

## Prioritized backlog

### P0 — Immediate
- User verifies iter 293-v3.1-v3b smoke tests (1-5) → **Dashboard v3.1 arc CLOSES** at ~iter 71-72
- User taps "Save to GitHub" to sync `933386f`

### P1 — Performance Arc (iter 294) opens next
- Bundle optimization (code splitting, lazy loading beyond current lazy imports)
- Perceived performance (skeleton loading refinement, optimistic UI)
- Additional backend query optimization (endpoints beyond `/crm/revenue`)
- Revenue Overview modal calibration (RevenueDashboard + RevenueGoalWidget content — pre-v3 legacy shell inside calibrated modal)
- Community subchips consistency (Feed vs Discover parity)
- ~8-12 hours across 3 sub-iterations

### P2 — Deferred to Dashboard v3.2
- Advanced Revenue features (multi-currency, tax categorization, export)
- Full Today card action library beyond current action types
- Onboarding banner (Dashboard.tsx L1548) framework calibration
- Status filter chips (L1755/L1837) framework calibration

### P2 — Deferred honestly
- User card reordering (Q2a=e) — reopen when concrete intent lands

### P2 — Deferred to Clients v3.2
- Project-type filter decision + "All Types" dropdown removal
- Custom pipeline stages + Sidebar VIEWS section
- Latest work thumbnail per client
- Kanban card multi-select + drag-drop kanban stage change
- Command palette modal
- Week + agenda calendar views
- Comprehensive keyboard shortcuts
- Advanced attachment library
- Delete permanently action (archived view)
- Undo pattern extension to other destructive actions
- LeadDetailModal.tsx deletion (safely sidelined by ClientDetail.tsx)

### P2 — Season Phase 1 remaining
- Calendar v3, Portfolio Manager v3, Settings v3, Auth v3 arcs
- Email templates & Onboarding tutorials
- Beta launch preparation

## Tech stack (unchanged)
- Frontend: React 18 + Vite + TypeScript + custom kolor-design CSS variables
- Backend: Node/Express + TypeScript + Prisma + PostgreSQL (Supabase)
- Storage: Supabase (`brand-logos`, `portfolio`, `community`, `avatars` — new this iter)
- Location: `/app/kolor-studio-v2/` (root); `/app/frontend`, `/app/backend` are Emergent stub scaffolds
- Deployment: Railway (backend), Vercel (frontend)

## Test credentials
- Standard test account: `bookingtest@test.com` / `password123`

## Iteration 293-v3.1-v3a (this session) — Revenue Redesign + Today Actions + Community Subchips — Dashboard v3.1 arc anchor

### Ships in v3.1-v3a
- **`RevenueHero.tsx`** (new, ~300 LOC) on Today view above DashboardCards. Path C hero metric strip: Fraunces italic 40px metric + mono "THIS MONTH · YTD $X" eyebrow + editorial insight ("On pace" / "Slow month — quiet is okay" / etc.) + 48px goal ring + 96×24 inline SVG sparkline. Container `kolor-canvas-shade-1` + `kolor-hairline` bottom. Click metric OR goal → `RevenueDetailModal`.
- **`RevenueDetailModal.tsx`** (new, ~140 LOC) — createPortal safe, wraps existing `<RevenueDashboard />` + `<RevenueGoalWidget />` in Suspense. Fraunces italic title "Your earnings, close-up".
- **Revenue Overview removed from Clients right sidebar** (Dashboard.tsx L2091-2110). OnboardingChecklist preserved. Original component files retained in codebase (reached via modal).
- **`todayActionContent.ts`** (new, ~150 LOC) — `resolveTodayAction(item)` decides between `{kind: 'email'}` (Send reminder / Follow up / Reply / Message → BulkEmailModal with stage-aware pre-fill) and `{kind: 'detail'}` (Send offer / Mark done / Schedule / Review → ClientDetail at correct tab). Unknown labels log warning + fall back.
- **DashboardCards → NeedsAttentionCard → TodayCard onLeadClick signature extended** to `(leadId, tab?, item?: AttentionItem)`. Card render sites pass full item as 3rd arg. inProgress items preserve legacy behavior (no item passed → full detail).
- **Dashboard.tsx onLeadClick** intercepts item and dispatches to `setActiveTodayEmailModal` (email) or legacy `setSelectedLead` (detail). Modal renders regardless of viewMode.
- **CommunityDiscover subchips fix**: subChip state added + FilterChipBar receives `activeSubChip` + `onSubChipChange` + fetchProfiles now sends `?subHeadline=X`. Backend `/api/community/discover` L442 already accepts the param — zero backend touches. Case B pre-existing bug (existed since iter 287-v3c). v3c calibration confirmed innocent.

### Regression checks
- Backend TSC exit 0
- Frontend cold-cache build ✓ 6.23s
- Dashboard chunk 368.93 → 372.79 KB (~1% growth expected)
- 81 framework tokens preserved in Dashboard.tsx (sidebar calibration from v3c intact)
- All Clients v3.0/v3.1 (v3a/v3a.1/v3b/v3c) components intact
- Dashboard v3 / Community v3 / Portfolio v3 arcs intact
- Framework primitives UNCHANGED
- Phase 2 baselines (iter 280 / 281) intact

### Local commit
- `4101639` on branch `main`. 8 files changed, +755/-31. **Push blocked** by container auth — user syncs via "Save to GitHub" UI.

### Adaptive branches ratified
- Q1a=a: RevenueDetailModal wrapping existing components (minimal build, deep view)
- Q1b=a: Custom inline SVG sparkline (no new deps)
- Q2a=b: New `utils/todayActionContent.ts` module (testable, separated)
- Q2b=b: Log warning + fall back for unrecognised action labels
- Q3a=a: Full end-to-end subchip fix (frontend state + backend param)

