import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/meeting-types - Get all meeting types for authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const meetingTypes = await prisma.meetingType.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
    res.json({ meetingTypes });
  } catch (error) {
    console.error('[MeetingTypes] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch meeting types' });
  }
});

// POST /api/meeting-types - Create a meeting type
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { name, description, duration, color, location, bufferBefore, bufferAfter, maxPerDay } = req.body;

    if (!name || !duration) {
      res.status(400).json({ error: 'Name and duration are required' });
      return;
    }

    const count = await prisma.meetingType.count({ where: { userId } });

    const meetingType = await prisma.meetingType.create({
      data: {
        userId,
        name,
        description: description || null,
        duration: Number(duration),
        color: color || '#A855F7',
        location: location || null,
        bufferBefore: Number(bufferBefore) || 0,
        bufferAfter: Number(bufferAfter) || 15,
        maxPerDay: maxPerDay ? Number(maxPerDay) : null,
        order: count,
      },
    });

    res.status(201).json({ message: 'Meeting type created', meetingType });
  } catch (error) {
    console.error('[MeetingTypes] Create error:', error);
    res.status(500).json({ error: 'Failed to create meeting type' });
  }
});

// PUT /api/meeting-types/:id - Update a meeting type
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const { name, description, duration, color, location, isActive, bufferBefore, bufferAfter, maxPerDay, order } = req.body;

    const existing = await prisma.meetingType.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Meeting type not found' });
      return;
    }

    const meetingType = await prisma.meetingType.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(color !== undefined && { color }),
        ...(location !== undefined && { location }),
        ...(isActive !== undefined && { isActive }),
        ...(bufferBefore !== undefined && { bufferBefore: Number(bufferBefore) }),
        ...(bufferAfter !== undefined && { bufferAfter: Number(bufferAfter) }),
        ...(maxPerDay !== undefined && { maxPerDay: maxPerDay ? Number(maxPerDay) : null }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    res.json({ message: 'Meeting type updated', meetingType });
  } catch (error) {
    console.error('[MeetingTypes] Update error:', error);
    res.status(500).json({ error: 'Failed to update meeting type' });
  }
});

// DELETE /api/meeting-types/:id - Delete a meeting type
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const existing = await prisma.meetingType.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Meeting type not found' });
      return;
    }

    await prisma.meetingType.delete({ where: { id } });
    res.json({ message: 'Meeting type deleted' });
  } catch (error) {
    console.error('[MeetingTypes] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete meeting type' });
  }
});

export default router;
