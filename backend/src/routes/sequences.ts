import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getOpenRate, getAverageOpenRate } from '../services/emailTracking';

const router = Router();
import prisma from '../lib/prisma';

// ── Dashboard endpoints (must be BEFORE /:id routes) ─────

// GET /api/sequences/dashboard - Get all sequences for dashboard view
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Get client onboarding enrollment stats
    const onboardingEnrollments = await prisma.clientOnboardingEnrollment.findMany({
      where: { lead: { assignedToId: userId } },
    });

    // Get quote follow-up enrollment stats
    const followUpEnrollments = await prisma.quoteFollowUpEnrollment.findMany({
      where: { quote: { lead: { assignedToId: userId } } },
    });

    // Calculate real open rates from tracking data
    const [onb1Rate, onb2Rate, onb3Rate, fu1Rate, fu2Rate, fu3Rate, onbAvgRate, fuAvgRate] = await Promise.all([
      getOpenRate('client-onboarding', 1),
      getOpenRate('client-onboarding', 2),
      getOpenRate('client-onboarding', 3),
      getOpenRate('quote-followup', 1),
      getOpenRate('quote-followup', 2),
      getOpenRate('quote-followup', 3),
      getAverageOpenRate('client-onboarding'),
      getAverageOpenRate('quote-followup'),
    ]);

    const sequences: any[] = [
      {
        id: 'client-onboarding',
        name: 'Client Onboarding',
        type: 'built-in' as const,
        trigger: 'When contract is signed',
        active: true,
        steps: [
          { stepNumber: 1, name: 'Welcome & What to Expect', delay: 0, subject: "Welcome! Let's Get Started", sentCount: onboardingEnrollments.filter(e => e.email1SentAt).length, openRate: onb1Rate },
          { stepNumber: 2, name: 'Portal Guide', delay: 2, subject: 'Quick Guide to Your Client Portal', sentCount: onboardingEnrollments.filter(e => e.email2SentAt).length, openRate: onb2Rate },
          { stepNumber: 3, name: 'Project Update Reminder', delay: 7, subject: 'Your Project is Progressing!', sentCount: onboardingEnrollments.filter(e => e.email3SentAt).length, openRate: onb3Rate },
        ],
        stats: {
          enrolled: onboardingEnrollments.length,
          completed: onboardingEnrollments.filter(e => e.completed).length,
          active: onboardingEnrollments.filter(e => !e.completed && !e.stoppedAt).length,
          averageOpenRate: onbAvgRate,
        },
      },
      {
        id: 'quote-followup',
        name: 'Quote Follow-Up',
        type: 'built-in' as const,
        trigger: 'When quote is sent',
        active: true,
        steps: [
          { stepNumber: 1, name: 'Gentle Reminder', delay: 3, subject: 'Following up on your quote', sentCount: followUpEnrollments.filter(e => e.email1SentAt).length, openRate: fu1Rate },
          { stepNumber: 2, name: 'Answer Questions', delay: 7, subject: 'Any questions about your quote?', sentCount: followUpEnrollments.filter(e => e.email2SentAt).length, openRate: fu2Rate },
          { stepNumber: 3, name: 'Final Follow-Up', delay: 10, subject: 'Quote expires soon', sentCount: followUpEnrollments.filter(e => e.email3SentAt).length, openRate: fu3Rate },
        ],
        stats: {
          enrolled: followUpEnrollments.length,
          completed: followUpEnrollments.filter(e => e.completed).length,
          active: followUpEnrollments.filter(e => !e.completed && !e.stoppedAt).length,
          averageOpenRate: fuAvgRate,
        },
      },
    ];

    res.json({ sequences });
  } catch (error) {
    console.error('[SEQUENCES DASHBOARD] Error:', error);
    res.status(500).json({ error: 'Failed to load sequences' });
  }
});

// GET /api/sequences/dashboard/stats
router.get('/dashboard/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const onboardingEnrolled = await prisma.clientOnboardingEnrollment.count({
      where: { lead: { assignedToId: userId } },
    });
    const followUpEnrolled = await prisma.quoteFollowUpEnrollment.count({
      where: { quote: { lead: { assignedToId: userId } } },
    });

    // Count individual emails sent this week (each emailNSentAt is one email)
    const onboardingEnrollmentsWeek = await prisma.clientOnboardingEnrollment.findMany({
      where: {
        lead: { assignedToId: userId },
        OR: [
          { email1SentAt: { gte: weekAgo } },
          { email2SentAt: { gte: weekAgo } },
          { email3SentAt: { gte: weekAgo } },
        ],
      },
      select: { email1SentAt: true, email2SentAt: true, email3SentAt: true },
    });
    let onboardingEmailCount = 0;
    for (const e of onboardingEnrollmentsWeek) {
      if (e.email1SentAt && e.email1SentAt >= weekAgo) onboardingEmailCount++;
      if (e.email2SentAt && e.email2SentAt >= weekAgo) onboardingEmailCount++;
      if (e.email3SentAt && e.email3SentAt >= weekAgo) onboardingEmailCount++;
    }

    const followUpEnrollmentsWeek = await prisma.quoteFollowUpEnrollment.findMany({
      where: {
        quote: { lead: { assignedToId: userId } },
        OR: [
          { email1SentAt: { gte: weekAgo } },
          { email2SentAt: { gte: weekAgo } },
          { email3SentAt: { gte: weekAgo } },
        ],
      },
      select: { email1SentAt: true, email2SentAt: true, email3SentAt: true },
    });
    let followUpEmailCount = 0;
    for (const e of followUpEnrollmentsWeek) {
      if (e.email1SentAt && e.email1SentAt >= weekAgo) followUpEmailCount++;
      if (e.email2SentAt && e.email2SentAt >= weekAgo) followUpEmailCount++;
      if (e.email3SentAt && e.email3SentAt >= weekAgo) followUpEmailCount++;
    }

    // Both built-in sequences are always active (no toggle persistence yet)
    const activeSequences = 2;

    res.json({
      totalSequences: 2,
      activeSequences,
      emailsSentThisWeek: onboardingEmailCount + followUpEmailCount,
      totalEnrolled: onboardingEnrolled + followUpEnrolled,
    });
  } catch (error) {
    console.error('[SEQUENCES STATS] Error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// PATCH /api/sequences/dashboard/:id/toggle
router.patch('/dashboard/:id/toggle', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { active: _active } = req.body;

    if (id === 'client-onboarding') {
      // For now, just acknowledge — actual toggle logic can be added when preferences are stored

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Sequence not found or cannot be toggled' });
    }
  } catch (error) {
    console.error('[SEQUENCES TOGGLE] Error:', error);
    res.status(500).json({ error: 'Failed to toggle sequence' });
  }
});

// GET /api/sequences/:id/enrollments — for detail modal
router.get('/:seqId/enrollments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { seqId } = req.params;

    if (seqId === 'client-onboarding') {
      const enrollments = await prisma.clientOnboardingEnrollment.findMany({
        where: { lead: { assignedToId: userId } },
        include: { lead: { select: { clientName: true } } },
        orderBy: { enrolledAt: 'desc' },
        take: 50,
      });

      const formatted = enrollments.map(e => {
        let nextEmailDate: string | null = null;
        if (!e.completed && !e.stoppedAt) {
          if (e.currentStep === 1 && e.email1SentAt) {
            nextEmailDate = new Date(e.email1SentAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
          } else if (e.currentStep === 2 && e.enrolledAt) {
            nextEmailDate = new Date(e.enrolledAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          }
        }
        return {
          id: e.id,
          clientName: e.lead.clientName,
          enrolledAt: e.enrolledAt.toISOString(),
          currentStep: e.currentStep,
          nextEmailDate,
          completed: e.completed,
        };
      });

      res.json({ enrollments: formatted });
    } else if (seqId === 'quote-followup') {
      const enrollments = await prisma.quoteFollowUpEnrollment.findMany({
        where: { quote: { lead: { assignedToId: userId } } },
        include: { quote: { include: { lead: { select: { clientName: true } } } } },
        orderBy: { enrolledAt: 'desc' },
        take: 50,
      });
      const formatted = enrollments.map(e => {
        let nextEmailDate: string | null = null;
        if (!e.completed && !e.stoppedAt) {
          if (e.currentStep === 0) {
            nextEmailDate = new Date(e.enrolledAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
          } else if (e.currentStep === 1 && e.email1SentAt) {
            nextEmailDate = new Date(e.email1SentAt.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();
          } else if (e.currentStep === 2 && e.email2SentAt) {
            nextEmailDate = new Date(e.email2SentAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
          }
        }
        return {
          id: e.id,
          clientName: e.quote.lead.clientName,
          enrolledAt: e.enrolledAt.toISOString(),
          currentStep: e.currentStep,
          nextEmailDate,
          completed: e.completed,
        };
      });
      res.json({ enrollments: formatted });
    } else {
      // Custom sequence enrollments
      const seqId = req.params.seqId as string;
      const enrollments = await prisma.sequenceEnrollment.findMany({
        where: { sequenceId: seqId },
        include: { lead: { select: { clientName: true, assignedToId: true } } },
        orderBy: { enrolledAt: 'desc' },
        take: 50,
      });
      const filtered = enrollments.filter(e => e.lead.assignedToId === userId);
      res.json({
        enrollments: filtered.map(e => ({
          id: e.id,
          clientName: e.lead.clientName,
          enrolledAt: e.enrolledAt.toISOString(),
          currentStep: e.currentStep,
          nextEmailDate: e.nextEmailAt?.toISOString() || null,
          completed: e.status === 'COMPLETED',
        })),
      });
    }
  } catch (error) {
    console.error('[SEQUENCES ENROLLMENTS] Error:', error);
    res.status(500).json({ error: 'Failed to load enrollments' });
  }
});

// GET /api/sequences/:seqId/steps/:stepNumber/preview
router.get('/:seqId/steps/:stepNumber/preview', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { seqId } = req.params;
    const stepNum = parseInt(req.params.stepNumber as string, 10) as 1 | 2 | 3;

    if (seqId === 'client-onboarding' && [1, 2, 3].includes(stepNum)) {
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { firstName: true, studioName: true } });
      const creativeName = user?.studioName || user?.firstName || 'Your Studio';

      const previews: Record<number, { subject: string; html: string }> = {
        1: {
          subject: "Welcome! Let's Get Started on Your Project",
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Welcome to Your Project!</h1>
            </div>
            <div style="padding: 24px; background: white;">
              <p style="color: #374151; font-size: 15px;">Hi [Client Name],</p>
              <p style="color: #374151; font-size: 15px;">I'm excited to work with you on your project. Here's what to expect:</p>
              <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px; margin: 16px 0; border-radius: 6px;">
                <ul style="margin: 0; padding-left: 18px; color: #4b5563; line-height: 1.8;">
                  <li>I'll start working right away</li>
                  <li>Updates through your client portal</li>
                  <li>Message me anytime with questions</li>
                  <li>Notification when files are ready</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="#" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Open Your Portal →</a>
              </div>
              <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px;">Questions? Just reply!<br><strong>${creativeName}</strong></p>
            </div></div>`,
        },
        2: {
          subject: 'Quick Guide to Your Client Portal',
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Your Client Portal Guide</h1>
            </div>
            <div style="padding: 24px; background: white;">
              <p style="color: #374151; font-size: 15px;">Hi [Client Name],</p>
              <p style="color: #374151; font-size: 15px;">Your client portal has everything you need:</p>
              <div style="margin: 16px 0;">
                <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 8px; border-radius: 6px;">
                  <strong style="color: #1e40af;">Send Messages</strong><br><span style="color: #475569; font-size: 13px;">Ask questions, share ideas anytime</span>
                </div>
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; margin-bottom: 8px; border-radius: 6px;">
                  <strong style="color: #065f46;">View Files</strong><br><span style="color: #475569; font-size: 13px;">Download files when ready</span>
                </div>
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 8px; border-radius: 6px;">
                  <strong style="color: #92400e;">Track Progress</strong><br><span style="color: #475569; font-size: 13px;">See timeline and milestones</span>
                </div>
                <div style="background: #fce7f3; border-left: 4px solid #ec4899; padding: 12px; border-radius: 6px;">
                  <strong style="color: #9f1239;">Manage Payments</strong><br><span style="color: #475569; font-size: 13px;">View invoices and history</span>
                </div>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="#" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Explore Your Portal →</a>
              </div>
              <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px;">Need help? I'm here!<br><strong>${creativeName}</strong></p>
            </div></div>`,
        },
        3: {
          subject: 'Your Project is Progressing!',
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Your Project is Underway!</h1>
            </div>
            <div style="padding: 24px; background: white;">
              <p style="color: #374151; font-size: 15px;">Hi [Client Name],</p>
              <p style="color: #374151; font-size: 15px;">Great news! Work on your project is progressing well.</p>
              <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 20px; margin: 16px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">On track for timely delivery!</p>
              </div>
              <p style="color: #374151;"><strong>What you can do:</strong></p>
              <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
                <li>Check portal for updates</li>
                <li>Send me a message</li>
                <li>Review shared files</li>
                <li>Stay tuned for delivery!</li>
              </ul>
              <div style="text-align: center; margin: 24px 0;">
                <a href="#" style="display: inline-block; background: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Check Status →</a>
              </div>
              <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px;">Thank you!<br><strong>${creativeName}</strong></p>
            </div></div>`,
        },
      };

      const preview = previews[stepNum];
      if (preview) {
        res.json(preview);
      } else {
        res.status(404).json({ error: 'Step not found' });
      }
    } else if (seqId === 'quote-followup' && [1, 2, 3].includes(stepNum)) {
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { firstName: true, studioName: true, currencySymbol: true } });
      const creativeName = user?.studioName || user?.firstName || 'Your Studio';
      const sym = user?.currencySymbol || '$';

      const qpreviews: Record<number, { subject: string; html: string }> = {
        1: {
          subject: 'Following up on your quote',
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Just Following Up</h1></div>
            <div style="padding: 24px; background: white;">
              <p style="color: #374151;">Hi [Client Name],</p>
              <p style="color: #374151;">I wanted to follow up on the quote I sent for your project.</p>
              <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 6px;">
                <p style="margin: 0; color: #1e40af; font-size: 20px; font-weight: 700;">${sym}2,500.00</p>
                <p style="margin: 4px 0 0; color: #475569; font-size: 13px;">Sample Quote Amount</p></div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="#" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Review Your Quote</a></div>
              <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px;"><strong>${creativeName}</strong></p>
            </div></div>`,
        },
        2: {
          subject: 'Any questions about your quote?',
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Any Questions?</h1></div>
            <div style="padding: 24px; background: white;">
              <p style="color: #374151;">Hi [Client Name],</p>
              <p style="color: #374151;">I haven't heard back about your quote yet.</p>
              <div style="background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 16px; margin: 16px 0; border-radius: 6px;">
                <strong style="color: #6b21a8;">Common Questions:</strong>
                <ul style="color: #4b5563; padding-left: 18px; line-height: 1.8;"><li>Can the timeline be adjusted?</li><li>Are payment plans available?</li><li>What's included?</li></ul></div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="#" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Quote & Ask Questions</a></div>
              <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px;"><strong>${creativeName}</strong></p>
            </div></div>`,
        },
        3: {
          subject: 'Your quote expires soon',
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Final Follow-Up</h1></div>
            <div style="padding: 24px; background: white;">
              <p style="color: #374151;">Hi [Client Name],</p>
              <p style="color: #374151;">This is my final follow-up regarding your project quote.</p>
              <div style="background: #fffbeb; border: 2px solid #f59e0b; padding: 20px; margin: 16px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">Quote expires in 7 days</p>
                <p style="margin: 8px 0 0; color: #78350f; font-size: 13px;">${sym}2,500.00 for Sample Project</p></div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="#" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Accept Quote Now</a></div>
              <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px;"><strong>${creativeName}</strong></p>
            </div></div>`,
        },
      };

      const qpreview = qpreviews[stepNum];
      if (qpreview) {
        res.json(qpreview);
      } else {
        res.status(404).json({ error: 'Step not found' });
      }
    } else {
      res.status(404).json({ error: 'Preview not available for this sequence' });
    }
  } catch (error) {
    console.error('[SEQUENCES PREVIEW] Error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// ── Original CRUD endpoints ──────────────────────────────
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
