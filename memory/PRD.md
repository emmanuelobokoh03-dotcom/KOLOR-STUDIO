# KOLOR Studio — PRD

## Original problem statement
Full-stack creator command center for photographers, designers, and fine artists. Community v3 (peer-discovery) + Portfolio v3 (client-conversion) + Dashboard v3 (creator-command-center) arcs comprise the intentional design trilogy.

## Product Requirements
- Strict manual "Smoke Test" verification (user QAs — testing agent DISABLED)
- STEP 0 bash state diagnostic mandatory before every iteration
- Framework calibration: `kolor` tokens, Fraunces italic headings, mono UPPERCASE eyebrows
- Additive-over-breaking: rollback safety maintained per iteration
- Zero touches to preserved arcs unless explicitly in scope

## User personas
- Photographers, Designers, Fine Artists (multi-industry equally)
- Creators operating solo studios; scale gracefully from 2 to 200 clients

## Core requirements — status
- Community v3: **CLOSED** at iter 53 (peer-discovery)
- Portfolio v3: **CLOSED** at iter 56 (client-conversion)
- Dashboard v3: **CLOSED** at iter 61 (creator-command-center; awaiting user smoke test PASS on 291-v3c.2)

## Iteration 291-v3c.2 (this session) — CORRECTIVE
**Two bundled fixes for v3c smoke test findings:**

### Bug 1 — Sheet drawer child chrome z-index overlap → ROOT CAUSE FOUND
- v3c.1 z-index bumps helped WITHIN header stacking context but missed underlying trap
- `.glass-header` has `backdrop-filter: blur(20px)` → per CSS spec creates NEW containing block for `position: fixed` descendants
- Result: aside was anchored to ~65px sticky header box, not viewport
- **Fixed**: `ReactDOM.createPortal(sheet, document.body)` — escapes both containing-block trap AND header's z-40 stacking context
- Codified: any ancestor with `backdrop-filter`, `filter`, `transform`, `perspective`, `will-change`, or `contain: paint` breaks `position: fixed`. Portal to `document.body` is the robust primitive.

### Bug 2 — MESSAGES filter type-string mismatch
- STEP 0 showed 15 notifications across 5 types: POST_LIKED, NEW_FOLLOWER, POST_COMMENTED, DM_REQUEST_RECEIVED, DM_RECEIVED
- MESSAGES filter used strict `n.type === 'DM_RECEIVED'` — excluded DM_REQUEST_RECEIVED entirely
- **Fixed**: MESSAGES filter now aliases both types via OR condition

**Files changed:** `frontend/src/components/dashboard/NotificationBell.tsx` (24+/2- lines)

**Regression checks:** all PASS. Backend TSC exit 0. Frontend cold-cache build ✓. All 5 dashboard cards, Community v3, Portfolio v3, Phase 2 baselines, framework primitives verified intact.

**Local commit:** `510c92d` on branch `main`. Push blocked by container auth — user syncs via "Save to GitHub" UI.

## Prioritized backlog

### P0 — Immediate
- User verifies iter 291-v3c.2 smoke tests (1-3) → closes Dashboard v3 arc
- User taps "Save to GitHub" to sync `510c92d` to origin/main

### P1 — Next arc (Clients v3)
- iter 292-v3a Spec Prep (STEP 0 diagnostic)
- iter 292-v3a: List view (default), Kanban view, view toggle, basic filters/sort, initial-based avatars, framework calibration
- iter 292-v3b: Saved views + bulk actions + keyboard shortcuts + calendar view
- iter 292-v3c: Client detail page redesign + polish + regression

### P2 — Backlog
- Dashboard v3.1: avatarUrl field on CommunityProfile schema + Studio Pulse card (6th card) + user card reordering
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
