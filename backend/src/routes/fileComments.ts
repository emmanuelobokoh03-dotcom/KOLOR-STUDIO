import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logActivity } from './activities';

const router = Router();

/**
 * GET /api/files/:fileId/comments
 */
router.get('/:fileId/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const fileId = req.params.fileId as string;

    // Verify file exists and user owns the lead
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { lead: { select: { assignedToId: true } } },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    if (file.lead.assignedToId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const comments = await prisma.fileComment.findMany({
      where: { fileId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ comments });
  } catch (error) {
    console.error('[FILE COMMENTS] GET error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/files/:fileId/comments
 */
router.post('/:fileId/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const fileId = req.params.fileId as string;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    // Get file + lead + user
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { lead: { select: { assignedToId: true, id: true } } },
    });
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    if (file.lead.assignedToId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } });
    const authorName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown';

    const comment = await prisma.fileComment.create({
      data: {
        fileId,
        userId,
        authorName,
        authorEmail: user?.email,
        authorType: 'USER',
        content: content.trim(),
      },
    });

    // Log activity
    await logActivity(
      file.lead.id,
      userId,
      'FILE_COMMENT',
      `${authorName} commented on ${file.originalName}`,
      { fileId, commentId: comment.id }
    );

    res.status(201).json({ comment });
  } catch (error) {
    console.error('[FILE COMMENTS] POST error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * DELETE /api/files/:fileId/comments/:commentId
 */
router.delete('/:fileId/comments/:commentId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { commentId } = req.params;

    const comment = await prisma.fileComment.findUnique({
      where: { id: commentId as string },
      include: { file: { include: { lead: { select: { assignedToId: true } } } } },
    });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    if (comment.file.lead.assignedToId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await prisma.fileComment.delete({ where: { id: commentId as string } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('[FILE COMMENTS] DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
