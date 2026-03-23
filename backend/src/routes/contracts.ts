import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logActivity } from './activities';
import { sendContractSentEmail, sendContractAgreedNotification } from '../services/email';
import { enrollInOnboarding } from '../services/onboardingService';

const router = Router();
import prisma from '../lib/prisma';

// =====================
// CONTRACT TEMPLATES
// =====================

const CONTRACT_TEMPLATES: Record<string, { title: string; content: string }> = {
  PHOTOGRAPHY_SHOOT: {
    title: 'Photography Shoot Agreement',
    content: `<h2>Photography Services Agreement</h2>
<p>This Photography Services Agreement ("Agreement") is entered into between <strong>{{studioName}}</strong> ("Photographer") and <strong>{{clientName}}</strong> ("Client") for the project described below.</p>
<h3>1. Project Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Event/Session Date:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Services Provided</h3>
<p>The Photographer agrees to provide professional photography services as discussed. This includes pre-shoot consultation, the photography session, and post-production editing of the final deliverables.</p>
<h3>3. Deliverables</h3>
<p>The Photographer will deliver a curated selection of professionally edited digital images. Delivery will be via a secure online gallery within 2-4 weeks of the session date, unless otherwise agreed.</p>
<h3>4. Payment Terms</h3>
<p>A non-refundable retainer of 30% of the total fee is due upon signing this agreement. The remaining balance is due no later than 7 days before the session date.</p>
<h3>5. Cancellation &amp; Rescheduling</h3>
<p>Client may reschedule with at least 14 days' written notice, subject to availability. Cancellations less than 14 days before forfeit the retainer. Cancellations less than 48 hours before forfeit the full fee. The Photographer may cancel due to unforeseen circumstances, in which case all payments will be fully refunded.</p>
<h3>6. Usage Rights</h3>
<p>Upon full payment, the Client receives a personal, non-exclusive license to use the images. The Photographer retains full copyright and may use images for portfolio and marketing unless otherwise agreed in writing.</p>
<h3>7. Liability Limitation</h3>
<p>Total liability shall not exceed the total fee paid. The Photographer is not liable for indirect or consequential damages.</p>
<h3>8. Agreement</h3>
<p>By agreeing below, both parties acknowledge they have read, understood, and agree to the terms outlined in this agreement.</p>`,
  },
  PORTRAIT_COMMISSION: {
    title: 'Art Commission Agreement',
    content: `<h2>Art Commission Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> ("Artist") and <strong>{{clientName}}</strong> ("Client").</p>
<h3>1. Commission Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Estimated Completion:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Scope of Work</h3>
<p>The Artist agrees to create an original artwork as described. Up to two rounds of revisions are included after the initial concept is presented.</p>
<h3>3. Deliverables</h3>
<p>The final deliverable will be the completed artwork in the agreed format (physical piece, digital file, or both).</p>
<h3>4. Payment Terms</h3>
<p>A non-refundable deposit of 50% is due upon acceptance. The remaining 50% is due upon completion and before delivery.</p>
<h3>5. Cancellation Policy</h3>
<p>If the Client cancels after work has begun, the deposit is non-refundable. If cancellation occurs after the concept phase, the Client will be billed for work completed to date.</p>
<h3>6. Intellectual Property</h3>
<p>Upon full payment, the Client receives ownership of the physical artwork (if applicable). The Artist retains the right to reproduce the work for portfolio and exhibitions.</p>
<h3>7. Liability</h3>
<p>Liability is limited to the total commission fee.</p>
<h3>8. Agreement</h3>
<p>By agreeing below, both parties acknowledge they have read, understood, and agree to the terms.</p>`,
  },
  LOGO_DESIGN: {
    title: 'Design Project Agreement',
    content: `<h2>Design Project Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> ("Designer") and <strong>{{clientName}}</strong> ("Client").</p>
<h3>1. Project Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Estimated Completion:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Scope of Work</h3>
<p>Professional design services including concept development, design iterations, and final production files.</p>
<h3>3. Deliverables</h3>
<p>Final design files in industry-standard formats (AI, EPS, PDF, PNG, SVG). Source files provided upon full payment.</p>
<h3>4. Revisions</h3>
<p>Up to three rounds of revisions per concept are included. Additional revisions billed at agreed hourly rate.</p>
<h3>5. Payment Terms</h3>
<p>50% deposit due upon signing. Remaining balance due upon delivery of final files.</p>
<h3>6. Cancellation</h3>
<p>Deposit is non-refundable. Work completed beyond deposit value will be invoiced.</p>
<h3>7. Intellectual Property</h3>
<p>Upon full payment, all rights to final approved designs transfer to Client. Designer retains portfolio usage rights.</p>
<h3>8. Agreement</h3>
<p>By agreeing below, both parties acknowledge they have read, understood, and agree to the terms.</p>`,
  },
  WEB_DESIGN: {
    title: 'Web Design Agreement',
    content: `<h2>Web Design &amp; Development Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> ("Designer") and <strong>{{clientName}}</strong> ("Client").</p>
<h3>1. Project Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Estimated Completion:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Scope of Work</h3>
<p>Website design and/or development including wireframing, visual design, development, and basic testing.</p>
<h3>3. Payment Terms</h3>
<p>50% deposit due upon signing. Remaining balance due upon completion.</p>
<h3>4. Timeline &amp; Revisions</h3>
<p>Timeline begins upon receipt of deposit and required content. Two rounds of design revisions included.</p>
<h3>5. Intellectual Property</h3>
<p>Upon full payment, Client owns the final website design. Third-party assets remain subject to their licenses.</p>
<h3>6. Agreement</h3>
<p>By agreeing below, both parties acknowledge they have read and agree to the terms.</p>`,
  },
  GENERAL_SERVICE: {
    title: 'General Service Agreement',
    content: `<h2>Service Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> ("Provider") and <strong>{{clientName}}</strong> ("Client").</p>
<h3>1. Project Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Estimated Completion:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Services</h3>
<p>The Provider agrees to deliver the services as described in the project brief.</p>
<h3>3. Payment</h3>
<p>50% deposit due upon signing. Remaining balance due upon completion.</p>
<h3>4. Cancellation</h3>
<p>Either party may cancel with 14 days' written notice. Deposit is non-refundable.</p>
<h3>5. Liability</h3>
<p>Liability is limited to the total fee paid.</p>
<h3>6. Agreement</h3>
<p>By agreeing below, both parties acknowledge they agree to the terms.</p>`,
  },
  CUSTOM: {
    title: 'Custom Agreement',
    content: `<h2>Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> and <strong>{{clientName}}</strong> for <strong>{{projectTitle}}</strong>.</p>
<p><em>Please customize this contract with your specific terms.</em></p>
<h3>1. Scope of Work</h3>
<p>[Describe the services to be provided]</p>
<h3>2. Payment Terms</h3>
<p>Agreed Fee: {{estimatedValue}}</p>
<h3>3. Timeline</h3>
<p>Estimated Completion: {{eventDate}}</p>
<h3>4. Agreement</h3>
<p>By agreeing below, both parties acknowledge they agree to the terms.</p>`,
  },
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  PHOTOGRAPHY_SHOOT: 'Photography Shoot',
  PORTRAIT_COMMISSION: 'Art Commission',
  LOGO_DESIGN: 'Design Project',
  WEB_DESIGN: 'Web Design',
  GENERAL_SERVICE: 'General Service',
  CUSTOM: 'Custom',
};

function fillTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || 'TBD');
  }
  return result;
}

// =====================
// AUTHENTICATED: USER-LEVEL
// =====================

// GET /api/contracts/pending — Fetch DRAFT contracts awaiting user review
router.get('/contracts/pending', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const contracts = await prisma.contract.findMany({
      where: {
        lead: { assignedToId: userId },
        status: 'DRAFT',
      },
      include: {
        lead: {
          select: { id: true, clientName: true, clientEmail: true, projectTitle: true, portalToken: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ contracts });
  } catch (error) {
    console.error('[CONTRACTS] Failed to fetch pending:', error);
    res.status(500).json({ error: 'Failed to fetch pending contracts' });
  }
});

// =====================
// AUTHENTICATED: LEAD-SCOPED
// =====================

// GET /api/leads/:leadId/contracts
router.get('/leads/:leadId/contracts', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.leadId as string;
    const userId = req.userId as string;
    // Check if user owns the lead (via assignedTo or via quote creation)
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        OR: [
          { assignedToId: userId },
          { quotes: { some: { createdById: userId } } },
        ],
      },
    });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    const contracts = await prisma.contract.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// POST /api/leads/:leadId/contracts
router.post('/leads/:leadId/contracts', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.leadId as string;
    const { templateType, title, content } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, assignedToId: req.userId as string },
      include: { assignedTo: { select: { studioName: true, firstName: true, lastName: true } } },
    });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }

    if (!templateType || !CONTRACT_TEMPLATES[templateType]) {
      res.status(400).json({ error: 'Invalid template type' });
      return;
    }

    const template = CONTRACT_TEMPLATES[templateType];
    const studioName = lead.assignedTo?.studioName || `${lead.assignedTo?.firstName || ''} ${lead.assignedTo?.lastName || ''}`.trim() || 'Studio';

    const filledContent = content || fillTemplate(template.content, {
      clientName: lead.clientName,
      projectTitle: lead.projectTitle,
      eventDate: lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'To be determined',
      estimatedValue: lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : 'To be agreed',
      studioName,
    });

    // Build industry-aware title
    const SERVICE_TITLES: Record<string, string> = {
      WEDDING_PHOTO: 'Wedding Photography Services Agreement',
      PORTRAIT_PHOTO: 'Portrait Photography Services Agreement',
      COMMERCIAL_PHOTO: 'Commercial Photography Services Agreement',
      EVENT_PHOTO: 'Event Photography Services Agreement',
      BRAND_DESIGN: 'Brand Design Services Agreement',
      GRAPHIC_DESIGN: 'Graphic Design Services Agreement',
      WEB_DESIGN: 'Web Design Services Agreement',
      FINE_ART: 'Fine Art Commission Agreement',
      ILLUSTRATION: 'Illustration Services Agreement',
      DIGITAL_ART: 'Digital Art Commission Agreement',
      PHOTOGRAPHY: 'Photography Services Agreement',
      VIDEOGRAPHY: 'Videography Services Agreement',
    };
    const contractTitle = title || SERVICE_TITLES[lead.serviceType] || template.title;

    const contract = await prisma.contract.create({
      data: {
        leadId,
        templateType: templateType as any,
        title: contractTitle,
        content: filledContent,
        status: 'DRAFT',
      },
    });

    await logActivity(leadId, req.userId as string, 'NOTE_ADDED', `Contract created: "${contract.title}" (Draft)`);
    res.status(201).json({ contract });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

// =====================
// CONTRACT-SCOPED ROUTES
// =====================

// GET /api/contracts/:id
router.get('/contracts/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { lead: { select: { assignedToId: true } } },
    });
    if (!contract || contract.lead.assignedToId !== (req.userId as string)) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }
    const { lead: _lead, ...contractData } = contract;
    res.json({ contract: contractData });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// PATCH /api/contracts/:id (DRAFT only)
router.patch('/contracts/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { lead: { select: { assignedToId: true } } },
    });
    if (!contract || contract.lead.assignedToId !== (req.userId as string)) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }
    if (contract.status !== 'DRAFT') {
      res.status(400).json({ error: 'Only draft contracts can be edited' });
      return;
    }
    const { title, content } = req.body;
    const updated = await prisma.contract.update({
      where: { id },
      data: { ...(title && { title }), ...(content && { content }) },
    });
    res.json({ contract: updated });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

// DELETE /api/contracts/:id (DRAFT only)
router.delete('/contracts/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { lead: { select: { assignedToId: true } } },
    });
    if (!contract || contract.lead.assignedToId !== (req.userId as string)) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }
    if (contract.status !== 'DRAFT') {
      res.status(400).json({ error: 'Only draft contracts can be deleted' });
      return;
    }
    await prisma.contract.delete({ where: { id } });
    res.json({ message: 'Contract deleted' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

// POST /api/contracts/:id/send
router.post('/contracts/:id/send', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { subject: customSubject, message: customMessage } = req.body || {};
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true, assignedToId: true, clientName: true, clientEmail: true,
            projectTitle: true, portalToken: true,
            assignedTo: { select: { studioName: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!contract || contract.lead.assignedToId !== (req.userId as string)) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }
    if (contract.status === 'AGREED') {
      res.status(400).json({ error: 'Contract already agreed' });
      return;
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    const studioName = contract.lead.assignedTo?.studioName || `${contract.lead.assignedTo?.firstName} ${contract.lead.assignedTo?.lastName}`;
    const portalUrl = `${process.env.FRONTEND_URL || 'https://hardened-crm-2.preview.emergentagent.com'}/portal/${contract.lead.portalToken}`;

    console.log('[CONTRACT SEND] Sending contract email to:', contract.lead.clientEmail, '| Contract:', contract.title);
    let emailSent = false;
    let emailError: string | undefined;
    try {
      emailSent = await sendContractSentEmail({
        clientName: contract.lead.clientName,
        clientEmail: contract.lead.clientEmail,
        projectTitle: contract.lead.projectTitle,
        contractTitle: contract.title,
        studioName: studioName || 'Studio',
        portalUrl,
        customSubject: customSubject || undefined,
        customMessage: customMessage || undefined,
      });
      console.log('[CONTRACT SEND] Email result:', emailSent ? 'SUCCESS' : 'FAILED');
    } catch (err: any) {
      emailError = err?.message || String(err);
      console.error('[CONTRACT SEND] Email exception:', err);
    }

    await logActivity(contract.lead.id, req.userId as string, 'CONTRACT_SIGNED', `Contract "${contract.title}" sent to ${contract.lead.clientEmail}`);
    res.json({
      contract: updated,
      emailSent,
      emailError,
      message: emailSent ? 'Contract sent successfully' : 'Contract status updated but email delivery failed',
    });
  } catch (error) {
    console.error('Error sending contract:', error);
    res.status(500).json({ error: 'Failed to send contract' });
  }
});

// POST /api/contracts/:id/agree (PUBLIC - verified by portalToken)
router.post('/contracts/:id/agree', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { portalToken } = req.body;

    if (!portalToken) {
      res.status(400).json({ error: 'Portal token required' });
      return;
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true, portalToken: true, clientName: true, clientEmail: true, projectTitle: true,
            assignedTo: { select: { email: true, studioName: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!contract || contract.lead.portalToken !== portalToken) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }
    if (contract.status === 'AGREED') {
      res.status(400).json({ error: 'Contract already signed' });
      return;
    }
    if (contract.status !== 'SENT' && contract.status !== 'VIEWED') {
      res.status(400).json({ error: 'Contract must be sent before signing' });
      return;
    }

    const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || (req.headers['x-real-ip'] as string)
      || req.socket.remoteAddress
      || 'unknown';

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        status: 'AGREED',
        clientAgreed: true,
        clientAgreedAt: new Date(),
        clientIP,
      },
    });

    if (contract.lead.assignedTo?.email) {
      const studioName = contract.lead.assignedTo.studioName || `${contract.lead.assignedTo.firstName} ${contract.lead.assignedTo.lastName}`;
      await sendContractAgreedNotification({
        ownerEmail: contract.lead.assignedTo.email,
        clientName: contract.lead.clientName,
        projectTitle: contract.lead.projectTitle,
        contractTitle: contract.title,
        agreedAt: new Date().toISOString(),
        clientIP,
        studioName: studioName || 'Studio',
      });
    }

    await logActivity(contract.lead.id, null, 'CONTRACT_SIGNED', `Client ${contract.lead.clientName} signed: "${contract.title}"`);

    // Auto-generate milestones for the project
    try {
      const existingMilestones = await prisma.projectMilestone.count({ where: { leadId: contract.leadId } });
      if (existingMilestones === 0) {
        const now = new Date();
        const in7Days = new Date(now); in7Days.setDate(in7Days.getDate() + 7);
        const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);
        const in45Days = new Date(now); in45Days.setDate(in45Days.getDate() + 45);

        await prisma.projectMilestone.createMany({
          data: [
            { leadId: contract.leadId, name: 'Contract Signed', description: 'Service agreement executed', dueDate: now, completed: true, completedAt: now, order: 0 },
            { leadId: contract.leadId, name: 'Deposit Payment', description: 'Initial deposit received', dueDate: in7Days, completed: false, order: 1 },
            { leadId: contract.leadId, name: 'Project Completion', description: 'All deliverables completed', dueDate: in30Days, completed: false, order: 2 },
            { leadId: contract.leadId, name: 'Final Payment', description: 'Balance payment received', dueDate: in45Days, completed: false, order: 3 },
          ],
        });
        console.log('[CONTRACT] Auto-generated 4 milestones for lead:', contract.leadId);
      }
    } catch (milestoneErr) {
      console.error('[CONTRACT] Failed to auto-generate milestones:', milestoneErr);
    }

    // Enroll client in onboarding drip sequence
    try {
      await enrollInOnboarding(contract.lead.id);
    } catch (err) {
      console.error('[CONTRACT] Failed to enroll in onboarding:', err);
    }

    res.json({ contract: { id: updated.id, status: updated.status, clientAgreedAt: updated.clientAgreedAt } });
  } catch (error) {
    console.error('Error processing agreement:', error);
    res.status(500).json({ error: 'Failed to process agreement' });
  }
});

// GET /api/contracts/templates/list
router.get('/contracts/templates/list', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  const templates = Object.entries(CONTRACT_TEMPLATES).map(([key, val]) => ({
    type: key,
    title: val.title,
    label: CONTRACT_TYPE_LABELS[key] || key,
  }));
  res.json({ templates });
});

export default router;
