import { Router, Response } from 'express';
import { PortfolioCategory } from '@prisma/client';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
import prisma from '../lib/prisma';

// Supabase client for storage
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'portfolio-images';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) 
  : null;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for portfolio images
  },
  fileFilter: (_req, file, cb) => {
    // Only allow images
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Ensure portfolio bucket exists
async function ensurePortfolioBucketExists(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Portfolio images are public
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      });

      if (error && !error.message.includes('already exists')) {
        console.error('Error creating portfolio bucket:', error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error ensuring portfolio bucket:', error);
    return false;
  }
}

// Initialize bucket on module load
ensurePortfolioBucketExists();

// Upload image to Supabase Storage
async function uploadPortfolioImage(
  buffer: Buffer,
  filename: string,
  mimetype: string,
  userId: string
): Promise<{ url: string; path: string } | null> {
  if (!supabase) {
    console.error('Supabase not configured');
    return null;
  }

  try {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `users/${userId}/portfolio/${timestamp}-${sanitizedFilename}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
}

// Delete image from Supabase Storage
async function deletePortfolioImage(filePath: string): Promise<boolean> {
  if (!supabase || !filePath) return false;

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

// GET /api/portfolio - Get current user's portfolio items
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const category = req.query.category as string | undefined;
    const featured = req.query.featured as string | undefined;

    const where: any = { userId };

    if (category && category !== 'ALL') {
      where.category = category as PortfolioCategory;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    const portfolio = await prisma.portfolio.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ portfolio, count: portfolio.length });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch portfolio' });
  }
});

// GET /api/portfolio/public/:userId - Get public portfolio (no auth required)
router.get('/public/:userId', async (req, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const category = req.query.category as string | undefined;
    const featured = req.query.featured as string | undefined;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studioName: true,
        businessName: true,
        speciality: true,
        industry: true,
        brandPrimaryColor: true,
        brandAccentColor: true,
        brandFontFamily: true,
        brandLogoUrl: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    const where: any = { userId };

    if (category && category !== 'ALL') {
      where.category = category as PortfolioCategory;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    const portfolio = await prisma.portfolio.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        tags: true,
        featured: true,
        order: true,
        createdAt: true,
      },
    });

    res.json({ 
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        studioName: user.studioName,
        businessName: user.businessName,
        speciality: user.speciality,
        industry: user.industry,
        brandPrimaryColor: user.brandPrimaryColor,
        brandAccentColor: user.brandAccentColor,
        brandFontFamily: user.brandFontFamily,
        brandLogoUrl: user.brandLogoUrl,
      },
      portfolio, 
      count: portfolio.length 
    });
  } catch (error) {
    console.error('Get public portfolio error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch portfolio' });
  }
});

// GET /api/portfolio/:id - Get single portfolio item
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const item = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!item) {
      res.status(404).json({ error: 'Not Found', message: 'Portfolio item not found' });
      return;
    }

    res.json({ item });
  } catch (error) {
    console.error('Get portfolio item error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch portfolio item' });
  }
});

// POST /api/portfolio - Create portfolio item with image upload
router.post('/', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { title, description, category, tags, featured } = req.body;

    // Validate required fields
    if (!title || !category) {
      res.status(400).json({ error: 'Bad Request', message: 'Title and category are required' });
      return;
    }

    // Validate image was uploaded
    if (!req.file) {
      res.status(400).json({ error: 'Bad Request', message: 'Image is required' });
      return;
    }

    // Upload image to Supabase
    const uploadResult = await uploadPortfolioImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId
    );

    if (!uploadResult) {
      res.status(500).json({ error: 'Server Error', message: 'Failed to upload image' });
      return;
    }

    // Get current max order
    const maxOrder = await prisma.portfolio.aggregate({
      where: { userId },
      _max: { order: true },
    });

    // Parse tags if it's a string
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : [];
      }
    }

    // Create portfolio item
    const item = await prisma.portfolio.create({
      data: {
        userId,
        title,
        description: description || null,
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path,
        category: category as PortfolioCategory,
        tags: parsedTags,
        featured: featured === 'true' || featured === true,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    res.status(201).json({ message: 'Portfolio item created', item });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create portfolio item' });
  }
});

// PATCH /api/portfolio/:id - Update portfolio item
router.patch('/:id', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const { title, description, category, tags, featured, order } = req.body;

    // Verify ownership
    const existing = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Portfolio item not found' });
      return;
    }

    // Build update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (category !== undefined) updateData.category = category as PortfolioCategory;
    if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
    if (order !== undefined) updateData.order = parseInt(order, 10);

    // Parse tags
    if (tags !== undefined) {
      try {
        updateData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        updateData.tags = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : [];
      }
    }

    // Handle image update
    if (req.file) {
      // Upload new image
      const uploadResult = await uploadPortfolioImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId
      );

      if (uploadResult) {
        // Delete old image if it exists
        if (existing.imagePath) {
          await deletePortfolioImage(existing.imagePath);
        }

        updateData.imageUrl = uploadResult.url;
        updateData.imagePath = uploadResult.path;
      }
    }

    const item = await prisma.portfolio.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: 'Portfolio item updated', item });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update portfolio item' });
  }
});

// DELETE /api/portfolio/:id - Delete portfolio item
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    // Verify ownership
    const existing = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Portfolio item not found' });
      return;
    }

    // Delete image from storage
    if (existing.imagePath) {
      await deletePortfolioImage(existing.imagePath);
    }

    // Delete from database
    await prisma.portfolio.delete({
      where: { id },
    });

    res.json({ message: 'Portfolio item deleted' });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete portfolio item' });
  }
});

// PATCH /api/portfolio/:id/featured - Toggle featured status
router.patch('/:id/featured', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    // Verify ownership
    const existing = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Portfolio item not found' });
      return;
    }

    // Toggle featured status
    const item = await prisma.portfolio.update({
      where: { id },
      data: { featured: !existing.featured },
    });

    res.json({ 
      message: item.featured ? 'Item marked as featured' : 'Item unmarked as featured',
      item 
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update featured status' });
  }
});

// PATCH /api/portfolio/reorder - Reorder portfolio items
router.patch('/reorder', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { items } = req.body; // Array of { id, order }

    if (!items || !Array.isArray(items)) {
      res.status(400).json({ error: 'Bad Request', message: 'Items array is required' });
      return;
    }

    // Update order for each item
    const updates = items.map((item: { id: string; order: number }) =>
      prisma.portfolio.updateMany({
        where: { id: item.id, userId },
        data: { order: item.order },
      })
    );

    await Promise.all(updates);

    res.json({ message: 'Portfolio reordered successfully' });
  } catch (error) {
    console.error('Reorder portfolio error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to reorder portfolio' });
  }
});

export default router;
