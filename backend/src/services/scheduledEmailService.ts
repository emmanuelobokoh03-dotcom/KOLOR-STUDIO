import prisma from '../lib/prisma';
import { sendTestimonialRequestEmail, sendFileReviewReminderEmail, sendPostCallQuoteReminderEmail } from './email';

let scheduledEmailProcessorRunning = false;

export async function processScheduledEmails(): Promise<void> {
  if (scheduledEmailProcessorRunning) {
    console.warn('[ScheduledEmails] Previous run still active — skipping this invocation');
    return;
  }
  scheduledEmailProcessorRunning = true;
  try {
    const now = new Date();
    console.log('[ScheduledEmails] Processing due emails...');

    const dueEmails = await prisma.scheduledEmail.findMany({
      where: {
        scheduledFor: { lte: now },
        sentAt: null,
      },
      include: {
        lead: {
          include: {
            assignedTo: true,
          },
        },
      },
      take: 50,
    });

    if (dueEmails.length === 0) {
      console.log('[ScheduledEmails] No due emails found');
      return;
    }

    console.log(`[ScheduledEmails] Found ${dueEmails.length} due emails`);

    for (const scheduled of dueEmails) {
      try {
        const { lead, type, metadata } = scheduled;
        const owner = lead.assignedTo;
        const studioName = owner?.studioName || owner?.firstName || 'The Studio';
        const creativeName = owner ? `${owner.firstName} ${owner.lastName}` : 'The Creative';
        const frontendUrl = process.env.FRONTEND_URL || '';

        if (type === 'TESTIMONIAL_REQUEST') {
          await sendTestimonialRequestEmail({
            clientName: lead.clientName,
            clientEmail: lead.clientEmail,
            creativeName,
            studioName,
            projectTitle: lead.projectTitle,
            testimonialUrl: `${frontendUrl}/portal/${lead.portalToken}`,
          });
        } else if (type === 'FILE_REVIEW_REMINDER') {
          const meta = (metadata as any) || {};
          await sendFileReviewReminderEmail({
            clientName: lead.clientName,
            clientEmail: lead.clientEmail,
            creativeName,
            studioName,
            projectTitle: lead.projectTitle,
            fileCount: meta.fileCount || 1,
            portalUrl: `${frontendUrl}/portal/${lead.portalToken}`,
          });
        } else if (type === 'POST_CALL_QUOTE_REMINDER') {
          if (owner) {
            await sendPostCallQuoteReminderEmail({
              ownerEmail: owner.email,
              ownerFirstName: owner.firstName,
              clientName: lead.clientName,
              projectTitle: lead.projectTitle,
              leadId: lead.id,
              ownerIndustry: owner.industry,
            });
          }
        }

        await prisma.scheduledEmail.update({
          where: { id: scheduled.id },
          data: { sentAt: new Date() },
        });
        console.log(`[ScheduledEmails] Sent ${type} to ${lead.clientEmail}`);
      } catch (err) {
        console.error(`[ScheduledEmails] Failed to send ${scheduled.id}:`, err);
      }
    }

    console.log('[ScheduledEmails] Processing complete');
  } catch (error) {
    console.error('[ScheduledEmails] Error:', error);
  } finally {
    scheduledEmailProcessorRunning = false;
  }
}
