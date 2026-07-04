import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { paymentService } from '../services/paymentService';
import { sendHealthCheckFailureAlert } from '../services/email';
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

    // Iter 150 — Atomic dedup: claim the event ID first. The @unique constraint
    // on eventKey makes this a DB-level lock — only one concurrent request
    // succeeds; the other gets P2002, which we treat as the duplicate signal.
    // Closes the race condition in the previous check-then-record pattern.
    if (eventId) {
      try {
        await prisma.processedWebhookEvent.create({
          data: { eventKey: eventId },
        });
      } catch (e: any) {
        if (e?.code === 'P2002') {
          console.log(`[Webhook] Duplicate event ${eventId} — skipping`);
          res.json({ received: true, duplicate: true });
          return;
        }
        throw e;
      }
    }

    // Event claimed — now safe to process
    await paymentService.handleWebhookEvent(rawBody, sig);

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

      // Iter 150 — Atomic dedup (same pattern as Stripe handler above)
      try {
        await prisma.processedWebhookEvent.create({
          data: { eventKey: dedupKey },
        });
      } catch (e: any) {
        if (e?.code === 'P2002') {
          console.log(`[Paystack Webhook] Duplicate event for ref ${reference} — skipping`);
          return;
        }
        throw e;
      }

      await paymentService.checkAndUpdatePaystackPayment(reference);
    }
  } catch (err: any) {
    console.error('[Paystack Webhook] Processing error:', err.message);
  }
});

// ---------------------------------------------------------------
// UPTIME WEBHOOK SETUP (external prerequisites):
//
// 1. Railway env var: UPTIMEROBOT_WEBHOOK_SECRET=<random 32+ char string>
// 2. UptimeRobot → Alert Contact → Web-Hook type → configure:
//    URL:            https://api.kolorstudio.app/api/webhooks/uptime
//    POST value:     JSON (raw)
//    Custom Header:  X-Webhook-Secret: <same value as env var>
//    POST body:      {"alertType":"*alertType*","monitorFriendlyName":"*monitorFriendlyName*","monitorURL":"*monitorURL*","alertDetails":"*alertDetails*","alertDuration":"*alertDuration*"}
// 3. UptimeRobot → Monitors → assign this Alert Contact to any monitors.
// ---------------------------------------------------------------

// UptimeRobot webhook — POST /api/webhooks/uptime
// Configured externally to POST here on downtime with X-Webhook-Secret header.
router.post('/uptime', async (req: Request, res: Response): Promise<void> => {
  const providedSecret = req.headers['x-webhook-secret'];
  const expectedSecret = process.env.UPTIMEROBOT_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('[UPTIME] UPTIMEROBOT_WEBHOOK_SECRET not configured');
    res.status(500).json({ error: 'Server not configured for uptime webhooks' });
    return;
  }

  if (providedSecret !== expectedSecret) {
    console.warn('[UPTIME] Invalid webhook secret from', req.ip);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const {
    alertType,
    monitorFriendlyName,
    monitorURL,
    alertDetails,
  } = req.body || {};

  // UptimeRobot alertType: "1" = down (as string in webhook body)
  const isDowntime = String(alertType) === '1';

  if (isDowntime) {
    try {
      await sendHealthCheckFailureAlert({
        endpoint: monitorURL || monitorFriendlyName || 'unknown',
        errorMessage: alertDetails || 'no details provided',
        failureTime: new Date(),
      });
      console.log('[UPTIME] Downtime alert dispatched for', monitorFriendlyName || monitorURL);
    } catch (err) {
      // Email failure must never block webhook response — UptimeRobot retries loudly
      console.error('[UPTIME] Failed to send alert email:', err);
    }
  } else {
    console.log('[UPTIME] Non-downtime event ignored: alertType =', alertType);
  }

  res.json({ received: true });
});

export default router;
