import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { SERVICE_TYPE_LABELS, sendNewLeadNotification, sendStatusChangeNotification, sendPortalLinkEmail, sendAutoResponseEmail, sendDeliveryNotificationEmail, sendTestimonialRequestEmail, sendInquiryAcknowledgementEmail, sendCustomEmail } from '../services/email';
import { logActivity } from './activities';
import { uploadFile, ensureBucketExists } from '../services/storage';
import { paymentService } from '../services/paymentService';
import { logAudit, AUDIT_ACTIONS } from '../services/auditService';
import { stopOnboardingForLead } from '../services/onboardingService';
import multer from 'multer';

const router = Router();
import prisma from '../lib/prisma';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
// iter 293-v3a.1 — bulk email attachments: 25MB per file, 10 files max, ~25MB combined
// (Resend caps at 40MB total per email; 25MB gives a safety margin).
const bulkEmailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
});

// ---- Helpers ----

function getIndustryCategory(industry: string | null | undefined): 'PHOTOGRAPHY' | 'ART' | 'DESIGN' {
  switch (industry) {
    case 'PHOTOGRAPHY': case 'VIDEOGRAPHY': case 'CONTENT_CREATION': return 'PHOTOGRAPHY';
    case 'FINE_ART': case 'ILLUSTRATION': case 'SCULPTURE': return 'ART';
    default: return 'DESIGN';
  }
}

async function sendAutoResponse(lead: any) {
  try {
    const user = lead.assignedToId
      ? await prisma.user.findUnique({ where: { id: lead.assignedToId } })
      : null;
    if (!user) return;

    const cat = getIndustryCategory(user.primaryIndustry);
    const msgs: Record<string, { greeting: string; next: string; portfolio: string }> = {
      PHOTOGRAPHY: {
        greeting: 'Thanks so much for reaching out about photography!',
        next: "I'll review your inquiry and send you a custom quote within 24 hours.",
        portfolio: 'In the meantime, check out my recent work:',
      },
      ART: {
        greeting: 'Thanks for your interest in commissioning a piece!',
        next: "I'll review your vision and send you a proposal within 24 hours.",
        portfolio: 'You can see more of my work here:',
      },
      DESIGN: {
        greeting: 'Thanks for reaching out about your design project!',
        next: "I'll review your requirements and send you a proposal within 24 hours.",
        portfolio: 'Check out some of my recent projects:',
      },
    };
    const m = msgs[cat];
    const portfolioUrl = `${process.env.FRONTEND_URL}/portfolio/${user.id}`;
    const message = `${m.greeting}\n\n${m.next}\n\n${m.portfolio}\n${portfolioUrl}\n\nI'm excited to potentially work with you!`;

    await sendAutoResponseEmail({
      clientName: lead.clientName,
      clientEmail: lead.clientEmail ?? '',
      creativeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      studioName: user.studioName || undefined,
      message,
      portalUrl: portfolioUrl,
    });

    await logActivity(lead.id, null, 'EMAIL_SENT', `Auto-response sent to ${lead.clientEmail ?? ''}`, { emailType: 'auto_response' });
  } catch (err) {
    console.error('[AutoResponse] Error:', err);
  }
}

// POST /api/leads/upload-cover - Upload cover image for a lead
router.post('/upload-cover', authMiddleware, upload.single('coverImage'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    await ensureBucketExists();
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'cover-images'
    );

    if (!result) {
      res.status(500).json({ error: 'Failed to upload image' });
      return;
    }

    res.json({ url: result.url, path: result.path });
  } catch (error) {
    console.error('Cover image upload error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to upload cover image' });
  }
});

// GET /api/leads - Get all leads for authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const sort = req.query.sort as string | undefined;
    const projectType = req.query.projectType as string | undefined;
    const industry = req.query.industry as string | undefined;
    
    // Only show leads assigned to the authenticated user
    const where: any = { assignedToId: userId };
    
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (projectType) {
      where.projectType = projectType;
    }

    if (industry) {
      where.industry = industry;
    }
    
    if (search) {
      // Combine with existing OR condition using AND
      where.AND = {
        OR: [
          { clientName: { contains: search, mode: 'insensitive' } },
          { clientEmail: { contains: search, mode: 'insensitive' } },
          { projectTitle: { contains: search, mode: 'insensitive' } },
        ]
      };
    }
    
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        clientCompany: true,
        serviceType: true,
        projectTitle: true,
        description: true,
        budget: true,
        timeline: true,
        eventDate: true,
        status: true,
        priority: true,
        source: true,
        estimatedValue: true,
        tags: true,
        portalToken: true,
        portalViews: true,
        lastPortalView: true,
        createdAt: true,
        updatedAt: true,
        assignedToId: true,
        projectType: true,
        industry: true,
        deliverableType: true,
        coverImage: true,
        isDemoData: true,
        _count: {
          select: {
            quotes: true,
            contracts: true,
          },
        },
      }
    });

    // Flatten _count into quotesCount/contractsCount for frontend
    const leadsWithCounts = leads.map(({ _count, ...lead }) => ({
      ...lead,
      quotesCount: _count.quotes,
      contractsCount: _count.contracts,
    }));

    res.json({ leads: leadsWithCounts, count: leadsWithCounts.length });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch leads' });
  }
});

// GET /api/leads/stats - Get lead statistics for dashboard
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const statsWhere = { assignedToId: userId };
    
    const [total, byStatus, recentLeads] = await Promise.all([
      prisma.lead.count({ where: statsWhere }),
      prisma.lead.groupBy({
        by: ['status'],
        where: statsWhere,
        _count: { status: true }
      }),
      prisma.lead.findMany({
        where: statsWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          clientName: true,
          projectTitle: true,
          status: true,
          createdAt: true,
        }
      })
    ]);

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      total,
      statusCounts,
      recentLeads,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch stats' });
  }
});

// GET /api/leads/calendar/events - Get leads for calendar view
router.get('/calendar/events', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { start, end } = req.query;

    // Parse date range if provided
    const startDate = start ? new Date(start as string) : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const endDate = end ? new Date(end as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);

    const leads = await prisma.lead.findMany({
      where: { 
        assignedToId: userId,
        AND: {
          OR: [
            // Leads with event dates in range
            {
              eventDate: {
                gte: startDate,
                lte: endDate,
              }
            },
            // Leads created in range (for reference)
            {
              createdAt: {
                gte: startDate,
                lte: endDate,
              }
            },
            // Leads with convertedAt in range
            {
              convertedAt: {
                gte: startDate,
                lte: endDate,
              }
            },
          ]
        }
      },
      select: {
        id: true,
        clientName: true,
        projectTitle: true,
        serviceType: true,
        status: true,
        eventDate: true,
        createdAt: true,
        convertedAt: true,
        estimatedValue: true,
        actualValue: true,
      },
      orderBy: { eventDate: 'asc' },
    });

    // Transform to calendar events
    const events = leads.flatMap(lead => {
      const evts = [];
      
      // Event date (main event - wedding, shoot, etc.)
      if (lead.eventDate) {
        evts.push({
          id: `${lead.id}-event`,
          leadId: lead.id,
          title: lead.projectTitle || lead.clientName,
          date: lead.eventDate,
          type: 'event',
          status: lead.status,
          serviceType: lead.serviceType,
          value: lead.status === 'BOOKED' ? lead.actualValue : lead.estimatedValue,
          clientName: lead.clientName,
        });
      }
      
      // Created date (inquiry received)
      if (lead.createdAt) {
        evts.push({
          id: `${lead.id}-created`,
          leadId: lead.id,
          title: `New: ${lead.clientName}`,
          date: lead.createdAt,
          type: 'inquiry',
          status: lead.status,
          serviceType: lead.serviceType,
          clientName: lead.clientName,
        });
      }
      
      // Booking date (converted)
      if (lead.convertedAt && lead.status === 'BOOKED') {
        evts.push({
          id: `${lead.id}-booked`,
          leadId: lead.id,
          title: `Booked: ${lead.projectTitle || lead.clientName}`,
          date: lead.convertedAt,
          type: 'booking',
          status: lead.status,
          serviceType: lead.serviceType,
          value: lead.actualValue,
          clientName: lead.clientName,
        });
      }
      
      return evts;
    });

    res.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch calendar events' });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        assignedToId: userId
      },
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    res.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch lead' });
  }
});

// POST /api/leads - Create new lead (authenticated - manual creation)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const {
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      serviceType,
      projectTitle,
      description,
      budget,
      timeline,
      eventDate,
      priority,
      source,
      estimatedValue,
      tags,
      projectType,
      industry,
      deliverableType,
      coverImage,
    } = req.body;

    // Validation
    if (!clientName || !clientEmail || !serviceType || !projectTitle || !description) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Client name, email, service type, project title, and description are required'
      });
      return;
    }

    // AUDIT FIX [7.4]: Input max-length validation
    const MAX_LENGTHS: Record<string, number> = { clientName: 200, projectTitle: 200, description: 5000, clientCompany: 200, serviceType: 100, budget: 100, timeline: 200 }
    for (const [field, max] of Object.entries(MAX_LENGTHS)) {
      const val = req.body[field]
      if (val && typeof val === 'string' && val.length > max) {
        res.status(400).json({ error: 'Validation Error', message: `${field} cannot exceed ${max} characters` })
        return
      }
    }

    // iter 293-v3b — Industry auto-populate on new leads: fall back to
    // creator's user.primaryIndustry when not explicitly provided. Override
    // always wins if creator passes industry in the request body.
    let effectiveIndustry = industry ?? null;
    if (!effectiveIndustry) {
      const creator = await prisma.user.findUnique({
        where: { id: userId },
        select: { primaryIndustry: true },
      });
      effectiveIndustry = creator?.primaryIndustry ?? null;
    }

    const lead = await prisma.lead.create({
      data: {
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        serviceType,
        projectTitle,
        description,
        budget,
        timeline,
        eventDate: eventDate ? new Date(eventDate) : null,
        priority: priority || 'MEDIUM',
        source: source || 'WEBSITE',
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        tags: tags || [],
        assignedToId: userId,
        status: 'NEW',
        projectType: projectType || 'SERVICE',
        industry: effectiveIndustry,
        deliverableType: deliverableType || 'DIGITAL_FILES',
        coverImage: coverImage || null,
      },
    });

    // Log activity for manual lead creation
    await logActivity(
      lead.id,
      userId,
      'NOTE_ADDED',
      `Lead created manually for ${clientName}`,
      { source: 'manual', serviceType }
    );

    // Send auto-response and notification emails (non-blocking)
    sendAutoResponse(lead).catch(err => console.error('Auto-response error:', err));
    sendNewLeadNotification({
      clientName, clientEmail, clientPhone, clientCompany, serviceType,
      projectTitle, description, budget, timeline, leadId: lead.id,
      portalToken: lead.portalToken,
    }).catch(err => console.error('Owner notification error:', err));

    res.status(201).json({ message: 'Lead created successfully', lead });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create lead' });
  }
});

// POST /api/leads/submit - Public lead submission (no auth required)
router.post('/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      serviceType,
      projectType,
      projectTitle,
      description,
      budget,
      timeline,
      eventDate,
      source,
      studioId,
    } = req.body;

    // Validation
    if (!clientName || !clientEmail || !serviceType || !projectTitle || !description) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Please enter a valid email address'
      });
      return;
    }

    // If studioId provided, verify user exists, otherwise assign to first owner
    let assignedToId = studioId || null;
    if (studioId) {
      const user = await prisma.user.findUnique({ where: { id: studioId } });
      if (!user) {
        assignedToId = null;
      }
    }
    
    // If no studioId, assign to the primary owner account
    if (!assignedToId) {
      // Try to find the primary owner by email, fallback to first OWNER
      const defaultOwner = await prisma.user.findFirst({
        where: { 
          OR: [
            { email: 'emmanuelobokoh03@gmail.com' },
            { role: 'OWNER' }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
      if (defaultOwner) {
        assignedToId = defaultOwner.id;
      }
    }

    // iter 293-v3b — Auto-populate industry from assigned creator's
    // primaryIndustry for public inquiry submissions (creator can override
    // by editing the lead after receipt).
    let publicInquiryIndustry: string | null = null;
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { primaryIndustry: true },
      });
      publicInquiryIndustry = assignee?.primaryIndustry ?? null;
    }

    const lead = await prisma.lead.create({
      data: {
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        serviceType,
        projectType: projectType || 'SERVICE',
        projectTitle,
        description,
        budget,
        timeline,
        eventDate: eventDate ? new Date(eventDate) : null,
        source: source || 'WEBSITE',
        assignedToId,
        status: 'NEW',
        priority: 'MEDIUM',
        industry: publicInquiryIndustry as any,
      },
    });

    // Log activity for public submission
    await logActivity(
      lead.id,
      null, // No user for public submissions
      'NOTE_ADDED',
      `New inquiry submitted via website by ${clientName}`,
      { source: 'website_form', serviceType, clientEmail }
    );

    // Send email notifications (non-blocking)
    const leadData = {
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      serviceType,
      projectTitle,
      description,
      budget,
      timeline,
      leadId: lead.id,
      portalToken: lead.portalToken, // Include portal token for client email
    };

    // Send emails in background and log activities
    sendNewLeadNotification(leadData)
      .then(success => {
        if (success) {
          logActivity(
            lead.id,
            null,
            'EMAIL_SENT',
            `New lead notification sent to studio owner`,
            { emailType: 'owner_notification', clientName, projectTitle }
          ).catch(() => {});
        }
      })
      .catch(err => console.error('Owner notification error:', err));

    // Industry-adaptive inquiry acknowledgement (from studio, not KOLOR)
    if (assignedToId) {
      prisma.user.findUnique({
        where: { id: assignedToId },
        select: { studioName: true, firstName: true, industry: true },
      }).then(assignedUser => {
        if (assignedUser) {
          sendInquiryAcknowledgementEmail({
            clientName,
            clientEmail,
            projectTitle,
            studioName: assignedUser.studioName || assignedUser.firstName,
            industry: assignedUser.industry,
            portalToken: lead.portalToken,
            // iter 264: enrichment for consolidated single-email inquiry response
            serviceLabel: SERVICE_TYPE_LABELS[serviceType] || serviceType,
            budget: budget ?? null,
            timeline: timeline ?? null,
            portfolioUrl: `${process.env.FRONTEND_URL || 'https://kolorstudio.app'}/portfolio/${assignedToId}`,
          }).catch(err => console.error('[LEADS] Inquiry acknowledgement email failed (non-blocking):', err));
        }
      }).catch(err => console.error('[LEADS] Failed to fetch assigned user for acknowledgement:', err));
    }

    res.status(201).json({ 
      message: 'Thank you! Your inquiry has been submitted successfully.',
      leadId: lead.id 
    });
  } catch (error) {
    console.error('Submit lead error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to submit inquiry' });
  }
});

// PATCH /api/leads/:id - Update lead
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const updates = req.body;

    // Check ownership
    const existingLead = await prisma.lead.findFirst({
      where: { id, assignedToId: userId }
    });

    if (!existingLead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const oldStatus = existingLead.status;

    // Handle status change timestamps
    const data: any = { ...updates };
    if (updates.status === 'BOOKED' && existingLead.status !== 'BOOKED') {
      data.convertedAt = new Date();
    }
    if (updates.status === 'LOST' && existingLead.status !== 'LOST') {
      data.lostAt = new Date();
    }
    if (updates.eventDate) {
      data.eventDate = new Date(updates.eventDate);
    }
    if (updates.estimatedValue) {
      data.estimatedValue = parseFloat(updates.estimatedValue);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    // Send notification if status changed via edit
    if (updates.status && oldStatus !== updates.status) {
      // WS5: Auto-stop onboarding sequences when lead is LOST
      if (updates.status === 'LOST') {
        stopOnboardingForLead(id, 'lead_lost').catch(err => console.error('[AutoStop] Onboarding stop error:', err));
      }
      if (updates.status === 'BOOKED') {
        stopOnboardingForLead(id, 'lead_booked').catch(err => console.error('[AutoStop] Onboarding stop error:', err));
      }

      sendStatusChangeNotification({
        clientName: existingLead.clientName,
        clientEmail: existingLead.clientEmail ?? '',
        projectTitle: existingLead.projectTitle,
        newStatus: updates.status,
        portalToken: existingLead.portalToken,
      })
        .then(success => {
          if (success) {
            logActivity(
              id,
              userId,
              'EMAIL_SENT',
              `Status update notification sent to ${existingLead.clientEmail}`,
              { emailType: 'status_notification', newStatus: updates.status }
            ).catch(() => {});
          }
        })
        .catch(err => console.error('Status notification error:', err));
    }

    res.json({ message: 'Lead updated successfully', lead });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update lead' });
  }
});

// PATCH /api/leads/:id/status - Quick status update (for Kanban drag)
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED', 'LOST'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Validation Error', message: 'Invalid status' });
      return;
    }
    // Check ownership
    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        assignedToId: userId
      }
    });

    if (!existingLead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const oldStatus = existingLead.status;
    const data: any = { status };
    if (status === 'BOOKED' && existingLead.status !== 'BOOKED') {
      data.convertedAt = new Date();
    }
    if (status === 'LOST' && existingLead.status !== 'LOST') {
      data.lostAt = new Date();
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    // Log activity and send notification for status change
    if (oldStatus !== status) {
      await logActivity(
        id,
        userId,
        'STATUS_CHANGED',
        `Status changed from ${oldStatus} to ${status}`,
        { oldStatus, newStatus: status }
      );

      // WS5: Auto-stop onboarding sequences when lead is LOST or BOOKED
      if (status === 'LOST') {
        stopOnboardingForLead(id, 'lead_lost').catch(err => console.error('[AutoStop] Onboarding stop error:', err));
      }
      if (status === 'BOOKED') {
        stopOnboardingForLead(id, 'lead_booked').catch(err => console.error('[AutoStop] Onboarding stop error:', err));
      }

      // Send email notification to client (non-blocking)
      sendStatusChangeNotification({
        clientName: existingLead.clientName,
        clientEmail: existingLead.clientEmail ?? '',
        projectTitle: existingLead.projectTitle,
        newStatus: status,
        portalToken: existingLead.portalToken,
      })
        .then(success => {
          if (success) {
            logActivity(
              id,
              userId,
              'EMAIL_SENT',
              `Status update notification sent to ${existingLead.clientEmail}`,
              { emailType: 'status_notification', newStatus: status }
            ).catch(() => {});
          }
        })
        .catch(err => console.error('Status notification error:', err));
    }

    // Schedule testimonial request for 3 days after project is booked/completed
    if (status === 'BOOKED' && oldStatus !== 'BOOKED') {
      try {
        const threeDaysLater = new Date();
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);
        await prisma.scheduledEmail.create({
          data: { leadId: id, type: 'TESTIMONIAL_REQUEST', scheduledFor: threeDaysLater },
        });
        console.log(`[SCHEDULED] Testimonial request for ${existingLead.clientEmail} in 3 days`);
      } catch (schedErr) {
        console.error('[SCHEDULED] Failed to schedule testimonial request:', schedErr);
      }
    }

    res.json({ message: 'Status updated', lead });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update status' });
  }
});

// POST /api/leads/:id/send-portal-link - Send portal link email to client
router.post('/:id/send-portal-link', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    // Check ownership
    const lead = await prisma.lead.findFirst({
      where: { id, assignedToId: userId }
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    if (!lead.portalToken) {
      res.status(400).json({ error: 'Bad Request', message: 'Lead does not have a portal token' });
      return;
    }

    // Send the portal link email
    const success = await sendPortalLinkEmail({
      clientName: lead.clientName,
      clientEmail: lead.clientEmail ?? '',
      projectTitle: lead.projectTitle,
      portalToken: lead.portalToken,
    });

    // Log the activity regardless of email success
    await logActivity(
      id,
      userId,
      'EMAIL_SENT',
      `Portal link email ${success ? 'sent' : 'attempted'} to ${lead.clientEmail ?? ''}`,
      { emailType: 'portal_link', clientEmail: lead.clientEmail ?? '', success }
    );

    if (!success) {
      // Email failed but we still log the attempt
      res.status(200).json({ 
        message: 'Email could not be sent (Resend domain not verified for production emails)',
        sentTo: lead.clientEmail ?? '',
        warning: 'In test mode, emails can only be sent to the owner email. Verify your domain at resend.com for production.'
      });
      return;
    }

    res.json({ 
      message: 'Portal link sent successfully',
      sentTo: lead.clientEmail ?? '' 
    });
  } catch (error) {
    console.error('Send portal link error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to send portal link' });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    // Check ownership
    const existingLead = await prisma.lead.findFirst({
      where: { id, assignedToId: userId }
    });

    if (!existingLead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    await prisma.lead.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId,
      action: AUDIT_ACTIONS.DELETE_LEAD,
      entity: 'Lead',
      entityId: id,
      metadata: { clientName: existingLead.clientName, projectTitle: existingLead.projectTitle },
      req,
    });

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete lead' });
  }
});

// POST /api/leads/:id/send-email - Send custom email to client
router.post('/:id/send-email', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const leadId = req.params.id as string;
    const { subject, body, cc, bcc } = req.body;

    // Validate inputs
    if (!subject || !subject.trim()) {
      res.status(400).json({ error: 'Validation Error', message: 'Subject is required' });
      return;
    }

    if (!body || body.replace(/<[^>]*>/g, '').trim().length < 10) {
      res.status(400).json({ error: 'Validation Error', message: 'Message must be at least 10 characters' });
      return;
    }

    // Check ownership and get lead details
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        assignedToId: userId
      }
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    // Get user details for email signature
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        studioName: true,
        email: true,
        phone: true,
      }
    });

    // Send email via Resend
    try {
      const { sendCustomEmail } = await import('../services/email');
      await sendCustomEmail({
        to: lead.clientEmail ?? '',
        subject: subject.trim(),
        htmlBody: body,
        cc: cc?.trim() || undefined,
        bcc: bcc?.trim() || undefined,
        fromName: user?.studioName || `${user?.firstName} ${user?.lastName}`,
        replyTo: user?.email,
      });
    } catch (emailError) {
      console.error('Failed to send custom email:', emailError);
      res.status(500).json({ error: 'Email Error', message: 'Failed to send email. Please try again.' });
      return;
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'EMAIL_SENT',
        description: `Email sent to client: ${subject.trim()}`,
        leadId,
        userId,
        metadata: { 
          subject: subject.trim(),
          cc: cc?.trim() || null,
          bcc: bcc?.trim() || null
        }
      }
    });

    // Update lead last contact timestamp
    await prisma.lead.update({
      where: { id: leadId },
      data: { updatedAt: new Date() }
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to send email' });
  }
});

// ==========================================
// MILESTONE ENDPOINTS
// ==========================================

// GET /api/leads/:id/timeline - Unified client timeline event feed (Phase 3)
router.get('/:id/timeline', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.id as string;

    const [lead, quotes, contracts] = await Promise.all([
      prisma.lead.findFirst({
        where: { id: leadId, assignedToId: req.userId! },
        select: {
          id: true, status: true, clientName: true, projectType: true,
          projectTitle: true, estimatedValue: true, keyDate: true, eventDate: true,
          createdAt: true, discoveryCallScheduled: true, discoveryCallCompletedAt: true,
          pipelineStatus: true,
        },
      }),
      prisma.quote.findMany({
        where: { leadId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, status: true, total: true, createdAt: true, sentAt: true, viewedAt: true, acceptedAt: true, validUntil: true, quoteNumber: true },
      }),
      prisma.contract.findMany({
        where: { leadId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, status: true, title: true, createdAt: true, sentAt: true, clientAgreed: true, clientAgreedAt: true },
      }),
    ]);

    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    type EventStatus = 'done' | 'active' | 'pending';
    interface TimelineEvent {
      id: string;
      type: string;
      date: Date | null;
      status: EventStatus;
      label: string;
      sublabel?: string;
      actionLabel?: string;
      actionRoute?: string;
    }

    const events: TimelineEvent[] = [];
    const now = new Date();

    // 1. Inquiry received
    events.push({
      id: `inquiry-${lead.id}`,
      type: 'INQUIRY_RECEIVED',
      date: lead.createdAt,
      status: 'done',
      label: 'Inquiry received',
      sublabel: new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });

    // 2. Discovery call events
    if (lead.discoveryCallScheduled) {
      events.push({
        id: `discovery-scheduled-${lead.id}`,
        type: 'DISCOVERY_SCHEDULED',
        date: lead.createdAt,
        status: lead.discoveryCallCompletedAt ? 'done' : 'active',
        label: 'Discovery call scheduled',
        sublabel: lead.discoveryCallCompletedAt ? 'Completed' : 'Upcoming',
        actionLabel: lead.discoveryCallCompletedAt ? undefined : 'Mark complete',
        actionRoute: lead.discoveryCallCompletedAt ? undefined : 'pipeline',
      });
    }

    if (lead.discoveryCallCompletedAt) {
      events.push({
        id: `discovery-completed-${lead.id}`,
        type: 'DISCOVERY_COMPLETED',
        date: lead.discoveryCallCompletedAt,
        status: 'done',
        label: 'Discovery call completed',
      });
    }

    // 3. Quotes
    for (const quote of quotes) {
      const qNum = quote.quoteNumber ? `#${quote.quoteNumber}` : quote.id.slice(-4).toUpperCase();
      const value = quote.total ? ` · $${quote.total.toLocaleString()}` : '';

      if (quote.sentAt) {
        const isExpired = quote.validUntil && new Date(quote.validUntil) < now && quote.status !== 'ACCEPTED';
        const quoteStatus: EventStatus = quote.status === 'ACCEPTED' ? 'done' : isExpired ? 'active' : (quote.status === 'SENT' || quote.status === 'VIEWED') ? 'active' : 'done';
        events.push({
          id: `quote-sent-${quote.id}`,
          type: 'QUOTE_SENT',
          date: quote.sentAt,
          status: quoteStatus,
          label: `Offer sent ${qNum}${value}`,
          sublabel: quote.status === 'ACCEPTED' ? `Accepted ${quote.acceptedAt ? new Date(quote.acceptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}` : quote.status === 'VIEWED' ? 'Viewed — awaiting decision' : isExpired ? 'Expired — consider resending' : 'Sent — awaiting response',
          actionLabel: (quote.status === 'SENT' || quote.status === 'VIEWED') ? 'Follow up' : undefined,
          actionRoute: 'pipeline',
        });
      }

      if (quote.status === 'ACCEPTED' && quote.acceptedAt) {
        events.push({
          id: `quote-accepted-${quote.id}`,
          type: 'QUOTE_ACCEPTED',
          date: quote.acceptedAt,
          status: 'done',
          label: `Offer accepted${value}`,
          sublabel: new Date(quote.acceptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    }

    // 4. Contracts
    for (const contract of contracts) {
      if (contract.sentAt) {
        const daysSinceSent = Math.floor((now.getTime() - new Date(contract.sentAt).getTime()) / 86400000);
        const contractStatus: EventStatus = contract.clientAgreed ? 'done' : 'active';
        events.push({
          id: `contract-sent-${contract.id}`,
          type: 'CONTRACT_SENT',
          date: contract.sentAt,
          status: contractStatus,
          label: contract.clientAgreed ? `${contract.title || 'Agreement'} signed` : `${contract.title || 'Agreement'} sent`,
          sublabel: contract.clientAgreed
            ? `Signed ${contract.clientAgreedAt ? new Date(contract.clientAgreedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
            : `Day ${daysSinceSent} — awaiting signature`,
          actionLabel: !contract.clientAgreed ? 'Send reminder' : undefined,
          actionRoute: 'pipeline',
        });
      }

      if (contract.clientAgreed && contract.clientAgreedAt) {
        events.push({
          id: `contract-signed-${contract.id}`,
          type: 'CONTRACT_SIGNED',
          date: contract.clientAgreedAt,
          status: 'done',
          label: 'Contract signed',
          sublabel: new Date(contract.clientAgreedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    }

    // 5. Delivery event
    if (lead.pipelineStatus === 'COMPLETED') {
      events.push({
        id: `delivered-${lead.id}`,
        type: 'DELIVERED',
        date: now,
        status: 'done',
        label: 'Work delivered',
        sublabel: 'Completed',
      });
    }

    // 6. Pending next step
    const STATUS_NEXT_STEPS: Record<string, { type: string; label: string; actionLabel: string; actionRoute: string }> = {
      NEW: { type: 'NEXT_REPLY', label: 'Reply to inquiry', actionLabel: 'Message', actionRoute: 'messages' },
      REVIEWING: { type: 'NEXT_CALL', label: 'Schedule discovery call', actionLabel: 'Schedule', actionRoute: 'overview' },
      CONTACTED: { type: 'NEXT_CALL', label: 'Complete discovery call', actionLabel: 'Mark done', actionRoute: 'overview' },
      QUALIFIED: { type: 'NEXT_QUOTE', label: 'Send offer', actionLabel: 'Send offer', actionRoute: 'pipeline' },
      QUOTED: { type: 'NEXT_FOLLOWUP', label: 'Follow up on offer', actionLabel: 'Follow up', actionRoute: 'pipeline' },
      FINALIZING: { type: 'NEXT_CONTRACT', label: 'Send agreement', actionLabel: 'New contract', actionRoute: 'pipeline' },
      BOOKED: { type: 'NEXT_DELIVERY', label: 'Mark as delivered', actionLabel: 'Mark delivered', actionRoute: 'files' },
    };

    const nextStep = STATUS_NEXT_STEPS[lead.status];
    if (nextStep && lead.pipelineStatus !== 'COMPLETED') {
      events.push({
        id: `next-${lead.id}`,
        type: nextStep.type,
        date: null,
        status: 'pending',
        label: nextStep.label,
        actionLabel: nextStep.actionLabel,
        actionRoute: nextStep.actionRoute,
      });
    }

    // Sort by date ascending (null/pending at end)
    events.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    res.json({ events, leadId: lead.id, generatedAt: now });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});


// GET /api/leads/:id/milestones - Get timeline & milestones for a lead
router.get('/:id/milestones', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.id as string;
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, assignedToId: req.userId! },
      include: {
        milestones: { orderBy: [{ order: 'asc' }, { dueDate: 'asc' }] },
      },
    });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }
    res.json({
      shootingDate: lead.shootingDate,
      editingDeadline: lead.editingDeadline,
      deliveryDate: lead.deliveryDate,
      milestones: lead.milestones,
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/leads/:id/milestones - Create milestone
router.post('/:id/milestones', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.id as string;
    const lead = await prisma.lead.findFirst({ where: { id: leadId, assignedToId: req.userId! } });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    const { name, description, dueDate, order } = req.body;
    if (!name) { res.status(400).json({ error: 'Name is required' }); return; }

    const milestone = await prisma.projectMilestone.create({
      data: { leadId: lead.id, name, description: description || null, dueDate: dueDate ? new Date(dueDate) : null, order: order ?? 0 },
    });

    await logActivity(lead.id, req.userId!, 'NOTE_ADDED', `Milestone added: "${name}"`);
    res.status(201).json({ milestone });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/leads/milestones/:milestoneId - Update milestone
router.patch('/milestones/:milestoneId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const milestoneId = req.params.milestoneId as string;
    const ms = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: { lead: { select: { assignedToId: true, id: true } } },
    });
    if (!ms || ms.lead.assignedToId !== req.userId) { res.status(404).json({ error: 'Milestone not found' }); return; }

    const { name, description, dueDate, completed, order } = req.body;
    const updated = await prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(order !== undefined && { order }),
        ...(completed !== undefined && { completed, completedAt: completed ? new Date() : null }),
      },
    });

    if (completed !== undefined) {
      await logActivity(ms.lead.id, req.userId!, 'NOTE_ADDED', `Milestone ${completed ? 'completed' : 'reopened'}: "${updated.name}"`);
    }
    res.json({ milestone: updated });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/leads/milestones/:milestoneId - Delete milestone
router.delete('/milestones/:milestoneId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const milestoneId = req.params.milestoneId as string;
    const ms = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: { lead: { select: { assignedToId: true } } },
    });
    if (!ms || ms.lead.assignedToId !== req.userId) { res.status(404).json({ error: 'Milestone not found' }); return; }

    await prisma.projectMilestone.delete({ where: { id: milestoneId } });
    res.json({ message: 'Milestone deleted' });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/leads/:id/timeline - Update timeline key dates
router.patch('/:id/timeline', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.id as string;
    const lead = await prisma.lead.findFirst({ where: { id: leadId, assignedToId: req.userId! } });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    const { shootingDate, editingDeadline, deliveryDate } = req.body;
    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        ...(shootingDate !== undefined && { shootingDate: shootingDate ? new Date(shootingDate) : null }),
        ...(editingDeadline !== undefined && { editingDeadline: editingDeadline ? new Date(editingDeadline) : null }),
        ...(deliveryDate !== undefined && { deliveryDate: deliveryDate ? new Date(deliveryDate) : null }),
      },
      select: { shootingDate: true, editingDeadline: true, deliveryDate: true },
    });
    res.json(updated);
  } catch (error) {
    console.error('Update timeline error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/leads/:id/mark-delivered — Mark project as delivered
router.post('/:id/mark-delivered', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.id as string;

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, assignedToId: userId },
      include: { files: true },
    });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    // 1. Share all creative-uploaded files with the client
    const shared = await prisma.file.updateMany({
      where: { leadId: lead.id, uploadedBy: userId, sharedWithClient: false },
      data: { sharedWithClient: true, sharedAt: new Date() },
    });

    // 2. Update lead status to BOOKED (highest status) + pipeline to COMPLETED
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'BOOKED', pipelineStatus: 'COMPLETED' },
    });

    // 3. Log activity
    await logActivity(lead.id, userId, 'STATUS_CHANGED', `Project marked as delivered — ${shared.count} file(s) shared with client`, { oldStatus: lead.status, newStatus: 'BOOKED', pipelineStatus: 'COMPLETED', filesShared: shared.count });

    // 4. Send delivery email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && (lead.clientEmail ?? '')) {
      const portalUrl = `${process.env.FRONTEND_URL}/portal/${lead.portalToken}`;
      sendDeliveryNotificationEmail({
        clientName: lead.clientName,
        clientEmail: lead.clientEmail ?? '',
        creativeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        studioName: user.studioName || undefined,
        projectTitle: lead.projectTitle,
        portalUrl,
      }).catch(e => console.error('[Delivery] Email error:', e));
      await logActivity(lead.id, userId, 'EMAIL_SENT', `Delivery notification sent to ${lead.clientEmail ?? ''}`, { emailType: 'delivery_notification' });
    }

    // 5. Send testimonial request email
    if (user && (lead.clientEmail ?? '')) {
      const testimonialUrl = `${process.env.FRONTEND_URL}/portal/${lead.portalToken}`;
      sendTestimonialRequestEmail({
        clientName: lead.clientName,
        clientEmail: lead.clientEmail ?? '',
        creativeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        studioName: user.studioName || undefined,
        projectTitle: lead.projectTitle,
        testimonialUrl,
      }).catch(e => console.error('[Delivery] Testimonial email error:', e));
      await logActivity(lead.id, userId, 'EMAIL_SENT', `Testimonial request sent to ${lead.clientEmail ?? ''}`, { emailType: 'testimonial_request' });
    }

    // 6. Auto-send final payment link if deposit was paid
    const income = await prisma.income.findFirst({ where: { leadId: lead.id } });
    let paymentLinkSent = false;
    if (income && income.depositPaid && !income.finalPaid) {
      try {
        await paymentService.createFinalCheckout(income.id, process.env.FRONTEND_URL || '');
        paymentLinkSent = true;

      } catch (e) {
        console.error('[Delivery] Final payment link failed:', e);
      }
    }

    res.json({
      message: 'Project marked as delivered',
      filesShared: shared.count,
      status: 'COMPLETED',
      pipelineStatus: 'COMPLETED',
      paymentLinkSent,
    });
  } catch (error) {
    console.error('Mark as delivered error:', error);
    res.status(500).json({ error: 'Failed to mark as delivered' });
  }
});

// PATCH /api/leads/:id/discovery-call - Update discovery call status
router.patch('/:id/discovery-call', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.userId as string;
    const { discoveryCallScheduled, discoveryCallCompletedAt, discoveryCallNotes, discoveryCallBookingId } = req.body;

    const lead = await prisma.lead.findFirst({ where: { id, assignedToId: userId } });
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const updateData: any = {};
    if (discoveryCallScheduled !== undefined) updateData.discoveryCallScheduled = discoveryCallScheduled;
    if (discoveryCallCompletedAt) updateData.discoveryCallCompletedAt = new Date(discoveryCallCompletedAt);
    if (discoveryCallNotes !== undefined) updateData.discoveryCallNotes = discoveryCallNotes;
    if (discoveryCallBookingId !== undefined) updateData.discoveryCallBookingId = discoveryCallBookingId as string;

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    const [quotesCount, contractsCount, bookingsCount] = await Promise.all([
      prisma.quote.count({ where: { leadId: id } }),
      prisma.contract.count({ where: { leadId: id } }),
      prisma.booking.count({ where: { leadId: id } }),
    ]);

    // Log activity
    if (discoveryCallScheduled) {
      await logActivity(id, userId, 'DISCOVERY_CALL_SCHEDULED', 'Discovery call scheduled with client');
    }
    if (discoveryCallCompletedAt) {
      await logActivity(id, userId, 'DISCOVERY_CALL_COMPLETED', discoveryCallNotes ? `Discovery call completed. Notes: ${discoveryCallNotes}` : 'Discovery call completed');

      // WS4: Schedule a quote reminder 24 hours after discovery call completion
      try {
        const existingReminder = await prisma.scheduledEmail.findFirst({
          where: { leadId: id, type: 'POST_CALL_QUOTE_REMINDER', sentAt: null },
        });
        if (!existingReminder) {
          const twentyFourHoursLater = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await prisma.scheduledEmail.create({
            data: { leadId: id, type: 'POST_CALL_QUOTE_REMINDER', scheduledFor: twentyFourHoursLater },
          });
          console.log(`[SCHEDULED] Post-call quote reminder for lead ${id} in 24 hours`);
        }
      } catch (schedErr) {
        console.error('[SCHEDULED] Failed to schedule post-call quote reminder:', schedErr);
      }
    }

    res.json({
      lead: {
        ...updated,
        quotesCount,
        contractsCount,
        bookingsCount,
      }
    });
  } catch (error) {
    console.error('Discovery call update error:', error);
    res.status(500).json({ error: 'Failed to update discovery call status' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// iter 293-v3a — Clients v3.1 bulk/batch endpoints
// ═══════════════════════════════════════════════════════════════════
// Replaces frontend Promise.allSettled loops with server-side batching.
// Each endpoint: validates ownership → performs update per lead →
// returns { successCount, failures: [{leadId, error}] }.
// Max 100 leads per batch. Rate-limited via existing apiLimiter (attached
// at router-mount level) OR bulkEmailLimiter (for reminder/email).

const MAX_BATCH_SIZE = 100;

function validateBatchIds(leadIds: unknown): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (!Array.isArray(leadIds)) return { ok: false, error: 'leadIds must be an array' };
  if (leadIds.length === 0) return { ok: false, error: 'leadIds cannot be empty' };
  if (leadIds.length > MAX_BATCH_SIZE) return { ok: false, error: `Maximum ${MAX_BATCH_SIZE} leads per batch` };
  if (!leadIds.every((id) => typeof id === 'string')) return { ok: false, error: 'All leadIds must be strings' };
  return { ok: true, ids: leadIds as string[] };
}

async function getOwnedLeadIds(userId: string, leadIds: string[]): Promise<{ owned: string[]; unauthorized: string[] }> {
  const rows = await prisma.lead.findMany({
    where: { id: { in: leadIds }, assignedToId: userId },
    select: { id: true },
  });
  const owned = rows.map((r) => r.id);
  const unauthorized = leadIds.filter((id) => !owned.includes(id));
  return { owned, unauthorized };
}

// POST /api/leads/bulk/archive — sets status to 'LOST' (preserves current
// bulkArchive semantic since Lead schema has no `archived` boolean field).
router.post('/bulk/archive', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const validation = validateBatchIds(req.body?.leadIds);
  if (!validation.ok) { res.status(400).json({ error: validation.error }); return; }
  const userId = req.userId as string;

  // iter 293-v3b — Capture pre-archive status snapshot so client can support
  // undo (restore to exact original stage instead of default INQUIRY).
  const preArchive = await prisma.lead.findMany({
    where: { id: { in: validation.ids }, assignedToId: userId },
    select: { id: true, status: true },
  });
  const preArchiveMap: Record<string, string> = {};
  preArchive.forEach((row) => { preArchiveMap[row.id] = row.status; });

  const { owned, unauthorized } = await getOwnedLeadIds(userId, validation.ids);

  const failures: Array<{ leadId: string; error: string }> = unauthorized.map((leadId) => ({ leadId, error: 'Unauthorized' }));
  let successCount = 0;

  for (const leadId of owned) {
    try {
      await prisma.lead.update({ where: { id: leadId }, data: { status: 'LOST', lostAt: new Date() } });
      await logActivity(leadId, userId, 'STATUS_CHANGED', 'Lead archived (bulk)', { newStatus: 'LOST', previousStatus: preArchiveMap[leadId] });
      successCount++;
    } catch (error: any) {
      failures.push({ leadId, error: error?.message || 'Update failed' });
    }
  }

  res.json({ successCount, failures, preArchiveMap });
});

// POST /api/leads/bulk/stage — updates status enum for many leads
router.post('/bulk/stage', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const validation = validateBatchIds(req.body?.leadIds);
  if (!validation.ok) { res.status(400).json({ error: validation.error }); return; }
  const status = req.body?.status as string | undefined;
  const validStatuses = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED', 'LOST'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    return;
  }
  const userId = req.userId as string;
  const { owned, unauthorized } = await getOwnedLeadIds(userId, validation.ids);

  const failures: Array<{ leadId: string; error: string }> = unauthorized.map((leadId) => ({ leadId, error: 'Unauthorized' }));
  let successCount = 0;

  for (const leadId of owned) {
    try {
      const data: any = { status };
      if (status === 'BOOKED') data.convertedAt = new Date();
      if (status === 'LOST') data.lostAt = new Date();
      await prisma.lead.update({ where: { id: leadId }, data });
      await logActivity(leadId, userId, 'STATUS_CHANGED', `Stage changed to ${status} (bulk)`, { newStatus: status });
      successCount++;
    } catch (error: any) {
      failures.push({ leadId, error: error?.message || 'Update failed' });
    }
  }

  res.json({ successCount, failures });
});

// POST /api/leads/bulk/tag — appends a tag to many leads (dedupes)
router.post('/bulk/tag', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const validation = validateBatchIds(req.body?.leadIds);
  if (!validation.ok) { res.status(400).json({ error: validation.error }); return; }
  const tag = typeof req.body?.tag === 'string' ? req.body.tag.trim() : '';
  if (!tag) { res.status(400).json({ error: 'tag must be a non-empty string' }); return; }
  const userId = req.userId as string;
  const rows = await prisma.lead.findMany({
    where: { id: { in: validation.ids }, assignedToId: userId },
    select: { id: true, tags: true },
  });
  const owned = rows.map((r) => r.id);
  const unauthorized = validation.ids.filter((id) => !owned.includes(id));

  const failures: Array<{ leadId: string; error: string }> = unauthorized.map((leadId) => ({ leadId, error: 'Unauthorized' }));
  let successCount = 0;

  for (const row of rows) {
    try {
      const nextTags = Array.from(new Set([...(row.tags || []), tag]));
      await prisma.lead.update({ where: { id: row.id }, data: { tags: nextTags } });
      successCount++;
    } catch (error: any) {
      failures.push({ leadId: row.id, error: error?.message || 'Tag failed' });
    }
  }

  res.json({ successCount, failures });
});

// POST /api/leads/bulk/reminder — sends contextual per-stage reminder to
// many leads. Uses sendCustomEmail with framework-calibrated HTML body.
router.post('/bulk/reminder', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const validation = validateBatchIds(req.body?.leadIds);
  if (!validation.ok) { res.status(400).json({ error: validation.error }); return; }
  const userId = req.userId as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { res.status(401).json({ error: 'User not found' }); return; }

  const rows = await prisma.lead.findMany({
    where: { id: { in: validation.ids }, assignedToId: userId },
    select: { id: true, clientName: true, clientEmail: true, status: true, projectTitle: true },
  });
  const owned = rows.map((r) => r.id);
  const unauthorized = validation.ids.filter((id) => !owned.includes(id));

  const failures: Array<{ leadId: string; error: string }> = unauthorized.map((leadId) => ({ leadId, error: 'Unauthorized' }));
  let successCount = 0;

  const creatorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const studioName = user.studioName || creatorName;

  // Stage → contextual reminder body
  const reminderByStage: Record<string, { subject: string; body: string }> = {
    NEW: {
      subject: `Following up on your inquiry — ${studioName}`,
      body: `Hi {clientName},<br/><br/>Following up on your recent inquiry. I'd love to learn more about what you're planning and how I can help.<br/><br/>Let me know when you have a moment to chat.`,
    },
    REVIEWING: {
      subject: `Checking in — ${studioName}`,
      body: `Hi {clientName},<br/><br/>Just checking in on your inquiry. Let me know if you have any questions or if you'd like to schedule a call.`,
    },
    CONTACTED: {
      subject: `Checking in on our conversation — ${studioName}`,
      body: `Hi {clientName},<br/><br/>Circling back on our recent conversation about your project. Any next steps I can help with?`,
    },
    QUALIFIED: {
      subject: `Ready to move forward? — ${studioName}`,
      body: `Hi {clientName},<br/><br/>Wanted to check in — ready to move forward with your project? Happy to send over next steps.`,
    },
    QUOTED: {
      subject: `Following up on the proposal — ${studioName}`,
      body: `Hi {clientName},<br/><br/>Following up on the proposal I sent over. Let me know if you have any questions or would like to discuss any details.`,
    },
    NEGOTIATING: {
      subject: `Following up — ${studioName}`,
      body: `Hi {clientName},<br/><br/>Circling back on our discussion. Let me know if there's anything else I can clarify to help move things forward.`,
    },
    BOOKED: {
      subject: `Progress update — ${studioName}`,
      body: `Hi {clientName},<br/><br/>Wanted to send a quick update on your project. Let me know if there's anything you need on your end.`,
    },
    LOST: {
      subject: `Checking back in — ${studioName}`,
      body: `Hi {clientName},<br/><br/>It's been a while — wanted to see if there might still be interest in working together. Happy to reconnect anytime.`,
    },
  };

  for (const row of rows) {
    if (!row.clientEmail) {
      failures.push({ leadId: row.id, error: 'No email on file' });
      continue;
    }
    try {
      const tpl = reminderByStage[row.status] || reminderByStage.NEW;
      const htmlBody = tpl.body.replace('{clientName}', row.clientName || 'there');
      await sendCustomEmail({
        to: row.clientEmail,
        subject: tpl.subject,
        htmlBody,
        fromName: studioName,
        replyTo: user.email,
      });
      await logActivity(row.id, userId, 'EMAIL_SENT', `Reminder sent (bulk)`, { emailType: 'bulk_reminder', stage: row.status });
      successCount++;
    } catch (error: any) {
      failures.push({ leadId: row.id, error: error?.message || 'Send failed' });
    }
  }

  res.json({ successCount, failures });
});

// POST /api/leads/bulk/email — creator-composed bulk email to many leads.
// Accepts multipart/form-data (subject + body + leadIds JSON string + files[]).
// Uses sendCustomEmail with Resend attachments. bulkEmailLimiter attached at
// server mount.
router.post(
  '/bulk/email',
  authMiddleware,
  bulkEmailUpload.array('files', 10),
  async (req: AuthRequest, res: Response): Promise<void> => {
    // Multipart: fields arrive as strings in req.body; leadIds arrives JSON-stringified
    let leadIdsRaw: unknown = req.body?.leadIds;
    if (typeof leadIdsRaw === 'string') {
      try { leadIdsRaw = JSON.parse(leadIdsRaw); } catch { /* leave as-is → fails validation */ }
    }
    const validation = validateBatchIds(leadIdsRaw);
    if (!validation.ok) { res.status(400).json({ error: validation.error }); return; }
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!subject) { res.status(400).json({ error: 'subject is required' }); return; }
    if (!body) { res.status(400).json({ error: 'body is required' }); return; }
    const userId = req.userId as string;

    // Collected attachments from multer (memoryStorage). Enforce 25MB total.
    const uploadedFiles = (req.files as Express.Multer.File[] | undefined) || [];
    const totalBytes = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > 25 * 1024 * 1024) {
      res.status(400).json({ error: 'Attachments exceed 25MB total limit' });
      return;
    }
    const attachments = uploadedFiles.map((f) => ({
      filename: f.originalname,
      content: f.buffer,
    }));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    const rows = await prisma.lead.findMany({
      where: { id: { in: validation.ids }, assignedToId: userId },
      select: { id: true, clientName: true, clientEmail: true },
    });
    const owned = rows.map((r) => r.id);
    const unauthorized = validation.ids.filter((id) => !owned.includes(id));

    const failures: Array<{ leadId: string; error: string }> = unauthorized.map((leadId) => ({ leadId, error: 'Unauthorized' }));
    let successCount = 0;

    const creatorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const studioName = user.studioName || creatorName;

    // Escape HTML in body (basic) then convert newlines to <br/>
    const escapeHtml = (str: string): string =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const bodyHtml = escapeHtml(body).replace(/\n/g, '<br/>');

    for (const row of rows) {
      if (!row.clientEmail) {
        failures.push({ leadId: row.id, error: 'No email on file' });
        continue;
      }
      try {
        const personalizedBody = `Hi ${row.clientName || 'there'},<br/><br/>${bodyHtml}<br/><br/>Best,<br/>${creatorName}`;
        await sendCustomEmail({
          to: row.clientEmail,
          subject,
          htmlBody: personalizedBody,
          fromName: studioName,
          replyTo: user.email,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        await logActivity(row.id, userId, 'EMAIL_SENT', `Bulk email sent: ${subject}${attachments.length > 0 ? ` (${attachments.length} attachment${attachments.length === 1 ? '' : 's'})` : ''}`, { emailType: 'bulk_email', subject, attachmentCount: attachments.length });
        successCount++;
      } catch (error: any) {
        failures.push({ leadId: row.id, error: error?.message || 'Send failed' });
      }
    }

    res.json({ successCount, failures });
  }
);

// POST /api/leads/bulk/unarchive — restores archived (LOST) leads back to a
// specified stage. Accepts optional stageRestoreMap for undo-toast use case
// (restore each lead to its exact original stage); falls back to defaultStage
// (default: 'NEW') when no map entry exists.
router.post('/bulk/unarchive', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const validation = validateBatchIds(req.body?.leadIds);
  if (!validation.ok) { res.status(400).json({ error: validation.error }); return; }
  const stageRestoreMap: Record<string, string> = req.body?.stageRestoreMap && typeof req.body.stageRestoreMap === 'object'
    ? req.body.stageRestoreMap
    : {};
  const defaultStage = typeof req.body?.defaultStage === 'string' ? req.body.defaultStage : 'NEW';
  const validStatuses = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED', 'LOST'];
  if (!validStatuses.includes(defaultStage)) {
    res.status(400).json({ error: `defaultStage must be one of: ${validStatuses.join(', ')}` });
    return;
  }
  const userId = req.userId as string;

  // Only leads currently in LOST status can be unarchived by this endpoint.
  const rows = await prisma.lead.findMany({
    where: { id: { in: validation.ids }, assignedToId: userId, status: 'LOST' },
    select: { id: true },
  });
  const owned = rows.map((r) => r.id);
  const unauthorized = validation.ids.filter((id) => !owned.includes(id));

  const failures: Array<{ leadId: string; error: string }> = unauthorized.map((leadId) => ({ leadId, error: 'Not archived or unauthorized' }));
  let successCount = 0;

  for (const leadId of owned) {
    try {
      const target = stageRestoreMap[leadId];
      const restoreStage = target && validStatuses.includes(target) && target !== 'LOST'
        ? target
        : defaultStage;
      const data: any = { status: restoreStage, lostAt: null };
      if (restoreStage === 'BOOKED') data.convertedAt = new Date();
      await prisma.lead.update({ where: { id: leadId }, data });
      await logActivity(leadId, userId, 'STATUS_CHANGED', `Lead restored from archive (bulk) → ${restoreStage}`, { newStatus: restoreStage });
      successCount++;
    } catch (error: any) {
      failures.push({ leadId, error: error?.message || 'Restore failed' });
    }
  }

  res.json({ successCount, failures });
});

export default router;
