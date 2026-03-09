import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendNewLeadNotification, sendClientConfirmation, sendStatusChangeNotification, sendPortalLinkEmail, sendAutoResponseEmail, sendDeliveryNotificationEmail, sendTestimonialRequestEmail } from '../services/email';
import { logActivity } from './activities';
import { uploadFile, ensureBucketExists } from '../services/storage';
import { paymentService } from '../services/paymentService';
import multer from 'multer';

const router = Router();
import prisma from '../lib/prisma';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

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
      clientEmail: lead.clientEmail,
      creativeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      studioName: user.studioName || undefined,
      message,
      portalUrl: portfolioUrl,
    });

    await logActivity(lead.id, null, 'EMAIL_SENT', `Auto-response sent to ${lead.clientEmail}`, { emailType: 'auto_response' });
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

    console.log('[GET /leads] Found', leadsWithCounts.length, 'leads');

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
        industry: industry || null,
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
        source: source || 'WEBSITE',
        assignedToId,
        status: 'NEW',
        priority: 'MEDIUM',
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

    sendClientConfirmation(leadData)
      .then(success => {
        if (success) {
          logActivity(
            lead.id,
            null,
            'EMAIL_SENT',
            `Confirmation email sent to ${clientEmail}`,
            { emailType: 'client_confirmation', clientEmail }
          ).catch(() => {});
        }
      })
      .catch(err => console.error('Client confirmation error:', err));

    // Auto-response with portfolio link (non-blocking)
    sendAutoResponse(lead).catch(err => console.error('Auto-response error:', err));

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
      sendStatusChangeNotification({
        clientName: existingLead.clientName,
        clientEmail: existingLead.clientEmail,
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

      // Send email notification to client (non-blocking)
      sendStatusChangeNotification({
        clientName: existingLead.clientName,
        clientEmail: existingLead.clientEmail,
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
      clientEmail: lead.clientEmail,
      projectTitle: lead.projectTitle,
      portalToken: lead.portalToken,
    });

    // Log the activity regardless of email success
    await logActivity(
      id,
      userId,
      'EMAIL_SENT',
      `Portal link email ${success ? 'sent' : 'attempted'} to ${lead.clientEmail}`,
      { emailType: 'portal_link', clientEmail: lead.clientEmail, success }
    );

    if (!success) {
      // Email failed but we still log the attempt
      res.status(200).json({ 
        message: 'Email could not be sent (Resend domain not verified for production emails)',
        sentTo: lead.clientEmail,
        warning: 'In test mode, emails can only be sent to the owner email. Verify your domain at resend.com for production.'
      });
      return;
    }

    res.json({ 
      message: 'Portal link sent successfully',
      sentTo: lead.clientEmail 
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
        to: lead.clientEmail,
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
    if (!name || !dueDate) { res.status(400).json({ error: 'Name and dueDate are required' }); return; }

    const milestone = await prisma.projectMilestone.create({
      data: { leadId: lead.id, name, description: description || null, dueDate: new Date(dueDate), order: order ?? 0 },
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
    if (user && lead.clientEmail) {
      const portalUrl = `${process.env.FRONTEND_URL}/portal/${lead.portalToken}`;
      sendDeliveryNotificationEmail({
        clientName: lead.clientName,
        clientEmail: lead.clientEmail,
        creativeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        studioName: user.studioName || undefined,
        projectTitle: lead.projectTitle,
        portalUrl,
      }).catch(e => console.error('[Delivery] Email error:', e));
      await logActivity(lead.id, userId, 'EMAIL_SENT', `Delivery notification sent to ${lead.clientEmail}`, { emailType: 'delivery_notification' });
    }

    // 5. Send testimonial request email
    if (user && lead.clientEmail) {
      const testimonialUrl = `${process.env.FRONTEND_URL}/portal/${lead.portalToken}`;
      sendTestimonialRequestEmail({
        clientName: lead.clientName,
        clientEmail: lead.clientEmail,
        creativeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        studioName: user.studioName || undefined,
        projectTitle: lead.projectTitle,
        testimonialUrl,
      }).catch(e => console.error('[Delivery] Testimonial email error:', e));
      await logActivity(lead.id, userId, 'EMAIL_SENT', `Testimonial request sent to ${lead.clientEmail}`, { emailType: 'testimonial_request' });
    }

    // 6. Auto-send final payment link if deposit was paid
    const income = await prisma.income.findFirst({ where: { leadId: lead.id } });
    let paymentLinkSent = false;
    if (income && income.depositPaid && !income.finalPaid) {
      try {
        await paymentService.createFinalCheckout(income.id, process.env.FRONTEND_URL || '');
        paymentLinkSent = true;
        console.log('[Delivery] Final payment link auto-created for income:', income.id);
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

export default router;
