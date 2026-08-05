// Peer Suggestion + Peer Recommendation routes (iter 286)

import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

async function getProfileIdOrThrow(userId: string): Promise<string> {
  const profile = await prisma.communityProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error('NO_COMMUNITY_PROFILE');
  return profile.id;
}

// My peer suggestions (top 6 undismissed, ordered by score)
router.get('/suggestions/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const suggestions = await prisma.peerSuggestion.findMany({
      where: { fromProfileId: profileId, dismissedAt: null },
      include: {
        toProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, primaryIndustry: true, industry: true } },
          },
        },
      },
      orderBy: { score: 'desc' },
      take: 6,
    });
    res.json({ suggestions });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Dismiss a suggestion
router.patch('/suggestions/:id/dismiss', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const suggestionId = req.params.id as string;
    const suggestion = await prisma.peerSuggestion.findUnique({ where: { id: suggestionId } });
    if (!suggestion || suggestion.fromProfileId !== profileId) {
      res.status(404).json({ error: 'Suggestion not found' });
      return;
    }
    await prisma.peerSuggestion.update({
      where: { id: suggestionId },
      data: { dismissedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to dismiss' });
  }
});

// Personalized peers section on a public profile (visitor-tailored)
router.get('/of/:handle', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetHandle = (req.params.handle as string).toLowerCase();
    const target = await prisma.communityProfile.findUnique({
      where: { handle: targetHandle },
      select: { id: true, city: true, user: { select: { primaryIndustry: true, industry: true } } },
    });
    if (!target) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    const visitorProfileId = await getProfileIdOrThrow(req.userId!);
    const industry = target.user.primaryIndustry;
    const peers = await prisma.communityProfile.findMany({
      where: {
        AND: [
          { id: { not: visitorProfileId } },
          { id: { not: target.id } },
          { isSynthetic: false },
          { isPublic: true },
          { handle: { not: null } },
          industry ? { user: { primaryIndustry: industry } } : {},
        ],
      },
      include: {
        user: { select: { firstName: true, lastName: true, primaryIndustry: true, industry: true } },
      },
      take: 4,
    });
    res.json({ peers });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch peers' });
  }
});

// Add follow-note (called after follow action)
router.post('/follow-notes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const { followingId, note } = req.body;
    if (!note || typeof note !== 'string' || note.length > 140) {
      res.status(400).json({ error: 'Note required (max 140 chars)' });
      return;
    }
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: profileId, followingId } },
    });
    if (!follow) {
      res.status(400).json({ error: 'You must follow this creator first' });
      return;
    }
    const followNote = await prisma.followNote.upsert({
      where: { followerId_followingId: { followerId: profileId, followingId } },
      create: { followerId: profileId, followingId, note: note.trim() },
      update: { note: note.trim() },
    });
    res.status(201).json({ followNote });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Send peer recommendation (rate-limited to 3 per month)
router.post('/recommendations', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const { recipientId, recommendedIds, note } = req.body;
    if (!Array.isArray(recommendedIds) || recommendedIds.length === 0 || recommendedIds.length > 3) {
      res.status(400).json({ error: 'Recommend 1-3 creators' });
      return;
    }
    if (note && (typeof note !== 'string' || note.length > 240)) {
      res.status(400).json({ error: 'Note max 240 chars' });
      return;
    }
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const sentThisMonth = await prisma.peerRecommendation.count({
      where: { senderId: profileId, sentMonth: monthStart },
    });
    if (sentThisMonth >= 3) {
      res.status(429).json({ error: 'Rate limit: 3 recommendations per month' });
      return;
    }
    const rec = await prisma.peerRecommendation.create({
      data: {
        senderId: profileId,
        recipientId,
        recommendedIds,
        note: note?.trim() || null,
        sentMonth: monthStart,
      },
    });
    res.status(201).json({ recommendation: rec });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to send recommendation' });
  }
});

export default router;
