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

export default router;
