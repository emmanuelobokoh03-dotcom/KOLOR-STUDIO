import { Resend } from 'resend';

// Initialize Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

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
                      The CRM that doesn't feel like a CRM
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
                    Built for photographers, designers, and videographers
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
    console.log('Resend not configured or owner email missing, skipping notification');
    return false;
  }

  const dashboardUrl = process.env.FRONTEND_URL || 'https://polish-studio-4.preview.emergentagent.com';
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
    const { data, error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [OWNER_EMAIL],
      subject: `New Lead: ${lead.projectTitle} - ${lead.clientName}`,
      html: getEmailTemplate(content, 'New Lead Notification'),
    });

    if (error) {
      console.error('Failed to send owner notification:', error);
      return false;
    }

    console.log('Owner notification email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send owner notification:', error);
    return false;
  }
}

// Send confirmation email to client
export async function sendClientConfirmation(lead: LeadData): Promise<boolean> {
  if (!resend) {
    console.log('Resend not configured, skipping client confirmation');
    return false;
  }

  const serviceLabel = SERVICE_TYPE_LABELS[lead.serviceType] || lead.serviceType;
  const baseUrl = process.env.FRONTEND_URL || 'https://polish-studio-4.preview.emergentagent.com';
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
    const { data, error } = await resend.emails.send({
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

    console.log('Client confirmation email sent successfully:', data?.id);
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
    console.log('Resend not configured, skipping status notification');
    return false;
  }

  const statusConfig = STATUS_CLIENT_MESSAGES[data.newStatus];
  
  // Only send for statuses we have messages for (skip NEW, LOST, etc.)
  if (!statusConfig) {
    console.log(`No client notification configured for status: ${data.newStatus}`);
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://polish-studio-4.preview.emergentagent.com';
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
    const { data: emailData, error } = await resend.emails.send({
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

    console.log('Status notification email sent successfully:', emailData?.id);
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
    console.log('Resend not configured, skipping portal link email');
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://polish-studio-4.preview.emergentagent.com';
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
    const { data: emailData, error } = await resend.emails.send({
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

    console.log('Portal link email sent successfully:', emailData?.id);
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
    console.log('Resend not configured, skipping password reset email');
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://polish-studio-4.preview.emergentagent.com';
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
    const { data: emailData, error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.email],
      subject: 'Reset your KOLOR STUDIO password',
      html: getEmailTemplate(content, 'Password Reset'),
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }

    console.log('Password reset email sent successfully:', emailData?.id);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
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
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: string;
  studioName: string;
}

export async function sendQuoteEmail(data: QuoteEmailData): Promise<boolean> {
  if (!resend) {
    console.log('Resend not configured, skipping quote email');
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://polish-studio-4.preview.emergentagent.com';
  const quoteUrl = `${baseUrl}/quotes/${data.quoteToken}`;
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

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">📋</span>
    </div>
    
    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: center;">
      Your Quote is Ready!
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      Hi ${firstName},
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
      We've prepared a quote for your project <strong>"${data.projectTitle}"</strong>. 
      Click the button below to view the full details and accept the quote.
    </p>
    
    <!-- Quote Summary Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">
            Quote ${data.quoteNumber}
          </p>
          <p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff;">
            ${formattedTotal}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- View Quote CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${quoteUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            View Quote Details
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Validity Notice -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0; font-size: 14px; color: #92400e; text-align: center;">
            <strong>⏰ This quote is valid until ${formattedDate}</strong>
          </p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.7;">
      If you have any questions about this quote, simply reply to this email - we're here to help!
    </p>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #4b5563;">
      Looking forward to working with you,<br>
      <strong style="color: #7c3aed;">${data.studioName}</strong>
    </p>
  `;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.clientEmail],
      replyTo: OWNER_EMAIL || SENDER_EMAIL,
      subject: `Quote from KOLOR STUDIO - ${data.projectTitle}`,
      html: getEmailTemplate(content, 'Your Quote'),
    });

    if (error) {
      console.error('Failed to send quote email:', error);
      return false;
    }

    console.log('Quote email sent successfully:', emailData?.id);
    return true;
  } catch (error) {
    console.error('Failed to send quote email:', error);
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
}

export async function sendQuoteAcceptedNotification(data: QuoteAcceptedData): Promise<boolean> {
  if (!resend) {
    console.log('Resend not configured, skipping quote accepted notification');
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://polish-studio-4.preview.emergentagent.com';
  const dashboardUrl = `${baseUrl}/dashboard`;
  const formattedTotal = data.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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
      <strong>Next Steps:</strong>
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 24px; color: #4b5563; line-height: 1.8;">
      <li>Reach out to the client to finalize details</li>
      <li>Schedule a kick-off call or meeting</li>
      <li>Send contract and payment instructions</li>
    </ul>
    
    <!-- Dashboard CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            View in Dashboard
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
    const { data: emailData, error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.ownerEmail],
      subject: `🎉 ${data.clientName} accepted your quote! (${formattedTotal})`,
      html: getEmailTemplate(content, 'Quote Accepted'),
    });

    if (error) {
      console.error('Failed to send quote accepted notification:', error);
      return false;
    }

    console.log('Quote accepted notification sent successfully:', emailData?.id);
    return true;
  } catch (error) {
    console.error('Failed to send quote accepted notification:', error);
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
    console.log('Resend not configured, skipping quote declined notification');
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://polish-studio-4.preview.emergentagent.com';
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
    const { data: emailData, error } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: [data.ownerEmail],
      subject: `${data.clientName} declined your quote`,
      html: getEmailTemplate(content, 'Quote Declined'),
    });

    if (error) {
      console.error('Failed to send quote declined notification:', error);
      return false;
    }

    console.log('Quote declined notification sent successfully:', emailData?.id);
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
    console.log('Resend not configured, skipping custom email');
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
    const { data: emailData, error } = await resend.emails.send({
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

    console.log('Custom email sent successfully:', emailData?.id);
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
    console.log('Resend not configured, skipping booking confirmation email');
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
    const { data: emailData, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: data.clientEmail,
      subject: `Booking Confirmed - ${data.projectTitle}`,
      html: getEmailTemplate(content, `Booking Confirmed - ${data.projectTitle}`),
    });

    if (error) {
      console.error('Failed to send booking confirmation email:', error);
      return false;
    }

    console.log('Booking confirmation email sent to:', data.clientEmail, 'ID:', emailData?.id);
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
}

export async function sendContractSentEmail(data: ContractSentEmailData): Promise<boolean> {
  try {
    if (!resend) {
      console.log('[DEV] Contract sent email would go to:', data.clientEmail);
      return true;
    }

    const { data: emailData } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: data.clientEmail,
      subject: `Agreement for ${data.projectTitle} - ${data.studioName}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; padding: 0;">
          <div style="background: linear-gradient(135deg, #7c3aed, #9333ea); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Agreement Ready</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">${data.studioName}</p>
          </div>
          <div style="padding: 32px; background: #1a1a1a;">
            <p style="color: #fafafa; font-size: 16px; line-height: 1.6;">Hi ${data.clientName.split(' ')[0]},</p>
            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">
              An agreement for your project <strong style="color: #fafafa;">"${data.projectTitle}"</strong> is ready for your review. 
              Please review the terms and sign the agreement using the link below.
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${data.portalUrl}" 
                 style="display: inline-block; padding: 14px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">
                Review &amp; Sign Agreement
              </a>
            </div>
            <div style="margin-top: 24px; padding: 16px; background: #0f0f0f; border-radius: 12px; border: 1px solid #333;">
              <p style="color: #a3a3a3; font-size: 12px; margin: 0;">
                <strong style="color: #fafafa;">Document:</strong> ${data.contractTitle}<br/>
                <strong style="color: #fafafa;">Project:</strong> ${data.projectTitle}
              </p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 24px; line-height: 1.5;">
              If you have any questions about the agreement, please reply to this email or contact ${data.studioName} directly.
            </p>
          </div>
        </div>
      `,
    });

    console.log('Contract sent email sent to:', data.clientEmail, 'ID:', emailData?.id);
    return true;
  } catch (error) {
    console.error('Error sending contract email:', error);
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
      console.log('[DEV] Contract agreed notification would go to:', data.ownerEmail);
      return true;
    }

    const agreedDate = new Date(data.agreedAt).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    const { data: emailData } = await resend.emails.send({
      from: `KOLOR STUDIO <${SENDER_EMAIL}>`,
      to: data.ownerEmail,
      subject: `Client signed agreement for ${data.projectTitle}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; padding: 0;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Agreement Signed!</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">${data.studioName}</p>
          </div>
          <div style="padding: 32px; background: #1a1a1a;">
            <p style="color: #fafafa; font-size: 16px; line-height: 1.6;">Great news!</p>
            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">
              <strong style="color: #fafafa;">${data.clientName}</strong> has signed the agreement for 
              <strong style="color: #fafafa;">"${data.projectTitle}"</strong>.
            </p>
            <div style="margin: 24px 0; padding: 16px; background: #0f0f0f; border-radius: 12px; border: 1px solid #333;">
              <p style="color: #a3a3a3; font-size: 12px; margin: 0; line-height: 1.8;">
                <strong style="color: #fafafa;">Document:</strong> ${data.contractTitle}<br/>
                <strong style="color: #fafafa;">Signed:</strong> ${agreedDate}<br/>
                <strong style="color: #fafafa;">Client IP:</strong> ${data.clientIP}
              </p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
              This record serves as an audit trail for the client's consent.
            </p>
          </div>
        </div>
      `,
    });

    console.log('Contract agreed notification sent to:', data.ownerEmail, 'ID:', emailData?.id);
    return true;
  } catch (error) {
    console.error('Error sending contract agreed notification:', error);
    return false;
  }
}
