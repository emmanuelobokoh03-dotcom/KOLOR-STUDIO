import { PrismaClient } from '@prisma/client';
import { addDays, subDays, differenceInDays, isPast, formatDistanceToNow, startOfMonth, startOfYear, subMonths } from 'date-fns';

const prisma = new PrismaClient();

export const calculateNextFollowUp = (lead: any): Date | null => {
  const now = new Date();
  switch (lead.pipelineStatus) {
    case 'NEW_INQUIRY': return addDays(now, 1);
    case 'CONTACTED': return addDays(now, 3);
    case 'QUOTED': {
      if (!lead.lastContactedAt) return addDays(now, 3);
      const days = differenceInDays(now, new Date(lead.lastContactedAt));
      if (days < 3) return addDays(now, 3);
      if (days < 7) return addDays(now, 4);
      return addDays(now, 7);
    }
    case 'NEGOTIATING': return addDays(now, 3);
    case 'BOOKED':
      return lead.eventDate ? subDays(new Date(lead.eventDate), 2) : null;
    default: return null;
  }
};

export const generateCRMAlerts = async (userId: string) => {
  const leads = await prisma.lead.findMany({
    where: { assignedToId: userId, status: { notIn: ['LOST'] } },
    include: {
      quotes: { orderBy: { createdAt: 'desc' }, take: 1 },
      interactions: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  const alerts: any[] = [];

  for (const lead of leads) {
    // Overdue follow-ups
    if (lead.nextFollowUpAt && isPast(new Date(lead.nextFollowUpAt)) && lead.pipelineStatus !== 'COMPLETED' && lead.pipelineStatus !== 'LOST') {
      alerts.push({
        id: `followup-${lead.id}`,
        priority: 'HIGH',
        type: 'FOLLOW_UP',
        message: `Follow-up overdue by ${formatDistanceToNow(new Date(lead.nextFollowUpAt))}`,
        leadId: lead.id,
        leadName: lead.clientName,
        projectTitle: lead.projectTitle,
        action: 'Follow Up Now',
      });
    }

    // New inquiries without response (> 24h old)
    if (lead.pipelineStatus === 'NEW_INQUIRY' && !lead.lastContactedAt) {
      const hoursSinceCreated = differenceInDays(new Date(), new Date(lead.createdAt));
      if (hoursSinceCreated >= 1) {
        alerts.push({
          id: `new-${lead.id}`,
          priority: 'HIGH',
          type: 'NEW_LEAD',
          message: `New inquiry ${hoursSinceCreated}d ago — respond quickly!`,
          leadId: lead.id,
          leadName: lead.clientName,
          projectTitle: lead.projectTitle,
          action: 'Respond Now',
        });
      }
    }

    // Hot leads (quote sent but not responded to in 3+ days)
    const quote = lead.quotes[0];
    if (quote && quote.status === 'SENT' && quote.sentAt) {
      const daysSinceSent = differenceInDays(new Date(), new Date(quote.sentAt));
      if (daysSinceSent >= 3 && daysSinceSent <= 14) {
        alerts.push({
          id: `hot-${lead.id}`,
          priority: 'MEDIUM',
          type: 'HOT_LEAD',
          message: `Quote sent ${daysSinceSent}d ago — follow up!`,
          leadId: lead.id,
          leadName: lead.clientName,
          projectTitle: lead.projectTitle,
          action: 'Follow Up',
        });
      }
    }

    // Cold leads (no contact in 14+ days)
    if (lead.lastContactedAt && lead.pipelineStatus !== 'BOOKED' && lead.pipelineStatus !== 'COMPLETED' && lead.pipelineStatus !== 'LOST') {
      const daysSince = differenceInDays(new Date(), new Date(lead.lastContactedAt));
      if (daysSince >= 14) {
        alerts.push({
          id: `cold-${lead.id}`,
          priority: 'LOW',
          type: 'COLD_LEAD',
          message: `No contact in ${daysSince} days`,
          leadId: lead.id,
          leadName: lead.clientName,
          projectTitle: lead.projectTitle,
          action: 'Re-engage',
        });
      }
    }
  }

  const weights: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  return alerts.sort((a, b) => (weights[a.priority] || 3) - (weights[b.priority] || 3));
};

export const updatePipelineStatus = async (leadId: string, event: string) => {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  let pipelineStatus = lead.pipelineStatus;
  let nextFollowUp: Date | null = null;

  if (event === 'QUOTE_SENT') {
    pipelineStatus = 'QUOTED';
    nextFollowUp = addDays(new Date(), 3);
  } else if (event === 'QUOTE_ACCEPTED') {
    pipelineStatus = 'BOOKED';
  } else if (event === 'CONTACT_MADE' && lead.pipelineStatus === 'NEW_INQUIRY') {
    pipelineStatus = 'CONTACTED';
    nextFollowUp = addDays(new Date(), 3);
  } else if (event === 'CONTRACT_SIGNED') {
    pipelineStatus = 'BOOKED';
  }

  const updateData: any = { pipelineStatus };
  if (nextFollowUp) updateData.nextFollowUpAt = nextFollowUp;
  if (event === 'CONTACT_MADE') updateData.lastContactedAt = new Date();

  await prisma.lead.update({
    where: { id: leadId },
    data: updateData
  });
};

export const getRevenueStats = async (userId: string) => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const lastMonthStart = subMonths(monthStart, 1);

  const thisMonth = await prisma.income.aggregate({
    where: { userId, status: 'RECEIVED', receivedDate: { gte: monthStart } },
    _sum: { amount: true },
    _count: true
  });

  const lastMonth = await prisma.income.aggregate({
    where: { userId, status: 'RECEIVED', receivedDate: { gte: lastMonthStart, lt: monthStart } },
    _sum: { amount: true }
  });

  const ytd = await prisma.income.aggregate({
    where: { userId, status: 'RECEIVED', receivedDate: { gte: yearStart } },
    _sum: { amount: true }
  });

  const expected = await prisma.income.aggregate({
    where: { userId, status: 'EXPECTED' },
    _sum: { amount: true },
    _count: true
  });

  const monthlyTrend = await getMonthlyTrend(userId, 12);

  const thisMonthAmt = Number(thisMonth._sum.amount || 0);
  const lastMonthAmt = Number(lastMonth._sum.amount || 0);
  const mom = lastMonthAmt > 0
    ? Math.round(((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100)
    : thisMonthAmt > 0 ? 100 : 0;

  return {
    thisMonth: thisMonthAmt,
    thisMonthCount: thisMonth._count,
    monthOverMonth: mom,
    ytd: Number(ytd._sum.amount || 0),
    yearGoal: 60000,
    goalProgress: Math.round((Number(ytd._sum.amount || 0) / 60000) * 100),
    expected: Number(expected._sum.amount || 0),
    expectedCount: expected._count,
    monthlyTrend
  };
};

async function getMonthlyTrend(userId: string, months: number) {
  const trend = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = subMonths(startOfMonth(new Date()), i);
    const end = i === 0 ? new Date() : subMonths(startOfMonth(new Date()), i - 1);

    const result = await prisma.income.aggregate({
      where: {
        userId,
        status: 'RECEIVED',
        receivedDate: { gte: start, lt: end }
      },
      _sum: { amount: true }
    });

    trend.push({
      month: start.toLocaleDateString('en-US', { month: 'short' }),
      amount: Number(result._sum.amount || 0)
    });
  }
  return trend;
}
