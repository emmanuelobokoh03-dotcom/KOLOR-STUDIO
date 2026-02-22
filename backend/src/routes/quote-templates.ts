import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/quote-templates - Get all templates for user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const templates = await prisma.quoteTemplate.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        lineItems: true,
        paymentTerms: true,
        terms: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get templates' });
  }
});

// GET /api/quote-templates/:id - Get single template
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const templateId = req.params.id as string;

    const template = await prisma.quoteTemplate.findFirst({
      where: { id: templateId, userId }
    });

    if (!template) {
      res.status(404).json({ error: 'Not Found', message: 'Template not found' });
      return;
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get template' });
  }
});

// POST /api/quote-templates - Create template
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { name, description, lineItems, paymentTerms, terms } = req.body;

    // Validation
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Validation Error', message: 'Template name is required' });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({ error: 'Validation Error', message: 'Template name must be 100 characters or less' });
      return;
    }

    if (description && description.length > 500) {
      res.status(400).json({ error: 'Validation Error', message: 'Description must be 500 characters or less' });
      return;
    }

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({ error: 'Validation Error', message: 'At least one line item is required' });
      return;
    }

    // Validate line items
    for (const item of lineItems) {
      if (!item.description || item.description.trim() === '') {
        res.status(400).json({ error: 'Validation Error', message: 'Each line item must have a description' });
        return;
      }
      if (typeof item.quantity !== 'number' || item.quantity < 0) {
        res.status(400).json({ error: 'Validation Error', message: 'Quantity must be a positive number' });
        return;
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        res.status(400).json({ error: 'Validation Error', message: 'Price must be a positive number' });
        return;
      }
    }

    // Process line items
    const processedLineItems = lineItems.map((item: any) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    const template = await prisma.quoteTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        lineItems: processedLineItems,
        paymentTerms: paymentTerms || 'DEPOSIT_50',
        terms: terms || null,
        userId,
      }
    });

    res.status(201).json({ 
      message: 'Template created successfully',
      template 
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create template' });
  }
});

// PATCH /api/quote-templates/:id - Update template
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const templateId = req.params.id as string;
    const { name, description, lineItems, paymentTerms, terms } = req.body;

    // Check ownership
    const existingTemplate = await prisma.quoteTemplate.findFirst({
      where: { id: templateId, userId }
    });

    if (!existingTemplate) {
      res.status(404).json({ error: 'Not Found', message: 'Template not found' });
      return;
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400).json({ error: 'Validation Error', message: 'Template name is required' });
        return;
      }
      if (name.length > 100) {
        res.status(400).json({ error: 'Validation Error', message: 'Template name must be 100 characters or less' });
        return;
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        res.status(400).json({ error: 'Validation Error', message: 'Description must be 500 characters or less' });
        return;
      }
      updateData.description = description?.trim() || null;
    }

    if (lineItems !== undefined) {
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        res.status(400).json({ error: 'Validation Error', message: 'At least one line item is required' });
        return;
      }
      
      const processedLineItems = lineItems.map((item: any) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        price: Number(item.price),
      }));
      updateData.lineItems = processedLineItems;
    }

    if (paymentTerms !== undefined) {
      updateData.paymentTerms = paymentTerms;
    }

    if (terms !== undefined) {
      updateData.terms = terms || null;
    }

    const template = await prisma.quoteTemplate.update({
      where: { id: templateId },
      data: updateData
    });

    res.json({ 
      message: 'Template updated successfully',
      template 
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update template' });
  }
});

// DELETE /api/quote-templates/:id - Delete template
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const templateId = req.params.id as string;

    // Check ownership
    const template = await prisma.quoteTemplate.findFirst({
      where: { id: templateId, userId }
    });

    if (!template) {
      res.status(404).json({ error: 'Not Found', message: 'Template not found' });
      return;
    }

    await prisma.quoteTemplate.delete({
      where: { id: templateId }
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete template' });
  }
});

export default router;
