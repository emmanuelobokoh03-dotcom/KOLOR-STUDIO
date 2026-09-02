import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/activities/recent - Get recent activities across all user's leads
router.get('/recent', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 15, 50);

    const activities = await prisma.activity.findMany({
      where: {
        lead: { assignedToId: userId },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            projectTitle: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ activities });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch recent activities' });
  }
});

// iter 293-v3.1-v3b W1 — Studio Pulse endpoint.
// GET /api/activities/pulse?days=7
// Returns per-day activity counts for the last N days (default 7) filtered
// to meaningful creator-driven activities (Q1b=b), plus this-week-vs-last
// delta and weekly total. Backed by @@index([userId, createdAt]) on
// Activity — single findMany with server-side bucketing in memory.
router.get('/pulse', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const days = Math.min(Math.max(parseInt((req.query.days as string) || '7', 10) || 7, 1), 30);
    const now = new Date();
    const startOfDay = (d: Date) => {
      const c = new Date(d);
      c.setHours(0, 0, 0, 0);
      return c;
    };
    const today = startOfDay(now);
    // Window covers current-week + previous-week (2x days) so we can compute
    // week-over-week delta in the same scan.
    const rangeStart = new Date(today.getTime() - (days * 2 - 1) * 86400000);

    // Q1b=b — Meaningful creator-driven activities (exclude PORTAL_VIEWED
    // which is a client-triggered event, not studio work).
    const MEANINGFUL_TYPES = [
      'STATUS_CHANGED',
      'NOTE_ADDED',
      'EMAIL_SENT',
      'PHONE_CALL',
      'MEETING_SCHEDULED',
      'FILE_UPLOADED',
      'PROPOSAL_SENT',
      'CONTRACT_SIGNED',
      'PAYMENT_RECEIVED',
      'MESSAGE_SENT',
      'FILE_DELETED',
      'QUOTE_CREATED',
      'QUOTE_SENT',
      'QUOTE_ACCEPTED',
      'BOOKING_CREATED',
    ] as any;

    const rows = await prisma.activity.findMany({
      where: {
        userId,
        type: { in: MEANINGFUL_TYPES },
        createdAt: { gte: rangeStart, lte: now },
      },
      select: { createdAt: true },
    });

    // Bucket by day (last N days = "this week"; days before that = "last week").
    const buckets = new Map<string, number>();
    for (const row of rows) {
      const key = startOfDay(row.createdAt).toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days: { date: string; dayLabel: string; dayName: string; count: number }[] = [];
    let weeklyTotal = 0;
    let previousWeekTotal = 0;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const count = buckets.get(key) || 0;
      weeklyTotal += count;
      last7Days.push({
        date: key,
        dayLabel: DAY_LABELS[d.getDay()],
        dayName: DAY_NAMES[d.getDay()],
        count,
      });
    }
    for (let i = days * 2 - 1; i >= days; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      previousWeekTotal += buckets.get(key) || 0;
    }

    const thisWeekVsLast =
      previousWeekTotal > 0
        ? (weeklyTotal - previousWeekTotal) / previousWeekTotal
        : weeklyTotal > 0
        ? 1
        : 0;

    res.json({
      last7Days,
      weeklyTotal,
      previousWeekTotal,
      thisWeekVsLast,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Get activity pulse error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch activity pulse' });
  }
});

export default router;
