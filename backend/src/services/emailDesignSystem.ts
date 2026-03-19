/**
 * Email Design System v2.0
 * 
 * Email-safe styles that match UI System v2.0
 * Follows email client best practices (inline styles, table layouts)
 */

export const EmailColors = {
  // Brand
  brandPrimary: '#7C3AED',
  brandHover: '#6D28D9',
  brandPressed: '#5B21B6',
  brandLight: '#F3E8FF',
  brandLighter: '#FAF5FF',
  brandAccent: '#A855F7',

  // Surfaces
  surfaceWhite: '#FFFFFF',
  surfaceBackground: '#FAFAFA',
  surfaceCard: '#FFFFFF',
  surfaceHover: '#F9FAFB',

  // Borders
  borderLight: '#F3F4F6',
  borderDefault: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  successBorder: '#6EE7B7',
  successText: '#047857',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningBorder: '#FCD34D',
  warningText: '#B45309',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerBorder: '#FCA5A5',
  dangerText: '#B91C1C',

  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoBorder: '#93C5FD',
  infoText: '#1E40AF',
};

export const EmailFonts = {
  heading: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif',
  body: '"Instrument Sans", "Helvetica Neue", Arial, sans-serif',
};

export const EmailSpacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const EmailRadius = {
  button: '8px',
  card: '12px',
  badge: '9999px',
};

export const EmailShadows = {
  card: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  elevated: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
};

/** Primary CTA button inline style */
export const primaryButtonStyle = `display: inline-block; background-color: ${EmailColors.brandPrimary}; color: ${EmailColors.textInverse}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: ${EmailRadius.button}; font-family: ${EmailFonts.body};`;

/** Secondary CTA button inline style */
export const secondaryButtonStyle = `display: inline-block; background-color: transparent; color: ${EmailColors.brandPrimary}; border: 2px solid ${EmailColors.brandPrimary}; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: ${EmailRadius.button}; font-family: ${EmailFonts.body};`;

/** Green success button inline style */
export const successButtonStyle = `display: inline-block; background-color: ${EmailColors.success}; color: ${EmailColors.textInverse}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: ${EmailRadius.button}; font-family: ${EmailFonts.body};`;

/** Reusable HTML block: highlight box (left-bordered purple) */
export function highlightBox(content: string): string {
  return `<div style="background-color: ${EmailColors.brandLight}; border-left: 4px solid ${EmailColors.brandPrimary}; padding: ${EmailSpacing.md}; margin: ${EmailSpacing.lg} 0; border-radius: 0 ${EmailRadius.button} ${EmailRadius.button} 0;">${content}</div>`;
}

/** Reusable HTML block: info box */
export function infoBox(content: string): string {
  return `<div style="background-color: ${EmailColors.infoLight}; border: 1px solid ${EmailColors.infoBorder}; padding: ${EmailSpacing.md}; margin: ${EmailSpacing.lg} 0; border-radius: ${EmailRadius.button};">${content}</div>`;
}

/** Reusable HTML block: success box */
export function successBox(content: string): string {
  return `<div style="background-color: ${EmailColors.successLight}; border: 1px solid ${EmailColors.successBorder}; padding: ${EmailSpacing.md}; margin: ${EmailSpacing.lg} 0; border-radius: ${EmailRadius.button};">${content}</div>`;
}

/** Reusable HTML block: warning box */
export function warningBox(content: string): string {
  return `<div style="background-color: ${EmailColors.warningLight}; border-left: 4px solid ${EmailColors.warning}; padding: ${EmailSpacing.md}; margin: ${EmailSpacing.lg} 0; border-radius: 0 ${EmailRadius.button} ${EmailRadius.button} 0;">${content}</div>`;
}

/** Reusable HTML block: card container */
export function cardBlock(content: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${EmailColors.surfaceHover}; border-radius: ${EmailRadius.card}; margin: ${EmailSpacing.md} 0;"><tr><td style="padding: ${EmailSpacing.lg};">${content}</td></tr></table>`;
}

/** Reusable HTML block: detail row inside cards */
export function detailRow(label: string, value: string, valueColor?: string): string {
  return `<tr><td style="padding: ${EmailSpacing.sm} 0;"><span style="color: ${EmailColors.textSecondary}; font-size: 14px; font-family: ${EmailFonts.body};">${label}:</span><span style="color: ${valueColor || EmailColors.textPrimary}; font-size: 14px; font-weight: 600; padding-left: 8px; font-family: ${EmailFonts.body};">${value}</span></td></tr>`;
}
