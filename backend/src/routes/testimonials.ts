import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
import prisma from '../lib/prisma';

// GET /api/testimonials - Get user's testimonials
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { userId: req.userId! },
      include: { lead: { select: { clientName: true, projectTitle: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ testimonials });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get testimonials' });
  }
});

// GET /api/testimonials/stats - Get testimonial stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, pending, approved, avgRating] = await Promise.all([
      prisma.testimonial.count({ where: { userId: req.userId! } }),
      prisma.testimonial.count({ where: { userId: req.userId!, status: 'PENDING', submittedAt: { not: null } } }),
      prisma.testimonial.count({ where: { userId: req.userId!, status: 'APPROVED' } }),
      prisma.testimonial.aggregate({ where: { userId: req.userId!, status: 'APPROVED', rating: { gt: 0 } }, _avg: { rating: true } }),
    ]);
    res.json({ total, pending, approved, avgRating: avgRating._avg.rating || 0 });
  } catch (error) {
    console.error('Get testimonial stats error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/testimonials/public/:userId - Public approved testimonials
router.get('/public/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const testimonials = await prisma.testimonial.findMany({
      where: { userId, status: 'APPROVED' },
      select: {
        id: true, clientName: true, rating: true, content: true,
        recommend: true, featured: true, submittedAt: true
      },
      orderBy: [{ featured: 'desc' }, { rating: 'desc' }, { submittedAt: 'desc' }]
    });
    res.json({ testimonials });
  } catch (error) {
    console.error('Get public testimonials error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/testimonials/request/:leadId - Request testimonial from a lead's client
router.post('/request/:leadId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = String(req.params.leadId);
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead || lead.assignedToId !== req.userId) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Check if already requested
    const existing = await prisma.testimonial.findFirst({
      where: { leadId, userId: req.userId! }
    });
    if (existing) {
      res.status(400).json({ error: 'Testimonial already requested for this lead' });
      return;
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        userId: req.userId!,
        leadId: lead.id,
        clientName: lead.clientName,
        clientEmail: lead.clientEmail,
        status: 'PENDING',
        requestedAt: new Date()
      }
    });

    res.json({ testimonial, message: 'Testimonial request created' });
  } catch (error) {
    console.error('Request testimonial error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to request testimonial' });
  }
});

// GET /api/testimonials/submit/:token - Get request details (public)
router.get('/submit/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = String(req.params.token);
    const testimonial = await prisma.testimonial.findUnique({
      where: { publicToken: token },
      include: {
        user: { select: { studioName: true, firstName: true, lastName: true, brandLogoUrl: true, brandPrimaryColor: true } }
      }
    });

    if (!testimonial) {
      res.status(404).json({ error: 'Testimonial request not found' });
      return;
    }

    res.json({ testimonial });
  } catch (error) {
    console.error('Get testimonial submit error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/testimonials/submit/:token - Submit testimonial (public)
router.post('/submit/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = String(req.params.token);
    const { rating, content, recommend, clientName, clientEmail, consentGiven } = req.body;

    if (!rating || !content) {
      res.status(400).json({ error: 'Rating and content are required' });
      return;
    }

    const testimonial = await prisma.testimonial.findUnique({ where: { publicToken: token } });

    if (!testimonial) {
      res.status(404).json({ error: 'Testimonial request not found' });
      return;
    }

    if (testimonial.submittedAt) {
      res.status(400).json({ error: 'Testimonial already submitted' });
      return;
    }

    const updated = await prisma.testimonial.update({
      where: { id: testimonial.id },
      data: {
        rating: Number(rating),
        content,
        recommend: recommend !== false,
        clientName: clientName || testimonial.clientName,
        clientEmail: clientEmail || testimonial.clientEmail,
        consentGiven: !!consentGiven,
        submittedAt: new Date(),
        status: 'PENDING'
      }
    });

    res.json({ message: 'Thank you for your testimonial!', testimonial: updated });
  } catch (error) {
    console.error('Submit testimonial error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to submit testimonial' });
  }
});

// PATCH /api/testimonials/:id/approve
router.patch('/:id/approve', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial || testimonial.userId !== req.userId) {
      res.status(404).json({ error: 'Testimonial not found' });
      return;
    }
    const updated = await prisma.testimonial.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date() }
    });
    res.json({ testimonial: updated });
  } catch (error) {
    console.error('Approve testimonial error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/testimonials/:id/reject
router.patch('/:id/reject', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial || testimonial.userId !== req.userId) {
      res.status(404).json({ error: 'Testimonial not found' });
      return;
    }
    const updated = await prisma.testimonial.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
    res.json({ testimonial: updated });
  } catch (error) {
    console.error('Reject testimonial error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/testimonials/:id/feature - Toggle featured
router.patch('/:id/feature', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial || testimonial.userId !== req.userId) {
      res.status(404).json({ error: 'Testimonial not found' });
      return;
    }
    const updated = await prisma.testimonial.update({
      where: { id },
      data: { featured: !testimonial.featured }
    });
    res.json({ testimonial: updated });
  } catch (error) {
    console.error('Toggle feature error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
