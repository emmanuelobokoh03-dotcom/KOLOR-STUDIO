import cron from 'node-cron';
import prisma from './lib/prisma';
import {
  sendLeadStaleNudge,
  sendQuoteViewedNudge,
  sendContractUnsignedWarning,
  sendWeeklyPipelineReport,
  sendQuoteExpiryWarning,
  sendQuoteExpiryNoticeToClient,
  sendPaymentNudge,
} from './services/email';

export function startScheduler(): void {
  // ── DAILY at 9am UTC ──
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Running daily checks...');
    await runStaleLeadNudges();
    await runQuoteViewedNudges();
    await runContractUnsignedWarnings();
    await runContractUnsignedFinalWarning();
    await runPaymentNudges();
    await runQuoteExpiryWarnings();
  });

  // ── MONDAY 8am UTC (weekly report) ──
  cron.schedule('0 8 * * 1', async () => {
    console.log('[Scheduler] Sending weekly pipeline reports...');
    await runWeeklyPipelineReports();
  });

  console.log('[Scheduler] Started — daily 9am UTC + Monday 8am UTC');
}

// ── JOB FUNCTIONS ──

async function runStaleLeadNudges(): Promise<void> {
  try {
    // Tier 1: 7-day stale leads
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const eightDaysAgo = new Date(Date.now() - 8 * 86400000);
    const tier1Leads = await prisma.lead.findMany({
      where: {
        updatedAt: { gte: eightDaysAgo, lt: sevenDaysAgo },
        status: { notIn: ['BOOKED', 'LOST'] },
        OR: [
          { lastContactedAt: null },
          { lastContactedAt: { lt: new Date(Date.now() - 6 * 3600000) } },
        ],
      },
      include: { assignedTo: true },
    });

    for (const lead of tier1Leads) {
      if (!lead.assignedTo || !(lead.assignedTo as any).staleLeadEmailEnabled) continue;
      const daysSinceUpdate = Math.floor((Date.now() - lead.updatedAt.getTime()) / 86400000);
      const sent = await sendLeadStaleNudge(
        { email: lead.assignedTo.email, firstName: lead.assignedTo.firstName },
        { id: lead.id, clientName: lead.clientName, status: lead.status },
        daysSinceUpdate
      );
      if (sent) {
        prisma.lead.update({
          where: { id: lead.id },
          data: { lastContactedAt: new Date() },
        }).catch(e => console.error(`[Scheduler] lastContactedAt stamp failed for ${lead.id}:`, e));
      }
    }
    console.log(`[Scheduler] Stale lead nudges (7-day): ${tier1Leads.length} checked`);

    // Tier 2: 14-day stale leads (more urgent tone)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
    const fifteenDaysAgo = new Date(Date.now() - 15 * 86400000);
    const tier2Leads = await prisma.lead.findMany({
      where: {
        updatedAt: { gte: fifteenDaysAgo, lt: fourteenDaysAgo },
        status: { notIn: ['BOOKED', 'LOST'] },
        OR: [
          { lastContactedAt: null },
          { lastContactedAt: { lt: new Date(Date.now() - 6 * 3600000) } },
        ],
      },
      include: { assignedTo: true },
    });

    for (const lead of tier2Leads) {
      if (!lead.assignedTo || !(lead.assignedTo as any).staleLeadEmailEnabled) continue;
      const daysSinceUpdate = Math.floor((Date.now() - lead.updatedAt.getTime()) / 86400000);
      const sent = await sendLeadStaleNudge(
        { email: lead.assignedTo.email, firstName: lead.assignedTo.firstName },
        { id: lead.id, clientName: lead.clientName, status: lead.status },
        daysSinceUpdate
      );
      if (sent) {
        prisma.lead.update({
          where: { id: lead.id },
          data: { lastContactedAt: new Date() },
        }).catch(e => console.error(`[Scheduler] lastContactedAt stamp failed for ${lead.id}:`, e));
      }
    }
    console.log(`[Scheduler] Stale lead nudges (14-day): ${tier2Leads.length} checked`);
  } catch (err) {
    console.error('[Scheduler] staleLeadNudges error:', err);
  }
}

async function runQuoteViewedNudges(): Promise<void> {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 3600000);
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 3600000);
    const quotes = await prisma.quote.findMany({
      where: {
        viewedAt: { gte: seventyTwoHoursAgo, lt: fortyEightHoursAgo },
        status: { in: ['SENT', 'VIEWED'] },
      },
      include: { lead: { include: { assignedTo: true } } },
    });

    for (const quote of quotes) {
      if (!quote.lead?.assignedTo || !(quote.lead.assignedTo as any).quoteNudgeEmailEnabled) continue;
      await sendQuoteViewedNudge(
        { email: quote.lead.assignedTo.email, firstName: quote.lead.assignedTo.firstName, industry: quote.lead.assignedTo.primaryIndustry },
        { id: quote.id, total: quote.total ?? undefined, viewedAt: quote.viewedAt, validUntil: quote.validUntil },
        { clientName: quote.lead.clientName }
      );
    }
    console.log(`[Scheduler] Quote viewed nudges: ${quotes.length} checked`);
  } catch (err) {
    console.error('[Scheduler] quoteViewedNudges error:', err);
  }
}

async function runContractUnsignedWarnings(): Promise<void> {
  try {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 3600000);
    const ninetyFiveHoursAgo = new Date(Date.now() - 95 * 3600000);
    const contracts = await prisma.contract.findMany({
      where: {
        sentAt: { gte: ninetyFiveHoursAgo, lt: seventyTwoHoursAgo },
        clientAgreed: false,
        status: { in: ['SENT', 'VIEWED'] },
      },
      include: { lead: { include: { assignedTo: true } } },
    });

    for (const contract of contracts) {
      if (!contract.lead?.assignedTo) continue;
      try {
        await sendContractUnsignedWarning(
          { email: contract.lead.assignedTo.email, firstName: contract.lead.assignedTo.firstName, industry: contract.lead.assignedTo.primaryIndustry },
          { id: contract.id, sentAt: contract.sentAt },
          { clientName: contract.lead.clientName }
        );
      } catch (emailErr) {
        console.error(`[Scheduler] contractWarning email failed for contract ${contract.id}:`, emailErr);
      }
    }
    console.log(`[Scheduler] Contract unsigned warnings: ${contracts.length} checked`);
  } catch (err) {
    console.error('[Scheduler] contractUnsignedWarnings error:', err);
  }
}

async function runContractUnsignedFinalWarning(): Promise<void> {
  try {
    const oneHundredSixtyEightHoursAgo = new Date(Date.now() - 168 * 3600000);
    const oneHundredNinetyOneHoursAgo = new Date(Date.now() - 191 * 3600000);
    const contracts = await prisma.contract.findMany({
      where: {
        sentAt: { gte: oneHundredNinetyOneHoursAgo, lt: oneHundredSixtyEightHoursAgo },
        clientAgreed: false,
        status: { in: ['SENT', 'VIEWED'] },
      },
      include: { lead: { include: { assignedTo: true } } },
    });

    for (const contract of contracts) {
      if (!contract.lead?.assignedTo) continue;
      try {
        await sendContractUnsignedWarning(
          {
            email: contract.lead.assignedTo.email,
            firstName: contract.lead.assignedTo.firstName,
            industry: contract.lead.assignedTo.primaryIndustry,
          },
          { id: contract.id, sentAt: contract.sentAt },
          { clientName: contract.lead.clientName }
        );
      } catch (emailErr) {
        console.error(`[Scheduler] contractFinalWarning email failed for contract ${contract.id}:`, emailErr);
      }
    }
    console.log(`[Scheduler] Contract unsigned final warnings (Day 7): ${contracts.length} checked`);
  } catch (err) {
    console.error('[Scheduler] contractUnsignedFinalWarning error:', err);
  }
}

async function runPaymentNudges(): Promise<void> {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 3600000);
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 3600000);

    const contracts = await prisma.contract.findMany({
      where: {
        clientAgreed: true,
        clientAgreedAt: { gte: seventyTwoHoursAgo, lt: fortyEightHoursAgo },
        status: 'AGREED',
      },
      include: {
        lead: {
          include: { assignedTo: true },
        },
      },
    });

    for (const contract of contracts) {
      if (!contract.lead?.assignedTo) continue;
      const user = contract.lead.assignedTo;
      try {
        await sendPaymentNudge(
          { email: user.email, firstName: user.firstName, industry: user.primaryIndustry },
          { id: contract.id, clientName: contract.lead.clientName, clientAgreedAt: contract.clientAgreedAt }
        );
      } catch (emailErr) {
        console.error(`[Scheduler] paymentNudge email failed for contract ${contract.id}:`, emailErr);
      }
    }
    console.log(`[Scheduler] Payment nudges (48h): ${contracts.length} contracts checked`);
  } catch (err) {
    console.error('[Scheduler] runPaymentNudges error:', err);
  }
}

async function runQuoteExpiryWarnings(): Promise<void> {
  try {
    const threeDaysFromNow = new Date(Date.now() + 3 * 86400000);
    const fourDaysFromNow = new Date(Date.now() + 4 * 86400000);
    const quotes = await prisma.quote.findMany({
      where: {
        validUntil: { gte: threeDaysFromNow, lt: fourDaysFromNow },
        status: { in: ['SENT', 'VIEWED'] },
      },
      include: { lead: { include: { assignedTo: true } } },
    });

    for (const quote of quotes) {
      if (!quote.lead?.assignedTo) continue;
      const user = quote.lead.assignedTo;
      // Warn photographer
      await sendQuoteExpiryWarning(
        { email: user.email, industry: user.primaryIndustry },
        { total: quote.total ?? undefined, validUntil: quote.validUntil },
        { clientName: quote.lead.clientName }
      );
      // Warn client
      await sendQuoteExpiryNoticeToClient(
        { email: user.email, businessName: user.businessName, industry: user.primaryIndustry },
        { total: quote.total ?? undefined, validUntil: quote.validUntil },
        { clientName: quote.lead.clientName, clientEmail: quote.lead.clientEmail, portalToken: quote.lead.portalToken }
      );
    }
    console.log(`[Scheduler] Quote expiry warnings: ${quotes.length} checked`);
  } catch (err) {
    console.error('[Scheduler] quoteExpiryWarnings error:', err);
  }
}

export async function runWeeklyPipelineReports(): Promise<void> {
  try {
    // Iter 144 — opt-out default: include users who haven't explicitly disabled it (null or true).
    const users = await prisma.user.findMany({
      where: { weeklyReportEnabled: { not: false } },
    });
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000);

    for (const user of users) {
      try {
        const [newLeads, quotesSent, approvedCount, totalSentQuotes, staleLeads] = await Promise.all([
          prisma.lead.count({ where: { assignedToId: user.id, createdAt: { gte: oneWeekAgo } } }),
          prisma.quote.count({ where: { lead: { assignedToId: user.id }, createdAt: { gte: oneWeekAgo } } }),
          prisma.quote.count({ where: { lead: { assignedToId: user.id }, status: 'ACCEPTED' } }),
          prisma.quote.count({ where: { lead: { assignedToId: user.id }, status: { notIn: ['DRAFT'] } } }),
          prisma.lead.findMany({
            where: {
              assignedToId: user.id,
              updatedAt: { lt: oneWeekAgo },
              status: { notIn: ['BOOKED', 'LOST'] },
            },
            take: 3,
          }),
        ]);

        // Get revenue from contracts signed this week
        const signedContracts = await prisma.contract.findMany({
          where: { lead: { assignedToId: user.id }, clientAgreedAt: { gte: oneWeekAgo } },
          include: { lead: { include: { quotes: { where: { status: 'ACCEPTED' }, take: 1 } } } },
        });
        const revenue = signedContracts.reduce((sum, c) => {
          const q = c.lead?.quotes?.[0];
          return sum + (q?.total ?? 0);
        }, 0);
        const acceptanceRate = totalSentQuotes > 0 ? Math.round((approvedCount / totalSentQuotes) * 100) : 0;

        await sendWeeklyPipelineReport(
          { email: user.email, firstName: user.firstName, id: user.id },
          { newLeads, quotesSent, revenue, acceptanceRate, staleLeads, weekStartDate: oneWeekAgo }
        );
      } catch (userErr) {
        console.error(`[Scheduler] weeklyReport failed for user ${user.id}:`, userErr);
      }
      // Iter 152 — 100ms breathing room between users prevents DB connection burst at 50+ users
      await new Promise(r => setTimeout(r, 100));
    }
    console.log(`[Scheduler] Weekly reports sent to ${users.length} users`);
  } catch (err) {
    console.error('[Scheduler] weeklyPipelineReports error:', err);
  }
}
