import { Router, Request, Response } from 'express';
import { getEmailTemplate } from '../services/email';
import {
  EmailColors, EmailFonts, EmailSpacing, EmailRadius,
  primaryButtonStyle, successButtonStyle,
  highlightBox, successBox, warningBox, cardBlock, detailRow,
} from '../services/emailDesignSystem';

const router = Router();

// Template catalog
const TEMPLATES = [
  { id: 'new-lead', name: 'New Lead Alert', category: 'user', description: 'Notification when a new inquiry is submitted' },
  { id: 'client-confirmation', name: 'Inquiry Confirmation', category: 'client', description: 'Auto-reply to client after inquiry' },
  { id: 'quote-to-client', name: 'Quote Delivery', category: 'client', description: 'Quote sent to client for review' },
  { id: 'quote-accepted', name: 'Quote Accepted', category: 'user', description: 'Celebration when client accepts quote' },
  { id: 'quote-declined', name: 'Quote Declined', category: 'user', description: 'Notification when client declines' },
  { id: 'contract-sent', name: 'Contract Sent', category: 'user', description: 'Notification when contract is sent' },
  { id: 'contract-agreed', name: 'Contract Signed', category: 'user', description: 'Notification when client signs contract' },
  { id: 'deposit-payment', name: 'Deposit Request', category: 'client', description: 'Request for deposit payment' },
  { id: 'deposit-received', name: 'Deposit Received', category: 'user', description: 'Confirmation of deposit' },
  { id: 'delivery-notification', name: 'Delivery Notification', category: 'client', description: 'Files delivered to client' },
  { id: 'final-payment', name: 'Final Payment Request', category: 'client', description: 'Request for final payment' },
  { id: 'final-payment-received', name: 'Final Payment Received', category: 'user', description: 'Final payment confirmation' },
  { id: 'testimonial-request', name: 'Testimonial Request', category: 'client', description: 'Request for review after project' },
  { id: 'file-review-reminder', name: 'File Review Reminder', category: 'client', description: 'Reminder to review files' },
  { id: 'booking-confirmation', name: 'Meeting Confirmed', category: 'client', description: 'Meeting booking confirmation' },
  { id: 'booking-owner', name: 'New Meeting Booked', category: 'user', description: 'Meeting booking owner notification' },
  { id: 'booking-reminder', name: 'Meeting Reminder', category: 'client', description: '24hr meeting reminder' },
  { id: 'verification', name: 'Email Verification', category: 'user', description: 'Verify email address' },
  { id: 'password-reset', name: 'Password Reset', category: 'user', description: 'Reset password link' },
  { id: 'portal-link', name: 'Portal Access', category: 'client', description: 'Client portal access link' },
  { id: 'status-change', name: 'Project Update', category: 'client', description: 'Project status change notification' },
  { id: 'weekly-digest', name: 'Weekly Digest', category: 'user', description: 'Weekly performance summary' },
  { id: 'payment-received', name: 'Payment Received', category: 'user', description: 'Generic payment notification' },
];

// GET /api/preview-email — template gallery
router.get('/', (_req: Request, res: Response): void => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template Gallery — KOLOR STUDIO</title>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400..800&family=Instrument+Sans:wght@400..700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Instrument Sans','Helvetica Neue',sans-serif;background:${EmailColors.surfaceBackground};color:${EmailColors.textPrimary};}
    .header{background:${EmailColors.brandPrimary};padding:48px 24px;text-align:center;}
    .header h1{font-family:'Bricolage Grotesque',sans-serif;color:#fff;font-size:28px;margin-bottom:8px;}
    .header p{color:rgba(255,255,255,.8);font-size:14px;}
    .container{max-width:960px;margin:0 auto;padding:32px 16px;}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
    .card{background:#fff;border:1px solid ${EmailColors.borderDefault};border-radius:12px;padding:20px;transition:all .2s;cursor:pointer;text-decoration:none;color:inherit;display:block;}
    .card:hover{box-shadow:0 4px 12px rgba(0,0,0,.1);border-color:${EmailColors.brandPrimary};transform:translateY(-2px);}
    .badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;}
    .badge-user{background:${EmailColors.brandLight};color:${EmailColors.brandPrimary};}
    .badge-client{background:${EmailColors.successLight};color:${EmailColors.successText};}
    .card h3{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;margin-bottom:4px;}
    .card p{font-size:13px;color:${EmailColors.textSecondary};line-height:1.5;}
    .count{text-align:center;margin-bottom:24px;font-size:14px;color:${EmailColors.textSecondary};}
  </style>
</head>
<body>
  <div class="header">
    <h1>Email Template Gallery</h1>
    <p>Preview all ${TEMPLATES.length} email templates — UI System v2.0</p>
  </div>
  <div class="container">
    <p class="count">${TEMPLATES.length} templates available. Click any card to preview.</p>
    <div class="grid">
      ${TEMPLATES.map(t => `
        <a class="card" href="/api/preview-email/${t.id}" target="_blank">
          <span class="badge badge-${t.category}">${t.category}</span>
          <h3>${t.name}</h3>
          <p>${t.description}</p>
        </a>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// GET /api/preview-email/:id — render specific template
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const template = TEMPLATES.find(t => t.id === id);
  if (!template) {
    res.status(404).json({ error: 'Template not found', available: TEMPLATES.map(t => t.id) });
    return;
  }

  const html = buildPreview(id as string);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ── Preview Builders ────────────────────────────────
function buildPreview(id: string): string {
  switch (id) {
    case 'new-lead': return previewNewLead();
    case 'client-confirmation': return previewClientConfirmation();
    case 'quote-to-client': return previewQuoteToClient();
    case 'quote-accepted': return previewQuoteAccepted();
    case 'quote-declined': return previewQuoteDeclined();
    case 'contract-sent': return previewContractSent();
    case 'contract-agreed': return previewContractAgreed();
    case 'deposit-payment': return previewDepositPayment();
    case 'deposit-received': return previewDepositReceived();
    case 'delivery-notification': return previewDeliveryNotification();
    case 'final-payment': return previewFinalPayment();
    case 'final-payment-received': return previewFinalPaymentReceived();
    case 'testimonial-request': return previewTestimonialRequest();
    case 'file-review-reminder': return previewFileReviewReminder();
    case 'booking-confirmation': return previewBookingConfirmation();
    case 'booking-owner': return previewBookingOwner();
    case 'booking-reminder': return previewBookingReminder();
    case 'verification': return previewVerification();
    case 'password-reset': return previewPasswordReset();
    case 'portal-link': return previewPortalLink();
    case 'status-change': return previewStatusChange();
    case 'weekly-digest': return previewWeeklyDigest();
    case 'payment-received': return previewPaymentReceived();
    default: return getEmailTemplate('<p>Template not implemented yet.</p>', 'Preview');
  }
}

// ── Individual Previews ─────────────────────────────
function previewNewLead(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};">New Lead Alert!</h1>
    <p style="margin:0 0 ${EmailSpacing.lg} 0;font-size:16px;color:${EmailColors.textSecondary};line-height:1.6;font-family:${EmailFonts.body};">Great news! Someone just submitted a project inquiry through your KOLOR STUDIO form.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${EmailColors.surfaceHover};border-radius:${EmailRadius.card};margin-bottom:${EmailSpacing.lg};border:1px solid ${EmailColors.borderDefault};">
      <tr><td style="padding:${EmailSpacing.lg};">
        <span style="font-size:11px;color:${EmailColors.brandPrimary};font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Wedding Photography</span>
        <h2 style="margin:${EmailSpacing.sm} 0 0;font-size:20px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};">Summer Garden Wedding</h2>
        <table width="100%" style="margin-top:${EmailSpacing.md};" cellpadding="0" cellspacing="0">
          ${detailRow('Client', 'Emily & James Rodriguez')}
          ${detailRow('Budget', '$4,500 - $6,000', EmailColors.success)}
          ${detailRow('Timeline', 'August 15, 2026')}
        </table>
      </td></tr>
    </table>
    ${highlightBox(`<p style="margin:0 0 ${EmailSpacing.sm} 0;font-size:12px;font-weight:700;color:${EmailColors.textSecondary};text-transform:uppercase;letter-spacing:.1em;">Project Description</p><p style="margin:0;font-size:15px;color:${EmailColors.textPrimary};line-height:1.7;">Looking for a photographer who specializes in outdoor, natural light photography. We're having a garden ceremony with 150 guests. Would love a mix of candid and posed shots.</p>`)}
    <table width="100%"><tr><td align="center" style="padding-top:${EmailSpacing.sm};"><a href="#" style="${primaryButtonStyle}">View Lead in Dashboard</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'New Lead Notification');
}

function previewClientConfirmation(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};text-align:center;">Thanks for reaching out!</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Thank you for your interest in working together! I've received your inquiry about <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong> and I'm excited to learn more.</p>
    ${highlightBox(`<p style="margin:0;font-size:14px;color:${EmailColors.textPrimary};font-family:${EmailFonts.body};"><strong>What happens next?</strong><br>I'll review your project details and get back to you within 24-48 hours with a personalized quote.</p>`)}
    <p style="font-size:16px;color:${EmailColors.textSecondary};font-family:${EmailFonts.body};">Looking forward to potentially working together,<br><strong style="color:${EmailColors.brandPrimary};">Sarah's Studio</strong></p>
  `;
  return getEmailTemplate(content, 'Inquiry Confirmation');
}

function previewQuoteToClient(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};text-align:center;font-family:${EmailFonts.heading};">Your Quote is Ready!</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">I've put together a custom quote for your <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong> project. I think you'll love what I have planned!</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${EmailColors.successLight};border:1px solid ${EmailColors.successBorder};border-radius:${EmailRadius.card};margin-bottom:${EmailSpacing.lg};">
      <tr><td style="padding:${EmailSpacing.xl};text-align:center;">
        <p style="margin:0 0 ${EmailSpacing.sm} 0;font-size:11px;color:${EmailColors.textSecondary};text-transform:uppercase;letter-spacing:.1em;font-weight:700;">Investment</p>
        <p style="margin:0;font-size:42px;font-weight:700;color:${EmailColors.successText};line-height:1;font-family:${EmailFonts.heading};">$5,200.00</p>
        <p style="margin:${EmailSpacing.sm} 0 0;font-size:13px;color:${EmailColors.textTertiary};">Quote #QT-2026-001</p>
      </td></tr>
    </table>
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle} font-size:18px;padding:18px 48px;">View Your Quote</a></td></tr><tr><td align="center" style="padding-top:${EmailSpacing.sm};"><p style="margin:0;font-size:13px;color:${EmailColors.textTertiary};">Takes 2 seconds to accept if you're ready!</p></td></tr></table>
    ${warningBox(`<p style="margin:0;font-size:14px;color:${EmailColors.warningText};font-family:${EmailFonts.body};"><strong>Valid until April 15, 2026</strong> — but no pressure, just let me know!</p>`)}
    <p style="margin:${EmailSpacing.lg} 0 0;font-size:16px;color:${EmailColors.textSecondary};font-family:${EmailFonts.body};">Looking forward to working with you,<br><strong style="color:${EmailColors.brandPrimary};">Sarah's Studio</strong></p>
  `;
  return getEmailTemplate(content, 'Your Quote');
}

function previewQuoteAccepted(): string {
  const content = `
    ${successBox(`<p style="margin:0;font-size:24px;font-weight:700;color:${EmailColors.successText};font-family:${EmailFonts.heading};text-align:center;">Quote Accepted!</p>`)}
    <p style="margin:${EmailSpacing.lg} 0 ${EmailSpacing.md} 0;font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Great news, Sarah!</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};"><strong style="color:${EmailColors.textPrimary};">Emily Rodriguez</strong> has accepted your quote for <strong style="color:${EmailColors.textPrimary};">"Summer Garden Wedding"</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${EmailColors.success};border-radius:${EmailRadius.card};margin:${EmailSpacing.lg} 0;">
      <tr><td style="padding:${EmailSpacing.xl};text-align:center;">
        <p style="margin:0 0 ${EmailSpacing.sm} 0;font-size:12px;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:.1em;">Quote #QT-2026-001 Accepted</p>
        <p style="margin:0;font-size:36px;font-weight:700;color:#fff;font-family:${EmailFonts.heading};">$5,200.00</p>
      </td></tr>
    </table>
    ${highlightBox(`<p style="margin:0 0 ${EmailSpacing.sm} 0;font-size:14px;font-weight:600;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};">What happens next:</p><ul style="margin:0;padding-left:20px;color:${EmailColors.textSecondary};line-height:1.8;font-size:14px;"><li>A contract has been automatically generated</li><li>Review the terms, then send to your client</li><li>The contract will <strong>not</strong> be sent until you confirm</li></ul>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">Review Contract Now</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Quote Accepted');
}

function previewQuoteDeclined(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};">Quote Update</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Sarah,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};"><strong style="color:${EmailColors.textPrimary};">Emily Rodriguez</strong> has declined your quote for <strong style="color:${EmailColors.textPrimary};">"Summer Garden Wedding"</strong>.</p>
    ${warningBox(`<p style="margin:0;font-size:14px;color:${EmailColors.warningText};font-family:${EmailFonts.body};"><strong>Reason:</strong> Budget constraints — looking for a smaller package.</p>`)}
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">This is a great opportunity to follow up with a revised quote or alternative package.</p>
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">View Lead Details</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Quote Declined');
}

function previewContractSent(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};text-align:center;">Contract Sent!</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Your contract for <strong style="color:${EmailColors.textPrimary};">Emily Rodriguez — Summer Garden Wedding</strong> has been sent for review and signature.</p>
    ${cardBlock(`<table width="100%" cellpadding="0" cellspacing="0">${detailRow('Document', 'Wedding Photography Agreement')}${detailRow('Client', 'Emily Rodriguez')}${detailRow('Value', '$5,200.00', EmailColors.success)}</table>`)}
    <p style="font-size:14px;color:${EmailColors.textTertiary};font-family:${EmailFonts.body};">You'll be notified immediately when the client signs.</p>
  `;
  return getEmailTemplate(content, 'Contract Sent');
}

function previewContractAgreed(): string {
  const content = `
    ${successBox(`<p style="margin:0;font-size:18px;font-weight:700;color:${EmailColors.successText};font-family:${EmailFonts.heading};text-align:center;">Agreement Signed!</p>`)}
    <p style="margin:${EmailSpacing.lg} 0 ${EmailSpacing.md} 0;font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Great news! <strong style="color:${EmailColors.textPrimary};">Emily Rodriguez</strong> has signed the agreement for <strong style="color:${EmailColors.textPrimary};">"Summer Garden Wedding"</strong>.</p>
    ${cardBlock(`<table width="100%" cellpadding="0" cellspacing="0">${detailRow('Document', 'Wedding Photography Agreement')}${detailRow('Signed', 'March 19, 2026 at 2:34 PM')}${detailRow('Client IP', '192.168.1.42')}</table>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">View in Dashboard</a></td></tr></table>
    <p style="margin:${EmailSpacing.lg} 0 0;color:${EmailColors.textTertiary};font-size:12px;">This record serves as an audit trail for the client's consent.</p>
  `;
  return getEmailTemplate(content, 'Agreement Signed');
}

function previewDepositPayment(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};text-align:center;">Deposit Payment</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">To secure your booking for <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong>, a deposit payment is required.</p>
    ${highlightBox(`<p style="margin:0;font-size:32px;font-weight:700;color:${EmailColors.brandPrimary};text-align:center;font-family:${EmailFonts.heading};">$1,560.00</p><p style="margin:${EmailSpacing.sm} 0 0;font-size:13px;color:${EmailColors.textSecondary};text-align:center;">30% deposit of $5,200.00 total</p>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${successButtonStyle} font-size:16px;">Pay Deposit Now</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Deposit Payment');
}

function previewDepositReceived(): string {
  const content = `
    ${successBox(`<p style="margin:0;font-size:18px;font-weight:700;color:${EmailColors.successText};font-family:${EmailFonts.heading};text-align:center;">Deposit Received!</p>`)}
    <p style="margin:${EmailSpacing.lg} 0 ${EmailSpacing.md} 0;font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};"><strong style="color:${EmailColors.textPrimary};">Emily Rodriguez</strong> has paid the deposit for <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong>.</p>
    ${cardBlock(`<table width="100%" cellpadding="0" cellspacing="0">${detailRow('Amount', '$1,560.00', EmailColors.success)}${detailRow('Method', 'Stripe')}${detailRow('Project Total', '$5,200.00')}${detailRow('Remaining', '$3,640.00')}</table>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">View in Dashboard</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Deposit Received');
}

function previewDeliveryNotification(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};text-align:center;">Your Files are Ready!</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Great news! The deliverables for <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong> are ready for download.</p>
    ${cardBlock(`<p style="margin:0;font-size:14px;color:${EmailColors.textSecondary};">3 files uploaded:<br><strong style="color:${EmailColors.textPrimary};">Wedding_Highlights.zip</strong> (1.2 GB)<br><strong style="color:${EmailColors.textPrimary};">Album_Previews.pdf</strong> (45 MB)<br><strong style="color:${EmailColors.textPrimary};">Behind_The_Scenes.mp4</strong> (890 MB)</p>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">View & Download Files</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Files Ready');
}

function previewFinalPayment(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};text-align:center;">Final Payment</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">The final payment for <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong> is now due.</p>
    ${highlightBox(`<p style="margin:0;font-size:32px;font-weight:700;color:${EmailColors.brandPrimary};text-align:center;font-family:${EmailFonts.heading};">$3,640.00</p><p style="margin:${EmailSpacing.sm} 0 0;font-size:13px;color:${EmailColors.textSecondary};text-align:center;">Remaining balance</p>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${successButtonStyle} font-size:16px;">Pay Now</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Final Payment');
}

function previewFinalPaymentReceived(): string {
  const content = `
    ${successBox(`<p style="margin:0;font-size:24px;font-weight:700;color:${EmailColors.successText};font-family:${EmailFonts.heading};text-align:center;">Project Complete!</p>`)}
    <p style="margin:${EmailSpacing.lg} 0 ${EmailSpacing.md} 0;font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Final payment of <strong style="color:${EmailColors.success};">$3,640.00</strong> received from <strong style="color:${EmailColors.textPrimary};">Emily Rodriguez</strong>.</p>
    ${cardBlock(`<table width="100%" cellpadding="0" cellspacing="0">${detailRow('Project', 'Summer Garden Wedding')}${detailRow('Total Collected', '$5,200.00', EmailColors.success)}${detailRow('Status', 'Fully Paid')}</table>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">View Project</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Final Payment Received');
}

function previewTestimonialRequest(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};text-align:center;">How was your experience?</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">I hope you're enjoying the photos from your <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong>! I'd love to hear how your experience was working together.</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">A short testimonial would mean the world to me and help other clients find their perfect photographer.</p>
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">Leave a Testimonial</a></td></tr></table>
    <p style="margin:${EmailSpacing.lg} 0 0;font-size:14px;color:${EmailColors.textTertiary};text-align:center;">It only takes 2 minutes!</p>
  `;
  return getEmailTemplate(content, 'Testimonial Request');
}

function previewFileReviewReminder(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};">File Review Reminder</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Just a friendly reminder — the files for <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong> are ready for your review.</p>
    ${warningBox(`<p style="margin:0;font-size:14px;color:${EmailColors.warningText};"><strong>Action needed:</strong> Please review the uploaded files and let me know if any revisions are needed.</p>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">Review Files</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'File Review Reminder');
}

function previewBookingConfirmation(): string {
  const content = `
    ${successBox(`<p style="margin:0;font-size:18px;font-weight:700;color:${EmailColors.successText};font-family:${EmailFonts.heading};text-align:center;">Meeting Confirmed!</p>`)}
    <p style="color:${EmailColors.textSecondary};font-size:16px;line-height:1.6;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="color:${EmailColors.textSecondary};font-size:16px;line-height:1.6;font-family:${EmailFonts.body};">Your meeting with <strong style="color:${EmailColors.textPrimary};">Sarah's Studio</strong> has been confirmed.</p>
    ${cardBlock(`<table width="100%" cellpadding="0" cellspacing="0">${detailRow('Meeting', '30-min Consultation', EmailColors.brandPrimary)}${detailRow('Date', 'Wednesday, March 26, 2026')}${detailRow('Time', '2:00 PM — 2:30 PM (30 min)')}${detailRow('Location', 'Zoom')}</table>`)}
    <p style="color:${EmailColors.textTertiary};font-size:14px;font-family:${EmailFonts.body};">If you need to cancel or reschedule, please reply to this email.</p>
  `;
  return getEmailTemplate(content, 'Meeting Confirmation');
}

function previewBookingOwner(): string {
  const content = `
    <h2 style="color:${EmailColors.textPrimary};font-size:22px;margin:0 0 ${EmailSpacing.lg};font-family:${EmailFonts.heading};">New Meeting Booked!</h2>
    <p style="color:${EmailColors.textSecondary};font-size:16px;line-height:1.6;font-family:${EmailFonts.body};"><strong style="color:${EmailColors.textPrimary};">Emily Davis</strong> (emily@example.com) has booked a meeting with you.</p>
    ${cardBlock(`<table width="100%" cellpadding="0" cellspacing="0">${detailRow('Meeting', '30-min Consultation', EmailColors.brandPrimary)}${detailRow('Date', 'Wednesday, March 26, 2026')}${detailRow('Time', '2:00 PM (30 min)')}${detailRow('Location', 'Zoom')}${detailRow('Notes', 'Want to discuss wedding photography packages')}</table>`)}
  `;
  return getEmailTemplate(content, 'New Meeting Booking');
}

function previewBookingReminder(): string {
  const content = `
    <h2 style="color:${EmailColors.textPrimary};font-size:22px;margin:0 0 ${EmailSpacing.lg};font-family:${EmailFonts.heading};">Meeting Reminder</h2>
    <p style="color:${EmailColors.textSecondary};font-size:16px;line-height:1.6;font-family:${EmailFonts.body};">Hi Emily, this is a reminder about your upcoming meeting with <strong style="color:${EmailColors.textPrimary};">Sarah's Studio</strong>.</p>
    ${highlightBox(`<p style="color:${EmailColors.textPrimary};margin:0;font-weight:600;font-size:16px;font-family:${EmailFonts.heading};">30-min Consultation</p><p style="color:${EmailColors.textSecondary};margin:${EmailSpacing.sm} 0 0;font-size:14px;">Wednesday, March 26, 2026 at 2:00 PM (30 min)</p><p style="color:${EmailColors.textSecondary};margin:${EmailSpacing.sm} 0 0;font-size:14px;">Location: Zoom</p>`)}
  `;
  return getEmailTemplate(content, 'Meeting Reminder');
}

function previewVerification(): string {
  const content = `
    <div style="text-align:center;margin-bottom:${EmailSpacing.xl};"><span style="font-size:48px;">&#x2709;&#xFE0F;</span></div>
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};text-align:center;font-family:${EmailFonts.heading};">Verify Your Email</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Sarah,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Welcome to KOLOR STUDIO! Please verify your email address to unlock all features and secure your account.</p>
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">Verify Email Address</a></td></tr></table>
    <p style="margin:${EmailSpacing.lg} 0 0;font-size:16px;color:${EmailColors.textSecondary};font-family:${EmailFonts.body};">Stay creative,<br><strong style="color:${EmailColors.brandPrimary};">The KOLOR STUDIO Team</strong></p>
  `;
  return getEmailTemplate(content, 'Email Verification');
}

function previewPasswordReset(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};text-align:center;font-family:${EmailFonts.heading};">Reset Your Password</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Sarah,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">We received a request to reset your password. Click the button below to create a new one.</p>
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">Reset Password</a></td></tr></table>
    ${warningBox(`<p style="margin:0;font-size:14px;color:${EmailColors.warningText};font-family:${EmailFonts.body};"><strong>This link expires in 1 hour.</strong> If you didn't request this, you can safely ignore this email.</p>`)}
  `;
  return getEmailTemplate(content, 'Password Reset');
}

function previewPortalLink(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};text-align:center;font-family:${EmailFonts.heading};">Your Project Portal</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">You have access to your project portal where you can view quotes, contracts, and files for <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong>.</p>
    ${cardBlock(`<p style="margin:0;font-size:14px;color:${EmailColors.textSecondary};">In your portal you can:<br>&#8226; View and accept quotes<br>&#8226; Review and sign contracts<br>&#8226; Download deliverables<br>&#8226; Make payments</p>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">Open Project Portal</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Project Portal');
}

function previewStatusChange(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};">Project Update</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Emily,</p>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">There's an update on your project <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong>.</p>
    ${highlightBox(`<p style="margin:0;font-size:14px;color:${EmailColors.textPrimary};font-family:${EmailFonts.body};"><strong>Status update:</strong> Your project has moved to <strong style="color:${EmailColors.brandPrimary};">In Progress</strong></p>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">View Project Portal</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Project Update');
}

function previewWeeklyDigest(): string {
  const content = `
    <h1 style="margin:0 0 ${EmailSpacing.lg} 0;font-size:24px;font-weight:700;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};">Your Weekly Summary</h1>
    <p style="font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">Hi Sarah, here's how your week went:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:${EmailSpacing.lg} 0;">
      <tr>
        <td style="padding:${EmailSpacing.md};background:${EmailColors.brandLight};border-radius:${EmailRadius.card} 0 0 0;text-align:center;width:33%;">
          <p style="margin:0;font-size:28px;font-weight:700;color:${EmailColors.brandPrimary};font-family:${EmailFonts.heading};">3</p>
          <p style="margin:4px 0 0;font-size:12px;color:${EmailColors.textSecondary};">New Leads</p>
        </td>
        <td style="padding:${EmailSpacing.md};background:${EmailColors.successLight};text-align:center;width:33%;">
          <p style="margin:0;font-size:28px;font-weight:700;color:${EmailColors.successText};font-family:${EmailFonts.heading};">$8,400</p>
          <p style="margin:4px 0 0;font-size:12px;color:${EmailColors.textSecondary};">Revenue</p>
        </td>
        <td style="padding:${EmailSpacing.md};background:${EmailColors.infoLight};border-radius:0 ${EmailRadius.card} 0 0;text-align:center;width:33%;">
          <p style="margin:0;font-size:28px;font-weight:700;color:${EmailColors.infoText};font-family:${EmailFonts.heading};">2</p>
          <p style="margin:4px 0 0;font-size:12px;color:${EmailColors.textSecondary};">Bookings</p>
        </td>
      </tr>
    </table>
    ${cardBlock(`<p style="margin:0 0 ${EmailSpacing.sm} 0;font-weight:600;color:${EmailColors.textPrimary};font-family:${EmailFonts.heading};">Action Items</p><p style="margin:0;font-size:14px;color:${EmailColors.textSecondary};">&#8226; 1 quote awaiting response<br>&#8226; 1 contract pending review<br>&#8226; 2 upcoming meetings this week</p>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">Open Dashboard</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Weekly Summary');
}

function previewPaymentReceived(): string {
  const content = `
    ${successBox(`<p style="margin:0;font-size:18px;font-weight:700;color:${EmailColors.successText};font-family:${EmailFonts.heading};text-align:center;">Payment Received!</p>`)}
    <p style="margin:${EmailSpacing.lg} 0 ${EmailSpacing.md} 0;font-size:16px;color:${EmailColors.textSecondary};line-height:1.7;font-family:${EmailFonts.body};">A payment has been received for <strong style="color:${EmailColors.textPrimary};">Summer Garden Wedding</strong>.</p>
    ${cardBlock(`<table width="100%" cellpadding="0" cellspacing="0">${detailRow('Amount', '$2,600.00', EmailColors.success)}${detailRow('Client', 'Emily Rodriguez')}${detailRow('Method', 'Stripe')}${detailRow('Date', 'March 19, 2026')}</table>`)}
    <table width="100%"><tr><td align="center"><a href="#" style="${primaryButtonStyle}">View in Dashboard</a></td></tr></table>
  `;
  return getEmailTemplate(content, 'Payment Received');
}

export default router;
