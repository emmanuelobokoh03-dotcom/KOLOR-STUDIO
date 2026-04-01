import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies?.auth_token;
    
    if (!token) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'Server Error', message: 'JWT secret not configured' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string; tokenVersion?: number };
    req.userId = decoded.userId;

    // Verify token version (invalidates sessions after password change)
    if (decoded.tokenVersion !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { tokenVersion: true },
      });
      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        res.status(401).json({ error: 'Unauthorized', message: 'Session expired. Please log in again.' });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};
