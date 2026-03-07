import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

import prisma from '../lib/prisma';
const router = Router();

// GET /api/leads/:leadId/messages - Get all messages for a lead (authenticated)
router.get('/:leadId/messages', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.leadId as string;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { assignedToId: true },
    });

    if (!lead || (lead.assignedToId && lead.assignedToId !== userId)) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { leadId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        from: m.isFromClient ? 'CLIENT' : 'CREATIVE',
        read: m.isRead,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch messages' });
  }
});

// POST /api/leads/:leadId/messages - Send message as creative (authenticated)
router.post('/:leadId/messages', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.leadId as string;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { assignedToId: true },
    });

    if (!lead || (lead.assignedToId && lead.assignedToId !== userId)) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        leadId,
        content: content.trim(),
        isFromClient: false,
        isRead: true,
        senderId: userId,
      },
    });

    res.json({
      message: {
        id: message.id,
        content: message.content,
        from: 'CREATIVE',
        read: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to send message' });
  }
});

// PATCH /api/leads/:leadId/messages/read - Mark all client messages as read
router.patch('/:leadId/messages/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.leadId as string;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { assignedToId: true },
    });

    if (!lead || (lead.assignedToId && lead.assignedToId !== userId)) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    await prisma.message.updateMany({
      where: { leadId, isFromClient: true, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to mark messages as read' });
  }
});

// GET /api/leads/unread-counts - Get unread message counts for all leads
router.get('/unread-counts/all', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;

    const counts = await prisma.message.groupBy({
      by: ['leadId'],
      where: {
        isFromClient: true,
        isRead: false,
        lead: {
          assignedToId: userId,
        },
      },
      _count: { id: true },
    });

    const unreadCounts: Record<string, number> = {};
    counts.forEach(c => { unreadCounts[c.leadId] = c._count.id; });

    res.json({ unreadCounts });
  } catch (error) {
    console.error('Unread counts error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch unread counts' });
  }
});

export default router;
