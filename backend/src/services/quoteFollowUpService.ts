import prisma from '../lib/prisma';
import { sendQuoteFollowUpEmail } from './email';

export async function enrollInQuoteFollowUp(quoteId: string) {

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { lead: { include: { assignedTo: true } } },
  });

  if (!quote) {
    console.error('[QUOTE FOLLOWUP] Quote not found:', quoteId);
    return null;
  }

  // Only enroll if quote is in SENT status
  if (quote.status !== 'SENT') {
    return null;
  }

  // Check if already enrolled
  const existing = await prisma.quoteFollowUpEnrollment.findUnique({ where: { quoteId } });
  if (existing) {
    return existing;
  }

  const enrollment = await prisma.quoteFollowUpEnrollment.create({
    data: { quoteId, currentStep: 0 },
  });

  return enrollment;
}

export async function stopQuoteFollowUp(
  quoteId: string,
  reason: 'quote_accepted' | 'client_responded' | 'quote_declined' | 'manual_stop' | 'completed'
) {
  const enrollment = await prisma.quoteFollowUpEnrollment.findUnique({ where: { quoteId } });
  if (!enrollment || enrollment.completed) return null;

  await prisma.quoteFollowUpEnrollment.update({
    where: { quoteId },
    data: { completed: true, stoppedAt: new Date(), stopReason: reason },
  });

  return enrollment;
}

let quoteFollowUpProcessorRunning = false;

export async function processQuoteFollowUpSequences() {
  if (quoteFollowUpProcessorRunning) {
    console.warn('[QuoteFollowUp] Previous run still active — skipping this invocation');
    return;
  }
  quoteFollowUpProcessorRunning = true;
  try {
    const now = new Date();
    let processed = 0;

  // Step 1: 3 days after enrollment, quote still SENT
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const readyForStep1 = await prisma.quoteFollowUpEnrollment.findMany({
    where: {
      currentStep: 0,
      enrolledAt: { lte: threeDaysAgo },
      email1SentAt: null,
      completed: false,
      quote: { status: 'SENT' },
    },
    include: {
      quote: {
        include: {
          lead: { include: { assignedTo: { select: { firstName: true, lastName: true, studioName: true } } } },
        },
      },
    },
  });

  for (const e of readyForStep1) {
    const { quote } = e;
    const baseUrl = process.env.FRONTEND_URL || '';
    const portalUrl = `${baseUrl}/portal/${quote.lead.portalToken}`;
    const unsubscribeUrl = e.unsubscribeToken ? `${baseUrl}/api/unsubscribe/${e.unsubscribeToken}` : undefined;
    const creativeName = quote.lead.assignedTo?.studioName
      || `${quote.lead.assignedTo?.firstName || ''} ${quote.lead.assignedTo?.lastName || ''}`.trim()
      || 'Your Creative';

    try {
      const sent = await sendQuoteFollowUpEmail(1, {
        to: quote.lead.clientEmail,
        clientName: quote.lead.clientName,
        creativeName,
        projectType: quote.lead.serviceType || quote.lead.projectTitle || 'Project',
        quoteAmount: quote.total,
        currencySymbol: quote.currencySymbol || '$',
        portalUrl,
        leadId: quote.leadId,
        unsubscribeUrl,
      });
      if (sent) {
        await prisma.quoteFollowUpEnrollment.update({
          where: { id: e.id },
          data: { currentStep: 1, email1SentAt: new Date() },
        });
        processed++;
      }
    } catch (err) {
      console.error('[QUOTE FOLLOWUP] Email 1 failed:', err);
    }
  }

  // Step 2: 4 days after email 1 (7 days total), quote still SENT
  const fourDaysAfterEmail1 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const readyForStep2 = await prisma.quoteFollowUpEnrollment.findMany({
    where: {
      currentStep: 1,
      email1SentAt: { not: null, lte: fourDaysAfterEmail1 },
      email2SentAt: null,
      completed: false,
      quote: { status: 'SENT' },
    },
    include: {
      quote: {
        include: {
          lead: { include: { assignedTo: { select: { firstName: true, lastName: true, studioName: true } } } },
        },
      },
    },
  });

  for (const e of readyForStep2) {
    const { quote } = e;
    const baseUrl = process.env.FRONTEND_URL || '';
    const portalUrl = `${baseUrl}/portal/${quote.lead.portalToken}`;
    const unsubscribeUrl = e.unsubscribeToken ? `${baseUrl}/api/unsubscribe/${e.unsubscribeToken}` : undefined;
    const creativeName = quote.lead.assignedTo?.studioName
      || `${quote.lead.assignedTo?.firstName || ''} ${quote.lead.assignedTo?.lastName || ''}`.trim()
      || 'Your Creative';

    try {
      const sent = await sendQuoteFollowUpEmail(2, {
        to: quote.lead.clientEmail,
        clientName: quote.lead.clientName,
        creativeName,
        projectType: quote.lead.serviceType || quote.lead.projectTitle || 'Project',
        quoteAmount: quote.total,
        currencySymbol: quote.currencySymbol || '$',
        portalUrl,
        leadId: quote.leadId,
        unsubscribeUrl,
      });
      if (sent) {
        await prisma.quoteFollowUpEnrollment.update({
          where: { id: e.id },
          data: { currentStep: 2, email2SentAt: new Date() },
        });
        processed++;
      }
    } catch (err) {
      console.error('[QUOTE FOLLOWUP] Email 2 failed:', err);
    }
  }

  // Step 3: 3 days after email 2 (10 days total), quote still SENT
  const threeDaysAfterEmail2 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const readyForStep3 = await prisma.quoteFollowUpEnrollment.findMany({
    where: {
      currentStep: 2,
      email2SentAt: { not: null, lte: threeDaysAfterEmail2 },
      email3SentAt: null,
      completed: false,
      quote: { status: 'SENT' },
    },
    include: {
      quote: {
        include: {
          lead: { include: { assignedTo: { select: { firstName: true, lastName: true, studioName: true } } } },
        },
      },
    },
  });

  for (const e of readyForStep3) {
    const { quote } = e;
    const baseUrl = process.env.FRONTEND_URL || '';
    const portalUrl = `${baseUrl}/portal/${quote.lead.portalToken}`;
    const unsubscribeUrl = e.unsubscribeToken ? `${baseUrl}/api/unsubscribe/${e.unsubscribeToken}` : undefined;
    const creativeName = quote.lead.assignedTo?.studioName
      || `${quote.lead.assignedTo?.firstName || ''} ${quote.lead.assignedTo?.lastName || ''}`.trim()
      || 'Your Creative';

    // Calculate days until expiry
    const daysUntilExpiry = Math.max(0, Math.ceil((quote.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    try {
      const sent = await sendQuoteFollowUpEmail(3, {
        to: quote.lead.clientEmail,
        clientName: quote.lead.clientName,
        creativeName,
        projectType: quote.lead.serviceType || quote.lead.projectTitle || 'Project',
        quoteAmount: quote.total,
        currencySymbol: quote.currencySymbol || '$',
        portalUrl,
        expirationDays: daysUntilExpiry,
        leadId: quote.leadId,
        unsubscribeUrl,
      });
      if (sent) {
        await prisma.quoteFollowUpEnrollment.update({
          where: { id: e.id },
          data: { currentStep: 3, email3SentAt: new Date(), completed: true, stopReason: 'completed' },
        });
        processed++;
      }
    } catch (err) {
      console.error('[QUOTE FOLLOWUP] Email 3 failed:', err);
    }
  }


  } finally {
    quoteFollowUpProcessorRunning = false;
  }
}
