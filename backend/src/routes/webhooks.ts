import { Router, Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { paymentService } from '../services/paymentService';

const router = Router();

// POST /api/webhooks/stripe — raw body required for signature verification
router.post('/stripe', async (req: Request, res: Response): Promise<void> => {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    await paymentService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

export default router;
