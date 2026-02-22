import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

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

// GET /api/settings - Get current user settings
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    res.json({ 
      settings: user,
      availableCurrencies: AVAILABLE_CURRENCIES
    });
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

    // Validate currency settings
    const validationResult = currencySettingsSchema.safeParse(body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Validation Error', 
        message: validationResult.error.issues[0].message 
      });
      return;
    }

    const updateData: any = {};

    // Handle profile updates
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.studioName !== undefined) updateData.studioName = body.studioName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;

    // Handle currency settings
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.currencySymbol !== undefined) updateData.currencySymbol = body.currencySymbol;
    if (body.currencyPosition !== undefined) updateData.currencyPosition = body.currencyPosition;
    if (body.numberFormat !== undefined) updateData.numberFormat = body.numberFormat;
    if (body.defaultTaxRate !== undefined) updateData.defaultTaxRate = body.defaultTaxRate;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
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
      }
    });

    res.json({ 
      message: 'Settings updated successfully',
      settings: user 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update settings' });
  }
});

// GET /api/settings/currencies - Get available currencies
router.get('/currencies', async (_req: Request, res: Response): Promise<void> => {
  res.json({ currencies: AVAILABLE_CURRENCIES });
});

export default router;
