# App-Wide Mobile Audit — iter Performance v3-v3c.1

**Date**: Feb 2026
**Scope**: All major surfaces surveyed for mobile viewport (≤640px) behaviour prior to Season Phase 1 closure.
**Method**: Static analysis — responsive class density, fixed grid patterns, `@media` fallback coverage, inline width hardcodes.

---

## Summary conclusion

**Only ClientsListView flagged as CRITICAL mobile break.** Fixed in this iteration.
**ClientsKanbanView polish opportunity** (scroll-snap) — also applied in this iteration.
**All other surfaces render acceptably on mobile.**

**Mobile Calibration iteration is NOT REQUIRED before Season Phase 1 close.**

---

## Per-surface inspection

### Dashboard (`pages/Dashboard.tsx`, 2298L)
- Responsive classes: **34** (`md:` / `sm:` / `lg:` / `xl:`)
- Fixed grid patterns: **1** — `1fr 280px` right sidebar, but gated on `lg:` breakpoint only. Collapses to stacked below `lg`.
- Complete-onboarding banner and filter chips have `md:` breakpoints.
- Uses `useMemo` + `matchMedia` for `prefers-reduced-motion`.
- **Verdict**: ✅ Acceptable mobile behaviour.

### Calendar (`pages/Calendar.tsx`)
- Responsive classes: **25**
- Fixed grid patterns: **8** (week view internals)
- Has explicit `isMobile` state via `window.innerWidth < 768` + adaptive week view (`isMobile ? days.slice(mobileStart, 3) : days`).
- **Verdict**: ✅ Mobile handled (per Calendar v3-v3b arc).

### Community (Feed + Discover + subcomponents)
- Responsive classes: minimal `md:` (most components have 0)
- Fixed grid patterns: **6** — all use `repeat(auto-fit, minmax(*, 1fr))` which **self-collapses** on narrow viewports.
- Discover: `repeat(auto-fit, minmax(280px, 1fr))` — 1 column on <320px, 2 on 320-560, 3+ desktop.
- **Verdict**: ✅ Auto-collapsing grids handle mobile naturally.

### Portfolio (creator surface + `PublicPortfolio` + `PublicProfile`)
- Responsive classes: 7 in `Portfolio.tsx`
- `PublicProfile`: has `@media (max-width: 900px)` and `(max-width: 560px)` for masonry column count.
- `PublicPortfolio`: has `@media (max-width: 1024px)`, `768px`, `640px` for testimonial grid and other blocks.
- **Verdict**: ✅ Explicit mobile breakpoints in place.

### Settings tabs (7 tabs)
- Responsive classes per tab: **MoneyTab 2, all others 0**
- Fixed grid patterns: **0**
- Nature: stacked forms (single-column by default) — no columnar layout to break.
- **Verdict**: ✅ Stacked forms are mobile-friendly by construction.

### Auth pages (Login + Signup + ForgotPassword + ResetPassword)
- All use `md:grid-cols-[420px_1fr]` two-column with `grid-cols-1` mobile fallback.
- Left brand panel hidden `md:` and below (`hidden md:flex`).
- Mobile-only KolorLogo variant appears at top of right panel.
- **Verdict**: ✅ Mobile handled by design (`md:hidden` toggles).
- **Note**: This iteration also swapped orange/amber → terra tokens for framework consistency.

### SubmitInquiry (`pages/SubmitInquiry.tsx`)
- Has `@media (max-width: 768px)` fallback.
- All grids use `repeat(auto-fit, minmax(200px, 1fr))` — self-collapsing.
- **Verdict**: ✅ Handled.

### Public surfaces (SharePortfolio, PublicBookingPage, ClientPortal)
- Have `@media` queries + stacked defaults.
- **Verdict**: ✅ Handled.

### Clients (List + Kanban) — **THIS ITERATION**
- **ClientsListView** (previous state): Fixed 5-column `gridTemplateColumns: '32px minmax(0, 2fr) 120px 120px 140px'` at 2 sites. **No mobile breakpoint.** ❌ CRITICAL.
- **ClientsKanbanView** (previous state): Horizontal scroll via `overflowX: auto` (iter 292 Q10=B) but no scroll-snap → columns overshoot on swipe. ⚠️ MINOR.

**Fixes applied this iteration (W1)**:
- ClientsListView: Added `useIsMobile(640)` hook + mobile stacked card branch. Sticky header hidden on mobile. Row renders as 3-tier stacked card:
  - Row 1: checkbox · avatar · name (Fraunces italic) · industry badge · project title subtitle
  - Row 2: stage · last-activity · next-action (mono UPPERCASE meta strip)
- ClientsKanbanView: `gridAutoColumns: minmax(78vw, 1fr)` on mobile + `scroll-snap-type: x mandatory` + `scroll-snap-align: start` per column.

---

## Severity summary

**Critical (breaks mobile UX)**: 1 → **FIXED**
- ClientsListView 5-column grid overflow ✅ Fixed

**Important (degrades UX)**: 1 → **FIXED**
- ClientsKanbanView no scroll-snap ✅ Fixed

**Minor (polish opportunities)**: 0 identified as blocking Phase 1 close.

---

## Recommendation

**Mobile Calibration iteration NOT REQUIRED before Season Phase 1 closure.**

Season Phase 2 may include a dedicated "Mobile pixel-perfect polish" iteration for:
- Real-device screenshot audit (iPhone SE, Pixel 5, Galaxy S8+)
- Touch-target size verification (44×44 minimum per Apple HIG)
- Landscape orientation checks
- Bottom-safe-area handling on notch devices
- Haptic feedback opportunities

But nothing currently identified as blocking beta launch on mobile devices.

---

**Report scope**: Static code analysis. Live viewport rendering verification pending user smoke test (Test #8 in combined Sub-3 + v3-v3c.1 session).
