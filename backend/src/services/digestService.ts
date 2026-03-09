import prisma from '../lib/prisma';

export interface DigestData {
  userId: string;
  userName: string;
  userEmail: string;
  studioName: string;
  period: { start: Date; end: Date };
  stats: {
    newLeads: number;
    quoteSent: number;
    quotesAccepted: number;
    contractsSigned: number;
    depositsReceived: number;
    totalRevenue: number;
    currencySymbol: string;
  };
  nextActions: Array<{ label: string; count: number }>;
  topClients: Array<{ name: string; value: number }>;
  hasActivity: boolean;
}

export async function generateDigestForUser(userId: string): Promise<DigestData | null> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      studioName: true,
      currencySymbol: true,
    },
  });

  if (!user) return null;

  // New leads this week
  const newLeads = await prisma.lead.count({
    where: { assignedToId: userId, createdAt: { gte: oneWeekAgo } },
  });

  // Quotes sent this week
  const quotesSent = await prisma.quote.count({
    where: { createdById: userId, sentAt: { gte: oneWeekAgo } },
  });

  // Quotes accepted this week
  const quotesAccepted = await prisma.quote.count({
    where: { createdById: userId, status: 'ACCEPTED', acceptedAt: { gte: oneWeekAgo } },
  });

  // Contracts signed this week
  const contractsSigned = await prisma.contract.count({
    where: {
      lead: { assignedToId: userId },
      status: 'AGREED',
      clientAgreedAt: { gte: oneWeekAgo },
    },
  });

  // Income/deposits this week
  const deposits = await prisma.income.findMany({
    where: {
      userId,
      depositPaid: true,
      updatedAt: { gte: oneWeekAgo },
    },
    select: { amount: true },
  });
  const depositCount = deposits.length;
  const totalRevenue = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Leads needing follow-up (no activity in 3+ days, not booked/lost)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const stalledLeads = await prisma.lead.count({
    where: {
      assignedToId: userId,
      status: { notIn: ['BOOKED', 'LOST'] },
      updatedAt: { lt: threeDaysAgo },
    },
  });

  // Unsent quotes (draft)
  const draftQuotes = await prisma.quote.count({
    where: { createdById: userId, status: 'DRAFT' },
  });

  // Unsigned contracts
  const unsignedContracts = await prisma.contract.count({
    where: {
      lead: { assignedToId: userId },
      status: 'SENT',
    },
  });

  // Top clients by value this week
  const recentQuotes = await prisma.quote.findMany({
    where: {
      createdById: userId,
      status: { in: ['ACCEPTED', 'SENT', 'VIEWED'] },
      createdAt: { gte: oneWeekAgo },
    },
    select: {
      total: true,
      lead: { select: { clientName: true } },
    },
    orderBy: { total: 'desc' },
    take: 3,
  });

  const topClients = recentQuotes.map(q => ({
    name: q.lead.clientName,
    value: Number(q.total) || 0,
  }));

  const nextActions: Array<{ label: string; count: number }> = [];
  if (stalledLeads > 0) nextActions.push({ label: 'Leads need follow-up', count: stalledLeads });
  if (draftQuotes > 0) nextActions.push({ label: 'Draft quotes to send', count: draftQuotes });
  if (unsignedContracts > 0) nextActions.push({ label: 'Contracts awaiting signature', count: unsignedContracts });

  const hasActivity = newLeads > 0 || quotesSent > 0 || quotesAccepted > 0 || contractsSigned > 0 || depositCount > 0;

  return {
    userId: user.id,
    userName: user.firstName,
    userEmail: user.email,
    studioName: user.studioName || `${user.firstName}'s Studio`,
    period: { start: oneWeekAgo, end: now },
    stats: {
      newLeads,
      quoteSent: quotesSent,
      quotesAccepted,
      contractsSigned,
      depositsReceived: depositCount,
      totalRevenue,
      currencySymbol: user.currencySymbol || '$',
    },
    nextActions,
    topClients,
    hasActivity,
  };
}

export async function getAllUsersForDigest(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  return users.map(u => u.id);
}
