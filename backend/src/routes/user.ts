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

export default router;
