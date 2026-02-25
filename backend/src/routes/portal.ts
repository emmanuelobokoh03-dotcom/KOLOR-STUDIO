import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Status labels for client display
const STATUS_LABELS: Record<string, string> = {
  NEW: 'Inquiry Received',
  REVIEWING: 'Under Review',
  CONTACTED: 'In Contact',
  QUALIFIED: 'Qualified',
  QUOTED: 'Quote Sent',
  NEGOTIATING: 'In Discussion',
  BOOKED: 'Project Confirmed',
  LOST: 'Closed',
};

// Status descriptions for client
const STATUS_DESCRIPTIONS: Record<string, string> = {
  NEW: 'We\'ve received your inquiry and will review it shortly.',
  REVIEWING: 'Our team is currently reviewing your project details.',
  CONTACTED: 'We\'ve reached out to discuss your project.',
  QUALIFIED: 'Your project has been qualified for our services.',
  QUOTED: 'We\'ve sent you a proposal for your project.',
  NEGOTIATING: 'We\'re finalizing the details with you.',
  BOOKED: 'Your project is confirmed! We\'re excited to work with you.',
  LOST: 'This inquiry has been closed.',
};

// Activity types safe for client viewing (must match ActivityType enum)
const CLIENT_SAFE_ACTIVITY_TYPES = [
  'STATUS_CHANGED',
  'EMAIL_SENT',
  'MEETING_SCHEDULED',
  'PROPOSAL_SENT',
  'CONTRACT_SIGNED',
  'FILE_UPLOADED',
];

// Service type labels
const SERVICE_TYPE_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  BRANDING: 'Branding',
  CONTENT_CREATION: 'Content Creation',
  CONSULTING: 'Consulting',
  OTHER: 'Other',
};

// GET /api/portal/:token - Get lead details using portal token
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;

    if (!token || token.length < 10) {
      res.status(400).json({ 
        error: 'Invalid Token', 
        message: 'Please check your portal link and try again.' 
      });
      return;
    }

    // Find lead by portal token
    const lead = await prisma.lead.findUnique({
      where: { portalToken: token },
      include: {
        activities: {
          where: {
            type: { in: CLIENT_SAFE_ACTIVITY_TYPES as any[] }
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Last 20 activities
        },
        files: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
    });

    if (!lead) {
      res.status(404).json({ 
        error: 'Not Found', 
        message: 'This project portal could not be found. Please check your link or contact us.' 
      });
      return;
    }

    // Update portal view count and timestamp
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        portalViews: { increment: 1 },
        lastPortalView: new Date(),
      },
    });

    // Calculate progress percentage based on status
    const statusOrder = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED'];
    const currentIndex = statusOrder.indexOf(lead.status);
    const progressPercent = lead.status === 'LOST' 
      ? 0 
      : Math.round(((currentIndex + 1) / statusOrder.length) * 100);

    // Format activities for client view
    const clientActivities = (lead.activities || []).map((activity: any) => ({
      id: activity.id,
      type: activity.type,
      description: sanitizeActivityDescription(activity.type, activity.description),
      createdAt: activity.createdAt,
    }));

    // Format files for client view
    const clientFiles = (lead.files || []).map((file: any) => ({
      id: file.id,
      name: file.originalName,
      type: file.mimeType,
      size: file.size,
      uploadedAt: file.createdAt,
    }));

    // Build sanitized response (no internal data)
    const assignedTo = lead.assignedTo as { firstName: string; lastName: string; email: string } | null;
    
    const portalData = {
      project: {
        id: lead.id,
        title: lead.projectTitle,
        serviceType: SERVICE_TYPE_LABELS[lead.serviceType] || lead.serviceType,
        description: lead.description,
        budget: lead.budget,
        timeline: lead.timeline,
        eventDate: lead.eventDate,
        submittedAt: lead.createdAt,
      },
      status: {
        current: lead.status,
        label: STATUS_LABELS[lead.status] || lead.status,
        description: STATUS_DESCRIPTIONS[lead.status],
        progress: progressPercent,
        isBooked: lead.status === 'BOOKED',
        isLost: lead.status === 'LOST',
      },
      client: {
        name: lead.clientName,
        email: lead.clientEmail,
      },
      timeline: clientActivities,
      files: clientFiles,
      contact: {
        email: assignedTo?.email || process.env.OWNER_NOTIFICATION_EMAIL || 'contact@kolorstudio.com',
        name: assignedTo 
          ? `${assignedTo.firstName} ${assignedTo.lastName}`
          : 'KOLOR STUDIO Team',
      },
      meta: {
        portalViews: lead.portalViews + 1, // Including this view
        lastUpdated: lead.updatedAt,
      }
    };

    res.json(portalData);
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Unable to load portal. Please try again later.' 
    });
  }
});

// Helper function to make activity descriptions client-friendly
function sanitizeActivityDescription(type: string, description: string): string {
  switch (type) {
    case 'STATUS_CHANGED':
      // Extract just the new status
      const statusMatch = description.match(/to (\w+)/);
      if (statusMatch) {
        const newStatus = statusMatch[1];
        return `Project status updated to ${STATUS_LABELS[newStatus] || newStatus}`;
      }
      return 'Project status has been updated';
    
    case 'EMAIL_SENT':
      if (description.includes('notification')) {
        return 'We\'ve received your inquiry';
      }
      if (description.includes('confirmation')) {
        return 'Confirmation email sent to you';
      }
      return 'Email communication sent';
    
    case 'FILE_UPLOADED':
      return 'A file has been added to your project';
    
    case 'MEETING_SCHEDULED':
      return 'A meeting has been scheduled';
    
    case 'MEETING_COMPLETED':
      return 'Meeting completed';
    
    case 'QUOTE_SENT':
    case 'PROPOSAL_SENT':
      return 'A proposal has been sent for your review';
    
    case 'CONTRACT_SIGNED':
      return 'Contract has been signed';
    
    default:
      return 'Update on your project';
  }
}

export default router;

// POST /portal/submit - Public inquiry form submission
router.post('/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      projectTitle,
      serviceType,
      description,
      budget,
      timeline,
      eventDate,
      hearAboutUs
    } = req.body;

    // Validation
    if (!clientName || !clientEmail || !projectTitle || !serviceType) {
      res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Please fill in all required fields'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      res.status(400).json({ 
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Generate portal token
    const portalToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        projectTitle,
        serviceType,
        description: description || null,
        budget: budget ? parseFloat(budget) : null,
        timeline: timeline || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        hearAboutUs: hearAboutUs || null,
        status: 'NEW',
        source: 'REFERRAL',
        portalToken,
        portalShared: true,
      },
    });

    // Create initial activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: 'STATUS_CHANGED',
        description: 'Lead submitted via public inquiry form',
      },
    });

    // Send confirmation email to client (optional)
    // TODO: Integrate with Resend

    res.status(201).json({
      success: true,
      message: 'Thank you for your inquiry! We\'ll be in touch soon.',
      leadId: lead.id,
    });

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ 
      error: 'Submission failed',
      message: 'Unable to submit form. Please try again or contact us directly.'
    });
  }
});
// Deployment trigger
