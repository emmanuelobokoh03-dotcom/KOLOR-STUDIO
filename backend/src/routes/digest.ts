import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateDigestForUser } from '../services/digestService';
import { sendWeeklyDigestEmail } from '../services/email';
import { runWeeklyPipelineReports } from '../scheduler';

const router = Router();

// GET /api/digest/preview — Preview digest data for the current user
router.get('/preview', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const digest = await generateDigestForUser(userId);

    if (!digest) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ digest, message: 'Digest preview generated' });
  } catch (error) {
    console.error('Digest preview error:', error);
    res.status(500).json({ error: 'Failed to generate digest preview' });
  }
});

// POST /api/digest/send — Manually trigger sending the digest email to the current user
router.post('/send', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const digest = await generateDigestForUser(userId);

    if (!digest) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!digest.hasActivity && digest.nextActions.length === 0) {
      res.json({ message: 'No activity this week — digest email skipped', skipped: true, digest });
      return;
    }

    const sent = await sendWeeklyDigestEmail(digest);
    res.json({ message: sent ? 'Digest email sent!' : 'Email sending failed (check logs)', sent, digest });
  } catch (error) {
    console.error('Digest send error:', error);
    res.status(500).json({ error: 'Failed to send digest' });
  }
});

// POST /api/digest/weekly — Manually trigger the Monday pipeline report for ALL opted-in users
// (Acts as a cold-start safety net in case the node-cron job missed its window.)
// Requires auth: any logged-in user can trigger, but the payload is sent to each user's own email.
router.post('/weekly', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await runWeeklyPipelineReports();
    res.json({ message: 'Weekly pipeline reports dispatched', success: true });
  } catch (error) {
    console.error('Manual weekly digest error:', error);
    res.status(500).json({ error: 'Failed to run weekly reports' });
  }
});

export default router;
