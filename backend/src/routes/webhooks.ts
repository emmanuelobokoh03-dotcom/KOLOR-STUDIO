import { Router, Request, Response } from 'express';
import { paymentService } from '../services/paymentService';

const router = Router();

// POST /api/webhooks/stripe — raw body required for signature verification
router.post('/stripe', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    const rawBody = req.body as Buffer;
    await paymentService.handleWebhookEvent(rawBody, sig);
    res.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

export default router;
