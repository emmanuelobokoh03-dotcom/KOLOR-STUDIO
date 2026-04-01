import { SequenceTrigger } from '@prisma/client';

import prisma from '../lib/prisma';
import { sendSequenceEmail } from './email';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function replaceVars(text: string, lead: any): string {
  const firstName = (lead.clientName || 'there').split(' ')[0];
  return text
    .replace(/\{clientName\}/g, lead.clientName || 'there')
    .replace(/\{firstName\}/g, firstName)
    .replace(/\{projectTitle\}/g, lead.projectTitle || 'your project')
    .replace(/\{projectType\}/g, lead.projectType || 'project')
    .replace(/\{userName\}/g, lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`.trim() : 'us')
    .replace(/\{studioName\}/g, lead.assignedTo?.studioName || lead.assignedTo?.firstName || 'our studio');
}

/**
 * Enroll a lead in all active sequences matching the given trigger.
 */
export async function enrollLead(leadId: string, trigger: SequenceTrigger): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, assignedToId: true, clientName: true },
    });
    if (!lead || !lead.assignedToId) return;

    const sequences = await prisma.emailSequence.findMany({
      where: { userId: lead.assignedToId, trigger, active: true },
      include: { steps: { orderBy: { order: 'asc' }, take: 1 } },
    });

    for (const seq of sequences) {
      // Skip if already enrolled
      const exists = await prisma.sequenceEnrollment.findUnique({
        where: { sequenceId_leadId: { sequenceId: seq.id, leadId } },
      });
      if (exists) continue;

      const firstStep = seq.steps[0];
      const nextEmailAt = firstStep ? addDays(new Date(), firstStep.delayDays) : null;

      await prisma.sequenceEnrollment.create({
        data: { sequenceId: seq.id, leadId, nextEmailAt },
      });

    }
  } catch (error) {
    console.error('[Seq] Enroll error:', error);
  }
}

/**
 * Stop all active enrollments for a lead.
 */
export async function stopSequencesForLead(leadId: string, reason: string): Promise<void> {
  try {
    const result = await prisma.sequenceEnrollment.updateMany({
      where: { leadId, status: 'ACTIVE' },
      data: { status: 'STOPPED', stoppedReason: reason, stoppedAt: new Date(), nextEmailAt: null },
    });
    if (result.count > 0) {

    }
  } catch (error) {
    console.error('[Seq] Stop error:', error);
  }
}

/**
 * Process all due emails across active enrollments. Run on a schedule.
 */
export async function processSequences(): Promise<{ sent: number; completed: number; errors: number }> {
  const stats = { sent: 0, completed: 0, errors: 0 };
  try {
    const due = await prisma.sequenceEnrollment.findMany({
      where: { status: 'ACTIVE', nextEmailAt: { lte: new Date() } },
      include: {
        sequence: { include: { steps: { orderBy: { order: 'asc' } } } },
        lead: { include: { assignedTo: { select: { firstName: true, lastName: true, studioName: true, email: true } } } },
      },
    });

    if (due.length === 0) return stats;


    for (const enrollment of due) {
      try {
        const step = enrollment.sequence.steps[enrollment.currentStep];

        if (!step) {
          // No more steps → complete
          await prisma.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'COMPLETED', completedAt: new Date(), nextEmailAt: null },
          });
          stats.completed++;
          continue;
        }

        // Send the follow-up email via Resend
        const subject = replaceVars(step.subject, enrollment.lead);
        const body = replaceVars(step.body, enrollment.lead);
        const studioName = enrollment.lead.assignedTo?.studioName || enrollment.lead.assignedTo?.firstName || 'Studio';
        const portalUrl = enrollment.lead.portalToken ? `${process.env.FRONTEND_URL}/portal/${enrollment.lead.portalToken}` : undefined;

        await sendSequenceEmail({
          clientEmail: enrollment.lead.clientEmail,
          clientName: enrollment.lead.clientName,
          studioName,
          subject,
          body,
          portalUrl,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/api/unsubscribe/${enrollment.unsubscribeToken}`,
        });


        // Determine next step timing
        const nextStep = enrollment.sequence.steps[enrollment.currentStep + 1];
        const nextEmailAt = nextStep ? addDays(new Date(), nextStep.delayDays) : null;
        const isLast = !nextStep;

        const updateData: any = {
          currentStep: enrollment.currentStep + 1,
          nextEmailAt,
        };
        if (isLast) {
          updateData.status = 'COMPLETED';
          updateData.completedAt = new Date();
        }

        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: updateData,
        });

        stats.sent++;
        if (isLast) stats.completed++;
      } catch (err) {
        console.error(`[Seq] Error processing enrollment ${enrollment.id}:`, err);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('[Seq] Process error:', error);
  }
  return stats;
}
