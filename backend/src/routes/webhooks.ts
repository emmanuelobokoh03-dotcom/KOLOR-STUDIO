import { Router, Request, Response } from 'express';
import crypto from 'crypto';
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

// POST /api/webhooks/paystack — Paystack event handler (HMAC SHA-512 signature verification)
router.post('/paystack', async (req: Request, res: Response): Promise<void> => {
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY || '';
  if (!paystackSecret) {
    console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY not configured');
    res.status(500).json({ error: 'Paystack not configured' });
    return;
  }

  // Verify signature — Paystack sends x-paystack-signature as HMAC SHA-512 of raw request body
  const hash = crypto
    .createHmac('sha512', paystackSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const signature = req.headers['x-paystack-signature'] as string;

  if (!signature || hash !== signature) {
    console.error('[Paystack Webhook] Invalid signature');
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  // Acknowledge immediately — Paystack requires fast 200 response
  res.json({ received: true });

  // Process asynchronously
  try {
    const event = req.body as { event: string; data: { reference: string; status: string } };

    if (event.event === 'charge.success' && event.data?.reference) {
      const reference = event.data.reference;
      const dedupKey = `paystack_${reference}`;

      // Dedup via existing ProcessedWebhookEvent table (reusing stripeEventId column as a generic key)
      const existing = await prisma.processedWebhookEvent
        .findUnique({ where: { stripeEventId: dedupKey } })
        .catch(() => null);

      if (existing) {
        console.log(`[Paystack Webhook] Duplicate event for ref ${reference} — skipping`);
        return;
      }

      await paymentService.checkAndUpdatePaystackPayment(reference);

      prisma.processedWebhookEvent.create({
        data: { stripeEventId: dedupKey, processedAt: new Date() },
      }).catch(e => console.error('[Paystack Webhook] Failed to record processed event:', e));
    }
  } catch (err: any) {
    console.error('[Paystack Webhook] Processing error:', err.message);
  }
});

export default router;
