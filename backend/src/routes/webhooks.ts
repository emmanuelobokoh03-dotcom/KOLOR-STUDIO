import { Router, Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import prisma from '../lib/prisma';

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

    // Dedup: extract event ID from raw body before full processing
    let eventId: string | undefined;
    try {
      const parsed = JSON.parse(rawBody.toString('utf8'));
      eventId = parsed?.id;
    } catch {
      // Can't parse for dedup — continue, paymentService will validate signature
    }

    if (eventId) {
      const alreadyProcessed = await prisma.processedWebhookEvent
        .findUnique({ where: { stripeEventId: eventId } })
        .catch(() => null);

      if (alreadyProcessed) {
        console.log(`[Webhook] Duplicate event ${eventId} — skipping`);
        res.json({ received: true, duplicate: true });
        return;
      }
    }

    await paymentService.handleWebhookEvent(rawBody, sig);

    // Record processed event (best-effort, non-blocking)
    if (eventId) {
      prisma.processedWebhookEvent.create({
        data: { stripeEventId: eventId, processedAt: new Date() },
      }).catch(e => console.error('[Webhook] Failed to record processed event:', e));
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

export default router;
