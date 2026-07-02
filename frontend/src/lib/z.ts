/**
 * Z-index registry — single source of truth for stacking order.
 *
 * When picking a z-index for a new component, ADD IT HERE FIRST.
 * Never hardcode arbitrary values in components. This prevents the
 * "modal occluded by FAB" and "backdrop above content" bugs that
 * recurred in iters 242, 243, and 244.
 *
 * Values are spaced by 5-10 to leave room for future sub-layers without
 * renumbering. If you need something between two existing layers, use
 * a value in the gap (e.g. 45 for "above HELP, below MODAL_BACKDROP").
 */
export const Z = {
  BASE: 0,             // default document flow

  // Persistent chrome
  NAV: 20,             // bottom tab bar / mobile nav

  // Floating action menu (iter 243)
  FAB_BACKDROP: 20,    // FAB open backdrop
  FAB_PILLS: 25,       // FAB expanded action pills
  FAB: 30,             // FAB trigger button

  // Support layers
  HELP: 40,            // help bubble / support widget

  // Modals — occlude everything except toasts
  MODAL_BACKDROP: 45,
  MODAL: 50,

  // Top-of-stack ephemera
  TOAST: 60,           // toast notifications (above modals)
  TOOLTIP: 70,         // tooltips (topmost, briefly visible)
} as const

export type ZKey = keyof typeof Z
