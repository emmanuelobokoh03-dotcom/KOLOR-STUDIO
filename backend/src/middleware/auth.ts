import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // 1. Try HTTP-only cookie first
    let token = req.cookies?.auth_token;

    // 2. Fallback to Authorization header (backward compat & API clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'Server Error', message: 'JWT secret not configured' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};
