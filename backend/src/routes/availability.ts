import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/availability - Get all availability slots for authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const slots = await prisma.availabilitySchedule.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json({ availability: slots });
  } catch (error) {
    console.error('[Availability] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// PUT /api/availability - Replace all availability (bulk save)
router.put('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { slots } = req.body;

    if (!Array.isArray(slots)) {
      res.status(400).json({ error: 'slots must be an array' });
      return;
    }

    // Validate slots
    for (const slot of slots) {
      if (slot.dayOfWeek === undefined || !slot.startTime || !slot.endTime) {
        res.status(400).json({ error: 'Each slot must have dayOfWeek, startTime, endTime' });
        return;
      }
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        res.status(400).json({ error: 'dayOfWeek must be 0-6' });
        return;
      }
      // Validate time format (HH:mm)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        res.status(400).json({ error: 'Times must be in HH:mm format' });
        return;
      }
      if (slot.startTime >= slot.endTime) {
        res.status(400).json({ error: 'startTime must be before endTime' });
        return;
      }
    }

    // Delete all existing then create new ones (atomic replace)
    await prisma.$transaction([
      prisma.availabilitySchedule.deleteMany({ where: { userId } }),
      ...slots.map((slot: { dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean }) =>
        prisma.availabilitySchedule.create({
          data: {
            userId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive !== false,
          },
        })
      ),
    ]);

    const availability = await prisma.availabilitySchedule.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ message: 'Availability updated', availability });
  } catch (error) {
    console.error('[Availability] Update error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

export default router;
