import { Resend } from 'resend';

// Initialize Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Detect if using Resend sandbox (onboarding@resend.dev)
const isResendSandbox = SENDER_EMAIL.includes('resend.dev');
if (isResendSandbox) {
  console.warn('[EMAIL] WARNING: Using Resend sandbox sender (onboarding@resend.dev). Emails can ONLY be sent to the account owner email. Verify a domain at resend.com/domains to send to clients.');
}

interface LeadData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  serviceType: string;
  projectTitle: string;
  description: string;
  budget?: string;
  timeline?: string;
  leadId: string;
  portalToken?: string;  // For client portal link
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  BRANDING: 'Branding',
  CONTENT_CREATION: 'Content Creation',
  CONSULTING: 'Consulting',
  OTHER: 'Other',
};

// KOLOR STUDIO branded email template
const getEmailTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f3ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f3ff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      KOLOR STUDIO
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <span style="font-size: 14px; color: rgba(255,255,255,0.85);">
                      Your CRM should work harder than you do
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf5ff; padding: 24px 40px; border-top: 1px solid #e9d5ff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="color: #7c3aed; font-size: 14px; font-weight: 600;">
                    KOLOR STUDIO
                  </td>
                </tr>
                <tr>
                  <td align="center" style="color: #9ca3af; font-size: 12px; padding-top: 8px;">
                    Your CRM should work harder than you do
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Send notification email to studio owner
export async function sendNewLeadNotification(lead: LeadData): Promise<boolean> {
  if (!resend || !OWNER_EMAIL) {

    return false;
  }

  const dashboardUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  const serviceLabel = SERVICE_TYPE_LABELS[lead.serviceType] || lead.serviceType;

  const content = `
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937;">
      New Lead Alert!
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Great news! Someone just submitted a project inquiry through your KOLOR STUDIO form. Here are the details:
    </p>
    
    <!-- Lead Info Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                <span style="font-size: 12px; color: #7c3aed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${serviceLabel}
                </span>
                <h2 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #1f2937;">
                  ${lead.projectTitle}
                </h2>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Client:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; padding-left: 8px;">
                        ${lead.clientName}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Email:</span>
                      <a href="mailto:${lead.clientEmail}" style="color: #7c3aed; font-size: 14px; font-weight: 600; padding-left: 8px; text-decoration: none;">
                        ${lead.clientEmail}
                      </a>
                    </td>
                  </tr>
                  ${lead.clientPhone ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Phone:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; padding-left: 8px;">
                        ${lead.clientPhone}
                      </span>
                    </td>
                  </tr>
                  ` : ''}
                  ${lead.clientCompany ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Company:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; padding-left: 8px;">
                        ${lead.clientCompany}
                      </span>
                    </td>
                  </tr>
                  ` : ''}
                  ${lead.budget ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Budget:</span>
                      <span style="color: #059669; font-size: 14px; font-weight: 700; padding-left: 8px;">
                        ${lead.budget}
                      </span>
                    </td>
                  </tr>
                  ` : ''}
                  ${lead.timeline ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Timeline:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; padding-left: 8px;">
                        ${lead.timeline}
                      </span>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Project Description -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
        Project Description
      </h3>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.7; background-color: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #7c3aed;">
        ${lead.description}
      </p>
    </div>
    
    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-top: 8px;">
          <a href="${dashboardUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            View Lead in Dashboard
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; font-size: 14px; color: #9ca3af; text-align: center;">
      Don't keep them waiting - reach out while they're still excited!
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [OWNER_EMAIL],
      subject: `New Lead: ${lead.projectTitle} - ${lead.clientName}`,
      html: getEmailTemplate(content, 'New Lead Notification'),
    });

    if (error) {
      console.error('Failed to send owner notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send owner notification:', error);
    return false;
  }
}

// Send confirmation email to client
export async function sendClientConfirmation(lead: LeadData): Promise<boolean> {
  if (!resend) {

    return false;
  }

  const serviceLabel = SERVICE_TYPE_LABELS[lead.serviceType] || lead.serviceType;
  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  const portalUrl = lead.portalToken ? `${baseUrl}/portal/${lead.portalToken}` : null;

  const content = `
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937;">
      Thank You, ${lead.clientName.split(' ')[0]}!
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      We've received your project inquiry and we're excited to learn more about your vision! Your request has been added to our queue and we'll review it personally.
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      <strong style="color: #1f2937;">What happens next?</strong> We'll review your project details and get back to you within <strong style="color: #7c3aed;">24-48 hours</strong> with next steps and any questions we might have.
    </p>
    
    ${portalUrl ? `
    <!-- Portal Access Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #ffffff;">
            Track Your Project Status
          </h3>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: rgba(255,255,255,0.9);">
            Bookmark this link to check your project progress anytime
          </p>
          <a href="${portalUrl}" style="display: inline-block; background-color: #ffffff; color: #7c3aed; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
            View My Project Portal
          </a>
        </td>
      </tr>
    </table>
    ` : ''}
    
    <!-- Summary Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px;">
            Your Inquiry Summary
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 14px;">Service:</span>
                <span style="color: #1f2937; font-size: 14px; font-weight: 600; padding-left: 8px;">
                  ${serviceLabel}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 14px;">Project:</span>
                <span style="color: #1f2937; font-size: 14px; font-weight: 600; padding-left: 8px;">
                  ${lead.projectTitle}
                </span>
              </td>
            </tr>
            ${lead.budget ? `
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 14px;">Budget:</span>
                <span style="color: #059669; font-size: 14px; font-weight: 600; padding-left: 8px;">
                  ${lead.budget}
                </span>
              </td>
            </tr>
            ` : ''}
            ${lead.timeline ? `
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 14px;">Timeline:</span>
                <span style="color: #1f2937; font-size: 14px; font-weight: 600; padding-left: 8px;">
                  ${lead.timeline}
                </span>
              </td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 8px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      In the meantime, feel free to reply to this email if you have any additional details or questions to share.
    </p>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #1f2937; line-height: 1.7;">
      We're looking forward to bringing your creative vision to life!
    </p>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #4b5563;">
      Warm regards,<br>
      <strong style="color: #7c3aed;">The KOLOR STUDIO Team</strong>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [lead.clientEmail],
      replyTo: OWNER_EMAIL || SENDER_EMAIL,
      subject: `Thanks for reaching out! We received your ${serviceLabel} inquiry`,
      html: getEmailTemplate(content, 'Inquiry Confirmation'),
    });

    if (error) {
      console.error('Failed to send client confirmation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send client confirmation:', error);
    return false;
  }
}

// Status labels and messages for client notifications
const STATUS_CLIENT_MESSAGES: Record<string, { subject: string; title: string; message: string; emoji: string }> = {
  REVIEWING: {
    subject: 'We\'re reviewing your project',
    title: 'Your Project is Being Reviewed!',
    message: 'Great news! Our team has started reviewing your project details. We\'re carefully considering how we can bring your vision to life.',
    emoji: '👀',
  },
  CONTACTED: {
    subject: 'We\'ve reached out to you',
    title: 'We\'ve Made Contact!',
    message: 'We\'ve reached out to discuss your project. If you haven\'t heard from us yet, please check your email (and spam folder). We\'re excited to learn more about your vision!',
    emoji: '📞',
  },
  QUALIFIED: {
    subject: 'Great news about your project',
    title: 'Your Project is Qualified!',
    message: 'Exciting news! After reviewing your project, we believe it\'s a great fit for our services. We\'re putting together the perfect plan for you.',
    emoji: '✨',
  },
  QUOTED: {
    subject: 'Your proposal is ready',
    title: 'Your Proposal is Ready!',
    message: 'We\'ve prepared a detailed proposal for your project! Please check your email or your project portal for the full details. We think you\'re going to love what we\'ve put together.',
    emoji: '📋',
  },
  NEGOTIATING: {
    subject: 'Let\'s finalize the details',
    title: 'Finalizing Your Project!',
    message: 'We\'re in the final stages of working out the details for your project. If you have any questions or concerns, now is the perfect time to reach out.',
    emoji: '🤝',
  },
  BOOKED: {
    subject: 'Your project is confirmed!',
    title: 'Project Confirmed! 🎉',
    message: 'Fantastic news! Your project is officially confirmed and booked. We\'re thrilled to be working with you and can\'t wait to bring your creative vision to life!',
    emoji: '🎉',
  },
};

interface StatusChangeData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  newStatus: string;
  portalToken: string;
}

// Send status change notification to client
export async function sendStatusChangeNotification(data: StatusChangeData): Promise<boolean> {
  if (!resend) {

    return false;
  }

  const statusConfig = STATUS_CLIENT_MESSAGES[data.newStatus];
  
  // Only send for statuses we have messages for (skip NEW, LOST, etc.)
  if (!statusConfig) {

    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  const portalUrl = `${baseUrl}/portal/${data.portalToken}`;
  const firstName = data.clientName.split(' ')[0];

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">${statusConfig.emoji}</span>
    </div>
    
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
      ${statusConfig.title}
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Hi ${firstName},
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      ${statusConfig.message}
    </p>
    
    <!-- Project Info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0; font-size: 12px; color: #7c3aed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            Your Project
          </p>
          <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; color: #1f2937;">
            ${data.projectTitle}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Portal CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            View Project Portal
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; font-size: 14px; color: #9ca3af; text-align: center;">
      Track your project progress anytime at your personal portal
    </p>
    
    <p style="margin: 32px 0 0 0; font-size: 16px; color: #4b5563;">
      Questions? Just reply to this email - we're here to help!
    </p>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #4b5563;">
      Best regards,<br>
      <strong style="color: #7c3aed;">The KOLOR STUDIO Team</strong>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.clientEmail],
      replyTo: OWNER_EMAIL || SENDER_EMAIL,
      subject: `${data.projectTitle}: ${statusConfig.subject}`,
      html: getEmailTemplate(content, 'Project Update'),
    });

    if (error) {
      console.error('Failed to send status notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send status notification:', error);
    return false;
  }
}

interface PortalLinkData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  portalToken: string;
}

// Send portal link email to client
export async function sendPortalLinkEmail(data: PortalLinkData): Promise<boolean> {
  if (!resend) {

    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  const portalUrl = `${baseUrl}/portal/${data.portalToken}`;
  const firstName = data.clientName.split(' ')[0];

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">🔗</span>
    </div>
    
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
      Your Project Portal Link
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Hi ${firstName},
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Here's your personal project portal link. You can use this link anytime to check the status of your project, view updates, and track our progress together.
    </p>
    
    <!-- Project Info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0; font-size: 12px; color: #7c3aed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            Your Project
          </p>
          <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; color: #1f2937;">
            ${data.projectTitle}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Portal CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            View My Project Portal
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; font-size: 14px; color: #9ca3af; text-align: center;">
      Bookmark this link to check your project progress anytime
    </p>
    
    <p style="margin: 32px 0 0 0; font-size: 16px; color: #4b5563;">
      Questions? Just reply to this email - we're here to help!
    </p>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #4b5563;">
      Best regards,<br>
      <strong style="color: #7c3aed;">The KOLOR STUDIO Team</strong>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.clientEmail],
      replyTo: OWNER_EMAIL || SENDER_EMAIL,
      subject: `Your Project Portal: ${data.projectTitle}`,
      html: getEmailTemplate(content, 'Project Portal'),
    });

    if (error) {
      console.error('Failed to send portal link email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send portal link email:', error);
    return false;
  }
}

// Password Reset Email
interface PasswordResetData {
  email: string;
  firstName: string;
  resetToken: string;
}

export async function sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
  if (!resend) {

    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  const resetUrl = `${baseUrl}/reset-password/${data.resetToken}`;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">🔐</span>
    </div>
    
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
      Reset Your Password
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Hi ${data.firstName},
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      We received a request to reset the password for your KOLOR STUDIO account. Click the button below to create a new password.
    </p>
    
    <!-- Reset Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Expiry Notice -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0; font-size: 14px; color: #92400e; text-align: center;">
            <strong>⏰ This link expires in 1 hour</strong> for your security.
          </p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.7;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.7;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 8px;">
      ${resetUrl}
    </p>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #4b5563;">
      Stay creative,<br>
      <strong style="color: #7c3aed;">The KOLOR STUDIO Team</strong>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.email],
      subject: 'Reset your KOLOR STUDIO password',
      html: getEmailTemplate(content, 'Password Reset'),
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

// Email Verification
interface VerificationEmailData {
  email: string;
  firstName: string;
  verificationToken: string;
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  if (!resend) {

    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  const verifyUrl = `${baseUrl}/verify-email/${data.verificationToken}`;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">&#x2709;&#xFE0F;</span>
    </div>
    
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
      Verify Your Email
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Hi ${data.firstName},
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Welcome to KOLOR STUDIO! Please verify your email address to unlock all features and secure your account.
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.7;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 8px;">
      ${verifyUrl}
    </p>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #4b5563;">
      Stay creative,<br>
      <strong style="color: #7c3aed;">The KOLOR STUDIO Team</strong>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.email],
      subject: 'Verify your KOLOR STUDIO email',
      html: getEmailTemplate(content, 'Email Verification'),
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

// Quote Email - Send to client
interface QuoteEmailData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  quoteNumber: string;
  total: number;
  validUntil: Date;
  quoteToken: string;
  portalToken?: string;
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: string;
  studioName: string;
  customSubject?: string;
  customMessage?: string;
}

export async function sendQuoteEmail(data: QuoteEmailData): Promise<boolean> {
  console.log('[EMAIL] sendQuoteEmail called for:', data.clientEmail, '| Quote:', data.quoteNumber);
  
  if (!resend) {
    console.error('[EMAIL] Resend not initialized! RESEND_API_KEY missing.');
    return false;
  }

  console.log('[EMAIL] SENDER_EMAIL:', SENDER_EMAIL);
  console.log('[EMAIL] Recipient:', data.clientEmail);

  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  // Link to portal if portalToken is available, otherwise fallback to public quote page
  const quoteUrl = data.portalToken
    ? `${baseUrl}/portal/${data.portalToken}`
    : `${baseUrl}/quote/${data.quoteToken}`;
  const firstName = data.clientName.split(' ')[0];
  // Format currency based on quote settings
  const currencySymbol = data.currencySymbol || '$';
  const currencyPosition = data.currencyPosition || 'BEFORE';
  const formattedAmount = data.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedTotal = currencyPosition === 'BEFORE' ? `${currencySymbol}${formattedAmount}` : `${formattedAmount}${currencySymbol}`;
  const formattedDate = data.validUntil.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Build the message section based on whether custom message was provided
  const messageSection = data.customMessage
    ? `<div style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7; white-space: pre-wrap;">${data.customMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>`
    : `<p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.7;">
      Hey ${firstName}! 👋
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.7;">
      I'm excited about your project <strong>"${data.projectTitle}"</strong>! 
      Here's what I'm thinking:
    </p>`;

  const content = `
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
      Your Quote is Ready!
    </h1>
    
    ${messageSection}
    
    <!-- Investment Highlight -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border-radius: 16px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 32px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
            Investment
          </p>
          <p style="margin: 0; font-size: 48px; font-weight: 700; color: #10B981; line-height: 1;">
            ${formattedTotal}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #6B7280;">
            Quote ${data.quoteNumber}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- View Quote CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${quoteUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 18px; font-weight: 600; text-decoration: none; padding: 18px 48px; border-radius: 12px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);">
            View Your Quote →
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top: 12px;">
          <p style="margin: 0; font-size: 13px; color: #9CA3AF;">Takes 2 seconds to accept if you're ready!</p>
        </td>
      </tr>
    </table>
    
    <!-- Validity Notice -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left: 4px solid #F59E0B; background: linear-gradient(90deg, #FEF3C7 0%, transparent 100%); border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>⏰ Valid until ${formattedDate}</strong> — but no pressure, just let me know!
          </p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.7;">
      Questions? Just reply to this email — I'm usually pretty quick 😊
    </p>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
      Looking forward to working with you,<br>
      <strong style="color: #7c3aed;">${data.studioName}</strong>
    </p>
  `;

  try {
    console.log('[EMAIL] Calling resend.emails.send for quote:', data.quoteNumber);
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.clientEmail],
      replyTo: OWNER_EMAIL || SENDER_EMAIL,
      subject: data.customSubject || `Quote from KOLOR STUDIO - ${data.projectTitle}`,
      html: getEmailTemplate(content, 'Your Quote'),
    });

    if (error) {
      console.error('[EMAIL] Resend API error for quote', data.quoteNumber, ':', JSON.stringify(error));
      console.error('[EMAIL] HINT: If using onboarding@resend.dev, emails can ONLY be sent to the account owner email. Verify a domain at resend.com/domains to send to clients.');
      return false;
    }

    console.log('[EMAIL] Quote email sent successfully to:', data.clientEmail);
    return true;
  } catch (error) {
    console.error('[EMAIL] Exception sending quote email:', error);
    console.error('[EMAIL] HINT: If using onboarding@resend.dev, emails can ONLY be sent to the account owner email. Verify a domain at resend.com/domains to send to clients.');
    return false;
  }
}

// Quote Accepted Notification - Send to studio owner
interface QuoteAcceptedData {
  ownerEmail: string;
  ownerName: string;
  clientName: string;
  projectTitle: string;
  quoteNumber: string;
  total: number;
  leadId: string;
  currencySymbol?: string;
  currency?: string;
}

export async function sendQuoteAcceptedNotification(data: QuoteAcceptedData): Promise<boolean> {
  console.log('[EMAIL] sendQuoteAcceptedNotification called | To:', data.ownerEmail, '| Client:', data.clientName, '| Quote:', data.quoteNumber);
  
  if (!resend) {
    console.error('[EMAIL] Resend not initialized! RESEND_API_KEY missing.');
    return false;
  }

  console.log('[EMAIL] SENDER_EMAIL:', SENDER_EMAIL, '| Recipient:', data.ownerEmail);

  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  const dashboardUrl = `${baseUrl}/dashboard`;
  const sym = data.currencySymbol || '$';
  const formattedTotal = `${sym}${data.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 64px;">🎉</span>
    </div>
    
    <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1f2937; text-align: center;">
      Quote Accepted!
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Great news, ${data.ownerName}! 🎊
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      <strong>${data.clientName}</strong> has accepted your quote for <strong>"${data.projectTitle}"</strong>.
    </p>
    
    <!-- Accepted Amount Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">
            Quote ${data.quoteNumber} Accepted
          </p>
          <p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff;">
            ${formattedTotal}
          </p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      <strong>What happens next:</strong>
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 24px; color: #4b5563; line-height: 1.8;">
      <li>A contract has been automatically generated and is <strong>ready for your review</strong></li>
      <li>Review the terms, edit if needed, then send to your client</li>
      <li>The contract will <strong>not</strong> be sent until you confirm</li>
    </ul>
    
    <!-- Dashboard CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            Review Contract Now
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #4b5563;">
      Congratulations! 🚀<br>
      <strong style="color: #7c3aed;">The KOLOR STUDIO Team</strong>
    </p>
  `;

  try {
    console.log('[EMAIL] Calling resend.emails.send for quote accepted notification...');
    const { data: resendData, error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.ownerEmail],
      subject: `🎉 ${data.clientName} accepted your quote! (${formattedTotal})`,
      html: getEmailTemplate(content, 'Quote Accepted'),
    });

    if (error) {
      console.error('[EMAIL] Resend API error for quote accepted notification:', JSON.stringify(error));
      return false;
    }

    console.log('[EMAIL] Quote accepted notification sent successfully to:', data.ownerEmail, '| Resend ID:', resendData?.id || 'unknown');
    return true;
  } catch (error) {
    console.error('[EMAIL] Exception sending quote accepted notification:', error);
    return false;
  }
}

// Quote Declined Notification - Send to studio owner
interface QuoteDeclinedData {
  ownerEmail: string;
  ownerName: string;
  clientName: string;
  projectTitle: string;
  quoteNumber: string;
  total: number;
  reason?: string;
  leadId: string;
}

export async function sendQuoteDeclinedNotification(data: QuoteDeclinedData): Promise<boolean> {
  if (!resend) {

    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';
  const dashboardUrl = `${baseUrl}/dashboard`;
  const formattedTotal = data.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">📝</span>
    </div>
    
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
      Quote Declined
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Hi ${data.ownerName},
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      <strong>${data.clientName}</strong> has declined your quote for <strong>"${data.projectTitle}"</strong>.
    </p>
    
    <!-- Quote Info Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
            Quote ${data.quoteNumber}
          </p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #374151;">
            ${formattedTotal}
          </p>
        </td>
      </tr>
    </table>
    
    ${data.reason ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #92400e; font-weight: 600;">
            REASON PROVIDED:
          </p>
          <p style="margin: 0; font-size: 14px; color: #92400e; font-style: italic;">
            "${data.reason}"
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      <strong>Consider:</strong> Reaching out to understand their concerns and potentially offering a revised quote.
    </p>
    
    <!-- Dashboard CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            View Lead in Dashboard
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #4b5563;">
      Don't give up! 💪<br>
      <strong style="color: #7c3aed;">The KOLOR STUDIO Team</strong>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.ownerEmail],
      subject: `${data.clientName} declined your quote`,
      html: getEmailTemplate(content, 'Quote Declined'),
    });

    if (error) {
      console.error('Failed to send quote declined notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send quote declined notification:', error);
    return false;
  }
}


// Custom Email - Send user-composed email to client
interface CustomEmailData {
  to: string;
  subject: string;
  htmlBody: string;
  cc?: string;
  bcc?: string;
  fromName?: string;
  replyTo?: string;
}

export async function sendCustomEmail(data: CustomEmailData): Promise<boolean> {
  if (!resend) {

    throw new Error('Email service not configured');
  }

  // Wrap the user's HTML content in our branded template
  const content = `
    <div style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.8;">
      ${data.htmlBody}
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
    
    <p style="margin: 0; font-size: 14px; color: #9ca3af;">
      Sent via <strong style="color: #7c3aed;">KOLOR STUDIO</strong>
    </p>
  `;

  const toAddresses = [data.to];
  const ccAddresses = data.cc ? data.cc.split(',').map(e => e.trim()).filter(Boolean) : [];
  const bccAddresses = data.bcc ? data.bcc.split(',').map(e => e.trim()).filter(Boolean) : [];

  try {
    const { error } = await resend.emails.send({
      from: `${data.fromName || 'KOLOR STUDIO'} <${SENDER_EMAIL}>`,
      to: toAddresses,
      cc: ccAddresses.length > 0 ? ccAddresses : undefined,
      bcc: bccAddresses.length > 0 ? bccAddresses : undefined,
      replyTo: data.replyTo || OWNER_EMAIL || SENDER_EMAIL,
      subject: data.subject,
      html: getEmailTemplate(content, 'Message from KOLOR STUDIO'),
    });

    if (error) {
      console.error('Failed to send custom email:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    return true;
  } catch (error) {
    console.error('Failed to send custom email:', error);
    throw error;
  }
}

// =============================================
// BOOKING CONFIRMATION EMAIL
// =============================================

export interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  bookingDate: Date;
  duration: number; // in minutes
  location?: string;
  notes?: string;
  studioName?: string;
}

// Format duration from minutes to readable string
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${hours}h ${mins}m`;
}

// Format date for display
function formatBookingDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-US', options);
}

// Send booking confirmation email to client
export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<boolean> {
  if (!resend) {

    return false;
  }

  const studioName = data.studioName || 'KOLOR STUDIO';
  const formattedDate = formatBookingDate(data.bookingDate);
  const formattedDuration = formatDuration(data.duration);

  const content = `
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937;">
      Booking Confirmed!
    </h1>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${data.clientName},<br><br>
      Great news! Your booking has been confirmed. We're excited to work with you on your project.
    </p>
    
    <!-- Booking Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; margin-bottom: 24px; border: 2px solid #7c3aed;">
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <!-- Project Title -->
            <tr>
              <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                <span style="font-size: 12px; color: #7c3aed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  PROJECT
                </span>
                <h2 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #1f2937;">
                  ${data.projectTitle}
                </h2>
              </td>
            </tr>
            
            <!-- Date & Time -->
            <tr>
              <td style="padding: 16px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="top">
                      <div style="width: 36px; height: 36px; background-color: #7c3aed; border-radius: 8px; text-align: center; line-height: 36px;">
                        <span style="font-size: 18px;">&#128197;</span>
                      </div>
                    </td>
                    <td style="padding-left: 12px;">
                      <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</span>
                      <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                        ${formattedDate}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Duration -->
            <tr>
              <td style="padding-bottom: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="top">
                      <div style="width: 36px; height: 36px; background-color: #a855f7; border-radius: 8px; text-align: center; line-height: 36px;">
                        <span style="font-size: 18px;">&#9200;</span>
                      </div>
                    </td>
                    <td style="padding-left: 12px;">
                      <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Duration</span>
                      <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                        ${formattedDuration}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            ${data.location ? `
            <!-- Location -->
            <tr>
              <td style="padding-bottom: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="top">
                      <div style="width: 36px; height: 36px; background-color: #c084fc; border-radius: 8px; text-align: center; line-height: 36px;">
                        <span style="font-size: 18px;">&#128205;</span>
                      </div>
                    </td>
                    <td style="padding-left: 12px;">
                      <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Location</span>
                      <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                        ${data.location}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}
            
            ${data.notes ? `
            <!-- Notes -->
            <tr>
              <td style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Notes</span>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                  ${data.notes}
                </p>
              </td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>
    
    <!-- What's Next -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            What's Next?
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
            <li>Mark this date on your calendar</li>
            <li>We'll send you a reminder before the session</li>
            <li>If you need to reschedule, please contact us as soon as possible</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      We're looking forward to creating something amazing together!<br><br>
      Best regards,<br>
      <strong style="color: #7c3aed;">${studioName}</strong>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: data.clientEmail,
      subject: `Booking Confirmed - ${data.projectTitle}`,
      html: getEmailTemplate(content, `Booking Confirmed - ${data.projectTitle}`),
    });

    if (error) {
      console.error('Failed to send booking confirmation email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
}



// =====================
// CONTRACT EMAIL FUNCTIONS
// =====================

interface ContractSentEmailData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  contractTitle: string;
  studioName: string;
  portalUrl: string;
  customSubject?: string;
  customMessage?: string;
}

export async function sendContractSentEmail(data: ContractSentEmailData): Promise<boolean> {
  console.log('[EMAIL] sendContractSentEmail called for:', data.clientEmail, '| Contract:', data.contractTitle);
  
  try {
    if (!resend) {
      console.error('[EMAIL] Resend not initialized! RESEND_API_KEY missing.');
      return false;
    }

    const firstName = data.clientName.split(' ')[0];

    // Build custom message section or default
    const messageSection = data.customMessage
      ? `<div style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7; white-space: pre-wrap;">${data.customMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>`
      : `<p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.7;">
          Hi ${firstName}! 👋
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.7;">
          An agreement for your project <strong>"${data.projectTitle}"</strong> is ready for your review.
          Please review the terms and sign the agreement using the link below.
        </p>`;

    const content = `
      <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
        Your Agreement is Ready
      </h1>
      
      ${messageSection}
      
      <!-- Contract Info Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #7c3aed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Agreement Details
            </p>
            <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #1f2937;">
              ${data.contractTitle}
            </p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Project: ${data.projectTitle}
            </p>
          </td>
        </tr>
      </table>
      
      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td align="center">
            <a href="${data.portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 18px; font-weight: 600; text-decoration: none; padding: 18px 48px; border-radius: 12px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);">
              Review &amp; Sign Agreement
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 12px;">
            <p style="margin: 0; font-size: 13px; color: #9CA3AF;">Takes just 30 seconds to review and sign!</p>
          </td>
        </tr>
      </table>
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.7;">
        Questions about the agreement? Just reply to this email — happy to help!
      </p>
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        Looking forward to working together,<br>
        <strong style="color: #7c3aed;">${data.studioName}</strong>
      </p>
    `;

    console.log('[EMAIL] Calling resend.emails.send for contract:', data.contractTitle);
    const { data: resendData, error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.clientEmail],
      replyTo: OWNER_EMAIL || SENDER_EMAIL,
      subject: data.customSubject || `Agreement for ${data.projectTitle} - ${data.studioName}`,
      html: getEmailTemplate(content, 'Your Agreement'),
    });

    if (error) {
      console.error('[EMAIL] Resend API error for contract:', JSON.stringify(error));
      return false;
    }

    console.log('[EMAIL] Contract email sent successfully to:', data.clientEmail, '| Resend ID:', resendData?.id || 'unknown');
    return true;
  } catch (error) {
    console.error('[EMAIL] Exception sending contract email:', error);
    return false;
  }
}

interface ContractAgreedData {
  ownerEmail: string;
  clientName: string;
  projectTitle: string;
  contractTitle: string;
  agreedAt: string;
  clientIP: string;
  studioName: string;
}

export async function sendContractAgreedNotification(data: ContractAgreedData): Promise<boolean> {
  try {
    if (!resend) {
      return true;
    }

    const agreedDate = new Date(data.agreedAt).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    const content = `
      <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
        Agreement Signed!
      </h1>
      
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.7;">
        Great news! <strong>${data.clientName}</strong> has signed the agreement for 
        <strong>"${data.projectTitle}"</strong>.
      </p>
      
      <!-- Contract Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin: 24px 0;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;"><strong style="color: #1f2937;">Document:</strong> ${data.contractTitle}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;"><strong style="color: #1f2937;">Signed:</strong> ${agreedDate}</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong style="color: #1f2937;">Client IP:</strong> ${data.clientIP}</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <a href="${process.env.FRONTEND_URL || ''}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
              View in Dashboard
            </a>
          </td>
        </tr>
      </table>
      
      <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 12px;">
        This record serves as an audit trail for the client's consent.
      </p>
    `;

    const { data: resendData, error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: data.ownerEmail,
      subject: `Client signed agreement for ${data.projectTitle}`,
      html: getEmailTemplate(content, 'Agreement Signed'),
    });

    if (error) {
      console.error('[EMAIL] Resend API error for contract agreed notification:', JSON.stringify(error));
      return false;
    }

    console.log('[EMAIL] Contract agreed notification sent to:', data.ownerEmail, '| Resend ID:', resendData?.id || 'unknown');
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending contract agreed notification:', error);
    return false;
  }
}


// =====================
// AUTOPILOT EMAIL FUNCTIONS (Day 12)
// =====================

const buttonStyle = `display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;`;
const greenButtonStyle = `display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;`;

// 1. Auto-Response (Lead Inquiry)
interface AutoResponseData {
  clientName: string;
  clientEmail: string;
  creativeName: string;
  studioName?: string;
  message: string;
  portalUrl?: string;
}
export async function sendAutoResponseEmail(data: AutoResponseData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const content = `
      <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">Hi ${data.clientName}!</h2>
      <div style="white-space: pre-wrap; color: #4b5563; font-size: 15px; line-height: 1.7;">${data.message}</div>
      ${data.portalUrl ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.portalUrl}" style="${buttonStyle}">View My Portfolio</a>
      </div>` : ''}
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        Best regards,<br><strong style="color: #1a1a1a;">${data.studioName || data.creativeName}</strong>
      </p>
    `;
    const { error } = await resend.emails.send({
      from: `${data.studioName || data.creativeName} <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: 'Thanks for reaching out!',
      html: getEmailTemplate(content, 'Thanks for reaching out!'),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending auto-response:', error);
    return false;
  }
}

// 2. Deposit Payment Request
interface DepositPaymentData {
  clientName: string;
  clientEmail: string;
  creativeName: string;
  studioName?: string;
  projectTitle: string;
  totalAmount: number;
  depositAmount: number;
  paymentUrl: string;
}
export async function sendDepositPaymentEmail(data: DepositPaymentData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const content = `
      <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">Secure Your Booking</h2>
      <p style="color: #4b5563; font-size: 15px;">Hi ${data.clientName},</p>
      <p style="color: #4b5563; font-size: 15px;">To confirm your booking for <strong>"${data.projectTitle}"</strong>, please pay the deposit below.</p>
      <div style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Deposit (30%): <strong style="color: #1a1a1a; font-size: 20px;">$${data.depositAmount.toFixed(2)}</strong></p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">Total project: $${data.totalAmount.toFixed(2)}</p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.paymentUrl}" style="${greenButtonStyle}">Pay Deposit ($${data.depositAmount.toFixed(2)})</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Best regards,<br><strong style="color: #1a1a1a;">${data.studioName || data.creativeName}</strong></p>
    `;
    const { error } = await resend.emails.send({
      from: `${data.studioName || data.creativeName} <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: `Secure Your Booking: ${data.projectTitle}`,
      html: getEmailTemplate(content, 'Deposit Payment'),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending deposit payment email:', error);
    return false;
  }
}

// 3. Deposit Received Confirmation
interface DepositReceivedData {
  clientName: string;
  clientEmail: string;
  creativeName: string;
  studioName?: string;
  projectTitle: string;
  depositAmount: number;
  portalUrl?: string;
}
export async function sendDepositReceivedEmail(data: DepositReceivedData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const content = `
      <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">Booking Confirmed!</h2>
      <p style="color: #4b5563; font-size: 15px;">Hi ${data.clientName},</p>
      <p style="color: #4b5563; font-size: 15px;">Your deposit of <strong>$${data.depositAmount.toFixed(2)}</strong> for <strong>"${data.projectTitle}"</strong> has been received!</p>
      <p style="color: #4b5563; font-size: 15px;">Your project is officially booked. I'm looking forward to working with you!</p>
      ${data.portalUrl ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.portalUrl}" style="${buttonStyle}">View Project Portal</a>
      </div>` : ''}
      <p style="color: #6b7280; font-size: 14px;">Best regards,<br><strong style="color: #1a1a1a;">${data.studioName || data.creativeName}</strong></p>
    `;
    const { error } = await resend.emails.send({
      from: `${data.studioName || data.creativeName} <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: 'Booking Confirmed!',
      html: getEmailTemplate(content, 'Booking Confirmed'),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending deposit received email:', error);
    return false;
  }
}

// 4. Delivery Notification
interface DeliveryNotificationData {
  clientName: string;
  clientEmail: string;
  creativeName: string;
  studioName?: string;
  projectTitle: string;
  portalUrl: string;
}
export async function sendDeliveryNotificationEmail(data: DeliveryNotificationData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const content = `
      <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">Your Files Are Ready!</h2>
      <p style="color: #4b5563; font-size: 15px;">Hi ${data.clientName},</p>
      <p style="color: #4b5563; font-size: 15px;">Great news! Your project <strong>"${data.projectTitle}"</strong> is complete and ready to download!</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.portalUrl}" style="${greenButtonStyle}">Download Your Files</a>
      </div>
      <p style="color: #4b5563; font-size: 15px;">I hope you love the final result! Let me know if you have any questions.</p>
      <p style="color: #6b7280; font-size: 14px;">Best regards,<br><strong style="color: #1a1a1a;">${data.studioName || data.creativeName}</strong></p>
    `;
    const { error } = await resend.emails.send({
      from: `${data.studioName || data.creativeName} <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: `Your ${data.projectTitle} is Ready!`,
      html: getEmailTemplate(content, 'Files Ready'),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending delivery notification:', error);
    return false;
  }
}

// 5. Final Payment Request
interface FinalPaymentData {
  clientName: string;
  clientEmail: string;
  creativeName: string;
  studioName?: string;
  projectTitle: string;
  finalAmount: number;
  paymentUrl: string;
}
export async function sendFinalPaymentEmail(data: FinalPaymentData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const content = `
      <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">Final Payment Due</h2>
      <p style="color: #4b5563; font-size: 15px;">Hi ${data.clientName},</p>
      <p style="color: #4b5563; font-size: 15px;">Your project <strong>"${data.projectTitle}"</strong> is complete! The final payment is now due.</p>
      <div style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Final Balance: <strong style="color: #1a1a1a; font-size: 20px;">$${data.finalAmount.toFixed(2)}</strong></p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.paymentUrl}" style="${greenButtonStyle}">Pay Final Balance ($${data.finalAmount.toFixed(2)})</a>
      </div>
      <p style="color: #4b5563; font-size: 15px;">Thank you for choosing to work with me!</p>
      <p style="color: #6b7280; font-size: 14px;">Best regards,<br><strong style="color: #1a1a1a;">${data.studioName || data.creativeName}</strong></p>
    `;
    const { error } = await resend.emails.send({
      from: `${data.studioName || data.creativeName} <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: `Final Payment: ${data.projectTitle}`,
      html: getEmailTemplate(content, 'Final Payment'),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending final payment email:', error);
    return false;
  }
}

// 6. Final Payment Received
interface FinalPaymentReceivedData {
  clientName: string;
  clientEmail: string;
  creativeName: string;
  studioName?: string;
  projectTitle: string;
  amount: number;
}
export async function sendFinalPaymentReceivedEmail(data: FinalPaymentReceivedData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const content = `
      <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">Payment Received — Thank You!</h2>
      <p style="color: #4b5563; font-size: 15px;">Hi ${data.clientName},</p>
      <p style="color: #4b5563; font-size: 15px;">Your final payment of <strong>$${data.amount.toFixed(2)}</strong> for <strong>"${data.projectTitle}"</strong> has been received!</p>
      <p style="color: #4b5563; font-size: 15px;">It was wonderful working with you. I hope we can collaborate again in the future!</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Best regards,<br><strong style="color: #1a1a1a;">${data.studioName || data.creativeName}</strong></p>
    `;
    const { error } = await resend.emails.send({
      from: `${data.studioName || data.creativeName} <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: 'Payment Received — Thank You!',
      html: getEmailTemplate(content, 'Payment Received'),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending final payment received email:', error);
    return false;
  }
}

// 7. Testimonial Request
interface TestimonialRequestData {
  clientName: string;
  clientEmail: string;
  creativeName: string;
  studioName?: string;
  projectTitle: string;
  testimonialUrl: string;
}
export async function sendTestimonialRequestEmail(data: TestimonialRequestData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const content = `
      <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">How Was Your Experience?</h2>
      <p style="color: #4b5563; font-size: 15px;">Hi ${data.clientName},</p>
      <p style="color: #4b5563; font-size: 15px;">I hope you're loving your <strong>"${data.projectTitle}"</strong>!</p>
      <p style="color: #4b5563; font-size: 15px;">Would you mind sharing your experience? It'll only take 2 minutes.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.testimonialUrl}" style="${buttonStyle}">Share Your Experience</a>
      </div>
      <p style="color: #9ca3af; font-size: 13px;">Your feedback helps me improve and helps others find my work. Thank you!</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Best regards,<br><strong style="color: #1a1a1a;">${data.studioName || data.creativeName}</strong></p>
    `;
    const { error } = await resend.emails.send({
      from: `${data.studioName || data.creativeName} <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: 'How Was Your Experience?',
      html: getEmailTemplate(content, 'Testimonial Request'),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending testimonial request:', error);
    return false;
  }
}

// 8. Payment Received Notification (To Creative)
interface PaymentReceivedNotificationData {
  creativeEmail: string;
  clientName: string;
  projectTitle: string;
  amount: number;
  type: 'deposit' | 'final';
  dashboardUrl: string;
}
export async function sendPaymentReceivedNotification(data: PaymentReceivedNotificationData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const typeLabel = data.type === 'deposit' ? 'Deposit' : 'Final';
    const content = `
      <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">${typeLabel} Payment Received!</h2>
      <p style="color: #4b5563; font-size: 15px;"><strong>${data.clientName}</strong> paid the ${data.type} payment of <strong>$${data.amount.toFixed(2)}</strong>.</p>
      <p style="color: #4b5563; font-size: 15px;">Project: <strong>"${data.projectTitle}"</strong></p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.dashboardUrl}" style="${buttonStyle}">View Dashboard</a>
      </div>
    `;
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: data.creativeEmail,
      subject: `Payment Received: ${data.clientName} — $${data.amount.toFixed(2)}`,
      html: getEmailTemplate(content, 'Payment Received'),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return false;
  }
}

// 9. Follow-up Sequence Email (generic wrapper)
interface SequenceEmailData {
  clientEmail: string;
  clientName: string;
  studioName: string;
  subject: string;
  body: string;
  portalUrl?: string;
}
export async function sendSequenceEmail(data: SequenceEmailData): Promise<boolean> {
  if (!resend) {

    return false;
  }
  try {
    const content = `
      <div style="color: #4b5563; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${data.body}</div>
      ${data.portalUrl ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.portalUrl}" style="${buttonStyle}">View Your Quote</a>
      </div>` : ''}
    `;
    const { error } = await resend.emails.send({
      from: `${data.studioName} <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: data.subject,
      html: getEmailTemplate(content, data.subject),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending sequence email:', error);
    return false;
  }
}


// ==================== MESSAGE & WORK PROGRESS NOTIFICATIONS ====================

export async function sendNewMessageNotification(data: {
  to: string;
  from: string;
  messagePreview: string;
  dashboardUrl: string;
  clientName: string;
  projectTitle: string;
}): Promise<boolean> {
  if (!resend) {
    return false;
  }
  try {
    const preview = data.messagePreview.length > 150 ? data.messagePreview.substring(0, 150) + '...' : data.messagePreview;
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">💬</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #1f2937; text-align: center;">New Message from ${data.from}</h2>
      <p style="text-align: center; color: #6b7280; margin-bottom: 24px;">Regarding: ${data.projectTitle}</p>
      <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; color: #374151; font-style: italic; line-height: 1.6;">"${preview}"</p>
      </div>
      <div style="text-align: center; margin-top: 28px;">
        <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View & Reply
        </a>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 20px;">Reply quickly to keep your clients engaged!</p>
    `;
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: data.to,
      subject: `New Message from ${data.from}`,
      html: getEmailTemplate(content, `New Message from ${data.from}`),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[MESSAGE NOTIFICATION] Failed:', error);
    return false;
  }
}

export async function sendClientMessageNotification(data: {
  to: string;
  from: string;
  messagePreview: string;
  portalUrl: string;
  creativeName: string;
  studioName?: string;
}): Promise<boolean> {
  if (!resend) {
    return false;
  }
  try {
    const preview = data.messagePreview.length > 150 ? data.messagePreview.substring(0, 150) + '...' : data.messagePreview;
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">💬</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #1f2937; text-align: center;">New Message from ${data.creativeName}</h2>
      <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; color: #374151; font-style: italic; line-height: 1.6;">"${preview}"</p>
      </div>
      <div style="text-align: center; margin-top: 28px;">
        <a href="${data.portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Open Portal & Reply
        </a>
      </div>
    `;
    const senderName = data.studioName || data.creativeName;
    const { error } = await resend.emails.send({
      from: `${senderName} <${SENDER_EMAIL}>`,
      to: data.to,
      subject: `${data.creativeName} sent you a message`,
      html: getEmailTemplate(content, `Message from ${data.creativeName}`),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[MESSAGE NOTIFICATION] Failed:', error);
    return false;
  }
}

export async function sendWorkProgressNotification(data: {
  to: string;
  clientName: string;
  deliverableName: string;
  status: string;
  creativeName: string;
  studioName?: string;
  portalUrl: string;
}): Promise<boolean> {
  if (!resend) {
    return false;
  }
  try {
    const statusConfig: Record<string, { title: string; message: string; color: string }> = {
      IN_PROGRESS: { title: 'Work Started', message: 'has started working on', color: '#3b82f6' },
      READY: { title: 'Ready for Review', message: 'has completed work on', color: '#f59e0b' },
      DELIVERED: { title: 'Delivered', message: 'has delivered', color: '#10b981' },
      SHIPPED: { title: 'Shipped', message: 'has shipped', color: '#10b981' },
    };
    const cfg = statusConfig[data.status] || statusConfig.IN_PROGRESS;

    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">${data.status === 'DELIVERED' || data.status === 'SHIPPED' ? '✅' : '🚀'}</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #1f2937; text-align: center;">${cfg.title}</h2>
      <p style="text-align: center; color: #6b7280; margin-bottom: 24px;">Hi ${data.clientName},</p>
      <div style="background: ${cfg.color}10; border-left: 4px solid ${cfg.color}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937;">${data.deliverableName}</h3>
        <p style="margin: 0; color: #6b7280;">${data.creativeName} ${cfg.message} your deliverable.</p>
      </div>
      <div style="text-align: center; margin-top: 28px;">
        <a href="${data.portalUrl}" style="display: inline-block; background: ${cfg.color}; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View in Portal
        </a>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 20px;">Track all project updates in your client portal.</p>
    `;
    const senderName = data.studioName || data.creativeName;
    const { error } = await resend.emails.send({
      from: `${senderName} <${SENDER_EMAIL}>`,
      to: data.to,
      subject: `${cfg.title}: ${data.deliverableName}`,
      html: getEmailTemplate(content, cfg.title),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[WORK NOTIFICATION] Failed:', error);
    return false;
  }
}



// =====================
// WEEKLY DIGEST EMAIL
// =====================
import type { DigestData } from './digestService';

export async function sendWeeklyDigestEmail(digest: DigestData): Promise<boolean> {
  if (!resend) {
    return false;
  }

  const { stats, nextActions, topClients, period, userName, studioName } = digest;
  const sym = stats.currencySymbol;
  const startStr = period.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = period.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const baseUrl = process.env.FRONTEND_URL || 'https://quote-fix-1.preview.emergentagent.com';

  // Build stat cards
  const statCards = [
    { label: 'New Leads', value: stats.newLeads, color: '#6366f1', icon: 'inbox' },
    { label: 'Quotes Sent', value: stats.quoteSent, color: '#a855f7', icon: 'send' },
    { label: 'Accepted', value: stats.quotesAccepted, color: '#10b981', icon: 'check' },
    { label: 'Contracts Signed', value: stats.contractsSigned, color: '#059669', icon: 'file-check' },
    { label: 'Deposits Received', value: stats.depositsReceived, color: '#f59e0b', icon: 'dollar' },
  ];

  // Chunk stat cards into rows of 3

  const nextActionsHtml = nextActions.length > 0
    ? nextActions.map(a => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #374151; font-size: 14px;">${a.label}</td>
              <td align="right" style="font-weight: 700; color: #7c3aed; font-size: 14px;">${a.count}</td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('')
    : `<tr><td style="padding: 16px; color: #10b981; font-size: 14px; text-align: center;">All caught up! No pending actions this week.</td></tr>`;

  const topClientsHtml = topClients.length > 0
    ? topClients.map((c, i) => `
      <tr>
        <td style="padding: 8px 16px; border-bottom: 1px solid #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #374151; font-size: 14px;">${i + 1}. ${c.name}</td>
              <td align="right" style="font-weight: 700; color: #059669; font-size: 14px;">${sym}${c.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('')
    : '';

  const revenueSection = stats.totalRevenue > 0
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">Revenue This Week</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff;">${sym}${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </td>
      </tr>
    </table>`
    : '';

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1f2937;">
      Weekly Autopilot Digest
    </h1>
    <p style="margin: 0 0 4px 0; font-size: 14px; color: #9ca3af;">
      ${startStr} — ${endStr}
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${userName}, here's how your pipeline performed this week at <strong style="color: #7c3aed;">${studioName}</strong>.
    </p>

    ${revenueSection}

    <!-- Stat Cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>${statCards.slice(0, 3).map(s => `
        <td style="width: 33%; padding: 4px;">
          <div style="background: ${s.color}10; border: 1px solid ${s.color}30; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: ${s.color};">${s.value}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${s.label}</div>
          </div>
        </td>
      `).join('')}</tr>
      <tr>${statCards.slice(3).map(s => `
        <td style="width: 33%; padding: 4px;">
          <div style="background: ${s.color}10; border: 1px solid ${s.color}30; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: ${s.color};">${s.value}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${s.label}</div>
          </div>
        </td>
      `).join('')}<td style="width: 33%; padding: 4px;"></td></tr>
    </table>

    <!-- Next Actions -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafafa; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 16px; background: #7c3aed; color: white; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Action Items
        </td>
      </tr>
      ${nextActionsHtml}
    </table>

    ${topClientsHtml ? `
    <!-- Top Clients -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafafa; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 16px; background: #059669; color: white; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Top Clients This Week
        </td>
      </tr>
      ${topClientsHtml}
    </table>` : ''}

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 24px;">
          <a href="${baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            Open Dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
      This is your weekly autopilot digest from KOLOR STUDIO.<br>
      To adjust email preferences, visit your <a href="${baseUrl}/dashboard" style="color: #7c3aed; text-decoration: underline;">dashboard settings</a>.
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [digest.userEmail],
      subject: `Your Weekly Pipeline Report — ${startStr} to ${endStr}`,
      html: getEmailTemplate(content, 'Weekly Autopilot Digest'),
    });

    if (error) {
      console.error('[DIGEST] Failed to send:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[DIGEST] Error:', error);
    return false;
  }
}


// =====================
// CLIENT ONBOARDING DRIP EMAILS
// =====================

interface OnboardingEmailParams {
  to: string;
  clientName: string;
  creativeName: string;
  projectType: string;
  portalUrl: string;
  daysUntilDeadline?: number;
  leadId?: string;
}

export async function sendClientOnboardingEmail(
  step: 1 | 2 | 3,
  params: OnboardingEmailParams
): Promise<boolean> {
  const { to, clientName, creativeName, projectType, portalUrl, daysUntilDeadline, leadId } = params;

  if (!resend) {

    return false;
  }

  // Create tracking record if leadId available
  let trackingPixelHtml = '';
  if (leadId) {
    try {
      const { createEmailTracking, getTrackingPixelHtml } = await import('./emailTracking');
      const trackingId = await createEmailTracking({
        emailType: `client_onboarding_${step}`,
        sequenceId: 'client-onboarding',
        stepNumber: step,
        leadId,
        recipientEmail: to,
      });
      trackingPixelHtml = getTrackingPixelHtml(trackingId);
    } catch (err) {
      console.error('[ONBOARDING] Tracking creation failed:', err);
    }
  }

  const templates: Record<number, { subject: string; content: string }> = {
    1: {
      subject: `Welcome! Let's Get Started on Your ${projectType}`,
      content: `
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #1f2937;">
          Welcome to Your Project!
        </h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          I'm excited to work with you on your <strong>${projectType}</strong>.
          Here's what to expect over the coming days:
        </p>
        <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">What Happens Next</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 2;">
            <li>I'll start working on your project right away</li>
            <li>You'll receive updates through your client portal</li>
            <li>Feel free to message me anytime with questions</li>
            <li>I'll notify you when files are ready for review</li>
          </ul>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Track everything in your personal client portal:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 16px 0;">
              <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                Open Your Portal
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Questions? Just reply to this email!<br><strong>${creativeName}</strong>
        </p>
      `,
    },
    2: {
      subject: 'Quick Guide to Your Client Portal',
      content: `
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #1f2937;">
          Your Client Portal Guide
        </h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Quick tip: your client portal is where everything lives! Here's what you can do:
        </p>
        <div style="margin: 24px 0;">
          <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 12px; border-radius: 6px;">
            <h4 style="margin: 0 0 6px 0; color: #1e40af; font-size: 15px;">Send Messages</h4>
            <p style="margin: 0; color: #475569; font-size: 14px;">Ask questions, share ideas, or request changes anytime</p>
          </div>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 12px; border-radius: 6px;">
            <h4 style="margin: 0 0 6px 0; color: #065f46; font-size: 15px;">View Files</h4>
            <p style="margin: 0; color: #475569; font-size: 14px;">Download your files as soon as they're ready</p>
          </div>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 12px; border-radius: 6px;">
            <h4 style="margin: 0 0 6px 0; color: #92400e; font-size: 15px;">Track Progress</h4>
            <p style="margin: 0; color: #475569; font-size: 14px;">See your project timeline and upcoming milestones</p>
          </div>
          <div style="background: #fce7f3; border-left: 4px solid #ec4899; padding: 16px; border-radius: 6px;">
            <h4 style="margin: 0 0 6px 0; color: #9f1239; font-size: 15px;">Manage Payments</h4>
            <p style="margin: 0; color: #475569; font-size: 14px;">View invoices and payment history in one place</p>
          </div>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 16px 0;">
              <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                Explore Your Portal
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Need help navigating? I'm just an email away!<br><strong>${creativeName}</strong>
        </p>
      `,
    },
    3: {
      subject: `Your ${projectType} is Progressing!`,
      content: `
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #1f2937;">
          Your Project is Underway!
        </h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Great news! Work on your <strong>${projectType}</strong> is progressing well.
        </p>
        <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;">
          ${daysUntilDeadline
            ? `<p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 600;">${daysUntilDeadline} days until delivery</p>`
            : `<p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 600;">On track for timely delivery!</p>`
          }
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;"><strong>What you can do:</strong></p>
        <ul style="color: #4b5563; line-height: 2; padding-left: 24px;">
          <li>Check your portal for work-in-progress updates</li>
          <li>Send me a message if you have questions or ideas</li>
          <li>Review any files I've shared for feedback</li>
          <li>Stay tuned for the final delivery notification!</li>
        </ul>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 16px 0;">
              <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                Check Project Status
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Thank you for your trust!<br><strong>${creativeName}</strong>
        </p>
      `,
    },
  };

  const template = templates[step];
  const stepLabels = { 1: 'Welcome', 2: 'Portal Guide', 3: 'Update Reminder' };

  try {
    let html = getEmailTemplate(template.content, `Client Onboarding: ${stepLabels[step]}`);
    // Inject tracking pixel before closing </body>
    if (trackingPixelHtml) {
      html = html.replace('</body>', `${trackingPixelHtml}</body>`);
    }
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [to],
      subject: template.subject,
      html,
    });

    if (error) {
      console.error(`[ONBOARDING] Step ${step} failed:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[ONBOARDING] Step ${step} error:`, error);
    return false;
  }
}



// =====================
// QUOTE FOLLOW-UP EMAILS
// =====================

interface QuoteFollowUpParams {
  to: string;
  clientName: string;
  creativeName: string;
  projectType: string;
  quoteAmount: number;
  currencySymbol: string;
  portalUrl: string;
  expirationDays?: number;
  leadId?: string;
}

export async function sendQuoteFollowUpEmail(
  step: 1 | 2 | 3,
  params: QuoteFollowUpParams
): Promise<boolean> {
  const { to, clientName, creativeName, projectType, quoteAmount, currencySymbol, portalUrl, expirationDays, leadId } = params;
  const formattedAmount = `${currencySymbol}${quoteAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!resend) {

    return false;
  }

  // Create tracking record if leadId available
  let trackingPixelHtml = '';
  if (leadId) {
    try {
      const { createEmailTracking, getTrackingPixelHtml } = await import('./emailTracking');
      const trackingId = await createEmailTracking({
        emailType: `quote_followup_${step}`,
        sequenceId: 'quote-followup',
        stepNumber: step,
        leadId,
        recipientEmail: to,
      });
      trackingPixelHtml = getTrackingPixelHtml(trackingId);
    } catch (err) {
      console.error('[QUOTE FOLLOWUP] Tracking creation failed:', err);
    }
  }

  const templates: Record<number, { subject: string; content: string }> = {
    1: {
      subject: `Following up on your ${projectType} quote`,
      content: `
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1f2937;">Just Following Up</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          I wanted to follow up on the quote I sent you for your <strong>${projectType}</strong>.
        </p>
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #1e40af; font-size: 20px; font-weight: 700;">${formattedAmount}</p>
          <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Investment for ${projectType}</p>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          I'm excited about the possibility of working together! If you have any questions or need clarification, I'm here to help.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding: 16px 0;">
            <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">Review Your Quote</a>
          </td></tr>
        </table>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Looking forward to hearing from you!<br><strong>${creativeName}</strong>
        </p>
      `,
    },
    2: {
      subject: `Any questions about your ${projectType}?`,
      content: `
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1f2937;">Any Questions?</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          I haven't heard back about your <strong>${projectType}</strong> quote yet, and I wanted to check in.
        </p>
        <div style="background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #6b21a8; font-size: 15px;">Common Questions:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 2;">
            <li>Can the timeline be adjusted?</li>
            <li>Are payment plans available?</li>
            <li>What's included in the price?</li>
            <li>Can we customize the package?</li>
          </ul>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you have any concerns, I'm happy to discuss! Reply to this email or send me a message through your portal.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding: 16px 0;">
            <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">View Quote & Ask Questions</a>
          </td></tr>
        </table>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          No pressure — just want to make sure you have everything you need!<br><strong>${creativeName}</strong>
        </p>
      `,
    },
    3: {
      subject: `Your ${projectType} quote expires soon`,
      content: `
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1f2937;">Final Follow-Up</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          This is my final follow-up regarding your <strong>${projectType}</strong> quote.
        </p>
        <div style="background: #fffbeb; border: 2px solid #f59e0b; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;">
          <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: 600;">Quote expires in ${expirationDays || 7} days</p>
          <p style="margin: 8px 0 0 0; color: #78350f; font-size: 14px;">${formattedAmount} for ${projectType}</p>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          I'd love to work with you, but I understand if the timing isn't right. If you're interested, let me know soon so I can reserve your spot!
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding: 16px 0;">
            <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">Accept Quote Now</a>
          </td></tr>
          <tr><td align="center"><p style="margin: 0; color: #6b7280; font-size: 13px;">Or reply to let me know if you need more time</p></td></tr>
        </table>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Either way, I appreciate you considering me for your project!<br><strong>${creativeName}</strong>
        </p>
      `,
    },
  };

  const template = templates[step];
  const stepLabels: Record<number, string> = { 1: 'Gentle Reminder', 2: 'Answer Questions', 3: 'Final Follow-Up' };

  try {
    let html = getEmailTemplate(template.content, `Quote Follow-Up: ${stepLabels[step]}`);
    if (trackingPixelHtml) {
      html = html.replace('</body>', `${trackingPixelHtml}</body>`);
    }
    const { error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [to],
      subject: template.subject,
      html,
    });

    if (error) {
      console.error(`[QUOTE FOLLOWUP] Step ${step} failed:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[QUOTE FOLLOWUP] Step ${step} error:`, error);
    return false;
  }
}
