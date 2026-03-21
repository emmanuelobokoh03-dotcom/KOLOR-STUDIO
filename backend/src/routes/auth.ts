import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email';
import { seedTemplatesForUser } from '../seeds/systemTemplates';
import { createDemoProject } from '../scripts/createDemoProject';
import { seedDefaultSequences } from '../scripts/seedSequences';
import prisma from '../lib/prisma';

const router = Router();

// In-memory rate limiting for forgot-password requests
const forgotPasswordAttempts: Map<string, { count: number; resetTime: number }> = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms
const MAX_ATTEMPTS = 3;

// POST /api/auth/signup - Create new user account
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, studioName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, first name, and last name are required'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Please enter a valid email address'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists'
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        studioName: studioName || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        studioName: true,
        role: true,
        createdAt: true,
      }
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationSentAt: new Date()
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        verificationToken,
      });
    } catch (e) {
      console.error('Failed to send verification email on signup:', e);
    }

    res.status(201).json({
      message: 'Account created successfully',
      user
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to create account'
    });
  }
});

// POST /api/auth/onboarding - Set industry and seed workflow templates
router.post('/onboarding', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { primaryIndustry } = req.body;

    const validIndustries = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'GRAPHIC_DESIGN', 'WEB_DESIGN', 'ILLUSTRATION', 'FINE_ART', 'SCULPTURE', 'BRANDING', 'CONTENT_CREATION', 'OTHER'];

    if (!primaryIndustry || !validIndustries.includes(primaryIndustry)) {
      res.status(400).json({ error: 'Validation Error', message: 'Valid primaryIndustry is required' });
      return;
    }

    // Update user's primary industry
    const user = await prisma.user.update({
      where: { id: userId },
      data: { primaryIndustry: primaryIndustry as any },
      select: { id: true, firstName: true, studioName: true, primaryIndustry: true }
    });

    // Seed workflow templates for this industry
    const templates = await seedTemplatesForUser(userId, primaryIndustry);

    // Create industry-specific demo project and email sequences (non-blocking)
    createDemoProject(userId, primaryIndustry as any).catch(e => console.error('Demo project creation failed:', e));
    seedDefaultSequences(userId, primaryIndustry as any).catch(e => console.error('Sequence seed failed:', e));

    res.json({
      message: 'Onboarding complete',
      user,
      templates: templates.map(t => ({ id: t.id, name: t.name, stageCount: t.stages?.length || 0 })),
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to complete onboarding' });
  }
});

// POST /api/auth/login - Authenticate user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        error: 'Server Error',
        message: 'JWT secret not configured'
      });
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Track first login (lastLoginAt is null on first ever login)
    const isFirstLogin = !user.lastLoginAt;

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studioName: user.studioName,
        role: user.role,
        primaryIndustry: user.primaryIndustry,
        isFirstLogin,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to authenticate'
    });
  }
});

// GET /api/auth/me - Get current user info (protected route)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        studioName: true,
        role: true,
        phone: true,
        website: true,
        logo: true,
        timezone: true,
        currency: true,
        currencySymbol: true,
        currencyPosition: true,
        numberFormat: true,
        defaultTaxRate: true,
        primaryIndustry: true,
        brandPrimaryColor: true,
        brandAccentColor: true,
        brandLogoUrl: true,
        brandFontFamily: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get user info'
    });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Email is required'
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting check
    const now = Date.now();
    const attemptRecord = forgotPasswordAttempts.get(normalizedEmail);
    
    if (attemptRecord) {
      if (now < attemptRecord.resetTime) {
        if (attemptRecord.count >= MAX_ATTEMPTS) {
          res.status(429).json({
            error: 'Too Many Requests',
            message: 'Too many password reset requests. Please try again in an hour.'
          });
          return;
        }
        attemptRecord.count++;
      } else {
        // Reset the window
        forgotPasswordAttempts.set(normalizedEmail, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      forgotPasswordAttempts.set(normalizedEmail, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Always return success to prevent email enumeration attacks
    // But only actually send the email if the user exists
    if (user) {
      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store hashed token in database
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: resetExpires
        }
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail({
          email: user.email,
          firstName: user.firstName,
          resetToken: resetToken
        });

      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request, but log the error
      }
    }

    // Always return success message (prevent email enumeration)
    res.json({
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to process password reset request'
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    // Validate required fields
    if (!token || !password) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Token and new password are required'
      });
      return;
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    // Reject common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty123', 'password123', 'abcdefgh', '11111111', 'password1'];
    if (weakPasswords.includes(password.toLowerCase())) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Password is too common. Please choose a stronger password.'
      });
      return;
    }

    // Hash the provided token to match against stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid, non-expired token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({
        error: 'Invalid Token',
        message: 'Password reset token is invalid or has expired'
      });
      return;
    }

    // Check if new password matches current password
    const sameAsCurrent = await bcrypt.compare(password, user.password);
    if (sameAsCurrent) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'New password cannot be the same as your current password'
      });
      return;
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset token (single-use)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    // Audit log
    const { logAudit, AUDIT_ACTIONS } = await import('../services/auditService');
    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.PASSWORD_RESET,
      entity: 'User',
      entityId: user.id,
      metadata: { resetAt: new Date().toISOString() },
      req,
    });



    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to reset password'
    });
  }
});

// POST /api/auth/send-verification - Send/resend verification email
router.post('/send-verification', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    // Rate limit: don't send more than once per 60 seconds
    if (user.verificationSentAt && Date.now() - user.verificationSentAt.getTime() < 60000) {
      res.status(429).json({ error: 'Please wait before requesting another verification email' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationSentAt: new Date()
      }
    });

    try {
      await sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        verificationToken: token,
      });
    } catch (e) {
      console.error('Failed to send verification email:', e);
    }

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to send verification email' });
  }
});

// GET /api/auth/verify-email/:token - Verify email (public)
router.get('/verify-email/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;

    if (!token || token.length < 10) {
      console.error('[EMAIL VERIFY] Invalid token format:', token);
      res.status(400).json({ error: 'Invalid verification token', message: 'The verification link is malformed.' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: String(token) }
    });

    if (!user) {
      console.error('[EMAIL VERIFY] No user found for token:', String(token).substring(0, 8) + '...');
      res.status(404).json({ error: 'Token not found', message: 'Verification link is expired or already used. Please request a new verification email from your dashboard.' });
      return;
    }

    if (user.emailVerified) {
      console.log('[EMAIL VERIFY] User already verified:', user.email);
      res.json({ message: 'Your email is already verified. You can log in.' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null
      }
    });

    console.log('[EMAIL VERIFY] Success for user:', user.email);
    res.json({ message: 'Email verified successfully! You can now use all features.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Verification failed. Please try again or request a new verification email.' });
  }
});

export default router;
