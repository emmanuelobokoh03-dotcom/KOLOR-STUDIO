// Community Digest routes (iter 286)
// Toggle digest preference. Track opens/clicks (via signed link — future iter 291).

import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Toggle weekly digest for current user
router.patch('/preference', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled (boolean) required' });
      return;
    }
    const profile = await prisma.communityProfile.findUnique({
      where: { userId: req.userId! },
      select: { id: true },
    });
    if (!profile) {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    const updated = await prisma.communityProfile.update({
      where: { id: profile.id },
      data: { weeklyDigestEnabled: enabled },
    });
    res.json({
      profile: {
        id: updated.id,
        weeklyDigestEnabled: updated.weeklyDigestEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

// Get current preference
router.get('/preference', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.communityProfile.findUnique({
      where: { userId: req.userId! },
      select: { weeklyDigestEnabled: true },
    });
    if (!profile) {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.json({ weeklyDigestEnabled: profile.weeklyDigestEnabled });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
});

// Get last N digest sends for current user (for their history / debugging)
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.communityProfile.findUnique({
      where: { userId: req.userId! },
      select: { id: true },
    });
    if (!profile) {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    const history = await prisma.digestSend.findMany({
      where: { profileId: profile.id },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
