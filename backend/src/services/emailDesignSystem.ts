/**
 * Email Design System v2.0 — KOLOR STUDIO
 *
 * Premium email templates using HTML tables, inline styles only.
 * Compatible with Gmail, Outlook, Apple Mail, Yahoo.
 *
 * RULES:
 * - All layout via HTML tables — no Grid, no Flexbox
 * - All styles inline — no <style> blocks (Gmail strips them)
 * - All colours hardcoded hex — no CSS variables
 * - All fonts: Arial, Helvetica, sans-serif
 * - Max-width 600px, centred
 * - CTA buttons: <a> styled as button, never <button>
 */

// ── Legacy exports preserved for backwards compatibility ──

export const EmailColors = {
  brandPrimary: '#6C2EDB',
  brandHover: '#5B27B5',
  brandPressed: '#4C1D95',
  brandLight: '#F3E8FF',
  brandLighter: '#FAF5FF',
  brandAccent: '#A78BFA',
  surfaceWhite: '#FFFFFF',
  surfaceBackground: '#F9F7FE',
  surfaceCard: '#FFFFFF',
  surfaceHover: '#F9FAFB',
  borderLight: '#EDE8F5',
  borderDefault: '#EDE8F5',
  borderStrong: '#D1D5DB',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',
  success: '#10B981',
  successLight: '#D1FAE5',
  successBorder: '#6EE7B7',
  successText: '#047857',
  warning: '#E8891A',
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
  heading: 'Arial, Helvetica, sans-serif',
  body: 'Arial, Helvetica, sans-serif',
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
  button: '10px',
  card: '12px',
  badge: '9999px',
};

export const EmailShadows = {
  card: '0 1px 3px rgba(0, 0, 0, 0.1)',
  elevated: '0 4px 6px rgba(0, 0, 0, 0.07)',
};

export const primaryButtonStyle = `display:inline-block;background-color:#6C2EDB;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.01em;min-width:200px;text-align:center;`;

export const secondaryButtonStyle = `display:inline-block;background-color:transparent;color:#6C2EDB;border:2px solid #6C2EDB;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;text-align:center;`;

export const successButtonStyle = `display:inline-block;background-color:#10B981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;text-align:center;`;

// ── Box helpers — left-border + tinted background ──

export function highlightBox(content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:rgba(108,46,219,0.06);border-left:3px solid #6C2EDB;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="font-size:14px;color:#1A1A2E;margin:0;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${content}</p>
        </td>
      </tr>
    </table>`;
}

export function successBox(content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:rgba(16,185,129,0.06);border-left:3px solid #10B981;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="font-size:14px;color:#1A1A2E;margin:0;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${content}</p>
        </td>
      </tr>
    </table>`;
}

export function warningBox(content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:rgba(232,137,26,0.06);border-left:3px solid #E8891A;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="font-size:14px;color:#1A1A2E;margin:0;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${content}</p>
        </td>
      </tr>
    </table>`;
}

export function errorBox(content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:rgba(239,68,68,0.05);border-left:3px solid #EF4444;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="font-size:14px;color:#1A1A2E;margin:0;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${content}</p>
        </td>
      </tr>
    </table>`;
}

export function infoBox(content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:rgba(59,130,246,0.06);border-left:3px solid #3B82F6;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="font-size:14px;color:#1A1A2E;margin:0;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${content}</p>
        </td>
      </tr>
    </table>`;
}

export function cardBlock(content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background-color:#F9FAFB;border-radius:12px;">
      <tr><td style="padding:24px;">${content}</td></tr>
    </table>`;
}

export function detailRow(label: string, value: string, valueColor?: string): string {
  return `<tr><td style="padding:8px 0;"><span style="color:#6B7280;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${label}:</span><span style="color:${valueColor || '#1A1A2E'};font-size:14px;font-weight:600;padding-left:8px;font-family:Arial,Helvetica,sans-serif;">${value}</span></td></tr>`;
}

// ── New V2.0 helpers ──

export function statRow(stats: Array<{ label: string; value: string; trend?: string }>): string {
  const cells = stats.map((s, i) => `
    <td align="center" style="padding:12px 8px;${i < stats.length - 1 ? 'border-right:1px solid #EDE8F5;' : ''}">
      <p style="font-size:11px;color:#9CA3AF;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.07em;font-family:Arial,Helvetica,sans-serif;">${s.label}</p>
      <p style="font-size:22px;font-weight:700;color:#1A1A2E;margin:0;font-family:Arial,Helvetica,sans-serif;">${s.value}</p>
      ${s.trend ? `<p style="font-size:11px;color:#10B981;margin:3px 0 0;font-family:Arial,Helvetica,sans-serif;">${s.trend}</p>` : ''}
    </td>`).join('');
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:16px 0;border:1px solid #EDE8F5;border-radius:8px;">
      <tr>${cells}</tr>
    </table>`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main template builder ──

interface EmailTemplateOptions {
  headline: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  plainLink?: string;
  studioName?: string;
  footerText?: string;
  unsubscribeUrl?: string;
  emailType?: 'auth' | 'workflow' | 'client' | 'system';
}

export function buildEmailTemplate(options: EmailTemplateOptions): string {
  const {
    headline,
    body,
    ctaText,
    ctaUrl,
    plainLink,
    studioName,
    footerText = `\u00a9 ${new Date().getFullYear()} KOLOR STUDIO. All rights reserved.`,
    unsubscribeUrl,
    emailType = 'workflow',
  } = options;

  const headerRight = (emailType === 'client' || emailType === 'workflow') && studioName
    ? `<td align="right"><span style="font-size:12px;color:rgba(255,255,255,0.5);font-family:Arial,Helvetica,sans-serif;">${studioName}</span></td>`
    : '<td></td>';

  const ctaBlock = ctaText && ctaUrl ? `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
            <tr>
              <td align="center">
                <a href="${ctaUrl}"
                   style="display:inline-block;background-color:#6C2EDB;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;letter-spacing:0.01em;min-width:200px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
                  ${ctaText}
                </a>
              </td>
            </tr>
          </table>` : '';

  const plainLinkBlock = plainLink ? `
          <p style="font-size:12px;color:#9CA3AF;margin:16px 0 0;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
            Or copy this link: <a href="${plainLink}" style="color:#6C2EDB;word-break:break-all;">${plainLink}</a>
          </p>` : '';

  const unsubBlock = unsubscribeUrl ? `
                <p style="font-size:11px;color:#9CA3AF;margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;">
                  <a href="${unsubscribeUrl}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe from these emails</a>
                </p>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headline}</title>
  <!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F9F7FE;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9F7FE;">
  <tr><td align="center" style="padding:32px 16px;">

    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <!-- HEADER -->
      <tr>
        <td style="background-color:#080612;border-radius:12px 12px 0 0;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:0.08em;font-family:Arial,Helvetica,sans-serif;">KOLOR</span>
                <span style="font-size:12px;color:rgba(255,255,255,0.4);margin-left:4px;font-family:Arial,Helvetica,sans-serif;">STUDIO</span>
              </td>
              ${headerRight}
            </tr>
          </table>
        </td>
      </tr>

      <!-- CONTENT -->
      <tr>
        <td style="background-color:#ffffff;border-left:1px solid #EDE8F5;border-right:1px solid #EDE8F5;padding:32px;">
          <h1 style="font-size:22px;font-weight:700;color:#1A1A2E;margin:0 0 8px;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">${headline}</h1>
          ${body}
          ${ctaBlock}
          ${plainLinkBlock}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#F3F0FB;border:1px solid #EDE8F5;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <p style="font-size:12px;color:#9CA3AF;margin:0;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">${footerText}</p>
                ${unsubBlock}
              </td>
              <td align="right" style="vertical-align:top;">
                <p style="font-size:11px;color:#C4B5D4;margin:0;font-family:Arial,Helvetica,sans-serif;">
                  Powered by <a href="https://kolorstudio.app" style="color:#C4B5D4;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">KOLOR Studio</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}
