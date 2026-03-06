import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const router = Router();
import prisma from '../lib/prisma';

// Multer for logo upload (memory storage, 2MB limit)
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPEG, SVG and WebP images are allowed'));
  },
});

// Supabase client helper
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Validation schema for currency settings
const currencySettingsSchema = z.object({
  currency: z.string().min(2).max(5).optional(),
  currencySymbol: z.string().min(1).max(5).optional(),
  currencyPosition: z.enum(['BEFORE', 'AFTER']).optional(),
  numberFormat: z.enum(['1,000.00', '1.000,00', '1 000,00']).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
});

// Available currencies
const AVAILABLE_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

const SETTINGS_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  studioName: true,
  phone: true,
  website: true,
  timezone: true,
  currency: true,
  currencySymbol: true,
  currencyPosition: true,
  numberFormat: true,
  defaultTaxRate: true,
  brandPrimaryColor: true,
  brandAccentColor: true,
  brandLogoUrl: true,
  brandFontFamily: true,
};

// GET /api/settings - Get current user settings
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: SETTINGS_SELECT,
    });

    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    res.json({ settings: user, availableCurrencies: AVAILABLE_CURRENCIES });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get settings' });
  }
});

// PATCH /api/settings - Update user settings
router.patch('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const body = req.body;

    const validationResult = currencySettingsSchema.safeParse(body);
    if (!validationResult.success) {
      res.status(400).json({ error: 'Validation Error', message: validationResult.error.issues[0].message });
      return;
    }

    const updateData: any = {};
    const profileFields = ['firstName', 'lastName', 'studioName', 'phone', 'website', 'timezone'];
    const currencyFields = ['currency', 'currencySymbol', 'currencyPosition', 'numberFormat', 'defaultTaxRate'];

    [...profileFields, ...currencyFields].forEach(field => {
      if (body[field] !== undefined) updateData[field] = body[field];
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: SETTINGS_SELECT,
    });

    res.json({ message: 'Settings updated successfully', settings: user });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update settings' });
  }
});

// GET /api/settings/currencies - Get available currencies
router.get('/currencies', async (_req: Request, res: Response): Promise<void> => {
  res.json({ currencies: AVAILABLE_CURRENCIES });
});

// ─── Brand Settings Endpoints ──────────────────────────────

// GET /api/settings/brand - Get brand settings
router.get('/brand', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        brandPrimaryColor: true,
        brandAccentColor: true,
        brandLogoUrl: true,
        brandFontFamily: true,
      },
    });

    res.json({
      brand: {
        primaryColor: user?.brandPrimaryColor || '#A855F7',
        accentColor: user?.brandAccentColor || '#EC4899',
        logoUrl: user?.brandLogoUrl || null,
        fontFamily: user?.brandFontFamily || 'Inter',
      },
    });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get brand settings' });
  }
});

// PATCH /api/settings/brand - Update brand settings
router.patch('/brand', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { primaryColor, accentColor, fontFamily } = req.body;
    const updateData: any = {};

    if (primaryColor) updateData.brandPrimaryColor = primaryColor;
    if (accentColor) updateData.brandAccentColor = accentColor;
    if (fontFamily) updateData.brandFontFamily = fontFamily;

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: updateData,
      select: {
        brandPrimaryColor: true,
        brandAccentColor: true,
        brandLogoUrl: true,
        brandFontFamily: true,
      },
    });

    res.json({
      message: 'Brand settings updated',
      brand: {
        primaryColor: user.brandPrimaryColor,
        accentColor: user.brandAccentColor,
        logoUrl: user.brandLogoUrl,
        fontFamily: user.brandFontFamily,
      },
    });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update brand settings' });
  }
});

// POST /api/settings/brand/logo - Upload brand logo
router.post('/brand/logo', authMiddleware, logoUpload.single('logo'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      res.status(500).json({ error: 'Storage not configured' });
      return;
    }

    const ext = req.file.mimetype.split('/')[1] === 'svg+xml' ? 'svg' : req.file.mimetype.split('/')[1];
    const fileName = `${req.userId}-logo-${Date.now()}.${ext}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === 'brand-logos')) {
      await supabase.storage.createBucket('brand-logos', { public: true, fileSizeLimit: 2097152 });
    }

    const { data, error } = await supabase.storage
      .from('brand-logos')
      .upload(`logos/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ error: 'Failed to upload logo' });
      return;
    }

    const logoUrl = supabase.storage.from('brand-logos').getPublicUrl(data.path).data.publicUrl;

    await prisma.user.update({
      where: { id: req.userId! },
      data: { brandLogoUrl: logoUrl },
    });

    res.json({ message: 'Logo uploaded', logoUrl });
  } catch (error) {
    console.error('Logo upload exception:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to upload logo' });
  }
});

// DELETE /api/settings/brand/logo - Remove brand logo
router.delete('/brand/logo', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { brandLogoUrl: null },
    });

    res.json({ message: 'Logo removed' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to remove logo' });
  }
});

export default router;
