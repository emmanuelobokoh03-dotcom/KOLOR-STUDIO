import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendQuoteEmail, sendQuoteAcceptedNotification, sendQuoteDeclinedNotification } from '../services/email';
import { generateQuotePDF } from '../services/pdf.service';

const router = Router();
const prisma = new PrismaClient();

// Helper to generate quote number
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `Q-${year}-`;
  
  // Find the latest quote number for this year
  const latestQuote = await prisma.quote.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      quoteNumber: 'desc'
    }
  });
  
  let nextNumber = 1;
  if (latestQuote) {
    const lastNum = parseInt(latestQuote.quoteNumber.replace(prefix, ''));
    nextNumber = lastNum + 1;
  }
  
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

// Helper to calculate quote totals
function calculateTotals(lineItems: any[], taxPercentage: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * (taxPercentage / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

// POST /api/leads/:leadId/quotes - Create quote
router.post('/:leadId/quotes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.leadId as string;
    const userId = req.userId!;
    const { lineItems, tax, paymentTerms, validUntil, terms, currency, currencySymbol, currencyPosition, numberFormat } = req.body;

    // Validate lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, assignedToId: userId }
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    // Validate line items
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({ error: 'Validation Error', message: 'At least one line item is required' });
      return;
    }

    for (const item of lineItems) {
      if (!item.description || item.price === undefined || item.quantity === undefined) {
        res.status(400).json({ error: 'Validation Error', message: 'Each line item must have description, quantity, and price' });
        return;
      }
      if (item.price < 0 || item.quantity < 0) {
        res.status(400).json({ error: 'Validation Error', message: 'Price and quantity must be positive' });
        return;
      }
    }

    // Calculate totals for each line item
    const processedLineItems = lineItems.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity),
      price: Number(item.price),
      total: Number(item.quantity) * Number(item.price)
    }));

    const taxPercentage = Number(tax) || 0;
    if (taxPercentage < 0 || taxPercentage > 100) {
      res.status(400).json({ error: 'Validation Error', message: 'Tax percentage must be between 0 and 100' });
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals(processedLineItems, taxPercentage);

    // Validate valid until date
    const validUntilDate = validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (validUntilDate <= new Date()) {
      res.status(400).json({ error: 'Validation Error', message: 'Valid until date must be in the future' });
      return;
    }

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Create quote with optional currency override
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        leadId,
        createdById: userId,
        lineItems: processedLineItems,
        subtotal,
        tax: taxPercentage,
        taxAmount,
        total,
        paymentTerms: paymentTerms || 'DEPOSIT_50',
        validUntil: validUntilDate,
        terms: terms || null,
        status: 'DRAFT',
        // Currency override fields (only set if provided)
        currency: currency || null,
        currencySymbol: currencySymbol || null,
        currencyPosition: currencyPosition || null,
        numberFormat: numberFormat || null,
      },
      include: {
        lead: {
          select: {
            clientName: true,
            clientEmail: true,
            projectTitle: true
          }
        },
        createdBy: {
          select: {
            currency: true,
            currencySymbol: true,
            currencyPosition: true,
            numberFormat: true,
          }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'QUOTE_CREATED',
        description: `Quote ${quoteNumber} created ($${total.toLocaleString()})`,
        leadId,
        userId,
        metadata: { quoteId: quote.id, quoteNumber, total }
      }
    });

    res.status(201).json({ quote });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create quote' });
  }
});

// GET /api/leads/:leadId/quotes - Get all quotes for a lead
router.get('/:leadId/quotes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.leadId as string;
    const userId = req.userId!;

    // Validate lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, assignedToId: userId }
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const quotes = await prisma.quote.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: {
        lead: {
          select: {
            clientName: true,
            clientEmail: true,
            projectTitle: true
          }
        },
        createdBy: {
          select: {
            currency: true,
            currencySymbol: true,
            currencyPosition: true,
            numberFormat: true,
          }
        }
      }
    });

    res.json({ quotes });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get quotes' });
  }
});

// GET /api/quotes/:quoteId - Get single quote
router.get('/quotes/:quoteId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = req.params.quoteId as string;
    const userId = req.userId!;

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, createdById: userId },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            clientEmail: true,
            clientPhone: true,
            clientCompany: true,
            projectTitle: true,
            serviceType: true,
            description: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            studioName: true,
            email: true
          }
        }
      }
    });

    if (!quote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    res.json({ quote });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get quote' });
  }
});

// GET /api/quotes/:quoteId/pdf - Download quote as PDF (Authenticated)
router.get('/quotes/:quoteId/pdf', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = req.params.quoteId as string;
    const userId = req.userId!;

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, createdById: userId },
      include: {
        lead: {
          select: {
            clientName: true,
            clientEmail: true,
            projectTitle: true,
            serviceType: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            studioName: true,
            email: true,
            phone: true,
            website: true,
            logo: true,
            currency: true,
            currencySymbol: true,
            currencyPosition: true,
            numberFormat: true,
          }
        }
      }
    });

    if (!quote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(quote as any);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quote.quoteNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate quote PDF error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to generate PDF' });
  }
});

// PATCH /api/quotes/:quoteId - Update quote
router.patch('/quotes/:quoteId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = req.params.quoteId as string;
    const userId = req.userId!;
    const { lineItems, tax, paymentTerms, validUntil, terms } = req.body;

    // Find quote
    const existingQuote = await prisma.quote.findFirst({
      where: { id: quoteId, createdById: userId }
    });

    if (!existingQuote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    if (existingQuote.status !== 'DRAFT') {
      res.status(400).json({ error: 'Bad Request', message: 'Only draft quotes can be updated' });
      return;
    }

    // Prepare update data
    const updateData: any = {};

    if (lineItems !== undefined) {
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        res.status(400).json({ error: 'Validation Error', message: 'At least one line item is required' });
        return;
      }

      const processedLineItems = lineItems.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.quantity) * Number(item.price)
      }));

      const taxPercentage = tax !== undefined ? Number(tax) : existingQuote.tax;
      const { subtotal, taxAmount, total } = calculateTotals(processedLineItems, taxPercentage);

      updateData.lineItems = processedLineItems;
      updateData.subtotal = subtotal;
      updateData.tax = taxPercentage;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
    } else if (tax !== undefined) {
      const taxPercentage = Number(tax);
      const totals = calculateTotals(existingQuote.lineItems as any[], taxPercentage);
      updateData.tax = taxPercentage;
      updateData.taxAmount = totals.taxAmount;
      updateData.total = totals.total;
    }

    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
    if (terms !== undefined) updateData.terms = terms;

    const quote = await prisma.quote.update({
      where: { id: quoteId },
      data: updateData,
      include: {
        lead: {
          select: {
            clientName: true,
            clientEmail: true,
            projectTitle: true
          }
        }
      }
    });

    res.json({ quote });
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update quote' });
  }
});

// DELETE /api/quotes/:quoteId - Delete quote
router.delete('/quotes/:quoteId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = req.params.quoteId as string;
    const userId = req.userId!;

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, createdById: userId }
    });

    if (!quote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    if (quote.status !== 'DRAFT') {
      res.status(400).json({ error: 'Bad Request', message: 'Only draft quotes can be deleted' });
      return;
    }

    await prisma.quote.delete({ where: { id: quoteId } });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'NOTE_ADDED',
        description: `Quote ${quote.quoteNumber} deleted`,
        leadId: quote.leadId,
        userId
      }
    });

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete quote' });
  }
});

// POST /api/quotes/:quoteId/send - Send quote to client
router.post('/quotes/:quoteId/send', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = req.params.quoteId as string;
    const userId = req.userId!;

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, createdById: userId },
      include: {
        lead: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            studioName: true,
            email: true
          }
        }
      }
    });

    if (!quote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
      res.status(400).json({ error: 'Bad Request', message: 'Quote cannot be sent in current status' });
      return;
    }

    // Check if quote is expired
    if (quote.validUntil < new Date()) {
      res.status(400).json({ error: 'Bad Request', message: 'Quote has expired. Please update the valid until date.' });
      return;
    }

    // Update quote status
    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });

    // Send email to client
    try {
      await sendQuoteEmail({
        clientName: (quote as any).lead.clientName,
        clientEmail: (quote as any).lead.clientEmail,
        projectTitle: (quote as any).lead.projectTitle,
        quoteNumber: quote.quoteNumber,
        total: quote.total,
        validUntil: quote.validUntil,
        quoteToken: quote.quoteToken,
        studioName: (quote as any).createdBy.studioName || `${(quote as any).createdBy.firstName}'s Studio`
      });
      console.log(`Quote email sent to ${(quote as any).lead.clientEmail}`);
    } catch (emailError) {
      console.error('Failed to send quote email:', emailError);
      // Don't fail the request, just log it
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'QUOTE_SENT',
        description: `Quote ${quote.quoteNumber} sent to client`,
        leadId: quote.leadId,
        userId,
        metadata: { quoteId, quoteNumber: quote.quoteNumber }
      }
    });

    // Update lead status to QUOTED if it's not already past that stage
    const statusOrder = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING', 'BOOKED', 'LOST'];
    const currentStatusIndex = statusOrder.indexOf((quote as any).lead.status);
    const quotedStatusIndex = statusOrder.indexOf('QUOTED');

    if (currentStatusIndex < quotedStatusIndex) {
      await prisma.lead.update({
        where: { id: quote.leadId },
        data: { status: 'QUOTED' }
      });
    }

    res.json({ message: 'Quote sent successfully', quote: updatedQuote });
  } catch (error) {
    console.error('Send quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to send quote' });
  }
});

// GET /api/quotes/public/:quoteToken - Get quote by token (PUBLIC)
router.get('/quotes/public/:quoteToken', async (req: Request, res: Response): Promise<void> => {
  try {
    const quoteToken = req.params.quoteToken as string;

    const quote = await prisma.quote.findUnique({
      where: { quoteToken },
      include: {
        lead: {
          select: {
            clientName: true,
            clientEmail: true,
            projectTitle: true,
            serviceType: true,
            description: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            studioName: true,
            email: true,
            phone: true,
            currency: true,
            currencySymbol: true,
            currencyPosition: true,
            numberFormat: true,
          }
        }
      }
    });

    if (!quote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    // Check if expired
    if (quote.validUntil < new Date() && quote.status !== 'ACCEPTED' && quote.status !== 'DECLINED') {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'EXPIRED' }
      });
      quote.status = 'EXPIRED';
    }

    // Update viewedAt and status if first time viewing
    if (quote.status === 'SENT' && !quote.viewedAt) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          viewedAt: new Date(),
          status: 'VIEWED'
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          type: 'QUOTE_VIEWED',
          description: `Client viewed quote ${quote.quoteNumber}`,
          leadId: quote.leadId,
          metadata: { quoteId: quote.id, quoteNumber: quote.quoteNumber }
        }
      });

      quote.status = 'VIEWED';
      quote.viewedAt = new Date();
    }

    // Merge currency settings: quote override > creator default
    const currencySettings = {
      currency: quote.currency || (quote as any).createdBy.currency,
      currencySymbol: quote.currencySymbol || (quote as any).createdBy.currencySymbol,
      currencyPosition: quote.currencyPosition || (quote as any).createdBy.currencyPosition,
      numberFormat: quote.numberFormat || (quote as any).createdBy.numberFormat,
    };

    res.json({ 
      quote: {
        ...quote,
        currencySettings
      }
    });
  } catch (error) {
    console.error('Get public quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get quote' });
  }
});

// GET /api/quotes/public/:quoteToken/pdf - Download quote as PDF (PUBLIC)
router.get('/quotes/public/:quoteToken/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const quoteToken = req.params.quoteToken as string;

    const quote = await prisma.quote.findUnique({
      where: { quoteToken },
      include: {
        lead: {
          select: {
            clientName: true,
            clientEmail: true,
            projectTitle: true,
            serviceType: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            studioName: true,
            email: true,
            phone: true,
            website: true,
            logo: true,
            currency: true,
            currencySymbol: true,
            currencyPosition: true,
            numberFormat: true,
          }
        }
      }
    });

    if (!quote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(quote as any);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quote.quoteNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate quote PDF error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to generate PDF' });
  }
});

// POST /api/quotes/public/:quoteToken/accept - Client accepts quote (PUBLIC)
router.post('/quotes/public/:quoteToken/accept', async (req: Request, res: Response): Promise<void> => {
  try {
    const quoteToken = req.params.quoteToken as string;

    const quote = await prisma.quote.findUnique({
      where: { quoteToken },
      include: {
        lead: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            studioName: true,
            email: true
          }
        }
      }
    });

    if (!quote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    if (quote.status === 'ACCEPTED') {
      res.status(400).json({ error: 'Bad Request', message: 'Quote has already been accepted' });
      return;
    }

    if (quote.status === 'DECLINED') {
      res.status(400).json({ error: 'Bad Request', message: 'Quote has been declined' });
      return;
    }

    if (quote.status === 'EXPIRED' || quote.validUntil < new Date()) {
      res.status(400).json({ error: 'Bad Request', message: 'Quote has expired' });
      return;
    }

    // Update quote status
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    // Update lead status to BOOKED
    await prisma.lead.update({
      where: { id: quote.leadId },
      data: {
        status: 'BOOKED',
        actualValue: quote.total,
        convertedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'QUOTE_ACCEPTED',
        description: `Quote ${quote.quoteNumber} accepted ($${quote.total.toLocaleString()})`,
        leadId: quote.leadId,
        metadata: { quoteId: quote.id, quoteNumber: quote.quoteNumber, total: quote.total }
      }
    });

    // Send notification email to studio owner
    try {
      await sendQuoteAcceptedNotification({
        ownerEmail: (quote as any).createdBy.email,
        ownerName: (quote as any).createdBy.firstName,
        clientName: (quote as any).lead.clientName,
        projectTitle: (quote as any).lead.projectTitle,
        quoteNumber: quote.quoteNumber,
        total: quote.total,
        leadId: quote.leadId
      });
    } catch (emailError) {
      console.error('Failed to send quote accepted notification:', emailError);
    }

    res.json({ message: 'Quote accepted successfully! We will be in touch soon.' });
  } catch (error) {
    console.error('Accept quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to accept quote' });
  }
});

// POST /api/quotes/public/:quoteToken/decline - Client declines quote (PUBLIC)
router.post('/quotes/public/:quoteToken/decline', async (req: Request, res: Response): Promise<void> => {
  try {
    const quoteToken = req.params.quoteToken as string;
    const { reason } = req.body;

    const quote = await prisma.quote.findUnique({
      where: { quoteToken },
      include: {
        lead: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            studioName: true,
            email: true
          }
        }
      }
    });

    if (!quote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    if (quote.status === 'ACCEPTED') {
      res.status(400).json({ error: 'Bad Request', message: 'Quote has already been accepted' });
      return;
    }

    if (quote.status === 'DECLINED') {
      res.status(400).json({ error: 'Bad Request', message: 'Quote has already been declined' });
      return;
    }

    // Update quote status
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: reason || null
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'QUOTE_DECLINED',
        description: `Quote ${quote.quoteNumber} declined${reason ? `: "${reason}"` : ''}`,
        leadId: quote.leadId,
        metadata: { quoteId: quote.id, quoteNumber: quote.quoteNumber, reason }
      }
    });

    // Send notification email to studio owner
    try {
      await sendQuoteDeclinedNotification({
        ownerEmail: (quote as any).createdBy.email,
        ownerName: (quote as any).createdBy.firstName,
        clientName: (quote as any).lead.clientName,
        projectTitle: (quote as any).lead.projectTitle,
        quoteNumber: quote.quoteNumber,
        total: quote.total,
        reason: reason || undefined,
        leadId: quote.leadId
      });
    } catch (emailError) {
      console.error('Failed to send quote declined notification:', emailError);
    }

    res.json({ message: 'Quote declined. Thank you for letting us know.' });
  } catch (error) {
    console.error('Decline quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to decline quote' });
  }
});

// POST /api/quotes/:quoteId/duplicate - Duplicate a quote
router.post('/quotes/:quoteId/duplicate', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = req.params.quoteId as string;
    const userId = req.userId!;

    const existingQuote = await prisma.quote.findFirst({
      where: { id: quoteId, createdById: userId }
    });

    if (!existingQuote) {
      res.status(404).json({ error: 'Not Found', message: 'Quote not found' });
      return;
    }

    // Generate new quote number
    const quoteNumber = await generateQuoteNumber();

    // Create duplicate as draft
    const newQuote = await prisma.quote.create({
      data: {
        quoteNumber,
        leadId: existingQuote.leadId,
        createdById: userId,
        lineItems: existingQuote.lineItems as any,
        subtotal: existingQuote.subtotal,
        tax: existingQuote.tax,
        taxAmount: existingQuote.taxAmount,
        total: existingQuote.total,
        paymentTerms: existingQuote.paymentTerms,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        terms: existingQuote.terms,
        status: 'DRAFT'
      },
      include: {
        lead: {
          select: {
            clientName: true,
            clientEmail: true,
            projectTitle: true
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'QUOTE_CREATED',
        description: `Quote ${quoteNumber} created (duplicated from ${existingQuote.quoteNumber})`,
        leadId: existingQuote.leadId,
        userId,
        metadata: { quoteId: newQuote.id, quoteNumber, duplicatedFrom: existingQuote.quoteNumber }
      }
    });

    res.status(201).json({ quote: newQuote });
  } catch (error) {
    console.error('Duplicate quote error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to duplicate quote' });
  }
});

export default router;
