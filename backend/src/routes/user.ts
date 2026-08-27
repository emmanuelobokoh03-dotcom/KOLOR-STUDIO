import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logAudit, AUDIT_ACTIONS } from '../services/auditService';
import prisma from '../lib/prisma';

const router = Router();

// DELETE /api/user/account — Permanently delete account and all data (GDPR)
router.delete('/account', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId as string;

  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password required to delete account' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Log audit BEFORE deletion so the record has the userId
    await logAudit({
      userId,
      action: AUDIT_ACTIONS.ACCOUNT_DELETED,
      entity: 'User',
      entityId: userId,
      metadata: { email: user.email, deletedAt: new Date().toISOString() },
      req,
    });

    // Delete user — Prisma cascades will remove all related data
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'Account permanently deleted' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// iter 293-v3b — User preferences (saved views migration Q1.2=A)
// ═══════════════════════════════════════════════════════════════════
// GET  /api/user/preferences → returns the JSON preferences blob (or {} if unset)
// PATCH /api/user/preferences → replaces preferences with req.body.preferences
//                                 (client merges before saving; server is pass-through)

router.get('/preferences', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    res.json({ preferences: user?.preferences ?? {} });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

router.patch('/preferences', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const preferences = req.body?.preferences;
    if (typeof preferences !== 'object' || preferences === null || Array.isArray(preferences)) {
      res.status(400).json({ error: 'preferences must be an object' });
      return;
    }
    // Basic size guard — user.preferences is not meant for large payloads
    if (JSON.stringify(preferences).length > 100_000) {
      res.status(400).json({ error: 'preferences payload too large (max 100KB)' });
      return;
    }
    await prisma.user.update({
      where: { id: userId },
      data: { preferences },
    });
    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;