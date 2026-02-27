import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendNewLeadNotification, sendClientConfirmation, sendStatusChangeNotification, sendPortalLinkEmail } from '../services/email';
import { logActivity } from './activities';

const router = Router();
const prisma = new PrismaClient();

// GET /api/leads - Get all leads for authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const sort = req.query.sort as string | undefined;
    
    // Show leads assigned to user OR unassigned (inquiry forms)
    const where: any = { 
      OR: [
        { assignedToId: userId },
        { assignedToId: null }
      ]
    };
    
    if (status && status !== 'ALL') {
      where.status = status;
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
      }
    });

    res.json({ leads, count: leads.length });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch leads' });
  }
});

// GET /api/leads/stats - Get lead statistics for dashboard
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;

    const [total, byStatus, recentLeads] = await Promise.all([
      prisma.lead.count({ where: { assignedToId: userId } }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { assignedToId: userId },
        _count: { status: true }
      }),
      prisma.lead.findMany({
        where: { assignedToId: userId },
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
      where: { id, assignedToId: userId },
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
      where: { id, assignedToId: userId }
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
      where: { id: leadId, assignedToId: userId }
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

export default router;
