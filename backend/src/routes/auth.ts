import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/email';

const router = Router();
const prisma = new PrismaClient();

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
        console.log(`Password reset email sent to ${user.email}`);
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

    console.log(`Password successfully reset for ${user.email}`);

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

export default router;
