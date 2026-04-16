import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { paymentService } from '../services/paymentService';

const router = Router();

// ========================================
// SPECIFIC ROUTES FIRST (before generic :incomeId routes)
// ========================================

// GET /api/payments/by-quote/:quoteId — Get income/payment for a specific quote
router.get('/by-quote/:quoteId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const quoteId = String(req.params.quoteId);
    const income = await prisma.income.findFirst({
      where: { quoteId, userId },
    });
    if (!income) {
      res.status(404).json({ error: 'No payment record found for this quote' });
      return;
    }
    res.json({
      incomeId: income.id,
      status: income.status,
      amount: income.amount,
      depositAmount: income.depositAmount,
      depositPaid: income.depositPaid,
      depositPaidAt: income.depositPaidAt,
      finalAmount: income.finalAmount,
      finalPaid: income.finalPaid,
      finalPaidAt: income.finalPaidAt,
      paymentMethod: income.paymentMethod,
    });
  } catch (error: any) {
    console.error('[Pay] By-quote error:', error);
    res.status(500).json({ error: 'Failed to get payment for quote' });
  }
});

// GET /api/payments/session/:sessionId/status — Check Stripe session status (for polling after payment)
router.get('/session/:sessionId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId);
    const result = await paymentService.checkAndUpdateSessionStatus(sessionId);
    res.json(result);
  } catch (error: any) {
    console.error('[Pay] Session status error:', error);
    res.status(500).json({ error: 'Failed to check session status' });
  }
});

// ========================================
// GENERIC :incomeId ROUTES
// ========================================

// POST /api/payments/:incomeId/deposit — Create deposit checkout session
router.post('/:incomeId/deposit', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const incomeId = String(req.params.incomeId);
    const income = await prisma.income.findUnique({ where: { id: incomeId } });
    if (!income || income.userId !== userId) {
      res.status(404).json({ error: 'Income not found' });
      return;
    }
    if (income.depositPaid) {
      res.status(400).json({ error: 'Deposit already paid' });
      return;
    }

    const originUrl = req.body.originUrl || process.env.FRONTEND_URL || '';
    const result = await paymentService.createDepositCheckout(income.id, originUrl);

    res.json({
      message: 'Deposit checkout session created',
      url: result.url,
      sessionId: result.sessionId,
      depositAmount: result.depositAmount,
    });
  } catch (error: any) {
    console.error('[Pay] Deposit error:', error);
    res.status(500).json({ error: error.message || 'Failed to create deposit checkout' });
  }
});

// POST /api/payments/:incomeId/final — Create final payment checkout session
router.post('/:incomeId/final', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const incomeId = String(req.params.incomeId);
    const income = await prisma.income.findUnique({ where: { id: incomeId } });
    if (!income || income.userId !== userId) {
      res.status(404).json({ error: 'Income not found' });
      return;
    }
    if (!income.depositPaid) {
      res.status(400).json({ error: 'Deposit must be paid first' });
      return;
    }
    if (income.finalPaid) {
      res.status(400).json({ error: 'Final payment already received' });
      return;
    }

    const originUrl = req.body.originUrl || process.env.FRONTEND_URL || '';
    const result = await paymentService.createFinalCheckout(income.id, originUrl);

    res.json({
      message: 'Final payment checkout session created',
      url: result.url,
      sessionId: result.sessionId,
      finalAmount: result.finalAmount,
    });
  } catch (error: any) {
    console.error('[Pay] Final payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to create final checkout' });
  }
});

// GET /api/payments/:incomeId/status — Get payment status for an income
router.get('/:incomeId/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const incomeId = String(req.params.incomeId);
    const income = await prisma.income.findUnique({ where: { id: incomeId } });
    if (!income || income.userId !== userId) {
      res.status(404).json({ error: 'Income not found' });
      return;
    }

    res.json({
      status: income.status,
      amount: income.amount,
      depositAmount: income.depositAmount,
      depositPaid: income.depositPaid,
      depositPaidAt: income.depositPaidAt,
      finalAmount: income.finalAmount,
      finalPaid: income.finalPaid,
      finalPaidAt: income.finalPaidAt,
      paymentMethod: income.paymentMethod,
      stripeSessionId: income.stripeSessionId,
    });
  } catch (error: any) {
    console.error('[Pay] Status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

export default router;
