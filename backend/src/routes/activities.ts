import { Router, Response } from 'express';
import { ActivityType } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
import prisma from '../lib/prisma';

// GET /api/leads/:leadId/activities - Get activity timeline for a lead
router.get('/:leadId/activities', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.leadId as string;

    // Verify lead ownership
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, OR: [{ assignedToId: userId }, { assignedToId: null }] }
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    // Get activities with user info
    const activities = await prisma.activity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    res.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch activities' });
  }
});

// POST /api/leads/:leadId/notes - Add a note to a lead
router.post('/:leadId/notes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.leadId as string;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Validation Error', message: 'Note content is required' });
      return;
    }

    // Verify lead ownership
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, OR: [{ assignedToId: userId }, { assignedToId: null }] }
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    // Create activity for the note
    const activity = await prisma.activity.create({
      data: {
        type: 'NOTE_ADDED',
        description: content.trim(),
        leadId,
        userId,
        metadata: {
          noteType: 'manual',
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    res.status(201).json({ message: 'Note added successfully', activity });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to add note' });
  }
});

export default router;

// Helper function to log activities (to be used by other routes)
export async function logActivity(
  leadId: string,
  userId: string | null,
  type: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        type,
        description,
        leadId,
        userId,
        metadata: metadata ? metadata : undefined,
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
