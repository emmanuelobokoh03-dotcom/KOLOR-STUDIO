import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, formatFileSize, getFileCategory } from '../services/storage';
import { logActivity } from './activities';
import { stopSequencesForLead } from '../services/sequenceEngine';

const router = Router();
import prisma from '../lib/prisma';

// Allowed file extensions for client uploads
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic',
  '.pdf', '.doc', '.docx', '.txt',
  '.ai', '.psd', '.sketch', '.fig',
  '.mp4', '.mov',
  '.zip',
]);

// Blocked file extensions (security)
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.dmg', '.app', '.sh', '.bat', '.js', '.cmd', '.msi', '.com',
]);

// Multer config for client file uploads
const clientUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
    files: 5, // Max 5 files per request
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      cb(new Error(`File type ${ext} is not allowed for security reasons`));
      return;
    }
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error(`File type ${ext} is not supported`));
  },
});

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
          where: { OR: [{ sharedWithClient: true }, { uploadedBy: 'client' }] },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        contracts: {
          where: { status: { in: ['SENT', 'VIEWED', 'AGREED'] } },
          select: {
            id: true,
            title: true,
            content: true,
            status: true,
            clientAgreed: true,
            clientAgreedAt: true,
            sentAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        quotes: {
          where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'DECLINED'] } },
          select: {
            id: true,
            quoteNumber: true,
            lineItems: true,
            subtotal: true,
            tax: true,
            taxAmount: true,
            total: true,
            paymentTerms: true,
            validUntil: true,
            terms: true,
            status: true,
            quoteToken: true,
            sentAt: true,
            viewedAt: true,
            acceptedAt: true,
            currency: true,
            currencySymbol: true,
            currencyPosition: true,
          },
          orderBy: { createdAt: 'desc' },
        },
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

    // Format files for client view (shared + client-uploaded)
    const clientFiles = (lead.files || []).map((file: any) => ({
      id: file.id,
      name: file.originalName,
      type: file.mimeType,
      size: file.size,
      url: file.url,
      sharedAt: file.sharedAt,
      uploadedAt: file.createdAt,
      uploadedBy: file.uploadedBy === 'client' ? 'client' : 'creative',
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
      contracts: (lead as any).contracts || [],
      quotes: (lead as any).quotes || [],
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

// GET /api/portal/:token/files/:fileId/download - Download a shared file (public)
router.get('/:token/files/:fileId/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, fileId } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { portalToken: String(token) },
    });

    if (!lead) {
      res.status(404).json({ error: 'Portal not found' });
      return;
    }

    const file = await prisma.file.findFirst({
      where: {
        id: String(fileId),
        leadId: lead.id,
        OR: [{ sharedWithClient: true }, { uploadedBy: 'client' }],
      },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found or not shared' });
      return;
    }

    // Track download
    await prisma.file.update({
      where: { id: file.id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    });

    // Redirect to file URL
    res.redirect(file.url);
  } catch (error) {
    console.error('Portal file download error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to download file' });
  }
});

// GET /api/portal/:token/messages - Get messages (public, for client)
router.get('/:token/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { portalToken: String(req.params.token) },
    });

    if (!lead) {
      res.status(404).json({ error: 'Portal not found' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        from: m.isFromClient ? 'CLIENT' : 'CREATIVE',
        read: m.isRead,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Portal get messages error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch messages' });
  }
});

// POST /api/portal/:token/messages - Send message (public, client sends)
router.post('/:token/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const lead = await prisma.lead.findUnique({
      where: { portalToken: String(req.params.token) },
    });

    if (!lead) {
      res.status(404).json({ error: 'Portal not found' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        leadId: lead.id,
        content: content.trim(),
        isFromClient: true,
        isRead: false,
      },
    });

    res.json({
      message: {
        id: message.id,
        content: message.content,
        from: 'CLIENT',
        read: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    });

    // Client responded — stop follow-up sequences (non-blocking)
    stopSequencesForLead(lead.id, 'Client responded').catch(e => console.error('Sequence stop error:', e));
  } catch (error) {
    console.error('Portal send message error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to send message' });
  }
});

// GET /api/portal/:token/timeline - Get timeline for client (public)
router.get('/:token/timeline', async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { portalToken: String(req.params.token) },
      select: {
        shootingDate: true,
        editingDeadline: true,
        deliveryDate: true,
        milestones: { orderBy: [{ order: 'asc' }, { dueDate: 'asc' }] },
      },
    });
    if (!lead) { res.status(404).json({ error: 'Portal not found' }); return; }
    res.json({
      shootingDate: lead.shootingDate,
      editingDeadline: lead.editingDeadline,
      deliveryDate: lead.deliveryDate,
      milestones: lead.milestones,
    });
  } catch (error) {
    console.error('Portal timeline error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/portal/:token/upload - Client uploads files (public)
router.post('/:token/upload', clientUpload.array('files', 5), async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const lead = await prisma.lead.findUnique({
      where: { portalToken: String(token) },
      include: { assignedTo: { select: { id: true } } },
    });

    if (!lead) {
      res.status(404).json({ error: 'Portal not found' });
      return;
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        // Upload to Supabase Storage via existing service
        const result = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          lead.id
        );

        if (!result) {
          errors.push({ filename: file.originalname, error: 'Upload failed' });
          continue;
        }

        // Create file record in database
        const fileRecord = await prisma.file.create({
          data: {
            filename: result.path.split('/').pop() || file.originalname,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: result.url,
            uploadedBy: 'client',
            leadId: lead.id,
            sharedWithClient: false,
          },
        });

        uploadedFiles.push({
          id: fileRecord.id,
          filename: fileRecord.filename,
          originalName: fileRecord.originalName,
          mimeType: fileRecord.mimeType,
          size: fileRecord.size,
          formattedSize: formatFileSize(fileRecord.size),
          category: getFileCategory(fileRecord.mimeType),
          uploadedBy: fileRecord.uploadedBy,
          createdAt: fileRecord.createdAt,
        });

        // Log activity
        await logActivity(
          lead.id,
          lead.assignedTo?.id || null,
          'FILE_UPLOADED',
          `Client uploaded file: ${file.originalname} (${formatFileSize(file.size)})`,
          { fileId: fileRecord.id, filename: file.originalname, uploadedBy: 'client' }
        );
      } catch (err) {
        console.error('Client file upload error:', err);
        errors.push({ filename: file.originalname, error: 'Processing failed' });
      }
    }

    if (uploadedFiles.length === 0) {
      res.status(500).json({
        error: 'Upload Failed',
        message: 'Failed to upload any files',
        errors,
      });
      return;
    }

    res.json({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Client file upload error:', error);
    res.status(500).json({ error: 'Upload failed', message: 'Something went wrong during upload' });
  }
});

// GET /api/portal/:token/files - Get files uploaded by client (public)
router.get('/:token/files', async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { portalToken: String(req.params.token) },
    });

    if (!lead) {
      res.status(404).json({ error: 'Portal not found' });
      return;
    }

    const files = await prisma.file.findMany({
      where: {
        leadId: lead.id,
        uploadedBy: 'client',
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      files: files.map(f => ({
        id: f.id,
        name: f.originalName,
        type: f.mimeType,
        size: f.size,
        formattedSize: formatFileSize(f.size),
        uploadedAt: f.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Portal get files error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch files' });
  }
});

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
      studioId,
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

    // Determine who this lead should be assigned to
    let assignedToId: string | null = studioId || null;
    if (studioId) {
      const studioUser = await prisma.user.findUnique({ where: { id: studioId } });
      if (!studioUser) assignedToId = null;
    }
    if (!assignedToId) {
      const defaultOwner = await prisma.user.findFirst({
        where: { role: 'OWNER' },
        orderBy: { createdAt: 'asc' },
      });
      if (defaultOwner) assignedToId = defaultOwner.id;
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
        budget: budget || null,
        timeline: timeline || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        status: 'NEW',
        source: 'REFERRAL',
        portalToken,
        assignedToId,
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

    // Send auto-response email to client and notification to owner
    if (assignedToId) {
      const owner = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (owner) {
        const { sendAutoResponseEmail, sendNewLeadNotification } = await import('../services/email');
        const creativeName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Studio';
        const portfolioUrl = `${process.env.FRONTEND_URL}/portfolio/${owner.id}`;
        const message = `Thanks for reaching out about your project!\n\nI'll review your inquiry and send you a custom quote within 24 hours.\n\nCheck out my work: ${portfolioUrl}\n\nI'm excited to potentially work with you!`;
        sendAutoResponseEmail({
          clientName,
          clientEmail,
          creativeName,
          studioName: owner.studioName || undefined,
          message,
          portalUrl: portfolioUrl,
        }).catch(e => console.error('[Portal] Auto-response error:', e));
        sendNewLeadNotification({
          clientName, clientEmail, clientPhone, serviceType, projectTitle,
          description: description || '', leadId: lead.id, portalToken,
        }).catch(e => console.error('[Portal] Owner notification error:', e));
      }
    }

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
