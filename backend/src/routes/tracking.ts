import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// 1x1 transparent PNG pixel (base64)
const PIXEL_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const PIXEL_HEADERS = {
  'Content-Type': 'image/png',
  'Content-Length': String(PIXEL_BUFFER.length),
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// GET /api/track/open/:trackingId — public, no auth
router.get('/open/:trackingId', async (req: Request, res: Response): Promise<void> => {
  try {
    const trackingId = req.params.trackingId as string;

    const tracking = await prisma.emailTracking.findUnique({
      where: { trackingId },
    });

    if (tracking) {
      const now = new Date();
      const isFirstOpen = !tracking.opened;

      await prisma.emailTracking.update({
        where: { trackingId },
        data: {
          opened: true,
          openedAt: isFirstOpen ? now : tracking.openedAt,
          openCount: { increment: 1 },
          userAgent: String(req.headers['user-agent'] || ''),
          ipAddress: String(req.ip || ''),
        },
      });


    }

    res.set(PIXEL_HEADERS).send(PIXEL_BUFFER);
  } catch (error) {
    console.error('[TRACKING] Error logging open:', error);
    // Always return pixel even on error
    res.set(PIXEL_HEADERS).send(PIXEL_BUFFER);
  }
});

// GET /api/track/click/:id — Email link click tracker
router.get('/click/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const rawUrl = req.query.url;

  if (!rawUrl || typeof rawUrl !== 'string') {
    res.status(400).send('Missing redirect URL');
    return;
  }
  const url: string = rawUrl;

  let safeUrl: string;
  try {
    const parsed = new URL(url);
    const allowed = ['kolorstudio.app', 'kolor-studio-production.up.railway.app'];
    if (!allowed.some(h => parsed.hostname.endsWith(h))) {
      safeUrl = process.env.FRONTEND_URL || 'https://kolorstudio.app';
    } else {
      safeUrl = url;
    }
  } catch {
    safeUrl = `${process.env.FRONTEND_URL || 'https://kolorstudio.app'}${url.startsWith('/') ? url : '/' + url}`;
  }

  prisma.emailTracking.update({
    where: { id },
    data: {
      clickCount: { increment: 1 },
      clickedAt: new Date(),
    },
  }).catch(e => console.error('[Track] Click update failed:', e));

  res.redirect(302, safeUrl);
});

export default router;
