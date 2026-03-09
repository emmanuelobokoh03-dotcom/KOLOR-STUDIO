import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
import prisma from '../lib/prisma';

const VALID_DELIVERABLE_TYPES = ['DIGITAL_FILES', 'PHYSICAL_ART', 'PRINTS', 'SERVICE', 'WEBSITE', 'MIXED'];
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'SHIPPED'];

// Helper: verify lead ownership
async function verifyLeadAccess(leadId: string, userId: string) {
  return prisma.lead.findFirst({
    where: {
      id: leadId,
      assignedToId: userId
    },
    select: { id: true }
  });
}

// Helper: get deliverable with lead ownership check
async function getDeliverableWithAccess(id: string, userId: string) {
  const deliverable = await prisma.deliverable.findUnique({ where: { id } });
  if (!deliverable) return null;
  const lead = await prisma.lead.findFirst({
    where: {
      id: deliverable.leadId,
      assignedToId: userId
    },
    select: { id: true, clientName: true, projectTitle: true, assignedToId: true }
  });
  if (!lead) return null;
  return { ...deliverable, lead };
}

// GET /api/leads/:leadId/deliverables — Get all deliverables for a lead
router.get('/leads/:leadId/deliverables', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.leadId as string;

    const lead = await verifyLeadAccess(leadId, userId);
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const deliverables = await prisma.deliverable.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ deliverables, count: deliverables.length });
  } catch (error) {
    console.error('Get deliverables error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch deliverables' });
  }
});

// POST /api/leads/:leadId/deliverables — Create deliverable
router.post('/leads/:leadId/deliverables', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.leadId as string;
    const {
      name, type, description, fileUrls,
      dimensions, material, weight,
      shippingAddress, shippingMethod,
      sessionDate, sessionLocation, sessionDuration, sessionNotes,
      dueDate, notes, metadata
    } = req.body;

    const lead = await verifyLeadAccess(leadId, userId);
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Validation Error', message: 'Deliverable name is required' });
      return;
    }

    if (type && !VALID_DELIVERABLE_TYPES.includes(type)) {
      res.status(400).json({ error: 'Validation Error', message: `Invalid deliverable type. Must be one of: ${VALID_DELIVERABLE_TYPES.join(', ')}` });
      return;
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        name,
        type: type || 'DIGITAL_FILES',
        description,
        fileUrls: fileUrls || [],
        dimensions,
        material,
        weight,
        shippingAddress,
        shippingMethod,
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        sessionLocation,
        sessionDuration: sessionDuration ? parseInt(sessionDuration) : null,
        sessionNotes,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        metadata,
        leadId,
      }
    });

    res.status(201).json({ message: 'Deliverable created', deliverable });
  } catch (error) {
    console.error('Create deliverable error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create deliverable' });
  }
});

// GET /api/deliverables/:id — Get single deliverable
router.get('/deliverables/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const result = await getDeliverableWithAccess(id, userId);
    if (!result) {
      res.status(404).json({ error: 'Not Found', message: 'Deliverable not found' });
      return;
    }

    res.json({ deliverable: result });
  } catch (error) {
    console.error('Get deliverable error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch deliverable' });
  }
});

// PATCH /api/deliverables/:id — Update deliverable
router.patch('/deliverables/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const updates = req.body;

    const existing = await getDeliverableWithAccess(id, userId);
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Deliverable not found' });
      return;
    }

    // Build safe update data
    const data: any = {};
    const allowedFields = [
      'name', 'type', 'description', 'fileUrls',
      'dimensions', 'material', 'weight',
      'shippingAddress', 'shippingMethod', 'trackingNumber',
      'sessionLocation', 'sessionNotes', 'notes', 'metadata'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) data[field] = updates[field];
    }

    if (updates.type && !VALID_DELIVERABLE_TYPES.includes(updates.type)) {
      res.status(400).json({ error: 'Validation Error', message: 'Invalid deliverable type' });
      return;
    }

    if (updates.sessionDate !== undefined) data.sessionDate = updates.sessionDate ? new Date(updates.sessionDate) : null;
    if (updates.sessionDuration !== undefined) data.sessionDuration = updates.sessionDuration ? parseInt(updates.sessionDuration) : null;
    if (updates.dueDate !== undefined) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.shippedAt !== undefined) data.shippedAt = updates.shippedAt ? new Date(updates.shippedAt) : null;

    const deliverable = await prisma.deliverable.update({ where: { id }, data });

    res.json({ message: 'Deliverable updated', deliverable });
  } catch (error) {
    console.error('Update deliverable error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update deliverable' });
  }
});

// PATCH /api/deliverables/:id/status — Update deliverable status
router.patch('/deliverables/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Validation Error', message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const existing = await getDeliverableWithAccess(id, userId);
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Deliverable not found' });
      return;
    }

    const data: any = { status };

    // Auto-set timestamps based on status transitions
    if (status === 'DELIVERED' || status === 'SHIPPED') {
      data.completedAt = new Date();
    }
    if (status === 'SHIPPED' && !existing.shippedAt) {
      data.shippedAt = new Date();
    }

    const deliverable = await prisma.deliverable.update({ where: { id }, data });

    // Send work progress notification to client for key status changes
    const NOTIFY_STATUSES = ['IN_PROGRESS', 'READY', 'DELIVERED', 'SHIPPED'];
    if (NOTIFY_STATUSES.includes(status)) {
      prisma.lead.findUnique({
        where: { id: existing.leadId },
        select: { clientEmail: true, clientName: true, portalToken: true, assignedToId: true, projectTitle: true },
      }).then(async (lead) => {
        if (lead?.clientEmail && lead.assignedToId) {
          const creative = await prisma.user.findUnique({
            where: { id: lead.assignedToId },
            select: { firstName: true, lastName: true, studioName: true },
          });
          const creativeName = `${creative?.firstName || ''} ${creative?.lastName || ''}`.trim() || 'Studio';
          const { sendWorkProgressNotification } = await import('../services/email');
          await sendWorkProgressNotification({
            to: lead.clientEmail,
            clientName: lead.clientName,
            deliverableName: existing.name,
            status,
            creativeName,
            studioName: creative?.studioName || undefined,
            portalUrl: `${process.env.FRONTEND_URL || ''}/portal/${lead.portalToken || ''}`,
          });
        }
      }).catch(e => console.error('[WORK NOTIFICATION] Error:', e));
    }

    // Auto-request testimonial when deliverable is marked DELIVERED
    if (status === 'DELIVERED') {
      try {
        const lead = await prisma.lead.findUnique({ where: { id: existing.leadId } });
        if (lead && lead.assignedToId) {
          // Check if testimonial already exists for this lead
          const existingTestimonial = await prisma.testimonial.findFirst({
            where: { leadId: lead.id, userId: lead.assignedToId }
          });
          if (!existingTestimonial) {
            await prisma.testimonial.create({
              data: {
                userId: lead.assignedToId,
                leadId: lead.id,
                clientName: lead.clientName,
                clientEmail: lead.clientEmail,
                status: 'PENDING',
                requestedAt: new Date()
              }
            });
          }
        }
      } catch (autoReqError) {
        console.error('Auto testimonial request failed:', autoReqError);
      }
    }

    res.json({ message: `Deliverable status updated to ${status}`, deliverable });
  } catch (error) {
    console.error('Update deliverable status error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update deliverable status' });
  }
});

// DELETE /api/deliverables/:id — Delete deliverable
router.delete('/deliverables/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const existing = await getDeliverableWithAccess(id, userId);
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Deliverable not found' });
      return;
    }

    await prisma.deliverable.delete({ where: { id } });

    res.json({ message: 'Deliverable deleted successfully' });
  } catch (error) {
    console.error('Delete deliverable error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete deliverable' });
  }
});

export default router;
