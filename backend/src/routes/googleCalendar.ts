import { Router, Response, Request } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as gcal from '../services/googleCalendarService';

const router = Router();

/** GET /api/google-calendar/config-check — Verify backend configuration */
router.get('/config-check', authMiddleware, (_req: Request, res: Response): void => {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;

  res.json({
    configured: hasClientId && hasClientSecret && hasRedirectUri,
    details: {
      hasClientId,
      hasClientSecret,
      hasRedirectUri,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || null,
    },
  });
});

/** GET /api/google-calendar/auth-url — Generate OAuth consent URL */
router.get('/auth-url', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const authUrl = gcal.getAuthUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('[GCAL] Auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/** GET /api/google-calendar/callback — OAuth redirect handler */
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      res.status(400).send('Missing code or state');
      return;
    }

    const userId = state as string;
    const tokens = await gcal.exchangeCodeForTokens(code as string);
    await gcal.storeCalendarConnection(userId, tokens);

    const frontendUrl = process.env.FRONTEND_URL || '';
    res.redirect(`${frontendUrl}/dashboard?calendar=connected`);
  } catch (error) {
    console.error('[GCAL] Callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || '';
    res.redirect(`${frontendUrl}/dashboard?calendar=error`);
  }
});

/** GET /api/google-calendar/status — Check connection status */
router.get('/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const connection = await gcal.getCalendarConnection(userId);
    res.json({
      connected: !!connection,
      provider: connection?.provider || null,
      connectedAt: connection?.createdAt || null,
    });
  } catch (error) {
    console.error('[GCAL] Status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/** DELETE /api/google-calendar/disconnect — Remove connection */
router.delete('/disconnect', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId as string;
    await gcal.disconnect(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('[GCAL] Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
