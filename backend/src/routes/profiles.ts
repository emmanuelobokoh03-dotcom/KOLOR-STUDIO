// Public Profile routes (iter 286)
// GET public profile by handle, handle validation, handle setting

import express, { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateHandle, normalizeHandle } from '../services/handleValidator';

const router = express.Router();
const prisma = new PrismaClient();

// Public: get profile by handle (no auth — this is externally shareable)
router.get('/:handle', async (req: Request, res: Response): Promise<void> => {
  try {
    const handle = normalizeHandle(req.params.handle as string);
    const profile = await prisma.communityProfile.findUnique({
      where: { handle },
      include: {
        user: {
          select: {
            firstName: true, lastName: true, primaryIndustry: true,
            industry: true, brandLogoUrl: true,
          },
        },
      },
    });
    if (!profile || !profile.isPublic) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({
      profile: {
        id: profile.id,
        handle: profile.handle,
        bio: profile.bio,
        city: profile.city,
        availability: profile.availability,
        joinedAt: profile.joinedAt,
        user: profile.user,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Check handle availability (authed — for signed-in creators picking handle)
router.post('/handles/check', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { handle } = req.body;
    const validation = validateHandle(handle);
    if (!validation.valid) {
      res.json({ available: false, reason: validation.reason });
      return;
    }
    const normalized = normalizeHandle(handle);
    const existing = await prisma.communityProfile.findUnique({ where: { handle: normalized } });
    res.json({ available: !existing, reason: existing ? 'Handle already taken' : undefined });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check handle' });
  }
});

// Set/change handle on current user's profile
router.patch('/handle', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { handle } = req.body;
    const validation = validateHandle(handle);
    if (!validation.valid) {
      res.status(400).json({ error: validation.reason });
      return;
    }
    const normalized = normalizeHandle(handle);
    const profile = await prisma.communityProfile.findUnique({
      where: { userId: req.userId! },
      select: { id: true },
    });
    if (!profile) {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    const existing = await prisma.communityProfile.findUnique({ where: { handle: normalized } });
    if (existing && existing.id !== profile.id) {
      res.status(409).json({ error: 'Handle already taken' });
      return;
    }
    const updated = await prisma.communityProfile.update({
      where: { id: profile.id },
      data: { handle: normalized },
    });
    res.json({ profile: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set handle' });
  }
});

// Get posts for a public profile (by handle)
router.get('/:handle/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const handle = normalizeHandle(req.params.handle as string);
    const profile = await prisma.communityProfile.findUnique({
      where: { handle },
      select: { id: true, isPublic: true },
    });
    if (!profile || !profile.isPublic) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    const posts = await prisma.post.findMany({
      where: { authorId: profile.id, isDeleted: false },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get public collections for a public profile
router.get('/:handle/collections', async (req: Request, res: Response): Promise<void> => {
  try {
    const handle = normalizeHandle(req.params.handle as string);
    const profile = await prisma.communityProfile.findUnique({
      where: { handle },
      select: { id: true, isPublic: true },
    });
    if (!profile || !profile.isPublic) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    const collections = await prisma.collection.findMany({
      where: { ownerId: profile.id, isPublic: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

export default router;
