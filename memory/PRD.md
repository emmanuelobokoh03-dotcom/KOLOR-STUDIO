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
- **Settings v3: CLOSED** at iter ~73 (calibration + Answer B restructure + Path M2 deprecate + lazy tabs + skeleton + shimmer calibration)

## Iteration Settings v3-v3a (this session) — SEVENTH v3 ARC CLOSURE

### Ships in Settings v3-v3a
- **SettingsModal shell rewritten**: ink-tinted backdrop, `kolor-canvas` container, "PREFERENCES" mono eyebrow + Fraunces italic title, framework X close icon, mono UPPERCASE tab labels with `kolor-terra` active state + bottom-border indicator. `createPortal(document.body)` + `useModalA11y` for backdrop-filter safety + ESC/focus trap.
- **Answer B restructure**: Old "Brand & Studio" split into new **Brand** tab (logo-only) + new **Communications** tab (email signature). Old `BrandSettings.tsx` (306 L color/font/palette UI) deleted; `BrandPreview.tsx` orphan deleted. Community exposed in `VISIBLE_TABS` per Q1a=a. Tab order: Account → Brand → Communications → Money → Scheduling → Notifications → Community.
- **Path M2 deprecate-in-place**: Frontend consumers (`PublicPortfolio`, `ClientPortal`, `SubmitInquiry`, `SubmitTestimonial`, `PublicBookingPage`) no longer read `brandPrimaryColor` / `brandAccentColor` / `brandFontFamily`. Hardcoded to `kolor-terra` + `Fraunces`. **Schema + backend endpoints UNCHANGED** — API compatibility preserved; writes become dead-code (harmless).
- **Framework calibration**: `UserContactInfo` (5 form fields, save button), `MoneyTab` (3 selects + tax input), `EmailSignatureSettings` (textarea + save), `EmailSignatureGenerator` (icon container), `CommunityProfileSettings` (3 toggle backgrounds + save button). All previously purple/legacy → `kolor-terra` + framework tokens.
- **W3 lazy tabs**: All 7 tabs converted to `React.lazy` imports. `<Suspense fallback={<SettingsTabSkeleton />}>` wraps tab content. New `SettingsTabSkeleton.tsx` with framework-calibrated shimmer rows + a11y `role="status"`.
- **`.ks-shimmer` CSS recalibration**: Purple gradient (`#ede9fe → #c4b5fd → #ede9fe`) → `kolor-canvas-shade-1 → kolor-hairline-strong → kolor-canvas-shade-1`. 59 skeleton usages benefit globally.

### Regression checks
- Backend TSC exit 0
- Frontend cold-cache build ✓ 6.49s
- Dashboard chunk 378.87 → 379.94 KB (+0.3%)
- All Settings surfaces purple count: **0** (previously ~18 across 7 files)
- Path M2 audit clean — no live reads of deprecated brand fields
- All Dashboard v3.1 outputs intact (RevenueHero, StudioPulse, avatarUpload)
- All Clients v3.0/v3.1 (v3a/v3a.1/v3b/v3c) components intact
- Dashboard v3 / Community v3 / Portfolio v3 arcs intact
- Framework primitives UNCHANGED
- Sidebar calibration (v3c) preserved (81 framework tokens)
- Phase 2 baselines (iter 280 / 281) intact

### Local commit
- `bb9bfe7` on branch `main`. 17 files changed, +639/-716 (net **negative** due to BrandSettings + BrandPreview deletion). Push blocked by container auth — user syncs via "Save to GitHub".

### Files deleted (Path M2)
- `frontend/src/components/BrandSettings.tsx` (306 L — deprecated color/font/palette UI)
- `frontend/src/components/BrandPreview.tsx` (orphan after BrandSettings removal)

## Prioritized backlog

### P0 — Immediate
- User verifies iter Settings v3-v3a smoke tests (1-6) → **Settings v3 arc CLOSES** at ~iter 73 → **Seventh v3 arc closure completes**
- User taps "Save to GitHub" to sync `bb9bfe7`

### P1 — Calendar v3 arc opens next per Path X sequencing
- Booking flow polish + week/agenda views
- Skip-audit direction confirmed

### P1 — Performance Arc (iter 294) queued
- Backend query optimization beyond Sub-A patch
- Frontend bundle optimization beyond Settings tab lazy-load
- Perceived performance beyond skeleton loading
- Revenue Overview modal calibration
- Community subchips Feed/Discover consistency
- ~8-12 hours across 3 sub-iterations

### P2 — Season Phase 1 remaining
- Calendar v3 (skip audit) — booking flow polish + week/agenda views
- Auth v3 (skip audit) — login/signup/password reset + Google OAuth
- Portfolio Manager v3 (marginal audit)

### P2 — Deferred to Settings v3.1 (future arc if needed)
- Advanced Settings features (backup, export, advanced integrations)
- Feature-level Settings improvements

### P2 — Deferred to Dashboard v3.2
- Advanced Revenue features (multi-currency, tax categorization, export)
- Full Today card action library beyond current action types
- Onboarding banner (Dashboard.tsx L1548) framework calibration
- Status filter chips (L1755/L1837) framework calibration

### P2 — Deferred honestly
- User card reordering (Q2a=e from Dashboard v3.1-v3b)

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

### Season Phase 2 queued
- Email templates (with audit) — bulk email UX from Clients v3.1-v3a foundation ready
- Onboarding tutorials (with audit)
- Beta launch preparation

## Iteration Calendar v3-v3a.1 (this session) — Third cross-arc corrective (BookingModal wiring + Scheduling copy-link)

**Status**: LOCAL COMMIT (`f55b611`) shipped — awaiting Emmanuel smoke tests 1-4.
**Codified**: Learning 89 first execution (Emmanuel product philosophy: KOLOR is client-communication-agnostic CRM — bookings available when needed, not forced).

Two fixes resolving Calendar v3-v3a smoke test findings:

1. **BookingModal re-wiring to ClientDetail** (Fix 1 primary, placement (a))
   - STEP 0 confirmed BookingModal wired in Dashboard.tsx + LeadDetailModal.tsx legacy, but NOT in ClientDetail (Clients v3.1 replacement)
   - Added dedicated `client-detail-schedule` section above portal footer (always visible, not gated on portalUrl)
   - Mono UPPERCASE "SCHEDULE" eyebrow + Inter description + kolor-canvas outlined "Book meeting" button with kolor-terra hover
   - New lazy import + Suspense render + `bookingModalOpen` state
   - Wired with correct BookingModal props (`lead`, `onClose`, `onSaved`) + activity refetch + toast confirmation
   - `data-testid`s: `client-detail-schedule` + `client-detail-book-meeting`
   - **Secondary DEFERRED per Learning 85**: Today card `{kind: 'booking'}` route type would require new variant + Dashboard handler + backend actionLabel cooperation — not trivial per user "if easy" gate. Current 'schedule' actionLabel already opens ClientDetail so user reaches Book meeting in 2 clicks.

2. **Scheduling copy-link URL bug** (Fix 2, one-line prefix fix)
   - Root cause: `SchedulingSettings.tsx:71` fetched `/api/auth/me` **without** `${API_URL}` prefix → frontend origin returned HTML/404 → `userId` state stayed empty → generated URL was `{origin}/book/` → clients hit 404
   - Fix: `fetch('/api/auth/me', ...)` → `fetch(\`${API_URL}/api/auth/me\`, ...)`
   - Isolated single-line inconsistency (Google Calendar status call at line 79 already used correct pattern)

**Verified**: Backend TSC exit 0; frontend cold-cache build 7.29s exit 0; PublicBookingPage.tsx + framework primitives git diff clean; 14 BookingModal references in ClientDetail (was 0); 0 book_meeting references in todayActionContent (correctly deferred).

## Iteration Calendar v3-v3a — Booking flow + Scheduling tab + React Query booking hooks

**Status**: LOCAL COMMIT (`7cd6093`) shipped — awaiting Emmanuel smoke tests 1-5.
**Codified**: Learning 76 (hybrid enumeration optional pattern), first execution of surgical-bulk-search-replace approach for large legacy files (>500 lines) — preserves all logic verbatim while migrating visual layer.

Three workstreams shipped:

1. **BookingModal calibration** (626L, surgical bulk migration, 15 targeted `search_replace` passes)
   - 0 purple/legacy tokens remaining; 44 framework tokens; 8 semantic accents preserved (red/emerald/green/amber)
   - Full visual migration: `text-text-*` → framework, `bg-surface-*` → framework, `border-light-200` → kolor-hairline, `bg-purple-100` → kolor-terra/10, `text-purple-600` → kolor-terra, `focus:ring-purple-500` → kolor-terra focus, `bg-brand-primary` submit button → kolor-terra + `#9A3E24` hover
   - ALL form handlers, state management, API calls, backend contracts, useModalA11y, data-testid attributes preserved verbatim

2. **Scheduling tab calibration bundled** (Path B from Settings v3-v3a.2 sequencing)
   - `SchedulingTab.tsx` (20L shell): full rewrite with kolor-canvas-shade-1 container + mono UPPERCASE "EMAIL DELIVERY" eyebrow + framework code chip
   - `SchedulingSettings.tsx` (626L child): surgical bulk migration, 14 targeted passes; 0 purple/legacy; 64 framework tokens; purple gradient flattened to kolor-canvas-shade-1
   - All scheduling logic (availability windows, timezone, buffer time, meeting types + color picker) preserved verbatim

3. **React Query booking hooks + skeleton** (Path P2 infrastructure)
   - New `frontend/src/hooks/useBookings.ts` (100L): 6 hooks — `useUpcomingBookings`, `useLeadBookings(leadId)`, `useAvailability`, `useCreateBooking`, `useUpdateBooking`, `useCancelBooking`; local staleTime overrides (60s for bookings, 5min for availability); cache invalidation via `['bookings']` parent key
   - New `frontend/src/components/BookingSurfaceSkeleton.tsx` (30L): reuses `.ks-shimmer` keyframes; parameterized row count
   - Infrastructure only — consumer migration to hooks deferred per-component basis to keep regression surface tight

**Explicitly DEFERRED to Calendar v3-v3b (Q1.2=A)**: `Calendar.tsx` (1074L week/agenda page) untouched; `PublicBookingPage.tsx` untouched (already calibrated in prior pass); consumer migration to hooks deferred.

**Verified**: Backend TSC exit 0; frontend cold-cache build 6.11s exit 0; Calendar.tsx + PublicBookingPage.tsx git diff clean.

## Iteration Settings v3-v3a.2 — Second cross-arc corrective (Community tab + proactive sweep)

**Status**: LOCAL COMMIT (`180bfe8`) shipped — awaiting Emmanuel smoke tests 1-4.
**Codified**: First execution of Learnings 71-74 (arc smoke tests can pass while real-usage reveals child-component gaps; proactive sweep prevents accumulation; file-level grep must recurse through tab imports).

**Primary fix** — `CommunityProfileSettings.tsx` (121 lines rewritten, `frontend/src/components/`, not in `settings/` subfolder — imported by `SettingsModal:18`):
- Legacy palette migrated (0 legacy, 30 framework tokens; was 3)
- Mono UPPERCASE "COMMUNITY PROFILE" eyebrow + Fraunces italic "Your presence in the community." heading (previously plain H3)
- Toggle rows: kolor-canvas-shade-1 + kolor-hairline containers; kolor-terra active state (baseline preserved)
- Field labels: mono UPPERCASE 10px; inputs: kolor-canvas + kolor-terra focus
- Save CTA: mono UPPERCASE kolor-terra with emerald `#059669` on saved state
- Copy softened: "KOLOR community" → "the community" per Answer B positioning

**Proactive sweep fixes** (4 child components, Learning 73 recursive discipline):
1. `UserContactInfo.tsx` — 1-line micro-fix (loading placeholder text-text-secondary → kolor-ink-muted)
2. `AccountDangerZone.tsx` (119 lines rewritten) — 8 legacy tokens migrated; semantic red danger accents preserved (`#DC2626` / `#B91C1C` hover / 5% + 20% alpha washes); mono UPPERCASE "DANGER ZONE" eyebrow + Fraunces italic "Delete account" heading; framework-input password field with red-600 focus ring
3. `EmailSignatureSettings.tsx` — 6 legacy tokens migrated; mono UPPERCASE eyebrow + Fraunces italic "Sign off, every time."; preview panel + toggle button framework-calibrated
4. `EmailSignatureGenerator.tsx` (98 lines rewritten) — 9 legacy tokens migrated; Copy Signature button switched from `brandTheme.primaryColor` to kolor-terra (internal UI); GENERATED HTML preserves creator brand color for mailto/portfolio links (legitimate external-email creator brand use); K letter fallback → S letter fallback (Answer B)

**Scheduling tab EXCLUDED** — 0 lines changed; bundled into Calendar v3-v3a W1 per Path B.

**Verified**: Backend TSC exit 0; frontend cold-cache build 6.51s exit 0; all 12 file-receipt checks PASS; 0 purple/legacy across all 5 files.

## Iteration Revenue Modal Calibration Patch — Preserved-component polish

**Status**: LOCAL COMMIT (`580c466`) shipped — awaiting Emmanuel smoke tests 1-3.
**Codified**: Learning 66 (predicted findings resurface during real use), Learning 67 (calibration debt belongs in calibration passes, not Performance Arc).

Two workstreams shipped:

1. **RevenueGoalWidget framework calibration** (Case B moderate refactor, 167 lines rewritten)
   - Migrated 3 `#6C2EDB` literals + 3 `purple-*` utilities + Space Mono + `text-text-*` / `bg-light-*` / `bg-surface-base` / `glass-card` legacy palette to framework tokens
   - 3 render states calibrated (empty / editing / progress display) with kolor-canvas-shade-1 + kolor-hairline containers, mono UPPERCASE eyebrows, Fraunces italic headings
   - Progress bar 3-color logic preserved: goal hit → emerald `#059669` (semantic success), behind pace → amber `#D97706` (semantic warning), on-pace default → `var(--kolor-terra, #B84A2C)` (CHANGED from purple)
   - Save CTA + Set-goal CTA: mono UPPERCASE kolor-terra primary
   - localStorage + validation + keyboard shortcuts + data-testid attributes preserved verbatim

2. **RevenueDashboard framework calibration** (Case B moderate refactor, 167 lines rewritten)
   - Migrated `text-text-*` / `bg-light-*` / `bg-surface-base` legacy palette + removed `--color-brand-primary-rgb` variable read + `#A855F7` purple/fuchsia chart fallback
   - Container: kolor-canvas-shade-1 + kolor-hairline; header eyebrow mono UPPERCASE "OVERVIEW"; title Fraunces italic "Revenue by the numbers"
   - 4-card stat grid: kolor-canvas + kolor-hairline, mono UPPERCASE labels, Fraunces italic 22px metric values
   - Chart palette: bars → kolor-terra, grid → kolor-hairline dashed, axis ticks → kolor-ink-muted mono JetBrains Mono
   - Chart tooltip: framework light-canvas (was dark `#1A1A1A`) with mono UPPERCASE label + Fraunces italic value + kolor-hairline border + soft shadow
   - Semantic accents preserved: emerald (positive delta), red-600 (negative delta), amber-700 (pipeline pending)
   - Fetch logic (useEffect + useState) preserved — modal content only mounts on click so persistence pattern less critical; deferred to any future perf pass

**RevenueDetailModal shell**: 0 lines changed. Framework calibration from v3.1-v3a preserved verbatim.

**Verified**: Backend TSC exit 0; frontend cold-cache build 6.52s exit 0; 50 framework token references in Widget, 36 in Dashboard; 0 legacy palette residue.

## Iteration Settings v3-v3a.1 (previous) — Cross-arc corrective (Path X)

**Status**: LOCAL COMMIT (`9bcab93`) shipped — awaiting Emmanuel smoke tests 1-4.
**First cross-arc corrective in Season Phase 1.** Pattern codified per Learnings 57-59.

Three real-usage findings addressed:

1. **Client Portal K logo removal** (Finding 2, Case A)
   - `ClientPortal.tsx`: `studioName` default `'KOLOR STUDIO'` → `'Studio'`
   - Header + footer purple `#6C2EDB` K-letter fallback boxes removed; brand logo only renders when creator has uploaded one
   - "Powered by KOLOR STUDIO" attribution paragraph removed entirely — clean creator-only surface (no attribution per direction)
   - Unused `Link` import removed
   - iter 280 baseline preserved (portal-money-moment, deposit flow, contract signing)

2. **Revenue Hero persistence bug** (Finding 3, Case B silent-failure)
   - `RevenueHero.tsx`: refactored from `useEffect + useState` to `@tanstack/react-query` `useQuery`
   - `queryKey: ['revenue']`, `staleTime: 60s`, `gcTime: 5min`
   - Persistent surface on error/empty stats — renders zero-state hero with editorial insight instead of collapsing to null
   - Silent-failure regression eliminated
   - React Query provider already wired in `main.tsx`; no install needed

3. **Notifications placeholder copy** (Path 1, Option B)
   - `NotificationsTab.tsx`: replaced "future update" vague copy with transparent editorial surface
   - Mono UPPERCASE eyebrow + Fraunces italic H3 + kolor-terra bulleted list enumerating current auto-notifications + note about beta email templates preferences release
   - Framework tokens throughout; component preserved intact for Settings v3.1 preferences UI work

**Deferred to Settings v3.1**: Notifications preferences UI (Finding 1 — architectural work).

**STEP 0 diagnostic adaptations** (superseded brief inaccuracies):
- No `<KolorMark size={28}>` at line 1063 — actual K surfaces were `studioName.charAt(0)` fallbacks
- No `"Portfolio ·"` separator pattern in ClientPortal
- `@tanstack/react-query` already installed + provider already wraps App in `main.tsx`
- `DashboardHeader.tsx` (56 lines) has no revenue references

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (6.55s), all preservation checks PASS.

## Iteration Calendar v3-v3a (booking flow polish) — CLOSED
- `BookingModal.tsx` (626L) + `SchedulingSettings.tsx` (626L) surgical bulk search_replace to framework tokens
- Added `useBookings.ts` React Query hooks (6 hooks: useUpcomingBookings, useLeadBookings, useAvailability, useCreateBooking, useUpdateBooking, useCancelBooking)
- Added `BookingSurfaceSkeleton.tsx` loading state

## Iteration Calendar v3-v3a.1 (cross-arc corrective) — CLOSED
- Re-wired `BookingModal` to `ClientDetail` action bar ("Book meeting" button, testid `client-detail-book-meeting`)
- Fixed Scheduling copy-link 404 by prefixing `${API_URL}` to `/api/auth/me` fetch

## Iteration Calendar v3-v3b — Calendar v3 arc CLOSER (commit `4ef372d`)
**Scope**: Calendar.tsx (1074L) framework calibration + Week/Agenda view rename + BookingModal z-index Case C fix + W4 deferred per Learning 85.

**W1 — Calendar.tsx surgical bulk calibration**
- 6 purple + 107 legacy tokens → framework tokens (~15 replace_all passes)
- `bg-surface-base` + `bg-light-*` → `kolor-canvas` / `kolor-canvas-shade-1` / `kolor-hairline` / `kolor-ink-whisper`
- `text-text-*` → `kolor-ink` / `kolor-ink-muted` / `kolor-ink-subtle`
- `text-brand-600` + `bg-brand-primary` + `bg-brand-50` + `border-brand-*` → `kolor-terra` family
- Header title upgraded to Fraunces italic serif
- All functionality preserved verbatim; event chip semantic colors preserved (Learning 78)

**W2 — Week + Agenda rename (calibrate-only path)**
- STEP 0 adaptive finding: WeekView + ListView already existed inline
- Enum rename: `CalendarView 'list'` → `'agenda'`
- Toggle chip label: "List" → "Agenda"
- data-testid rename: `calendar-list-*` → `calendar-agenda-*`
- Existing structure + data flow preserved verbatim

**W3 — BookingModal z-index fix (Path 2 bundled, Case C)**
- Root cause: BookingModal (`z-50`, no portal) rendered inside ClientDetail's portal + `z-[100]` stacking context
- Fix: Added `createPortal(content, document.body)` + raised z-index to `z-[110]`
- Modal now renders ABOVE ClientDetail when invoked from Schedule section

**W4 — useBookings consumer migration DEFERRED**
- Per Learning 85 — hooks defined but zero consumers exist; migration non-trivial
- Bundled with Performance Arc systematic React Query rollout

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (6.35s), 15/15 file receipt checks PASS. Framework primitives UNCHANGED.

**Calendar v3 arc CLOSES** — Eighth v3 arc closure. Season Phase 1 remaining: Auth v3 (skip audit) + Portfolio Manager v3 (marginal audit) + iter 294 Performance Arc.



## Iteration Auth v3-v3a — Auth v3 arc CLOSER (commit `97e6e2c`)
**Scope**: Ninth v3 arc single-iteration. 6 workstreams across auth surfaces + OAuth polish + Finding 1 bundle + verification guide delivery.

**W1 — Login.tsx (196L → framework calibrated)**
- 7 purple + 17 legacy → framework tokens
- Left dark panel: purple gradient/glow/avatar → terra tone
- Mono UPPERCASE "SIGN IN" eyebrow + Fraunces italic H1 "Welcome back to KOLOR"
- Google OAuth button: framework outlined, Google brand SVG preserved (Learning 78)
- Remember me checkbox + focus rings + CTAs → kolor-terra
- CTA copy: mono UPPERCASE

**W2 — Signup.tsx (390L → framework calibrated)**
- 17 purple + 22 legacy → framework tokens
- Left panel gradient/checkmarks → terra tone
- PHOTOGRAPHY card selected color: purple → kolor-terra (DESIGN/FINE_ART semantics preserved)
- Mono UPPERCASE "CREATE ACCOUNT · STEP N / 2" eyebrow + Fraunces italic H1 "Start your studio."
- Progress indicator + account-exists soft error + all focus rings → kolor-terra
- Password strength: red/amber/emerald semantic preserved

**W3 — Password reset flow (Q1.2=A full) — ForgotPassword.tsx + ResetPassword.tsx**
- Both fully calibrated (0 purple, 22 + 28 framework tokens)
- Sparkle wordmark Fraunces italic + terra
- Mono UPPERCASE eyebrows: "RESET PASSWORD" / "SET NEW PASSWORD" / "EMAIL SENT" / "PASSWORD UPDATED"
- Fraunces italic H1s ("Forgot your password?" / "Create new password" / "Check your email" / "You're all set.")
- Semantic red/emerald preserved for password match indicator + strength
- CTAs: mono UPPERCASE kolor-terra
- Success surface uses emerald semantic + terra spinner

**W4 — Google OAuth polish (Q1.3=B, Case B enhanced) — AuthCallback.tsx REWRITTEN**
- Loading state: mono UPPERCASE "AUTHENTICATING" + Fraunces italic "Just a moment…" + kolor-terra spinner
- Error state: framework error surface with WarningCircle (red-600 semantic) + mono UPPERCASE "AUTHENTICATION ERROR" + Fraunces italic "We couldn't sign you in."
- **Try again CTA** (data-testid `auth-callback-try-again`) — routes to `/login`
- **Back to login** secondary link (data-testid `auth-callback-back-to-login`)
- All 4 error scenarios (no token / OAuth denied / exchange failed / network error) route to same error surface

**W5 — Finding 1 bundle (Path B)**
- Removed "Event" button (was `data-testid="calendar-add-event"`) from Calendar.tsx view toggle chip row per Emmanuel's finding "two add event buttons; the one in line with week/month/agenda should be removed"
- Preserved DaySidebar buttons: `day-sidebar-add-empty` + `day-sidebar-add`
- Calendar.tsx framework calibration preserved (111 tokens vs 112 baseline, delta = 1 line = expected)

**W6 — Google OAuth verification guide (adaptive: guide-only path)**
- Delivered: `/app/memory/google_oauth_verification_guide.md` (191 lines)
- 5-phase guide: Google Cloud project prep → OAuth consent screen config → Submission process → Reviewer response playbook → Post-approval compliance
- KOLOR-specific scope justification templates + pre-flight checklist
- Timeline: 4-6 weeks review
- Privacy/Terms page calibration DEFERRED — Emmanuel handles content review in parallel to unblock verification submission independently

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (5.79s), 15/15 file receipt checks PASS. Framework primitives UNCHANGED.

**Auth v3 arc CLOSES** — Ninth v3 arc closure. Season Phase 1 remaining: Portfolio Manager v3 (marginal audit) + iter 294 Performance Arc.



## Iteration Portfolio Manager v3-v3a — Portfolio Manager v3 arc CLOSER (commit `dc97028`)
**Scope**: Tenth v3 arc single-iteration. 6 workstreams: creator portfolio management calibration + Privacy/Terms bundle (3+1 content changes + full framework calibration).

**W1 — Portfolio.tsx (652L)**
- 14 purple + 50 legacy → 55 framework tokens
- Header panel gradient/brand → kolor-canvas + kolor-hairline + mono UPPERCASE "PORTFOLIO" eyebrow + Fraunces italic H1
- Grid cards: kolor-terra hover, category chip terra tone + mono uppercase
- Modal focus rings + submit CTA: kolor-terra mono UPPERCASE
- Semantic yellow-400 (featured star) + red (delete) preserved (Learning 78)

**W1 UX wins bundled (Q1.2=AC = a+b+c):**
- (a) Empty state: Image duotone icon + Fraunces italic "Add your first work" + mono UPPERCASE eyebrow + terra CTA
- (b) Drag-drop hover: switched from classList Tailwind toggle (broken by arbitrary values) to direct `style.borderColor` + `style.backgroundColor` with terra rgba
- (c) Featured count: `{n} of 6 featured` now color-coded (kolor-ink → kolor-terra at 6/6)

**W2-W4 (Case A calibration-only)** — Upload + Categories + Featured/Publish preserved, calibration only

**W6 — SharePortfolio.tsx (128L)**
- Gradient/brand panel → kolor-canvas, mono UPPERCASE "SHARE" eyebrow + Fraunces italic H1, terra copy button, framework QR section
- 15 framework tokens

**W6 — PrivacyPolicy.tsx (466L) — content + calibration**
- Change 1: Paystack Payments Limited added after Stripe (NGN/GHS/ZAR/KES + SCC equivalents)
- Change 2: Cookies section expanded with named types (Essential required + Analytics optional + no third-party advertising disclaimer)
- Change 3: "Aggregate anonymized usage data" bullet added to "To Improve Our Product"
- 49 purple → 0 purple / 152 framework tokens
- text-white → kolor-ink (light theme option ii adopted)
- H1: Fraunces italic + mono UPPERCASE "LEGAL" eyebrow
- All H2 headings: Fraunces italic
- Header nav links: mono UPPERCASE
- **Google verification adequacy**: 7/7 required topics covered

**W6 — TermsOfService.tsx (525L) — content + calibration**
- Change 4: Stale KOLOR branding removed from Section 4
  - FREE tier: "KOLOR STUDIO branding on client portal" → "Client portal shows your branding, not KOLOR's"
  - PRO tier: "Remove KOLOR branding" line DELETED (Answer B positioning coherence, Learning 59-63-80)
- 24 purple → 0 purple / 138 framework tokens
- PRO tier gradient → kolor-terra/5 tint
- FREE badge: gray-700 → kolor-canvas + kolor-hairline outline
- H1 + H2s Fraunces italic + mono UPPERCASE "LEGAL" eyebrow

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (6.06s), all regression checks PASS. Framework primitives UNCHANGED.

**Portfolio Manager v3 arc CLOSES** — Tenth v3 arc closure. Only Performance Arc (iter 294) + Season Phase 2 remain.


## Iteration Performance v3-v3a — Performance Arc Sub-1 (commit `3976332`)
**Scope**: First of three performance sub-iterations. React Query systematic rollout + BookingModal migration + Learning 121 cache defaults.

**Codified**: **Learning 121 (NEW) — "Speed is king."** Aggressive cache staleTime + gcTime, silent background refetch on window focus, prefetch on hover, retry resilience.

**W1 — BookingModal migration (Case A minimal per STEP 0)**
- Added `useDeleteBooking` + `useCompleteBooking` hooks to `useBookings.ts` (now 8 hooks total)
- All 5 booking mutations migrated: create/update/delete/complete/cancel → `useMutation` hooks
- Mutation cascade invalidation: `['bookings']` + `['calendar']` + `['today']` on all mutations
- Removed unused `bookingsApi` import from BookingModal
- Calendar/SchedulingSettings/PublicBookingPage NOT migrated (use different APIs — deferred to Sub-2)

**W2 — New Dashboard hooks (isolated hot path migration)**
- NEW `hooks/useDashboardData.ts` (123L, 5 hooks): `useTodayData` + `useDashboardLeads` + `useLeadsStats` + `usePendingContracts` + `usePendingDMCount`
- All hooks apply Learning 121 defaults (aggressive staleTime tuned per volatility)
- `Dashboard.tsx` surgical: `usePendingDMCount` replaces manual `useEffect` polling loop (~15 lines removed, prior UX preserved via `refetchInterval`)
- Init sequence + auto-refresh LEFT INTACT (tangled with auth/OAuth/celebration side effects — deferred to Sub-2)

**W3 — QueryClient defaults + prefetch on hover**
- `main.tsx` QueryClient tuned:
  - `staleTime: 5min` (kept)
  - `gcTime: 10min` (NEW)
  - `refetchOnWindowFocus: true` (was false — silent freshness)
  - `refetchOnReconnect: true` (NEW)
  - `retry: 2` (was 1)
- Prefetch on hover: hovering Calendar sidebar link preloads `['bookings', 'upcoming']` before click

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (9.36s), all regression checks PASS. Framework primitives UNCHANGED. All 10 v3 arcs preserved.

**Deferred to Sub-2/Sub-3**:
- Calendar/SchedulingSettings/PublicBookingPage migration (require new hooks for `calendarApi` + `meetingTypesApi` + `publicBookingApi`)
- Dashboard init sequence + auto-refresh migration (Sub-2 route state persistence)
- Portfolio hook creation + migration (Sub-3)
- Bundle optimization + code splitting (Sub-3)

**Performance Arc Sub-1 CLOSES** — Sub-2 opens: Route state persistence (URL params + localStorage hybrid per Q1.4=C).


## Iteration Performance v3-v3b — Performance Arc Sub-2 (commit `9b3873d`)
**Scope**: Approach B comprehensive Sub-2. Route persistence + needs-attention migration + PublicBookingPage hook migration.

**STEP 0 finding**: Cause B **confirmed** — `NeedsAttentionCard` used local `useTodayData` at `components/dashboard/useTodayData.ts` with plain `useEffect + useState` (NOT React Query). Explains Sub-1 slow-load finding.

**W1 — Route persistence (URL params, Dashboard filters)**
- `projectTypeFilter` + `industryFilter` migrated from `useState` → URL params (`?projectType=...&industry=...`)
- Reads on mount via `searchParams.get`, writes via `setSearchParams({ replace: true })`
- Filter selections persist across navigation + URL-shareable
- Additional filters (statusFilter, staleFilter, clientsFilter saved views) DEFERRED

**W2 — useTodayData React Query migration** (Path 2 primary win)
- `components/dashboard/useTodayData.ts` migrated from useEffect/useState → useQuery
- Query key `['today', 'raw']` matches Sub-1 mutation invalidation from `useCreateBooking` et al
- staleTime 60s + gcTime 5min + refetchOnWindowFocus true
- Consumer API preserved (`{ data, loading }`) — both TodayCard + NeedsAttentionCard now share cache automatically
- **Duplicate cleanup**: Sub-1's separate `useTodayData` in `hooks/useDashboardData.ts` renamed to `useTodayAnalytics` (name collision resolved, different endpoint)

**W3 — PublicBookingPage hook migration**
- NEW `hooks/usePublicBooking.ts` (67L, 3 hooks): `usePublicBookingPage`, `usePublicBookingSlots`, `useCreatePublicBooking`
- 3 API call sites migrated in `PublicBookingPage.tsx`
- refetchOnWindowFocus DISABLED (public flow is single-session UX)
- Slot query key includes date so navigation between dates triggers proper refetch

**W4 — DEFERRED (Case C)**: Dashboard init sequence tangled with auth + OAuth + celebration + first-login + localStorage flags. Migration risk outweighs value; deferred to future dedicated refactor.

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (6.18s), all regression checks PASS. Framework primitives UNCHANGED. All 10 v3 arcs preserved. Dashboard chunk 380.32 kB (10kB smaller than post-Sub-1).

**Performance Arc Sub-2 CLOSES** — Sub-3 opens: Bundle optimization + code splitting + Calendar/SchedulingSettings hook creation (if desired) + perceived performance polish.


## Iteration Performance v3-v3c — Performance Arc Sub-3 (commit `d65a3f1`)
**Scope**: Path 4 findings-first ratification. Five workstreams addressing all 5 Sub-2 real-usage findings + Community subchips consistency. Bundle optimization deferred to Season Phase 2 per Path 4.

**STEP 0 findings vs. brief**: 4 of 5 hypotheses partially confirmed; F3b diagnosed as Dashboard local `useState` (not stale-time). Adaptive branches Q1=a, Q2=a, Q3=a, Q4=a, Q5=a ratified by user.

**W1 — Cache/persistence systematic fixes**
- **F3a** BookingModal cascade extended: `useDeleteBooking` + `useCompleteBooking` now invalidate `['today']` (all 5 mutations consistent)
- **F3b** Dashboard leads + stats migrated to React Query via new `useLeads({ projectType, industry })` + `useLeadStats()` hooks (hybrid mirror pattern — local `useState` retained for ~15 optimistic paths, React Query serves cross-navigation cache-hit)
- **F2** Verified — `useTodayData` already has staleTime 60s + gcTime 5min, main.tsx defaults staleTime 5min + gcTime 10min
- **F4b** Lead activity migrated via new `useLeadActivity(leadId)` + `useAddLeadNote()` hooks; `ClientDetail.tsx` consumer updated

**W2 — URL params page-load restoration (F1a)**
- `clientsFilterInitial` reads all 4 dimensions (`stage` / `filterIndustry` / `tag` / `sort`) from URL on mount
- Write-back `useEffect` appends non-default values; URLs stay clean when filters match defaults
- Existing `projectType` + `industry` URL params preserved

**W3 — Filter chip framework calibration (F1b)**
- 7 chip surfaces framework-calibrated (4 mobile + 3 desktop)
- Removed `bg-blue-50` / `bg-amber-50` / `bg-purple-50` backgrounds
- Applied `kolor-canvas-shade-1` background + `kolor-hairline` border + mono UPPERCASE label (JetBrains Mono 10px 0.16em) + `kolor-terra` X icon
- Stale filter label refined to "Stale · 7+ days"

**W4 — Public booking link enhancement (F4a)**
- `SchedulingSettings.tsx`: added mono-uppercase caption "PUBLIC BOOKING LINK" + descriptive subtitle explaining what the link is for and where bookings surface
- Copy button label expanded from "Copy" to "Copy link"
- API_URL prefix on `/api/auth/me` preserved from Sub-1

**W5 — Community subchips Feed/Discover parity**
- `CommunityDiscover.tsx`: `subChip` + `industry` now URL-synced via `?industry=` and `?subHeadline=` (matches Feed pattern)
- Deep-links + back/forward preserve filter state
- `setIndustry` clears `subChip` on industry change (Feed parity)

**W6 — DEFERRED**: Bundle optimization + code splitting + skeleton coverage + Dashboard init refactor to Season Phase 2.

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (7.42s), all regression checks PASS. Framework primitives UNCHANGED. All 10 v3 arcs preserved. Dashboard chunk 380.32 → 382.92 KB (+2.6 KB, expected for 3 new hooks).

**Files changed**: 7 (5 modified + 2 new hooks). +384 / -63 lines.

**Performance Arc CLOSES** + **Season Phase 1 CLOSES** at commit `d65a3f1`.


## Iteration Performance v3-v3c.1 — Cross-Arc Corrective (commit `f610a04`)
**Scope**: Pre-smoke-test corrective addressing F5 (Clients mobile) + F6 (Auth panel) real-usage findings + Emmanuel-expanded app-wide mobile audit. Path 4 ratifications: Q1=a-ii, Q2=a-a-a, F6=B, KolorLogo=variant approach, audit=minimal.

**STEP 0 findings**: ClientsListView 5-column fixed grid confirmed as sole critical mobile break; all other surfaces render acceptably. Auth pages carry orange/amber tokens (`#E8891A`, `#E8A078`, `#fbbf24`) for swap to terra. KolorLogo hardcodes `#6C2EDB` purple mark box (last legacy purple on utility surfaces).

**W1 — Clients mobile (List + Kanban)**
- New: `frontend/src/hooks/useIsMobile.ts` — shared matchMedia hook, SSR-safe, reactive, 640px default breakpoint
- ClientsListView: Sticky header hidden on mobile; each row renders as 2-tier stacked card (avatar + Fraunces italic name + industry badge + project subtitle; then mono UPPERCASE stage · last-activity · next-action meta). Desktop 5-column grid preserved verbatim.
- ClientsKanbanView: `gridAutoColumns: minmax(78vw, 1fr)` on mobile + `scroll-snap-type: x mandatory` + `scroll-snap-align: start` per column.

**W2 — Auth terra swap + KolorLogo `markTheme` prop**
- Login + Signup: orange/amber tokens replaced with kolor-terra family across StarIcon, CheckSvg, hero italic span, testimonial avatar, checklist, scarcity progress bar, pulse dot, links, ambient glow tints, industry selector state
- Dark background gradient PRESERVED (marketing hero character per Learning 159)
- Ambient glow reduced to `rgba(184,74,44,0.09)` (Q2c=a subtle)
- KolorLogo: added `markTheme: 'terra' | 'purple'` prop (default `'terra'`). Removes last `#6C2EDB` from Dashboard sidebar + Calendar + Login + Signup automatically. LandingPageV2 renders its own inline logo (unchanged).
- Hero copy + testimonial content verbatim (Q2=a-a)
- ForgotPassword + ResetPassword out of scope (no left panel)

**W3 — App-wide mobile audit (documentation only)**
- Report: `/app/memory/mobile_audit_v3c1.md` (107 lines)
- Findings: Critical 1 (fixed), Important 1 (fixed), Minor 0
- **Conclusion: Mobile Calibration iteration NOT REQUIRED before Season Phase 1 closure.** Season Phase 2 may include dedicated pixel-perfect polish iteration.

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (6.42s), all regression checks PASS. Framework primitives UNCHANGED. Dashboard chunk 382.92 → 385.73 KB (+2.8 KB expected).

**Files changed**: 6 (5 modified + 1 new hook). +200 / -25 lines.

Combined smoke test session (9 tests) drives closure: Sub-3 (7) + this corrective (2).


## Iteration Performance v3-v3d — Sub-4 Unblocking (commit `bfd369d`)
**Scope**: Path 3 focused Sub-4 addressing Emmanuel's Test 3 / Test 4 / Test 6 corrective smoke test failures + ProjectType functional gate per data-adaptive resolution.

**STEP 0 diagnoses**:
- Test 3 (Case A): Dashboard `useState<Lead[]>([])` starts empty; Sub-3 mirror useEffect fires post-render → one-tick flicker on return navigation
- Test 4 (deterministic gap): Default `refetchType: 'active'` doesn't refetch inactive queries; BookingModal from ClientDetail context leaves NeedsAttentionCard cache invalidated but not refetched until Dashboard remounts
- Test 6 (inherent): First-load slowness is React Query fundamentals; hover-prefetch reduces perceived latency
- ProjectType (Case B): Backend has 4 enum values; user's dataset is uniform SERVICE → dropdown shows only "Book"

**W1 — Test 3 architectural fix (Case A)**
- `useState` initializers read from React Query cache via `queryClient.getQueryData(['leads', projectType, industry])` and `queryClient.getQueryData(['leads-stats'])`
- `loading` initialized to `!_cachedLeads` — skeleton skipped on cache hit
- Return navigation renders cached data on FIRST render tick

**W2 — Test 4 architectural fix (deterministic cascade)**
- New shared `cascadeBookingInvalidations()` helper in `useBookings.ts`
- All 5 mutations invalidate: `['bookings']` + `['calendar']` + `['today']` + `['leads']` + `['leads-stats']` with `refetchType: 'all'`
- Guarantees inactive-query refetch across route contexts

**W3 — Test 6 prefetch-on-hover**
- Prefetch handler added to ClientsListView desktop rows + ClientsKanbanView desktop cards
- `queryClient.prefetchQuery({ queryKey: ['lead-activity', leadId], ... })` on mouseEnter
- Mobile skipped via `useIsMobile(640)` early-return (touch UX preserved)

**W4 — ProjectType data-adaptive gate (Case B)**
- Guard changed `.length > 0` → `.length > 1` (desktop + mobile)
- Filter auto-appears when user's data has ≥2 distinct types
- Mobile grid collapses to `grid-cols-1` when projectType hidden (industry gains full width)
- Aligns with existing `availableIndustries.length > 1` pattern

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (6.46s), all regression checks PASS. Framework primitives UNCHANGED. Dashboard chunk 385.73 → 386.31 KB (+0.6 KB).

**Files changed**: 4 (Dashboard.tsx, useBookings.ts, ClientsListView.tsx, ClientsKanbanView.tsx). +84 / -31 lines.

Sub-4 smoke test (4 focused tests) drives Performance Arc + Season Phase 1 closure.


## Iteration Performance v3-v3e — Sub-5 Final Unblocking (commit `1d853a2`)
**Scope**: Path 1 focused unblocking — Test 2 needs-attention data-model gap + Finding A Critical button click + Finding C Auth 20→10 spots typo. Finding B booking miss/cancel structure DEFERRED to Season Phase 2 P1.

**STEP 0 findings**:
- Test 2 (Case B): Sub-4 cascade helper correctly reaches `['today', 'raw']` via React Query prefix matching. **Real gap**: backend `/api/today` never queried bookings — no cascade can surface data that doesn't exist.
- Finding A: `criticalBadge` rendered as decorative `<span>` with no click handler.
- Finding C: 2 references in Signup.tsx ("First 20 spots" + "17 of 20 beta spots claimed"). LandingPageV2 already correct.

**W1 — Backend `/api/today` booking attention items (Case B)**
- Added `upcomingBookings` query: CONFIRMED bookings within next 48h, joined with lead
- New attention types: `booking_imminent` (<2h, tier critical, priority 95) + `booking_upcoming` (2-48h, tier warning)
- Frontend `URGENCY_META` extended with both booking tiers
- Boundary preserved: surfaces EXISTING CONFIRMED bookings only. MISSED/NO_SHOW lifecycle deferred to Finding B iteration.

**W2 — Critical badge → functional filter button (Finding A)**
- Converted `<span>` → `<button type="button">` with `useState<boolean>` filter toggle
- Click toggles `criticalOnly` — filters visible items to critical-tier only
- aria-pressed + aria-label for accessibility
- Visual state: kolor-terra bg "N critical" ↔ kolor-ink bg "Show all"
- Meta line reflects filter state; empty-state fallback prevents dead-end toggle

**W3 — Auth Signup.tsx 20→10 spots typo (Finding C)**
- L155: "First 20 spots" → "First 10 spots"
- L177: "17 of 20 beta spots claimed" → "7 of 10 beta spots claimed"
- L175: progress bar width 85% → 70% (recalculated for 7/10)

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (6.09s), 0 "20 spots" refs remaining, all regression checks PASS. Framework primitives UNCHANGED. Dashboard chunk 386.31 → 386.83 KB (+0.5 KB).

**Files changed**: 4 (today.ts, useTodayData.ts, NeedsAttentionCard.tsx, Signup.tsx). +92 / -10 lines.

Sub-5 closes the Performance Arc + Season Phase 1 upon 4/4 smoke pass.


## Iteration Season Phase 2 P0-1 — Dashboard Hydration + gcTime + Visualizer (commit `c578a21`)
**Scope**: First Season Phase 2 iteration bundling W1 Dashboard init hydration extraction (partial untangle) + W2 Test 1 persistence architectural fix + W3 Bundle visualizer. Path 4 ratifications Q1-Q5=A applied.

**STEP 0 findings**:
- Dashboard.tsx: 2408L, 15 useEffects, 44 useStates — deep tangling
- All routes ALREADY lazy-loaded in App.tsx (21 lazy imports)
- Global gcTime 10min; hook overrides at 5min — insufficient for cross-session cache retention
- Test 1 root cause: cold-boot queries don't fetch until subscribing components mount

**W1 — useDashboardHydration hook (partial untangle)**
- New `frontend/src/hooks/useDashboardHydration.ts`
- `useLayoutEffect` prefetches `['leads']` + `['leads-stats']` + `['today','raw']` synchronously with render commit
- Gated by `userId`; fire-and-forget with React Query dedup
- Auth/OAuth/celebration extraction deferred to future dedicated iteration (Q5=A untangle-only)

**W2 — Test 1 persistence architectural fix (Case A + B combined)**
Three-layer fix:
1. `useDashboardHydration` prefetches on Dashboard mount
2. `gcTime` extended to 30min across all critical caches: `main.tsx` QueryClient global 10min → 30min, `useLeads` 5min → 30min, `useLeadStats` 5min → 30min, `useTodayData` 5min → 30min
3. `staleTime` unchanged (60s) — background refresh discipline preserved

Emmanuel's FOUR-iteration finding resolved at architectural root instead of downstream patches.

**W3 — Bundle visualizer (routes already split)**
- Installed `rollup-plugin-visualizer@^5.9.0`
- `vite.config.ts` emits `dist/bundle-stats.html` on every build (treemap + gzip + brotli)
- `frontend/.gitignore` excludes stats file from commits
- Foundation for continuous bundle discipline (open `dist/bundle-stats.html` after any build)

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (10.26s), all regression checks PASS. Framework primitives UNCHANGED. Dashboard chunk 386.83 → 387.79 KB (+1 KB hydration hook).

**Files changed**: 9 (+205 / -10). NEW: useDashboardHydration.ts, .gitignore. MODIFIED: Dashboard.tsx, useLeads.ts, useTodayData.ts, main.tsx, vite.config.ts, package.json, yarn.lock.


## Season Phase 2 — Opens with P0-1 CLOSED
Priority ordered:
- **P0-2** Email Templates iteration (with audit) — NEXT
- **P0-3** Onboarding Tutorials (with audit)
- **P1** Notifications preferences UI in Settings v3.1
- **P1** Booking miss/cancel lifecycle infrastructure (Finding B)
- **P1** Landing page recalibration
- **P1** KOLOR spinner redesign
- **P1** Dashboard init full refactor (auth/OAuth/celebration extraction) — deferred from P0-1
- **Dedicated** Filter density minimization
- **External (Emmanuel)** Google OAuth verification submission propagation


## Iteration Season Phase 2 P0-2 — Ready to Work Status + Email Sequencing (commit `7a08014`)
**Scope**: Path 4 ratified — sequencing/status FIRST, creative/calibration SECOND (P0-3). Two workstreams addressing email sequencing architectural gap + "ready to work" MVP.

**STEP 0 findings**:
- Email service: `onboardingService.ts` scheduled (every 6h) sending emails 1/2/3 at day 0/2/7 post-signature
- Auto-enroll: `contracts.ts` L501-506 called `enrollInOnboarding` on contract sign — redundant per Emmanuel finding (quote email already delivers portal access)
- LeadStatus enum: 8 values; chose additive `readyToWork` Boolean field over enum extension for simpler MVP + preserved filter/Kanban semantics

**W1 — Email sequencing revision**
- `contracts.ts`: Auto-enroll on signature commented out
- Onboarding email 1 (welcome/orientation) now fires only when creator explicitly flips `readyToWork = true`
- Emails 2 and 3 preserved verbatim
- All other email triggers UNCHANGED

**W2 — Ready to Work MVP**
- **Schema**: Added `readyToWork: Boolean @default(false)` + `readyToWorkAt: DateTime?` to Lead. `prisma db push` applied.
- **Endpoint**: `POST /api/leads/:id/mark-ready-to-work` — ownership check, idempotent, fires enrollment on flip, logs STATUS_CHANGED activity
- **API client**: `leadsApi.markReadyToWork()` method
- **ClientDetail UI**: Ready-to-Work section on BOOKED leads. Before: canvas-shade-1 card + "Mark ready to work" terra button. After: terra card with "ONBOARDING SENT" caption + timestamp
- **Dashboard nudge**: `readyToWorkPrompts` query in `/api/today` — BOOKED leads with `readyToWork=false` + COMPLETED booking in last 7d. Attention type `ready_to_work_prompt`, tier 'new', label "KICKOFF DONE · SEND WELCOME". Dashboard dispatch fires one-click markReadyToWork + cascade invalidates `['today']`+`['leads']`

**Verified**: Backend TSC exit 0, Frontend build exit 0 (9.63s), Framework primitives UNCHANGED, all P0-1 + Season Phase 1 outputs preserved. Dashboard chunk 386.83 → 388.28 KB (+1.45 KB expected).

**Files**: 8 changed (+195 / -10). NEW schema fields + endpoint + API method + ClientDetail section + attention item type + Dashboard dispatch.

## Season Phase 2 P0-3 — DONE (commit 6d49d00) — Feb 2026
Bundled corrective (P0-2 Test 2 fix + needs-attention action pattern) with
original P0-3 creative scope (email design + content + calibration +
testimonial + share files) per Emmanuel velocity priority Path 1.

**W1 — Needs-attention action pattern universal fix (Learning 188)**
- NEW `frontend/src/hooks/useNeedsAttentionActions.ts` → `cascadeActionInvalidations(queryClient, leadId?)` helper
- Invalidates `['today']` + `['leads']` + `['leads-stats']` + `['lead', id]` + `['lead-activity', id]` with `refetchType: 'all'`
- Applied at 3 dispatch paths:
  - Dashboard.tsx:1701 — `ready_to_work_prompt` one-click (extended)
  - Dashboard.tsx:2285 — `activeTodayEmailModal.onSent` (new)
  - ClientDetail.tsx:1014 — `markReadyToWork` click (new)
- Root cause: `BulkEmailModal.onSent` only called `fetchLeads()` — `['today']` stayed stale, nudge remained in capsule after reply
- Emmanuel's new_lead_reply finding RESOLVED

**W2 — Mark ready to work (Case B cascade fix)**
- Button render + condition verified correct (`status === 'BOOKED'`)
- Added cascade invalidation after API success in ClientDetail
- P0-2 Test 2 failure RESOLVED

**W3 — Email creative content (Direction D voice)**
- `sendClientOnboardingEmail` step 1 rewritten with Direction D voice:
  - Subject: "We're on. Here's what happens next."
  - UPPERCASE eyebrows: WELCOME · {projectLabel} / TIMELINE / COMMUNICATION / WHAT I NEED FROM YOU FIRST / YOUR PORTAL · FOR REFERENCE
  - Georgia italic warmth beats ("So glad we're doing this" / "Looking forward to working together")
  - Signature: `{creativeName} · {creatorRole}` (industry-adaptive via new resolver)
  - Footer: "Sent via KOLOR Studio" minimal
- Industry role resolver maps PHOTOGRAPHY→Photographer, DESIGN→Designer, FINE_ART→Fine artist, etc.
- Steps 2 (portal guide) + 3 (progress update) preserved verbatim per P0-2 contract

**W4 — Email framework calibration**
- `emailDesignSystem.ts` rebased to KOLOR tokens:
  - `#6C2EDB` → `#B84A2C` (terra)
  - `#F9F7FE` → `#F7F4EE` (canvas)
  - `#1A1A2E` → `#1A1613` (ink)
  - `#EDE8F5` → `#E5E0D8` (hairline)
  - Header band `#080612` → `#1A1613` (ink)
- `buildEmailTemplate` h1 switched to Georgia serif + weight 600
- Buttons: terra fill, 2px radius, UPPERCASE 0.08em tracking
- All 50+ sender functions inherit visual calibration automatically via `buildEmailTemplate` + `getEmailTemplate` wrappers
- MSO/Outlook + mobile responsive patterns preserved

**W5 — Portfolio Manager testimonial calibration**
- `TestimonialsManagement.tsx` 4 legacy color instances → KOLOR tokens:
  - Pending stat `text-amber-700` → kolor-terra
  - Star rating `text-yellow-400` → warm amber `#D9A94E` (universal rating convention)
  - Awaiting badge `bg-amber-500/20 text-amber-700` → terra tint
  - Copy-link hover `hover:text-purple-600` → kolor-terra
- CRUD + PublicPortfolio display UNCHANGED

**W6 — ClientPortal share files calibration**
- Share files capsule tokens applied:
  - File row `bg-gray-50 border-gray-100` → kolor-canvas-shade-1 + hairline
  - File icon `text-[#6C2EDB]` → kolor-terra
  - "You uploaded" badge `bg-blue-50 text-blue-600` → terra tint
  - Download button `bg-[#6C2EDB]` → kolor-terra
- Share files functionality UNCHANGED

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (10.12s), framework primitives git diff clean, 3 cascade call-sites verified via grep, legacy purple in emailDesignSystem.ts only in comments. 7 files changed (+279/-131).

## Season Phase 2 P0-3 Corrective — DONE (commit 31428d5) — Feb 2026
Focused corrective bundling optimistic UI + BOOKED status infrastructure
+ exhaustive ClientPortal purple audit + Emergent walkthrough workflow.

**W1 — Optimistic UI for needs-attention actions**
- NEW `optimisticallyRemoveActionItem(queryClient, itemId)` helper uses `setQueryData` against `['today', 'raw']` to drop item from `attention[]` instantly
- `cascadeActionInvalidations` refetchType `all` → `active` (less thrash)
- Applied at 3 dispatch paths: ready_to_work_prompt, email modal (via new `attentionItemId` on modal state), ClientDetail markReadyToWork (lead-based filter)
- Rollback on failure refetches `['today']` fully

**W2 — BOOKED status infrastructure (Q1=c all 4 surfaces)**
- NEW `frontend/src/components/clients/StatusBadge.tsx` → STATUS_META for all 8 LeadStatus enums
- BOOKED rendered in terra; other statuses neutral
- Rendered at ClientDetail header + ClientsListView (mobile + desktop) + ClientsKanbanView card + ClientsCalendarView lead strip
- Button condition verified Case A — `status === 'BOOKED'` matches enum
- NEW `POST /api/admin/seed-booked-lead` idempotent seed endpoint (Q3=b)

**W3 — ClientPortal purple exhaustive audit**
- Fixed 8 ClientPortal.tsx instances + 7 additional sources found during walkthrough:
  - ClientFileUpload (Share Files icon, dropzone, selected-file icon, textarea focus, upload button)
  - CookieConsent (icon bg + icon color, Learn more link, Accept All button)
  - App.tsx skip-link
- Runtime Playwright DOM scan confirms **zero** `rgb(108, 46, 219)` remaining on ClientPortal

**W4 — Emergent walkthrough workflow (Q3=b)**
- Seeded BOOKED test lead via admin endpoint
- Verified at desktop 1920x800 via Playwright:
  - Clients list shows BOOKED terra badge on seed row + NEW badges on others
  - ClientDetail header has StatusBadge next to stage label + Mark ready button
  - ClientPortal hero + progress stepper + Share Files + cookie banner all terra
  - Runtime purple scan returns 0 occurrences

**Preservation**: All P0-1 + P0-2 + P0-3 outputs preserved. Framework primitives UNCHANGED. Email Direction D voice preserved. Portfolio testimonial UNCHANGED. cascadeActionInvalidations preserved (optimistic layer added before).

**Verified**: Backend TSC exit 0, Frontend cold-cache build exit 0 (11.00s), framework primitives git diff clean. 12 files changed (+290/-46).

## Season Phase 2 — Opens Next
Priority ordered (P0 → P2):
- **P0-4** Onboarding tutorials (with audit)
- **P1** Notifications preferences UI in Settings v3.1
- **P1** Landing page recalibration
- **P1** KOLOR spinner redesign
- **P1** Booking miss/cancel handling structure (Sub-5 Finding B)
- **Dedicated iteration** Filter density minimization
- **Optional** Prefetch-on-hover extension (Calendar + Portfolio)
- **Optional** Welcome-back animation on Auth focus
- **P2** Dashboard init refactor (2200+ line untangling)
- **P2** Beta launch preparation + real user feedback loop
- **External** Google OAuth verification submission





## Tech stack (unchanged)
- Frontend: React 18 + Vite + TypeScript + custom kolor-design CSS variables + @tanstack/react-query (already wired in main.tsx, app-wide staleTime 5min)
- Backend: Node/Express + TypeScript + Prisma + PostgreSQL (Supabase)
- Storage: Supabase (`brand-logos`, `portfolio`, `community`, `avatars`)
- Location: `/app/kolor-studio-v2/` (root); `/app/frontend`, `/app/backend` are Emergent stub scaffolds
- Deployment: Railway (backend), Vercel (frontend)

## Test credentials
- Standard test account: `bookingtest@test.com` / `password123`
