// Featured Work + Featured Creators routes (iter 286)
// Public read + Emmanuel-only write via ADMIN_EMAIL check

import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function isAdmin(userId: string): Promise<boolean> {
  if (!ADMIN_EMAIL) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function getSundayOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day;
  const sunday = new Date(d);
  sunday.setUTCDate(diff);
  sunday.setUTCHours(0, 0, 0, 0);
  return sunday;
}

// Get current week's featured work
router.get('/work', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentWeek = getSundayOfWeek(new Date());
    const featured = await prisma.featuredPost.findMany({
      where: { featuredWeek: currentWeek },
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
    });
    res.json({ featured });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured work' });
  }
});

// Get current week's featured creators
router.get('/creators', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentWeek = getSundayOfWeek(new Date());
    const featured = await prisma.featuredCreator.findMany({
      where: { featuredWeek: currentWeek },
      include: {
        profile: {
          include: {
            user: { select: { firstName: true, lastName: true, primaryIndustry: true, industry: true } },
          },
        },
      },
    });
    res.json({ featured });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured creators' });
  }
});

// Archive: all past featured work
router.get('/work/archive', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const featured = await prisma.featuredPost.findMany({
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
      orderBy: { featuredWeek: 'desc' },
      take: 100,
    });
    res.json({ featured });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch archive' });
  }
});

// Admin: create featured work
router.post('/work', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!(await isAdmin(req.userId!))) {
      res.status(403).json({ error: 'Curator access required' });
      return;
    }
    const { postId, industry, featuredWeek, curatorNote } = req.body;
    const week = new Date(featuredWeek);
    const featured = await prisma.featuredPost.create({
      data: {
        postId,
        industry,
        featuredWeek: getSundayOfWeek(week),
        curatorNote: curatorNote?.trim() || null,
      },
    });
    res.status(201).json({ featured });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'This industry already has featured work for that week' });
      return;
    }
    res.status(500).json({ error: 'Failed to create featured work' });
  }
});

// Admin: create featured creator
router.post('/creators', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!(await isAdmin(req.userId!))) {
      res.status(403).json({ error: 'Curator access required' });
      return;
    }
    const { profileId, industry, featuredWeek, curatorNote } = req.body;
    const week = new Date(featuredWeek);
    const featured = await prisma.featuredCreator.create({
      data: {
        profileId,
        industry,
        featuredWeek: getSundayOfWeek(week),
        curatorNote: curatorNote?.trim() || null,
      },
    });
    res.status(201).json({ featured });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'This industry already has featured creator for that week' });
      return;
    }
    res.status(500).json({ error: 'Failed to create featured creator' });
  }
});

export default router;
