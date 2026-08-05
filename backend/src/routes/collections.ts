// Collections routes (iter 286)
// CRUD for Collection + CollectionItem models

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

// List my collections
router.get('/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const collections = await prisma.collection.findMany({
      where: { ownerId: profileId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ collections });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get single collection with items
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: (req.params.id as string) },
      include: {
        owner: {
          select: {
            id: true, handle: true, bio: true, city: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        items: {
          include: {
            post: {
              include: {
                author: {
                  select: {
                    id: true, handle: true,
                    user: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }
    if (!collection.isPublic) {
      const profileId = await getProfileIdOrThrow(req.userId!);
      if (collection.ownerId !== profileId) {
        res.status(404).json({ error: 'Collection not found' });
        return;
      }
    }
    res.json({ collection });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create collection
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const { name, description, isPublic } = req.body;
    if (!name || typeof name !== 'string' || name.length > 80) {
      res.status(400).json({ error: 'Name required (max 80 chars)' });
      return;
    }
    if (description && (typeof description !== 'string' || description.length > 240)) {
      res.status(400).json({ error: 'Description max 240 chars' });
      return;
    }
    const collection = await prisma.collection.create({
      data: {
        ownerId: profileId,
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: !!isPublic,
      },
    });
    res.status(201).json({ collection });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update collection
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const existing = await prisma.collection.findUnique({ where: { id: (req.params.id as string) } });
    if (!existing || existing.ownerId !== profileId) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }
    const { name, description, isPublic, coverPostId } = req.body;
    const updated = await prisma.collection.update({
      where: { id: (req.params.id as string) },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(isPublic !== undefined && { isPublic: !!isPublic }),
        ...(coverPostId !== undefined && { coverPostId: coverPostId || null }),
      },
    });
    res.json({ collection: updated });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const existing = await prisma.collection.findUnique({ where: { id: (req.params.id as string) } });
    if (!existing || existing.ownerId !== profileId) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }
    await prisma.collection.delete({ where: { id: (req.params.id as string) } });
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Add post to collection
router.post('/:id/items', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const { postId, note } = req.body;
    const collection = await prisma.collection.findUnique({ where: { id: (req.params.id as string) } });
    if (!collection || collection.ownerId !== profileId) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }
    if (note && (typeof note !== 'string' || note.length > 240)) {
      res.status(400).json({ error: 'Note max 240 chars' });
      return;
    }
    await prisma.collectionItem.create({
      data: { collectionId: (req.params.id as string), postId, note: note?.trim() || null },
    });
    await prisma.collection.update({
      where: { id: (req.params.id as string) },
      data: {
        itemCount: { increment: 1 },
        coverPostId: collection.coverPostId || postId,
      },
    });
    res.status(201).json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Post already in this collection' });
      return;
    }
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Remove post from collection
router.delete('/:id/items/:postId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = await getProfileIdOrThrow(req.userId!);
    const collectionId = (req.params.id as string) as string;
    const postId = (req.params.postId as string) as string;
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection || collection.ownerId !== profileId) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }
    await prisma.collectionItem.delete({
      where: {
        collectionId_postId: {
          collectionId,
          postId,
        },
      },
    });
    await prisma.collection.update({
      where: { id: collectionId },
      data: { itemCount: { decrement: 1 } },
    });
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NO_COMMUNITY_PROFILE') {
      res.status(400).json({ error: 'Community profile required' });
      return;
    }
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

export default router;
