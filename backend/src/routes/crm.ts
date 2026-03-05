import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateCRMAlerts, getRevenueStats, calculateNextFollowUp } from '../services/crm';

const router = Router();
const prisma = new PrismaClient();

// GET /api/crm/alerts - Get CRM alerts for current user
router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = await generateCRMAlerts(req.userId!);
    res.json({ alerts });
  } catch (error) {
    console.error('Get CRM alerts error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get CRM alerts' });
  }
});

// POST /api/crm/interactions - Log a CRM interaction
router.post('/interactions', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leadId, type, content } = req.body;

    if (!leadId || !type) {
      res.status(400).json({ error: 'Bad Request', message: 'leadId and type are required' });
      return;
    }

    const interaction = await prisma.interaction.create({
      data: { leadId, type, content }
    });

    // Update lastContactedAt on the lead
    const updateData: any = { lastContactedAt: new Date() };

    // Auto-advance pipeline if this is a first contact
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead && lead.pipelineStatus === 'NEW_INQUIRY' && ['EMAIL_SENT', 'PHONE_CALL', 'MEETING'].includes(type)) {
      updateData.pipelineStatus = 'CONTACTED';
      updateData.nextFollowUpAt = calculateNextFollowUp({ ...lead, pipelineStatus: 'CONTACTED' });
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: updateData
    });

    res.json({ interaction });
  } catch (error) {
    console.error('Log interaction error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to log interaction' });
  }
});

// GET /api/crm/interactions/:leadId - Get interactions for a lead
router.get('/interactions/:leadId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interactions = await prisma.interaction.findMany({
      where: { leadId: req.params.leadId as string },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ interactions });
  } catch (error) {
    console.error('Get interactions error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get interactions' });
  }
});

// PATCH /api/crm/leads/:id/pipeline - Update pipeline status
router.patch('/leads/:id/pipeline', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, nextFollowUpAt } = req.body;

    const updateData: any = {};
    if (status) updateData.pipelineStatus = status;
    if (nextFollowUpAt) updateData.nextFollowUpAt = new Date(nextFollowUpAt);

    const lead = await prisma.lead.update({
      where: { id: req.params.id as string },
      data: updateData
    });

    res.json({ lead });
  } catch (error) {
    console.error('Update pipeline error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update pipeline' });
  }
});

// GET /api/crm/revenue - Get revenue stats
router.get('/revenue', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getRevenueStats(req.userId!);
    res.json(stats);
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get revenue stats' });
  }
});

// POST /api/crm/income - Create income record
router.post('/income', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leadId, quoteId, amount, currency, description, category, status, expectedDate, receivedDate } = req.body;

    const income = await prisma.income.create({
      data: {
        userId: req.userId!,
        leadId,
        quoteId,
        amount,
        currency: currency || 'USD',
        description,
        category: category || 'PROJECT',
        status: status || 'EXPECTED',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
      }
    });

    res.json({ income });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create income' });
  }
});

// PATCH /api/crm/income/:id - Update income (e.g., mark as received)
router.patch('/income/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incomeId = String(req.params.id);
    const { status, receivedDate, amount } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (receivedDate) updateData.receivedDate = new Date(receivedDate);
    if (amount !== undefined) updateData.amount = amount;

    const income = await prisma.income.update({
      where: { id: incomeId },
      data: updateData
    });

    res.json({ income });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update income' });
  }
});

// GET /api/crm/income - Get all income records
router.get('/income', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incomes = await prisma.income.findMany({
      where: { userId: req.userId! },
      include: {
        lead: { select: { clientName: true, projectTitle: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Convert Decimal to number for JSON serialization
    const serialized = incomes.map(i => ({
      ...i,
      amount: Number(i.amount)
    }));

    res.json({ incomes: serialized });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get income records' });
  }
});

export default router;
