import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/unsubscribe/:token — Public, no auth required (CAN-SPAM compliance)
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  const token = req.params.token as string;

  if (!token || token.length < 10) {
    res.status(400).send(renderPage('Invalid Link', 'This unsubscribe link is invalid or has expired.'));
    return;
  }

  try {
    // Search across all three enrollment models
    let found = false;
    let enrollmentType = '';

    // 1. Check SequenceEnrollment
    const seqEnrollment = await prisma.sequenceEnrollment.findUnique({
      where: { unsubscribeToken: token },
    });
    if (seqEnrollment && seqEnrollment.status === 'ACTIVE') {
      await prisma.sequenceEnrollment.update({
        where: { id: seqEnrollment.id },
        data: { status: 'STOPPED', stoppedAt: new Date(), stoppedReason: 'unsubscribed', nextEmailAt: null },
      });
      found = true;
      enrollmentType = 'email sequence';
    }

    // 2. Check QuoteFollowUpEnrollment
    if (!found) {
      const quoteEnrollment = await prisma.quoteFollowUpEnrollment.findUnique({
        where: { unsubscribeToken: token },
      });
      if (quoteEnrollment && !quoteEnrollment.completed) {
        await prisma.quoteFollowUpEnrollment.update({
          where: { id: quoteEnrollment.id },
          data: { completed: true, stoppedAt: new Date(), stopReason: 'unsubscribed' },
        });
        found = true;
        enrollmentType = 'quote follow-up';
      }
    }

    // 3. Check ClientOnboardingEnrollment
    if (!found) {
      const onbEnrollment = await prisma.clientOnboardingEnrollment.findUnique({
        where: { unsubscribeToken: token },
      });
      if (onbEnrollment && !onbEnrollment.completed && !onbEnrollment.stoppedAt) {
        await prisma.clientOnboardingEnrollment.update({
          where: { id: onbEnrollment.id },
          data: { completed: true, stoppedAt: new Date(), stopReason: 'unsubscribed' },
        });
        found = true;
        enrollmentType = 'onboarding';
      }
    }

    if (found) {
      console.log(`[Unsubscribe] Successfully unsubscribed token ${token.slice(0, 8)}... from ${enrollmentType}`);
      res.status(200).send(renderPage(
        'Unsubscribed',
        'You have been successfully unsubscribed from these automated emails. You will no longer receive messages from this sequence.',
      ));
    } else {
      // Token exists but already stopped, or not found at all
      res.status(200).send(renderPage(
        'Already Unsubscribed',
        'This email sequence has already been stopped. No further action is needed.',
      ));
    }
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    res.status(500).send(renderPage('Error', 'Something went wrong. Please try again later.'));
  }
});

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — KOLOR Studio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 16px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    h1 { color: #1A1A2E; font-size: 24px; margin: 0 0 16px; }
    p { color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0; }
    .icon { font-size: 48px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${title === 'Error' ? '⚠️' : '✅'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

export default router;
