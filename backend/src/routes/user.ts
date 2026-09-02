import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logAudit, AUDIT_ACTIONS } from '../services/auditService';
import prisma from '../lib/prisma';

// iter 293-v3.1-v3b W3 — Avatar upload (multer memory storage, 2MB cap,
// image types only). Mirrors settings.ts brand-logo pattern.
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPEG, and WebP images are allowed'));
  },
});

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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

// iter 293-v3.1-v3b W3 — POST /api/user/avatar
// Upload user avatar (JPG/PNG/WebP, max 2MB). Single file per user via
// upsert:true and stable path {userId}-avatar.{ext} (Q3b=b).
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      res.status(500).json({ error: 'Storage not configured' });
      return;
    }
    const BUCKET = 'avatars';
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 2097152 });
    }
    // Q3b=b — stable single-file-per-user path
    const ext = req.file.mimetype === 'image/jpeg' ? 'jpg' : req.file.mimetype === 'image/png' ? 'png' : 'webp';
    const path = `${userId}-avatar.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });
    if (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
      return;
    }
    // Cache-bust the public URL so the fresh upload is visible immediately.
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl;
    const avatarUrl = `${publicUrl}?v=${Date.now()}`;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    res.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload exception:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// iter 293-v3.1-v3b W3 — DELETE /api/user/avatar
// Remove avatar (falls back to initials).
router.delete('/avatar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
    if (user?.avatarUrl) {
      const supabase = getSupabase();
      if (supabase) {
        // Path shape: {userId}-avatar.{ext} — strip query string first.
        const clean = user.avatarUrl.split('?')[0];
        const parts = clean.split('/avatars/');
        const path = parts[1];
        if (path) {
          await supabase.storage.from('avatars').remove([path]);
        }
      }
    }
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

export default router;