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

export default router;
