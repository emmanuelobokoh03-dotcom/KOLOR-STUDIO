import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
import prisma from '../lib/prisma';

const VALID_INDUSTRIES = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'GRAPHIC_DESIGN', 'WEB_DESIGN', 'ILLUSTRATION', 'FINE_ART', 'SCULPTURE', 'BRANDING', 'CONTENT_CREATION', 'OTHER'];
const VALID_PROJECT_TYPES = ['SERVICE', 'COMMISSION', 'PROJECT', 'PRODUCT_SALE'];
const VALID_STAGE_TYPES = ['DISCOVERY', 'QUOTATION', 'AGREEMENT', 'SCHEDULING', 'CREATION', 'REVIEW', 'DELIVERY', 'PAYMENT', 'FOLLOWUP'];

// GET / — Get user's templates + system defaults
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const industry = req.query.industry as string | undefined;
    const projectType = req.query.projectType as string | undefined;

    const where: any = {
      OR: [
        { userId },
        { isSystem: true }
      ]
    };

    if (industry && VALID_INDUSTRIES.includes(industry)) {
      where.industry = industry;
    }
    if (projectType && VALID_PROJECT_TYPES.includes(projectType)) {
      where.projectType = projectType;
    }

    const templates = await prisma.workflowTemplate.findMany({
      where,
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { stages: true } }
      },
      orderBy: [{ isSystem: 'desc' }, { isDefault: 'desc' }, { name: 'asc' }]
    });

    res.json({ templates, count: templates.length });
  } catch (error) {
    console.error('Get workflow templates error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch workflow templates' });
  }
});

// GET /industry/:industry — Filter templates by industry
router.get('/industry/:industry', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const industry = req.params.industry as string;

    if (!VALID_INDUSTRIES.includes(industry)) {
      res.status(400).json({ error: 'Validation Error', message: `Invalid industry. Must be one of: ${VALID_INDUSTRIES.join(', ')}` });
      return;
    }

    const templates = await prisma.workflowTemplate.findMany({
      where: {
        industry: industry as any,
        OR: [{ userId }, { isSystem: true }]
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { stages: true } }
      },
      orderBy: [{ isSystem: 'desc' }, { isDefault: 'desc' }, { name: 'asc' }]
    });

    res.json({ templates, count: templates.length });
  } catch (error) {
    console.error('Get templates by industry error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch templates by industry' });
  }
});

// GET /:id — Get single template with stages
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const template = await prisma.workflowTemplate.findFirst({
      where: {
        id,
        OR: [{ userId }, { isSystem: true }]
      },
      include: {
        stages: { orderBy: { order: 'asc' } }
      }
    });

    if (!template) {
      res.status(404).json({ error: 'Not Found', message: 'Workflow template not found' });
      return;
    }

    res.json({ template });
  } catch (error) {
    console.error('Get workflow template error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch workflow template' });
  }
});

// POST / — Create custom template with stages
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { name, description, industry, projectType, isDefault, stages } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Validation Error', message: 'Template name is required' });
      return;
    }

    if (industry && !VALID_INDUSTRIES.includes(industry)) {
      res.status(400).json({ error: 'Validation Error', message: `Invalid industry` });
      return;
    }

    if (projectType && !VALID_PROJECT_TYPES.includes(projectType)) {
      res.status(400).json({ error: 'Validation Error', message: `Invalid project type` });
      return;
    }

    // If setting as default, unset other defaults for same industry/projectType
    if (isDefault) {
      await prisma.workflowTemplate.updateMany({
        where: {
          userId,
          isDefault: true,
          ...(industry ? { industry: industry as any } : {}),
          ...(projectType ? { projectType: projectType as any } : {})
        },
        data: { isDefault: false }
      });
    }

    const template = await prisma.workflowTemplate.create({
      data: {
        name,
        description,
        industry: industry || null,
        projectType: projectType || null,
        isDefault: isDefault || false,
        isSystem: false,
        userId,
        stages: stages?.length ? {
          create: stages.map((stage: any, index: number) => ({
            name: stage.name,
            order: stage.order ?? index,
            type: VALID_STAGE_TYPES.includes(stage.type) ? stage.type : 'CREATION',
            required: stage.required ?? true,
            description: stage.description || null,
            fieldConfig: stage.fieldConfig || null,
          }))
        } : undefined
      },
      include: {
        stages: { orderBy: { order: 'asc' } }
      }
    });

    res.status(201).json({ message: 'Workflow template created', template });
  } catch (error) {
    console.error('Create workflow template error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create workflow template' });
  }
});

// PATCH /:id — Update template (and optionally replace stages)
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const { name, description, industry, projectType, isDefault, stages } = req.body;

    const existing = await prisma.workflowTemplate.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Template not found or not owned by you' });
      return;
    }

    if (existing.isSystem) {
      res.status(403).json({ error: 'Forbidden', message: 'Cannot modify system templates' });
      return;
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.workflowTemplate.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: id },
          ...(industry ? { industry: industry as any } : existing.industry ? { industry: existing.industry } : {}),
        },
        data: { isDefault: false }
      });
    }

    // Build update data
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (industry !== undefined) data.industry = industry;
    if (projectType !== undefined) data.projectType = projectType;
    if (isDefault !== undefined) data.isDefault = isDefault;

    // If stages provided, replace all stages
    if (stages && Array.isArray(stages)) {
      await prisma.workflowStage.deleteMany({ where: { templateId: id } });
      await prisma.workflowStage.createMany({
        data: stages.map((stage: any, index: number) => ({
          templateId: id,
          name: stage.name,
          order: stage.order ?? index,
          type: VALID_STAGE_TYPES.includes(stage.type) ? stage.type : 'CREATION',
          required: stage.required ?? true,
          description: stage.description || null,
          fieldConfig: stage.fieldConfig || null,
        }))
      });
    }

    const template = await prisma.workflowTemplate.update({
      where: { id },
      data,
      include: {
        stages: { orderBy: { order: 'asc' } }
      }
    });

    res.json({ message: 'Template updated', template });
  } catch (error) {
    console.error('Update workflow template error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update workflow template' });
  }
});

// DELETE /:id — Delete custom template (block system templates)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const template = await prisma.workflowTemplate.findFirst({
      where: { id, userId }
    });

    if (!template) {
      res.status(404).json({ error: 'Not Found', message: 'Template not found' });
      return;
    }

    if (template.isSystem) {
      res.status(403).json({ error: 'Forbidden', message: 'Cannot delete system templates' });
      return;
    }

    // Cascade deletes stages via FK constraint
    await prisma.workflowTemplate.delete({ where: { id } });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete workflow template error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete workflow template' });
  }
});

export default router;
