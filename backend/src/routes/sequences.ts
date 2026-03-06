import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
import prisma from '../lib/prisma';

// GET /api/sequences - List all sequences for user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sequences = await prisma.emailSequence.findMany({
      where: { userId: req.userId! },
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get active enrollment counts
    const withStats = await Promise.all(
      sequences.map(async (seq) => {
        const activeCount = await prisma.sequenceEnrollment.count({
          where: { sequenceId: seq.id, status: 'ACTIVE' },
        });
        const completedCount = await prisma.sequenceEnrollment.count({
          where: { sequenceId: seq.id, status: 'COMPLETED' },
        });
        return {
          ...seq,
          stats: { total: seq._count.enrollments, active: activeCount, completed: completedCount },
        };
      })
    );

    res.json({ sequences: withStats });
  } catch (error) {
    console.error('List sequences error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/sequences/:id - Get single sequence with enrollments
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sequence = await prisma.emailSequence.findFirst({
      where: { id: req.params.id as string, userId: req.userId! },
      include: {
        steps: { orderBy: { order: 'asc' } },
        enrollments: {
          include: { lead: { select: { id: true, clientName: true, clientEmail: true, projectTitle: true } } },
          orderBy: { enrolledAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!sequence) { res.status(404).json({ error: 'Sequence not found' }); return; }
    res.json({ sequence });
  } catch (error) {
    console.error('Get sequence error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/sequences - Create sequence
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, trigger, steps } = req.body;
    if (!name || !trigger) { res.status(400).json({ error: 'Name and trigger are required' }); return; }

    const sequence = await prisma.emailSequence.create({
      data: {
        userId: req.userId!,
        name,
        description: description || null,
        trigger,
        active: true,
        steps: {
          create: (steps || []).map((s: any, i: number) => ({
            order: i,
            delayDays: s.delayDays ?? 3,
            subject: s.subject || '',
            body: s.body || '',
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    res.status(201).json({ sequence });
  } catch (error) {
    console.error('Create sequence error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/sequences/:id - Update sequence metadata
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const seq = await prisma.emailSequence.findFirst({ where: { id: req.params.id as string, userId: req.userId! } });
    if (!seq) { res.status(404).json({ error: 'Sequence not found' }); return; }

    const { name, description, trigger, active } = req.body;
    const updated = await prisma.emailSequence.update({
      where: { id: seq.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(trigger !== undefined && { trigger }),
        ...(active !== undefined && { active }),
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    res.json({ sequence: updated });
  } catch (error) {
    console.error('Update sequence error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/sequences/:id - Delete sequence
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const seq = await prisma.emailSequence.findFirst({ where: { id: req.params.id as string, userId: req.userId! } });
    if (!seq) { res.status(404).json({ error: 'Sequence not found' }); return; }

    await prisma.emailSequence.delete({ where: { id: seq.id } });
    res.json({ message: 'Sequence deleted' });
  } catch (error) {
    console.error('Delete sequence error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ── Step CRUD ──────────────────────────────────────────

// POST /api/sequences/:id/steps - Add step
router.post('/:id/steps', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const seq = await prisma.emailSequence.findFirst({ where: { id: req.params.id as string, userId: req.userId! } });
    if (!seq) { res.status(404).json({ error: 'Sequence not found' }); return; }

    const { subject, body, delayDays, order } = req.body;
    const step = await prisma.emailSequenceStep.create({
      data: { sequenceId: seq.id, subject: subject || '', body: body || '', delayDays: delayDays ?? 3, order: order ?? 99 },
    });
    res.status(201).json({ step });
  } catch (error) {
    console.error('Create step error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/sequences/steps/:stepId - Update step
router.patch('/steps/:stepId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const step = await prisma.emailSequenceStep.findUnique({
      where: { id: req.params.stepId as string },
      include: { sequence: { select: { userId: true } } },
    });
    if (!step || step.sequence.userId !== req.userId) { res.status(404).json({ error: 'Step not found' }); return; }

    const { subject, body, delayDays, order } = req.body;
    const updated = await prisma.emailSequenceStep.update({
      where: { id: step.id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
        ...(delayDays !== undefined && { delayDays }),
        ...(order !== undefined && { order }),
      },
    });
    res.json({ step: updated });
  } catch (error) {
    console.error('Update step error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/sequences/steps/:stepId - Delete step
router.delete('/steps/:stepId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const step = await prisma.emailSequenceStep.findUnique({
      where: { id: req.params.stepId as string },
      include: { sequence: { select: { userId: true } } },
    });
    if (!step || step.sequence.userId !== req.userId) { res.status(404).json({ error: 'Step not found' }); return; }

    await prisma.emailSequenceStep.delete({ where: { id: step.id } });
    res.json({ message: 'Step deleted' });
  } catch (error) {
    console.error('Delete step error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ── Enrollment management ──────────────────────────────

// POST /api/sequences/:id/enroll/:leadId - Manually enroll lead
router.post('/:id/enroll/:leadId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const seq = await prisma.emailSequence.findFirst({
      where: { id: req.params.id as string, userId: req.userId! },
      include: { steps: { orderBy: { order: 'asc' }, take: 1 } },
    });
    if (!seq) { res.status(404).json({ error: 'Sequence not found' }); return; }

    const lead = await prisma.lead.findFirst({ where: { id: req.params.leadId as string, assignedToId: req.userId! } });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    const exists = await prisma.sequenceEnrollment.findUnique({
      where: { sequenceId_leadId: { sequenceId: seq.id, leadId: lead.id } },
    });
    if (exists) { res.status(400).json({ error: 'Lead already enrolled in this sequence' }); return; }

    const firstStep = seq.steps[0];
    const nextEmailAt = firstStep ? new Date(Date.now() + firstStep.delayDays * 86400000) : null;

    const enrollment = await prisma.sequenceEnrollment.create({
      data: { sequenceId: seq.id, leadId: lead.id, nextEmailAt },
    });

    res.status(201).json({ enrollment });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/sequences/enrollments/:enrollmentId/stop - Stop enrollment
router.post('/enrollments/:enrollmentId/stop', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollment = await prisma.sequenceEnrollment.findUnique({
      where: { id: req.params.enrollmentId as string },
      include: { lead: { select: { assignedToId: true } } },
    });
    if (!enrollment || enrollment.lead.assignedToId !== req.userId) {
      res.status(404).json({ error: 'Enrollment not found' }); return;
    }

    const updated = await prisma.sequenceEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'STOPPED', stoppedReason: req.body.reason || 'Manually stopped', stoppedAt: new Date(), nextEmailAt: null },
    });
    res.json({ enrollment: updated });
  } catch (error) {
    console.error('Stop enrollment error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
