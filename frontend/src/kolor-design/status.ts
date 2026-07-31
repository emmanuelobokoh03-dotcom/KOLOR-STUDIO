/**
 * KOLOR Framework — Status Palette + State Map
 *
 * Extracted in iter 280-refactor. Provides reusable framework color
 * constants and the PORTAL_STATUS_STYLES map originally declared in
 * ProjectTimeline.tsx (iter 280b).
 *
 * Import from Phase 3+ surfaces that render timelines, status
 * indicators, or state pills to lock framework fidelity across the codebase.
 *
 * Framework Part 3 (Palette): reference colors.
 * Framework Part 12.6 (Framework evolution): documented lineage.
 */

// ─── Framework color constants ────────────────────────────────────────

export const KOLOR_COLORS = {
  // Canvas + type
  canvas: '#F7F4EE',
  canvasDark: '#1A1613',
  ivory: '#F7F4EE',
  ink: '#1A1613',
  inkMuted: '#5F5751',
  inkSubtle: '#928B84',
  inkWhisper: '#C4BFB8',
  hairline: '#E5E0D8',

  // Signature accents
  terra: '#B84A2C',       // The pleasure moment
  slate: '#3B4A3F',       // Quiet completion
  violetGhost: '#6C2EDB', // Wordmark only

  // Semantic
  success: '#4C6B4E',     // Editorial green (rare — most completion is Slate)
  danger: '#8B2E2C',      // Editorial red
  warning: '#7A5C2E',     // Dark amber
} as const;

// ─── State kind + style map ───────────────────────────────────────────

export type StatusKind = 'completed' | 'overdue' | 'today' | 'upcoming';

export interface StatusStyle {
  dot: string;
  icon: string;
  card: string;
  text: string;
}

/**
 * Portal-facing timeline state styles.
 *
 * Framework rationale (iter 280b):
 *   completed → Slate (quiet completion, not bright green)
 *   today     → Terra (the active pleasure moment)
 *   overdue   → Danger (editorial red)
 *   upcoming  → Ink whisper (very muted)
 */
export const PORTAL_STATUS_STYLES: Record<StatusKind, StatusStyle> = {
  completed: {
    dot: 'bg-[color:var(--kolor-slate-tint)] border-[color:var(--kolor-slate)]',
    icon: 'text-[color:var(--kolor-slate)]',
    card: 'bg-transparent border-[color:var(--kolor-hairline)]',
    text: 'text-[color:var(--kolor-ink-muted)]',
  },
  overdue: {
    dot: 'bg-[color:var(--kolor-danger-tint)] border-[color:var(--kolor-danger)]',
    icon: 'text-[color:var(--kolor-danger)]',
    card: 'bg-transparent border-[color:var(--kolor-danger)]/40',
    text: 'text-[color:var(--kolor-danger)]',
  },
  today: {
    dot: 'bg-[color:var(--kolor-terra-tint)] border-[color:var(--kolor-terra)]',
    icon: 'text-[color:var(--kolor-terra)]',
    card: 'bg-transparent border-[color:var(--kolor-terra)]/40',
    text: 'text-[color:var(--kolor-terra)]',
  },
  upcoming: {
    dot: 'bg-transparent border-[color:var(--kolor-ink-whisper)]',
    icon: 'text-[color:var(--kolor-ink-whisper)]',
    card: 'bg-transparent border-[color:var(--kolor-hairline)]',
    text: 'text-[color:var(--kolor-ink-subtle)]',
  },
};
