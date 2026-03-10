import prisma from '../lib/prisma';
import { sendClientOnboardingEmail } from './email';

export async function enrollInOnboarding(leadId: string) {
  console.log('[ONBOARDING] Enrolling lead:', leadId);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: { select: { firstName: true, lastName: true, studioName: true } },
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
    console.log('[ONBOARDING] Already enrolled:', leadId);
    return existing;
  }

  // Create enrollment
  const enrollment = await prisma.clientOnboardingEnrollment.create({
    data: { leadId, currentStep: 1 },
  });

  // Send first email immediately
  const baseUrl = process.env.FRONTEND_URL || process.env.VITE_API_URL?.replace('/api', '') || '';
  const portalUrl = `${baseUrl}/portal/${lead.portalToken}`;
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
    });

    if (sent) {
      await prisma.clientOnboardingEnrollment.update({
        where: { id: enrollment.id },
        data: { email1SentAt: new Date() },
      });
      console.log('[ONBOARDING] Email 1 sent for lead:', leadId);
    }
  } catch (error) {
    console.error('[ONBOARDING] Failed to send email 1:', error);
  }

  return enrollment;
}

export async function processOnboardingSequences() {
  console.log('[ONBOARDING] Processing sequences...');
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
        include: { assignedTo: { select: { firstName: true, lastName: true, studioName: true } } },
      },
    },
  });

  for (const e of readyForStep2) {
    const baseUrl = process.env.FRONTEND_URL || '';
    const portalUrl = `${baseUrl}/portal/${e.lead.portalToken}`;
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
      });
      if (sent) {
        await prisma.clientOnboardingEnrollment.update({
          where: { id: e.id },
          data: { currentStep: 2, email2SentAt: new Date() },
        });
        processed++;
        console.log('[ONBOARDING] Email 2 sent for lead:', e.leadId);
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
        include: { assignedTo: { select: { firstName: true, lastName: true, studioName: true } } },
      },
    },
  });

  for (const e of readyForStep3) {
    const baseUrl = process.env.FRONTEND_URL || '';
    const portalUrl = `${baseUrl}/portal/${e.lead.portalToken}`;
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
      });
      if (sent) {
        await prisma.clientOnboardingEnrollment.update({
          where: { id: e.id },
          data: { currentStep: 3, email3SentAt: new Date(), completed: true },
        });
        processed++;
        console.log('[ONBOARDING] Email 3 sent (complete) for lead:', e.leadId);
      }
    } catch (error) {
      console.error('[ONBOARDING] Failed email 3 for lead:', e.leadId, error);
    }
  }

  console.log(`[ONBOARDING] Processed ${processed} emails (${readyForStep2.length} step2, ${readyForStep3.length} step3)`);
}
