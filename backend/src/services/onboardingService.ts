import prisma from '../lib/prisma';
import { sendClientOnboardingEmail } from './email';

export async function enrollInOnboarding(leadId: string) {

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: { select: { firstName: true, lastName: true, studioName: true, industry: true } },
    },
  });

  if (!lead || !lead.clientEmail) {
    console.error('[ONBOARDING] Lead not found or no email:', leadId);
    return null;
  }

  // Check if already enrolled
  const existing = await prisma.clientOnboardingEnrollment.findFirst({
    where: { leadId },
  });
  if (existing) {
    return existing;
  }

  // Create enrollment
  const enrollment = await prisma.clientOnboardingEnrollment.create({
    data: { leadId, currentStep: 1 },
  });

  // Send first email immediately
  const baseUrl = process.env.FRONTEND_URL || process.env.VITE_API_URL?.replace('/api', '') || '';
  const portalUrl = `${baseUrl}/portal/${lead.portalToken}`;
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${enrollment.unsubscribeToken}`;
  const creativeName = lead.assignedTo?.studioName
    || `${lead.assignedTo?.firstName || ''} ${lead.assignedTo?.lastName || ''}`.trim()
    || 'Your Creative';

  try {
    const sent = await sendClientOnboardingEmail(1, {
      to: lead.clientEmail,
      clientName: lead.clientName,
      creativeName,
      projectType: lead.serviceType || 'Project',
      portalUrl,
      leadId,
      unsubscribeUrl,
      industry: lead.assignedTo?.industry,
    });

    if (sent) {
      await prisma.clientOnboardingEnrollment.update({
        where: { id: enrollment.id },
        data: { email1SentAt: new Date() },
      });
    }
  } catch (error) {
    console.error('[ONBOARDING] Failed to send email 1:', error);
  }

  return enrollment;
}

export async function stopOnboardingForLead(leadId: string, reason: string): Promise<number> {
  try {
    const result = await prisma.clientOnboardingEnrollment.updateMany({
      where: { leadId, completed: false, stoppedAt: null },
      data: { completed: true, stoppedAt: new Date(), stopReason: reason },
    });
    if (result.count > 0) {
      console.log(`[ONBOARDING] Stopped ${result.count} enrollment(s) for lead ${leadId}: ${reason}`);
    }
    return result.count;
  } catch (error) {
    console.error('[ONBOARDING] Stop error:', error);
    return 0;
  }
}


let onboardingProcessorRunning = false;

export async function processOnboardingSequences() {
  if (onboardingProcessorRunning) {
    console.warn('[Onboarding] Previous run still active — skipping this invocation');
    return;
  }
  onboardingProcessorRunning = true;
  try {
    const now = new Date();
    let processed = 0;

  // Step 2: Send portal guide 2 days after email 1
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const readyForStep2 = await prisma.clientOnboardingEnrollment.findMany({
    where: {
      currentStep: 1,
      email1SentAt: { not: null, lte: twoDaysAgo },
      email2SentAt: null,
      completed: false,
      stoppedAt: null,
    },
    include: {
      lead: {
        include: { assignedTo: { select: { firstName: true, lastName: true, studioName: true, industry: true } } },
      },
    },
  });

  for (const e of readyForStep2) {
    const baseUrl = process.env.FRONTEND_URL || '';
    const portalUrl = `${baseUrl}/portal/${e.lead.portalToken}`;
    const unsubscribeUrl = e.unsubscribeToken ? `${baseUrl}/api/unsubscribe/${e.unsubscribeToken}` : undefined;
    const creativeName = e.lead.assignedTo?.studioName
      || `${e.lead.assignedTo?.firstName || ''} ${e.lead.assignedTo?.lastName || ''}`.trim()
      || 'Your Creative';

    try {
      const sent = await sendClientOnboardingEmail(2, {
        to: e.lead.clientEmail,
        clientName: e.lead.clientName,
        creativeName,
        projectType: e.lead.serviceType || 'Project',
        portalUrl,
        leadId: e.leadId,
        unsubscribeUrl,
        industry: e.lead.assignedTo?.industry,
      });
      if (sent) {
        await prisma.clientOnboardingEnrollment.update({
          where: { id: e.id },
          data: { currentStep: 2, email2SentAt: new Date() },
        });
        processed++;
      }
    } catch (error) {
      console.error('[ONBOARDING] Failed email 2 for lead:', e.leadId, error);
    }
  }

  // Step 3: Send update reminder 7 days after enrollment
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const readyForStep3 = await prisma.clientOnboardingEnrollment.findMany({
    where: {
      currentStep: 2,
      enrolledAt: { lte: sevenDaysAgo },
      email3SentAt: null,
      completed: false,
      stoppedAt: null,
    },
    include: {
      lead: {
        include: { assignedTo: { select: { firstName: true, lastName: true, studioName: true, industry: true } } },
      },
    },
  });

  for (const e of readyForStep3) {
    const baseUrl = process.env.FRONTEND_URL || '';
    const portalUrl = `${baseUrl}/portal/${e.lead.portalToken}`;
    const unsubscribeUrl = e.unsubscribeToken ? `${baseUrl}/api/unsubscribe/${e.unsubscribeToken}` : undefined;
    const creativeName = e.lead.assignedTo?.studioName
      || `${e.lead.assignedTo?.firstName || ''} ${e.lead.assignedTo?.lastName || ''}`.trim()
      || 'Your Creative';

    let daysUntilDeadline: number | undefined;
    if (e.lead.eventDate) {
      daysUntilDeadline = Math.ceil((e.lead.eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline < 0) daysUntilDeadline = undefined;
    }

    try {
      const sent = await sendClientOnboardingEmail(3, {
        to: e.lead.clientEmail,
        clientName: e.lead.clientName,
        creativeName,
        projectType: e.lead.serviceType || 'Project',
        portalUrl,
        daysUntilDeadline,
        leadId: e.leadId,
        unsubscribeUrl,
        industry: e.lead.assignedTo?.industry,
      });
      if (sent) {
        await prisma.clientOnboardingEnrollment.update({
          where: { id: e.id },
          data: { currentStep: 3, email3SentAt: new Date(), completed: true },
        });
        processed++;
      }
    } catch (error) {
      console.error('[ONBOARDING] Failed email 3 for lead:', e.leadId, error);
    }
  }


  } finally {
    onboardingProcessorRunning = false;
  }
}
